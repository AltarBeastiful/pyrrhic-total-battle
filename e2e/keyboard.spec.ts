/**
 * A phone's keyboard shrinks the window, and a gear parked near the bottom bar leaves it. Mantine hides
 * a popover whose target has left the window (`hideDetached`), so the focused field vanished and the
 * keyboard closed on every try to reopen it (owner, 2026-10-20, the hero gear). Mantine switches that
 * off under Vitest, so only a browser can catch it: the keyboard is a viewport resize here.
 */
import { expect, test } from '@playwright/test';

import { openApp } from './helpers';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('a gear editor keeps its focused field when the keyboard shrinks the window', async ({ page }) => {
  await openApp(page);
  const card = page.locator('section', { has: page.getByRole('heading', { level: 2, name: 'Bonuses' }) });
  await card.locator('label[for]', { hasText: 'Beowulf' }).first().click();
  const gear = card.getByRole('button', { name: /^(Set|Change) Beowulf’s level$/ });
  await gear.scrollIntoViewIfNeeded();
  // Park the gear 170 px above the bottom edge, just over the command bar.
  await page.evaluate(() => {
    const view = globalThis as unknown as {
      innerHeight: number;
      scrollBy: (x: number, y: number) => void;
      document: { querySelectorAll: (s: string) => ArrayLike<{ getBoundingClientRect: () => { top: number } }> };
    };
    const button = view.document.querySelectorAll('button[aria-label$="Beowulf’s level"]')[0];
    if (button !== undefined) view.scrollBy(0, button.getBoundingClientRect().top - (view.innerHeight - 170));
  });
  await gear.tap();
  // The keyboard rises as the field takes its autofocus, a moment after the tap.
  await page.waitForTimeout(400);
  const level = page.getByRole('textbox', { name: 'Base level' });

  await page.setViewportSize({ width: 390, height: 520 });
  await page.waitForTimeout(800);
  await expect(level).toBeVisible();
  await expect(level).toBeFocused();
});
