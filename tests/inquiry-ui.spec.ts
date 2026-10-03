import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.skip(process.env.INQUIRY_UI_TEST !== '1', 'Run with a configured, isolated test server and mocked email responses.');
async function complete(page: import('@playwright/test').Page) {
  await page.getByLabel('Your name').fill('Test visitor');
  await page.getByLabel('Email address').fill('test@example.com');
  await page.getByLabel('Graphic Design', { exact: true }).check();
  await page.getByLabel('Tell me about your project').fill('A test project.');
}
test('validation focuses the invalid field without submitting', async ({ page }) => {
  let posts = 0;
  await page.route('**/api/inquiry', route => { posts++; return route.fulfill({ json: { ok: true } }); });
  await page.goto('/start-a-project');
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByLabel('Your name')).toBeFocused();
  await expect(page.getByLabel('Your name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('status')).toContainText('Please check');
  expect(posts).toBe(0);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
});
test('pending submission prevents duplicates and confirms only after acceptance', async ({ page }) => {
  let posts = 0;
  let release: () => void = () => {};
  const accepted = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/inquiry', async route => { posts++; await accepted; await route.fulfill({ json: { ok: true } }); });
  await page.goto('/start-a-project'); await complete(page);
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  await expect(page.getByRole('status')).not.toContainText('submitted');
  release();
  await expect(page.getByRole('status')).toContainText('has been submitted');
  await expect(page.getByRole('status')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Inquiry submitted' })).toBeDisabled();
  expect(posts).toBe(1);
});
test('a failed inquiry retains values and uses the same idempotency ID on retry', async ({ page }) => {
  const ids: string[] = [];
  await page.route('**/api/inquiry', route => {
    ids.push(route.request().postDataJSON().requestId);
    return route.fulfill({ status: ids.length === 1 ? 502 : 200, json: ids.length === 1 ? { error: 'Your inquiry could not be sent. Please try again.' } : { ok: true } });
  });
  await page.goto('/start-a-project'); await complete(page);
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('status')).toContainText('could not be sent');
  await expect(page.getByLabel('Your name')).toHaveValue('Test visitor');
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('status')).toContainText('has been submitted');
  expect(ids).toHaveLength(2); expect(ids[0]).toBe(ids[1]);
});
test('Spanish inquiry labels and validation remain translated', async ({ page }) => {
  await page.goto('/start-a-project');
  await page.getByRole('button', { name: 'Español', exact: true }).click();
  await page.getByRole('button', { name: 'Enviar consulta' }).click();
  await expect(page.getByLabel('Tu nombre')).toBeFocused();
  await expect(page.getByRole('status')).toContainText('Revisa los campos');
});
