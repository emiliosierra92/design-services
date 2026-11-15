import type { MetadataRoute } from 'next';
import { workStories, workStoryPath } from '@/content/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = 'https://www.emiliosierra.com';

  return [
    { url: `${origin}/` },
    { url: `${origin}/start-a-project` },
    { url: `${origin}/blog` },
    { url: `${origin}/luckybird` },
    ...workStories.map(({ slug }) => ({ url: `${origin}${workStoryPath(slug)}` })),
  ];
}
