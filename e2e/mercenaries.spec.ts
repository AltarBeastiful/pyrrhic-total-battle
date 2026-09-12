/**
 * The one mercenary flow a real browser has to prove (design plan §7.2, journey J2): find a
 * mercenary, hire it by pressing its row — no "Add" button at the end of the line (review point
 * R6) — say how many you own, and read the quantity back off the line, with nothing to unfold.
 */
import { expect, test } from '@playwright/test';

import { openApp, watchConsole } from './helpers';

test('a mercenary is hired by its row, and the card says how many you own', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  const card = page.locator('#mercenaries');
  await expect(card.getByRole('heading', { level: 2, name: 'Mercenaries' })).toBeVisible();

  // Nothing hired yet, so the picker is already open; a filled camp keeps it behind one button.
  const add = card.getByRole('button', { name: 'Add mercenaries' });
  if (await add.isVisible()) await add.click();

  await card.getByRole('searchbox', { name: 'Find a mercenary' }).fill('bear');

  const picker = card.getByRole('grid', { name: 'Add a mercenary' });
  const offered = picker.getByRole('row', { name: 'Bear V, tier 5' });
  await expect(offered).toBeVisible();
  await offered.click();

  const owned = card
    .getByRole('grid', { name: 'Mercenaries you own' })
    .getByRole('row', { name: 'Bear V, tier 5' });
  await expect(owned).toHaveAttribute('aria-selected', 'true');
  // Hired means it left the picker: the two lists never show the same mercenary twice.
  await expect(offered).toBeHidden();

  // The stepper's field: a text input in the player's locale, with its two arrow buttons beside it.
  const quantity = owned.getByRole('textbox', { name: 'Owned' });
  await quantity.fill('22');
  await quantity.blur();

  await expect(owned).toContainText('×22');

  // The recap is the list itself: folding the picker away never hides what you own.
  await card.getByRole('button', { name: 'Done adding' }).click();
  await expect(card.getByRole('searchbox', { name: 'Find a mercenary' })).toBeHidden();
  await expect(owned).toContainText('×22');

  expect(problems).toEqual([]);
});
