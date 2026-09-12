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

export function generateButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Generate', exact: true });
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
  await expect(generateButton(page)).toBeEnabled({ timeout: 30_000 });
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
  await expect(generateButton(page)).toBeEnabled({ timeout: 30_000 });
}

/** Names of every profile in the switcher. */
export async function profileNames(page: Page): Promise<string[]> {
  const trigger = page.getByRole('combobox', { name: 'Active profile' });
  await trigger.click();
  const options = await page.getByRole('option').allInnerTexts();
  await page.keyboard.press('Escape');
  return options.map((name) => name.trim());
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
