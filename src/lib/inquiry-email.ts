import type { Inquiry } from './inquiry-validation';
export function isInquiryConfigured() { return Boolean(process.env.RESEND_API_KEY && process.env.INQUIRY_FROM_EMAIL); }
export async function sendInquiry(inquiry: Inquiry) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `inquiry/${inquiry.requestId}` },
    body: JSON.stringify({
      from: process.env.INQUIRY_FROM_EMAIL,
      to: ['emiliomsierra@outlook.com'],
      reply_to: inquiry.email,
      subject: `Website inquiry from ${inquiry.name}`,
      text: [`Name: ${inquiry.name}`, `Email: ${inquiry.email}`, `Company: ${inquiry.company || 'Not provided'}`, `Services: ${inquiry.services.join(', ')}`, `Timeline: ${inquiry.timeline || 'Not provided'}`, '', 'Project:', inquiry.message].join('\n'),
    }),
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  const result: unknown = await response.json();
  if (!response.ok || !result || typeof result !== 'object' || !('id' in result) || typeof result.id !== 'string' || !result.id) throw new Error('Email provider did not accept the inquiry.');
}
