/**
 * Journey J3 — "my bonuses changed" (design plan §3, §7.3, stories D-30 and D-33).
 *
 * Open Bonuses, find the captain, change its level, check the TOTAL moved. The card is one line
 * until it is unfolded; captains and the hero are a grid of tiles — tap one to send it on this
 * march, tap its badge to say what level it is — and every other source is a row with a switch and
 * a gear whose editor repeats the TOTAL, so the figures are visible while they move.
 */
import { expect, test } from '@playwright/test';

import {
  bonusesCard,
  bonusesDisclosure,
  bonusTotal,
  captainBadge,
  captainTile,
  enlistCaptain,
  openApp,
  openBonuses,
  setCaptainLevel,
  toggleCaptain,
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

test('a captain enlisted and levelled through its badge moves the TOTAL', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await openBonuses(page);

  // Every captain is already on screen: the grid is the form, so there is nothing to add.
  await expect(bonusesCard(page).getByRole('button', { name: 'Add captain' })).toHaveCount(0);
  await expect(captainTile(page, 'Beowulf')).toHaveAttribute('aria-pressed', 'false');
  await expect(captainBadge(page, 'Beowulf')).toHaveText('Set level');

  // Beowulf gives the whole army 1 % of health and of strength per level, plus 210 % at three stars.
  await toggleCaptain(page, 'Beowulf');
  await expect(captainTile(page, 'Beowulf')).toHaveAttribute('aria-pressed', 'true');

  await setCaptainLevel(page, 'Beowulf', 20, 3);
  await expect(captainBadge(page, 'Beowulf')).toHaveText('20 ★3');
  expect(await bonusTotal(page, 'Health')).toBe('+230 %');
  expect(await bonusTotal(page, 'Strength')).toBe('+230 %');

  // The badge is its own target: opening it again never changes who marches.
  await captainBadge(page, 'Beowulf').click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { name: 'Beowulf' })).toBeVisible();
  await expect(sheet.locator('[aria-label="Army bonus totals"]')).toContainText('+230 %');
  await sheet.getByRole('button', { name: 'Done' }).click();
  await expect(sheet).toBeHidden();
  await expect(captainTile(page, 'Beowulf')).toHaveAttribute('aria-pressed', 'true');

  // And the tile takes it out again.
  await toggleCaptain(page, 'Beowulf');
  await expect(captainTile(page, 'Beowulf')).toHaveAttribute('aria-pressed', 'false');
  expect(await bonusTotal(page, 'Health')).toBe('0 %');

  expect(problems).toEqual([]);
});

test('the fourth captain is refused, in one line', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await openBonuses(page);

  for (const name of ['Beowulf', 'Aydae', 'Skadi']) await toggleCaptain(page, name);
  await toggleCaptain(page, 'Brann');

  await expect(
    bonusesCard(page).getByRole('status').filter({ hasText: 'Three captains at most' }),
  ).toContainText('Three captains at most; take one out first');
  await expect(captainTile(page, 'Brann')).toHaveAttribute('aria-pressed', 'false');

  expect(problems).toEqual([]);
});

test('the card remembers being open, and the sources survive a reload', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await openBonuses(page);
  await enlistCaptain(page, 'Beowulf', 12);
  await waitForSaved(page);

  await page.reload();
  await page.waitForLoadState('networkidle');

  await expect(bonusesDisclosure(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(captainTile(page, 'Beowulf')).toHaveAttribute('aria-pressed', 'true');
  await expect(captainBadge(page, 'Beowulf')).toHaveText('12 ★0');
  expect(await bonusTotal(page, 'Health')).toBe('+12 %');

  expect(problems).toEqual([]);
});
