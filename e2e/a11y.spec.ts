/**
 * The accessibility floor for the **app** (design rule 24, ADR-0008's "accessibility floor
 * unchanged"): zero WCAG A/AA violations at both frames and in both schemes, with a march on screen
 * so the answer — tiles, gauges, the counts table, the trade-off strip — is checked too, not just an
 * empty form. `e2e/visual.spec.ts` is the same gate for the kit page.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { generate, openAccountMenu, openApp, themeAttribute } from './helpers';

/** Only the standard ones: best-practice rules are advice, not a gate. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa'];

/** The two frames the design plan reviews everything at. */
const FRAMES = [
  { name: 'desktop', width: 1400, height: 900 },
  { name: 'phone', width: 390, height: 844 },
] as const;

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

for (const frame of FRAMES) {
  test(`the app has no WCAG A or AA violations at ${String(frame.width)} px, in either scheme`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: frame.width, height: frame.height });
    await openApp(page);
    await generate(page, { leadership: 4100, authority: 1200 });

    await chooseTheme(page, 'Light');
    expect(await violations(page), `axe violations on the app, ${frame.name} light`).toEqual([]);

    await chooseTheme(page, 'Dark');
    expect(await violations(page), `axe violations on the app, ${frame.name} dark`).toEqual([]);
  });
}
