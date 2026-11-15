import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CaseStudyView } from '@/components/case-study-view';
import { BlogStoryView } from '@/components/blog-story-view';
import { workStories, workStoryPath, editorialWorkStories } from '@/content/blog';
import { projects } from '@/content/studio';

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return workStories.filter(({ slug }) => workStoryPath(slug) === `/blog/work/${slug}`).map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = workStories.find(entry => entry.slug === slug);
  if (!story || workStoryPath(slug) !== `/blog/work/${slug}`) notFound();
  const url = `https://www.emiliosierra.com${workStoryPath(slug)}`;
  return {
    title: story.title, description: story.summary,
    alternates: { canonical: url },
    openGraph: { title: story.title, description: story.summary, url, type: 'article' },
    twitter: { card: 'summary', title: story.title, description: story.summary },
  };
}
export default async function WorkStoryPage({ params }: Props) {
  const { slug } = await params;
  if (workStoryPath(slug) !== `/blog/work/${slug}`) notFound();
  const editorialStory = editorialWorkStories.find(story => story.slug === slug);
  if (editorialStory) return <BlogStoryView story={editorialStory} />;
  const index = projects.findIndex(project => project.slug === slug);
  if (index === -1) notFound();
  return <CaseStudyView index={index} />;
}
