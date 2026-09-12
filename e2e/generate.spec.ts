/**
 * The calculator itself, end to end: housing in, stacks and a battle summary out, the two ways a player
 * changes the formation (a tier range, a single unit type left out), and the way a player overrules the
 * priority search — keeping a type it dropped in the march for good.
 */
import { expect, test } from '@playwright/test';

import {
  generate,
  generateButton,
  openApp,
  pageOverflowsSideways,
  priorityField,
  settle,
  stackCount,
  stackLabels,
  stackPills,
  summaryValue,
  watchConsole,
} from './helpers';

test('Generate fills the pools and produces a battle summary', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await expect(page.getByText('Nothing generated yet.')).toBeVisible();

  await generate(page, { leadership: 4100 });

  // One chip per unit type, each with a non-zero count.
  const pills = stackPills(page);
  await expect(pills.first()).toBeVisible();
  expect(await pills.count()).toBeGreaterThan(1);
  for (const label of await stackLabels(page)) {
    expect(Number(label.split(' ')[1]?.replaceAll(',', '') ?? '0')).toBeGreaterThan(0);
  }

  // Summary cards: a march that fields units always does damage, whoever strikes first.
  expect(await stackCount(page)).toBeGreaterThan(0);
  expect(await summaryValue(page, 'Damage if the monster strikes first')).toBeGreaterThan(0);
  expect(await summaryValue(page, 'Expected damage')).toBeGreaterThan(0);
  expect(await summaryValue(page, 'Damage if you strike first')).toBeGreaterThan(0);

  // The leadership pool is spent, not merely allocated.
  await expect(page.locator('#results').getByText('4,100 / 4,100')).toBeVisible();

  expect(problems).toEqual([]);
});

test('leaving a unit type out changes the stacks', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  // The first-run account fields G1–G3, so Archer III is a top-tier type of the march.
  await generate(page, { leadership: 4100 });

  const before = await stackLabels(page);
  expect(before.length).toBeGreaterThan(1);
  expect(before.some((label) => label.startsWith('ARC3'))).toBe(true);

  // "I have not upgraded my Archer III yet": one tap on the tile drops the type everywhere.
  const tile = page.locator('#troops').getByRole('button', { name: /^Archer III, tier 3/ });
  await tile.click();
  await expect(tile).toHaveAttribute('aria-pressed', 'false');
  await generate(page);

  const after = await stackLabels(page);
  expect(after.some((label) => label.startsWith('ARC3'))).toBe(false);
  expect(after).not.toEqual(before);
  // The freed leadership goes to the remaining types, so every count moves.
  expect(after.length).toBe(before.length - 1);

  expect(problems).toEqual([]);
});

test('a type the priority left out can be kept in the march, and stays in', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await priorityField(page).selectOption('minDamage');
  await generate(page, { leadership: 4100 });

  // A search wins by marching with fewer types, and the trade-off panel says what that bought (PLAN §3.6).
  await expect(page.getByRole('heading', { name: 'This selection vs all types' })).toBeVisible();
  const leftOut = page.locator('#results').getByRole('button', { name: /^Keep in march\b/ });
  await expect(leftOut.first()).toBeVisible();

  const before = await stackLabels(page);
  await leftOut.first().click();
  await settle(page);

  // Keeping a type in re-sizes the march at once, so the type it named is in the stacks now.
  const kept = await stackLabels(page);
  expect(kept.length).toBe(before.length + 1);
  const added = kept.find((label) => !before.includes(label));
  expect(added).toBeDefined();
  const pinned = page.locator('#results').getByText(/^Pinned:/);
  await expect(pinned).toContainText(added?.split(' ')[0] ?? '');

  // …and the next search may not drop it again.
  await generate(page);
  const again = await stackLabels(page);
  expect(again.length).toBe(kept.length);
  expect(again.some((label) => label.startsWith(added?.split(' ')[0] ?? ''))).toBe(true);
  await expect(pinned).toContainText(added?.split(' ')[0] ?? '');

  expect(problems).toEqual([]);
});

test('mobile: nothing overflows sideways and Generate stays reachable', async ({ page }) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);

  expect(await pageOverflowsSideways(page)).toBe(false);
  await expect(generateButton(page)).toBeVisible();

  await generate(page, { leadership: 4100, authority: 1200 });

  expect(await pageOverflowsSideways(page)).toBe(false);
  await expect(stackPills(page).first()).toBeVisible();
  await expect(generateButton(page)).toBeVisible();

  expect(problems).toEqual([]);
});
