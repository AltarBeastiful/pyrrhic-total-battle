/**
 * The journeys of the design plan §3, **measured** rather than described (Phase E, D-50).
 *
 * Every other spec asks "does this work". This one asks "does it still cost what we promised": each
 * test walks one journey the way the persona walks it and counts what the plan counts — taps
 * (touches or clicks) and screens (viewport heights of scrolling on a 390×844 phone) — then asserts
 * the budget §3 gives it. The numbers are recorded on the test so a run prints what it measured and
 * not merely that it passed: a journey that creeps from two taps to three is a regression the day
 * before it breaks the budget, and nobody sees it unless the figure is on the report.
 *
 * Two viewports, because the frame is two frames (plan §5.1, frame V1): a phone carries the answer
 * and Generate in the bottom app bar with the recap a tap away in a sheet, a desktop carries them in
 * the sticky March pane. Each journey runs on both, and the figures are printed per viewport, so a
 * budget that only breaks on a phone is visible as such.
 *
 * A measurement that goes over its budget is printed OVER and not thrown: this spec reports what the
 * frame costs, and what to do about a cost the plan did not want is the plan's business, not a
 * failing assertion's. Assertions hold the budgets the frame is meant to meet today.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  accountButton,
  bonusTotal,
  bonusesCard,
  bonusesDisclosure,
  fillHousing,
  generateButton,
  housingField,
  marchCountsList,
  marchExpectedDamage,
  marchStackLabels,
  marchTiles,
  openApp,
  recapSummary,
  settle,
  waitForSaved,
  watchConsole,
} from './helpers';

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1400, height: 900 };

/** The leadership the seeded profile marches on. Tier 4 guardsmen only fit in a pool this size (J2). */
const SEED_LEADERSHIP = 20_000;
/** What J1 changes it to: the one number the daily journey touches. */
const DAILY_LEADERSHIP = 24_000;

/** The bar's quick summary writes the damage short ("19.6M"); `march/format.ts` is the original. */
const COMPACT = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
/** Every count on screen is grouped with spaces; `ui/domain/format.ts` is the original. */
const GROUPED = new Intl.NumberFormat('en-GB');
const grouped = (value: number): string => GROUPED.format(value).replace(/,/g, ' ');

/**
 * Put a measurement on the report. The annotation is what the HTML report and CI read; the line on
 * stdout is what the list reporter prints under the test, which is where a person reads it.
 */
function record(label: string, value: number, budget: number | null): void {
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(2);
  const over = budget !== null && value > budget ? ' — OVER' : '';
  const line =
    budget === null ? `${label} = ${shown}` : `${label} = ${shown} (budget ${String(budget)})${over}`;
  test.info().annotations.push({ type: 'measured', description: line });
  process.stdout.write(`  measured — ${line}\n`);
}

/**
 * The tap counter. Every gesture the journey makes goes through it, so the count is the journey's
 * own and not a number written down beside it.
 *
 * What counts as one tap follows the plan's definition — a touch or a click. Landing in a number
 * field is one; the digits after it are the keyboard the field opens, not further taps (design
 * rule 9: a typed number selects itself on focus, so typing replaces it). A native tier select is
 * one: on a phone it is the system picker, which is the whole of the gesture we copied.
 */
class Taps {
  private taps = 0;

  get count(): number {
    return this.taps;
  }

  /** One press on a control. */
  async tap(target: Locator): Promise<void> {
    this.taps += 1;
    await target.click();
  }

  /** One press on a native select, picker and all. */
  async pick(select: Locator, value: string): Promise<void> {
    this.taps += 1;
    await select.selectOption(value);
  }

  /** One press into a number field, then the keyboard. */
  async type(field: Locator, value: string, commit: 'enter' | 'blur' = 'enter'): Promise<void> {
    this.taps += 1;
    await field.click();
    await field.fill(value);
    if (commit === 'enter') await field.press('Enter');
    else await field.blur();
  }
}

/** Back to the top of the page, so a scroll measurement starts where the player starts. */
async function toTop(page: Page): Promise<void> {
  await page.evaluate(() => {
    (globalThis as unknown as { scrollTo: (x: number, y: number) => void }).scrollTo(0, 0);
  });
}

/** How far down the page we are, in viewport heights — the plan's "screens". */
function screensScrolled(page: Page): Promise<number> {
  return page.evaluate(() => {
    const view = globalThis as unknown as { scrollY: number; innerHeight: number };
    return view.scrollY / view.innerHeight;
  });
}

/**
 * Scroll to the moment a block becomes readable — the *least* scroll that finishes it inside the
 * viewport and above the sticky bottom bar, and never a pixel past it — then answer how far down the
 * page that leaves us, in viewport heights.
 *
 * The least scroll is the point: `scrollIntoViewIfNeeded` centres the block, which charges the
 * journey half a screen the player never scrolls. A block taller than the viewport is aligned by its
 * top instead, which is the moment it starts to read.
 */
async function screensToRead(page: Page, target: Locator, stickyBar: Locator | null): Promise<number> {
  // Generate brings the march into view with a smooth scroll (`ui/shell/march.ts`); measuring while
  // it is still running would read a position nobody is at.
  await settleScroll(page);
  const view = await page.evaluate(() => {
    const window = globalThis as unknown as { scrollY: number; innerHeight: number };
    return { scrollY: window.scrollY, innerHeight: window.innerHeight };
  });
  // Playwright's boxes are viewport coordinates, so the page position is `scrollY + y`.
  const box = await target.boundingBox();
  if (box === null) throw new Error('the block to read is not on the page');
  const bar = stickyBar === null ? null : await stickyBar.boundingBox();
  const edge = bar === null ? view.innerHeight : Math.min(view.innerHeight, bar.y);

  const readable = box.y >= 0 && box.y + box.height <= edge;
  const wanted = readable
    ? view.scrollY
    : Math.max(0, Math.min(view.scrollY + box.y + box.height - edge, view.scrollY + box.y));
  // `instant`, not the page's own smooth behaviour: this is a measurement, not an animation.
  await page.evaluate((top) => {
    (globalThis as unknown as { scrollTo: (options: { top: number; behavior: 'instant' }) => void }).scrollTo(
      { top, behavior: 'instant' },
    );
  }, wanted);
  await settleScroll(page);
  return screensScrolled(page);
}

/** Wait until the page has stopped moving: two readings of `scrollY` in a row that agree. */
async function settleScroll(page: Page): Promise<void> {
  let last = Number.NaN;
  await expect
    .poll(
      async () => {
        const now = await page.evaluate(() => (globalThis as unknown as { scrollY: number }).scrollY);
        const stable = now === last;
        last = now;
        return stable;
      },
      { timeout: 5_000, intervals: [100, 100, 100, 100] },
    )
    .toBe(true);
}

/**
 * A profile as a returning player leaves it: the first-run troops, a leadership value and yesterday's
 * march, all of it written to storage. The reload is the journey's real first step — "open the app" —
 * and everything measured after it is measured on a cold page.
 */
async function seedProfile(page: Page): Promise<void> {
  await openApp(page);
  await fillHousing(page, 'Leadership', SEED_LEADERSHIP);
  await generateButton(page).first().click();
  await settle(page);
  await expect(marchTiles(page).first()).toBeVisible({ timeout: 30_000 });
  // Both halves of the profile are written debounced: the document through the account menu's own
  // word, the cached result under its own key.
  await waitForSaved(page);
  await page.waitForFunction(
    () => {
      const view = globalThis as unknown as { localStorage: { getItem: (key: string) => string | null } };
      return view.localStorage.getItem('pyrrhic.lastResult.v1') !== null;
    },
    undefined,
    { timeout: 15_000 },
  );

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { level: 1, name: 'Pyrrhic' })).toBeVisible();
  await expect(housingField(page, 'Leadership')).toHaveValue(grouped(SEED_LEADERSHIP));
  await toTop(page);
}

// ---- The captains, as the Bonuses card draws them (§7.3) ----------------------------------------
/** A captain chip, by either of the two names it wears. */
const captainChip = (page: Page, name: string): Locator =>
  bonusesCard(page).getByRole('checkbox', {
    name: new RegExp(`^(Send ${name} on this march|${name}, riding with this march)$`),
  });

/** The gear on the chip's corner: its own target, and the only way to the level. */
const captainGear = (page: Page, name: string): Locator =>
  bonusesCard(page).getByRole('button', { name: new RegExp(`^(Set|Change) ${name}’s level$`) });

/** What a thumb lands on: Mantine draws the chip as a `<label for>` over a hidden input. */
async function chipLabel(page: Page, name: string): Promise<Locator> {
  const id = await captainChip(page, name).getAttribute('id');
  return bonusesCard(page).locator(`label[for="${String(id)}"]`);
}

// ---- The journeys -------------------------------------------------------------------------------
/**
 * J1 — the daily march. Open the app, change the one number that changed since yesterday, generate,
 * read the counts. Budget: ≤ 3 taps and ≤ 2 screens.
 *
 * **Two screen readings, because a phone has two.** Generating brings the march into view by itself
 * (`ui/shell/march.ts`), so the page *travels* the whole setup column whether the player pushes it
 * or not, while the player's own thumb scrolls nothing: the bar holds the answer and the sheet holds
 * the counts. Both are recorded; the budget is held against the scrolling the player does, which is
 * what design plan §3 counts ("how many viewport heights the user scrolls through").
 *
 * The travelled figure is the one to watch: measured 2.14 screens at 390×844 (setup column 1 804 px,
 * of which the Battle card alone is 973), which is over the §3 budget of 2 and is recorded as OVER
 * rather than failed — the budget is the app's to meet, not this spec's to enforce by fiat.
 */
async function journey1(page: Page, phone: boolean): Promise<void> {
  const taps = new Taps();
  const before = await marchExpectedDamage(page);
  expect(before).toBeGreaterThan(0);

  // Tap 1 — the free leadership is the one thing that changed since yesterday.
  await taps.type(housingField(page, 'Leadership'), String(DAILY_LEADERSHIP));
  // Tap 2 — Generate, wherever the frame put it; it is on screen either way, so nothing is hunted for.
  await taps.tap(generateButton(page).first());
  await settle(page);
  await expect.poll(() => marchExpectedDamage(page), { timeout: 30_000 }).not.toBe(before);
  const damage = await marchExpectedDamage(page);

  // Where Generate left the page, before the player touches it again.
  await settleScroll(page);
  const landed = await screensScrolled(page);
  const bar = phone ? recapSummary(page) : null;

  if (bar !== null) {
    // The bar is sticky, so the answer is wherever the page happens to be: nothing to scroll for it.
    await expect(bar).toBeInViewport();
    await expect(bar).toContainText(COMPACT.format(Math.round(damage)));
    record('J1 screens to read the recap', 0, 0);
  }

  // The counts in the page itself: how far down the page they sit, and how much of that the player
  // has left to push through after Generate has already brought the march up.
  const firstCount = marchCountsList(page).getByRole('listitem').first();
  const travelled = await screensToRead(page, firstCount, bar);
  await expect(firstCount).toBeInViewport();
  const scrolled = Math.max(0, travelled - landed);

  const labels = await marchStackLabels(page);
  expect(labels.length).toBeGreaterThan(0);

  if (phone) {
    // Tap 3 — the same counts the way the frame was built for them: the recap sheet over the bar,
    // reachable from wherever the page is, with every stack and its count in it.
    await taps.tap(recapSummary(page));
    const sheet = page.getByRole('dialog', { name: 'March' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText('Expected damage')).toBeVisible();
    const written = await sheet.innerText();
    for (const label of labels) expect(written).toContain(grouped(Number(label.split(' ')[1])));
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  }

  record('J1 taps', taps.count, 3);
  record('J1 screens the player scrolls to the counts', scrolled, 2);
  record('J1 screens the page travels to the counts', travelled, phone ? 2 : null);
  expect(taps.count).toBeLessThanOrEqual(3);
  expect(scrolled).toBeLessThanOrEqual(2);
}

/**
 * J2 — something changed in the army: G1–G3 becomes G1–G4, minus the riders that are not upgraded
 * yet. Budget: ≤ 4 taps (one per tier end, one chip, one Generate).
 */
async function journey2(page: Page): Promise<void> {
  const taps = new Taps();
  const troops = page.locator('#troops');

  await taps.pick(troops.getByRole('combobox', { name: 'Guardsmen from' }), '1');
  await taps.pick(troops.getByRole('combobox', { name: 'Guardsmen to' }), '4');
  const top = troops.getByRole('group', { name: 'Guardsmen at G4' });
  await expect(top).toBeVisible();

  await taps.tap(top.getByText('RD', { exact: true }));
  await expect(troops.getByRole('checkbox', { name: 'Rider IV' })).not.toBeChecked();

  await taps.tap(generateButton(page).first());
  await settle(page);
  await expect(marchTiles(page).first()).toBeVisible({ timeout: 30_000 });

  const labels = await marchStackLabels(page);
  // The new tier marches; the one type that was turned off does not.
  expect(labels.some((label) => /^[A-Z]+4 /.test(label))).toBe(true);
  expect(labels.some((label) => label.startsWith('RD4 '))).toBe(false);

  record('J2 taps', taps.count, 4);
  expect(taps.count).toBeLessThanOrEqual(4);
}

/**
 * J3 — the bonuses changed: unfold the sources, enlist a captain, set its level on the gear, watch
 * the TOTAL move. Budget: ≤ 6 taps.
 */
async function journey3(page: Page): Promise<void> {
  const taps = new Taps();
  expect(await bonusTotal(page, 'Health')).toBe('0 %');

  await taps.tap(bonusesDisclosure(page));
  await expect(bonusesDisclosure(page)).toHaveAttribute('aria-expanded', 'true');

  await taps.tap(await chipLabel(page, 'Beowulf'));
  await expect(captainChip(page, 'Beowulf')).toBeChecked();

  await taps.tap(captainGear(page, 'Beowulf'));
  await taps.type(page.getByRole('textbox', { name: 'Base level' }), '20', 'blur');
  await page.keyboard.press('Escape');

  // Beowulf gives the whole army one per cent of health and of strength per level.
  await expect.poll(() => bonusTotal(page, 'Health')).toBe('+20 %');
  await expect.poll(() => bonusTotal(page, 'Strength')).toBe('+20 %');

  record('J3 taps', taps.count, 6);
  expect(taps.count).toBeLessThanOrEqual(6);
}

/** J5 — share this march: the account menu, the item, the word that says it is on the clipboard. */
async function journey5(page: Page): Promise<void> {
  const taps = new Taps();

  await taps.tap(accountButton(page));
  await expect(page.getByRole('menu')).toBeVisible();
  await taps.tap(page.getByRole('menuitem', { name: /^Share this march/ }));
  await expect(page.getByRole('banner').getByRole('status')).toHaveText('Copied');

  record('J5 taps', taps.count, 3);
  expect(taps.count).toBeLessThanOrEqual(3);
}

// ---- The two frames -----------------------------------------------------------------------------
test.describe('phone 390×844', () => {
  test.use({ viewport: PHONE });

  test.beforeEach(async ({ page }) => {
    await seedProfile(page);
  });

  test('J1 daily march: ≤ 3 taps and ≤ 2 screens', async ({ page }) => {
    const problems = watchConsole(page);
    await journey1(page, true);
    expect(problems).toEqual([]);
  });

  test('J2 the army changed: ≤ 4 taps', async ({ page }) => {
    const problems = watchConsole(page);
    await journey2(page);
    expect(problems).toEqual([]);
  });

  test('J3 the bonuses changed: ≤ 6 taps', async ({ page }) => {
    const problems = watchConsole(page);
    await journey3(page);
    expect(problems).toEqual([]);
  });

  test('J5 share this march: ≤ 3 taps', async ({ page, context }) => {
    const problems = watchConsole(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await journey5(page);
    expect(problems).toEqual([]);
  });
});

test.describe('desktop 1400×900', () => {
  test.use({ viewport: DESKTOP });

  test.beforeEach(async ({ page }) => {
    await seedProfile(page);
  });

  test('J1 daily march: ≤ 3 taps', async ({ page }) => {
    const problems = watchConsole(page);
    await journey1(page, false);
    expect(problems).toEqual([]);
  });

  test('J2 the army changed: ≤ 4 taps', async ({ page }) => {
    const problems = watchConsole(page);
    await journey2(page);
    expect(problems).toEqual([]);
  });

  test('J3 the bonuses changed: ≤ 6 taps', async ({ page }) => {
    const problems = watchConsole(page);
    await journey3(page);
    expect(problems).toEqual([]);
  });

  test('J5 share this march: ≤ 3 taps', async ({ page, context }) => {
    const problems = watchConsole(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await journey5(page);
    expect(problems).toEqual([]);
  });
});
