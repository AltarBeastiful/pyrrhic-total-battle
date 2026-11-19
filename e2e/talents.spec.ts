/**
 * The Talents page (B-21), walked at both widths: open it from the menu, type a hero level and the points,
 * read the ordered list, change the goal, enter a rank on the tree, go back to the calculator. The page never
 * scrolls sideways at 390 px or at 1400 px.
 */
import { expect, test } from '@playwright/test';

import { chooseInMainMenu, openApp, pageOverflowsSideways, waitForSaved, watchConsole } from './helpers';

const WIDTHS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1400, height: 900 },
] as const;

for (const { name, width, height } of WIDTHS) {
  test(`talents journey at ${name} (${String(width)} px)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const problems = watchConsole(page);
    await openApp(page);

    await chooseInMainMenu(page, /^Hero talents/);
    await expect(page.getByRole('heading', { name: 'Hero talents' })).toBeVisible();
    await expect(page.getByText(/type the points you have to spend/i)).toBeVisible();
    expect(await pageOverflowsSideways(page)).toBe(false);

    await page.getByRole('textbox', { name: 'Hero level' }).fill('150');
    await page.getByRole('textbox', { name: 'Points to spend' }).fill('40');
    const list = page.getByRole('list', { name: 'Spend in this order' });
    await expect(list).toBeVisible();
    const first = await list.getByRole('listitem').first().innerText();
    expect(await list.getByRole('listitem').count()).toBeGreaterThan(0);
    await expect(page.getByText(/plan spends \d+ of 40 points/i)).toBeVisible();

    await page
      .getByRole('radiogroup', { name: 'Goals, best value per point first' })
      .getByRole('radio', { name: /Economy/ })
      .check({ force: true });
    await expect(list.getByRole('listitem').first()).not.toHaveText(first);

    // A node on the tree: pick its tile and type a rank.
    const tile = page.getByRole('button', { name: /^.+, rank 0 of \d+/ }).first();
    await tile.click();
    await page.getByRole('textbox', { name: /^Rank bought/ }).fill('1');
    await expect(page.getByRole('button', { name: /, rank 1 of \d+/ }).first()).toBeVisible();
    expect(await pageOverflowsSideways(page)).toBe(false);

    await page.getByRole('radiogroup', { name: 'Tree' }).getByText('Expert', { exact: true }).click();
    expect(await pageOverflowsSideways(page)).toBe(false);

    await waitForSaved(page);
    await page.reload();
    await chooseInMainMenu(page, /^Hero talents/);
    await expect(page.getByRole('textbox', { name: 'Hero level' })).toHaveValue('150');

    await chooseInMainMenu(page, /^March calculator/);
    await expect(page.getByRole('heading', { name: 'Troops' })).toBeVisible();
    expect(problems).toEqual([]);
  });
}
