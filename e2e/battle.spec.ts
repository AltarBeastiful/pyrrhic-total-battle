/**
 * The Battle card rebuilt on Mantine (design overhaul §7.4, M-07): the whole option card is the
 * target, the rule that rides on the chosen method is a switch row, the three capacities are typed,
 * and what comes out of all that is a march.
 *
 * The second test is the phone: the objective folds to the chosen one, the four enemy counts only
 * accept typing under "Custom", and nothing scrolls sideways at 390 px.
 */
import { expect, test } from '@playwright/test';

import {
  chooseObjective,
  fillHousing,
  generate,
  housingField,
  openApp,
  pageOverflowsSideways,
  watchConsole,
} from './helpers';

test('the method card is pressed anywhere, its rule rides on it, and the march comes out', async ({
  page,
}) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await openApp(page);

  const card = page.locator('#battle');
  await expect(card.getByRole('heading', { level: 2, name: 'Battle' })).toBeVisible();

  // Design rule 8: the press lands on the card's own sentence, not on a radio the size of a pea.
  const method = card.getByRole('radiogroup', { name: 'Stacking method' });
  await expect(method.getByRole('radio', { name: 'Tier ladder', exact: true })).toBeChecked();
  await method.getByText('Hired units only fall once all of your troops have.').click();
  await expect(method.getByRole('radio', { name: 'Troops first', exact: true })).toBeChecked();

  // The rules on screen are the ones that mean something for that method, and the row toggles.
  await expect(card.getByRole('switch')).toHaveCount(3);
  // Mantine's switch input covers the whole row, so the press a player makes anywhere on it lands
  // on the control itself; its accessible name is the label and the sentence under it, run together.
  const tens = card.getByRole('switch', { name: /^Hired units in tens/ });
  await expect(tens).not.toBeChecked();
  await tens.click();
  await expect(tens).toBeChecked();

  // Typed, never walked to: the capacities are filled in and the march is generated from them.
  // What the March card then draws is its own spec; what matters here is that the card wrote the
  // march, survived the run and still reads back what the player set.
  await generate(page, { leadership: 4100, authority: 1200 });
  await expect(housingField(page, 'Leadership')).toHaveValue('4 100');
  await expect(method.getByRole('radio', { name: 'Troops first', exact: true })).toBeChecked();
  await expect(tens).toBeChecked();

  expect(problems).toEqual([]);
});

test('on a phone the objective folds, and the enemy counts are typed only under Custom', async ({ page }) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);

  const card = page.locator('#battle');

  // Four squads out of the box, read-only until the formation is a custom one.
  await expect(card.getByText('Enemy stacks: 4')).toBeVisible();
  const flying = card.getByRole('textbox', { name: 'Flying', exact: true });
  await expect(flying).toHaveAttribute('readonly', '');
  // A segment's radio is the visually hidden input behind the label, which is what a thumb hits.
  await card.getByText('Custom', { exact: true }).click();
  await expect(flying).not.toHaveAttribute('readonly', '');
  await flying.fill('3');
  await flying.press('Enter');
  await expect(card.getByText('Enemy stacks: 6')).toBeVisible();

  // The objective is folded to the chosen one; the helper every spec uses unfolds it and picks.
  const objective = card.getByRole('radiogroup', { name: 'Objective' });
  await expect(objective.getByRole('radio')).toHaveCount(1);
  await chooseObjective(page, 'Best worst case');
  await expect(objective.getByRole('radio')).toHaveCount(1);

  await fillHousing(page, 'Leadership', 4100);
  expect(await pageOverflowsSideways(page)).toBe(false);
  expect(problems).toEqual([]);
});
