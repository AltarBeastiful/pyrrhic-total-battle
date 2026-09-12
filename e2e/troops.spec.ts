/**
 * The amended Troops flow (design plan §7.1): on a phone, pick the lowest and the highest tier you
 * own, click out the top-tier type you have not upgraded yet, and check that the march the engine
 * produces leaves that type — and only that type — out.
 */
import { expect, test } from '@playwright/test';

import { generate, openApp, pageOverflowsSideways, stackLabels, stackPills, watchConsole } from './helpers';

test('a tier range and one tile decide what the march fields', async ({ page }) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);

  const card = page.locator('#troops');
  const header = card.getByRole('button', { name: /^Troops/ });

  // The card opens on its own only for an account with no troops; this one has the first-run army.
  await expect(header).toHaveAttribute('aria-expanded', 'false');
  await header.click();

  // D-22: one row per group, and the narrowest phone we support never scrolls sideways.
  await expect(card.getByRole('group', { name: /from$/ })).toHaveCount(4);
  expect(await pageOverflowsSideways(page)).toBe(false);

  // G1–G3 becomes G1–G4 with a single press (R2, D-22).
  await card.getByRole('button', { name: 'Guardsmen to, higher' }).click();
  await expect(card.getByRole('group', { name: 'Guardsmen at G4' })).toBeVisible();

  // "I have not upgraded my riders yet": one press leaves that type out of the top tier.
  await card.getByRole('button', { name: 'Rider IV, tier 4, on' }).click();
  await expect(card.getByRole('button', { name: 'Rider IV, tier 4, off' })).toBeVisible();

  // Collapsed, the card still says what the account fields, in the game's own shorthand.
  await header.click();
  await expect(header).toHaveAttribute('aria-expanded', 'false');
  await expect(header.getByText('G1–G4')).toBeVisible();
  await expect(header.getByText('no monsters')).toBeVisible();

  await generate(page, { leadership: 20000 });
  await expect(stackPills(page).first()).toBeVisible({ timeout: 30_000 });

  const labels = await stackLabels(page);
  expect(labels.some((label) => label.startsWith('ARC4'))).toBe(true);
  expect(labels.some((label) => label.startsWith('RD4'))).toBe(false);
  // Lower tiers are always in, so the riders the player does own still march.
  expect(labels.some((label) => label.startsWith('RD3'))).toBe(true);

  expect(problems).toEqual([]);
});
