'use client';
import Link from 'next/link';
import { workStories, workStoryPath } from '@/content/blog';
import { Text, useLanguage } from './language-provider';

export function BlogIndex() {
  const { t } = useLanguage();
  return <main id="main" className="page-shell blog-page">
    <header className="blog-heading">
      <p className="eyebrow"><Text text="Stories from the studio" /></p>
      <h1>Blog<span className="cobalt">.</span></h1>
      <p className="large-copy"><Text text="The ideas, projects, and experiences behind my work." /></p>
    </header>
    <section className="blog-stories" aria-labelledby="blog-work-title">
      <h2 id="blog-work-title" className="eyebrow"><Text text="Work" /></h2>
      <div className="blog-grid">{workStories.map(story => <article className="blog-card" key={story.slug}>
        <Link href={workStoryPath(story.slug)}>
          <span className="eyebrow"><Text text="Work" /></span>
          <h3>{t(story.title)}</h3>
          <p>{t(story.summary)}</p>
          <span className="text-link"><Text text="Read the story" /><span aria-hidden="true">↗</span></span>
        </Link>
      </article>)}</div>
    </section>
  </main>;
}
