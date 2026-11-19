/**
 * The Talents page (B-21, B-22), walked at both widths: open it from the title bar, type a hero level and the points,
 * read the next point, move a goal up, open the strength help, switch to Strict order, enter a rank on the tree, go back to the calculator. The page never
 * scrolls sideways at 390 px or at 1400 px.
 */
import { expect, test } from '@playwright/test';

import { openApp, pageOverflowsSideways, waitForSaved, watchConsole } from './helpers';

const WIDTHS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1400, height: 900 },
] as const;

for (const { name, width, height } of WIDTHS) {
  test(`talents journey at ${name} (${String(width)} px)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const problems = watchConsole(page);
    await openApp(page);

    await page.getByRole('banner').getByRole('button', { name: 'Hero talents' }).click();
    await expect(page.getByRole('heading', { name: 'Hero talents' })).toBeVisible();
    await expect(page.getByText(/type the points you have to spend/i)).toBeVisible();
    expect(await pageOverflowsSideways(page)).toBe(false);

    await page.getByRole('textbox', { name: 'Hero level' }).fill('150');
    await page.getByRole('textbox', { name: 'Points to spend' }).fill('40');
    const next = page.getByRole('article', { name: 'Next point' });
    await expect(next).toBeVisible();
    await expect(page.getByRole('article', { name: 'Then' })).toBeVisible();
    const first = await next.innerText();
    await expect(page.getByText(/plan spends \d+ of 40 points/i)).toBeVisible();

    // Economy to rank 1, the strength help opened: the next point changes and nothing overflows.
    await page.getByRole('button', { name: 'Move Economy up' }).click();
    await page.getByRole('button', { name: 'Move Economy up' }).click();
    await expect(next).not.toHaveText(first);
    await page.getByRole('button', { name: /what focus, lean and even mean/i }).click();
    await expect(page.getByText(/rank 2 counts half/i)).toBeVisible();
    await page
      .getByRole('radiogroup', { name: 'How points are spread' })
      .getByText('Strict order', { exact: true })
      .click();
    expect(await pageOverflowsSideways(page)).toBe(false);

    // A node on the tree: pick its tile and type a rank.
    const tile = page.getByRole('button', { name: /^.+, rank 0 of \d+/ }).first();
    await tile.click();
    await page.getByRole('textbox', { name: /^Rank bought/ }).fill('1');
    await expect(page.getByRole('button', { name: /, rank 1 of \d+/ }).first()).toBeVisible();
    expect(await pageOverflowsSideways(page)).toBe(false);

    await expect(page.getByText(/ · \d+ spent( \+ \d+ planned)?$/).first()).toBeVisible();

    await page.getByRole('radiogroup', { name: 'Tree' }).getByText('Expert', { exact: true }).click();
    expect(await pageOverflowsSideways(page)).toBe(false);

    await waitForSaved(page);
    await page.reload();
    await page.getByRole('banner').getByRole('button', { name: 'Hero talents' }).click();
    await expect(page.getByRole('textbox', { name: 'Hero level' })).toHaveValue('150');

    await page.getByRole('banner').getByRole('button', { name: 'March calculator' }).click();
    await expect(page.getByRole('heading', { name: 'Troops' })).toBeVisible();
    expect(problems).toEqual([]);
  });
}
