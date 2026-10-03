'use client';
import { Text, useLanguage } from '@/components/language-provider';
import Link from 'next/link';
export function Footer() {
  const { t, language, setLanguage } = useLanguage();
  return <footer className="footer"><div><Link href="/" className="footer-brand">EMILIO SIERRA</Link><p><Text text="Creative Technology Studio · Miami, Florida" /></p></div><nav aria-label={t("Footer navigation")}><Link href="/#work"><Text text="Work" /></Link><Link href="/#services"><Text text="Services" /></Link><Link href="/#about"><Text text="About" /></Link><Link href="/start-a-project"><Text text="Start a project ↗" /></Link></nav><div className="language-switcher" role="group" aria-label={language === 'es' ? 'Idioma del sitio' : 'Site language'}><span>{language === 'es' ? 'Idioma' : 'Language'}</span><button type="button" lang="en" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button><button type="button" lang="es" aria-pressed={language === 'es'} onClick={() => setLanguage('es')}>Español</button></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Emilio Sierra</span><span><Text text="Design prototype · Content pending approval" /></span></div></footer>;
}
