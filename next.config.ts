import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/blog/luckbird/:path*', destination: '/blog/luckybird/:path*', permanent: true },
      { source: '/blog/work/lucky-birds-feather-fund', destination: '/blog/luckybird/luckysfeatherfundraiser', permanent: true },
      { source: '/work/lucky-birds-feather-fund', destination: '/blog/luckybird/luckysfeatherfundraiser', permanent: true },
      { source: '/work/:slug', destination: '/blog/work/:slug', permanent: true },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }];
  },
};
export default config;
