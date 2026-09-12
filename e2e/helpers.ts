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

/**
 * The result pills, whose accessible name is "<short label> <count>" (e.g. "ARC1 624"). Matching on
 * that shape keeps the helper independent of which unit types the formation happens to contain.
 */
export function stackPills(page: Page): Locator {
  return page.locator('#results').getByRole('button', { name: /^[A-Z]{2,5}\d+ [\d,]+$/ });
}

/** The summary card value under `label`, as the number it displays. */
export async function summaryValue(page: Page, label: string): Promise<number> {
  const card = page
    .locator('#results div')
    .filter({ hasText: new RegExp(`^${label}[\\d,]`) })
    .first();
  const text = await card.innerText();
  const value = /[\d,]+/.exec(text.replace(label, ''))?.[0] ?? '0';
  return Number(value.replaceAll(',', ''));
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
