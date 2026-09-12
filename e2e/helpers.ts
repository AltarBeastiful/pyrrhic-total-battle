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

/** The seven sections of PLAN §4, in the order the shell renders them. */
export const SECTION_TITLES = [
  'Troops',
  'Mercenaries',
  'Stacking method',
  'Bonuses',
  'Enemy formation',
  'Housing and march',
  'Results',
] as const;

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

/** Fill the three housing capacities and run the engine, waiting for the summary to settle. */
export async function generate(
  page: Page,
  housing: { leadership?: number; authority?: number; dominance?: number } = {},
): Promise<void> {
  if (housing.leadership !== undefined) {
    await housingField(page, 'Leadership').fill(String(housing.leadership));
  }
  if (housing.authority !== undefined) {
    await housingField(page, 'Authority').fill(String(housing.authority));
  }
  if (housing.dominance !== undefined) {
    await housingField(page, 'Dominance').fill(String(housing.dominance));
  }
  await generateButton(page).click();
  await settle(page);
}

/** The shape of a stack chip's accessible name: "<short label> <count>", e.g. "ARC1 624". */
const STACK_CHIP = /^[A-Z]{2,5}\d+ [\d,]+$/;

/**
 * The result chips, matched on that name shape, which keeps the helper independent of which unit types
 * the formation happens to contain.
 */
export function stackPills(page: Page): Locator {
  return page.locator('#results').getByRole('button', { name: STACK_CHIP });
}

/**
 * The chips as a player hears them: "ARC1 624".
 *
 * Not `innerText` — a chip carries a decorative `UnitBadge` that prints the tier as its own line, so the
 * visible text reads "3 / ARC3 / 192". The accessible name leaves the badge out (it is `aria-hidden`),
 * which is exactly the label the specs reason about.
 */
export async function stackLabels(page: Page): Promise<string[]> {
  const snapshot = await page.locator('#results').ariaSnapshot();
  return [...snapshot.matchAll(/- button "([A-Z]{2,5}\d+ [\d,]+)"/g)].map((match) => match[1] ?? '');
}

/** How many stacks the battle summary reports ("10 stacks", under the "Battle summary" heading). */
export async function stackCount(page: Page): Promise<number> {
  const text = await page
    .locator('#results')
    .getByText(/^[\d,]+ stacks/)
    .first()
    .innerText();
  return Number((/[\d,]+/.exec(text)?.[0] ?? '0').replaceAll(',', ''));
}

/**
 * The battle-summary card value under `label`, as the number it displays. The cards are titled in the
 * player's own words ("Damage if the monster strikes first"), so pass the title as it is written.
 */
export async function summaryValue(page: Page, label: string): Promise<number> {
  const card = page
    .locator('#results div')
    .filter({ hasText: new RegExp(`^${label}[\\d,]`) })
    .first();
  const text = await card.innerText();
  const value = /[\d,]+/.exec(text.replace(label, ''))?.[0] ?? '0';
  return Number(value.replaceAll(',', ''));
}

/** The priority select of the Housing section. */
export function priorityField(page: Page): Locator {
  return page.getByRole('combobox', { name: 'Priority' });
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
