/**
 * The visual and accessibility gate for the component kit (ui-foundation plan §5, T-05). It opens
 * the dev-only kit page, runs axe over every story in both themes, and compares one screenshot per
 * story section against a committed baseline, at a phone and a desktop viewport.
 *
 * Run it with `pnpm test:visual`; a deliberate visual change is re-baselined with
 * `pnpm test:visual:update` in the same commit as the change.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Only the standard ones: best-practice rules are advice, not a gate. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa'];

/** Open `/#kit` and set the story area to the width this project is emulating. */
async function openKitPage(page: Page): Promise<void> {
  await page.goto('/#kit');
  await expect(page.getByRole('heading', { level: 1, name: 'Pyrrhic kit' })).toBeVisible();

  const width = page.viewportSize()?.width;
  if (width !== undefined) {
    const switcher = page.getByRole('button', { name: `${width} px`, exact: true });
    if ((await switcher.count()) > 0) await switcher.click();
  }

  // Every story is on the page at once; wait until at least one section is laid out.
  await expect(page.locator('[data-story]').first()).toBeVisible();
}

/** Every WCAG A/AA violation on the page as it is right now, one readable line each. */
async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations.map(
    (violation) => `${violation.id} (${violation.nodes.length} node(s)): ${violation.help}`,
  );
}

test('the kit page has no WCAG A or AA violations, in either theme', async ({ page }) => {
  await openKitPage(page);

  expect(await violations(page), 'axe violations on the kit page, light').toEqual([]);

  // The scheme is one attribute on `<html>`, so both halves of the palette are checked in one run
  // rather than in a second project: contrast is the rule a dark scheme breaks.
  await page.getByRole('button', { name: 'Switch to the dark scheme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await violations(page), 'axe violations on the kit page, dark').toEqual([]);
});

test('every story matches its baseline', async ({ page }) => {
  await openKitPage(page);

  const sections = page.locator('[data-story]');
  const count = await sections.count();
  expect(count, 'the kit page rendered no stories').toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const section = sections.nth(index);
    const id = await section.getAttribute('data-story');
    expect(id, 'a story section without an id').not.toBeNull();
    await expect(section).toHaveScreenshot(`${id}.png`);
  }
});
