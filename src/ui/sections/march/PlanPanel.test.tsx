// @vitest-environment jsdom
/**
 * The plan block (S-55, rewritten for S-59), by role and by name.
 *
 * The search itself is the engine's and is tested there; what this file checks is that the answer is *drawn*:
 * the one line saying what the plan decided, the bar and the tip that names the plan **under the pointer**
 * rather than the one on screen, the trade read a march at a time with exactly one plan raised, and what the
 * plan ran out of. The store is primed with a plan the engine really produced, so the words and the numbers
 * are the ones a player would see.
 *
 * Since S-59 a row is named by `PlanRow.pick` (`./picks`) and the engine's shape sentence is not drawn at
 * all, so every assertion here is against a **name** — the file before this one held sentences, which is
 * exactly what the owner could not tell apart.
 */
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { emptyTotals, planCampaign, planMarch } from '@/engine';
import type { CampaignPlan, PlanRow } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';
import { getUnits } from '@/data';
import { renderWithTheme } from '@/ui/kit/testRender';

import { PlanFold, PlanSizing } from './PlanPanel';
import { BAR_ENDS, bestForWords, planWords } from './picks';
import { compact, ratio } from './format';
import { defaultPlanPosition, pickOf, sweetSpotOf, useRunStore } from './runStore';

/** A small army with a hired stock: enough for the planner to have a real plan to show. */
function request(): StackRequest {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3).slice(0, 4);
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000).slice(0, 3);
  const caps: Record<string, number> = {};
  for (const merc of mercs) caps[merc.id] = 20;
  return {
    units: [...troops, ...mercs],
    caps,
    housing: { leadership: 4_000, authority: 2_000, dominance: 0 },
    totals: emptyTotals(),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
}

// The plan is computed once for the file: the search is a real one (a few seconds even on this small army),
// and every case below draws the same answer. The app asks for nothing but the army (`src/state/derive.ts`),
// so neither does this.
const PLAN = planCampaign({ request: request() });

/** The plans the bar carries, thriftiest first — the stops the engine settled on, four at most. */
const ROWS = PLAN.alternatives;

/** The two words under the bar: one pair, because the bar runs along one resource (`./picks`). */
const ENDS = BAR_ENDS;

// The table's own name carries the unit its heads stopped repeating (S-59 screen review).
const TRADE = 'table[aria-label="Every plan on the trade, one repeated march each"]';

/** The trade's rows, in the DOM, so a case can point at the same one twice. */
function tradeRows(): HTMLElement[] {
  const trade = document.querySelector(TRADE);
  return trade === null ? [] : [...trade.querySelectorAll<HTMLElement>('tbody tr')];
}

/**
 * A rectangle in the shape jsdom cannot produce. jsdom lays nothing out — every `getBoundingClientRect()` it
 * answers is a zero box — so the two boxes `PlanBar` measures are stubbed here, at the geometry a real
 * browser really hands it: Mantine's root carries `padding-inline: var(--slider-size)`, so the **track** is
 * inset 8 px from the root at each end, and only the track is where the stops are. Verified against a real
 * browser at 1400×900, which measured a 462 px root over a 446 px track — the same 8 px, and the same reason
 * the bar reads the track and not the root.
 */
const BAND = { left: 100, width: 400 };
const TRACK = { left: 108, width: 384 };

function rect(left: number, width: number): DOMRect {
  return {
    x: left,
    y: 0,
    left,
    right: left + width,
    top: 0,
    bottom: 16,
    width,
    height: 16,
    toJSON: () => ({}),
  } as DOMRect;
}

/** Install the two boxes above, before anything is rendered. `restoreMocks` puts the prototype back after. */
function stubLayout(): void {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const root = document.querySelector('.mantine-Slider-root');
    if (this === root?.parentElement) return rect(BAND.left, BAND.width);
    if (this === root?.querySelector('.mantine-Slider-track')) return rect(TRACK.left, TRACK.width);
    return rect(0, 0);
  });
}

/** The `<Slider>`'s own root, and the band it is wrapped in — the two elements the geometry is read off. */
function bar(): HTMLElement {
  const root = document.querySelector('.mantine-Slider-root');
  if (root === null) throw new Error('no bar on screen');
  const band = root.parentElement;
  if (band === null) throw new Error('the bar has no band');
  return band;
}

/** Put the pointer on one stop, the way a pointer does: the band gets the move, the index comes off `clientX`. */
function pointAt(index: number): void {
  const last = Math.max(1, ROWS.length - 1);
  fireEvent.pointerMove(bar(), { clientX: TRACK.left + TRACK.width * (index / last) });
}

/** Take the pointer off the bar. React synthesises a leave out of the `pointerout` the browser sends. */
function pointAway(): void {
  fireEvent.pointerOut(bar(), { relatedTarget: document.body });
}

/** The tip, which is the only element carrying the state its own CSS reads (`march.module.css`, `.tip`). */
function tip(): HTMLElement | null {
  return document.querySelector('[data-shown]');
}

/** A stop that is not the one the bar opens on: the complaint this tip answers is that it named the wrong plan. */
function anotherStop(): number {
  return defaultPlanPosition(PLAN) === 0 ? 1 : 0;
}

beforeEach(() => {
  // primed the way a run primes it: the plan, and the position it opens on
  useRunStore.setState({
    plan: PLAN,
    planPick: defaultPlanPosition(PLAN),
    includedUnitIds: [],
    leftOutByPlayer: [],
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useRunStore.setState({ plan: null });
});

test('the sizing line says what the plan decided, and nothing about it is invented', () => {
  renderWithTheme(<PlanSizing />);
  const plan = useRunStore.getState().plan;
  expect(plan).not.toBeNull();
  if (!plan) return;

  const line = screen.getByText(/^Planned from the army:/);
  // The line describes the plan the bar is read at — where it opens, which is the engine's own pick — and the
  // counts it sized. It opens on the sweet spot and it **stops there**: the clause that used to name it ("the
  // sweet spot between the two resources") is the row's own name, one line above the table that prints it,
  // and design rule 5 forbids saying the same thing twice (S-59).
  const position = defaultPlanPosition(plan);
  const point = pickOf(plan, position);
  expect(line.textContent).toContain(String(point.marches - (point.finaleCounts ? 1 : 0)));
  expect(line.textContent).toContain(`${Object.keys(point.counts).length} stacks`);
  expect(sweetSpotOf(plan)).toBe(position);
  expect(line.textContent).not.toContain('the sweet spot between the two resources');
});

test('one control walks the trade, the keyboard walks it too, and the way back to the sweet spot is a word', () => {
  renderWithTheme(<PlanFold />);
  const plan = useRunStore.getState().plan;
  if (!plan) throw new Error('no plan to draw');
  const sweet = sweetSpotOf(plan);
  expect(sweet).not.toBeNull();
  if (sweet === null) return;

  // One slider over the trade, opening where the engine's recommendation sits (design rule 24 gives it a
  // name). Every plan kept is a tick, so the control says how many stops it has.
  const bar = screen.getByRole('slider', { name: 'Where on the trade to read the plan' });
  expect(bar.getAttribute('aria-valuemax')).toBe(String(plan.alternatives.length - 1));
  const openedAt = Number(bar.getAttribute('aria-valuenow'));
  expect(openedAt).toBe(sweet);
  // Mantine's own floating label is gone: it hung off the thumb and named the plan already on screen, which
  // is the half of the owner's complaint the tip below answers.
  const opened = plan.alternatives[sweet];
  expect(opened === undefined ? '' : screen.queryByText(opened.label)).toBeNull();
  // Named after the resource the bar runs along, never after the one it is not ordered by (rule 5).
  expect(screen.getByText(ENDS.low)).toBeTruthy();
  expect(screen.getByText(ENDS.high)).toBeTruthy();
  // On the sweet spot, there is nothing to go back to.
  expect(screen.queryByRole('button', { name: 'Back to the sweet spot' })).toBeNull();

  // Moving it reads another plan without another search. (With no profile in the store the move changes the
  // choice only — in the app it also puts that plan's march on screen.)
  fireEvent.keyDown(bar, { key: 'ArrowRight' });
  const away = Math.min(openedAt + 1, plan.alternatives.length - 1);
  expect(useRunStore.getState().planPick).toBe(away);

  // And the sweet spot stays reachable by name once the bar has left it.
  if (away !== sweet) {
    const back = screen.getByRole('button', { name: 'Back to the sweet spot' });
    fireEvent.click(back);
    expect(useRunStore.getState().planPick).toBe(sweet);
  }
});

test('the tip names the plan under the pointer, not the one on screen', () => {
  stubLayout();
  renderWithTheme(<PlanFold />);
  const position = defaultPlanPosition(PLAN);
  const away = anotherStop();
  const wanted = ROWS[away];
  const selected = ROWS[position];
  if (wanted === undefined || selected === undefined) throw new Error('too few plans to point at');

  // Nothing is shown before the pointer arrives: the tip belongs to the pointer, not to the value.
  expect(tip()).toBeNull();

  pointAt(away);
  // Pointing at a plan is not reading it: the selection stays where it was, and only the tip follows the
  // pointer. Reading is the bar's own move (the arrow keys, a press) or a row's name.
  expect(useRunStore.getState().planPick).toBe(position);
  const shown = tip();
  expect(shown).not.toBeNull();
  expect(shown?.textContent ?? '').toContain(planWords(wanted));
  expect(shown?.textContent ?? '').not.toContain(planWords(selected));
  // It carries the figure a player compares plans by, and nothing else.
  expect(shown?.textContent ?? '').toContain(`${compact(wanted.repeat.damage)} damage a march`);
  // Two lines and no third: it used to close with "the sweet spot" over a tip already naming the plan
  // **Sweet spot**, above a bar marked "Sweet spot" in the same brass (design rule 5).
  expect(shown?.textContent ?? '').not.toContain('the sweet spot');
  // `aria-hidden` on purpose: the trade below prints the same answer as a table and `aria-valuetext` carries
  // it for a screen reader (design rule 24). A tip is never the only place a fact lives.
  expect(shown?.getAttribute('aria-hidden')).toBe('true');

  // Leaving the band takes it away again, without the plan on screen changing.
  pointAway();
  expect(tip()).toBeNull();
  expect(useRunStore.getState().planPick).toBe(position);
});

test('the bar and the table are one thing: the pointer’s row is ruled and the one on screen is raised', () => {
  stubLayout();
  renderWithTheme(<PlanFold />);
  const position = defaultPlanPosition(PLAN);
  const away = anotherStop();

  const rows = tradeRows();
  pointAt(away);

  // Two different marks, because they are two different facts — a hover is not a selection, and the brief
  // that produced this asked for the two not to be confusable. The plan on screen is *raised*
  // (`data-current`, the objectives strip's own mark) and carries `aria-current`; the plan under the pointer
  // is *ruled* by the hairline every part of the page is told apart by, and the tip names it in words, so
  // neither is ever said by colour alone (design rule 24).
  const lit = rows.filter((row) => row.getAttribute('data-lit') !== null);
  expect(lit).toHaveLength(1);
  expect(lit[0]).toBe(rows[away]);
  expect(lit[0]?.getAttribute('aria-current')).toBeNull();
  const current = rows.filter((row) => row.getAttribute('data-current') !== null);
  expect(current).toHaveLength(1);
  expect(current[0]).toBe(rows[position]);
});

test('the band is the target, not just the 16 px track', () => {
  stubLayout();
  renderWithTheme(<PlanFold />);
  const position = defaultPlanPosition(PLAN);
  const away = anotherStop();
  const last = Math.max(1, ROWS.length - 1);

  // The band is ~58 px tall because the sweet-spot mark has to clear the two words under the bar, and its
  // own comment in `march.module.css` has always said every one of those pixels can be aimed at. It could
  // not: Mantine's slider root is 16 px and owned the only press that moved the thumb, so a press in the
  // air under the track did nothing (design rule 19). It reads the nearest stop now.
  fireEvent.pointerDown(bar(), { clientX: TRACK.left + TRACK.width * (away / last) });
  expect(useRunStore.getState().planPick).toBe(away);
  // …and the tip follows it, so the press answers the same question the pointer was asking.
  const wanted = ROWS[away];
  if (wanted === undefined) throw new Error('too few plans to press');
  expect(tip()?.textContent ?? '').toContain(planWords(wanted));

  // Never a press that belongs to a child: the two words under the bar and "Back to the sweet spot" are the
  // controls a player reaches for when the bar is already somewhere else, and a band that answered their
  // presses too would move the bar out from under the finger.
  useRunStore.setState({ planPick: position });
  fireEvent.pointerDown(screen.getByText(ENDS.high), { clientX: TRACK.left });
  expect(useRunStore.getState().planPick).toBe(position);
});

test('the tip still arrives when the system asks for no motion', () => {
  stubLayout();
  // The motion is a CSS transition inside `@media (prefers-reduced-motion: no-preference)` and jsdom draws
  // none of it, so what this holds is the half that could be got wrong: the tip's *presence* never depends
  // on an animation having run — reduced motion drops the movement, never the answer (design rule 24).
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
  renderWithTheme(<PlanFold />);

  pointAt(anotherStop());
  const wanted = ROWS[anotherStop()];
  if (wanted === undefined) throw new Error('no row under the pointer');
  expect(tip()?.textContent ?? '').toContain(planWords(wanted));
});

test('the block opens on its own — the plan is part of the answer, not a fold to hunt for', () => {
  renderWithTheme(<PlanFold />);
  // No click: it arrives open (0020 §D-5), and the chevron stays, because closing it is how a player whose
  // pane no longer sticks gets one that does.
  const fold = screen.getByRole('button', { name: /^Plan/ });
  expect(fold.getAttribute('aria-expanded')).toBe('true');
  // The row still carries the plan the block is *reading* — where the bar opens, which is the plan the engine
  // recommends — and not the one its search settled on: the two part company as soon as the bar moves, and a
  // headline that describes a plan the body is not showing is a lie. Read the way the owner asked for it: a
  // march at a time, not a campaign total.
  const shown = pickOf(PLAN, defaultPlanPosition(PLAN));
  const repeated = shown.marches - (shown.finaleCounts ? 1 : 0);
  expect(fold.textContent).toContain('damage a march');
  // One march is a word of its own, and a recommendation whose plan repeats only once is a case the row has to
  // get right: the old rule never produced one on this army, and the middle-of-the-trade rule does.
  expect(fold.textContent).toContain(
    `${repeated} ${repeated === 1 ? 'march' : 'marches'}${shown.finaleCounts ? ' + a last one' : ''}`,
  );
});

test('the whole row is the target: a press anywhere on it reads that plan', () => {
  renderWithTheme(<PlanFold />);
  const away = anotherStop();
  const position = defaultPlanPosition(PLAN);
  const row = tradeRows()[away];
  if (row === undefined) throw new Error('too few plans to press');

  // The bar is one way to walk the trade and the table is the other (design rule 8): the **row** is the
  // control — not a button in its first cell, which is a target the width of a word on a line six figures
  // long — and pressing it does what a stop on the bar does, with no new search.
  expect(within(row).queryByRole('button')).toBeNull();
  fireEvent.click(row);
  expect(useRunStore.getState().planPick).toBe(away);

  // One focusable thing per row, and it is the row; the two keys a control answers both read it.
  expect(row.getAttribute('tabindex')).toBe('0');
  expect(row.querySelectorAll('[tabindex]')).toHaveLength(0);
  useRunStore.setState({ planPick: position });
  fireEvent.keyDown(row, { key: 'Enter' });
  expect(useRunStore.getState().planPick).toBe(away);
  useRunStore.setState({ planPick: position });
  fireEvent.keyDown(row, { key: ' ' });
  expect(useRunStore.getState().planPick).toBe(away);
});

test('the row on screen says so to a reader, not only in colour', () => {
  renderWithTheme(<PlanFold />);
  const position = defaultPlanPosition(PLAN);
  const rows = tradeRows();
  // `aria-selected` is what a row in a grid carries, and the table is a grid for exactly that reason: the
  // raised ground is the same fact in colour, which design rule 24 never allows to be the only one.
  expect(document.querySelector(TRADE)?.getAttribute('role')).toBe('grid');
  expect(rows.filter((row) => row.getAttribute('aria-selected') === 'true')).toHaveLength(1);
  expect(rows[position]?.getAttribute('aria-selected')).toBe('true');
  expect(rows[position]?.getAttribute('aria-current')).toBe('true');
});

test('a row prices the march the recap is drawing, and the engine’s own battle agrees with it', () => {
  renderWithTheme(<PlanFold />);
  const plan = useRunStore.getState().plan;
  if (!plan) throw new Error('no plan to draw');

  // The owner's complaint of 2026-09-15: the row's figures were the plan spread over its marches, finale
  // included, so the plan on screen read one damage a march and the row that named it read another. The row is
  // the **repeated** march now, and the engine's `repeat` is what proves it: the real battle of that very
  // march — the call the March section makes — reports the same figure, to the unit.
  const shown = pickOf(plan, defaultPlanPosition(plan));
  const raised = document.querySelector(`${TRADE} tbody tr[data-current]`);
  expect(raised).not.toBeNull();
  expect(raised?.textContent ?? '').toContain(compact(shown.repeat.damage));
  expect(raised?.textContent ?? '').toContain(compact(shown.repeat.silver));
  expect(planMarch(request(), shown.counts).summary.avgDamage).toBe(shown.repeat.damage);
  expect(planMarch(request(), shown.counts).summary.recovery.silver).toBe(shown.repeat.silver);
});

test('the two ratio columns are the march’s own, not the campaign’s', () => {
  renderWithTheme(<PlanFold />);
  const row: PlanRow | undefined = ROWS[defaultPlanPosition(PLAN)];
  expect(row).toBeDefined();
  if (row === undefined) return;

  const cells = [
    ...(document.querySelector(`${TRADE} tbody tr[data-current]`)?.querySelectorAll('td') ?? []),
  ];
  // Damage a march, Silver a march, Hired lost, Per silver, Per hired — and the last two divide the row's own
  // march (0020 §D-3), which is what stops a row named for a ratio from being beaten on that ratio by the row
  // above it.
  expect(cells.at(-2)?.textContent).toBe(ratio(row.repeat.damage / row.repeat.silver, 3));
  expect(cells.at(-1)?.textContent).toBe(ratio(row.repeat.damage / row.repeat.mercLost));
  // The campaign's ratios are what they used to be, and they are not what the row prints.
  expect(cells.at(-2)?.textContent).not.toBe(ratio(row.damagePerSilver, 3));

  // And "Per silver" is printed to where the plans actually differ. At two decimals the whole column read
  // "0.54" on the owner's own account — three rows, one figure — so the row named "Best for silver" was
  // indistinguishable from the two beneath it on the very ratio it is named for.
  const perSilver = [...(document.querySelectorAll(`${TRADE} tbody tr`) ?? [])].map(
    (line) => [...line.querySelectorAll('td')].at(-2)?.textContent ?? '',
  );
  const exact = ROWS.map((point) => point.repeat.damage / point.repeat.silver);
  if (new Set(exact.map((value) => value.toFixed(6))).size === ROWS.length) {
    expect(new Set(perSilver).size).toBe(ROWS.length);
  }
});

test('the trade says how many plans the band refused, and nothing when it refused none', () => {
  renderWithTheme(<PlanFold />);
  const plan = useRunStore.getState().plan;
  if (!plan) throw new Error('no plan to draw');

  // The extremes are not offered (owner: "just don't show the extremes"), and the block says so with the
  // engine's own count rather than leaving the bar looking like the whole trade.
  const line = screen.queryByText(/of the plans the search kept are off the goal/);
  if (plan.leftOut === 0) expect(line).toBeNull();
  else expect(line?.textContent ?? '').toContain(String(plan.leftOut));
});

test('opened, it says what the plan did for this army and reads the trade a march at a time', () => {
  renderWithTheme(<PlanFold />);
  const plan = useRunStore.getState().plan;
  if (!plan) throw new Error('no plan to draw');

  // One line in the muted ink, about *this* army — and the general why behind the glyph beside it, where the
  // owner's "wayyy too big" paragraph was **moved** rather than deleted (0020 §D-4).
  expect(screen.getByText(/^The sweet spot it found for this army is /)).toBeTruthy();
  // The owner's paragraph is not prose on the screen any more. "Moved, not deleted" is exact: its words are
  // still in the document, and the only place they are is the glyph's own description.
  const moved = screen.getByText(/^Damage is paid for twice over:/);
  expect(moved.closest('.mantine-VisuallyHidden-root')).not.toBeNull();
  const why = screen.getByRole('button', { name: 'Why the plan weighs silver against the hired stock' });
  // Reachable by keyboard, and its words are the button's description as well as its tooltip: Mantine's
  // `Tooltip` links nothing for a screen reader on its own.
  expect(why.getAttribute('aria-describedby')).not.toBeNull();

  // The trade table. Queried through the DOM rather than by role: jsdom keeps the folded panel's table out of
  // the accessibility tree, so `getByRole('table')` finds nothing even with the block open. The rows are still
  // asserted one by one against the engine's own picks.
  const rows = tradeRows();
  // One row per plan the engine offers, and exactly one of them raised as the one on screen.
  expect(rows).toHaveLength(plan.alternatives.length);
  expect(rows.filter((row) => row.getAttribute('data-current') !== null)).toHaveLength(1);
  // Every row is **named** — the engine's own pick, in our words — and nothing prints the shape sentence.
  const drawn = rows.map((row) => row.textContent ?? '').join('\n');
  for (const [index, row] of plan.alternatives.entries()) {
    expect(rows[index]?.textContent ?? '').toContain(planWords(row));
    expect(drawn).not.toContain(row.label);
  }
  // The columns are the decision: what a march hits for, what it costs and what it burns — the three that
  // name a game resource behind their own glyph, then the two ratios. **A glyph and two words at most**: the
  // heads carried "a march" until 2026-09-16 and a 420 px pane broke them over three and four lines, while
  // the unit is the table's own and is said once in its name. And 👑 is gone from "Hired lost": it is the
  // authority pool's glyph, printed two blocks above this table on the same screen (rule 21).
  const headers = [...document.querySelectorAll(`${TRADE} thead th`)].map((th) => th.textContent);
  expect(headers).toEqual(['Plan', '🎯 Damage', '🪙 Silver', '🪖 Hired lost', 'Per silver', 'Per hired']);
  expect(document.querySelector(TRADE)?.getAttribute('aria-label')).toContain('march');
  // The sweet spot is named by the row's own **name**, and never a second time under it: "the sweet spot"
  // under a row called "Sweet spot" is the same words twice on one line (rule 5).
  const sweet = sweetSpotOf(plan);
  expect(sweet).not.toBeNull();
  expect(rows.filter((row) => (row.textContent ?? '').includes('the sweet spot'))).toHaveLength(0);
  expect(rows[sweet ?? 0]?.textContent ?? '').toContain(planWords(plan.alternatives[sweet ?? 0] as PlanRow));

  // The totals stay available, one line down, without being the headline — and they are the **one** line of
  // the old tail that is still on screen.
  expect(screen.getByText(/^Fought to the end: /)).toBeTruthy();

  // Everything else the tail said is behind one closed fold (design rule 4; the owner, 2026-09-16: the prose
  // goes). The sentence about which resource ended the plan is in there, with the curve and the rest.
  const reference = screen.getByRole('button', { name: /^Reference/ });
  expect(reference.getAttribute('aria-expanded')).toBe('false');
  const binds = plan.binding;
  const sentence =
    binds.mercenaries && binds.silver
      ? 'Both resources are spent: more silver and more mercenaries would each buy more damage.'
      : binds.mercenaries
        ? 'The mercenary stock is what ends the plan: silver alone would not buy more damage.'
        : binds.silver
          ? 'The silver box is what ends the plan: more silver would buy more marches.'
          : 'Nothing binds yet — the plan stops where more troops stop paying for themselves.';
  fireEvent.click(reference);
  expect(reference.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByText(sentence)).toBeTruthy();
  expect(screen.getByText(/^Every plan here is fought over the same marches/)).toBeTruthy();
}, 60_000);

test('the why is a popover a thumb can open, not a tooltip only a pointer can hover', async () => {
  const user = userEvent.setup();
  renderWithTheme(<PlanFold />);

  // It was a `Tooltip` with `touch: false`, which put the owner's own paragraph out of reach on the frame
  // this app is designed at first (design rules 18 and 24). A press opens it, a press outside closes it.
  const why = screen.getByRole('button', { name: 'Why the plan weighs silver against the hired stock' });
  expect(screen.getAllByText(/^Damage is paid for twice over:/)).toHaveLength(1);
  await user.click(why);
  expect(screen.getAllByText(/^Damage is paid for twice over:/).length).toBeGreaterThan(1);
  // …and a press outside it puts it away again, which is the half a tooltip could not do on a phone.
  await user.click(document.body);
  expect(screen.getAllByText(/^Damage is paid for twice over:/)).toHaveLength(1);
}, 60_000);

/**
 * **The bar, on figures of a known shape.**
 *
 * The plan below is a literal rather than a second search: what the cases here hold is the **drawing** of a
 * payload — the ends the bar is named after, the gold the trade has no column for, and the two efficiencies
 * as notes on the stops that have them. The figures are the engine's own shape (one plan a burn level,
 * thriftiest first, the sweet spot among them), copied onto a real row so nothing but `pick`, `repeat`,
 * `bestFor` and the sort key is invented.
 *
 * `bestFor` is **not** invented either: on these figures the best damage a silver is the dearest stop
 * (3.00 against 2.82 · 2.48 · 2.05) and the best damage a hired unit is the thriftiest (456 k against 433 k ·
 * 365 k · 314 k), which is the engine's own claim about an account whose mercenaries are priced in gold — the
 * dear end and the thrift end (`PlanRow.bestFor`, `src/engine/plan.ts`).
 *
 * **Four rows since 2026-09-18** (`PlanPick`): the owner asked for a "more mercs" step between the knee and
 * the top, so the bar carries the whole of `least-silver → sweet-spot → more-mercs → most-mercs` and the
 * cases below read the last row rather than the third.
 */
const BURN_ROWS: PlanRow[] = [
  {
    ...(ROWS[0] as PlanRow),
    pick: 'least-silver',
    silver: 11,
    totalDamage: 101,
    bestFor: { silver: false, hired: true },
    repeat: { damage: 4_100_000, silver: 2_000_000, gold: 11_400, mercLost: 9 },
  },
  {
    ...(ROWS[0] as PlanRow),
    pick: 'sweet-spot',
    silver: 12,
    totalDamage: 102,
    bestFor: { silver: false, hired: false },
    repeat: { damage: 5_200_000, silver: 2_100_000, gold: 12_100, mercLost: 12 },
  },
  {
    ...(ROWS[0] as PlanRow),
    pick: 'more-mercs',
    silver: 13,
    totalDamage: 103,
    bestFor: { silver: false, hired: false },
    repeat: { damage: 6_200_000, silver: 2_200_000, gold: 22_000, mercLost: 17 },
  },
  {
    ...(ROWS[0] as PlanRow),
    pick: 'most-mercs',
    silver: 14,
    totalDamage: 104,
    bestFor: { silver: true, hired: false },
    repeat: { damage: 6_900_000, silver: 2_300_000, gold: 33_700, mercLost: 22 },
  },
];

/** `sweetSpotOf` finds the recommendation by its own silver and damage, so the copy has to be one of the rows. */
const BURN: CampaignPlan = {
  ...PLAN,
  alternatives: BURN_ROWS,
  recommend: BURN_ROWS[1] as PlanRow,
};

/** Prime the store with the plan above, the way a run would. */
function primeBurn(position = defaultPlanPosition(BURN)): void {
  useRunStore.setState({ plan: BURN, planPick: position, includedUnitIds: [], leftOutByPlayer: [] });
}

test('the bar names its ends after the hired stock, and every row is its own answer', () => {
  primeBurn();
  renderWithTheme(<PlanFold />);

  // The two words under the bar are the bar's own resource (design rule 5: one name per thing). "Least
  // silver … Most silver" would name the one resource these stops are **not** ordered by — and a *stop* is
  // called "Least silver" since 2026-09-18, which is exactly why the ends may not be.
  expect(screen.getByText('Fewest hired lost')).toBeTruthy();
  expect(screen.getByText('Most hired lost')).toBeTruthy();
  expect(screen.queryByText('Most silver')).toBeNull();
  expect(screen.getByText('Least silver').closest('tr')).toBe(tradeRows()[0]);

  // Four stops at most, and a row is named by **which answer it is** and by nothing else: the `step`
  // filler that wore its own burn ("15 hired lost") went with the silver axis on 2026-09-18.
  const rows = tradeRows();
  expect(rows).toHaveLength(BURN_ROWS.length);
  expect(rows.map((row) => row.textContent ?? '')).toEqual(
    BURN_ROWS.map((row) => expect.stringContaining(planWords(row))),
  );
  expect(rows.map((row) => row.textContent ?? '').join('\n')).not.toContain('Step');
  expect(rows.map((row) => row.textContent ?? '').join('\n')).not.toContain('hired lost');

  // **Gold has no column.** Built as a seventh head and measured in a browser at 1400×900, the table came
  // to 505 px in a 462 px pane — the sideways scroller the six heads were tuned down to avoid (rule 17) —
  // so the figure is carried by the bar's tip and by the row's own accessible name instead.
  const headers = [...document.querySelectorAll(`${TRADE} thead th`)].map((th) => th.textContent);
  expect(headers).toEqual(['Plan', '🎯 Damage', '🪙 Silver', '🪖 Hired lost', 'Per silver', 'Per hired']);
  expect(rows[3]?.getAttribute('aria-label') ?? '').toContain(`${compact(33_700)} gold`);
  expect(rows[3]?.getAttribute('aria-label') ?? '').toContain('22 hired lost');
});

test('the two efficiencies are notes on the stops that have them, not stops of their own', () => {
  stubLayout();
  primeBurn();
  renderWithTheme(<PlanFold />);

  // Of the stops the bar carries, exactly one is the best damage a silver and exactly one the best damage a
  // hired unit (`PlanRow.bestFor`), and each says so in one muted line under its own name — never as a row
  // of its own. The owner, 2026-09-17: a separate "Best for silver" stop that measured as the top stop to
  // 0.2 % is *"inefficient and causes frustration"*.
  const rows = tradeRows();
  expect(rows.filter((row) => (row.textContent ?? '').includes('best a silver'))).toHaveLength(1);
  expect(rows.filter((row) => (row.textContent ?? '').includes('best a hired'))).toHaveLength(1);
  // On these figures they are the two ends: the dearest stop does most with a silver, the thriftiest most
  // with a hired unit. A stop that is neither says nothing at all.
  expect(rows[3]?.textContent ?? '').toContain('best a silver');
  expect(rows[0]?.textContent ?? '').toContain('best a hired');
  expect(rows[1]?.textContent ?? '').not.toContain('best a');
  expect(rows[2]?.textContent ?? '').not.toContain('best a');
  // The words are the trade's own column heads said short, so the row cannot claim one thing under its name
  // and another in the column beside it (design rule 5).
  expect(bestForWords(BURN_ROWS[3] as PlanRow)).toBe('best a silver');
  expect(bestForWords(BURN_ROWS[0] as PlanRow)).toBe('best a hired');

  // …and in the row's accessible name, because the note is drawn in the muted ink and a mark that is only
  // there for the eye is a mark half the readers do not get (design rule 24).
  expect(rows[3]?.getAttribute('aria-label') ?? '').toContain('best a silver');
  expect(rows[0]?.getAttribute('aria-label') ?? '').toContain('best a hired');

  // The bar says it too, over the stop it belongs to: the bar and the table are one thing (0020 §D-2).
  const last = BURN_ROWS.length - 1;
  fireEvent.pointerMove(bar(), { clientX: TRACK.left + TRACK.width });
  expect(tip()?.textContent ?? '').toContain('best a silver');
  // The tip is `aria-hidden`, so the thumb's own value text is where a screen reader meets the same fact.
  const thumb = screen.getByRole('slider', { name: 'Where on the trade to read the plan' });
  fireEvent.keyDown(thumb, { key: 'End' });
  expect(useRunStore.getState().planPick).toBe(last);
  expect(thumb.getAttribute('aria-valuetext') ?? '').toContain('best a silver');
});

test('the tip carries the gold a march the trade has no room for', () => {
  stubLayout();
  primeBurn();
  renderWithTheme(<PlanFold />);

  const last = BURN_ROWS.length - 1;
  fireEvent.pointerMove(bar(), { clientX: TRACK.left + TRACK.width });
  const shown = tip();
  expect(shown).not.toBeNull();
  // The stop's own name, its damage, and the gold — the third line the trade has no column for.
  expect(shown?.textContent ?? '').toContain(planWords(BURN_ROWS[last] as PlanRow));
  expect(shown?.textContent ?? '').toContain(`${compact(6_900_000)} damage a march`);
  expect(shown?.textContent ?? '').toContain(`${compact(33_700)} gold a march`);
});

test('the sizing line says where a plan stands in the resource the bar is ordered by', () => {
  // Off the sweet spot (stop 1) and one stop to its right: that is one plan **heavier on the hired stock**,
  // and "pricier" would be a claim about silver the list is not sorted by.
  primeBurn(2);
  renderWithTheme(<PlanSizing />);
  const line = screen.getByText(/^Planned from the army:/);
  expect(line.textContent ?? '').toContain('1 plan heavier on the hired stock than the sweet spot');
  expect(line.textContent ?? '').not.toContain('pricier');
});
