// @ts-check
import 'server-only';
import { configuration, stripeClient, webhookSecret, LuckyError } from './config.mjs';
import { withDatabase } from './database.mjs';
import { bindSession, reserveOrder, settleOrder, transaction } from './store.mjs';
import { shippingCountries } from './shipping-countries.mjs';
import { luckyProduct } from '../../content/luckybird-product.mjs';

/** @typedef {ReturnType<typeof configuration>} Config */
/** @typedef {import('./store.mjs').Database} Database */
/** @typedef {ReturnType<typeof stripeClient>} StripeClient */

/** @param {Config} config @param {StripeClient} stripe @param {Database} db */
export async function verifyExistingProduct(config, stripe, db) {
  if (!config.priceId || !config.productId) throw new LuckyError();
  const price = await stripe.prices.retrieve(config.priceId, { expand: ['product'] });
  const product = price.product;
  if (typeof product === 'string' || product.deleted || product.id !== config.productId || !product.active || !price.active ||
      price.type !== 'one_time' || price.unit_amount !== luckyProduct.amountInCents || price.currency !== luckyProduct.currency ||
      price.livemode !== (config.mode === 'live') || product.livemode !== price.livemode) throw new LuckyError('PRODUCT_MISMATCH');
  // Reuse the existing pipeline read-only. Stripe itself is authoritative at checkout.
  const schema = process.env.LUCKY_STRIPE_SCHEMA || 'stripe';
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(schema)) throw new LuckyError();
  const products = await db.query(`SELECT id, livemode FROM "${schema}".products WHERE id=$1`, [config.productId]);
  const prices = await db.query(`SELECT id, livemode, product FROM "${schema}".prices WHERE id=$1`, [config.priceId]);
  if (products.rows[0]?.livemode !== price.livemode || prices.rows[0]?.livemode !== price.livemode || prices.rows[0]?.product !== product.id) throw new LuckyError('PIPELINE_MISMATCH');
  return price;
}

/** @param {Config} config @param {string} id @param {number} expiresAt */
export function checkoutParameters(config, id, expiresAt) {
  if (!config.priceId) throw new LuckyError();
  return {
    mode: /** @type {'payment'} */ ('payment'),
    adaptive_pricing: { enabled: false },
    payment_method_types: /** @type {['card']} */ (['card']),
    line_items: [{ price: config.priceId, quantity: 1 }],
    automatic_tax: { enabled: true },
    billing_address_collection: /** @type {'required'} */ ('required'),
    shipping_address_collection: { allowed_countries: shippingCountries },
    shipping_options: [{ shipping_rate_data: { type: /** @type {'fixed_amount'} */ ('fixed_amount'), display_name: 'Free international shipping', fixed_amount: { amount: 0, currency: 'usd' } } }],
    expires_at: expiresAt,
    client_reference_id: id,
    metadata: { app: 'luckybird', order_id: id, mode: config.mode },
    payment_intent_data: { metadata: { app: 'luckybird', order_id: id, mode: config.mode } },
    success_url: `${config.origin}/luckybird?checkout=return&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.origin}/luckybird?checkout=canceled`,
  };
}

/** @param {Config} config @param {StripeClient} stripe @param {Database} db @param {string} id */
export async function createLuckyCheckout(config, stripe, db, id) {
  if (!config.productId) throw new LuckyError();
  const price = await verifyExistingProduct(config, stripe, db);
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const parameters = checkoutParameters(config, id, expiresAt);
  const order = await reserveOrder(db, { id, productId: config.productId, priceId: price.id, amount: luckyProduct.amountInCents, currency: price.currency, parameters, expiresAt });
  if (order.product_id !== config.productId || order.price_id !== config.priceId || !['RESERVED', 'OPEN'].includes(order.status)) throw new LuckyError('ORDER_CLOSED');
  // Reuse persisted parameters and key after ambiguous network failures.
  const session = order.stripe_session_id
    ? await stripe.checkout.sessions.retrieve(order.stripe_session_id)
    : await stripe.checkout.sessions.create(order.session_parameters, { idempotencyKey: `luckybird/${config.mode}/${order.id}` });
  if (session.livemode !== (config.mode === 'live') || session.metadata?.order_id !== order.id || session.status !== 'open' || !session.url) throw new LuckyError('ORDER_CLOSED');
  const url = new URL(session.url);
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new LuckyError();
  await bindSession(db, order.id, session);
  return { url: session.url };
}

/** @param {Config} config @param {StripeClient} stripe @param {Database} db @param {string} sessionId @param {string} eventId @param {string} eventType */
export async function processSession(config, stripe, db, sessionId, eventId, eventType) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.livemode !== (config.mode === 'live')) throw new LuckyError('MODE_MISMATCH');
  if (session.metadata?.app !== 'luckybird') return;
  const id = session.metadata.order_id;
  if (!id || session.client_reference_id !== id || session.metadata.mode !== config.mode) throw new LuckyError();
  const result = await db.query('SELECT * FROM luckybird.orders WHERE id=$1', [id]);
  const order = result.rows[0];
  if (!order || order.product_id !== config.productId || (order.stripe_session_id && order.stripe_session_id !== session.id)) throw new LuckyError();
  const lines = await stripe.checkout.sessions.listLineItems(session.id, { limit: 2 });
  if (lines.has_more || lines.data.length !== 1 || lines.data[0].price?.id !== order.price_id || lines.data[0].quantity !== 1 || session.currency !== order.currency || session.amount_subtotal !== order.amount_in_cents) throw new LuckyError('AMOUNT_MISMATCH');
  if (session.status === 'complete' && session.payment_status === 'paid') {
    // Only a verified Stripe result can commit paid stock. Never the return URL.
    if (session.automatic_tax.status !== 'complete' || !session.collected_information?.shipping_details || session.total_details?.amount_shipping !== 0) throw new LuckyError('PAYMENT_REVIEW');
    await settleOrder(db, { eventId, eventType, orderId: id, sessionId: session.id, status: 'PAID', email: session.customer_details?.email,
      shipping: session.collected_information.shipping_details, total: session.amount_total, tax: session.total_details.amount_tax,
      shippingAmount: session.total_details.amount_shipping, paymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id });
  } else if (session.status === 'expired') {
    await settleOrder(db, { eventId, eventType, orderId: id, sessionId: session.id, status: 'EXPIRED' });
  } else if (eventType === 'checkout.session.async_payment_failed' && session.status === 'complete' && session.payment_status === 'unpaid') {
    await settleOrder(db, { eventId, eventType, orderId: id, sessionId: session.id, status: 'FAILED' });
  }
}

/** @param {Config} config @param {StripeClient} stripe @param {Database} db @param {import('stripe').default.Event} event */
export async function processLuckyEvent(config, stripe, db, event) {
  if (event.livemode !== (config.mode === 'live')) throw new LuckyError('MODE_MISMATCH');
  if (['checkout.session.completed', 'checkout.session.expired', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed'].includes(event.type)) {
    const session = /** @type {import('stripe').default.Checkout.Session} */ (event.data.object);
    return processSession(config, stripe, db, session.id, event.id, event.type);
  }
  if (event.type === 'charge.refunded') {
    const charge = await stripe.charges.retrieve(event.data.object.id);
    if (charge.livemode !== (config.mode === 'live')) throw new LuckyError('MODE_MISMATCH');
    const intent = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
    if (!intent) return;
    let belongsToLucky = charge.metadata.app === 'luckybird';
    if (!belongsToLucky) {
      const payment = await stripe.paymentIntents.retrieve(intent);
      if (payment.livemode !== (config.mode === 'live')) throw new LuckyError('MODE_MISMATCH');
      belongsToLucky = payment.metadata.app === 'luckybird';
    }
    await transaction(db, async () => {
      const result = await db.query('SELECT * FROM luckybird.orders WHERE stripe_payment_intent_id=$1 FOR UPDATE', [intent]);
      const order = result.rows[0];
      if (!order) {
        if (belongsToLucky) throw new LuckyError('PAYMENT_REVIEW');
        return;
      }
      if (charge.amount !== order.total_in_cents || charge.currency !== order.currency) throw new LuckyError('AMOUNT_MISMATCH');
      await db.query("UPDATE luckybird.orders SET status=CASE WHEN $2 THEN 'REFUNDED' ELSE status END, refunded_in_cents=$3, updated_at=now() WHERE id=$1 AND status IN ('PAID','REFUNDED')", [order.id, charge.refunded, charge.amount_refunded]);
      // Refunded merchandise is not automatically available for sale again.
      await db.query('INSERT INTO luckybird.processed_events(id,order_id,event_type) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING', [event.id, order.id, event.type]);
    });
  }
}

export async function getLuckyPageState() {
  const fallback = { checkoutReady: false, communityReady: false, posts: /** @type {{id:string,display_name:string,message:string,photo_path:string|null}[]} */ ([]) };
  try {
    const config = configuration();
    return await withDatabase(config, async db => {
      const posts = await db.query("SELECT id, display_name, message, photo_path FROM luckybird.community_posts WHERE status='APPROVED' AND consent=true ORDER BY created_at DESC LIMIT 30");
      let checkoutReady = false;
      try {
        webhookSecret(config);
        if (!config.spamSecret || config.spamSecret.length < 32) throw new LuckyError();
        await verifyExistingProduct(config, stripeClient(config), db);
        const inventory = await db.query('SELECT on_hand-reserved AS available FROM luckybird.inventory WHERE product_id=$1', [config.productId]);
        checkoutReady = Number(inventory.rows[0]?.available) > 0;
      } catch { /* Customer-facing availability is truthful and contains no upstream errors. */ }
      return { checkoutReady, communityReady: Boolean(config.spamSecret && config.spamSecret.length >= 32), posts: posts.rows };
    });
  } catch { return fallback; }
}
