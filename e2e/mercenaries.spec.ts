/**
 * The one mercenary flow a real browser has to prove (design plan §7.2 as amended on 2026-09-13,
 * journey J2): find a mercenary by name in the picker, hire it with one press — no "Add" button at
 * the end of a line (review point R6) — say how many you own in the pill's own editor, and read the
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
  const picker = card.getByRole('combobox', { name: 'Add a mercenary' });
  await picker.click();

  const list = page.getByRole('listbox');
  await expect(list).toBeVisible();
  // The whole table is on offer, grouped by tier from the lowest up, headed by the roman numeral.
  await expect(list.getByRole('group').first()).toContainText('Tier V');

  await picker.fill('bear');
  const offered = page.getByRole('option', { name: 'Bear V, tier 5' });
  await expect(offered).toBeVisible();
  await offered.click();

  // Hired means it left the picker, and the picker stayed open for the next one.
  await expect(list).toBeVisible();
  await expect(offered).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(list).toBeHidden();

  // The camp is a row of pills: code, tier and quantity, counted in the heading.
  await expect(card.getByText('(1 selected)')).toBeVisible();
  const pill = card.getByRole('list', { name: 'Mercenaries you own' }).getByRole('listitem');
  await expect(pill).toContainText('BER');
  await expect(pill).toContainText('V');
  await expect(pill).toContainText('×∞');

  // The quantity opens its own editor: a plain field, no step buttons.
  await pill.getByRole('button', { name: 'Bear V: owned unlimited' }).click();
  const editor = page.getByRole('dialog');
  await expect(editor).toBeVisible();
  await expect(editor.getByRole('button', { name: 'Increase Owned' })).toHaveCount(0);

  const quantity = editor.getByRole('textbox', { name: 'Owned' });
  await quantity.fill('22');
  // Tab commits the field and keeps the focus inside the panel, so Escape closes the panel itself.
  await quantity.press('Tab');
  await page.keyboard.press('Escape');
  await expect(editor).toBeHidden();

  // The recap is the pill itself: the quantity is on it.
  await expect(pill).toContainText('×22');

  expect(problems).toEqual([]);
});
