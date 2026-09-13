/**
 * The command bar as a thumb and a keyboard meet it (the independent review of 2026-09-13).
 *
 * Four of that review's findings can only be checked in a real browser, because every one of them
 * is a measurement or a browser behaviour rather than a piece of markup:
 *
 * - the on-screen keyboard used to cover the bar. `interactive-widget=resizes-content` turns the
 *   keyboard into a *shorter page*, which is exactly what shrinking the viewport is here;
 * - the targets: 44 px chips and answer row, a 48 px Generate on a phone;
 * - 1 100 px used to draw the phone bar, with four chips 341 px wide;
 * - `Enter` in a housing field does nothing unless the bar is a form.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  editHousing,
  generateButton,
  generateState,
  housingChip,
  marchSection,
  openApp,
  settle,
  watchConsole,
} from './helpers';

/** The bar itself, at either width: one form, named after what it writes. */
const bar = (page: Page): Locator => page.getByRole('form', { name: 'This march' });

/** What a box measures right now; the specs below only ever ask about heights and widths. */
async function box(locator: Locator) {
  const found = await locator.boundingBox();
  if (found === null) throw new Error('the element is not on the page');
  return found;
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('the bar and the field being typed in stay above the keyboard', async ({ page }) => {
    const problems = watchConsole(page);
    await openApp(page);

    const field = await editHousing(page, 'Leadership');

    // The keyboard, as the meta tag makes the page see it: the window is 344 px shorter.
    await page.setViewportSize({ width: 390, height: 500 });
    await expect(field).toBeVisible();

    const fieldBox = await box(field);
    expect(fieldBox.y + fieldBox.height, 'the open field is under the keyboard').toBeLessThanOrEqual(500);

    const barBox = await box(bar(page));
    expect(barBox.y + barBox.height, 'the bar is under the keyboard').toBeLessThanOrEqual(501);
    await expect(generateButton(page)).toBeVisible();

    expect(problems).toEqual([]);
  });

  test('every chip is a 44 px target, Generate is 48, and the bar sits on the bottom edge', async ({
    page,
  }) => {
    await openApp(page);

    const chip = housingChip(page, 'Leadership');
    expect(Math.round((await box(chip)).height)).toBe(44);
    expect(Math.round((await box(page.getByRole('button', { name: /^Objective: / }))).height)).toBe(44);
    expect(Math.round((await box(generateButton(page))).height)).toBe(48);

    // Full bleed: the ground reaches the bottom of the window and both of its sides, so no live
    // page scrolls past underneath it.
    const barBox = await box(bar(page));
    expect(Math.round(barBox.y + barBox.height)).toBe(844);
    expect(Math.round(barBox.x)).toBe(0);
    expect(Math.round(barBox.width)).toBe(390);

    // And the chip says which pool it is in words, not in an emoji alone.
    await expect(chip).toContainText('Lead');
  });
});

test.describe('between 1024 and 1199 px', () => {
  test.use({ viewport: { width: 1100, height: 800 } });

  test('the bar is the desktop one, and its wells stop at 220 px', async ({ page }) => {
    await openApp(page);

    // Wells standing open, not chips waiting to be tapped.
    await expect(housingChip(page, 'Leadership')).toHaveCount(0);
    for (const pool of ['Leadership', 'Authority', 'Dominance'] as const) {
      const field = page.getByRole('textbox', { name: pool, exact: true });
      await expect(field).toBeVisible();
      expect((await box(field)).width, `${pool} is wider than 220 px`).toBeLessThanOrEqual(220);
    }
    const objective = page.getByRole('combobox', { name: 'Objective' });
    expect((await box(objective)).width).toBeLessThanOrEqual(220);

    // The March has no pane at this width, so the answer is in the bar and opens the sheet.
    await page.getByRole('button', { name: 'Open the march recap' }).click();
    await expect(page.getByRole('dialog', { name: 'March' })).toBeVisible();
  });
});

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } });

  test('Enter in a housing field generates, and a figure past the ceiling is said once', async ({ page }) => {
    const problems = watchConsole(page);
    await openApp(page);

    const field = await editHousing(page, 'Leadership');
    await field.fill('4100');
    await field.press('Enter');
    await settle(page);
    await expect(generateState(page)).toHaveAttribute('data-state', 'ready');
    // A march came back: the pane carries its figures.
    await expect(marchSection(page).getByText('Expected damage', { exact: true })).toBeVisible();

    // The keypad a phone would open on this field, and the pool's ceiling, said once above the row.
    expect(await field.getAttribute('inputmode')).toBe('numeric');
    expect(await field.getAttribute('enterkeyhint')).toBe('go');

    await field.fill('200000000');
    const message = bar(page).getByRole('alert');
    await expect(message).toHaveText('Leadership is over the 100 000 000 a pool can hold.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');

    expect(problems).toEqual([]);
  });
});
