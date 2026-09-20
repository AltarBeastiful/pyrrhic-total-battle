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

import { PlanFold } from './PlanPanel';
import { BAR_ENDS, bestForWords, planWords, putBackWords, sequenceWords } from './picks';
import { amount, compact, duration, ratio } from './format';
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

/** The plans the bar carries, thriftiest first — the stops the engine settled on, five at most. */
const ROWS = PLAN.alternatives;

/** The two words under the bar: one pair, because the bar runs along one resource (`./picks`). */
const ENDS = BAR_ENDS;

// The table's own name carries the unit its heads stopped repeating (S-59 screen review).
const TRADE = 'table[aria-label="Every plan on the trade, one repeated march each, at its worst opening"]';

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
  expect(shown?.textContent ?? '').toContain(`${compact(wanted.repeat.damage)} worst opening a march`);
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
  expect(fold.textContent).toContain('worst opening a march');
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
  // included, so the plan on screen read one damage figure and the row that named it read another. The row is
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

test('the rate column is the march’s own ratio, whichever rate the player switches to', async () => {
  const user = userEvent.setup();
  renderWithTheme(<PlanFold />);
  const row: PlanRow | undefined = ROWS[defaultPlanPosition(PLAN)];
  expect(row).toBeDefined();
  if (row === undefined) return;

  const lastCell = (): string =>
    [
      ...(document.querySelector(`${TRADE} tbody tr[data-current]`)?.querySelectorAll('td') ?? []),
    ].at(-1)?.textContent ?? '';

  // Damage a march, Silver a march, Hired lost, and **one** rate — which divides the row's own march
  // (0020 §D-3), the thing that stops a row named for a ratio from being beaten on that ratio by the row
  // above it. The campaign's own ratio is a different figure and is not what the row prints.
  expect(lastCell()).toBe(ratio(row.repeat.damage / row.repeat.silver, 3));
  expect(lastCell()).not.toBe(ratio(row.damagePerSilver, 3));

  // "Per silver" is printed to where the plans actually differ. At two decimals the whole column read
  // "0.54" on the owner's own account — three rows, one figure — so the row named "Best for silver" was
  // indistinguishable from the two beneath it on the very ratio it is named for.
  const perSilver = [...(document.querySelectorAll(`${TRADE} tbody tr`) ?? [])].map(
    (line) => [...line.querySelectorAll('td')].at(-1)?.textContent ?? '',
  );
  const exact = ROWS.map((point) => point.repeat.damage / point.repeat.silver);
  if (new Set(exact.map((value) => value.toFixed(6))).size === ROWS.length) {
    expect(new Set(perSilver).size).toBe(ROWS.length);
  }

  // **The switch** (S-113): the same column, a different rate, and the head says which one. "Per hired" is
  // the hired stacks' own damage over the hired units the march loses (S-105), not the march's whole worst
  // opening over them — the owner read the old column as *"a damage per hired almost above total damage"*.
  await user.click(screen.getByRole('radio', { name: 'Per hired' }));
  const heads = [...document.querySelectorAll(`${TRADE} thead th`)].map((th) => th.textContent);
  expect(heads.at(-1)).toBe('Per hired');
  expect(lastCell()).toBe(ratio(row.repeat.hiredDamage / row.repeat.mercLost));
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
  expect(headers).toEqual(['Plan', '🔒 Worst', '🪙 Silver', '🪖 Hired lost', 'Per silver']);
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

  // **The reference table is the plans this bar may offer** (S-88). The owner read a row of it at 2.91 damage
  // a silver, better than any stop he was given, and asked why it was not one: it was a march the band
  // refuses, and the engine buckets the table over the band the stops are drawn from since. So the table
  // **says whose plans they are**, in a caption that is also its accessible name, and it is drawn from two
  // rows up — one row is the bar's own figures said twice (rule 5). Queried through the DOM for the same
  // reason the trade table above is: jsdom keeps a folded panel's table out of the accessibility tree.
  const caption = [...document.querySelectorAll('caption')].find((node) =>
    (node.textContent ?? '').startsWith('Every plan this bar may offer'),
  );
  if (plan.curve.length > 1) {
    expect(caption).toBeTruthy();
    // The caption is the table's accessible name: no aria-label competes with it.
    expect(caption?.closest('table')?.getAttribute('aria-label')).toBeNull();
    const levels = [...(caption?.closest('table')?.querySelectorAll('tbody tr') ?? [])];
    // Six rows at most, evenly spaced; the band is narrow enough that it is usually every row it has.
    expect(levels).toHaveLength(Math.min(6, plan.curve.length));
    expect(levels[0]?.textContent ?? '').toContain(amount(plan.curve[0]?.silver ?? 0));
  } else {
    expect(caption).toBeUndefined();
  }

  // And the line under it, when it is there, names a level **of the table** that is not its dearest row: it
  // is said only where the table itself shows the next level buying less than a damage a silver. On a band
  // whose every level still pays, there is nothing to say and nothing is said (rule 15).
  const ceiling = screen.queryByText(/^Past about /);
  if (ceiling) {
    const said = /^Past about (.+?) silver/.exec(ceiling.textContent ?? '')?.[1];
    expect(plan.curve.slice(0, -1).map((point) => amount(point.silver))).toContain(said);
  }
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
 * (3.00 against 2.82 · 2.48 · 2.05) and the best damage a hired unit is the thriftiest, which is the engine's
 * own claim about an account whose mercenaries are priced in gold — the dear end and the thrift end
 * (`PlanRow.bestFor`, `src/engine/plan.ts`). Damage a hired unit is the **hired stacks' own** damage over the
 * hired units lost since S-105 (`repeat.hiredDamage / repeat.mercLost`), so each row carries that figure too:
 * 137 k against 120 k · 110 k · 100 k · 90 k, the same order the whole-march reading gave (456 k against
 * 433 k · 365 k · 314 k · 247 k) and a third of its level, which is the story in one line.
 *
 * **Five rows since 2026-09-18** (`PlanPick`): the owner asked for a "more mercs" step between the knee and
 * the top and then for a stop that fills every mercenary the troops can shelter, so the bar carries the whole
 * of `silver-saver → sweet-spot → more-mercs → steady-max → all-in` and the cases below read the last row
 * rather than the third. The `all-in` row is the one that carries `sequence`: it repeats no march, so the
 * figures beside it are its **first** march's and the fold and the tip both say so in words.
 */
const BURN_ROWS: PlanRow[] = [
  {
    ...(ROWS[0] as PlanRow),
    pick: 'silver-saver',
    silver: 11,
    totalDamage: 101,
    bestFor: { silver: false, hired: true },
    repeat: {
      damage: 4_100_000,
      hiredDamage: 1_230_000,
      silver: 2_000_000,
      gold: 11_400,
      seconds: 950_400,
      mercLost: 9,
    },
  },
  {
    ...(ROWS[0] as PlanRow),
    pick: 'sweet-spot',
    silver: 12,
    totalDamage: 102,
    bestFor: { silver: false, hired: false },
    repeat: {
      damage: 5_200_000,
      hiredDamage: 1_440_000,
      silver: 2_100_000,
      gold: 12_100,
      seconds: 1_036_800,
      mercLost: 12,
    },
  },
  {
    ...(ROWS[0] as PlanRow),
    pick: 'more-mercs',
    silver: 13,
    totalDamage: 103,
    bestFor: { silver: false, hired: false },
    repeat: {
      damage: 6_200_000,
      hiredDamage: 1_870_000,
      silver: 2_200_000,
      gold: 22_000,
      seconds: 1_123_200,
      mercLost: 17,
    },
  },
  {
    ...(ROWS[0] as PlanRow),
    pick: 'steady-max',
    silver: 14,
    totalDamage: 104,
    bestFor: { silver: true, hired: false },
    repeat: {
      damage: 6_900_000,
      hiredDamage: 2_200_000,
      silver: 2_300_000,
      gold: 33_700,
      seconds: 1_209_600,
      mercLost: 22,
    },
  },
  // The one stop that is a sequence rather than a march repeated: it carries `PlanTotals.sequence`, four
  // marches that differ, and nothing else about a row changes for it.
  {
    ...(ROWS[0] as PlanRow),
    pick: 'all-in',
    silver: 15,
    totalDamage: 105,
    sequence: [{ a: 4 }, { a: 3 }, { a: 2 }, { a: 1 }],
    marches: 4,
    finaleCounts: undefined,
    bestFor: { silver: false, hired: false },
    repeat: {
      damage: 7_400_000,
      hiredDamage: 2_700_000,
      silver: 2_400_000,
      gold: 48_000,
      seconds: 1_296_000,
      mercLost: 30,
    },
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
  // called "Silver saver" since 2026-09-18, which is exactly why the ends may not be.
  expect(screen.getByText('Fewest hired lost')).toBeTruthy();
  expect(screen.getByText('Most hired lost')).toBeTruthy();
  expect(screen.queryByText('Most silver')).toBeNull();
  expect(screen.getByText('Silver saver').closest('tr')).toBe(tradeRows()[0]);
  // The dear end of the bar is a stop called "All in" and the axis is still named after the hired stock.
  expect(screen.getByText('All in').closest('tr')).toBe(tradeRows()[BURN_ROWS.length - 1]);

  // Five stops at most, and a row is named by **which answer it is** and by nothing else: the `step`
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
  expect(headers).toEqual(['Plan', '🔒 Worst', '🪙 Silver', '🪖 Hired lost', 'Per silver']);
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
  expect(rows[4]?.textContent ?? '').not.toContain('best a');
  // The words are the trade's own column heads said short, so the row cannot claim one thing under its name
  // and another in the column beside it (design rule 5).
  expect(bestForWords(BURN_ROWS[3] as PlanRow)).toBe('best a silver');
  expect(bestForWords(BURN_ROWS[0] as PlanRow)).toBe('best a hired');

  // …and in the row's accessible name, because the note is drawn in the muted ink and a mark that is only
  // there for the eye is a mark half the readers do not get (design rule 24).
  expect(rows[3]?.getAttribute('aria-label') ?? '').toContain('best a silver');
  expect(rows[0]?.getAttribute('aria-label') ?? '').toContain('best a hired');

  // The bar says it too, over the stop it belongs to: the bar and the table are one thing (0020 §D-2).
  // The best a silver is the **fourth** stop and no longer the bar's far end — "All in" stands past it
  // since 2026-09-18 — so the pointer is put on that stop rather than at the end of the track.
  const dearest = BURN_ROWS.length - 2;
  fireEvent.pointerMove(bar(), {
    clientX: TRACK.left + (TRACK.width * dearest) / (BURN_ROWS.length - 1),
  });
  expect(tip()?.textContent ?? '').toContain('best a silver');
  // The tip is `aria-hidden`, so the thumb's own value text is where a screen reader meets the same fact.
  const thumb = screen.getByRole('slider', { name: 'Where on the trade to read the plan' });
  fireEvent.keyDown(thumb, { key: 'End' });
  expect(useRunStore.getState().planPick).toBe(BURN_ROWS.length - 1);
  fireEvent.keyDown(thumb, { key: 'ArrowLeft' });
  expect(useRunStore.getState().planPick).toBe(dearest);
  expect(thumb.getAttribute('aria-valuetext') ?? '').toContain('best a silver');
});

/**
 * **The training queue, under the silver it is paid beside** (owner, 2026-09-18: *"generation sometimes skips
 * low-level stacks and misses some damage that seems cheap; it is mainly because one thing is not taken into
 * account: troops of higher tier are longer to train"*).
 *
 * Two stops an hour apart in silver can be a week apart in training, and the silver column cannot say so. The
 * figure goes **inside the silver cell** rather than into a seventh column: a seventh head measured 505 px in
 * a 462 px pane when gold was tried as one, which is why gold rides the tip instead.
 */
test('every stop says how long its march takes to recover, under the silver it costs', () => {
  stubLayout();
  primeBurn();
  renderWithTheme(<PlanFold />);

  const rows = tradeRows();
  for (const [index, row] of rows.entries()) {
    const point = BURN_ROWS[index] as PlanRow;
    expect(row.textContent ?? '', `${point.pick} prints its queue`).toContain(duration(point.repeat.seconds));
    // And in the row's accessible name beside its silver, because a figure drawn in the muted ink is a
    // figure half the readers do not get (design rule 24).
    expect(row.getAttribute('aria-label') ?? '').toContain(`${duration(point.repeat.seconds)} to recover`);
  }
  // Read in the game's own words, never as a count of seconds.
  expect(rows[0]?.textContent ?? '').toContain('11d 0h');
  expect(rows[0]?.textContent ?? '').not.toContain(amount(950_400));

  // **Still six columns.** The queue is a second line inside the silver cell, not a head of its own.
  const headers = [...document.querySelectorAll(`${TRADE} thead th`)].map((th) => th.textContent);
  expect(headers).toEqual(['Plan', '🔒 Worst', '🪙 Silver', '🪖 Hired lost', 'Per silver']);

  // The line over the bar says it for the plan the fold is reading, and "Fought to the end" for the whole
  // campaign — the same two places its silver is said (design rule 5: one name, said where it is expected).
  expect(screen.getByText(/sweet spot it found/).textContent ?? '').toContain(
    `${duration((BURN_ROWS[1] as PlanRow).repeat.seconds)} of training`,
  );
  expect(screen.getByText(/^Fought to the end: /).textContent ?? '').toContain(
    `${duration(BURN.seconds)} of training`,
  );
});

/**
 * **The dragon coins, in the silver cell beside the queue** (S-102, 2026-09-19; the owner: *"monsters should
 * be there if dominance has been set and damage is interesting; they have a cost in silver but in dragon
 * coins also, which are both constrained; but at least, apart from mercs, they can be trained just like
 * troops."*).
 *
 * A dominance monster is trained rather than hired, so S-102 took its chunks off the **Hired lost** column —
 * that column is the authority pool's, and only that pool is a stock the player cannot train back. What a
 * monster costs is the silver, the queue and the coins, and the first two already share this cell, so the
 * third joins them rather than taking a seventh head the table has no room for.
 *
 * **And only while a march spends one** (design rule 15: nothing on screen without a value). Every army in
 * this repo but a monster camp spends none, so the ordinary bar must say nothing at all about coins.
 */
test('a stop that trains monsters says what it costs in dragon coins, and one that does not says nothing', () => {
  stubLayout();
  // The bar as every army without a dominance pool draws it: not one row mentions a coin, in the cells or
  // in the names a screen reader hears.
  primeBurn();
  renderWithTheme(<PlanFold />);
  const plain = tradeRows();
  expect(plain.map((row) => row.textContent ?? '').join('\n')).not.toContain('dragon coin');
  expect(plain.map((row) => row.getAttribute('aria-label') ?? '').join('\n')).not.toContain('dragon coin');
  cleanup();

  // The same bar on a monster camp: the sweet spot's march trains 6 840 coins' worth of monsters back
  // (experiment 110's 900-dominance camp, the figure the engine measured on 2026-09-19).
  const camp: CampaignPlan = {
    ...BURN,
    alternatives: BURN_ROWS.map((row, index) =>
      index === 1 ? { ...row, repeat: { ...row.repeat, dragonCoins: 6_840 } } : row,
    ),
  };
  useRunStore.setState({ plan: camp, planPick: 1, includedUnitIds: [], leftOutByPlayer: [] });
  renderWithTheme(<PlanFold />);
  const rows = tradeRows();
  const monster = rows[1];
  // In the cell, under the queue and after it — the three prices of one march, read in one place.
  expect(monster?.textContent ?? '').toContain(`${amount(6_840)} dragon coins`);
  // And in the row's accessible name, because a figure drawn in the muted ink is a figure half the readers
  // do not get (design rule 24).
  expect(monster?.getAttribute('aria-label') ?? '').toContain(`${amount(6_840)} dragon coins`);
  // The other four stops spend no coin and say so by saying nothing.
  for (const index of [0, 2, 3, 4]) {
    expect(rows[index]?.textContent ?? '', `stop ${String(index)} is silent about coins`).not.toContain(
      'dragon coin',
    );
  }
  // **Still six columns**: the coins are a line inside the silver cell, never a head of their own.
  const headers = [...document.querySelectorAll(`${TRADE} thead th`)].map((th) => th.textContent);
  expect(headers).toEqual(['Plan', '🔒 Worst', '🪙 Silver', '🪖 Hired lost', 'Per silver']);
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
  expect(shown?.textContent ?? '').toContain(`${compact(7_400_000)} worst opening a march`);
  expect(shown?.textContent ?? '').toContain(`${compact(48_000)} gold a march`);
});

test('the all-in stop says it is a sequence, on the bar and on the row the fold collapses to', () => {
  stubLayout();
  const last = BURN_ROWS.length - 1;
  primeBurn(last);
  renderWithTheme(<PlanFold />);

  // The one stop that repeats no march: it shelters every mercenary it can on the first march and then
  // marches on what the stock has left (`PlanTotals.sequence`). The figures beside it are the **first**
  // march's, so the row that says how the plan is fought may not count repeats of it.
  const words = sequenceWords(BURN_ROWS[last] as PlanRow);
  expect(words).toBe('4 marches, each on what the last one left');
  const fold = screen.getByRole('button', { name: /^Plan/ });
  expect(fold.textContent).toContain(words);
  expect(fold.textContent).not.toContain('+ a last one');

  // On the bar, in the same words (design rule 5), and in the thumb's value text because the tip is
  // `aria-hidden` decoration (design rule 24).
  fireEvent.pointerMove(bar(), { clientX: TRACK.left + TRACK.width });
  expect(tip()?.textContent ?? '').toContain(words);
  const thumb = screen.getByRole('slider', { name: 'Where on the trade to read the plan' });
  fireEvent.keyDown(thumb, { key: 'End' });
  expect(thumb.getAttribute('aria-valuetext') ?? '').toContain(words);

  // Every other stop is still a march repeated, and says nothing about a sequence.
  expect(sequenceWords(BURN_ROWS[0] as PlanRow)).toBeNull();

  // "Fought to the end" is unmoved: it is the campaign's own totals, not the stop's — and it names the
  // reading the plan is on since S-94, the same "worst opening" the trade's own column head carries.
  expect(screen.getByText(/^Fought to the end: /).textContent ?? '').toContain(
    `${amount(BURN.totalDamage)} worst-opening damage`,
  );
});

/**
 * **The all-in says where its mercenaries run out** (2026-09-19). The stop plays the whole horizon now: once
 * the hired stock is spent, the marches the horizon still has room for are the sizer's own — troops and no
 * hired stack at all (`src/engine/plan.ts`, the all-in's tail). Measured on a first-run army holding three
 * Bear V, that is 3 · 2 · 1 and then one march of troops alone.
 */
test('the all-in line counts the marches it fights on troops alone', () => {
  const hired = (bears: number): Record<string, number> => ({ 'swordsman-1': 3_048, 'bear-5': bears });
  const alone: Record<string, number> = { 'swordsman-1': 3_048 };
  const words = (sequence: Record<string, number>[]): string | null => sequenceWords({ sequence });

  // Three bears over a four-march horizon: 3 · 2 · 1, and the fourth on the troops.
  expect(words([hired(3), hired(2), hired(1), alone])).toBe(
    '4 marches, each on what the last one left, the last on troops alone',
  );
  // Two of them, counted rather than named one by one — the line stays one line.
  expect(words([hired(3), hired(1), alone, alone])).toBe(
    '4 marches, each on what the last one left, the last 2 on troops alone',
  );
  // Ten bears field 10 · 9 · 8 · 7: the stock lasts the horizon and there is no tail to say.
  expect(words([hired(10), hired(9), hired(8), hired(7)])).toBe('4 marches, each on what the last one left');
  // A **custom** mercenary is a unit the tables do not carry, and it is always of the authority pool: its
  // march fields hired units and is not a march of troops alone.
  expect(words([hired(3), { 'swordsman-1': 3_048, 'my-own-beast': 4 }])).toBe(
    '2 marches, each on what the last one left',
  );
});

/**
 * **A repeated stop says where its mercenaries run out too** (S-89; owner, 2026-09-18, choosing P1 of
 * `tools/theorycraft/out/105-six-proposals.md`).
 *
 * A stop whose hired stock the horizon outruns plays the marches left over on troops alone, exactly as the
 * `all-in` does — it just does not need a march-by-march sequence to say so, because the marches it *does*
 * field mercenaries on are all the same march (`PlanTotals.tail`). So the count on the fold keeps its old
 * shape for those and the tail is added to it, in the one place the words live (design rule 5): the fold's
 * summary, the bar's tip and the thumb's value text all read `sequenceWords`.
 */
test('a repeated stop with a tail counts the marches it fights on troops alone', () => {
  const tail = (marches: number): PlanRow['tail'] => ({
    counts: { 'swordsman-1': 3_048 },
    marches,
    damage: 4_610_642,
    silver: 8_131_400,
    seconds: 2_269_380,
  });
  // The bear ×1 sweet spot: one march of the bear, three on the troops (`out/105` §P1).
  expect(sequenceWords({ marches: 4, tail: tail(3) })).toBe('1 march, then 3 on troops alone');
  // The bear ×2 sweet spot: a march and the finale the chunk leaves, then two on the troops.
  expect(sequenceWords({ marches: 4, finaleCounts: { 'bear-5': 1 }, tail: tail(2) })).toBe(
    '1 march + a last one, then 2 on troops alone',
  );
  expect(sequenceWords({ marches: 4, tail: tail(2) })).toBe('2 marches, then 2 on troops alone');
  // A stop whose stock lasts the horizon has no tail, and says nothing: the fold writes the plain count.
  expect(sequenceWords({ marches: 4 })).toBeNull();

  // And the fold collapses to it, in those words.
  stubLayout();
  const tailed: PlanRow = {
    ...(BURN_ROWS[1] as PlanRow),
    marches: 4,
    finaleCounts: undefined,
    tail: tail(3),
  };
  const plan: CampaignPlan = { ...BURN, alternatives: [tailed], recommend: tailed };
  useRunStore.setState({ plan, planPick: 0, includedUnitIds: [], leftOutByPlayer: [] });
  renderWithTheme(<PlanFold />);
  const fold = screen.getByRole('button', { name: /^Plan/ });
  expect(fold.textContent).toContain('1 march, then 3 on troops alone');
  // The old line counted the tail as another march of the row above, which is the one thing it is not.
  expect(fold.textContent).not.toContain('4 marches');
});

/**
 * **The put-back line** (owner, 2026-09-18: *"generation sometimes skips low-level stacks and misses some
 * damage that seems cheap … troops of higher tier are longer to train"*; `PlanRow.putBack`).
 *
 * The pass itself is transparent (owner, 2026-09-19: it is *"integrated in the plan slider proposals"*), so
 * the bar, its tip and the trade say nothing about it — what the fold adds is one sentence on the stop on
 * screen, and only when that stop really put a type back.
 */
const PUT_BACK: PlanRow[] = BURN_ROWS.map((row, index) =>
  index === 1
    ? {
        ...row,
        putBack: { unitId: 'spearman-1', damage: 2.4, silver: 18.2, seconds: 38.3 },
      }
    : row,
);
const WITH_PUT_BACK: CampaignPlan = {
  ...PLAN,
  alternatives: PUT_BACK,
  recommend: PUT_BACK[1] as PlanRow,
};

test('the fold says which low tier went back into the march, and only on the stop that did', () => {
  useRunStore.setState({ plan: WITH_PUT_BACK, planPick: 1, includedUnitIds: [], leftOutByPlayer: [] });
  renderWithTheme(<PlanFold />);

  // One sentence, in the words `./picks` writes once: the unit's own label, then the three changes in the
  // trade's own order, each with the sign a reader needs — damage gained, silver and queue given back.
  const words = putBackWords(PUT_BACK[1] as PlanRow);
  expect(words).toBe(
    'Spearman I put back: +2.4% damage, -18.2% silver, -38.3% to recover, against the same march without it.',
  );
  expect(screen.getByText(words as string)).toBeTruthy();

  // Nothing about it on the bar or in the trade: a stop is simply the better march (the owner's "transparent
  // to the user", and design rule 5 — the fold is where the sentence lives, and it lives there once).
  const trade = document.querySelector(TRADE);
  expect(trade?.textContent ?? '').not.toContain('put back');
  const thumb = screen.getByRole('slider', { name: 'Where on the trade to read the plan' });
  expect(thumb.getAttribute('aria-valuetext') ?? '').not.toContain('put back');

  // Reading another stop drops the line with it: it belongs to the march on screen, not to the plan.
  fireEvent.keyDown(thumb, { key: 'Home' });
  expect(useRunStore.getState().planPick).toBe(0);

  // And on a stop the pass left alone the line is not there at all.
  cleanup();
  useRunStore.setState({ plan: WITH_PUT_BACK, planPick: 0, includedUnitIds: [], leftOutByPlayer: [] });
  renderWithTheme(<PlanFold />);
  expect(putBackWords(PUT_BACK[0] as PlanRow)).toBeNull();
  expect(screen.queryByText(/put back/)).toBeNull();
});

test('the best figure in each column is marked, and Per hired never is', () => {
  stubLayout();
  primeBurn();
  renderWithTheme(<PlanFold />);

  const heads = [...document.querySelectorAll(`${TRADE} thead th`)].map((th) => th.textContent ?? '');
  const marked = tradeRows().map((row) =>
    [...row.querySelectorAll('th, td')].map((cell) => cell.getAttribute('data-best') === 'true'),
  );
  /** Which rows carry the mark in one column, by the column's head. */
  const column = (head: string): number[] => {
    const index = heads.indexOf(head);
    return marked.flatMap((cells, row) => (cells[index] === true ? [row] : []));
  };

  // **One mark a column, and it is a claim about one row** (`tableMarks`, `./picks`). Measured before it
  // was drawn: over the sixteen benchmark armies the marks land on 2.38 different stops on average, so a
  // table of five rows really does have more than one winner on it (experiment 120).
  expect(column('🔒 Worst')).toEqual([BURN_ROWS.length - 1]); // All in hits hardest
  expect(column('🪙 Silver')).toEqual([0]); // the silver saver is the cheapest march
  expect(column('🪖 Hired lost')).toEqual([0]); // …and burns the least stock
  expect(column('Per silver')).toHaveLength(1);

  // **Never on Per hired** (`docs/investigations/0019` §2.3: the ratio rises while the march collapses, and
  // §1 calls it "never the right compass"). The column carries the fact; the table declares no winner.
  expect(column('Per hired')).toEqual([]);

  // The mark's own key, once, under the table it explains (design rule 5) — a mark nobody can decode is
  // decoration.
  expect(document.querySelector(`${TRADE} caption`)?.textContent).toBe(
    'The heavier figure in a column is the best of the bar.',
  );

  // And for a reader who cannot see weight or ink (design rule 24): the marks are in the row's own name —
  // except the rate's, which the note under the name already says in the same breath ("best a silver").
  const top = tradeRows()[BURN_ROWS.length - 1]?.getAttribute('aria-label') ?? '';
  const saver = tradeRows()[0]?.getAttribute('aria-label') ?? '';
  expect(top).toContain('most damage on the bar');
  expect(saver).toContain('least silver on the bar');
  expect(saver).toContain('fewest hired lost on the bar');
  expect(saver).not.toContain('most damage');

  // The rate's mark lands on the row with the best damage a silver, computed here from the same figures
  // the table prints — the column is not marked from the engine's `bestFor` but must agree with it, and
  // experiment 120 measured that agreement on **16 of 16** benchmark armies.
  const rates = BURN_ROWS.map((row) => row.repeat.damage / row.repeat.silver);
  expect(column('Per silver')).toEqual([rates.indexOf(Math.max(...rates))]);

  // …and the note under that row's name says it once. The label carries the note (`bestForWords`) and the
  // rate's mark deliberately adds nothing, because that would be the same fact twice (design rule 5).
  const noted = tradeRows().findIndex((row) => (row.textContent ?? '').includes('best a silver'));
  const label = tradeRows()[noted]?.getAttribute('aria-label') ?? '';
  expect(label.match(/best a silver/gu) ?? []).toHaveLength(1);
});

test('the rate switch offers only what the army spends, and Per gold marks its own row', async () => {
  const user = userEvent.setup();
  // A bar that burns stock and buys gold: all three rates are real figures on it.
  primeBurn();
  renderWithTheme(<PlanFold />);

  // Three rates, in the order the table offers them — and the control's labels are the column's own words,
  // so a head cannot be called one thing and its switch another (design rule 5).
  const group = screen.getByRole('radiogroup', { name: 'Which rate the trade shows' });
  expect(within(group).getAllByRole('radio').map((one) => one.getAttribute('value'))).toEqual([
    'silver',
    'gold',
    'hired',
  ]);

  // **Per gold is the column S-113 bought with the width the switch gave back.** Experiment 120 measured it
  // as the only fact naming its stop on 7 of the 16 benchmark armies — a march nothing else on the table
  // points at — which is the whole reason it is offered.
  await user.click(within(group).getByRole('radio', { name: 'Per gold' }));
  const heads = [...document.querySelectorAll(`${TRADE} thead th`)].map((th) => th.textContent);
  expect(heads).toEqual(['Plan', '🔒 Worst', '🪙 Silver', '🪖 Hired lost', 'Per gold']);

  const rates = BURN_ROWS.map((row) => row.repeat.damage / row.repeat.gold);
  const best = rates.indexOf(Math.max(...rates));
  const marked = tradeRows().flatMap((row, index) =>
    [...row.querySelectorAll('td')].at(-1)?.getAttribute('data-best') === 'true' ? [index] : [],
  );
  expect(marked).toEqual([best]);
  // Gold has no note under the row's name the way silver and hired do, so its mark goes into the row's own
  // accessible name — or it would not exist for a screen reader at all (design rule 24).
  expect(tradeRows()[best]?.getAttribute('aria-label') ?? '').toContain('best a gold');
});

test('an army that spends one rate is given no switch at all', () => {
  // Nothing hired, no gold: one rate, and a control with one option is a label pretending to be a choice
  // (design rule 15).
  const troopsOnly: CampaignPlan = {
    ...BURN,
    alternatives: BURN_ROWS.map((row) => ({
      ...row,
      gold: 0,
      mercLost: 0,
      repeat: { ...row.repeat, gold: 0, mercLost: 0, hiredDamage: 0 },
    })),
  };
  useRunStore.setState({
    plan: troopsOnly,
    planPick: defaultPlanPosition(troopsOnly),
    includedUnitIds: [],
    leftOutByPlayer: [],
  });
  renderWithTheme(<PlanFold />);

  expect(screen.queryByRole('radiogroup', { name: 'Which rate the trade shows' })).toBeNull();
  const heads = [...document.querySelectorAll(`${TRADE} thead th`)].map((th) => th.textContent);
  // …and the two stock columns are gone with it, which is S-112's own reading of the same bar.
  expect(heads).toEqual(['Plan', '🔒 Worst', '🪙 Silver', 'Per silver']);
});
