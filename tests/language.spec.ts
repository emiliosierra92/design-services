import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('footer language choice translates routes and survives reloads', async ({ page }) => {
  await page.goto('/');
  const spanish = page.getByRole('button', { name: 'Español', exact: true });
  await spanish.click();
  await expect(spanish).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { name: 'Ideas hechas realidad.' })).toBeVisible();
  await page.getByRole('link', { name: 'Explora la historia' }).nth(1).click();
  await expect(page).toHaveURL(/\/work\/live-sports-broadcasting$/);
  await expect(page.getByRole('heading', { name: 'Creado para el momento.', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Antes del primer lanzamiento.' })).toBeVisible();
  await page.locator('footer').getByRole('link', { name: 'Inicia un proyecto' }).click();
  await page.getByLabel('Tu nombre').fill('Nombre de prueba');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByLabel('Your name')).toHaveValue('Nombre de prueba');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.reload();
  await expect(page.getByLabel('Your name')).toBeVisible();
});

test('Spanish layouts fit mobile and desktop and remain accessible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Español', exact: true }).click();
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/work/live-sports-broadcasting', '/start-a-project']) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      const overflow = await page.evaluate(() => [...document.querySelectorAll('main *, footer *')].filter(element => element.getBoundingClientRect().right > innerWidth + 1).map(element => ({ tag: element.tagName, class: element.className, text: element.textContent?.slice(0, 60) })));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), JSON.stringify({ width, path, overflow })).toBe(true);
    }
  }
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menú', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Navegación móvil' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('footer').screenshot({ path: 'test-results/footer-spanish-mobile.png' });
});
