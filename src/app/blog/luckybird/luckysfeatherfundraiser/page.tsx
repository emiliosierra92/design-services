import type { Metadata } from 'next';
import { BlogStoryView } from '@/components/blog-story-view';
import { luckyStory } from '@/content/lucky-story';

const url = `https://www.emiliosierra.com${luckyStory.path}`;
export const metadata: Metadata = {
  title: luckyStory.title,
  description: luckyStory.summary,
  alternates: { canonical: url },
  openGraph: { title: luckyStory.title, description: luckyStory.summary, url, type: 'article' },
  twitter: { card: 'summary', title: luckyStory.title, description: luckyStory.summary },
};

export default function LuckyBirdStoryPage() {
  return <BlogStoryView story={luckyStory} />;
}
