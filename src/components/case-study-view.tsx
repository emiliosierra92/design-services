'use client';
import Link from 'next/link';
import Image from 'next/image';
import { projects } from '@/content/studio';
import { MediaPlaceholder } from '@/components/media-placeholder';
import { Text, useLanguage } from '@/components/language-provider';
export function CaseStudyView({ index }: { index: number }) {
  const { t } = useLanguage();
  const entry = projects[index];
  const next = projects[(index + 1) % projects.length];
  return <main id="main" className="case-study page-shell"><Link className="text-link" href="/#work"><Text text="← All work" /></Link><p className="eyebrow case-label"><Text text="Project" /> — {t(entry.discipline)}</p><h1>{t(entry.title)}</h1><p className="large-copy">{t(entry.name)}</p><p className="draft-note"><Text text="Case-study draft · Media, credits and publication details pending approval." /></p>{entry.image ? <Image className="project-image" src={entry.image.src} alt={t(entry.image.alt)} sizes="90vw" placeholder="blur" /> : <MediaPlaceholder label={t(entry.media)} kind={index === 0 ? 'artwork' : 'broadcast'} />}<div className="case-sections">{entry.sections.map(s => <section key={s.title}><p className="eyebrow"><Text text="The story" /></p><div><h2>{t(s.title)}</h2><p>{t(s.text)}</p></div></section>)}</div><Link className="next-project" href={`/work/${next.slug}`}><span className="eyebrow"><Text text="Next project ↗" /></span><span>{t(next.name)}</span></Link></main>;
}
