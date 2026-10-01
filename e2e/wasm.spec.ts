/**
 * The engine runs on WebAssembly only (W16 E3 S2): a browser without it gets one panel that says so, and
 * none of the app. The stub runs before any page script, so `loadKernel` in `src/main.tsx` finds no
 * `WebAssembly` exactly as an old or locked-down browser would.
 */
import { expect, test } from '@playwright/test';

import { watchConsole } from './helpers';

test('a browser without WebAssembly gets the WebAssembly-required panel and no app', async ({ page }) => {
  await page.addInitScript(() => {
    delete (globalThis as { WebAssembly?: unknown }).WebAssembly;
  });
  const problems = watchConsole(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'WebAssembly required' })).toBeVisible();
  await expect(page.getByText(/allow WebAssembly for this site/)).toBeVisible();
  // Nothing of the app behind it: no setup section, no Generate.
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /generate/i })).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('with WebAssembly the app mounts with the kernel loaded', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'WebAssembly required' })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
});
