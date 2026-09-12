/**
 * The amended Troops flow (design plan §7.1): the card does not collapse — on a phone, the four
 * rows are already there, you pick the lowest and the highest tier you own, click out the top-tier
 * type you have not upgraded yet, and the march the engine produces leaves that type — and only
 * that type — out.
 */
import { expect, test } from '@playwright/test';

import { generate, openApp, pageOverflowsSideways, stackLabels, stackPills, watchConsole } from './helpers';

test('a tier range and one tile decide what the march fields', async ({ page }) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);

  const card = page.locator('#troops');

  // The form is the summary: one row per group, on screen with nothing to unfold (D-22), and the
  // narrowest phone we support never scrolls sideways.
  await expect(card.getByRole('heading', { level: 2, name: 'Troops' })).toBeVisible();
  await expect(card.getByRole('button', { name: /^Troops/ })).toHaveCount(0);
  await expect(card.getByRole('group', { name: /from$/ })).toHaveCount(4);
  expect(await pageOverflowsSideways(page)).toBe(false);

  // G1–G3 becomes G1–G4 with a single press (R2, D-22).
  await card.getByRole('button', { name: 'Guardsmen to, higher' }).click();
  await expect(card.getByRole('group', { name: 'Guardsmen at G4' })).toBeVisible();

  // "I have not upgraded my riders yet": one press leaves that type out of the top tier.
  await card.getByRole('button', { name: 'Rider IV, tier 4, on' }).click();
  await expect(card.getByRole('button', { name: 'Rider IV, tier 4, off' })).toBeVisible();

  await generate(page, { leadership: 20000 });
  await expect(stackPills(page).first()).toBeVisible({ timeout: 30_000 });

  const labels = await stackLabels(page);
  expect(labels.some((label) => label.startsWith('ARC4'))).toBe(true);
  expect(labels.some((label) => label.startsWith('RD4'))).toBe(false);
  // Lower tiers are always in, so the riders the player does own still march.
  expect(labels.some((label) => label.startsWith('RD3'))).toBe(true);

  expect(problems).toEqual([]);
});

test('with every group set the card is still four rows on a wide screen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openApp(page);

  const card = page.locator('#troops');

  // Fill the two groups the first-run account leaves at "none", so every row is at its widest.
  await card.getByRole('button', { name: 'Guardsmen to, higher' }).click();
  await card.getByRole('button', { name: 'Engineers from, higher' }).click();
  await card.getByRole('button', { name: 'Monsters from, higher' }).click();
  await expect(card.getByRole('group', { name: 'Monsters at M3' })).toBeVisible();

  // A row is one line: its "from" end and its tiles sit at the same height.
  for (const [group, tier] of [
    ['Guardsmen', 'G4'],
    ['Specialists', 'S1'],
    ['Monsters', 'M3'],
  ] as const) {
    const from = await card.getByRole('group', { name: `${group} from` }).boundingBox();
    const tiles = await card.getByRole('group', { name: `${group} at ${tier}` }).boundingBox();
    if (from === null || tiles === null) throw new Error(`${group} row is not on screen`);
    expect(Math.abs(from.y + from.height / 2 - (tiles.y + tiles.height / 2))).toBeLessThan(4);
  }

  // Four rows plus the title: the card stays short enough for Mercenaries to sit under it (R4).
  const box = await card.boundingBox();
  if (box === null) throw new Error('the Troops card is not on screen');
  expect(box.height).toBeLessThan(340);
});
