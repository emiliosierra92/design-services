import { createHash } from 'node:crypto';
import { validateInquiry } from '@/lib/inquiry-validation';
import { isInquiryConfigured, sendInquiry } from '@/lib/inquiry-email';
export const runtime = 'nodejs';
const attempts = new Map<string, { count: number; expires: number }>();
function reply(body: object, status = 200) { return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } }); }
// A per-process backstop. Add a shared or hosting-platform limit for multiple instances.
function allowed(email: string) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  const total = attempts.get('global') ?? { count: 0, expires: now + 3600000 };
  if (total.count >= 30) return false;
  const key = createHash('sha256').update(email.toLowerCase()).digest('hex');
  const entry = attempts.get(key) ?? { count: 0, expires: now + 3600000 };
  if (attempts.size >= 10000 && !attempts.has(key)) return false;
  entry.count++; attempts.set(key, entry);
  total.count++; attempts.set('global', total);
  return entry.count <= 5;
}
async function readBody(request: Request) {
  if (!request.body) throw new Error('Missing body');
  const reader = request.body.getReader();
  const parts: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 24000) { await reader.cancel(); throw new Error('Oversized body'); }
    parts.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const expectedOrigin = process.env.INQUIRY_SITE_ORIGIN || new URL(request.url).origin;
  if (origin !== expectedOrigin) return reply({ error: 'Unable to submit this inquiry.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'Unable to submit this inquiry.' }, 415);
  let input: unknown;
  try { input = await readBody(request); } catch { return reply({ error: 'Unable to submit this inquiry.' }, 400); }
  const { data, errors } = validateInquiry(input);
  if (!data) return reply({ error: 'Please check the highlighted fields.', errors }, 422);
  if (!isInquiryConfigured()) return reply({ error: 'Email delivery is unavailable right now. Your inquiry has not been sent. Please try again later.' }, 503);
  if (!allowed(data.email)) return reply({ error: 'Too many attempts. Please try again later.' }, 429);
  try { await sendInquiry(data); }
  catch { return reply({ error: 'Your inquiry could not be sent. Please try again.' }, 502); }
  return reply({ ok: true });
}
