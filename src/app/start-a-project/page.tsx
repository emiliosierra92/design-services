import { Text } from '@/components/language-provider';
import type { Metadata } from 'next';
import { InquiryForm } from '@/components/inquiry-form';
import { isInquiryConfigured } from '@/lib/inquiry-email';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Start a project', description: 'Bring your idea to Emilio Sierra’s independent creative technology studio.' };
export default function StartProject() {
  return <main id="main" className="inquiry-page page-shell"><div className="inquiry-heading"><p className="eyebrow"><Text text="Project inquiry" /></p><h1><Text text="WHAT ARE" /><br /><Text text="WE MAKING" /><span className="cobalt">?</span></h1><p><Text text="Tell me a little about your project." /></p></div><InquiryForm enabled={isInquiryConfigured()} /></main>;
}
