import type { MetadataRoute } from 'next';
// Keep the pre-final prototype out of search results until the launch review.
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: '*', disallow: '/' } }; }
