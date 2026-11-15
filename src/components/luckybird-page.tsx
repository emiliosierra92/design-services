'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { luckyPhotos, luckyUpdates, luckyCareResources, luckyProduct } from '@/content/luckybird';
import { Text, useLanguage } from './language-provider';
import { LuckyFeather } from './lucky-feather';

export type LuckyPageState = {
  checkoutReady: boolean; communityReady: boolean;
  posts: { id: string; display_name: string; message: string; photo_path: string | null }[];
};

type CheckoutReturn = { checkout?: string; sessionId?: string };
function LuckyCheckout({ ready, checkoutReturn }: { ready: boolean; checkoutReturn: CheckoutReturn }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(checkoutReturn.checkout === 'canceled' ? 'Checkout was closed. No order is confirmed here. You can return whenever you like.' : checkoutReturn.checkout === 'return' && checkoutReturn.sessionId ? 'Checking your payment confirmation…' : '');
  const requestId = useRef('');
  const status = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (checkoutReturn.checkout === 'return' && checkoutReturn.sessionId) {
      const controller = new AbortController();
      fetch(`/api/luckybird/order-status?session_id=${encodeURIComponent(checkoutReturn.sessionId)}`, { signal: controller.signal, cache: 'no-store' })
        .then(response => response.ok ? response.json() : Promise.reject())
        .then(result => setMessage(result.status === 'PAID' ? 'Your payment is confirmed. Thank you for supporting Lucky! Please keep your Stripe receipt.' : result.status === 'REFUNDED' ? 'A refund has been recorded for this order. Please keep your Stripe receipt for reference.' : ['EXPIRED', 'FAILED'].includes(result.status) ? 'This checkout did not complete. No order has been confirmed.' : 'Your payment confirmation is still pending. Please keep your Stripe receipt and check back shortly.'))
        .catch(() => { if (!controller.signal.aborted) setMessage('Your payment confirmation is still pending. Please keep your Stripe receipt and check back shortly.'); });
      return () => controller.abort();
    }
  }, [checkoutReturn.checkout, checkoutReturn.sessionId]);
  async function buy() {
    if (pending || !ready) return;
    setPending(true); setMessage('');
    requestId.current ||= crypto.randomUUID();
    try {
      const response = await fetch('/api/luckybird/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: requestId.current }) });
      const result = await response.json();
      if (!response.ok || typeof result.url !== 'string' || new URL(result.url).hostname !== 'checkout.stripe.com' || new URL(result.url).protocol !== 'https:') throw new Error();
      window.location.assign(result.url);
    } catch { setPending(false); setMessage('Checkout is unavailable right now. Please try again later.'); status.current?.focus(); }
  }
  return <div className="lucky-purchase">
    <button className="lucky-button" disabled={!ready || pending} onClick={buy}>{t(pending ? 'Opening checkout…' : 'Get a feather surprise — $10')}<span aria-hidden="true">↗</span></button>
    <p className="lucky-small">{t(ready ? 'Free international shipping. Any applicable tax is shown at checkout.' : 'Feather surprises are taking a short perch break. Purchasing is currently unavailable.')}</p>
    <p ref={status} tabIndex={-1} role="status" className="lucky-status">{t(message)}</p>
  </div>;
}

function CommunityForm({ ready }: { ready: boolean }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const status = useRef<HTMLParagraphElement>(null);
  const requestId = useRef('');
  const previousPayload = useRef('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!ready || pending || sent) return;
    const data = new FormData(event.currentTarget);
    const details = { name: data.get('name'), email: data.get('email'), message: data.get('message'), photoUrl: data.get('photoUrl'), website: data.get('website'), consent: data.get('consent') === 'on' };
    const fingerprint = JSON.stringify(details);
    if (!requestId.current || previousPayload.current !== fingerprint) requestId.current = crypto.randomUUID();
    previousPayload.current = fingerprint;
    setPending(true); setMessage('');
    try {
      const response = await fetch('/api/luckybird/community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: requestId.current, ...details }) });
      if (response.status === 422) { setMessage('Please check your story, photo link, and consent. Keep links in the photo field.'); return; }
      if (response.status === 429) { setMessage('Please take a short perch break and try again later.'); return; }
      if (!response.ok || !(await response.json()).ok) throw new Error();
      setSent(true); setMessage('Your story was received for review. It is not public yet. Thank you!');
    } catch { setMessage('Your story could not be received. Please try again later.'); }
    finally { setPending(false); status.current?.focus(); }
  }
  return <form className="lucky-community-form" onSubmit={submit}>
    <fieldset disabled={!ready || pending || sent}><legend><Text text="Share a feather story" /></legend>
      <div className="lucky-form-grid"><label><Text text="Display name" /><input name="name" autoComplete="nickname" required maxLength={50} /></label><label><Text text="Email (kept private)" /><input name="email" type="email" autoComplete="email" required maxLength={254} /></label></div>
      <label><Text text="Your feather story" /><textarea name="message" required minLength={10} maxLength={1500} rows={4} /></label>
      <label><Text text="Photo link (optional)" /><input name="photoUrl" type="url" placeholder="https://" maxLength={1000} /><span className="lucky-small"><Text text="Share a link to a photo you own. We review photos before publishing. Please leave personal details out of your story and photo." /></span></label>
      <label className="form-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="lucky-consent"><input name="consent" type="checkbox" required /><span><Text text="I own this content and agree to have my display name, story, and approved photo published here after review." /></span></label>
      <button className="lucky-button" type="submit">{t(pending ? 'Sending…' : sent ? 'Story received' : 'Send for review')}<span aria-hidden="true">→</span></button>
    </fieldset>
    <p className="lucky-small"><Text text="All stories are reviewed for spam, personal information, and respectful language. Honest criticism is welcome. Your email is used only to follow up on this submission and is never published." /></p>
    {!ready && <p className="lucky-small"><Text text="Story submissions are currently unavailable. Please visit again soon." /></p>}
    <p ref={status} tabIndex={-1} className="lucky-status" role="status">{t(message)}</p>
  </form>;
}

export function LuckyBirdPage({ state, checkoutReturn = {} }: { state: LuckyPageState; checkoutReturn?: CheckoutReturn }) {
  const { t } = useLanguage();
  return <main id="main" className="lucky-page">
    <section className="lucky-hero" aria-labelledby="lucky-title">
      <div className="lucky-kicker eyebrow"><span><Text text="Welcome to Lucky’s little kingdom" /></span><span><Text text="Naturally shed. Personally treasured." /></span></div>
      <div className="lucky-hero-grid"><div><p className="eyebrow"><Text text="Whiteface cockatiel / Feathered mascot" /></p><h1 id="lucky-title"><Text text="Little bird." /><br /><em><Text text="Big feather" /></em><br /><Text text="energy." /></h1><p className="lucky-intro"><Text text="Meet Lucky, my whiteface cockatiel. His naturally shed feathers are the start of a small idea: a surprise for you, support for his everyday care." /></p><a className="lucky-button" href="#feather-surprise"><Text text="Meet your feather surprise" /><span aria-hidden="true">↓</span></a></div>
        <div className="lucky-hero-art">{luckyPhotos[0] ? <Image src={luckyPhotos[0].src} alt={t(luckyPhotos[0].alt)} width={luckyPhotos[0].width} height={luckyPhotos[0].height} sizes="(max-width: 900px) 90vw, 45vw" preload /> : <><LuckyFeather className="lucky-hero-feather" /><p><Text text="Lucky’s photo debut is coming soon." /></p></>}<span className="lucky-sticker"><Text text="Small feathers welcome!" /></span></div>
      </div>
      <div className="lucky-values"><span><Text text="Naturally shed feathers" /></span><span><Text text="Every purchase supports Lucky’s care" /></span><span><Text text="A little surprise, clearly explained" /></span></div>
    </section>
    <section id="feather-surprise" className="lucky-product lucky-section" aria-labelledby="surprise-title">
      <div className="lucky-product-art"><Image src="/images/luckybird/luckybirdfeather.jpg" alt={t("Example stock photo of a grey feather with a fluffy white base on a light background.")} width={1254} height={1254} sizes="(max-width: 760px) 220px, 260px" /><span className="lucky-price">$10</span><p className="eyebrow"><Text text="One surprise. Plenty of personality." /></p><p className="lucky-small"><Text text="Example photo. Your feather surprise will vary." /></p></div>
      <div><p className="eyebrow"><Text text="The feather fund" /></p><h2 id="surprise-title">{t(luckyProduct.name)}</h2><p><Text text="A random, authentic, naturally shed feather or feather bundle from Lucky Bird. Your purchase supports his nutritious food, supplies, and healthy lifestyle." /></p>
        <ul className="lucky-details"><li><Text text="Maybe a long tail feather. Maybe a medium feather with fluff. Maybe tiny feathers with a crest feather mixed in." /></li><li><Text text="Sizes, types, quantities, and combinations are not guaranteed. Supplies depend on what Lucky naturally sheds." /></li><li><Text text="This is a random product selection, with no cash prizes or guaranteed feather type." /></li></ul>
        <LuckyCheckout key={`${checkoutReturn.checkout}/${checkoutReturn.sessionId}`} ready={state.checkoutReady} checkoutReturn={checkoutReturn} />
        <p className="lucky-small"><Text text="This is a purchase supporting Lucky’s care, not a tax-deductible donation." /></p>
      </div>
    </section>
    <section className="lucky-section lucky-album" aria-labelledby="album-title"><div className="lucky-section-heading"><p className="eyebrow"><Text text="The royal photo album" /></p><h2 id="album-title"><Text text="A life with Lucky." /></h2></div>
      {luckyPhotos.length ? <div className="lucky-photo-grid">{luckyPhotos.map(photo => <figure key={photo.src}><Image src={photo.src} alt={t(photo.alt)} width={photo.width} height={photo.height} sizes="(max-width: 760px) 90vw, 40vw" /><figcaption>{t(photo.caption)}</figcaption></figure>)}</div> : <div className="lucky-album-empty"><LuckyFeather /><div><h3><Text text="A perch for the good moments." /></h3><p><Text text="Lucky’s real photos will live here: everyday moments, feather details, and a little bird being himself. The album is coming soon." /></p></div></div>}
    </section>
    <section className="lucky-section lucky-care" aria-labelledby="care-title"><div className="lucky-section-heading"><p className="eyebrow"><Text text="More than feathers" /></p><h2 id="care-title"><Text text="Care is the whole point." /></h2><p><Text text="Bird awareness starts with curiosity and responsible care. These resources are a starting point; your own bird’s needs belong in a conversation with an avian veterinarian." /></p></div>
      <div className="lucky-care-grid">{luckyCareResources.map(resource => <article key={resource.title}><h3>{t(resource.title)}</h3><p>{t(resource.text)}</p><a className="text-link" href={resource.href}>{resource.source}<span aria-hidden="true">↗</span></a></article>)}</div>
    </section>
    <section className="lucky-section lucky-notes" aria-labelledby="notes-title"><div className="lucky-notes-content"><p className="eyebrow"><Text text="Notes from the perch" /></p><h2 id="notes-title"><Text text="The story keeps growing." /></h2>
      {luckyUpdates.length ? luckyUpdates.map(update => <article key={update.title}>{update.date && <time dateTime={update.date}>{update.date}</time>}<h3>{t(update.title)}</h3><p>{t(update.text)}</p></article>) : <p><Text text="Photos, stories, and new things we learn about bird care will land here over time. No timetable. Lucky is in charge of the feathers." /></p>}
      <Link className="text-link" href="/blog/luckybird/luckysfeatherfundraiser"><Text text="Read how the idea began" /><span aria-hidden="true">↗</span></Link></div>
    </section>
    <section className="lucky-section lucky-community" aria-labelledby="community-title"><div className="lucky-section-heading"><p className="eyebrow"><Text text="The feather fellowship" /></p><h2 id="community-title"><Text text="Tiny feather? Big story." /></h2><p><Text text="Show us your feather and tell us about it. Honest reviews are welcome—even a playful complaint about receiving the tiniest feather in the kingdom." /></p><p><Text text="You are welcome back anytime, but another purchase never promises a bigger feather. Enjoy your own little surprise." /></p></div>
      {state.posts.length > 0 && <div className="lucky-posts">{state.posts.map(post => <article key={post.id}><h3>{post.display_name}</h3><p>{post.message}</p>{post.photo_path && <Image src={post.photo_path} alt={t('A community member’s feather selection')} width={800} height={600} sizes="(max-width: 760px) 90vw, 40vw" />}</article>)}</div>}
      {state.communityReady && state.posts.length === 0 && <p className="lucky-community-empty"><Text text="No community stories have been published yet. The perch is open." /></p>}
      <CommunityForm ready={state.communityReady} />
    </section>
  </main>;
}
