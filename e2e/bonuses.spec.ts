/**
 * Journey J3 — "my bonuses changed" (design plan §3, §7.3, stories D-30 and D-34).
 *
 * Open Bonuses, find the captain, change its level, check the TOTAL moved. The card is one line
 * until it is unfolded; captains are TotalStack's chips — tap one to send it on this march, tap the
 * gear on its corner to say what level it is — and the fourth is refused in one polite line.
 *
 * The bonuses locators live here rather than in `helpers.ts`: they are this card's anatomy and
 * nothing else uses them.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import { openApp, watchConsole } from './helpers';

/** The Bonuses card. Its sheets are portalled, so they live outside this locator. */
const bonusesCard = (page: Page): Locator => page.locator('#bonuses');

/** The line that unfolds the sources; its `aria-expanded` is the card's open state. */
const bonusesDisclosure = (page: Page): Locator =>
  bonusesCard(page).getByRole('button', { name: /^Sources/ });

async function openBonuses(page: Page): Promise<void> {
  const trigger = bonusesDisclosure(page);
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
}

/**
 * One of the four labelled figures of the TOTAL ("Health", "Strength", "Special", "Sources on"),
 * read from the card's own header rather than from an editor repeating it.
 */
async function bonusTotal(page: Page, label: string): Promise<string> {
  const figures = bonusesCard(page).locator('[aria-label="Army bonus totals"]').first();
  const value = figures.locator(
    `xpath=.//dt[normalize-space()=${JSON.stringify(label)}]/following-sibling::dd[1]`,
  );
  return (await value.innerText()).trim();
}

/** A captain chip, by either of the two names it wears. */
const captainChip = (page: Page, name: string): Locator =>
  bonusesCard(page).getByRole('checkbox', {
    name: new RegExp(`^(Send ${name} on this march|${name}, riding with this march)$`),
  });

/** The gear on a chip's top-right corner; only captains with stack data carry one. */
const captainGear = (page: Page, name: string): Locator =>
  bonusesCard(page).getByRole('button', { name: new RegExp(`^(Set|Change) ${name}’s level$`) });

/** What a chip reads as. Mantine draws it as a `<label for>` beside the (hidden) input. */
async function chipLabel(page: Page, name: string): Promise<Locator> {
  const id = await captainChip(page, name).getAttribute('id');
  return bonusesCard(page).locator(`label[for="${String(id)}"]`);
}

/** Tap the chip body: the input itself is the visually hidden control behind the label. */
async function tapCaptain(page: Page, name: string): Promise<void> {
  await (await chipLabel(page, name)).click();
}

test('the card is the TOTAL until it is opened', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  const card = bonusesCard(page);
  await expect(card.getByRole('heading', { level: 2, name: 'Bonuses' })).toBeVisible();
  await expect(bonusesDisclosure(page)).toHaveAttribute('aria-expanded', 'false');

  // Four labelled figures, all readable without opening anything.
  expect(await bonusTotal(page, 'Health')).toBe('0 %');
  expect(await bonusTotal(page, 'Strength')).toBe('0 %');
  expect(await bonusTotal(page, 'Special')).toBe('0 %');
  expect(await bonusTotal(page, 'Sources on')).toBe('3');

  expect(problems).toEqual([]);
});

test('a captain enlisted and levelled through its gear moves the TOTAL', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await openBonuses(page);

  // Every captain is already on screen: the chips are the form, so there is nothing to add.
  await expect(bonusesCard(page).getByRole('button', { name: 'Add captain' })).toHaveCount(0);
  await expect(captainChip(page, 'Beowulf')).not.toBeChecked();

  // Beowulf gives the whole army 1 % of health and of strength per level, plus 210 % at three stars.
  await tapCaptain(page, 'Beowulf');
  await expect(captainChip(page, 'Beowulf')).toBeChecked();

  await captainGear(page, 'Beowulf').click();
  const level = page.getByRole('textbox', { name: 'Base level' });
  await level.fill('20');
  await level.blur();
  expect(await bonusTotal(page, 'Health')).toBe('+20 %');

  await page.getByRole('combobox', { name: 'Star level' }).click();
  await page.getByRole('option', { name: '★3' }).click();
  await page.keyboard.press('Escape');

  expect(await bonusTotal(page, 'Health')).toBe('+230 %');
  expect(await bonusTotal(page, 'Strength')).toBe('+230 %');

  // The chip wears the dot that says a level is recorded, and the gear renamed itself.
  await expect(await chipLabel(page, 'Beowulf')).toContainText('•');
  await expect(captainGear(page, 'Beowulf')).toHaveAccessibleName('Change Beowulf’s level');

  // The gear is its own target: opening it again never changes who marches.
  await captainGear(page, 'Beowulf').click();
  await expect(page.getByRole('textbox', { name: 'Base level' })).toHaveValue('20');
  await page.keyboard.press('Escape');
  await expect(captainChip(page, 'Beowulf')).toBeChecked();

  // And the chip takes it out again.
  await tapCaptain(page, 'Beowulf');
  await expect(captainChip(page, 'Beowulf')).not.toBeChecked();
  expect(await bonusTotal(page, 'Health')).toBe('0 %');

  expect(problems).toEqual([]);
});

test('the fourth captain is refused, in one line', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await openBonuses(page);

  for (const name of ['Beowulf', 'Aydae', 'Skadi']) await tapCaptain(page, name);
  await tapCaptain(page, 'Brann');

  await expect(
    bonusesCard(page).getByRole('status').filter({ hasText: 'Three captains at most' }),
  ).toContainText('Three captains at most march together. Take one out first.');
  await expect(captainChip(page, 'Brann')).not.toBeChecked();

  expect(problems).toEqual([]);
});

test('the card remembers being open, and the sources survive a reload', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await openBonuses(page);
  await tapCaptain(page, 'Beowulf');

  await captainGear(page, 'Beowulf').click();
  const level = page.getByRole('textbox', { name: 'Base level' });
  await level.fill('12');
  await level.blur();
  await page.keyboard.press('Escape');

  // The document is written back debounced, and the captain and its level are two edits: waiting for
  // the name alone reloads on the *first* write whenever the machine is slow enough for it to have
  // landed before the level was typed, and reads the level back as 0.
  await page.waitForFunction(
    () => {
      const view = globalThis as unknown as { localStorage: { getItem: (k: string) => string | null } };
      const stored = view.localStorage.getItem('pyrrhic.v1') ?? '';
      return stored.includes('beowulf') && /"level":\s*12\b/.test(stored);
    },
    undefined,
    { timeout: 10_000 },
  );

  await page.reload();
  await page.waitForLoadState('networkidle');

  await expect(bonusesDisclosure(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(captainChip(page, 'Beowulf')).toBeChecked();
  expect(await bonusTotal(page, 'Health')).toBe('+12 %');

  expect(problems).toEqual([]);
});
