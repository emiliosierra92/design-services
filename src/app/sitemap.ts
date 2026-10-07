import type { MetadataRoute } from 'next';
import { projects } from '@/content/studio';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = 'https://www.emiliosierra.com';

  return [
    { url: `${origin}/` },
    { url: `${origin}/start-a-project` },
    ...projects.map(({ slug }) => ({ url: `${origin}/work/${slug}` })),
  ];
}
