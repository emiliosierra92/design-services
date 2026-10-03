import { inquiryOptions } from '@/content/inquiry-options';
export type Inquiry = { name: string; email: string; company: string; services: string[]; message: string; timeline: string; website: string; requestId: string };
export type InquiryErrors = Partial<Record<keyof Inquiry, string>>;
export function validateInquiry(input: unknown): { data?: Inquiry; errors: InquiryErrors } {
  const errors: InquiryErrors = {};
  const raw = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
  function field(name: keyof Inquiry, max: number, required = false) {
    const value = typeof raw[name] === 'string' ? (raw[name] as string).trim().replace(/\r\n?/g, '\n') : '';
    if (required && !value) errors[name] = 'Please complete this field.';
    if (value.length > max) errors[name] = 'This field is too long.';
    if (name !== 'message' && /[\r\n\x00-\x1f\x7f]/.test(value)) errors[name] = 'Please enter a valid value.';
    return value;
  }
  const name = field('name', 120, true), email = field('email', 254, true);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';
  const company = field('company', 180), message = field('message', 5000, true), timeline = field('timeline', 180);
  const selected = Array.isArray(raw.services) ? raw.services : [];
  const services = [...new Set(selected.filter((value): value is string => typeof value === 'string'))];
  if (!services.length || services.length > inquiryOptions.length || selected.length !== services.length || services.some(value => !inquiryOptions.includes(value as typeof inquiryOptions[number]))) errors.services = 'Choose at least one service.';
  const website = field('website', 180), requestId = field('requestId', 36, true);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) errors.requestId = 'Please reload the page and try again.';
  if (website) errors.website = 'Unable to submit this inquiry.';
  return { errors, data: Object.keys(errors).length ? undefined : { name, email, company, services, message, timeline, website, requestId } };
}
