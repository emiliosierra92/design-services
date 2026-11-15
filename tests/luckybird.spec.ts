import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage keeps Lucky in navigation without a separate feature section', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.lucky-home-feature')).toHaveCount(0);
  const feature = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: "Lucky Bird's Feather Fundraiser!" });
  await expect(feature).toHaveAttribute('href', /^\/luckybird\/?$/);
  await expect(page.locator('#work article.project')).toHaveCount(2);
  await feature.click();
  await expect(page).toHaveURL(/\/luckybird$/);
  await expect(page.locator('h1')).toContainText('Little bird.');
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: "Lucky Bird's Feather Fundraiser!" })).toHaveAttribute('href', /^\/luckybird\/?$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.emiliosierra.com/luckybird');
});

test('product expectations and unavailable checkout are honest without server configuration', async ({ page, request }) => {
  await page.goto('/luckybird');
  await expect(page.getByRole('heading', { name: 'Lucky Bird’s Feather Surprise 🪶' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Get a feather surprise — $10' })).toBeDisabled();
  await expect(page.locator('#feather-surprise')).toContainText('not guaranteed');
  await expect(page.locator('#feather-surprise')).toContainText('no cash prizes');
  await expect(page.locator('#feather-surprise')).toContainText('not a tax-deductible donation');
  await expect(page.locator('.lucky-hero-art img')).toBeVisible();
  await expect(page.locator('.lucky-album img')).toBeVisible();
  await expect(page.locator('.lucky-posts')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Send for review' })).toBeDisabled();
  const checkout = await request.post('/api/luckybird/checkout', { data: { requestId: '7e728f64-6c71-4a68-b457-18d1fd2f48b9', price: 1 } });
  expect(checkout.status()).toBe(503);
  expect(await checkout.json()).not.toHaveProperty('url');
  const community = await request.post('/api/luckybird/community', { data: { message: 'This should not be accepted without configuration.' } });
  expect(community.status()).toBe(503);
});

test('return and cancellation URLs cannot manufacture a payment confirmation', async ({ page }) => {
  await page.goto('/luckybird?checkout=return&session_id=cs_test_unit_fixture');
  await expect(page.locator('.lucky-purchase [role="status"]')).toContainText('still pending');
  await expect(page.locator('main')).not.toContainText('Your payment is confirmed.');
  await page.goto('/luckybird?checkout=canceled');
  await expect(page.locator('.lucky-purchase [role="status"]')).toContainText('Checkout was closed');
});

test('Lucky’s page and navigation are accessible, bilingual and fit representative viewports', async ({ page }) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/luckybird');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: 'Español', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cuidarlo es lo que importa.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Recibe una sorpresa de plumas — $10' })).toBeDisabled();
  const spanish = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(spanish.violations).toEqual([]);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.screenshot({ path: 'test-results/luckybird-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const luckyLink = page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: "Lucky Bird's Feather Fundraiser!" });
  await expect(luckyLink).toBeVisible();
  await luckyLink.click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/luckybird-desktop.png', fullPage: true });
});
