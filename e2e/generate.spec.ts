/**
 * The calculator itself, end to end: housing in, a march out, the two ways a player changes what it
 * fields (a tile in the March, a type the priority left at home), and the three things they do with
 * the answer — read the counts, copy them, edit one by hand.
 */
import { expect, test } from '@playwright/test';

import {
  chooseObjective,
  generate,
  generateButton,
  marchCountsList,
  marchCountsTable,
  marchExpectedDamage,
  marchFigure,
  marchLeftOut,
  marchSection,
  marchStackCount,
  marchStackLabels,
  marchTiles,
  openApp,
  openMarchSheet,
  pageOverflowsSideways,
  setCountsMode,
  settle,
  watchConsole,
} from './helpers';

test('Generate fills the pools and produces the recap and the counts', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await expect(page.getByText(/^Nothing generated yet/)).toBeVisible();

  await generate(page, { leadership: 4100 });

  // One tile per unit type of the march, each with a non-zero count.
  const tiles = marchTiles(page);
  await expect(tiles.first()).toBeVisible();
  expect(await tiles.count()).toBeGreaterThan(1);
  for (const label of await marchStackLabels(page)) {
    expect(Number(label.split(' ')[1] ?? '0')).toBeGreaterThan(0);
  }
  expect(await marchStackCount(page)).toBeGreaterThan(0);

  // The recap: a march that fields units always does damage, whoever strikes first.
  expect(await marchExpectedDamage(page)).toBeGreaterThan(0);
  expect(await marchFigure(page, 'Worst opening')).toBeGreaterThan(0);
  expect(await marchFigure(page, 'Silver to recover')).toBeGreaterThan(0);

  // The counts to copy carry the same stacks, in the order they fall. At 1280 px the March is the
  // 360 dp supporting pane, so the block is in its stacked shape whatever the window says.
  await expect(marchCountsTable(page)).toBeHidden();
  await expect(marchCountsList(page).getByRole('listitem')).toHaveCount(await marchStackCount(page));

  // The leadership pool is spent, not merely allocated. A pool is a vessel filled to the brim, so
  // it reads "used of total" rather than as a fraction (D-19).
  await expect(marchSection(page).getByText('4 100 of 4 100')).toBeVisible();

  // The story and the chart are folded away until they are asked for.
  await expect(marchSection(page).getByRole('button', { name: /^Details The battle story/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  expect(problems).toEqual([]);
});

test('a tile in the March leaves a type out, and puts it back', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await generate(page, { leadership: 4100 });
  const before = await marchStackLabels(page);
  const code = before[0]?.split(' ')[0] ?? '';
  expect(code).not.toBe('');

  // The tile is the control: a tap on a marching one leaves that type out and re-sizes the march.
  await marchTiles(page).first().click();
  await settle(page);
  const without = await marchStackLabels(page);
  expect(without.some((label) => label.startsWith(`${code} `))).toBe(false);
  expect(without.length).toBe(before.length - 1);

  // The same tile, now dimmed, puts it back — and keeps it in for good.
  await marchLeftOut(page).first().click();
  await settle(page);
  expect((await marchStackLabels(page)).length).toBe(before.length);
  await expect(marchSection(page).getByRole('button', { name: /kept in — leave out$/ })).toBeVisible();

  expect(problems).toEqual([]);
});

test('a type the priority left out can be kept in the march, and stays in', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await chooseObjective(page, 'Best worst case');
  await generate(page, { leadership: 4100 });

  // A search wins by marching with fewer types, and the strip says what that bought (PLAN §3.6).
  await expect(marchSection(page).getByRole('heading', { name: 'Compared with all types' })).toBeVisible();
  const leftOut = marchLeftOut(page);
  await expect(leftOut.first()).toBeVisible();

  const before = await marchStackLabels(page);
  await leftOut.first().click();
  await settle(page);

  // Keeping a type in re-sizes the march at once, so the type it named is in the stacks now.
  const kept = await marchStackLabels(page);
  expect(kept.length).toBe(before.length + 1);
  const added = kept.find((label) => !before.includes(label));
  expect(added).toBeDefined();
  const code = added?.split(' ')[0] ?? '';

  await generate(page);
  const again = await marchStackLabels(page);
  expect(again.some((label) => label.startsWith(`${code} `))).toBe(true);

  expect(problems).toEqual([]);
});

test('a card wider than 36 rem draws the counts as a table', async ({ page }) => {
  const problems = watchConsole(page);
  // One column, so the March is the sheet — and the sheet is as wide as the page, which is what the
  // container query asks about.
  await page.setViewportSize({ width: 1024, height: 900 });
  await openApp(page);
  await generate(page, { leadership: 4100 });
  await openMarchSheet(page);

  const table = marchCountsTable(page);
  await expect(table).toBeVisible();
  await expect(table.getByRole('row')).toHaveCount((await marchStackCount(page)) + 1);
  await expect(table.getByRole('columnheader', { name: 'Count' })).toBeVisible();
  await expect(marchCountsList(page)).toBeHidden();

  expect(problems).toEqual([]);
});

test('counts are edited in an explicit mode, and put back with Undo', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await generate(page, { leadership: 4100 });

  const damage = await marchExpectedDamage(page);
  const rows = marchCountsList(page);
  await expect(rows.getByRole('textbox').first()).toBeHidden();

  await setCountsMode(page, 'Edit counts');
  const field = rows.getByRole('textbox').first();
  await expect(field).toBeVisible();

  // A count is typed, not walked to, so the field carries no step buttons; the battle is re-played
  // on the hand-typed counts the moment one changes.
  await expect(rows.getByRole('button', { name: /^Increase / })).toHaveCount(0);
  await field.fill('1');
  const undo = marchSection(page).getByRole('button', { name: 'Undo' });
  await expect(undo).toBeVisible();
  expect(await marchExpectedDamage(page)).not.toBe(damage);

  await undo.click();
  await expect(undo).toBeHidden();
  expect(await marchExpectedDamage(page)).toBe(damage);

  expect(problems).toEqual([]);
});

test('the unit sheet opens from a row and acts on that one type', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await generate(page, { leadership: 4100 });

  await marchCountsList(page)
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

test('mobile: the bar carries the answer, and the recap is one tap away', async ({ page }) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);

  expect(await pageOverflowsSideways(page)).toBe(false);
  await expect(generateButton(page)).toBeVisible();

  await generate(page, { leadership: 4100, authority: 1200 });

  expect(await pageOverflowsSideways(page)).toBe(false);
  await expect(generateButton(page)).toBeVisible();
  // The March is not in the page at all below 1200 px (design rule 5): it is the sheet.
  await expect(marchTiles(page)).toHaveCount(0);

  // The quick summary in the bottom bar opens it. The sheet covers the bar rather than sitting
  // under it (M-09 polish list): a control outside a focus trap that the pointer can still reach is
  // a trap that does not hold. So the bar goes under the scrim and the sheet carries its own
  // Generate, and the answer and the action still travel together.
  const recap = await openMarchSheet(page);
  await expect(recap.getByText('Expected damage', { exact: true })).toBeVisible();
  await expect(recap.getByRole('progressbar', { name: 'Leadership used' })).toBeVisible();
  await expect(recap.getByRole('button', { name: /^Generate march/ })).toBeVisible();
  await expect(marchTiles(page).first()).toBeVisible();
  // The narrow sheet stacks its rows instead of drawing the table.
  await expect(marchCountsTable(page)).toBeHidden();
  await expect(marchCountsList(page)).toBeVisible();
  // …and the trap holds: tabbing all the way round never leaves the sheet for the bar underneath.
  for (let i = 0; i < 12; i += 1) await page.keyboard.press('Tab');
  const trapped = await page.evaluate(() => {
    const view = globalThis as unknown as {
      document: { activeElement: { closest: (selector: string) => unknown } | null };
    };
    return (view.document.activeElement?.closest('[role="dialog"]') ?? null) !== null;
  });
  expect(trapped).toBe(true);

  expect(problems).toEqual([]);
});
