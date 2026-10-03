'use client';
import { Text, useLanguage } from '@/components/language-provider';
import { useRef, useState } from 'react';
import { inquiryOptions } from '@/content/inquiry-options';
import { validateInquiry, type InquiryErrors } from '@/lib/inquiry-validation';

export function InquiryForm({ enabled }: { enabled: boolean }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [status, setStatus] = useState('');
  const [sent, setSent] = useState(false);
  const busy = useRef(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const attempt = useRef({ payload: '', id: '' });
  function announce(text: string) { setStatus(text); requestAnimationFrame(() => statusRef.current?.focus()); }
  function error(field: keyof InquiryErrors) { return errors[field] ? <span className="field-error" id={`error-${field}`}>{t(errors[field]!)}</span> : null; }
  function accessibility(field: keyof InquiryErrors) { return { 'aria-invalid': Boolean(errors[field]), 'aria-describedby': errors[field] ? `error-${field}` : undefined }; }
  return <form className="inquiry-form" noValidate aria-busy={pending} onSubmit={async event => {
    event.preventDefault();
    if (busy.current || !enabled || sent) return;
    const form = event.currentTarget, fields = new FormData(form);
    const input = { name: fields.get('name'), email: fields.get('email'), company: fields.get('company'), services: fields.getAll('services'), message: fields.get('message'), timeline: fields.get('timeline'), website: fields.get('website') };
    const payload = JSON.stringify(input);
    if (attempt.current.payload !== payload) attempt.current = { payload, id: crypto.randomUUID() };
    const validated = validateInquiry({ ...input, requestId: attempt.current.id });
    setErrors(validated.errors); setStatus('');
    if (!validated.data) {
      const field = Object.keys(validated.errors)[0];
      form.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
      setStatus('Please check the highlighted fields.');
      return;
    }
    busy.current = true; setPending(true);
    try {
      const response = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validated.data), signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setErrors(result.errors ?? {});
        announce(typeof result.error === 'string' ? result.error : 'Your inquiry could not be sent. Please try again.');
      } else { setSent(true); announce('Your inquiry has been submitted. Thank you—I’ll be in touch.'); }
    } catch { announce('Your inquiry could not be confirmed. Please try again.'); }
    finally { busy.current = false; setPending(false); }
  }}>
    {!enabled && <div className="form-notice" id="form-notice"><p><Text text="Email delivery is unavailable right now. Your inquiry has not been sent. Please try again later." /></p></div>}
    <div className="form-grid"><label><Text text="Your name" /> <span><Text text="(required)" /></span><input autoComplete="name" name="name" required maxLength={120} {...accessibility('name')} />{error('name')}</label><label><Text text="Email address" /> <span><Text text="(required)" /></span><input type="email" autoComplete="email" name="email" required maxLength={254} {...accessibility('email')} />{error('email')}</label></div>
    <label><Text text="Company / organization" /> <span><Text text="(optional)" /></span><input autoComplete="organization" name="company" maxLength={180} {...accessibility('company')} />{error('company')}</label>
    <fieldset aria-describedby={errors.services ? 'error-services' : undefined}><legend><Text text="What are you interested in?" /> <span><Text text="(choose any)" /></span></legend>{inquiryOptions.map(service => <label className="checkbox-label" key={service}><input type="checkbox" name="services" value={service} aria-invalid={Boolean(errors.services)} />{t(service)}</label>)}{error('services')}</fieldset>
    <label><Text text="Tell me about your project" /> <span><Text text="(required)" /></span><textarea name="message" required rows={5} maxLength={5000} placeholder={t('What are you trying to create, improve, or solve?')} {...accessibility('message')} />{error('message')}</label>
    <label><Text text="When are you hoping to get started?" /> <span><Text text="(optional)" /></span><input name="timeline" maxLength={180} {...accessibility('timeline')} />{error('timeline')}</label>
    <div className="form-honeypot" aria-hidden="true"><label>Website<input name="website" autoComplete="off" tabIndex={-1} /></label></div>
    <p className="form-data-note"><Text text="Your details will be used to respond to your inquiry." /></p>
    <button className="text-link" type="submit" disabled={!enabled || pending || sent} aria-describedby={!enabled ? 'form-notice' : undefined}><Text text={pending ? 'Sending…' : sent ? 'Inquiry submitted' : 'Send inquiry'} /> <span>→</span></button>
    <p ref={statusRef} role="status" tabIndex={-1} className="form-status">{t(status)}</p>
  </form>;
}
