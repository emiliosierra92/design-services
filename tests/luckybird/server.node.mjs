import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import Stripe from 'stripe';
import { configuration, stripeClient } from '../../src/lib/luckybird/config.mjs';
import { withDatabase } from '../../src/lib/luckybird/database.mjs';
import { Client } from '@neondatabase/serverless';
import { checkoutParameters, getLuckyPageState } from '../../src/lib/luckybird/service.mjs';
import { checkoutPost, communityPost, webhookPost, orderStatusGet, validateCommunity, readBytes } from '../../src/lib/luckybird/http.mjs';

const savedEnvironment = { ...process.env };
afterEach(() => {
  for (const name of Object.keys(process.env)) if (!(name in savedEnvironment)) delete process.env[name];
  Object.assign(process.env, savedEnvironment);
});
const testEnvironment = {
  LUCKY_MODE: 'test', DATABASE_URL: 'postgresql://unit:fixture@unit.neon.tech/test?sslmode=require',
  LUCKY_TEST_PRODUCT_ID: 'prod_fixture', LUCKY_TEST_PRICE_ID: 'price_fixture',
  STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_WEBHOOK_SECRET: 'whsec_unit_fixture',
};
const id = '7e728f64-6c71-4a68-b457-18d1fd2f48b9';
test('a mismatched database environment cannot run test-mode application queries', async context => {
  context.mock.method(Client.prototype, 'connect', async () => {});
  context.mock.method(Client.prototype, 'query', async () => ({ rows: [{ mode: 'live' }] }));
  context.mock.method(Client.prototype, 'end', async () => {});
  let ran = false;
  await assert.rejects(() => withDatabase(configuration(testEnvironment), async () => { ran = true; }), /MODE_MISMATCH/);
  assert.equal(ran, false);
});
test('configuration is explicit, mode-specific and rejects unencrypted databases', () => {
  for (const environment of [{}, { ...testEnvironment, LUCKY_MODE: 'other' }, { ...testEnvironment, DATABASE_URL: 'postgresql://unit:fixture@unit.neon.tech/test' }]) assert.throws(() => configuration(environment));
  const config = configuration(testEnvironment);
  assert.equal(config.mode, 'test');
  assert.equal(config.productId, 'prod_fixture');
  assert.throws(() => stripeClient(config, { STRIPE_SECRET_KEY: 'sk_live_fixture' }));
  const live = configuration({ ...testEnvironment, LUCKY_MODE: 'live' });
  assert.equal(live.productId, 'prod_VdLxh7mOJDzZB8');
  assert.equal(live.priceId, 'price_1Uc5FBHvvMGc5UBGe7WOSRoS');
  assert.throws(() => stripeClient(live, { STRIPE_SECRET_KEY: 'sk_test_fixture' }));
  assert.ok(stripeClient(live, { STRIPE_SECRET_KEY: 'sk_live_fixture' })); // Constructor only. No network request.
});
test('checkout collects international shipping, applies automatic tax and fixes the server-selected price', () => {
  const params = checkoutParameters(configuration(testEnvironment), id, 2000000000);
  assert.deepEqual(params.line_items, [{ price: 'price_fixture', quantity: 1 }]);
  assert.equal(params.automatic_tax.enabled, true);
  assert.equal(params.shipping_options[0].shipping_rate_data.fixed_amount.amount, 0);
  for (const country of ['US','CA','GB','AU','JP']) assert.ok(params.shipping_address_collection.allowed_countries.includes(country));
  assert.deepEqual(params.payment_method_types, ['card']);
  assert.equal(params.metadata.order_id, id);
  assert.ok(params.success_url.startsWith('https://www.emiliosierra.com/luckybird?'));
});
test('community validation accepts honest criticism but rejects spam, unconsented and oversized content', () => {
  const valid = { requestId: id, name: 'Test visitor', email: 'unit@example.com', message: 'My feather was tiny, but I love its personality!', photoUrl: '', website: '', consent: true };
  assert.equal(validateCommunity(valid).message, valid.message);
  for (const change of [{ consent: false }, { website: 'bot' }, { message: 'Visit https://spam.example' }, { message: '<script>alert(1)</script>' }, { name: '<iframe>' }, { email: 'bad' }, { photoUrl: 'http://example.com/photo.jpg' }, { photoUrl: 'https://user:password@example.com/photo.jpg' }, { message: 'x'.repeat(1501) }, { price: 1 }]) assert.throws(() => validateCommunity({ ...valid, ...change }));
});
test('bounded raw bodies reject size violations before parsing', async () => {
  await assert.rejects(() => readBytes(new Request('https://example.com', { method: 'POST', body: 'x'.repeat(8193) })));
});
test('missing credentials never allow checkout, public submissions, or payment success', async () => {
  delete process.env.LUCKY_MODE; delete process.env.DATABASE_URL; delete process.env.STRIPE_SECRET_KEY;
  const state = await getLuckyPageState();
  assert.deepEqual(state, { checkoutReady: false, communityReady: false, posts: [] });
  const request = () => new Request('https://www.emiliosierra.com/api/luckybird/checkout', { method: 'POST', headers: { origin: 'https://www.emiliosierra.com', 'content-type': 'application/json' }, body: JSON.stringify({ requestId: id }) });
  assert.equal((await checkoutPost(request())).status, 503);
  assert.equal((await communityPost(request())).status, 503);
  assert.equal((await webhookPost(request())).status, 503);
  const status = await orderStatusGet(new Request('https://www.emiliosierra.com/api/luckybird/order-status?session_id=cs_test_unit_fixture'));
  assert.equal(status.status, 503);
  assert.deepEqual(await status.json(), { status: 'PENDING' });
});
test('checkout rejects browser-supplied pricing, malformed IDs and cross-origin calls before provider access', async () => {
  Object.assign(process.env, testEnvironment);
  for (const [body, origin] of [[{ requestId: id, price: 1 }, 'https://www.emiliosierra.com'], [{ requestId: 'bad' }, 'https://www.emiliosierra.com'], [{ requestId: id }, 'https://attacker.example']]) {
    const response = await checkoutPost(new Request('https://www.emiliosierra.com/api/luckybird/checkout', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) }));
    assert.equal(response.status, 400);
  }
});
test('webhook verifies untouched bodies, rejects stale or live signatures in the test environment', async () => {
  Object.assign(process.env, testEnvironment);
  const event = { id: 'evt_fixture', type: 'checkout.session.completed', livemode: true, data: { object: { id: 'cs_fixture' } } };
  const body = JSON.stringify(event);
  const signature = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: testEnvironment.STRIPE_WEBHOOK_SECRET });
  const request = (payload, sig = signature) => new Request('https://example.com', { method: 'POST', headers: { 'stripe-signature': sig }, body: payload });
  assert.equal((await webhookPost(request(body))).status, 400); // Signed live event, wrong mode; no database access.
  assert.equal((await webhookPost(request(body + ' '))).status, 400);
  const stale = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: testEnvironment.STRIPE_WEBHOOK_SECRET, timestamp: 1 });
  assert.equal((await webhookPost(request(body, stale))).status, 400);
});
test('commerce modules cannot be imported into ordinary client/runtime code', () => {
  for (const name of ['config','database','service','store','http']) {
    const result = spawnSync(process.execPath, ['--input-type=module','-e',`import './src/lib/luckybird/${name}.mjs'`], { env: { ...process.env, NODE_OPTIONS: '' }, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /cannot be imported from a Client Component/);
  }
});
