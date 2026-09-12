/**
 * First-run smoke: the shell, the seven sections, persistence and the theme toggle (S-01 / S-52).
 * Deliberately shallow — the engine, the store and every editor have their own Vitest suites
 * (ADR-0003); what only a real browser can prove is that the assembled page comes up and survives
 * a reload.
 */
import { expect, test } from '@playwright/test';

import { housingField, openApp, SECTION_TITLES, themeAttribute, watchConsole } from './helpers';

test('first run shows the default profile and all seven sections', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await expect(page.getByRole('combobox', { name: 'Active profile' })).toHaveText('My account');
  await expect(page.getByText('Saved in this browser')).toBeVisible();

  for (const title of SECTION_TITLES) {
    await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
  }
  // The order is part of the flow, not an accident of the registry.
  const headings = await page.getByRole('main').getByRole('heading', { level: 2 }).allInnerTexts();
  expect(headings.map((text) => text.trim())).toEqual([...SECTION_TITLES]);

  expect(problems).toEqual([]);
});

test('the Troops header says what the account fields, and follows a tier change', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  // The summary is always visible, so a collapsed section still says what it holds (S-01, docs/design.md §7).
  const summary = page.locator('#troops-summary');
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('Guardsmen G1');
  const before = (await summary.innerText()).trim();

  await page.getByRole('combobox', { name: 'Guardsmen highest tier' }).selectOption('5');

  await expect(summary).toContainText('Guardsmen G1–G5');
  expect((await summary.innerText()).trim()).not.toEqual(before);

  // It keeps saying it with the body folded away.
  await page.getByRole('button', { name: 'Troops', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Troops', exact: true })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('Guardsmen G1–G5');

  expect(problems).toEqual([]);
});

test('what the player typed survives a reload', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await housingField(page, 'Leadership').fill('4100');
  await housingField(page, 'Authority').fill('1200');
  await page.getByRole('button', { name: 'Rename profile' }).click();
  await page.getByLabel('Profile name').fill('Reloaded');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  // The store writes to localStorage debounced; the indicator stamps the time once it lands.
  await expect(page.getByText(/^Saved \d/)).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('combobox', { name: 'Active profile' })).toHaveText('Reloaded');
  await expect(housingField(page, 'Leadership')).toHaveValue('4100');
  await expect(housingField(page, 'Authority')).toHaveValue('1200');

  expect(problems).toEqual([]);
});

test('the theme toggle flips data-theme', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  const theme = page.getByRole('combobox', { name: 'Theme' });
  const attribute = (): Promise<string | undefined> => themeAttribute(page);

  await theme.selectOption('dark');
  await expect.poll(attribute).toBe('dark');
  await theme.selectOption('light');
  await expect.poll(attribute).toBe('light');

  // "System" resolves to a concrete value; it never leaves the attribute unset.
  await theme.selectOption('system');
  await expect.poll(attribute).toMatch(/^(light|dark)$/);

  expect(problems).toEqual([]);
});
