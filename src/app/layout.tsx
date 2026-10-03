import { LanguageProvider, Text } from '@/components/language-provider';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import './globals.css';
const display = localFont({ src: [
  { path: '../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2', weight: '400' },
  { path: '../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2', weight: '500' },
], variable: '--font-display', display: 'swap' });
export const metadata: Metadata = {
  metadataBase: new URL('https://emiliosierra.com'),
  title: { default: 'Emilio Sierra — Creative Technology Studio', template: '%s — Emilio Sierra' },
  description: 'Independent creative technology studio in Miami. Web and app design and development, graphic design, and video production.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={display.variable}><body><LanguageProvider><a className="skip-link" href="#main"><Text text="Skip to content" /></a><Navigation />{children}<Footer /></LanguageProvider></body></html>;
}
