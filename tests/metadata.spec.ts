import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('homepage emits unique SEO and social metadata and serves the original image', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('title')).toHaveCount(1);
  await expect(page).toHaveTitle('Emilio Sierra | Creative Technology Studio in Miami');

  const tags = {
    'meta[name="description"]': 'Emilio Sierra is a Miami-based creative technologist designing and building websites, applications, graphic design and video experiences. Explore my work and start a project.',
    'meta[name="robots"]': 'index, follow',
    'meta[property="og:title"]': 'Emilio Sierra — Creative Technology Studio',
    'meta[property="og:description"]': 'I use design and technology to turn ideas and everyday problems into useful experiences. Explore my work in web development, graphic design and video production.',
    'meta[property="og:url"]': 'https://emiliosierra.com',
    'meta[property="og:site_name"]': 'Emilio Sierra',
    'meta[property="og:type"]': 'website',
    'meta[property="og:image"]': 'https://emiliosierra.com/images/emilio-sierra-social.png',
    'meta[property="og:image:width"]': '1734',
    'meta[property="og:image:height"]': '907',
    'meta[property="og:image:type"]': 'image/png',
    'meta[property="og:image:alt"]': 'Emilio Sierra — Creative Technology Studio in Miami',
    'meta[name="twitter:card"]': 'summary_large_image',
    'meta[name="twitter:title"]': 'Emilio Sierra — Creative Technology Studio',
    'meta[name="twitter:description"]': 'I use design and technology to turn ideas and everyday problems into useful experiences. Explore my work in web development, graphic design and video production.',
    'meta[name="twitter:image"]': 'https://emiliosierra.com/images/emilio-sierra-social.png',
    'meta[name="twitter:image:alt"]': 'Emilio Sierra — Creative Technology Studio in Miami',
  };
  for (const [selector, content] of Object.entries(tags)) {
    await expect(page.locator(selector)).toHaveCount(1);
    await expect(page.locator(selector)).toHaveAttribute('content', content);
  }
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://emiliosierra.com');

  const image = await request.get('/images/emilio-sierra-social.png');
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/png');
  expect(await image.body()).toEqual(readFileSync('public/images/emilio-sierra-social.png'));
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Allow: /');
  expect(await robots.text()).not.toContain('Disallow: /');
});

test('homepage metadata does not override existing page-specific metadata', async ({ page }) => {
  const routes = [
    ['/start-a-project', 'Start a project — Emilio Sierra', 'Bring your idea to Emilio Sierra’s independent creative technology studio.'],
    ['/work/theatrical-prop-packaging', 'Theatrical prop packaging — Emilio Sierra', 'Recreating vintage packaging for a life on stage.'],
    ['/work/live-sports-broadcasting', 'South Florida live sports broadcasting — Emilio Sierra', 'Behind the scenes of live high-school baseball in South Florida.'],
  ];
  for (const [path, title, description] of routes) {
    await page.goto(path);
    await expect(page.locator('title')).toHaveCount(1);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  }
});
