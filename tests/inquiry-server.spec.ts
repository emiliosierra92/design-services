import { test, expect } from '@playwright/test';
import { validateInquiry } from '../src/lib/inquiry-validation';
import { POST } from '../src/app/api/inquiry/route';
const valid = { name: '  Test visitor  ', email: 'test@example.com', company: '', services: ['Graphic Design'], message: 'A test project.', timeline: '', website: '', requestId: '7e728f64-6c71-4a68-b457-18d1fd2f48b9' };
function request(body: unknown = valid, origin = 'https://example.com') { return new Request('https://example.com/api/inquiry', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
const originalFetch = globalThis.fetch;
const originalKey = process.env.RESEND_API_KEY, originalFrom = process.env.INQUIRY_FROM_EMAIL, originalOrigin = process.env.INQUIRY_SITE_ORIGIN;
test.beforeEach(() => { delete process.env.INQUIRY_SITE_ORIGIN; delete process.env.RESEND_API_KEY; delete process.env.INQUIRY_FROM_EMAIL; });
test.afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries({ RESEND_API_KEY: originalKey, INQUIRY_FROM_EMAIL: originalFrom, INQUIRY_SITE_ORIGIN: originalOrigin })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
test('validates and normalizes input and rejects untrusted fields', () => {
  expect(validateInquiry(valid).data?.name).toBe('Test visitor');
  for (const invalid of [{ email: 'bad' }, { name: 'Header\r\nInjection' }, { name: '   ' }, { services: [] }, { services: ['Unknown service'] }, { message: 'x'.repeat(5001) }, { requestId: 'invalid' }, { website: 'bot.example' }]) expect(validateInquiry({ ...valid, ...invalid }).data).toBeUndefined();
});
test('rejects cross-origin, malformed, large and invalid requests without contacting a provider', async () => {
  globalThis.fetch = async () => { throw new Error('No provider call should occur'); };
  expect((await POST(request(valid, 'https://attacker.example'))).status).toBe(403);
  expect((await POST(request({ ...valid, services: [] }))).status).toBe(422);
  expect((await POST(request({ ...valid, website: 'spam' }))).status).toBe(422);
  expect((await POST(request({ message: 'x'.repeat(25000) }))).status).toBe(400);
  expect((await POST(new Request('https://example.com/api/inquiry', { method: 'POST', headers: { origin: 'https://example.com', 'Content-Type': 'application/json' }, body: '{invalid' }))).status).toBe(400);
});
test('unconfigured delivery cannot report success', async () => {
  const response = await POST(request());
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: 'Email delivery is unavailable right now. Your inquiry has not been sent. Please try again later.' });
});
test('confirmed provider acceptance sends only to the owner, uses visitor reply-to and idempotency', async () => {
  process.env.RESEND_API_KEY = 'test-only-key'; process.env.INQUIRY_FROM_EMAIL = 'Studio <inquiries@example.com>';
  let captured: RequestInit | undefined;
  globalThis.fetch = async (url, init) => { expect(url).toBe('https://api.resend.com/emails'); captured = init; return Response.json({ id: 'test-email-id' }); };
  const response = await POST(request({ ...valid, to: 'attacker@example.com' }));
  expect(response.status).toBe(200); expect(await response.json()).toEqual({ ok: true });
  const body = JSON.parse(captured!.body as string);
  expect(body.to).toEqual(['emiliomsierra@outlook.com']); expect(body.reply_to).toBe(valid.email);
  expect(body.text).toContain(valid.message); expect(body).not.toHaveProperty('html');
  expect((captured!.headers as Record<string, string>)['Idempotency-Key']).toBe(`inquiry/${valid.requestId}`);
});
test('provider rejection, missing confirmation and network failure never report success', async () => {
  process.env.RESEND_API_KEY = 'test-only-key'; process.env.INQUIRY_FROM_EMAIL = 'inquiries@example.com';
  for (const result of [() => Response.json({ error: 'private provider details' }, { status: 403 }), () => Response.json({}), () => { throw new Error('Private upstream error'); }]) {
    globalThis.fetch = async () => result();
    const response = await POST(request({ ...valid, email: 'failure@example.com' }));
    expect(response.status).toBe(502); expect(await response.json()).toEqual({ error: 'Your inquiry could not be sent. Please try again.' });
  }
});
test('repeat attempts are rate limited', async () => {
  process.env.RESEND_API_KEY = 'test-only-key'; process.env.INQUIRY_FROM_EMAIL = 'inquiries@example.com';
  globalThis.fetch = async () => Response.json({ id: 'accepted' });
  for (let i = 0; i < 5; i++) expect((await POST(request({ ...valid, email: 'limit@example.com' }))).status).toBe(200);
  expect((await POST(request({ ...valid, email: 'limit@example.com' }))).status).toBe(429);
});
