// @ts-check
import 'server-only';
import { createHmac } from 'node:crypto';
import { configuration, stripeClient, webhookSecret, LuckyError } from './config.mjs';
import { withDatabase } from './database.mjs';
import { createLuckyCheckout, processLuckyEvent } from './service.mjs';
import { rateLimit, submitCommunity } from './store.mjs';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** @param {object} body @param {number} [status] */
export function reply(body, status = 200) { return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } }); }
/** @param {Request} request @param {number} [limit] */
export async function readBytes(request, limit = 8192) {
  if (!request.body) throw new LuckyError('INVALID');
  const reader = request.body.getReader(); const chunks = []; let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new LuckyError('INVALID'); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
/** @param {Request} request @param {ReturnType<typeof configuration>} config */
function browserRequest(request, config) {
  if (request.headers.get('origin') !== config.origin || !request.headers.get('content-type')?.startsWith('application/json')) throw new LuckyError('INVALID');
}
/** @param {Request} request @param {ReturnType<typeof configuration>} config @param {string} type */
function limiterKey(request, config, type) {
  if (!config.spamSecret || config.spamSecret.length < 32) throw new LuckyError();
  const ip = (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  return `${type}/${createHmac('sha256', config.spamSecret).update(ip).digest('hex')}`;
}
/** @param {unknown} value */
export function validateCommunity(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new LuckyError('INVALID');
  const allowed = ['requestId', 'name', 'email', 'message', 'photoUrl', 'website', 'consent'];
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new LuckyError('INVALID');
  const input = /** @type {Record<string,unknown>} */ (value);
  if (typeof input.requestId !== 'string' || !uuid.test(input.requestId) || input.website !== '' || input.consent !== true) throw new LuckyError('INVALID');
  for (const name of ['name','email','message','photoUrl']) if (typeof input[name] !== 'string') throw new LuckyError('INVALID');
  const name = /** @type {string} */ (input.name).trim();
  const email = /** @type {string} */ (input.email).trim();
  const message = /** @type {string} */ (input.message).trim();
  const photoUrl = /** @type {string} */ (input.photoUrl).trim();
  if (!name || name.length > 50 || /[\r\n<>]/.test(name) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10 || message.length > 1500 || /https?:\/\/|www\.|<[^>]*>/i.test(message)) throw new LuckyError('INVALID');
  if (photoUrl) {
    try { const url = new URL(photoUrl); if (photoUrl.length > 1000 || url.protocol !== 'https:' || url.username || url.password) throw new Error(); }
    catch { throw new LuckyError('INVALID'); }
  }
  return { id: input.requestId, name, email, message, photoUrl, consent: true };
}
/** @param {Request} request */
export async function checkoutPost(request) {
  try {
    const config = configuration(); browserRequest(request, config); webhookSecret(config);
    const input = JSON.parse((await readBytes(request)).toString());
    if (!input || typeof input !== 'object' || Object.keys(input).length !== 1 || typeof input.requestId !== 'string' || !uuid.test(input.requestId)) throw new LuckyError('INVALID');
    const key = limiterKey(request, config, 'checkout');
    const result = await withDatabase(config, async db => {
      await rateLimit(db, 'checkout/global', 100); await rateLimit(db, key, 10);
      return createLuckyCheckout(config, stripeClient(config), db, input.requestId);
    });
    return reply(result);
  } catch (error) {
    if (error instanceof LuckyError && error.code === 'INVALID') return reply({ error: 'Invalid checkout request.' }, 400);
    if (error instanceof LuckyError && error.code === 'RATE_LIMIT') return reply({ error: 'Please try again later.' }, 429);
    if (error instanceof LuckyError && error.code === 'SOLD_OUT') return reply({ error: 'Feather surprises are currently unavailable.' }, 409);
    return reply({ error: 'Checkout is unavailable right now. Please try again later.' }, 503);
  }
}
/** @param {Request} request */
export async function communityPost(request) {
  try {
    const config = configuration(); browserRequest(request, config);
    const input = validateCommunity(JSON.parse((await readBytes(request)).toString()));
    const key = limiterKey(request, config, 'community');
    await withDatabase(config, async db => {
      await rateLimit(db, 'community/global', 50); await rateLimit(db, key, 3);
      await submitCommunity(db, input);
    });
    return reply({ ok: true }, 202);
  } catch (error) {
    if (error instanceof LuckyError && error.code === 'INVALID') return reply({ error: 'Please check your story and consent.' }, 422);
    if (error instanceof LuckyError && error.code === 'RATE_LIMIT') return reply({ error: 'Please try again later.' }, 429);
    return reply({ error: 'Story submissions are unavailable right now.' }, 503);
  }
}
/** @param {Request} request */
export async function webhookPost(request) {
  let config, stripe, event;
  try { config = configuration(); stripe = stripeClient(config); }
  catch { return reply({ error: 'Webhook unavailable.' }, 503); }
  let secret;
  try { secret = webhookSecret(config); }
  catch { return reply({ error: 'Webhook unavailable.' }, 503); }
  try {
    const signature = request.headers.get('stripe-signature');
    if (!signature || signature.length > 4096) throw new Error();
    event = stripe.webhooks.constructEvent(await readBytes(request, 262144), signature, secret);
  } catch { return reply({ error: 'Invalid webhook.' }, 400); }
  if (event.livemode !== (config.mode === 'live')) return reply({ error: 'Wrong payment environment.' }, 400);
  try {
    await withDatabase(config, db => processLuckyEvent(config, stripe, db, event));
    return reply({ received: true });
  } catch { return reply({ error: 'Webhook processing unavailable.' }, 503); }
}
/** @param {Request} request */
export async function orderStatusGet(request) {
  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessionId || !/^cs_(test_|live_)?[A-Za-z0-9_]{8,240}$/.test(sessionId)) return reply({ error: 'Invalid session.' }, 400);
  try {
    const config = configuration();
    const status = await withDatabase(config, async db => {
      const result = await db.query('SELECT status FROM luckybird.orders WHERE stripe_session_id=$1', [sessionId]);
      const stored = result.rows[0]?.status;
      return ['PAID', 'REFUNDED', 'EXPIRED', 'FAILED'].includes(stored) ? stored : 'PENDING';
    });
    // No email, address, order items, or secrets returned to the browser.
    return reply({ status });
  } catch { return reply({ status: 'PENDING' }, 503); }
}
