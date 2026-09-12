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

test('the kit page has no WCAG A or AA violations, in either theme', async ({ page }) => {
  await openKitPage(page);

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map(
    (violation) => `${violation.id} (${violation.nodes.length} node(s)): ${violation.help}`,
  );

  expect(summary, 'axe violations on the kit page').toEqual([]);
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
