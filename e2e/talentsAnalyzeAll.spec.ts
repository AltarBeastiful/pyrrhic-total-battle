/**
 * Analyze all (B-28) on the Talents page, at both widths: the card is collapsed until pressed, then lists the
 * talents, states how many the battle does not rate, and the page never scrolls sideways.
 */
import { expect, test } from '@playwright/test';

import { openApp, pageOverflowsSideways, watchConsole } from './helpers';

const WIDTHS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1400, height: 900 },
] as const;

for (const { name, width, height } of WIDTHS) {
  test(`analyze all at ${name} (${String(width)} px)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const problems = watchConsole(page);
    await openApp(page);

    await page.getByRole('banner').getByRole('button', { name: 'Hero talents' }).click();
    await expect(page.getByRole('heading', { name: 'Hero talents' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Talent ranking' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Analyze all' }).click();
    const ranking = page.getByRole('region', { name: 'Talent ranking' });
    const toggle = page.getByRole('button', { name: /^Show ranking/ });
    await expect(toggle).toBeVisible({ timeout: 120_000 });
    await expect(ranking).toHaveCount(0);
    await toggle.click();
    await expect(ranking).toBeVisible();
    await expect(page.getByText(/\d+ not rated in battle/)).toBeVisible();
    await expect(ranking.getByRole('columnheader')).toHaveCount(5);
    expect(await pageOverflowsSideways(page)).toBe(false);
    expect(problems).toEqual([]);
  });
}
