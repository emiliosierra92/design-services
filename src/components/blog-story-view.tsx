'use client';
import Link from 'next/link';
import type { EditorialWorkStory } from '@/content/blog';
import { Text, useLanguage } from './language-provider';

function StoryParagraph({ text }: { text: string }) {
  const { t } = useLanguage();
  const translated = t(text);
  const luckyAddress = 'emiliosierra.com/luckybird';
  if (translated.includes(luckyAddress)) {
    const position = translated.indexOf(luckyAddress);
    return <p>{translated.slice(0, position)}<Link className="story-inline-link" href="/luckybird/">{luckyAddress}</Link>{translated.slice(position + luckyAddress.length)}</p>;
  }
  const contactLabel = t('contact me through EmilioSierra.com');
  const position = translated.indexOf(contactLabel);
  if (position === -1) return <p>{translated}</p>;
  return <p>{translated.slice(0, position)}<Link className="story-inline-link" href="/start-a-project">{contactLabel}</Link>{translated.slice(position + contactLabel.length)}</p>;
}

export function BlogStoryView({ story }: { story: EditorialWorkStory }) {
  const { t } = useLanguage();
  return <main id="main" className="case-study page-shell blog-story">
    <Link className="text-link" href="/blog"><Text text="← All stories" /></Link>
    <article>
      <p className="eyebrow case-label"><Text text="Work" /></p>
      <h1>{t(story.title)}</h1>
      {story.notice && <p className="draft-note">{t(story.notice)}</p>}
      <div className="story-introduction">{story.introduction.map(paragraph => <p key={paragraph}>{t(paragraph)}</p>)}</div>
      <div className="case-sections">{story.sections.map(section => <section key={section.title}>
        <p className="eyebrow"><Text text="The story" /></p>
        <div><h2>{t(section.title)}</h2>{section.paragraphs.map(paragraph => <StoryParagraph key={paragraph} text={paragraph} />)}</div>
      </section>)}</div>
    </article>
    <Link className="text-link" href="/blog"><Text text="← All stories" /></Link>
  </main>;
}
