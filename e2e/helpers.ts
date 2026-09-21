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

// ---- The command bar (design plan §5.6, story D-56) ---------------------------------------------
/**
 * Housing and the objective live on the bottom edge now, with Generate, at every width. The three
 * helpers below hide the one difference between the two drawings: from 1200 px a pool is a field
 * standing open, and below it a **chip** that becomes that same field when a thumb lands on it.
 */
export type Pool = 'Leadership' | 'Authority' | 'Dominance';

/** A pool's field: on a phone it only exists once the chip has been opened. */
export function housingField(page: Page, pool: Pool): Locator {
  return page.getByRole('textbox', { name: pool, exact: true });
}

/** A pool's chip (phones): its name is the pool and the figure it carries, "Leadership 84 300". */
export function housingChip(page: Page, pool: Pool): Locator {
  return page.getByRole('button', { name: new RegExp(`^${pool} `) });
}

/** The field, open and ready to be typed in — opening the chip first where there is one. */
export async function editHousing(page: Page, pool: Pool): Promise<Locator> {
  const field = housingField(page, pool);
  if ((await field.count()) === 0) await housingChip(page, pool).click();
  await expect(field).toBeVisible();
  return field;
}

/** What a pool reads right now, whichever of the two shapes the width gives it. */
export async function housingValue(page: Page, pool: Pool): Promise<string> {
  const field = housingField(page, pool);
  if ((await field.count()) > 0) return field.inputValue();
  return (await housingChip(page, pool).innerText()).trim();
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
 * Generate, in the command bar (design plan §5.6). Its accessible name carries the state, so the
 * blocked one reads "Generate march: Add housing first"; the prefix is what every spec asks for.
 */
export function generateButton(page: Page): Locator {
  return page.getByRole('button', { name: /^Generate march/ });
}

/**
 * The wrapper the button sits in: it carries `data-state` (ready / stale / running / blocked).
 *
 * The **first** one, because below 1200 px there are two Generates on screen the moment a run
 * finishes — the bar's and the one inside the March sheet the run opens (2026-09-19) — and they are
 * the same control: one `useGenerateRun`, one state, drawn twice by design (design rule 2, the
 * answer and the action travel together).
 */
export function generateState(page: Page): Locator {
  return generateButton(page).first().locator('xpath=..');
}

/**
 * Type one housing capacity in the command bar and commit it. One gesture at both widths: the press
 * that opens a phone's chip is the same press that lands in a desktop's field, and leaving the
 * field puts the figure back.
 *
 * Leaving rather than `Enter`: since the bar became a form, `Enter` is "go" and starts a run
 * (`useBarForm`, `commandbar.spec.ts`), and a helper that fills three pools would start three.
 */
export async function fillHousing(page: Page, pool: Pool, value: number): Promise<void> {
  const field = await editHousing(page, pool);
  await field.fill(String(value));
  await field.blur();
}

/**
 * Fill the three housing capacities and run the engine, waiting for the summary to settle — and,
 * below 1200 px, put the sheet the run opened away again.
 *
 * A finished run opens the March sheet itself since 2026-09-19 (the owner's *"generate should open
 * recap by default when finished"*, `ui/shell/Shell.tsx`). That is the answer arriving, and it is
 * asserted where it belongs — `generate.spec.ts`'s two mobile tests and J1 in `journeys.spec.ts`.
 * Everywhere else a spec only wanted *a march*, and a focus trap over the page it is about to read
 * is not what it asked for: this leaves the page where it was.
 */
export async function generate(
  page: Page,
  housing: { leadership?: number; authority?: number; dominance?: number } = {},
): Promise<void> {
  if (housing.leadership !== undefined) await fillHousing(page, 'Leadership', housing.leadership);
  if (housing.authority !== undefined) await fillHousing(page, 'Authority', housing.authority);
  if (housing.dominance !== undefined) await fillHousing(page, 'Dominance', housing.dominance);
  await generateButton(page).click();
  await settle(page);
  await dismissMarchSheet(page);
}

/** Close the March sheet if the frame opened it on the run that just finished; no-op if it did not. */
export async function dismissMarchSheet(page: Page): Promise<void> {
  if ((await marchSheet(page).count()) === 0) return;
  await closeMarchSheet(page);
}

/**
 * The army a plan is planned from, before the journey's own taps start (S-56). Shared by every spec that
 * needs the plan method, because the seed is fiddly and the failure mode of getting it wrong is a silent
 * one — "There is no campaign to plan from this army".
 *
 * The plan spreads the **hired stock** over the marches it sizes, so an account that has hired nothing
 * leaves it nothing to spread and the engine refuses outright. An *unlimited* mercenary is no better: a
 * stock the plan cannot ration is not a stock it can divide over ten marches. Both were measured on
 * 2026-09-15 — `planCampaign` returns no candidate at all for either. So this hires one mercenary, types
 * what is owned of it, and opens the authority pool that pays for it, then reloads so the document rather
 * than the session is what the run reads.
 */
export async function seedHiredStock(page: Page): Promise<void> {
  const card = page.locator('#mercenaries');
  await card.getByRole('button', { name: 'Hire mercenary…' }).click();
  const search = page.getByRole('textbox', { name: 'Search mercenaries' });
  // The hunter the owner hires (83 owned on his account of 2026-09-18), not a monster: since S-75 every hired
  // stack stands under the lowest troop stack, and a Bear V (66 000 HP a unit) is sheltered ten at a time by a
  // first-run army — one stop on the bar, and a journey with nothing to slide.
  await search.fill('Epic Monster Hunter');
  await page.getByRole('option', { name: 'Epic Monster Hunter VI tier 6' }).click();
  await search.press('Escape');

  // Hired reads "owned unlimited" until the pill's own popover says otherwise (the pill's popover, J2 of
  // `mercenaries.spec.ts`); the plan bounds an unlimited type by the authority pool and the shelter.
  await card.getByRole('button', { name: 'Epic Monster Hunter VI: owned unlimited' }).click();
  const owned = page.getByRole('dialog').getByRole('textbox', { name: 'Owned' });
  await owned.fill('83');
  await owned.press('Tab');
  await page.keyboard.press('Escape');
  await expect(card.getByRole('button', { name: /^Epic Monster Hunter VI: owned 83$/ })).toBeVisible();

  // The hired stock is paid for out of authority, so the pool has to have room for it.
  await fillHousing(page, 'Authority', 40_000);
  await waitForSaved(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { level: 1, name: 'Pyrrhic' })).toBeVisible();
}

/** What a Generate aims at, from 1200 px: one compact select in the command bar. */
export function objectiveSelect(page: Page): Locator {
  return page.getByRole('combobox', { name: 'Objective' });
}
/** The same question on a phone: the bar's fourth chip, named after the objective it carries. */
export function objectiveChip(page: Page): Locator {
  return page.getByRole('button', { name: /^Objective: / });
}

/** The objectives as rows, inside the chip's popover (phones only). */
export function priorityField(page: Page): Locator {
  return page.getByRole('radiogroup', { name: 'Objective' });
}

/**
 * Choose one objective by the words it is written in — the select's option from 1200 px, the
 * popover's row below it (design plan §5.6). Both are named by the title alone.
 */
export async function chooseObjective(page: Page, title: string): Promise<void> {
  const select = objectiveSelect(page);
  if ((await select.count()) > 0) {
    await select.click();
    await page.getByRole('option', { name: title, exact: true }).click();
    await expect(select).toHaveValue(title);
    return;
  }

  const chip = objectiveChip(page);
  await chip.click();
  await priorityField(page).getByRole('radio', { name: title, exact: true }).click();
  await expect(chip).toHaveAccessibleName(`Objective: ${title}`);
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

/** A source's chip: its accessible name says the source and its state (2026-09-17, every family is chips). */
export function sourceSwitch(page: Page, name: string): Locator {
  return bonusesCard(page).getByRole('checkbox', {
    name: new RegExp(`^(Switch on ${name}|${name}, on for this march)$`),
  });
}

/**
 * Flip a source's chip. The control itself is a visually hidden input behind the label it draws,
 * so it is pressed from the keyboard — which is how a player on a keyboard does it, and which never
 * collides with the sticky app bar the way a scrolled click can.
 */
export async function toggleSource(page: Page, name: string): Promise<void> {
  const control = sourceSwitch(page, name);
  await control.focus();
  await page.keyboard.press('Space');
}

/** One source's chip, as a player reads it: the name, then what it is worth under it. */
export function sourceRow(page: Page, name: string): Locator {
  return bonusesCard(page).locator('.mantine-Chip-label').filter({ hasText: name }).first();
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

/**
 * The pane as the frame laid it out: which stand it is in (`top` — head pinned; `tail` — tail pinned
 * above the command bar; `flow` — travelling with the page between the two), its `position` and the
 * `top` written on it, how tall the March is, the room the window leaves it, where its top edge is
 * (beside `setupTop`), and every box inside it that holds more than it shows.
 *
 * The decision is the app's (`shell/usePaneStick.ts`); a spec reads it here rather than working it
 * out again. The room is spelled out — the window, less the pane's own top, the command bar and 24 px
 * of air — because a spec that borrowed the app's own arithmetic could not notice it drifting.
 */
export function paneFrame(page: Page): Promise<{
  stand: string;
  position: string;
  offset: number;
  height: number;
  room: number;
  bottom: number;
  viewport: number;
  top: number;
  setupTop: number;
  scrollers: string[];
}> {
  return page.evaluate(() => {
    const view = globalThis as unknown as {
      innerHeight: number;
      getComputedStyle: (element: unknown) => {
        position: string;
        top: string;
        overflowX: string;
        overflowY: string;
        fontSize: string;
        getPropertyValue: (property: string) => string;
      };
      document: {
        documentElement: unknown;
        querySelector: (selector: string) => unknown;
      };
    };
    const root = view.getComputedStyle(view.document.documentElement);
    const length = (property: string, fallback: number): number => {
      const declared = root.getPropertyValue(property).trim();
      const value = Number.parseFloat(declared);
      if (!Number.isFinite(value)) return fallback;
      return declared.endsWith('rem') ? value * (Number.parseFloat(root.fontSize) || 16) : value;
    };
    const pane = view.document.querySelector('aside') as unknown as {
      dataset: { stand?: string };
      getBoundingClientRect: () => { height: number; bottom: number; top: number };
      querySelectorAll: (selector: string) => Iterable<unknown>;
    } | null;
    const empty = {
      stand: 'none',
      position: 'none',
      offset: 0,
      height: 0,
      room: 0,
      bottom: 0,
      viewport: 0,
      top: 0,
      setupTop: 0,
    };
    if (pane === null) return { ...empty, scrollers: [] };
    // The first setup card, whose own top edge the pane shares (both columns open on the same line).
    const first = view.document.querySelector('#troops') as unknown as {
      getBoundingClientRect: () => { top: number };
    } | null;

    const scrollers: string[] = [];
    for (const node of pane.querySelectorAll('*')) {
      const style = view.getComputedStyle(node);
      const element = node as unknown as {
        tagName: string;
        scrollWidth: number;
        scrollHeight: number;
        clientWidth: number;
        clientHeight: number;
      };
      const vertical = element.scrollHeight > element.clientHeight + 2 && /auto|scroll/.test(style.overflowY);
      const horizontal = element.scrollWidth > element.clientWidth + 2 && /auto|scroll/.test(style.overflowX);
      if (vertical || horizontal)
        scrollers.push(`${element.tagName.toLowerCase()} (${style.overflowX}/${style.overflowY})`);
    }

    const rect = pane.getBoundingClientRect();
    const style = view.getComputedStyle(pane);
    return {
      stand: pane.dataset.stand ?? 'none',
      position: style.position,
      offset: Math.round(Number.parseFloat(style.top) || 0),
      height: Math.round(rect.height),
      room: Math.round(
        view.innerHeight - length('--mantine-spacing-lg', 16) - length('--pyr-commandbar-height', 92) - 24,
      ),
      bottom: Math.round(rect.bottom),
      viewport: view.innerHeight,
      top: Math.round(rect.top),
      setupTop: Math.round(first?.getBoundingClientRect().top ?? 0),
      scrollers,
    };
  });
}

/** The phone command bar's answer line: pressing it opens the March sheet. */
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
 *
 * It opens nothing when the frame has already opened it on a finished run (2026-09-19): "open the
 * March sheet" is the same instruction either way, and a press on a summary under the scrim is not.
 */
export async function openMarchSheet(page: Page): Promise<Locator> {
  if ((await marchSheet(page).count()) === 0) await recapSummary(page).click();
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

/** Generate, in the one place the frame puts it now — the command bar, at both widths. */
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
/**
 * The March's second half, at the foot of the setup column (owner, 2026-09-15): the objectives
 * comparison, the HP profile and the battle story, the saved list and the row of whole-march actions.
 *
 * It is drawn **instead of** the sheet's copy of the same blocks (`ui/sections/march/MarchFoot.tsx`,
 * `MarchSection.tsx`), so a control that moved here is on this page once and only once. Below
 * 1200 px there is no foot at all — the March is the sheet and carries them itself — which is why
 * the specs that touch a moved control say which width they mean.
 */
export function marchFoot(page: Page): Locator {
  return page.locator('#march-foot');
}

export function marchSection(page: Page): Locator {
  return page.locator('#march');
}

/**
 * The march as pills (design plan §5.5, the owner's corrections of 2026-09-13): one two-line pill per
 * marching stack, coloured by tier. A press **leaves that type out**, which is what the name says.
 */
export function marchPills(page: Page): Locator {
  return marchSection(page).getByRole('button', { name: /: leave out$/ });
}

/** The mark in a pill's corner: the only way into the unit sheet. */
export function marchPillDetails(page: Page): Locator {
  return marchSection(page).getByRole('button', { name: /^Details: / });
}

/** The small outlined row under the pools: the types the search or the player left out. */
export function marchLeftOut(page: Page): Locator {
  return marchSection(page).getByRole('button', { name: /: put back$/ });
}

/**
 * The march as a player would read it off the section: "ARC1 624", one entry per marching stack.
 *
 * Read from the `data-stack` / `data-count` pair each tile carries rather than from its drawing:
 * the tile writes its code and its tier as two separate pieces of text, which is right on screen
 * and unreadable from here.
 */
export async function marchStackLabels(page: Page): Promise<string[]> {
  // One evaluation, not one round-trip per pill: a March edit re-sizes the march in place, so a
  // pill-by-pill read can splice the answer before the edit onto the answer after it.
  return page.$$eval('#march [data-stack]', (tiles) =>
    tiles.flatMap((tile) => {
      const label = tile.getAttribute('data-stack');
      const count = Number(tile.getAttribute('data-count'));
      return label !== null && count > 0 ? [`${label} ${String(count)}`] : [];
    }),
  );
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

/**
 * The same figure as **words** rather than as a number: the recap's training queue is written "13d 21h"
 * (`format.ts`, `duration`), which is not a figure `figureNumber` can read and is exactly the point.
 */
export function marchFigureWords(page: Page, label: string): Locator {
  return page
    .locator('[aria-label="March figures"]')
    .first()
    .locator(`xpath=.//dt[contains(., ${JSON.stringify(label)})]/following-sibling::dd[1]`);
}

/** The hero figure: the expected damage, the first thing the recap prints. */
export async function marchExpectedDamage(page: Page): Promise<number> {
  const recap = page.locator('[aria-label="This march in figures"]').first();
  return figureNumber(await recap.innerText());
}

/**
 * Turn every pill's count into a field, or back into a figure to copy. One toggle button, whose
 * label says what the next press does (owner, 2026-09-13).
 */
export async function setCountsMode(page: Page, mode: 'edit' | 'copy'): Promise<void> {
  const name = mode === 'edit' ? 'Edit counts' : 'Done editing';
  // Scoped to neither host: the two are mutually exclusive (foot on a desktop, sheet below 1200 px),
  // so one page-wide lookup finds the toggle at every width — and finds it exactly once.
  const toggle = page.getByRole('button', { name, exact: true });
  if ((await toggle.count()) > 0) await toggle.click();
  await expect(
    page.getByRole('button', { name: mode === 'edit' ? 'Done editing' : 'Edit counts' }),
  ).toBeVisible();
}
