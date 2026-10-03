import { CaseStudyView } from '@/components/case-study-view';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { projects } from '@/content/studio';
export function generateStaticParams() { return projects.map(({ slug }) => ({ project: slug })); }
export async function generateMetadata({ params }: { params: Promise<{ project: string }> }): Promise<Metadata> {
  const { project } = await params;
  const entry = projects.find(p => p.slug === project);
  return { title: entry?.name ?? 'Project not found', description: entry?.summary };
}
export default async function CaseStudy({ params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const index = projects.findIndex(p => p.slug === project);
  const entry = projects[index];
  if (!entry) notFound();
  return <CaseStudyView index={index} />;
}
