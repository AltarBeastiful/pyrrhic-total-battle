/**
 * The calculator itself, end to end: housing in, a march out, the two ways a player changes what it
 * fields (a tier range in Troops, a tile in the March card), the way they overrule the priority
 * search — keeping a type it dropped in for good — and the two things they do with the answer:
 * read the counts and edit one by hand.
 */
import { expect, test } from '@playwright/test';

import {
  chooseObjective,
  countsList,
  countsTable,
  generate,
  generateButton,
  leftOutTiles,
  openApp,
  pageOverflowsSideways,
  settle,
  stackCount,
  stackLabels,
  stackPills,
  summaryValue,
  watchConsole,
} from './helpers';

test('Generate fills the pools and produces the recap and the counts', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await expect(page.getByText('Nothing generated yet.')).toBeVisible();

  await generate(page, { leadership: 4100 });

  // One tile per unit type of the march, each with a non-zero count.
  const tiles = stackPills(page);
  await expect(tiles.first()).toBeVisible();
  expect(await tiles.count()).toBeGreaterThan(1);
  for (const label of await stackLabels(page)) {
    expect(Number(label.split(' ')[1]?.replaceAll(',', '') ?? '0')).toBeGreaterThan(0);
  }
  expect(await stackCount(page)).toBeGreaterThan(0);

  // The recap: a march that fields units always does damage, whoever strikes first.
  expect(await summaryValue(page, 'Expected damage')).toBeGreaterThan(0);
  expect(await summaryValue(page, 'Damage if the monster strikes first')).toBeGreaterThan(0);
  expect(await summaryValue(page, 'Silver to recover')).toBeGreaterThan(0);

  // The counts to copy carry the same stacks, in the order they fall. At 1280 px the March is the
  // 360 dp supporting pane, so the card is in its stacked shape whatever the window says.
  await expect(countsTable(page)).toBeHidden();
  await expect(countsList(page).getByRole('listitem')).toHaveCount(await stackCount(page));

  // The leadership pool is spent, not merely allocated.
  await expect(page.locator('#results').getByText('4,100 / 4,100')).toBeVisible();

  // The story and the chart are folded away until they are asked for.
  await expect(page.getByRole('button', { name: /^Details/ }).last()).toHaveAttribute(
    'aria-expanded',
    'false',
  );

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

test('a tile in the March card leaves a type out, and puts it back', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await generate(page, { leadership: 4100 });
  const before = await stackLabels(page);
  const code = before[0]?.split(' ')[0] ?? '';
  expect(code).not.toBe('');

  // The tile is the control: a tap on a marching one leaves that type out and re-sizes the march.
  await stackPills(page).first().click();
  await settle(page);
  const without = await stackLabels(page);
  expect(without.some((label) => label.startsWith(`${code} `))).toBe(false);
  expect(without.length).toBe(before.length - 1);

  // The same tile, now dimmed, puts it back — and keeps it in for good.
  await leftOutTiles(page).first().click();
  await settle(page);
  expect((await stackLabels(page)).length).toBe(before.length);

  expect(problems).toEqual([]);
});

test('a type the priority left out can be kept in the march, and stays in', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await chooseObjective(page, 'Best worst case');
  await generate(page, { leadership: 4100 });

  // A search wins by marching with fewer types, and the strip says what that bought (PLAN §3.6).
  await expect(page.getByRole('heading', { name: 'Compared with all types' })).toBeVisible();
  const leftOut = leftOutTiles(page);
  await expect(leftOut.first()).toBeVisible();

  const before = await stackLabels(page);
  await leftOut.first().click();
  await settle(page);

  // Keeping a type in re-sizes the march at once, so the type it named is in the stacks now.
  const kept = await stackLabels(page);
  expect(kept.length).toBe(before.length + 1);
  const added = kept.find((label) => !before.includes(label));
  expect(added).toBeDefined();
  const code = added?.split(' ')[0] ?? '';

  // …and it says so on its own tile: kept in, whatever the next search would prefer.
  await expect(page.locator('#results').getByRole('button', { name: /kept in — leave out$/ })).toBeVisible();

  await generate(page);
  const again = await stackLabels(page);
  expect(again.length).toBe(kept.length);
  expect(again.some((label) => label.startsWith(`${code} `))).toBe(true);

  expect(problems).toEqual([]);
});

test('a card wider than 36 rem draws the counts as a table', async ({ page }) => {
  const problems = watchConsole(page);
  // One column, so the card is as wide as the page: the container query gives it the table.
  await page.setViewportSize({ width: 1024, height: 900 });
  await openApp(page);
  await generate(page, { leadership: 4100 });

  const table = countsTable(page);
  await expect(table).toBeVisible();
  await expect(table.getByRole('row')).toHaveCount((await stackCount(page)) + 1);
  await expect(table.getByRole('columnheader', { name: 'Count' })).toBeVisible();
  await expect(countsList(page)).toBeHidden();

  expect(problems).toEqual([]);
});

test('counts are edited in an explicit mode, and put back with Undo', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await generate(page, { leadership: 4100 });

  const damage = await summaryValue(page, 'Expected damage');
  const rows = countsList(page);
  await expect(rows.getByRole('textbox').first()).toBeHidden();

  await page.getByRole('button', { name: 'Edit counts' }).click();
  await expect(rows.getByRole('textbox').first()).toBeVisible();

  // One press of a stepper re-plays the battle on the hand-typed counts.
  await rows
    .getByRole('button', { name: /^Increase / })
    .first()
    .click();
  const undo = page.getByRole('button', { name: 'Undo' });
  await expect(undo).toBeVisible();
  expect(await summaryValue(page, 'Expected damage')).not.toBe(damage);

  await undo.click();
  await expect(undo).toBeHidden();
  expect(await summaryValue(page, 'Expected damage')).toBe(damage);

  expect(problems).toEqual([]);
});

test('the unit sheet opens from a row and acts on that one type', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await generate(page, { leadership: 4100 });

  await countsList(page)
    .getByRole('button', { name: /^Details: / })
    .first()
    .click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText('In this march')).toBeVisible();
  await expect(sheet.getByText('Why this size')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Keep in march' })).toBeVisible();

  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();

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
  // The narrow card stacks its rows instead of drawing the table.
  await expect(countsTable(page)).toBeHidden();
  await expect(
    page.locator('#results').getByRole('list', { name: /in the order the stacks fall/ }),
  ).toBeVisible();

  expect(problems).toEqual([]);
});
