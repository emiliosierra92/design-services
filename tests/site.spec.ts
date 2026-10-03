import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('all routes render with no critical accessibility violations', async ({ page }) => {
  for (const path of ['/', '/work/theatrical-prop-packaging', '/work/live-sports-broadcasting', '/start-a-project']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  }
  expect((await page.goto('/work/missing-project'))?.status()).toBe(404);
});
test('layouts fit representative viewports', async ({ page }) => {
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
});
test('mobile menu contains focus, closes on Escape, and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Menu', exact: true });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: /Services/ }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page).toHaveURL(/#services$/);
});
test('unconfigured inquiry form cannot send or claim success', async ({ page }) => {
  await page.goto('/start-a-project');
  let posts = 0;
  page.on('request', request => { if (request.method() === 'POST') posts++; });
  await expect(page.getByRole('button', { name: 'Send inquiry' })).toBeDisabled();
  await expect(page.locator('.form-notice')).toContainText('Your inquiry has not been sent');
  expect(posts).toBe(0);
});
