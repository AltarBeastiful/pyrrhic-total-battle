/**
 * The amended Troops flow (design plan §7.1, rebuilt on Mantine at M-04): the block does not
 * collapse — on a phone the four rows are already there, you pick the lowest and the highest tier
 * you own from two tiny selects, uncheck the top-tier type you have not upgraded yet, and the march
 * the engine produces leaves that type — and only that type — out.
 *
 * The block is **technology** and nothing else (schema v2): a type one march leaves out never
 * appears here, so there is no "put back" to press either.
 */
import { expect, test } from '@playwright/test';

import {
  generate,
  marchStackLabels,
  marchPills,
  openApp,
  openMarchSheet,
  stepTier,
  tierStepper,
  pageOverflowsSideways,
  watchConsole,
} from './helpers';

test('a tier range and one chip decide what the march fields', async ({ page }) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);

  const block = page.locator('#troops');

  // The form is the summary: one row per group, on screen with nothing to unfold (D-22), both ends
  // of every range always present, and the narrowest phone we support never scrolls sideways.
  await expect(block.getByRole('heading', { level: 2, name: 'Troops' })).toBeVisible();
  await expect(block.getByRole('button', { name: /^Troops/ })).toHaveCount(0);
  await expect(block.getByRole('spinbutton')).toHaveCount(8);
  // A group nobody uses reads "—" at both ends, as the reference does.
  await expect(tierStepper(block, 'Engineers from')).toHaveAttribute('aria-valuetext', '—');
  expect(await pageOverflowsSideways(page)).toBe(false);

  // G1–G3 becomes G1–G4 with one step of the "to" end, which is the whole of the flow we copied.
  await stepTier(block, 'Guardsmen to', 1);
  const top = block.getByRole('group', { name: 'Guardsmen at G4' });
  await expect(top).toBeVisible();

  // "I have not upgraded my riders yet": the chip is the type's emoji and its short code, and the
  // press lands on it exactly as a player's thumb does.
  await expect(block.getByRole('checkbox', { name: 'Rider IV' })).toBeChecked();
  await top.getByText('RD', { exact: true }).click();
  await expect(block.getByRole('checkbox', { name: 'Rider IV' })).not.toBeChecked();

  await generate(page, { leadership: 20000 });
  // At 390 px the March is the sheet the bottom bar opens (design rule 5).
  await openMarchSheet(page);
  await expect(marchPills(page).first()).toBeVisible({ timeout: 30_000 });

  const labels = await marchStackLabels(page);
  expect(labels.some((label) => label.startsWith('ARC4'))).toBe(true);
  expect(labels.some((label) => label.startsWith('RD4'))).toBe(false);
  // Lower tiers are always in, so the riders the player does own still march.
  expect(labels.some((label) => label.startsWith('RD3'))).toBe(true);

  // And the card says nothing about what the march itself leaves out: no left-out line, nothing to
  // put back. That belongs to the battle setup now.
  await expect(block.getByText(/Left out/)).toHaveCount(0);
  await expect(block.getByRole('button', { name: /[Pp]ut back/ })).toHaveCount(0);

  expect(problems).toEqual([]);
});

test('with every group set the block is still four short rows on a wide screen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openApp(page);

  const block = page.locator('#troops');

  // Fill the two groups the first-run account leaves unused, so every row is at its widest.
  await stepTier(block, 'Guardsmen to', 1);
  await stepTier(block, 'Engineers from', 1);
  await stepTier(block, 'Monsters from', 1);
  await expect(block.getByRole('group', { name: 'Monsters at M3' })).toBeVisible();

  // A row is one line: its "from" end and its chips sit at the same height.
  for (const [group, tier] of [
    ['Guardsmen', 'G4'],
    ['Specialists', 'S1'],
    ['Monsters', 'M3'],
  ] as const) {
    const from = await tierStepper(block, `${group} from`).boundingBox();
    const chips = await block.getByRole('group', { name: `${group} at ${tier}` }).boundingBox();
    if (from === null || chips === null) throw new Error(`${group} row is not on screen`);
    expect(Math.abs(from.y + from.height / 2 - (chips.y + chips.height / 2))).toBeLessThan(6);
  }

  // Four rows plus the title: short enough for Mercenaries to sit right under it (R4).
  const box = await block.boundingBox();
  if (box === null) throw new Error('the Troops block is not on screen');
  expect(box.height).toBeLessThan(340);
});
