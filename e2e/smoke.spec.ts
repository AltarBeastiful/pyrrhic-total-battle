/**
 * First-run smoke: the frame, the cards, persistence and the theme row (S-01 / S-52).
 * Deliberately shallow — the engine, the store and every editor have their own Vitest suites
 * (ADR-0003); what only a real browser can prove is that the assembled page comes up, changes
 * shape at 1200 px the way frame V1 says it does, and survives a reload.
 */
import { expect, test } from '@playwright/test';

import {
  accountButton,
  fillHousing,
  generateControl,
  housingField,
  marchPane,
  openAccountMenu,
  openApp,
  recapSummary,
  renameProfile,
  SETUP_TITLES,
  themeAttribute,
  waitForSaved,
  watchConsole,
} from './helpers';

const PHONE = { width: 390, height: 844 };

test('first run shows the default profile and the setup cards', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await expect(accountButton(page)).toHaveAccessibleName('Account: My account');

  // The whole profile bar is one menu now, and the save state is one word inside it (design plan §5.2).
  const menu = await openAccountMenu(page);
  await expect(menu.getByText('Saved', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();

  for (const title of SETUP_TITLES) {
    await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
  }
  // The order is part of the flow, not an accident of the registry. The March is the fifth section
  // and lives in the supporting pane at this width, so it is asked for below rather than here.
  const headings = await page.getByRole('main').getByRole('heading', { level: 2 }).allInnerTexts();
  expect(headings.map((text) => text.trim()).slice(0, SETUP_TITLES.length)).toEqual([...SETUP_TITLES]);

  expect(problems).toEqual([]);
});

test('the answer and Generate travel together: pane on a desktop, bottom bar on a phone', async ({
  page,
}) => {
  const problems = watchConsole(page);
  await openApp(page);

  // 1280 px (the default viewport): M3's supporting pane, sticky under the 64 px app bar.
  await expect(marchPane(page)).toBeVisible();
  await expect(generateControl(page)).toHaveCount(1);
  await expect(recapSummary(page)).toBeHidden();
  const sticky = await marchPane(page).evaluate((node) => {
    const view = globalThis as unknown as { getComputedStyle: (element: unknown) => { position: string } };
    return view.getComputedStyle(node).position;
  });
  expect(sticky).toBe('sticky');

  // 390 px: one column, and the answer moves into the Material bottom app bar with Generate.
  await page.setViewportSize(PHONE);
  await expect(marchPane(page)).toHaveCount(0);
  await expect(recapSummary(page)).toBeVisible();
  await expect(generateControl(page)).toHaveCount(1);

  // Tapping the summary opens the recap sheet; the bar stays under it (investigation 0009).
  await recapSummary(page).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { name: 'March' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();

  expect(problems).toEqual([]);
});

test('the Troops card states the account as a form, and follows a tier change', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  // The army cards are the form *and* the summary: nothing to unfold, one row per group (D-22) —
  // a tier at each end of the range, and the chips of the top tier beside them.
  const card = page.locator('#troops');
  await expect(card.getByRole('heading', { level: 2, name: 'Troops' })).toBeVisible();
  await expect(card.getByRole('combobox', { name: /(from|to)$/ })).toHaveCount(8);

  await card.getByRole('combobox', { name: 'Guardsmen to' }).selectOption('G4');
  await expect(card.getByRole('group', { name: 'Guardsmen at G4' })).toBeVisible();

  expect(problems).toEqual([]);
});

test('what the player typed survives a reload', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await fillHousing(page, 'Leadership', 4100);
  await fillHousing(page, 'Authority', 1200);
  await renameProfile(page, 'Reloaded');
  // The store writes to localStorage debounced; the menu's status says when it has landed.
  await waitForSaved(page);

  await page.reload();
  await page.waitForLoadState('networkidle');

  await expect(accountButton(page)).toHaveAccessibleName('Account: Reloaded');
  // The housing fields print a capacity the way a player reads it: grouped. Which character does
  // the grouping is the theme's business (a thin space today), so the digits are what is asked for.
  for (const [pool, digits] of [
    ['Leadership', '4100'],
    ['Authority', '1200'],
  ] as const) {
    await expect
      .poll(async () => (await housingField(page, pool).inputValue()).replace(/\D/g, ''))
      .toBe(digits);
  }

  expect(problems).toEqual([]);
});

test('the theme row of the account menu flips data-theme', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  const attribute = (): Promise<string | undefined> => themeAttribute(page);
  const choose = async (name: string): Promise<void> => {
    const menu = await openAccountMenu(page);
    // Kit2's segmented row is a radio group inside the menu, not a menu item of its own; the input
    // itself is the hidden half of a segmented control, so the press lands on the label a player
    // sees — which is what a player presses too.
    await menu.getByRole('radiogroup', { name: 'Theme' }).getByText(name, { exact: true }).click();
    await page.keyboard.press('Escape');
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
