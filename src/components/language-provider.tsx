'use client';
import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { spanish } from '@/content/spanish';
type Language = 'en' | 'es';
const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void }>({ language: 'en', setLanguage: () => {} });
let memoryLanguage: Language = 'en';
function getLanguage(): Language {
  try { return localStorage.getItem('studio-language') === 'es' ? 'es' : 'en'; }
  catch { return memoryLanguage; }
}
function subscribe(callback: () => void) {
  window.addEventListener('studio-language-change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('studio-language-change', callback);
    window.removeEventListener('storage', callback);
  };
}
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribe, getLanguage, () => 'en' as Language);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  function setLanguage(value: Language) {
    memoryLanguage = value;
    try { localStorage.setItem('studio-language', value); } catch { /* Switching still works without storage. */ }
    window.dispatchEvent(new Event('studio-language-change'));
  }
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  return { ...context, t: (text: string) => context.language === 'es' ? spanish[text] ?? text : text };
}
export function Text({ text }: { text: string }) { const { t } = useLanguage(); return <>{t(text)}</>; }
