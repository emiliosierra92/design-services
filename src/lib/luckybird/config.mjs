// @ts-check
import 'server-only';
import Stripe from 'stripe';
import { luckyProduct } from '../../content/luckybird-product.mjs';

export class LuckyError extends Error {
  /** @param {string} [code] */
  constructor(code = 'UNAVAILABLE') { super(code); this.code = code; }
}
/** @param {NodeJS.ProcessEnv} [environment] */
export function configuration(environment = process.env) {
  const mode = environment.LUCKY_MODE;
  if (!['test', 'live'].includes(mode ?? '')) throw new LuckyError();
  const databaseUrl = environment.DATABASE_URL;
  if (!databaseUrl) throw new LuckyError();
  try {
    const parsed = new URL(databaseUrl);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname.endsWith('.neon.tech') || parsed.searchParams.get('sslmode') !== 'require') throw new Error();
  } catch { throw new LuckyError(); }
  const productId = mode === 'live' ? luckyProduct.live.productId : environment.LUCKY_TEST_PRODUCT_ID;
  const priceId = mode === 'live' ? luckyProduct.live.priceId : environment.LUCKY_TEST_PRICE_ID;
  const origin = environment.LUCKY_SITE_ORIGIN || 'https://www.emiliosierra.com';
  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname))) throw new Error();
  } catch { throw new LuckyError(); }
  return { mode: /** @type {'test' | 'live'} */ (mode), databaseUrl, productId, priceId, origin, spamSecret: environment.LUCKY_SPAM_SECRET };
}
/** @param {ReturnType<typeof configuration>} config @param {NodeJS.ProcessEnv} [environment] */
export function stripeClient(config, environment = process.env) {
  const key = environment.STRIPE_SECRET_KEY;
  if (!key || !new RegExp(`^(sk|rk)_${config.mode}_[A-Za-z0-9]+$`).test(key)) throw new LuckyError();
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 10000, telemetry: false });
}
/** @param {ReturnType<typeof configuration>} config @param {NodeJS.ProcessEnv} [environment] */
export function webhookSecret(config, environment = process.env) {
  // A secret is endpoint-specific, not an API key. Never invent a fallback.
  const secret = environment.STRIPE_WEBHOOK_SECRET;
  if (!secret?.startsWith('whsec_')) throw new LuckyError();
  return secret;
}
