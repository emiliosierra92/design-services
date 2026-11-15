import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { luckyStory } from '../src/content/lucky-story';

const projects = [
  { slug: 'theatrical-prop-packaging', title: 'From pixels to physical.', sections: [{ title: 'A small object. Every detail matters.', text: 'I recreated a vintage cigarette-box graphic in Adobe Photoshop for a designer to use in a theatrical prop. The artwork needed to work as a package, with components arranged to wrap around a physical form.' }] },
  { slug: 'live-sports-broadcasting', title: 'Made for the moment.', sections: [{ title: 'Before the first pitch.', text: 'Working with a small broadcast crew across Miami-Dade and Broward County, I helped set up the production site, prepare equipment and check that systems were ready to go live.' }] },
];
const workStories = [
  { slug: projects[0].slug, title: 'Theatrical prop packaging' },
  { slug: projects[1].slug, title: 'South Florida live sports broadcasting' },
  { slug: luckyStory.slug, title: luckyStory.title },
];
const homepageFeaturedSlugs = projects.map(project => project.slug);
function workStoryPath(slug: string) {
  return slug === luckyStory.slug ? '/blog/luckybird/luckysfeatherfundraiser' : `/blog/work/${slug}`;
}

test('blog lists every work story while homepage keeps only its explicit featured selection', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByRole('heading', { name: 'Blog.' })).toBeVisible();
  await expect(page.locator('.blog-card')).toHaveCount(workStories.length);
  for (const story of workStories) {
    await expect(page.locator('.blog-card a', { hasText: story.title })).toHaveAttribute('href', workStoryPath(story.slug));
  }
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Blog' })).toHaveAttribute('aria-current', 'page');
  await page.goto('/');
  await expect(page.locator('#work article.project')).toHaveCount(homepageFeaturedSlugs.length);
  for (const slug of homepageFeaturedSlugs) await expect(page.locator(`#work a[href="${workStoryPath(slug)}"]`)).toHaveCount(3);
  await expect(page.locator('#work')).not.toContainText(luckyStory.title);
  await expect(page.locator('a[href^="/work/"]')).toHaveCount(0);
});

test('old work URLs redirect permanently and existing case-study content is preserved', async ({ page, request }) => {
  for (const project of projects) {
    const redirect = await request.get(`/work/${project.slug}?source=legacy`, { maxRedirects: 0 });
    expect(redirect.status()).toBe(308);
    expect(redirect.headers().location).toBe(`${workStoryPath(project.slug)}?source=legacy`);
    await page.goto(`/work/${project.slug}`);
    await expect(page).toHaveURL(workStoryPath(project.slug));
    await expect(page.locator('h1')).toHaveText(project.title);
    for (const section of project.sections) {
      await expect(page.getByRole('heading', { name: section.title, exact: true })).toBeVisible();
      await expect(page.locator('.case-sections')).toContainText(section.text);
    }
    await expect(page.getByRole('link', { name: '← All stories' })).toHaveAttribute('href', '/blog');
    await expect(page.locator('.next-project')).toHaveAttribute('href', /^\/blog\/work\//);
  }
  expect((await request.get('/blog/work/missing-story')).status()).toBe(404);
  expect((await request.get('/blog/unapproved-category/story')).status()).toBe(404);
});

test('Lucky story includes the full supplied text and route-specific metadata', async ({ page, request }) => {
  const path = workStoryPath(luckyStory.slug);
  for (const oldPath of ['/blog/luckbird/luckysfeatherfundraiser', '/blog/work/lucky-birds-feather-fund', '/work/lucky-birds-feather-fund']) {
    const redirect = await request.get(`${oldPath}?source=legacy`, { maxRedirects: 0 });
    expect(redirect.status()).toBe(308);
    expect(redirect.headers().location).toBe(`${path}?source=legacy`);
  }
  await page.goto('/blog');
  await page.locator('.blog-card a', { hasText: luckyStory.title }).click();
  await expect(page).toHaveURL(path);
  await expect(page.locator('h1')).toHaveText(luckyStory.title);
  for (const paragraph of luckyStory.introduction) await expect(page.locator('main article')).toContainText(paragraph);
  for (const section of luckyStory.sections) {
    await expect(page.getByRole('heading', { name: section.title, exact: true })).toBeVisible();
    for (const paragraph of section.paragraphs) await expect(page.locator('main article')).toContainText(paragraph);
  }
  await expect(page.locator('.draft-note')).toContainText('dedicated page');
  await expect(page.locator('main a[href="/luckybird/"], main a[href="/luckybird"]')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'contact me through EmilioSierra.com' })).toHaveAttribute('href', '/start-a-project');
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `https://www.emiliosierra.com${path}`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://www.emiliosierra.com${path}`);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', luckyStory.summary);
});

test('blog pages fit mobile and desktop, preserve language selection, and remain accessible', async ({ page }) => {
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/blog', workStoryPath(luckyStory.slug)]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations).toEqual([]);
    }
  }
  await page.goto('/blog');
  await page.getByRole('button', { name: 'Español', exact: true }).click();
  await page.locator('.blog-card a', { hasText: 'El Fondo de Plumas' }).click();
  await expect(page.locator('h1')).toContainText('El Fondo de Plumas');
  await expect(page.getByRole('heading', { name: 'Cómo funciona la página' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('link', { name: 'contáctame a través de EmilioSierra.com' })).toHaveAttribute('href', '/start-a-project');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.screenshot({ path: 'test-results/blog-story-mobile.png', fullPage: true });
  await page.goto('/blog');
  await page.screenshot({ path: 'test-results/blog-index-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page).toHaveURL('/blog');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/blog-index-desktop.png', fullPage: true });
});
