import type { Metadata } from 'next';
import { LuckyBirdPage } from '@/components/luckybird-page';
import { getLuckyPageState } from '@/lib/luckybird/service.mjs';

export const dynamic = 'force-dynamic';
const url = 'https://www.emiliosierra.com/luckybird';
const description = 'Meet Lucky, Emilio’s whiteface cockatiel. Discover his $10 naturally shed feather surprise, support his care, and join a little community with a lot of feather energy.';
export const metadata: Metadata = {
  title: 'Lucky Bird’s Feather Fundraiser', description,
  alternates: { canonical: url },
  openGraph: { title: 'Lucky Bird’s Feather Fundraiser', description, url, type: 'website' },
  twitter: { card: 'summary', title: 'Lucky Bird’s Feather Fundraiser', description },
};
export default async function LuckyBird({ searchParams }: { searchParams: Promise<{ checkout?: string; session_id?: string }> }) {
  const params = await searchParams;
  const checkout = typeof params.checkout === 'string' ? params.checkout : undefined;
  const sessionId = typeof params.session_id === 'string' && params.session_id.length <= 256 ? params.session_id : undefined;
  return <LuckyBirdPage state={await getLuckyPageState()} checkoutReturn={{ checkout, sessionId }} />;
}
