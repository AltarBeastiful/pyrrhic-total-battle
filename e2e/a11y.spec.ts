/**
 * The accessibility floor for the **app** (design rule 24, ADR-0008's "accessibility floor
 * unchanged"): zero WCAG A/AA violations at both frames and in both schemes, with a march on screen
 * so the answer — tiles, gauges, the counts table, the trade-off strip — is checked too, not just an
 * empty form. `e2e/visual.spec.ts` is the same gate for the kit page.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  chooseObjective,
  closeMarchSheet,
  generate,
  openAccountMenu,
  openApp,
  openMarchSheet,
  themeAttribute,
} from './helpers';

/** Only the standard ones: best-practice rules are advice, not a gate. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa'];

/** The two frames the design plan reviews everything at. */
const FRAMES = [
  { name: 'desktop', width: 1400, height: 900 },
  { name: 'phone', width: 390, height: 844 },
] as const;

/** The five objectives side by side; it lands after the march, so it is waited for by name. */
function comparison(page: Page): Locator {
  return page.getByRole('table', { name: 'Every objective on this army' });
}

const COMPARISON_WAIT = { timeout: 40_000 };

async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.nodes.length} node(s)): ${violation.help}\n` +
      violation.nodes.map((node) => `      ${node.target.join(' ')}`).join('\n'),
  );
}

/**
 * The account menu's theme row; the press lands on the label a player sees. The menu is closed again
 * before anything is measured — an open dropdown is still fading in, and a half-transparent one
 * reads as a contrast failure that is not there.
 */
async function chooseTheme(page: Page, name: 'Light' | 'Dark'): Promise<void> {
  const menu = await openAccountMenu(page);
  await menu.getByRole('radiogroup', { name: 'Theme' }).getByText(name, { exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect.poll(() => themeAttribute(page)).toBe(name.toLowerCase());
}

/**
 * Design rule 24 / WCAG 2.2 §2.4.11, the half investigation 0011 found missing: Mantine marks a
 * focused field by changing its border colour and nothing else (1.8:1 between the two states), where
 * buttons and chips get the theme's 2 px ring. This asks the browser what a keyboard really sees.
 */
test('a keyboard sees a real focus ring on a field, not a border that changed colour', async ({ page }) => {
  await openApp(page);

  const field = page.getByRole('textbox', { name: 'Leadership', exact: true });
  // `Tab` and not `.focus()`: `:focus-visible` is about how the focus was reached.
  await field.click();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(field).toBeFocused();

  const ring = await field.evaluate((node) => {
    const view = globalThis as unknown as {
      getComputedStyle: (element: unknown) => {
        outlineStyle: string;
        outlineWidth: string;
        outlineOffset: string;
        outlineColor: string;
      };
    };
    const style = view.getComputedStyle(node);
    return {
      style: style.outlineStyle,
      width: style.outlineWidth,
      offset: style.outlineOffset,
      color: style.outlineColor,
    };
  });
  expect(ring.style).toBe('solid');
  expect(ring.width).toBe('2px');
  expect(ring.offset).toBe('2px');
  // The accent, not the field's own border grey: `pnpm contrast` checks it against every surface.
  expect(ring.color).not.toBe('rgb(110, 120, 115)');
});

for (const frame of FRAMES) {
  // Five extra searches per frame, on top of the march itself and six axe passes.
  test.setTimeout(120_000);
  test(`the app has no WCAG A or AA violations at ${String(frame.width)} px, in either scheme`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: frame.width, height: frame.height });
    await openApp(page);
    // With an objective, so the answer carries everything the March can draw: the pills, the
    // left-out row *and* the five objectives side by side (investigation 0013 §5.3), which is a
    // table of controls and the newest thing on the page.
    await chooseObjective(page, 'Best worst case');
    await generate(page, { leadership: 4100, authority: 1200 });
    // The comparison runs after the march and only where the March is drawn — the pane from
    // 1200 px, the sheet below it.
    if (frame.width >= 1200) await expect(comparison(page)).toBeVisible(COMPARISON_WAIT);

    await chooseTheme(page, 'Light');
    expect(await violations(page), `axe violations on the app, ${frame.name} light`).toEqual([]);

    await chooseTheme(page, 'Dark');
    expect(await violations(page), `axe violations on the app, ${frame.name} dark`).toEqual([]);

    // Below 1200 px the March is the sheet (design rule 5), so the answer — tiles, gauges, the
    // counts table, the trade-off strip — is only ever checked with the sheet open.
    if (frame.width < 1200) {
      await openMarchSheet(page);
      await expect(comparison(page)).toBeVisible(COMPARISON_WAIT);
      expect(await violations(page), `axe violations on the March sheet, ${frame.name} dark`).toEqual([]);
      await closeMarchSheet(page);
    }
  });
}
