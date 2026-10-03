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

test('the card opens on the TOTAL with the captains already under it', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  const card = bonusesCard(page);
  await expect(card.getByRole('heading', { level: 2, name: 'Bonuses' })).toBeVisible();
  // No "Sources" line to press first (owner, 2026-09-19): the family that changes every fight is
  // the first thing under the figures.
  await expect(card.getByRole('button', { name: /^Sources/ })).toHaveCount(0);
  // The chip's own input is visually hidden behind its label, so the label is what "on screen" means.
  await expect(await chipLabel(page, 'Beowulf')).toBeVisible();

  // Four labelled figures, all readable at a glance.
  expect(await bonusTotal(page, 'Health')).toBe('0 %');
  expect(await bonusTotal(page, 'Strength')).toBe('0 %');
  expect(await bonusTotal(page, 'Special')).toBe('0 %');
  // None: a new account has chosen no captain, worn no title and switched nothing on. VIP and the
  // dragon used to stand on and empty here, and counted three (owner, 2026-09-19).
  expect(await bonusTotal(page, 'Sources on')).toBe('0');

  expect(problems).toEqual([]);
});

test('a captain enlisted and levelled through its gear moves the TOTAL', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

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
  await page.getByRole('option', { name: '★4' }).click();
  await page.keyboard.press('Escape');

  expect(await bonusTotal(page, 'Health')).toBe('+230 %');
  expect(await bonusTotal(page, 'Strength')).toBe('+230 %');

  // The chip wears the dot that says a level is recorded — a disc in the gear's strip since S-70, not a
  // typed bullet — and the gear renamed itself.
  await expect((await chipLabel(page, 'Beowulf')).locator('[class*="chipDot"]')).toHaveCount(1);
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

test('a piece of equipment is filled in from its sheet, and the card wears it', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  // Nothing is equipped yet, so the family is one Add line (rule 12); the piece is created and its
  // own sheet opens on it.
  await bonusesCard(page).getByRole('button', { name: 'Add equipment' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toHaveAccessibleName('Emerald Guardian');

  // **The defect the owner found on 2026-09-28** (theme.ts, `LAYERS`): a `Select`'s list is a
  // portalled Mantine popover, and Mantine's own z-index for one is 300 — under the sheet's 320 — so
  // the list opened *behind* the sheet and the sheet's overlay swallowed every click. Neither the
  // type nor the quality could be filled in. These two clicks are the guard: when the ladder slips,
  // the pointer lands on the overlay and Playwright refuses the click as intercepted. Nothing in
  // jsdom can see this — it is layout and paint, not markup.
  await sheet.getByRole('combobox', { name: 'Equipment type' }).click();
  // The list is *typed into* (rule 11): the field selects its own value on focus, the rule every
  // figure on this page follows, so these letters replace the piece instead of appending to it —
  // "guardian" over "Emerald Guardian" filtered on "Emerald Guardianguard" and found nothing at all.
  await sheet.getByRole('combobox', { name: 'Equipment type' }).pressSequentially('guardian');
  await expect(page.getByRole('option', { name: "Guardsmen's Courage" })).toBeHidden();
  await page.getByRole('option', { name: 'Guardian of Justice' }).click();
  await expect(sheet).toHaveAccessibleName('Guardian of Justice');

  await sheet.getByRole('combobox', { name: 'Quality' }).click();
  await page.getByRole('option', { name: 'Godlike' }).click();
  // What the sheet says the piece is worth now, straight off the quality table.
  await expect(sheet.getByText('Guardsmen +85.3 % health / +85.3 % strength')).toBeVisible();

  await sheet.getByRole('button', { name: 'Done' }).click();

  // The chip is the form (rule 6): it wears the piece's name and what it is worth.
  const chip = bonusesCard(page).getByRole('checkbox', { name: /Guardian of Justice/ });
  await expect(chip).toBeChecked();
  const id = await chip.getAttribute('id');
  await expect(bonusesCard(page).locator(`label[for="${String(id)}"]`)).toContainText(
    '+85.3 % health and strength (guardsmen)',
  );

  expect(problems).toEqual([]);
});

test('the fourth captain is refused, in one line', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  for (const name of ['Beowulf', 'Aydae', 'Skadi']) await tapCaptain(page, name);
  await tapCaptain(page, 'Brann');

  await expect(
    bonusesCard(page).getByRole('status').filter({ hasText: 'Three captains at most' }),
  ).toContainText('Three captains at most march together. Take one out first.');
  await expect(captainChip(page, 'Brann')).not.toBeChecked();

  expect(problems).toEqual([]);
});

test('what was set on a source survives a reload', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
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

  await expect(captainChip(page, 'Beowulf')).toBeChecked();
  expect(await bonusTotal(page, 'Health')).toBe('+12 %');

  expect(problems).toEqual([]);
});
