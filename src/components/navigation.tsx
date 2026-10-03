'use client';
import { Text, useLanguage } from '@/components/language-provider';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
const items = [['Work', '/#work'], ['Services', '/#services'], ['About', '/#about']];
export function Navigation() {
  const { t } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [active, setActive] = useState('');
  const [night, setNight] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    function update() {
      setCompact(window.scrollY > 70);
      const sections = [...document.querySelectorAll<HTMLElement>('main > section[id]')];
      const current = sections.filter(s => s.getBoundingClientRect().top <= 120).at(-1);
      setActive(current?.id ?? '');
      setNight(current?.dataset.environment === 'night');
    }
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  function close() { dialog.current?.close(); setOpen(false); trigger.current?.focus(); }
  return <>
    <header className={`site-header ${compact ? 'compact' : ''} ${night ? 'night-nav' : ''}`}>
      <Link className="brand" href="/" aria-label={t("Emilio Sierra home")}>EMILIO SIERRA<span><Text text="CREATIVE TECHNOLOGY STUDIO" /></span></Link>
      <nav className="desktop-nav" aria-label={t("Main navigation")}>{items.map(([label, href]) => <Link aria-current={active === href.slice(2) ? 'location' : undefined} href={href} key={href}>{t(label)}</Link>)}<Link className="inquiry-link" href="/start-a-project"><Text text="Start a project" /> <span>↗</span></Link></nav>
      <button ref={trigger} className="menu-trigger" aria-expanded={open} aria-controls="mobile-menu" onClick={() => { dialog.current?.showModal(); setOpen(true); }}><Text text="Menu" /></button>
    </header>
    <dialog ref={dialog} id="mobile-menu" className="mobile-menu" onCancel={close} onClose={() => { setOpen(false); trigger.current?.focus(); }} aria-label={t("Site navigation")} onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const focusable = dialog.current?.querySelectorAll<HTMLElement>('button, a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
      <div className="menu-top"><span>EMILIO SIERRA</span><button onClick={close} autoFocus><Text text="Close ×" /></button></div>
      <nav aria-label={t("Mobile navigation")}>{[...items, ['Start a project ↗', '/start-a-project']].map(([label, href]) => <Link href={href} key={href} onClick={close}>{t(label)}</Link>)}</nav>
      <p className="eyebrow"><Text text="Creative Technology Studio" /><br />Miami / FL</p>
    </dialog>
  </>;
}
