// @ts-check
import 'server-only';
import { LuckyError } from './config.mjs';

/** @typedef {{query: (text: string, values?: unknown[]) => Promise<{rows: any[], rowCount?: number | null}>}} Database */
/** @template T @param {Database} db @param {() => Promise<T>} action */
export async function transaction(db, action) {
  await db.query('BEGIN');
  try { const result = await action(); await db.query('COMMIT'); return result; }
  catch (error) { await db.query('ROLLBACK').catch(() => {}); throw error; }
}
/** @param {Database} db @param {string} key @param {number} limit */
export async function rateLimit(db, key, limit) {
  // Cross-instance atomic limit. No raw IP addresses are retained.
  const result = await db.query(`INSERT INTO luckybird.rate_limits(key, window_start, attempts) VALUES ($1, date_trunc('hour', now()), 1)
    ON CONFLICT(key) DO UPDATE SET attempts = CASE WHEN luckybird.rate_limits.window_start = date_trunc('hour', now()) THEN luckybird.rate_limits.attempts + 1 ELSE 1 END, window_start = date_trunc('hour', now()) RETURNING attempts`, [key]);
  if (result.rows[0].attempts > limit) throw new LuckyError('RATE_LIMIT');
}
/** @param {Database} db @param {{id: string, productId: string, priceId: string, amount: number, currency: string, parameters: object, expiresAt: number}} input */
export async function reserveOrder(db, input) {
  return transaction(db, async () => {
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [input.id]);
    const existing = await db.query('SELECT * FROM luckybird.orders WHERE id = $1 FOR UPDATE', [input.id]);
    if (existing.rows[0]) return existing.rows[0];
    const inventory = await db.query(`UPDATE luckybird.inventory SET reserved = reserved + 1 WHERE product_id = $1 AND on_hand > reserved RETURNING product_id`, [input.productId]);
    if (!inventory.rows.length) throw new LuckyError('SOLD_OUT');
    const order = await db.query(`INSERT INTO luckybird.orders(id, product_id, price_id, amount_in_cents, currency, session_parameters, checkout_expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [input.id, input.productId, input.priceId, input.amount, input.currency, JSON.stringify(input.parameters), input.expiresAt]);
    return order.rows[0];
  });
}
/** @param {Database} db @param {string} orderId @param {{id:string, url:string|null}} session */
export async function bindSession(db, orderId, session) {
  await db.query(`UPDATE luckybird.orders SET stripe_session_id = $2, stripe_checkout_url = $3,
    status = CASE WHEN status = 'RESERVED' THEN 'OPEN' ELSE status END, updated_at = now()
    WHERE id = $1 AND (stripe_session_id IS NULL OR stripe_session_id = $2)`, [orderId, session.id, session.url]);
}
/** @param {Database} db @param {{eventId: string, eventType:string, orderId:string, sessionId:string, status:'PAID'|'EXPIRED'|'FAILED', email?:string|null, shipping?:object|null, total?:number|null, tax?:number|null, shippingAmount?:number|null, paymentIntent?:string|null}} input */
export async function settleOrder(db, input) {
  return transaction(db, async () => {
    const result = await db.query('SELECT * FROM luckybird.orders WHERE id = $1 FOR UPDATE', [input.orderId]);
    const order = result.rows[0];
    if (!order || (order.stripe_session_id && order.stripe_session_id !== input.sessionId)) throw new LuckyError();
    if ((await db.query('SELECT id FROM luckybird.processed_events WHERE id = $1', [input.eventId])).rows.length) return;
    const pending = ['RESERVED', 'OPEN'].includes(order.status);
    if (pending) {
      await db.query(`UPDATE luckybird.inventory SET reserved = reserved - 1, on_hand = on_hand - $2 WHERE product_id = $1`, [order.product_id, input.status === 'PAID' ? 1 : 0]);
      await db.query(`UPDATE luckybird.orders SET status=$2, stripe_session_id=$3, customer_email=$4, shipping_details=$5,
        total_in_cents=$6, tax_in_cents=$7, shipping_in_cents=$8, stripe_payment_intent_id=$9, updated_at=now() WHERE id=$1`,
      [order.id, input.status, input.sessionId, input.email ?? null, input.shipping ? JSON.stringify(input.shipping) : null, input.total ?? null, input.tax ?? null, input.shippingAmount ?? null, input.paymentIntent ?? null]);
    } else if (input.status === 'PAID' && !['PAID', 'REFUNDED'].includes(order.status)) {
      // An inconsistent late payment requires review; never silently sell released stock.
      throw new LuckyError('PAYMENT_REVIEW');
    }
    await db.query('INSERT INTO luckybird.processed_events(id, order_id, event_type) VALUES ($1,$2,$3)', [input.eventId, order.id, input.eventType]);
  });
}
/** @param {Database} db @param {{id:string,name:string,email:string,message:string,photoUrl:string,consent:boolean}} input */
export async function submitCommunity(db, input) {
  await db.query(`INSERT INTO luckybird.community_posts(id,display_name,email,message,submitted_photo_url,consent)
    VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING`, [input.id, input.name, input.email, input.message, input.photoUrl || null, input.consent]);
}
