/**
 * The calculator itself, end to end: housing in, a march out, the two ways a player changes what it
 * fields (a press on a pill in the March, a type the priority left at home), and the three things
 * they do with the answer — read the counts, copy them all, edit one by hand.
 */
import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

import {
  chooseObjective,
  dismissMarchSheet,
  fillHousing,
  generate,
  generateButton,
  generateState,
  marchExpectedDamage,
  marchFigure,
  marchFigureWords,
  marchFoot,
  marchLeftOut,
  marchPillDetails,
  marchSection,
  marchStackCount,
  marchStackLabels,
  marchPills,
  openApp,
  openMarchSheet,
  pageOverflowsSideways,
  paneFrame,
  seedHiredStock,
  setCountsMode,
  settle,
  watchConsole,
} from './helpers';

test('Generate fills the pools and produces the recap and the counts', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await expect(page.getByText(/^Nothing generated yet/)).toBeVisible();

  await generate(page, { leadership: 4100 });

  // One pill per marching stack, each with a non-zero count.
  const pills = marchPills(page);
  await expect(pills.first()).toBeVisible();
  expect(await pills.count()).toBeGreaterThan(1);
  for (const label of await marchStackLabels(page)) {
    expect(Number(label.split(' ')[1] ?? '0')).toBeGreaterThan(0);
  }
  expect(await marchStackCount(page)).toBeGreaterThan(0);

  // The recap: a march that fields units always does damage, whoever strikes first.
  expect(await marchExpectedDamage(page)).toBeGreaterThan(0);
  expect(await marchFigure(page, 'Worst opening')).toBeGreaterThan(0);
  expect(await marchFigure(page, 'Silver to recover')).toBeGreaterThan(0);
  // **And what it costs in time** (owner, 2026-09-18: *"troops of higher tier are longer to train.
  // Adding training time on the battle summary is the first step."*). It stands with the two coins and it
  // is read the way the game writes a training queue — "13d 21h", never a count of seconds.
  await expect(marchFigureWords(page, 'Time to recover')).toHaveText(/^\d+[dhms]( \d+[hms])?$/);

  // The pills *are* the counts (owner, 2026-09-13): there is no table under them. What a player does
  // with the whole march is a row of marks on the March's own heading, beside the answer they act on
  // (owner, 2026-09-21), and no longer a row of buttons at the foot of the setup column.
  await expect(marchSection(page).getByRole('table')).toHaveCount(0);
  await expect(marchSection(page).getByRole('button', { name: 'Copy all counts' })).toBeVisible();
  await expect(marchFoot(page).getByRole('button', { name: 'Copy all counts' })).toHaveCount(0);

  // The leadership pool is spent, not merely allocated. A pool is a vessel filled to the brim, so
  // its figure reads "used … of total" rather than as a fraction (D-19).
  await expect(marchSection(page).getByText('of 4 100')).toBeVisible();

  // The chart and the story are folded away until they are asked for — the chart first since
  // 2026-09-18, which is what the fold's own summary says.
  await expect(marchFoot(page).getByRole('button', { name: /^Details The HP profile/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  expect(problems).toEqual([]);
});

test('a March taller than the window sticks at both ends, never by a scroll of its own', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  // The default 1280×720 window leaves a pane 568 px (measured): a march of this size is 655 px
  // against it, so this is the case the old `max-height` answered with a scrollbar, and the case the
  // 2026-09-15 rule answered by letting the page carry the pane top to bottom — which put the recap
  // off screen with the first flick (owner, 2026-09-17: "the right panel should move with the scroll
  // so the recap is shown always, or not far from the scroll").
  await generate(page, { leadership: 4100 });

  const pane = await paneFrame(page);
  // The case first, so a March that no longer outgrows the pane cannot leave the assertions below
  // passing vacuously.
  expect(
    pane.height,
    'this march now fits the pane — the two-ended case this test is about is gone',
  ).toBeGreaterThan(pane.room);
  expect(pane.scrollers, 'the March took a scroll of its own (design rule 17)').toEqual([]);
  // The two columns open on the same line, in this stand as in the others.
  expect(pane.top, 'the pane starts below the first setup card').toBe(pane.setupTop);

  // The answer arrives a frame after the March changes size — it is a `ResizeObserver`'s word — so it
  // is polled rather than sampled the instant the summary settles. At the top of the page a March this
  // tall takes the **tail** stand: sticky, with a negative `top` that does nothing until the page has
  // scrolled past it and then holds its tail above the command bar.
  await expect
    .poll(async () => (await paneFrame(page)).stand, {
      message: 'a March taller than its room did not take the tail stand',
    })
    .toBe('tail');
  const tail = await paneFrame(page);
  expect(tail.position).toBe('sticky');
  expect(tail.offset, 'the tail stand is a negative sticky top').toBeLessThan(0);
  expect(tail.top, 'the tail stand moved the pane before the page did').toBe(tail.setupTop);

  // The page scrolls to its end: the tail is on screen, held above the command bar — and reached the
  // way the rule says it must be, by the page's own scroll.
  await page.evaluate(() => {
    const view = globalThis as unknown as {
      scrollTo: (x: number, y: number) => void;
      document: { documentElement: { scrollHeight: number } };
    };
    view.scrollTo(0, view.document.documentElement.scrollHeight);
  });
  await settle(page);
  const scrolled = await paneFrame(page);
  expect(scrolled.stand).toBe('tail');
  // The line the tail holds is the pane's own top plus its room: 24 px above the command bar.
  expect(
    scrolled.bottom,
    'the end of the March cannot be brought on screen by the page scroll',
  ).toBeLessThanOrEqual(16 + scrolled.room + 1);
  expect(scrolled.top, 'the head is off the top of the window in the tail stand').toBeLessThan(0);

  // A short turn of the wheel up — shorter than the head is off screen, or the head would simply pin:
  // the pane lets go of the tail and travels with the page, so the recap comes down with it rather
  // than waiting for the top of the page.
  await page.mouse.move(640, 300);
  await page.mouse.wheel(0, -40);
  await expect
    .poll(async () => (await paneFrame(page)).stand, {
      message: 'a scroll up did not let the tail go',
    })
    .toBe('flow');
  const flowing = await paneFrame(page);
  expect(flowing.position).toBe('relative');
  expect(flowing.top, 'the pane did not come down with the page').toBeGreaterThan(scrolled.top);

  // And once its head is back on the line, the head pins: the recap stays on screen from here up.
  await page.mouse.wheel(0, -4000);
  await expect
    .poll(async () => (await paneFrame(page)).stand, {
      message: 'scrolling up did not pin the head',
    })
    .toBe('top');
  const head = await paneFrame(page);
  expect(head.position).toBe('sticky');
  expect(head.top, 'the head is not on its line').toBe(head.setupTop);

  expect(problems).toEqual([]);
});

test('a March that fits the room keeps the stick — the point of the foot panel', async ({ page }) => {
  const problems = watchConsole(page);
  // The window the pane is meant to stick in, and the one it could not before 2026-09-15: measured
  // then, the March was 771 px against 748 px of room and gave up the stick at every size.
  await page.setViewportSize({ width: 1400, height: 900 });
  await openApp(page);
  await generate(page, { leadership: 4100 });

  const pane = await paneFrame(page);
  expect(
    pane.height,
    'this march outgrew its room again — the pane cannot stick and the foot panel has lost its point',
  ).toBeLessThanOrEqual(pane.room);
  // And the same two guarantees hold in this state as in the flowing one (design rule 17).
  expect(pane.scrollers).toEqual([]);
  await expect
    .poll(async () => (await paneFrame(page)).position, {
      message: 'a March that fits its room did not keep the stick',
    })
    .toBe('sticky');

  expect(problems).toEqual([]);
});

test('the plan method’s March is taller than its room, and sticks at both ends', async ({ page }) => {
  const problems = watchConsole(page);
  // The one method whose pane cannot stick, and the reason it cannot: the plan block is part of the
  // answer and **arrives open** (S-59), so its figures are on screen from the first frame rather than
  // behind a chevron. Measured on the owner's export at 1400×900 on 2026-09-16 — `paneFrame` reported
  // **740 px of March against 740 px of room with the block folded**, so that pane sticks by nothing at
  // all even closed, and flows as soon as the block is showing. The figures below are the same
  // measurement on this spec's own account and are **printed**, because a pane that quietly changed
  // sides is the regression here, not a number that moved (`docs/investigations/0020-the-plan-screen.md`
  // §1, `docs/design.md` §4).
  await page.setViewportSize({ width: 1400, height: 900 });
  await openApp(page);
  await seedHiredStock(page);

  await page.locator('#battle').getByRole('radio', { name: 'Complete optimization' }).click();
  await generate(page, { leadership: 20_000 });

  // It arrives open: no tap, which is what the journey's budget now relies on.
  const fold = marchSection(page).getByRole('button', { name: /^Plan / });
  await expect(fold).toHaveAttribute('aria-expanded', 'true');

  const open = await paneFrame(page);
  const withPlan = `height ${String(open.height)} px, room ${String(open.room)} px`;
  test.info().annotations.push({ type: 'measured', description: `plan open — ${withPlan}` });
  process.stdout.write(`  measured — plan open: ${withPlan}\n`);

  // What is true, rather than what would be tidier: a March this tall **sticks at both ends**. Which
  // stand it is in right now depends on where the click on the method left the page — the pane holds
  // its place when the March grows under a pinned head — so the end that matters is asserted where it
  // shows: the page scrolled to its end, the tail is pinned above the command bar, on screen.
  expect(
    open.height,
    'the plan method now fits its room — the two-ended case this test is about is gone',
  ).toBeGreaterThan(open.room);
  await page.evaluate(() => {
    const view = globalThis as unknown as {
      scrollTo: (x: number, y: number) => void;
      document: { documentElement: { scrollHeight: number } };
    };
    view.scrollTo(0, view.document.documentElement.scrollHeight);
  });
  await expect
    .poll(async () => (await paneFrame(page)).stand, {
      message: 'a March taller than its room with the plan open did not pin its tail at the end of the page',
    })
    .toBe('tail');
  const atEnd = await paneFrame(page);
  expect(atEnd.bottom, 'the tail is not on its line').toBeLessThanOrEqual(16 + atEnd.room + 1);

  // And closing the block — the chevron's whole purpose — shortens the March, if not to its room:
  // measured on this account, what is left is still taller than 740 px.
  await fold.click();
  await expect(fold).toHaveAttribute('aria-expanded', 'false');
  // The fold animates its own height, so the shorter March arrives a few frames later rather than on the
  // click: polled, the way the pane's own decision is.
  await expect
    .poll(async () => (await paneFrame(page)).height, {
      message: 'closing the plan did not shorten the March — the fold is not the plan block',
    })
    .toBeLessThan(open.height);
  const closed = await paneFrame(page);
  const withoutPlan = `height ${String(closed.height)} px, room ${String(closed.room)} px`;
  test.info().annotations.push({ type: 'measured', description: `plan closed — ${withoutPlan}` });
  process.stdout.write(`  measured — plan closed: ${withoutPlan}\n`);

  // Neither state ever takes a scroll of its own (design rule 17).
  expect(closed.scrollers).toEqual([]);
  expect(open.scrollers).toEqual([]);

  expect(problems).toEqual([]);
});

test('a press on a pill leaves that type out of the march, and puts it back', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await generate(page, { leadership: 4100 });
  const before = await marchStackLabels(page);
  const code = before[0]?.split(' ')[0] ?? '';
  expect(code).not.toBe('');

  // The primary action is direct (owner, 2026-09-13): a press on the pill itself takes the type out
  // of the march, from the sticky pane, without a sheet in between.
  const pill = marchPills(page).first();
  await expect(pill).toHaveAttribute('aria-pressed', 'true');
  await pill.click();
  // A March edit re-sizes in place rather than generating (S-53), so the wait is the pill grid
  // itself: Generate never goes into its running state.
  await expect(marchPills(page)).toHaveCount(before.length - 1);
  const without = await marchStackLabels(page);
  expect(without.some((label) => label.startsWith(`${code} `))).toBe(false);

  // Leaving a type out is a decision about *the march on screen*, not about the account: the Troops
  // card still ticks every type the account owns (S-53).
  await expect(page.locator('#troops').getByRole('checkbox', { name: 'Rider III' })).toBeChecked();

  // The type is in the small row under the pools now — the off half of the same toggle — and it says
  // who left it out, because that decides what putting it back means.
  const putBack = marchLeftOut(page).first();
  await expect(putBack).toHaveAttribute('aria-pressed', 'false');
  await expect(putBack).toHaveAttribute('data-left-out', 'you');
  await expect(putBack).toHaveAccessibleName(/left out by you/);
  await putBack.click();

  // A type *you* left out is simply let back in, sized like any other: nothing holds it there.
  await expect(marchPills(page)).toHaveCount(before.length);
  await expect(marchLeftOut(page)).toHaveCount(0);

  expect(problems).toEqual([]);
});

test('the pill’s corner mark opens the unit sheet over the sticky pane', async ({ page }) => {
  const problems = watchConsole(page);
  // Two panes: the March is the sticky pane on the right and the command bar is on the bottom edge,
  // which is the frame the sheet used to open *under* (owner, 2026-09-13).
  await page.setViewportSize({ width: 1400, height: 900 });
  await openApp(page);
  await generate(page, { leadership: 4100 });

  const mark = marchPillDetails(page).first();
  const name = (await mark.getAttribute('aria-label'))?.replace('Details: ', '') ?? '';
  expect(name).not.toBe('');
  await mark.click();

  // The sheet is on top of everything the page pins to an edge, so its heading can be read and its
  // actions can be pressed.
  const sheet = page.getByRole('dialog', { name });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('heading', { name })).toBeVisible();
  const leaveOut = sheet.getByRole('button', { name: 'Leave out' });
  await expect(leaveOut).toBeVisible();

  // "On top" measured rather than asserted: the point the button occupies belongs to the button.
  const box = await leaveOut.boundingBox();
  expect(box).not.toBeNull();
  const owns = await page.evaluate(
    ({ x, y }) => {
      const view = globalThis as unknown as {
        document: {
          elementFromPoint: (px: number, py: number) => { closest: (s: string) => unknown } | null;
        };
      };
      return (view.document.elementFromPoint(x, y)?.closest('[role="dialog"]') ?? null) !== null;
    },
    { x: (box?.x ?? 0) + (box?.width ?? 0) / 2, y: (box?.y ?? 0) + (box?.height ?? 0) / 2 },
  );
  expect(owns, 'the command bar is painting over the unit sheet').toBe(true);

  await leaveOut.click();
  await settle(page);
  await expect(marchLeftOut(page).first()).toBeVisible();

  expect(problems).toEqual([]);
});

test('a march says nothing about its age, and says plainly when the setup has moved', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await generate(page, { leadership: 4100 });

  // Current: no clock, no warning, nothing dimmed (owner, 2026-09-13 — "generated 5 minutes ago" is
  // retired; what matters is whether the answer still answers the form).
  await expect(page.getByText(/generated (just now|\d)/)).toHaveCount(0);
  await expect(
    marchSection(page).getByText('Setup changed since this march. Generate to refresh.'),
  ).toHaveCount(0);
  for (const block of await marchSection(page).locator('[data-stale]').all()) {
    await expect(block).toHaveAttribute('data-stale', 'false');
  }
  await expect(generateState(page)).toHaveAttribute('data-state', 'ready');

  // Move the form under the answer without generating: one line says so, the answer steps back, and
  // Generate keeps its dot.
  await fillHousing(page, 'Leadership', 2000);
  await expect(
    marchSection(page).getByText('Setup changed since this march. Generate to refresh.'),
  ).toBeVisible();
  const blocks = await marchSection(page).locator('[data-stale]').all();
  expect(blocks.length).toBeGreaterThanOrEqual(2);
  for (const block of blocks) await expect(block).toHaveAttribute('data-stale', 'true');
  await expect(generateState(page)).toHaveAttribute('data-state', 'stale');

  // Generating again clears every one of those signals at once.
  await generateButton(page).click();
  await settle(page);
  await expect(
    marchSection(page).getByText('Setup changed since this march. Generate to refresh.'),
  ).toHaveCount(0);
  await expect(generateState(page)).toHaveAttribute('data-state', 'ready');

  expect(problems).toEqual([]);
});

test('a type the priority left out can be put back, and the next Generate solves afresh', async ({
  page,
}) => {
  const problems = watchConsole(page);
  await openApp(page);

  await chooseObjective(page, 'Best worst case');
  await generate(page, { leadership: 4100 });

  // A search wins by marching with fewer types, and the strip says what that bought — as the five
  // objectives side by side, since investigation 0013 §5.3 (PLAN §3.6, design rule 29).
  // The comparison is reference, so it lives in the setup column's foot rather than in the pane
  // that has to stay short enough to stick (owner, 2026-09-15).
  await expect(marchFoot(page).getByRole('heading', { name: 'Objectives compared' })).toBeVisible();
  const leftOut = marchLeftOut(page);
  await expect(leftOut.first()).toBeVisible();

  // Nobody took these out by hand, so the row says the search did.
  await expect(leftOut.first()).toHaveAttribute('data-left-out', 'search');
  await expect(leftOut.first()).toHaveAccessibleName(/left out by the search/);

  const before = await marchStackLabels(page);
  await leftOut.first().click();
  await settle(page);

  // Putting a type back re-sizes the march at once, without a Generate, so it is in the stacks now.
  await expect(marchPills(page)).toHaveCount(before.length + 1);
  const back = await marchStackLabels(page);
  expect(back.find((label) => !before.includes(label))).toBeDefined();

  // Generate is a fresh solve (S-53): the March's own edit is forgotten and the search answers again
  // with its own selection.
  await generate(page);
  expect(await marchStackLabels(page)).toEqual(before);

  expect(problems).toEqual([]);
});

test('the counts have one shape at every width: the pills themselves', async ({ page }) => {
  const problems = watchConsole(page);
  // One column, so the March is the sheet — and the sheet is as wide as the page.
  await page.setViewportSize({ width: 1024, height: 900 });
  await openApp(page);
  await generate(page, { leadership: 4100 });
  await openMarchSheet(page);

  // One pill per stack, whatever the width: the counts have no second shape any more.
  await expect(marchPills(page)).toHaveCount(await marchStackCount(page));
  await expect(marchSection(page).getByRole('table')).toHaveCount(0);

  expect(problems).toEqual([]);
});

test('counts are edited in an explicit mode, and put back with Undo', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await generate(page, { leadership: 4100 });

  const damage = await marchExpectedDamage(page);
  const pills = marchSection(page).locator('[data-stack]');
  await expect(pills.first().getByRole('textbox')).toBeHidden();

  await setCountsMode(page, 'edit');
  // The field is the pill's own count, in place.
  const field = pills.first().getByRole('textbox');
  await expect(field).toBeVisible();

  // A count is typed, not walked to, so the field carries no step buttons; the battle is re-played
  // on the hand-typed counts the moment one changes.
  await expect(pills.getByRole('button', { name: /^Increase / })).toHaveCount(0);
  await field.fill('1');
  const undo = marchSection(page).getByRole('button', { name: 'Undo' });
  await expect(undo).toBeVisible();
  expect(await marchExpectedDamage(page)).not.toBe(damage);

  await undo.click();
  await expect(undo).toBeHidden();
  expect(await marchExpectedDamage(page)).toBe(damage);

  expect(problems).toEqual([]);
});

test('the unit sheet opens from a pill and acts on that one type', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await generate(page, { leadership: 4100 });

  await marchPillDetails(page).first().click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText('In this march')).toBeVisible();
  await expect(sheet.getByText('Why this size')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Leave out' })).toBeVisible();

  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();

  expect(problems).toEqual([]);
});

test('mobile: a unit sheet opens on top of the March sheet, not behind it', async ({ page }) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await generate(page, { leadership: 4100 });

  // The March *is* the sheet below 1200 px, so a unit sheet raised from it is a sheet over a sheet:
  // at Mantine's own stacking it opened underneath, with only its header showing (owner, 2026-09-13).
  await openMarchSheet(page);
  const mark = marchPillDetails(page).first();
  const name = (await mark.getAttribute('aria-label'))?.replace('Details: ', '') ?? '';
  await mark.click();

  const unitSheet = page.getByRole('dialog', { name });
  await expect(unitSheet).toBeVisible();
  const leaveOut = unitSheet.getByRole('button', { name: 'Leave out' });
  await expect(leaveOut).toBeVisible();

  const box = await leaveOut.boundingBox();
  const owns = await page.evaluate(
    ({ x, y, title }) => {
      const view = globalThis as unknown as {
        document: {
          elementFromPoint: (
            px: number,
            py: number,
          ) => { closest: (s: string) => { textContent: string } | null } | null;
        };
      };
      const dialog = view.document.elementFromPoint(x, y)?.closest('[role="dialog"]') ?? null;
      return dialog !== null && dialog.textContent.includes(title);
    },
    { x: (box?.x ?? 0) + (box?.width ?? 0) / 2, y: (box?.y ?? 0) + (box?.height ?? 0) / 2, title: name },
  );
  expect(owns, 'the March sheet is painting over the unit sheet').toBe(true);

  expect(problems).toEqual([]);
});

test('mobile: the bar carries the answer, and the recap is one tap away', async ({ page }) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);

  expect(await pageOverflowsSideways(page)).toBe(false);
  await expect(generateButton(page)).toBeVisible();

  await generate(page, { leadership: 4100, authority: 1200 });

  expect(await pageOverflowsSideways(page)).toBe(false);
  await expect(generateButton(page)).toBeVisible();
  // The March is not in the page at all below 1200 px (design rule 5): it is the sheet.
  await expect(marchPills(page)).toHaveCount(0);

  // The quick summary in the bottom bar opens it. The sheet covers the bar rather than sitting
  // under it (M-09 polish list): a control outside a focus trap that the pointer can still reach is
  // a trap that does not hold. So the bar goes under the scrim and the sheet carries its own
  // Generate, and the answer and the action still travel together.
  const recap = await openMarchSheet(page);
  await expect(recap.getByText(/^Expected damage/)).toBeVisible();
  await expect(recap.getByRole('group', { name: 'Leadership stacks' })).toBeVisible();
  await expect(recap.getByRole('button', { name: /^Generate march/ })).toBeVisible();
  await expect(marchPills(page).first()).toBeVisible();
  // The pills are the counts: no table, and one row of whole-march actions under them.
  await expect(marchSection(page).getByRole('table')).toHaveCount(0);
  await expect(recap.getByRole('button', { name: 'Copy all counts' })).toBeVisible();
  // …and the trap holds: tabbing all the way round never leaves the sheet for the bar underneath.
  for (let i = 0; i < 12; i += 1) await page.keyboard.press('Tab');
  const trapped = await page.evaluate(() => {
    const view = globalThis as unknown as {
      document: { activeElement: { closest: (selector: string) => unknown } | null };
    };
    return (view.document.activeElement?.closest('[role="dialog"]') ?? null) !== null;
  });
  expect(trapped).toBe(true);

  expect(problems).toEqual([]);
});

/**
 * The two things the phone's sheet does by itself (owner, 2026-09-19: *"on mobile, generate should
 * open recap by default when finished. Also it would help to be able to close it with a gesture like
 * sliding down"*). Both are gestures rather than markup, so only a browser can answer for them.
 */
test('mobile: a finished Generate opens the recap, and a swipe down puts it away', async ({ page }) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);

  const sheet = page.getByRole('dialog', { name: 'March' });
  await expect(sheet).toHaveCount(0);

  // Nothing is pressed but Generate, and nothing is asked for afterwards: the answer *is* the sheet.
  await fillHousing(page, 'Leadership', 4100);
  await generateButton(page).click();
  await settle(page);
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText(/^Expected damage/)).toBeVisible();

  // The slide-up has to *finish* before the header can be measured: for its first 300 ms the sheet
  // is still below the window, and a drag started at those coordinates lands on the page behind it.
  await sheet.evaluate(async (node) => {
    const element = node as unknown as {
      getAnimations: (options?: { subtree?: boolean }) => { finished: Promise<unknown> }[];
    };
    await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished));
  });

  // And the way back out is a swipe down its header — M3's drag handle, with the whole 60 px row
  // round it as the target. Driven with the pointer rather than the touchscreen because that is what
  // the sheet listens to, and what a trackpad on a narrow window sends as well.
  const header = sheet.locator('header').first();
  const box = await header.boundingBox();
  if (box === null) throw new Error('the sheet has no header to drag');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 40, { steps: 4 });
  await page.mouse.move(x, y + 220, { steps: 8 });
  await page.mouse.up();
  await expect(sheet).toBeHidden();

  // The bar is under it again, with the answer it carried all along.
  await expect(generateButton(page)).toBeVisible();

  expect(problems).toEqual([]);
});

/**
 * The shortcut, and what it puts down (owner, 2026-09-20: *"a shortcut to run generate without
 * moving the cursor too much… also if it can close the popup as well"*). A plain `Enter` is the key
 * that commits a figure and a run on every committed figure is a run paid for on every edit, so the
 * pair stays `Ctrl`/`⌘ + Enter` — and it now leaves the editor it was pressed in, because that
 * editor is over the answer it just asked for.
 */
test('Ctrl + Enter from inside an editor closes it and generates', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);
  await fillHousing(page, 'Leadership', 4100);

  // A captain's level editor: a popover raised from the gear on the chip, over the page.
  const chip = page.getByRole('checkbox', { name: /Beowulf/ });
  await page.locator(`label[for="${String(await chip.getAttribute('id'))}"]`).click();
  await page.getByRole('button', { name: /^(Set|Change) Beowulf’s level$/ }).click();
  const level = page.getByRole('textbox', { name: 'Base level' });
  await expect(level).toBeVisible();

  // Pressed with the hands where they already are — inside the editor's own field.
  await level.press('ControlOrMeta+Enter');

  await expect(level).toHaveCount(0);
  await settle(page);
  await dismissMarchSheet(page);
  expect(await marchStackCount(page)).toBeGreaterThan(0);

  expect(problems).toEqual([]);
});

/**
 * The bar opens where it was left (owner, 2026-09-20: *"remember the position of the slider when clicking
 * generate again — last position remembered seems like a good choice"*). The plan's own recommendation
 * still leads the first run of a session; what the second one must not do is put the player back on it.
 */
test('a second Generate opens the plan bar on the stop the player last read', async ({ page }) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await openApp(page);
  await seedHiredStock(page);

  await page.locator('#battle').getByRole('radio', { name: 'Complete optimization' }).click();
  await generate(page, { leadership: 20_000 });

  const march = marchSection(page);
  const trade = march.getByRole('grid', { name: /^Every plan on the trade/ });
  const stops = trade.getByRole('row', { name: /^(Silver saver|Sweet spot|More mercs|Steady max|All in)\b/ });
  const count = await stops.count();
  expect(count, 'the bar needs two stops to have anywhere to be left').toBeGreaterThan(1);

  /** Which answer a row is, off the name it carries: the figures after it move, the name does not. */
  const nameOf = async (row: Locator): Promise<string> =>
    /^(Silver saver|Sweet spot|More mercs|Steady max|All in)/.exec(
      (await row.getAttribute('aria-label')) ?? '',
    )?.[0] ?? '';

  const opened = await nameOf(trade.getByRole('row', { selected: true }));
  const dearest = stops.nth(count - 1);
  const wanted = await nameOf(dearest);
  expect(wanted, 'the dearest stop must be another plan than the one it opened on').not.toBe(opened);

  // He reads the dearest stop — the most of the hired stock a march may burn.
  await dearest.click();
  await expect(trade.getByRole('row', { selected: true })).toHaveAttribute(
    'aria-label',
    new RegExp(`^${wanted}`),
  );
  const bar = march.getByRole('slider', { name: 'Where on the trade to read the plan' });
  const thumb = await bar.getAttribute('aria-valuenow');

  // Generate again, same army: the bar is where he left it, and so is the march under it.
  await generateButton(page).click();
  await settle(page);
  await dismissMarchSheet(page);

  await expect(trade.getByRole('row', { selected: true })).toHaveAttribute(
    'aria-label',
    new RegExp(`^${wanted}`),
  );
  await expect(bar).toHaveAttribute('aria-valuenow', String(thumb));

  expect(problems).toEqual([]);
});
