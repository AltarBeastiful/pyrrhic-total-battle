/**
 * Shared plumbing for the smoke suite. Everything here is selector-level glue: the specs themselves
 * only ever talk about roles and accessible names, so a class or a layout change cannot break them.
 */
import { expect, type Locator, type Page } from '@playwright/test';

/**
 * `e2e/` is compiled by `tsconfig.node.json`, which has no DOM lib (Node types and DOM globals clash),
 * so the snippets handed to `page.evaluate` cast `globalThis` to just the shape they touch. The cast has
 * to sit inside the callback: the function is serialised into the browser and cannot close over
 * anything declared out here.
 */

/** The sections of the design plan §5.1, in the order the shell renders them. */
export const SECTION_TITLES = ['Troops', 'Mercenaries', 'Bonuses', 'Battle', 'March'] as const;

/**
 * Open the app and wait until it has stopped moving.
 *
 * On a first visit the service worker claims the page and `registerServiceWorker` reloads on
 * `controllerchange`, so the app navigates once on its own a few hundred milliseconds in. Waiting for
 * the worker to be in control keeps that reload from landing in the middle of a test.
 */
export async function openApp(page: Page): Promise<void> {
  await page.goto('/');
  await page
    .waitForFunction(
      () => {
        const view = globalThis as unknown as { navigator: { serviceWorker?: { controller: unknown } } };
        return (view.navigator.serviceWorker?.controller ?? null) !== null;
      },
      undefined,
      { timeout: 15_000 },
    )
    .catch(() => undefined);
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { level: 1, name: 'Pyrrhic' })).toBeVisible();
}

/** Console errors and uncaught exceptions collected for the lifetime of the page. */
export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => {
    problems.push(`pageerror: ${error.message}`);
  });
  return problems;
}

export function housingField(page: Page, pool: 'Leadership' | 'Authority' | 'Dominance'): Locator {
  return page.getByRole('textbox', { name: pool, exact: true });
}

/**
 * One end of a troop group's tier range (the owner's correction of 2026-09-13): a stepper, whose
 * value is a `spinbutton` written with its prefix ("G3") and whose arrows are two buttons beside it.
 */
export function tierStepper(scope: Locator, name: string): Locator {
  return scope.getByRole('spinbutton', { name, exact: true });
}

/** Walk one end of a range by `steps` positions; negative walks down. */
export async function stepTier(scope: Locator, name: string, steps: number): Promise<void> {
  const arrow = scope.getByRole('button', {
    name: `${name}: one tier ${steps < 0 ? 'down' : 'up'}`,
    exact: true,
  });
  for (let index = 0; index < Math.abs(steps); index += 1) await arrow.click();
}

/**
 * The floating Generate button (design plan §5.3). Its accessible name carries the state, so the
 * blocked one reads "Generate march: Add housing first"; the prefix is what every spec asks for.
 */
export function generateButton(page: Page): Locator {
  return page.getByRole('button', { name: /^Generate march/ });
}

/** The wrapper the button sits in: it carries `data-state` (ready / stale / running / blocked). */
export function generateState(page: Page): Locator {
  return generateButton(page).locator('xpath=..');
}

/**
 * Type one housing capacity and commit it: the Battle card's steppers keep what you type to
 * themselves until the field is left or `Enter` is pressed, so a `fill` alone never reaches the march.
 */
export async function fillHousing(
  page: Page,
  pool: 'Leadership' | 'Authority' | 'Dominance',
  value: number,
): Promise<void> {
  const field = housingField(page, pool);
  await field.fill(String(value));
  await field.press('Enter');
}

/** Fill the three housing capacities and run the engine, waiting for the summary to settle. */
export async function generate(
  page: Page,
  housing: { leadership?: number; authority?: number; dominance?: number } = {},
): Promise<void> {
  if (housing.leadership !== undefined) await fillHousing(page, 'Leadership', housing.leadership);
  if (housing.authority !== undefined) await fillHousing(page, 'Authority', housing.authority);
  if (housing.dominance !== undefined) await fillHousing(page, 'Dominance', housing.dominance);
  await generateButton(page).click();
  await settle(page);
}

/**
 * What a Generate aims at, in the Battle card: a radio group whose options are named by their title
 * ("Best worst case" is the worst-case objective).
 */
export function priorityField(page: Page): Locator {
  return page.getByRole('radiogroup', { name: 'Objective' });
}

/**
 * Choose one objective by the words it is written in. The press lands on the row's own text: the
 * radio itself sits under the mark the row draws, which is what a player presses too.
 *
 * The name is asked for as a prefix, not as the whole string: from the medium window up the options
 * are cards named by their title alone, and under it they are rows whose name is the title and the
 * sentence run together (D-54).
 */
export async function chooseObjective(page: Page, title: string): Promise<void> {
  // Inside Material 3's compact window the list is folded to the chosen row; unfold it first.
  const change = priorityField(page).getByRole('button', { name: 'Change Objective' });
  if (await change.isVisible()) await change.click();
  await priorityField(page).getByText(title, { exact: true }).click();
  await expect(priorityField(page).getByRole('radio', { name: new RegExp(`^${title}`) })).toBeChecked();
}

/** Wait until no Generate run is in flight (a priority search runs for up to eight seconds). */
export async function settle(page: Page): Promise<void> {
  await expect(generateState(page)).not.toHaveAttribute('data-state', 'running', { timeout: 30_000 });
}

// ---- The account menu ---------------------------------------------------------------------------
/** The top bar's one control; its accessible name is "Account: <profile name>". */
export function accountButton(page: Page): Locator {
  return page.getByRole('button', { name: /^Account: / });
}

export async function openAccountMenu(page: Page): Promise<Locator> {
  await accountButton(page).click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  return menu;
}

/** Open the menu and choose one item by name, waiting for the menu to close behind it. */
export async function chooseInAccountMenu(page: Page, name: string | RegExp): Promise<void> {
  await openAccountMenu(page);
  await page.getByRole('menuitem', { name }).click();
  await expect(page.getByRole('menu')).toBeHidden();
}

/** Rename the active profile through the menu and its dialog. */
export async function renameProfile(page: Page, name: string): Promise<void> {
  await chooseInAccountMenu(page, /^Rename profile/);
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Profile name').fill(name);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(accountButton(page)).toHaveAccessibleName(`Account: ${name}`);
}

/** Wait until the debounced write has landed: the menu's one-word status says so. */
export async function waitForSaved(page: Page): Promise<void> {
  const menu = await openAccountMenu(page);
  await expect(menu.getByText('Saved', { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
}

/** Names of every profile in the switcher, the active one without its spoken marker. */
export async function profileNames(page: Page): Promise<string[]> {
  const menu = await openAccountMenu(page);
  const names = await menu
    .getByRole('group', { name: 'Switch profile' })
    .getByRole('menuitem')
    .allInnerTexts();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  return names.map((name) => name.replace(/\s*\(active\)\s*$/, '').trim());
}

/** True when the document is wider than the viewport (PLAN §4: mobile first, never a sideways scroll). */
export function pageOverflowsSideways(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const view = globalThis as unknown as {
      innerWidth: number;
      document: { documentElement: { scrollWidth: number } };
    };
    return view.document.documentElement.scrollWidth > view.innerWidth;
  });
}

/** The resolved theme written on `<html data-theme>`. */
export function themeAttribute(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const view = globalThis as unknown as {
      document: { documentElement: { dataset: { theme?: string } } };
    };
    return view.document.documentElement.dataset.theme;
  });
}

// ---- The Bonuses card ---------------------------------------------------------------------------
/** The Bonuses card. Its editors are sheets in a portal, so they live outside this locator. */
export function bonusesCard(page: Page): Locator {
  return page.locator('#bonuses');
}

/** The line that unfolds the sources; its `aria-expanded` is the card's open state. */
export function bonusesDisclosure(page: Page): Locator {
  return bonusesCard(page).getByRole('button', { name: /^Sources/ });
}

/** Unfold the sources, if they are not already. */
export async function openBonuses(page: Page): Promise<void> {
  const trigger = bonusesDisclosure(page);
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
}

/**
 * One of the four labelled figures of the TOTAL ("Health", "Strength", "Special", "Sources on"),
 * read from the card's own header rather than from an editor repeating it.
 */
export async function bonusTotal(page: Page, label: string): Promise<string> {
  const figures = bonusesCard(page).locator('[aria-label="Army bonus totals"]').first();
  const value = figures.locator(
    `xpath=.//dt[normalize-space()=${JSON.stringify(label)}]/following-sibling::dd[1]`,
  );
  return (await value.innerText()).trim();
}

/** A source row's switch: its accessible name is the source itself. */
export function sourceSwitch(page: Page, name: string): Locator {
  return bonusesCard(page).getByRole('switch', { name, exact: true });
}

/**
 * Flip a source row's switch. The control itself is a visually hidden input behind the track it
 * draws, so it is pressed from the keyboard — which is how a player on a keyboard does it, and
 * which never collides with the sticky app bar the way a scrolled click can.
 */
export async function toggleSource(page: Page, name: string): Promise<void> {
  const control = sourceSwitch(page, name);
  await control.focus();
  await page.keyboard.press('Space');
}

/** One source row, as a player reads it: the name, then what it is worth. */
export function sourceRow(page: Page, name: string): Locator {
  return bonusesCard(page).getByRole('listitem').filter({ hasText: name }).first();
}

/** Open a source's editor through its gear and wait for the sheet. */
export async function openSourceEditor(page: Page, name: string): Promise<Locator> {
  await bonusesCard(page)
    .getByRole('button', { name: `Edit ${name}` })
    .click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  return sheet;
}

/** Pick an option out of a kit Select; its trigger is named "<current value> <label>". */
export async function chooseInSelect(scope: Locator, label: string, option: string): Promise<void> {
  await scope.getByRole('button', { name: new RegExp(`${label}$`) }).click();
  await scope.page().getByRole('option', { name: option, exact: true }).click();
}

/** Add a captain through the Captains group and set it up in the sheet that opens. */
export async function addCaptain(page: Page, name: string, level: number): Promise<void> {
  await bonusesCard(page).getByRole('button', { name: 'Add captain' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await chooseInSelect(sheet, 'Captain', name);
  await sheet.getByRole('textbox', { name: 'Base level' }).fill(String(level));
  await sheet.getByRole('textbox', { name: 'Base level' }).blur();
  await sheet.getByRole('button', { name: 'Done' }).click();
  await expect(sheet).toBeHidden();
}

// ---- The captain grid (design plan §7.3 as amended, D-33) ---------------------------------------
/**
 * One captain tile's body. Its accessible name carries the state, the way the unit tiles do, so the
 * two forms are asked for separately: "Enlist Beowulf" before, "Beowulf, enlisted" after.
 */
export function captainTile(page: Page, name: string): Locator {
  return bonusesCard(page).getByRole('button', { name: new RegExp(`^(Enlist ${name}|${name}, enlisted)$`) });
}

/** The badge at the bottom right of a tile: "20 ★3" once set, "Set level" before. */
export function captainBadge(page: Page, name: string): Locator {
  return bonusesCard(page).getByRole('button', { name: new RegExp(`^(Set|Change) ${name}’s level$`) });
}

/** Tap a tile body: send that captain on this march, or take it out again. */
export async function toggleCaptain(page: Page, name: string): Promise<void> {
  await captainTile(page, name).click();
}

/** Open a captain's badge and type its level and its stars. */
export async function setCaptainLevel(page: Page, name: string, level: number, star: number): Promise<void> {
  await captainBadge(page, name).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  for (const [label, value] of [
    ['Base level', level],
    ['Stars', star],
  ] as const) {
    const field = sheet.getByRole('textbox', { name: label });
    await field.fill(String(value));
    await field.blur();
  }
  await sheet.getByRole('button', { name: 'Done' }).click();
  await expect(sheet).toBeHidden();
}

/** Enlist a captain and set it up, the whole journey the grid replaced the Add button with. */
export async function enlistCaptain(page: Page, name: string, level: number, star = 0): Promise<void> {
  await toggleCaptain(page, name);
  await setCaptainLevel(page, name, level, star);
}

// ---- The frame (M-03, design plan §5.1 — frame V1) ----------------------------------------------
/**
 * The setup cards, in registry order. The March is the fifth section and the one that moves: it is
 * inside the supporting pane from 1200 px and in the page flow below that, so a spec asks for it
 * through `marchPane` / `recapSummary` rather than through this list.
 */
export const SETUP_TITLES = ['Troops', 'Mercenaries', 'Bonuses', 'Battle'] as const;

/** The March as M3's trailing supporting pane: only from 1200 px, sticky under the app bar. */
export function marchPane(page: Page): Locator {
  return page.locator('main aside');
}

/** The Material bottom app bar's summary, below 1200 px: pressing it opens the March sheet. */
export function recapSummary(page: Page): Locator {
  return page.getByRole('button', { name: 'Open the march recap' });
}

/**
 * The March sheet (design rule 5 as resolved 2026-09-13): below 1200 px the whole March section is
 * in it, and it is the only place the answer is written in full.
 */
export function marchSheet(page: Page): Locator {
  return page.getByRole('dialog', { name: 'March' });
}

/**
 * Open it from the bar's summary and wait for it to settle — really settle: the sheet slides up and
 * fades in over 300 ms, and a half-transparent surface reads as a contrast failure that is not
 * there (the same trap `a11y.spec.ts` already avoids with the account menu).
 */
export async function openMarchSheet(page: Page): Promise<Locator> {
  await recapSummary(page).click();
  const sheet = marchSheet(page);
  await expect(sheet).toBeVisible();
  await sheet.evaluate(async (node) => {
    const element = node as unknown as {
      getAnimations: (options?: { subtree?: boolean }) => { finished: Promise<unknown> }[];
    };
    await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished));
  });
  return sheet;
}

export async function closeMarchSheet(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(marchSheet(page)).toBeHidden();
}

/**
 * The answer as the frame shows it right now, whatever the width: the pane's recap figures on a
 * desktop, the bottom bar's one-line summary on a phone. A journey compares this before and after a
 * run, because it is exactly what the player sees change.
 */
export async function marchAnswer(page: Page): Promise<string> {
  const recap = page.locator('[aria-label="This march in figures"]');
  if ((await recap.count()) > 0) return (await recap.first().innerText()).trim();
  return (await recapSummary(page).innerText()).trim();
}

/** Generate, wherever the frame put it — the March pane's header or the bottom app bar. */
export function generateControl(page: Page): Locator {
  return page.getByRole('button', { name: /generate/i });
}

/**
 * The profiles in the account menu's switcher, read from the rows under its own heading. Kit2's
 * `AppMenu` writes the heading as a menu label and the rows after it, which is the shape a menu
 * groups with; the label's parent is the group.
 */
export async function switchProfileNames(page: Page): Promise<string[]> {
  const menu = await openAccountMenu(page);
  const names = await menu
    .getByText('Switch profile', { exact: true })
    .locator('xpath=..')
    .getByRole('menuitem')
    .allInnerTexts();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  return names.map((name) => name.trim());
}

// ---- The March section (design plan §7.5, M-08) -------------------------------------------------
/**
 * The March itself. It is a landmark named by its own heading, and it moves: the supporting pane
 * from 1200 px, the page flow below that. Its anchor is `march`, which is also the registry id.
 */
export function marchSection(page: Page): Locator {
  return page.locator('#march');
}

/**
 * The march as pills (design plan §5.5, the owner's correction of 2026-09-13): one two-line pill per
 * marching stack, coloured by tier. A press copies the count, which is what the name says.
 */
export function marchPills(page: Page): Locator {
  // `Copy <count>, <unit>` — the digit keeps "Copy all counts" out of the list.
  return marchSection(page).getByRole('button', { name: /^Copy \d/ });
}

/** The small outlined row under the pools: the types the search or the player left out. */
export function marchLeftOut(page: Page): Locator {
  return marchSection(page).getByRole('button', { name: /left out — keep in march$/ });
}

/**
 * The march as a player would read it off the section: "ARC1 624", one entry per marching stack.
 *
 * Read from the `data-stack` / `data-count` pair each tile carries rather than from its drawing:
 * the tile writes its code and its tier as two separate pieces of text, which is right on screen
 * and unreadable from here.
 */
export async function marchStackLabels(page: Page): Promise<string[]> {
  const tiles = marchSection(page).locator('[data-stack]');
  const total = await tiles.count();
  const labels: string[] = [];
  for (let index = 0; index < total; index += 1) {
    const tile = tiles.nth(index);
    const label = await tile.getAttribute('data-stack');
    const count = Number(await tile.getAttribute('data-count'));
    if (label !== null && count > 0) labels.push(`${label} ${String(count)}`);
  }
  return labels;
}

/** How many stacks the march fields. */
export async function marchStackCount(page: Page): Promise<number> {
  return (await marchStackLabels(page)).length;
}

/**
 * A figure, whatever separator it is written with: the app groups thousands with a space, the way
 * the number fields do ("19 639 721"), and a ratio keeps its decimals. `\s` covers every space the
 * formatter may put there, the non-breaking ones included.
 */
function figureNumber(text: string): number {
  const match = /\d[\d\s]*(\.\d+)?/.exec(text);
  return match === null ? Number.NaN : Number(match[0].replace(/\s/g, ''));
}

/**
 * One recap figure by the words it is written in ("Worst opening", "Silver to recover"). The recap
 * travels with Generate, so it is looked up on the page rather than inside the section: it is in
 * the pane's header on a desktop and in the section on a phone — one of the two, never both.
 */
export async function marchFigure(page: Page, label: string): Promise<number> {
  const value = page
    .locator('[aria-label="March figures"]')
    .first()
    // `contains`, not `=`: a figure's label may open with a glyph ("🪙 Silver to recover").
    .locator(`xpath=.//dt[contains(., ${JSON.stringify(label)})]/following-sibling::dd[1]`);
  return figureNumber(await value.innerText());
}

/** The hero figure: the expected damage, the first thing the recap prints. */
export async function marchExpectedDamage(page: Page): Promise<number> {
  const recap = page.locator('[aria-label="This march in figures"]').first();
  return figureNumber(await recap.innerText());
}

/** Turn every pill's count into a field, or back into a figure to copy. */
export async function setCountsMode(page: Page, mode: 'Copy counts' | 'Edit counts'): Promise<void> {
  await marchSection(page).getByText(mode, { exact: true }).click();
  await expect(page.getByRole('radio', { name: mode, exact: true })).toBeChecked();
}
