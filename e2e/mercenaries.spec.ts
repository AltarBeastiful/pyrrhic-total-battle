/**
 * The one mercenary flow a real browser has to prove (design plan §7.2 as amended on 2026-09-13,
 * journey J2): find a mercenary by name in the picker, hire it with one press — no "Add" button at
 * the end of a line (review point R6) — say how many you own in the pill's own popover, and read the
 * quantity back off the pill, with nothing to unfold.
 */
import { expect, test } from '@playwright/test';

import { openApp, watchConsole } from './helpers';

test('a mercenary is hired from the picker, and its pill says how many you own', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  const card = page.locator('#mercenaries');
  await expect(card.getByRole('heading', { level: 2, name: 'Mercenaries' })).toBeVisible();

  // Adding is one field: no Tier / Role / Race chips, and nothing to unfold first.
  await card.getByRole('button', { name: 'Hire mercenary…' }).click();
  const list = page.getByRole('listbox');
  await expect(list).toBeVisible();
  // The whole table is on offer, grouped by tier from the lowest up, headed by the roman numeral.
  await expect(list.getByRole('group').first()).toContainText('Tier V');

  const search = page.getByRole('textbox', { name: 'Search mercenaries' });
  await search.fill('bear');
  const offered = page.getByRole('option', { name: 'Bear V tier 5' });
  await expect(offered).toBeVisible();
  await offered.click();

  // Hired means it left the picker, and the picker stayed open for the next one.
  await expect(list).toBeVisible();
  await expect(offered).toBeHidden();
  await search.press('Escape');
  await expect(list).toBeHidden();

  // The camp is a row of pills: glyph, code, tier and, in a badge, the quantity, counted in the
  // panel's meta. The badge is the button named for what is owned; the pill's body removes.
  await expect(card.getByText('1 hired')).toBeVisible();
  const badge = card.getByRole('button', { name: 'Bear V: owned unlimited' });
  // `has` takes a locator relative to the pill, so the badge is named again rather than reused.
  const pill = card
    .locator('.mantine-Indicator-root')
    .filter({ has: page.getByRole('button', { name: 'Bear V: owned unlimited' }) });
  await expect(pill).toContainText('BER');
  await expect(pill).toContainText('V');
  await expect(badge).toContainText('∞');
  await expect(pill.getByRole('button', { name: 'Remove Bear V' })).toBeVisible();

  // Pressing the badge opens the quantity under it: a plain field, no step buttons.
  await badge.click();
  const editor = page.getByRole('dialog');
  await expect(editor).toBeVisible();
  await expect(editor.getByRole('button', { name: /Increase|Decrease/ })).toHaveCount(0);

  const quantity = editor.getByRole('textbox', { name: 'Owned' });
  await quantity.fill('22');
  // Tab commits the field and keeps the focus inside the panel, so Escape closes the panel itself.
  await quantity.press('Tab');
  await page.keyboard.press('Escape');
  await expect(editor).toBeHidden();

  // The recap is the pill itself: the quantity is on it.
  await expect(card.getByRole('button', { name: 'Bear V: owned 22' })).toContainText('22');

  expect(problems).toEqual([]);
});

test('the owned-count editor does not move while the figure is typed', async ({ page }) => {
  // 390 px is where it moved (the owner's phone review, 2026-09-13): the editor is wider than the
  // room to the right of the pill, so something has to give — and what used to give was the box's
  // alignment, which flipped to the pill's *end* and then travelled every time the figure it was
  // anchored to got wider. Two pills, so the one under test starts half way across the row.
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);

  const card = page.locator('#mercenaries');
  await card.getByRole('button', { name: 'Hire mercenary…' }).click();
  const search = page.getByRole('textbox', { name: 'Search mercenaries' });
  for (const name of ['Bear V tier 5', 'Abomination VI tier 6']) {
    await search.fill(name.split(' tier ')[0] ?? '');
    await page.getByRole('option', { name }).click();
  }
  await search.press('Escape');

  const face = card.getByRole('button', { name: /^Abomination VI: owned/ });
  await face.click();
  const editor = page.getByRole('dialog');
  await expect(editor).toBeVisible();

  // What must not happen is the box sliding along the pill as the figure lands — its alignment
  // flipping to the pill's end. The pill itself may wrap to the next line once its count badge makes
  // the row too wide for 390 px (the 2026-09-18 badge added 14 px to a pill), and the editor is right
  // to follow it there: then it opens on the pill's own start, which is the alignment under test.
  const box = async (): Promise<{ x: number; width: number; pillX: number; pillY: number }> => {
    const pill = await face.evaluate((node) => {
      const { x, y } = node.getBoundingClientRect();
      return { x, y };
    });
    const rect = await editor.evaluate((node) => {
      const { x, width } = node.getBoundingClientRect();
      return { x, width };
    });
    return { x: rect.x, width: rect.width, pillX: pill.x, pillY: pill.y };
  };

  const before = await box();
  const quantity = editor.getByRole('textbox', { name: 'Owned' });
  await quantity.fill('1212');
  // The pill behind it *does* widen — that is the figure landing on it — which is the whole point.
  await expect(card.getByRole('button', { name: /^Abomination VI: owned 1.212$/ })).toBeVisible();

  const after = await box();
  if (Math.abs(after.pillY - before.pillY) < 0.5) {
    expect(after.x, 'the editor moved sideways as the figure was typed').toBeCloseTo(before.x, 0);
  } else {
    expect(after.x, 'the pill wrapped and the editor did not open on its start').toBeCloseTo(after.pillX, 0);
  }
  expect(after.width, 'the editor changed width as the figure was typed').toBeCloseTo(before.width, 0);
});

test('the pills wrap on a phone rather than pushing the card sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);

  const card = page.locator('#mercenaries');
  await card.getByRole('button', { name: 'Hire mercenary…' }).click();
  const search = page.getByRole('textbox', { name: 'Search mercenaries' });

  for (const name of ['Bear V tier 5', 'Cyclops V tier 5', 'Abomination VI tier 6', 'Archdemon VI tier 6']) {
    await search.fill(name.split(' tier ')[0] ?? '');
    await page.getByRole('option', { name }).click();
  }
  await search.press('Escape');

  await expect(card.getByText('4 hired')).toBeVisible();
  const overflow = await card.evaluate((node) => node.scrollWidth - node.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
