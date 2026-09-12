/**
 * Journey J3 — "my bonuses changed" (design plan §3, §7.3, story D-30).
 *
 * Open Bonuses, find the captain, change its level, check the TOTAL moved. The card is one line
 * until it is unfolded, the sources are rows with a switch and a gear, and the editor is a sheet
 * that repeats the TOTAL so the figures are visible while they move.
 */
import { expect, test } from '@playwright/test';

import {
  addCaptain,
  bonusesCard,
  bonusesDisclosure,
  bonusTotal,
  openApp,
  openBonuses,
  openSourceEditor,
  sourceSwitch,
  toggleSource,
  waitForSaved,
  watchConsole,
} from './helpers';

test('the card is the TOTAL until it is opened', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  const card = bonusesCard(page);
  await expect(card.getByRole('heading', { level: 2, name: 'Bonuses' })).toBeVisible();
  await expect(bonusesDisclosure(page)).toHaveAttribute('aria-expanded', 'false');

  // Three labelled figures and the count of sources on, all visible without opening anything.
  expect(await bonusTotal(page, 'Health')).toBe('0 %');
  expect(await bonusTotal(page, 'Strength')).toBe('0 %');
  expect(await bonusTotal(page, 'Special')).toBe('0 %');
  expect(await bonusTotal(page, 'Sources on')).toBe('3');

  expect(problems).toEqual([]);
});

test('a captain added and levelled moves the TOTAL, and its switch takes it out again', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await openBonuses(page);

  // Beowulf gives the whole army 1 % of health and of strength per level.
  await addCaptain(page, 'Beowulf', 20);
  await expect(sourceSwitch(page, 'Beowulf')).toBeChecked();
  expect(await bonusTotal(page, 'Health')).toBe('+20 %');

  // The gear opens a sheet carrying the same figures; they move as the level does.
  const sheet = await openSourceEditor(page, 'Beowulf');
  await expect(sheet.getByRole('heading', { name: 'Beowulf' })).toBeVisible();
  const level = sheet.getByRole('textbox', { name: 'Base level' });
  await level.fill('30');
  await level.blur();
  await expect(sheet.locator('[aria-label="Army bonus totals"]')).toContainText('+30 %');
  await sheet.getByRole('button', { name: 'Done' }).click();
  await expect(sheet).toBeHidden();

  expect(await bonusTotal(page, 'Health')).toBe('+30 %');

  await toggleSource(page, 'Beowulf');
  await expect(sourceSwitch(page, 'Beowulf')).not.toBeChecked();
  expect(await bonusTotal(page, 'Health')).toBe('0 %');

  expect(problems).toEqual([]);
});

test('the card remembers being open, and the sources survive a reload', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await openBonuses(page);
  await addCaptain(page, 'Beowulf', 12);
  await waitForSaved(page);

  await page.reload();
  await page.waitForLoadState('networkidle');

  await expect(bonusesDisclosure(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(sourceSwitch(page, 'Beowulf')).toBeChecked();
  expect(await bonusTotal(page, 'Health')).toBe('+12 %');

  expect(problems).toEqual([]);
});
