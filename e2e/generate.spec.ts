/**
 * The calculator itself, end to end: housing in, stacks and a battle summary out, and the two ways a
 * player changes the formation (a tier range, a single unit type left out).
 */
import { expect, test } from '@playwright/test';

import {
  generate,
  generateButton,
  openApp,
  pageOverflowsSideways,
  stackPills,
  summaryValue,
  watchConsole,
} from './helpers';

test('Generate fills the pools and produces a battle summary', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await expect(page.getByText('Nothing generated yet.')).toBeVisible();

  await generate(page, { leadership: 4100 });

  // One pill per unit type, each with a non-zero count.
  const pills = stackPills(page);
  await expect(pills.first()).toBeVisible();
  expect(await pills.count()).toBeGreaterThan(1);
  for (const label of await pills.allInnerTexts()) {
    expect(Number(label.split('\n')[1]?.replaceAll(',', '') ?? '0')).toBeGreaterThan(0);
  }

  // Summary cards: a march that fields units always does damage, whoever strikes first.
  expect(await summaryValue(page, 'Stacks')).toBeGreaterThan(0);
  expect(await summaryValue(page, 'Minimum damage')).toBeGreaterThan(0);
  expect(await summaryValue(page, 'Average damage')).toBeGreaterThan(0);
  expect(await summaryValue(page, 'Maximum damage')).toBeGreaterThan(0);

  // The leadership pool is spent, not merely allocated.
  await expect(page.locator('#results').getByText('4,100 / 4,100')).toBeVisible();

  expect(problems).toEqual([]);
});

test('changing the housing and leaving a unit type out changes the stacks', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await page.getByRole('combobox', { name: 'Guardsmen lowest tier' }).selectOption('1');
  await page.getByRole('combobox', { name: 'Guardsmen highest tier' }).selectOption('3');
  await generate(page, { leadership: 4100 });

  const before = await stackPills(page).allInnerTexts();
  expect(before.length).toBeGreaterThan(1);
  expect(before.some((label) => label.startsWith('ARC3'))).toBe(true);

  // "I have not upgraded my Archer III yet": one tap in the Troops grid drops the type everywhere.
  await page.locator('#troops').getByRole('button', { name: 'Archer III', exact: true }).click();
  await expect(
    page.locator('#troops').getByRole('button', { name: 'Archer III', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await generate(page);

  const after = await stackPills(page).allInnerTexts();
  expect(after.some((label) => label.startsWith('ARC3'))).toBe(false);
  expect(after).not.toEqual(before);
  // The freed leadership goes to the remaining types, so every count moves.
  expect(after.length).toBe(before.length - 1);

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
