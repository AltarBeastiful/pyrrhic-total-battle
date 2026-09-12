import { expect, test } from '@playwright/test';

test('the app loads and shows its heading', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Pyrrhic' })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
