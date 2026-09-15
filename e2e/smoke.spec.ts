/**
 * First-run smoke: the frame, the cards, persistence and the theme row (S-01 / S-52).
 * Deliberately shallow — the engine, the store and every editor have their own Vitest suites
 * (ADR-0003); what only a real browser can prove is that the assembled page comes up, changes
 * shape at 1200 px the way frame V1 says it does, and survives a reload.
 */
import { expect, test } from '@playwright/test';

import {
  accountButton,
  fillHousing,
  generateControl,
  housingValue,
  marchFoot,
  marchPane,
  openAccountMenu,
  openApp,
  paneFrame,
  recapSummary,
  renameProfile,
  SETUP_TITLES,
  stepTier,
  themeAttribute,
  waitForSaved,
  watchConsole,
} from './helpers';

const PHONE = { width: 390, height: 844 };

test('first run shows the default profile and the setup cards', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await expect(accountButton(page)).toHaveAccessibleName('Account: My account');

  // The whole profile bar is one menu now, and the save state is one word inside it (design plan §5.2).
  const menu = await openAccountMenu(page);
  await expect(menu.getByText('Saved', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();

  for (const title of SETUP_TITLES) {
    await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
  }
  // The order is part of the flow, not an accident of the registry. The March is the fifth section
  // and lives in the supporting pane at this width, so it is asked for below rather than here.
  const headings = await page.getByRole('main').getByRole('heading', { level: 2 }).allInnerTexts();
  expect(headings.map((text) => text.trim()).slice(0, SETUP_TITLES.length)).toEqual([...SETUP_TITLES]);

  expect(problems).toEqual([]);
});

test('the answer and Generate travel together: pane on a desktop, bottom bar on a phone', async ({
  page,
}) => {
  const problems = watchConsole(page);
  await openApp(page);

  // 1280 px (the default viewport): M3's supporting pane, and **the pane itself is what sticks**
  // (owner, 2026-09-13). Nothing inside it may be pinned on its own — a block pinned inside the
  // column is a block the rest of the column scrolls behind, which is the defect this replaced.
  await expect(marchPane(page)).toBeVisible();
  await expect(generateControl(page)).toHaveCount(1);
  await expect(recapSummary(page)).toBeHidden();
  const frame = await marchPane(page).evaluate((node) => {
    const view = globalThis as unknown as {
      getComputedStyle: (element: unknown) => { position: string; overflowY: string };
    };
    const element = node as unknown as {
      scrollHeight: number;
      clientHeight: number;
      querySelectorAll: (selector: string) => Iterable<unknown>;
    };
    const pinned = [...element.querySelectorAll('*')].filter(
      (child) => view.getComputedStyle(child).position === 'sticky',
    ).length;
    return {
      position: view.getComputedStyle(node).position,
      overflowY: view.getComputedStyle(node).overflowY,
      scrolls: element.scrollHeight > element.clientHeight + 1,
      pinned,
    };
  });
  expect(frame.position).toBe('sticky');
  expect(frame.overflowY).toBe('visible');
  expect(frame.scrolls).toBe(false);
  expect(frame.pinned, 'nothing inside the pane may stick on its own').toBe(0);

  // Nothing *in* the pane is a scroll of its own either: the wheel over the March is the page's
  // (design rule 17, owner 2026-09-15: "always avoid scroll bars on the battle summary"). An empty
  // March is the case that fits; `generate.spec.ts` checks the one that does not.
  const pane = await paneFrame(page);
  expect(pane.scrollers).toEqual([]);
  // And the sticking pane starts on the first setup card's line (owner, 2026-09-15: "the battle
  // summary is slightly below the troop selection form" — the other state, where `top` is not a
  // sticky offset but an offset, is checked in `generate.spec.ts`).
  expect(pane.top, 'the pane does not start on the first setup card’s line').toBe(pane.setupTop);

  // The March's second half is the setup column's last panel at this width, and the sheet's copy of
  // it is not drawn — the two hosts are mutually exclusive (owner, 2026-09-15).
  await expect(marchFoot(page)).toHaveCount(1);

  // 390 px: one column, and the answer moves into the Material bottom app bar with Generate.
  await page.setViewportSize(PHONE);
  await expect(marchPane(page)).toHaveCount(0);
  await expect(recapSummary(page)).toBeVisible();
  await expect(generateControl(page)).toHaveCount(1);

  // Tapping the summary opens the March sheet; the bar stays under it (investigation 0009), and the
  // March is in the sheet rather than in the page a second time (design rule 5).
  await expect(page.locator('#march')).toHaveCount(0);
  // One column, so there is no foot: what it holds is in the sheet with the rest of the March.
  await expect(marchFoot(page)).toHaveCount(0);
  await recapSummary(page).click();
  const sheet = page.getByRole('dialog', { name: 'March' });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('#march')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();

  expect(problems).toEqual([]);
});

test('the Troops card states the account as a form, and follows a tier change', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  // The army cards are the form *and* the summary: nothing to unfold, one row per group (D-22) —
  // a tier at each end of the range, and the chips of the top tier beside them.
  const card = page.locator('#troops');
  await expect(card.getByRole('heading', { level: 2, name: 'Troops' })).toBeVisible();
  await expect(card.getByRole('spinbutton', { name: /(from|to)$/ })).toHaveCount(8);

  await stepTier(card, 'Guardsmen to', 1);
  await expect(card.getByRole('group', { name: 'Guardsmen at G4' })).toBeVisible();

  expect(problems).toEqual([]);
});

test('what the player typed survives a reload', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await fillHousing(page, 'Leadership', 4100);
  await fillHousing(page, 'Authority', 1200);
  await renameProfile(page, 'Reloaded');
  // The store writes to localStorage debounced; the menu's status says when it has landed.
  await waitForSaved(page);

  await page.reload();
  await page.waitForLoadState('networkidle');

  await expect(accountButton(page)).toHaveAccessibleName('Account: Reloaded');
  // The housing fields print a capacity the way a player reads it: grouped. Which character does
  // the grouping is the theme's business (a thin space today), so the digits are what is asked for.
  for (const [pool, digits] of [
    ['Leadership', '4100'],
    ['Authority', '1200'],
  ] as const) {
    await expect.poll(async () => (await housingValue(page, pool)).replace(/\D/g, '')).toBe(digits);
  }

  expect(problems).toEqual([]);
});

test('the theme row of the account menu flips data-theme', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  const attribute = (): Promise<string | undefined> => themeAttribute(page);
  const choose = async (name: string): Promise<void> => {
    const menu = await openAccountMenu(page);
    // Kit2's segmented row is a radio group inside the menu, not a menu item of its own; the input
    // itself is the hidden half of a segmented control, so the press lands on the label a player
    // sees — which is what a player presses too.
    await menu.getByRole('radiogroup', { name: 'Theme' }).getByText(name, { exact: true }).click();
    await page.keyboard.press('Escape');
  };

  await choose('Dark');
  await expect.poll(attribute).toBe('dark');
  await choose('Light');
  await expect.poll(attribute).toBe('light');

  // "System" resolves to a concrete value; it never leaves the attribute unset.
  await choose('System');
  await expect.poll(attribute).toMatch(/^(light|dark)$/);

  expect(problems).toEqual([]);
});
