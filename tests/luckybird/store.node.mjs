import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { reserveOrder, settleOrder, rateLimit, submitCommunity, transaction } from '../../src/lib/luckybird/store.mjs';
import { createLuckyCheckout, verifyExistingProduct, processLuckyEvent } from '../../src/lib/luckybird/service.mjs';

const sql = await readFile(new URL('../../db/luckybird/001.sql', import.meta.url), 'utf8');
const id = '7e728f64-6c71-4a68-b457-18d1fd2f48b9';
const secondId = '7e728f64-6c71-4a68-b457-18d1fd2f48b8';
const config = { mode: 'test', productId: 'prod_fixture', priceId: 'price_fixture', origin: 'https://www.emiliosierra.com' };
const baseOrder = { id, productId: config.productId, priceId: config.priceId, amount: 1000, currency: 'usd', parameters: { fixture: true }, expiresAt: 2000000000 };
async function withDatabase(fn, stock = 1) {
  const db = new PGlite();
  try {
    await db.exec(sql);
    await db.query("INSERT INTO luckybird.environment(mode) VALUES ('test')");
    await db.query('INSERT INTO luckybird.inventory(product_id,on_hand) VALUES ($1,$2)', [config.productId, stock]);
    await fn(db);
  } finally { await db.close(); }
}
function providerDatabase(db) {
  return { query: async (query, values) => {
    if (query.includes('"stripe".products')) return { rows: [{ id: config.productId, livemode: false }] };
    if (query.includes('"stripe".prices')) return { rows: [{ id: config.priceId, livemode: false, product: config.productId }] };
    return db.query(query, values);
  } };
}
function fakeStripe() {
  const product = { id: config.productId, active: true, livemode: false };
  const price = { id: config.priceId, product, active: true, type: 'one_time', unit_amount: 1000, currency: 'usd', livemode: false };
  const session = { id: 'cs_test_unit_fixture', livemode: false, status: 'open', url: 'https://checkout.stripe.com/c/pay/cs_test_unit_fixture', metadata: { app: 'luckybird', order_id: id, mode: 'test' }, client_reference_id: id,
    payment_status: 'unpaid', currency: 'usd', amount_subtotal: 1000, amount_total: 1100, automatic_tax: { status: 'complete' },
    total_details: { amount_tax: 100, amount_shipping: 0 }, collected_information: { shipping_details: { name: 'Test guest', address: { country: 'US' } } },
    customer_details: { email: 'unit@example.com' }, payment_intent: 'pi_unit_fixture' };
  const calls = [];
  const charge = { id: 'ch_fixture', payment_intent: 'pi_unit_fixture', livemode: false, amount: 1100, amount_refunded: 1100, refunded: true, currency: 'usd', metadata: { app: 'luckybird' } };
  return { price, product, session, calls, charge,
    prices: { retrieve: async () => price },
    charges: { retrieve: async () => charge },
    paymentIntents: { retrieve: async () => ({ livemode: false, metadata: { app: 'luckybird' } }) },
    checkout: { sessions: { create: async (parameters, options) => { calls.push({ parameters, options }); return session; }, retrieve: async () => session,
      listLineItems: async () => ({ has_more: false, data: [{ price, quantity: 1 }] }) } },
  };
}
test('schema and stock guard prevent negative inventory, duplicate reservations and a second sale of stock one', async () => withDatabase(async db => {
  await reserveOrder(db, baseOrder);
  await reserveOrder(db, baseOrder);
  await assert.rejects(() => reserveOrder(db, { ...baseOrder, id: secondId }), /SOLD_OUT/);
  assert.equal((await db.query('SELECT reserved FROM luckybird.inventory')).rows[0].reserved, 1);
  await assert.rejects(() => db.query('UPDATE luckybird.inventory SET on_hand = -1'));
}));
test('verified payment and repeated notifications consume one unit only', async () => withDatabase(async db => {
  await reserveOrder(db, baseOrder);
  const payment = { orderId: id, sessionId: 'cs_fixture', eventId: 'evt_fixture', eventType: 'checkout.session.completed', status: 'PAID', total: 1100 };
  await settleOrder(db, payment); await settleOrder(db, payment);
  await settleOrder(db, { ...payment, eventId: 'evt_second' });
  assert.deepEqual((await db.query('SELECT on_hand,reserved FROM luckybird.inventory')).rows[0], { on_hand: 0, reserved: 0 });
  assert.equal((await db.query('SELECT status FROM luckybird.orders')).rows[0].status, 'PAID');
}));
test('verified expiration releases a reservation without consuming stock and cannot resurrect a sold item', async () => withDatabase(async db => {
  await reserveOrder(db, baseOrder);
  const expired = { orderId: id, sessionId: 'cs_fixture', eventId: 'evt_expired', eventType: 'checkout.session.expired', status: 'EXPIRED' };
  await settleOrder(db, expired); await settleOrder(db, expired);
  assert.deepEqual((await db.query('SELECT on_hand,reserved FROM luckybird.inventory')).rows[0], { on_hand: 1, reserved: 0 });
  await assert.rejects(() => settleOrder(db, { ...expired, status: 'PAID', eventId: 'evt_inconsistent' }), /PAYMENT_REVIEW/);
  assert.equal((await db.query('SELECT count(*)::integer AS n FROM luckybird.processed_events')).rows[0].n, 1);
}));
test('a failed database transaction rolls back both order and inventory changes', async () => withDatabase(async db => {
  await assert.rejects(() => reserveOrder(db, { ...baseOrder, amount: -1 }));
  assert.equal((await db.query('SELECT reserved FROM luckybird.inventory')).rows[0].reserved, 0);
  assert.equal((await db.query('SELECT count(*)::integer AS n FROM luckybird.orders')).rows[0].n, 0);
  await assert.rejects(() => transaction(db, async () => { await db.query('UPDATE luckybird.inventory SET reserved=1'); throw new Error('fixture'); }));
  assert.equal((await db.query('SELECT reserved FROM luckybird.inventory')).rows[0].reserved, 0);
}));
test('existing product and pipeline modes/prices are verified without creating Stripe products', async () => withDatabase(async db => {
  const stripe = fakeStripe(), adapter = providerDatabase(db);
  await verifyExistingProduct(config, stripe, adapter);
  stripe.price.unit_amount = 1;
  await assert.rejects(() => verifyExistingProduct(config, stripe, adapter), /PRODUCT_MISMATCH/);
  stripe.price.unit_amount = 1000; stripe.price.livemode = true;
  await assert.rejects(() => verifyExistingProduct(config, stripe, adapter), /PRODUCT_MISMATCH/);
  stripe.price.livemode = false;
  await assert.rejects(() => verifyExistingProduct(config, stripe, { query: async () => ({ rows: [{ livemode: true }] }) }), /PIPELINE_MISMATCH/);
  assert.equal(stripe.calls.length, 0);
}));
test('checkout retries reuse one order/session with the server price, free shipping and tax calculation', async () => withDatabase(async db => {
  const stripe = fakeStripe(), adapter = providerDatabase(db);
  const result = await createLuckyCheckout(config, stripe, adapter, id);
  assert.equal(result.url, stripe.session.url);
  await createLuckyCheckout(config, stripe, adapter, id);
  assert.equal(stripe.calls.length, 1);
  assert.equal(stripe.calls[0].parameters.line_items[0].price, config.priceId);
  assert.equal(stripe.calls[0].parameters.automatic_tax.enabled, true);
  assert.equal(stripe.calls[0].parameters.shipping_options[0].shipping_rate_data.fixed_amount.amount, 0);
  assert.equal((await db.query('SELECT reserved FROM luckybird.inventory')).rows[0].reserved, 1);
}));
test('ambiguous Stripe creation preserves stock and retries with identical idempotency key and parameters', async () => withDatabase(async db => {
  const stripe = fakeStripe(), adapter = providerDatabase(db);
  let attempt = 0;
  stripe.checkout.sessions.create = async (parameters, options) => {
    stripe.calls.push({ parameters, options });
    if (++attempt === 1) throw new Error('Network fixture');
    return stripe.session;
  };
  await assert.rejects(() => createLuckyCheckout(config, stripe, adapter, id));
  assert.equal((await db.query('SELECT reserved FROM luckybird.inventory')).rows[0].reserved, 1);
  await createLuckyCheckout(config, stripe, adapter, id);
  assert.deepEqual(stripe.calls[0], stripe.calls[1]);
  assert.equal((await db.query('SELECT count(*)::integer AS n FROM luckybird.orders')).rows[0].n, 1);
}));
test('fresh Stripe payment confirmation finalizes an order; refunds are recorded without restocking', async () => withDatabase(async db => {
  const stripe = fakeStripe(), adapter = providerDatabase(db);
  await createLuckyCheckout(config, stripe, adapter, id);
  stripe.session.status = 'complete'; stripe.session.payment_status = 'paid';
  const event = { id: 'evt_paid', type: 'checkout.session.completed', livemode: false, data: { object: { id: stripe.session.id } } };
  await processLuckyEvent(config, stripe, adapter, event); await processLuckyEvent(config, stripe, adapter, event);
  assert.equal((await db.query('SELECT status FROM luckybird.orders')).rows[0].status, 'PAID');
  assert.equal((await db.query('SELECT tax_in_cents FROM luckybird.orders')).rows[0].tax_in_cents, 100);
  await processLuckyEvent(config, stripe, adapter, { id: 'evt_refund', type: 'charge.refunded', livemode: false, data: { object: { id: stripe.charge.id } } });
  assert.equal((await db.query('SELECT status FROM luckybird.orders')).rows[0].status, 'REFUNDED');
  assert.equal((await db.query('SELECT refunded_in_cents FROM luckybird.orders')).rows[0].refunded_in_cents, 1100);
  assert.equal((await db.query('SELECT on_hand FROM luckybird.inventory')).rows[0].on_hand, 0);
}));
test('canceled/declined checkout is never marked paid; verified expiration later releases its stock', async () => withDatabase(async db => {
  const stripe = fakeStripe(), adapter = providerDatabase(db);
  await createLuckyCheckout(config, stripe, adapter, id);
  const event = { id: 'evt_unpaid', type: 'checkout.session.completed', livemode: false, data: { object: { id: stripe.session.id } } };
  await processLuckyEvent(config, stripe, adapter, event);
  assert.equal((await db.query('SELECT status FROM luckybird.orders')).rows[0].status, 'OPEN');
  stripe.session.status = 'expired';
  await processLuckyEvent(config, stripe, adapter, { ...event, id: 'evt_expired', type: 'checkout.session.expired' });
  assert.equal((await db.query('SELECT status FROM luckybird.orders')).rows[0].status, 'EXPIRED');
  assert.equal((await db.query('SELECT reserved FROM luckybird.inventory')).rows[0].reserved, 0);
}));
test('refund arriving before payment confirmation is retried instead of being silently dropped', async () => withDatabase(async db => {
  const stripe = fakeStripe(), adapter = providerDatabase(db);
  await createLuckyCheckout(config, stripe, adapter, id);
  stripe.charge.metadata = {};
  await assert.rejects(() => processLuckyEvent(config, stripe, adapter, { id: 'evt_early_refund', type: 'charge.refunded', livemode: false, data: { object: { id: stripe.charge.id } } }), /PAYMENT_REVIEW/);
  assert.equal((await db.query('SELECT status FROM luckybird.orders')).rows[0].status, 'OPEN');
}));
test('wrong amount, missing tax/shipping confirmation and mixed-mode events cannot fulfill orders', async () => withDatabase(async db => {
  const stripe = fakeStripe(), adapter = providerDatabase(db);
  await createLuckyCheckout(config, stripe, adapter, id);
  stripe.session.status = 'complete'; stripe.session.payment_status = 'paid';
  const event = { id: 'evt_bad', type: 'checkout.session.completed', livemode: false, data: { object: { id: stripe.session.id } } };
  await assert.rejects(() => processLuckyEvent(config, stripe, adapter, { ...event, livemode: true }), /MODE_MISMATCH/);
  stripe.session.amount_subtotal = 1;
  await assert.rejects(() => processLuckyEvent(config, stripe, adapter, event), /AMOUNT_MISMATCH/);
  stripe.session.amount_subtotal = 1000; stripe.session.automatic_tax.status = 'failed';
  await assert.rejects(() => processLuckyEvent(config, stripe, adapter, event), /PAYMENT_REVIEW/);
  assert.equal((await db.query('SELECT status FROM luckybird.orders')).rows[0].status, 'OPEN');
}));
test('community posts start private, stay deduplicated and require consent before publication', async () => withDatabase(async db => {
  const input = { id, name: 'Test visitor', email: 'unit@example.com', message: 'This tiny feather has a great personality!', photoUrl: 'https://example.com/owner-photo.jpg', consent: true };
  await submitCommunity(db, input); await submitCommunity(db, input);
  assert.equal((await db.query("SELECT count(*)::integer AS n FROM luckybird.community_posts WHERE status='APPROVED'")).rows[0].n, 0);
  await assert.rejects(() => submitCommunity(db, { ...input, id: secondId, consent: false }));
  await assert.rejects(() => db.query("UPDATE luckybird.community_posts SET photo_path='https://unreviewed.example/photo.jpg' WHERE id=$1", [id]));
  assert.equal((await db.query('SELECT count(*)::integer AS n FROM luckybird.community_posts')).rows[0].n, 1);
}));
test('durable rate limits survive separate calls and enforce the hourly cap', async () => withDatabase(async db => {
  await rateLimit(db, 'unit-fixture', 2); await rateLimit(db, 'unit-fixture', 2);
  await assert.rejects(() => rateLimit(db, 'unit-fixture', 2), /RATE_LIMIT/);
}));
