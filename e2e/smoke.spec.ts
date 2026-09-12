/**
 * First-run smoke: the shell, the seven sections, persistence and the theme toggle (S-01 / S-52).
 * Deliberately shallow — the engine, the store and every editor have their own Vitest suites
 * (ADR-0003); what only a real browser can prove is that the assembled page comes up and survives
 * a reload.
 */
import { expect, test } from '@playwright/test';

import {
  accountButton,
  housingField,
  openAccountMenu,
  openApp,
  renameProfile,
  SECTION_TITLES,
  themeAttribute,
  waitForSaved,
  watchConsole,
} from './helpers';

test('first run shows the default profile and all seven sections', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await expect(accountButton(page)).toHaveAccessibleName('Account: My account');

  // The whole profile bar is one menu now, and the save state is one word inside it (design plan §5.2).
  const menu = await openAccountMenu(page);
  await expect(menu.getByText('Saved', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();

  for (const title of SECTION_TITLES) {
    await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
  }
  // The order is part of the flow, not an accident of the registry.
  const headings = await page.getByRole('main').getByRole('heading', { level: 2 }).allInnerTexts();
  expect(headings.map((text) => text.trim())).toEqual([...SECTION_TITLES]);

  expect(problems).toEqual([]);
});

test('the Troops card states the account as a form, and follows a tier change', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  // The army cards are the form *and* the summary: nothing to unfold, one row per group (D-22).
  const card = page.locator('#troops');
  await expect(card.getByRole('heading', { level: 2, name: 'Troops' })).toBeVisible();
  await expect(card.getByRole('group', { name: /from$/ })).toHaveCount(4);

  await card.getByRole('button', { name: 'Guardsmen to, higher' }).click();
  await expect(card.getByRole('group', { name: 'Guardsmen at G4' })).toBeVisible();

  expect(problems).toEqual([]);
});

test('what the player typed survives a reload', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await housingField(page, 'Leadership').fill('4100');
  await housingField(page, 'Authority').fill('1200');
  await renameProfile(page, 'Reloaded');
  // The store writes to localStorage debounced; the menu's status says when it has landed.
  await waitForSaved(page);

  await page.reload();
  await page.waitForLoadState('networkidle');

  await expect(accountButton(page)).toHaveAccessibleName('Account: Reloaded');
  await expect(housingField(page, 'Leadership')).toHaveValue('4100');
  await expect(housingField(page, 'Authority')).toHaveValue('1200');

  expect(problems).toEqual([]);
});

test('the theme row of the account menu flips data-theme', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  const attribute = (): Promise<string | undefined> => themeAttribute(page);
  const choose = async (name: string): Promise<void> => {
    await openAccountMenu(page);
    await page.getByRole('menuitemradio', { name }).click();
  };

  await choose('Dark');
  await expect.poll(attribute).toBe('dark');
  await choose('Light');
  await expect.poll(attribute).toBe('light');

  // "System" resolves to a concrete value; it never leaves the attribute unset.
  await choose('System');
  await expect.poll(attribute).toMatch(/^(light|dark)$/);

  expect(problems).toEqual([]);
});
