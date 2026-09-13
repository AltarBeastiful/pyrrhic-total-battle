/**
 * The calculator itself, end to end: housing in, a march out, the two ways a player changes what it
 * fields (a press on a pill in the March, a type the priority left at home), and the three things
 * they do with the answer — read the counts, copy them all, edit one by hand.
 */
import { expect, test } from '@playwright/test';

import {
  chooseObjective,
  fillHousing,
  generate,
  generateButton,
  generateState,
  marchExpectedDamage,
  marchFigure,
  marchLeftOut,
  marchPillDetails,
  marchSection,
  marchStackCount,
  marchStackLabels,
  marchPills,
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

  // One pill per marching stack, each with a non-zero count.
  const pills = marchPills(page);
  await expect(pills.first()).toBeVisible();
  expect(await pills.count()).toBeGreaterThan(1);
  for (const label of await marchStackLabels(page)) {
    expect(Number(label.split(' ')[1] ?? '0')).toBeGreaterThan(0);
  }
  expect(await marchStackCount(page)).toBeGreaterThan(0);

  // The recap: a march that fields units always does damage, whoever strikes first.
  expect(await marchExpectedDamage(page)).toBeGreaterThan(0);
  expect(await marchFigure(page, 'Worst opening')).toBeGreaterThan(0);
  expect(await marchFigure(page, 'Silver to recover')).toBeGreaterThan(0);

  // The pills *are* the counts (owner, 2026-09-13): there is no table under them, and the row of
  // whole-march actions is what is left.
  await expect(marchSection(page).getByRole('table')).toHaveCount(0);
  await expect(marchSection(page).getByRole('button', { name: 'Copy all counts' })).toBeVisible();

  // The leadership pool is spent, not merely allocated. A pool is a vessel filled to the brim, so
  // its figure reads "used … of total" rather than as a fraction (D-19).
  await expect(marchSection(page).getByText('of 4 100')).toBeVisible();

  // The story and the chart are folded away until they are asked for.
  await expect(marchSection(page).getByRole('button', { name: /^Details The battle story/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  expect(problems).toEqual([]);
});

test('a press on a pill leaves that type out of the march, and puts it back', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await generate(page, { leadership: 4100 });
  const before = await marchStackLabels(page);
  const code = before[0]?.split(' ')[0] ?? '';
  expect(code).not.toBe('');

  // The primary action is direct (owner, 2026-09-13): a press on the pill itself takes the type out
  // of the march, from the sticky pane, without a sheet in between.
  const pill = marchPills(page).first();
  await expect(pill).toHaveAttribute('aria-pressed', 'true');
  await pill.click();
  await settle(page);
  const without = await marchStackLabels(page);
  expect(without.some((label) => label.startsWith(`${code} `))).toBe(false);
  expect(without.length).toBe(before.length - 1);

  // The type is in the small row under the pools now — the off half of the same toggle — and a press
  // puts it back and keeps it in for good.
  const putBack = marchLeftOut(page).first();
  await expect(putBack).toHaveAttribute('aria-pressed', 'false');
  await putBack.click();
  await settle(page);
  expect((await marchStackLabels(page)).length).toBe(before.length);
  await expect(marchSection(page).getByRole('button', { name: /, kept in — leave out$/ })).toBeVisible();

  expect(problems).toEqual([]);
});

test('the pill’s corner mark opens the unit sheet over the sticky pane', async ({ page }) => {
  const problems = watchConsole(page);
  // Two panes: the March is the sticky pane on the right and the command bar is on the bottom edge,
  // which is the frame the sheet used to open *under* (owner, 2026-09-13).
  await page.setViewportSize({ width: 1400, height: 900 });
  await openApp(page);
  await generate(page, { leadership: 4100 });

  const mark = marchPillDetails(page).first();
  const name = (await mark.getAttribute('aria-label'))?.replace('Details: ', '') ?? '';
  expect(name).not.toBe('');
  await mark.click();

  // The sheet is on top of everything the page pins to an edge, so its heading can be read and its
  // actions can be pressed.
  const sheet = page.getByRole('dialog', { name });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('heading', { name })).toBeVisible();
  const leaveOut = sheet.getByRole('button', { name: 'Leave out' });
  await expect(leaveOut).toBeVisible();

  // "On top" measured rather than asserted: the point the button occupies belongs to the button.
  const box = await leaveOut.boundingBox();
  expect(box).not.toBeNull();
  const owns = await page.evaluate(
    ({ x, y }) => {
      const view = globalThis as unknown as {
        document: {
          elementFromPoint: (px: number, py: number) => { closest: (s: string) => unknown } | null;
        };
      };
      return (view.document.elementFromPoint(x, y)?.closest('[role="dialog"]') ?? null) !== null;
    },
    { x: (box?.x ?? 0) + (box?.width ?? 0) / 2, y: (box?.y ?? 0) + (box?.height ?? 0) / 2 },
  );
  expect(owns, 'the command bar is painting over the unit sheet').toBe(true);

  await leaveOut.click();
  await settle(page);
  await expect(marchLeftOut(page).first()).toBeVisible();

  expect(problems).toEqual([]);
});

test('a march says nothing about its age, and says plainly when the setup has moved', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await generate(page, { leadership: 4100 });

  // Current: no clock, no warning, nothing dimmed (owner, 2026-09-13 — "generated 5 minutes ago" is
  // retired; what matters is whether the answer still answers the form).
  await expect(page.getByText(/generated (just now|\d)/)).toHaveCount(0);
  await expect(
    marchSection(page).getByText('Setup changed since this march. Generate to refresh.'),
  ).toHaveCount(0);
  for (const block of await marchSection(page).locator('[data-stale]').all()) {
    await expect(block).toHaveAttribute('data-stale', 'false');
  }
  await expect(generateState(page)).toHaveAttribute('data-state', 'ready');

  // Move the form under the answer without generating: one line says so, the answer steps back, and
  // Generate keeps its dot.
  await fillHousing(page, 'Leadership', 2000);
  await expect(
    marchSection(page).getByText('Setup changed since this march. Generate to refresh.'),
  ).toBeVisible();
  const blocks = await marchSection(page).locator('[data-stale]').all();
  expect(blocks.length).toBeGreaterThanOrEqual(2);
  for (const block of blocks) await expect(block).toHaveAttribute('data-stale', 'true');
  await expect(generateState(page)).toHaveAttribute('data-state', 'stale');

  // Generating again clears every one of those signals at once.
  await generateButton(page).click();
  await settle(page);
  await expect(
    marchSection(page).getByText('Setup changed since this march. Generate to refresh.'),
  ).toHaveCount(0);
  await expect(generateState(page)).toHaveAttribute('data-state', 'ready');

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

test('the counts have one shape at every width: the pills themselves', async ({ page }) => {
  const problems = watchConsole(page);
  // One column, so the March is the sheet — and the sheet is as wide as the page.
  await page.setViewportSize({ width: 1024, height: 900 });
  await openApp(page);
  await generate(page, { leadership: 4100 });
  await openMarchSheet(page);

  // One pill per stack, whatever the width: the counts have no second shape any more.
  await expect(marchPills(page)).toHaveCount(await marchStackCount(page));
  await expect(marchSection(page).getByRole('table')).toHaveCount(0);

  expect(problems).toEqual([]);
});

test('counts are edited in an explicit mode, and put back with Undo', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await generate(page, { leadership: 4100 });

  const damage = await marchExpectedDamage(page);
  const pills = marchSection(page).locator('[data-stack]');
  await expect(pills.first().getByRole('textbox')).toBeHidden();

  await setCountsMode(page, 'edit');
  // The field is the pill's own count, in place.
  const field = pills.first().getByRole('textbox');
  await expect(field).toBeVisible();

  // A count is typed, not walked to, so the field carries no step buttons; the battle is re-played
  // on the hand-typed counts the moment one changes.
  await expect(pills.getByRole('button', { name: /^Increase / })).toHaveCount(0);
  await field.fill('1');
  const undo = marchSection(page).getByRole('button', { name: 'Undo' });
  await expect(undo).toBeVisible();
  expect(await marchExpectedDamage(page)).not.toBe(damage);

  await undo.click();
  await expect(undo).toBeHidden();
  expect(await marchExpectedDamage(page)).toBe(damage);

  expect(problems).toEqual([]);
});

test('the unit sheet opens from a pill and acts on that one type', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await generate(page, { leadership: 4100 });

  await marchPillDetails(page).first().click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText('In this march')).toBeVisible();
  await expect(sheet.getByText('Why this size')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Keep in march' })).toBeVisible();

  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();

  expect(problems).toEqual([]);
});

test('mobile: a unit sheet opens on top of the March sheet, not behind it', async ({ page }) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await generate(page, { leadership: 4100 });

  // The March *is* the sheet below 1200 px, so a unit sheet raised from it is a sheet over a sheet:
  // at Mantine's own stacking it opened underneath, with only its header showing (owner, 2026-09-13).
  await openMarchSheet(page);
  const mark = marchPillDetails(page).first();
  const name = (await mark.getAttribute('aria-label'))?.replace('Details: ', '') ?? '';
  await mark.click();

  const unitSheet = page.getByRole('dialog', { name });
  await expect(unitSheet).toBeVisible();
  const leaveOut = unitSheet.getByRole('button', { name: 'Leave out' });
  await expect(leaveOut).toBeVisible();

  const box = await leaveOut.boundingBox();
  const owns = await page.evaluate(
    ({ x, y, title }) => {
      const view = globalThis as unknown as {
        document: {
          elementFromPoint: (
            px: number,
            py: number,
          ) => { closest: (s: string) => { textContent: string } | null } | null;
        };
      };
      const dialog = view.document.elementFromPoint(x, y)?.closest('[role="dialog"]') ?? null;
      return dialog !== null && dialog.textContent.includes(title);
    },
    { x: (box?.x ?? 0) + (box?.width ?? 0) / 2, y: (box?.y ?? 0) + (box?.height ?? 0) / 2, title: name },
  );
  expect(owns, 'the March sheet is painting over the unit sheet').toBe(true);

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
  await expect(marchPills(page)).toHaveCount(0);

  // The quick summary in the bottom bar opens it. The sheet covers the bar rather than sitting
  // under it (M-09 polish list): a control outside a focus trap that the pointer can still reach is
  // a trap that does not hold. So the bar goes under the scrim and the sheet carries its own
  // Generate, and the answer and the action still travel together.
  const recap = await openMarchSheet(page);
  await expect(recap.getByText(/^Expected damage/)).toBeVisible();
  await expect(recap.getByRole('group', { name: 'Leadership stacks' })).toBeVisible();
  await expect(recap.getByRole('button', { name: /^Generate march/ })).toBeVisible();
  await expect(marchPills(page).first()).toBeVisible();
  // The pills are the counts: no table, and one row of whole-march actions under them.
  await expect(marchSection(page).getByRole('table')).toHaveCount(0);
  await expect(recap.getByRole('button', { name: 'Copy all counts' })).toBeVisible();
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
