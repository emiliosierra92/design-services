import type { Metadata } from 'next';
import { BlogIndex } from '@/components/blog-index';

const url = 'https://www.emiliosierra.com/blog';
const description = 'Stories about Emilio Sierra’s creative technology projects, design, production, and professional work.';
export const metadata: Metadata = {
  title: 'Blog', description,
  alternates: { canonical: url },
  openGraph: { title: 'Blog — Emilio Sierra', description, url, type: 'website' },
  twitter: { card: 'summary', title: 'Blog — Emilio Sierra', description },
};
export default function BlogPage() { return <BlogIndex />; }
