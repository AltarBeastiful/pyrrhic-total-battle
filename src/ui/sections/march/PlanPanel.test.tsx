// @vitest-environment jsdom
/**
 * The Plan fold (S-55), by role and by name (design plan §7.5).
 *
 * The search itself is the engine's and is tested there; what this file checks is that the answer is *drawn*
 * — the one line saying what the plan decided (design rule 29), the thesis the method exists to state, the
 * bar with its sweet-spot marker and its way back, the trade read a march at a time with exactly one plan
 * marked, and which resource the plan ran out of. The store is primed with a plan the engine really
 * produced, so the words and the numbers are the ones a player would see.
 */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { emptyTotals, planCampaign, planMarch } from '@/engine';
import type { StackRequest } from '@/engine/types';
import { getUnits } from '@/data';
import { renderWithTheme } from '@/ui/kit/testRender';

import { amount } from './format';
import { PlanFold, PlanSizing } from './PlanPanel';
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
// and every case below draws the same answer.
const PLAN = planCampaign({ request: request(), alternatives: 6 });

/** The fold, opened — every case below but the headline reads the body. */
async function opened(): Promise<void> {
  renderWithTheme(<PlanFold />);
  fireEvent.click(screen.getByRole('button', { name: /^Plan/ }));
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /^Plan/ }).getAttribute('aria-expanded')).toBe('true');
  });
}

beforeEach(() => {
  // primed the way a run primes it: the plan, and the frontier position it opens on
  useRunStore.setState({
    plan: PLAN,
    planPick: defaultPlanPosition(PLAN),
    includedUnitIds: [],
    leftOutByPlayer: [],
  });
});

afterEach(() => {
  cleanup();
  useRunStore.setState({ plan: null });
});

test('the sizing line says what the plan decided, and nothing about it is invented', () => {
  renderWithTheme(<PlanSizing />);
  const plan = useRunStore.getState().plan;
  expect(plan).not.toBeNull();
  if (!plan) return;

  const line = screen.getByText(/^Planned from the army:/);
  // The line describes the plan the frontier is read at — where it opens, which is the engine's own pick —
  // and where that plan sits on the trade, and nothing else. It opens on the sweet spot, so that is what the
  // line has to call it.
  const position = defaultPlanPosition(plan);
  const point = pickOf(plan, position);
  expect(line.textContent).toContain(String(point.marches - (point.finaleCounts ? 1 : 0)));
  expect(line.textContent).toContain(`${Object.keys(point.counts).length} stacks`);
  expect(sweetSpotOf(plan)).toBe(position);
  expect(line.textContent).toContain('the sweet spot between the two resources');
});

test('one control walks the trade, the keyboard walks it too, and the way back to the sweet spot is a word', async () => {
  await opened();
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
  expect(screen.getByText('Least silver')).toBeTruthy();
  expect(screen.getByText('Most silver')).toBeTruthy();
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

test('the fold is closed until it is asked for, with the plan headline on the row', () => {
  renderWithTheme(<PlanFold />);
  const plan = useRunStore.getState().plan;
  if (!plan) throw new Error('no plan to draw');
  const fold = screen.getByRole('button', { name: /^Plan/ });
  expect(fold.getAttribute('aria-expanded')).toBe('false');
  // The row carries the plan the fold is *reading* — where the control opens, which is the plan the engine
  // weighed both resources to choose — and not the one its search settled on: the two part company as soon
  // as the control moves, and a headline that describes a plan the body is not showing is a lie. Read the
  // way the owner asked for it: a march at a time, not a campaign total.
  const shown = pickOf(plan, defaultPlanPosition(plan));
  const repeated = shown.marches - (shown.finaleCounts ? 1 : 0);
  expect(fold.textContent).toContain('damage a march');
  // The last march is a real one and it is not a repeat: the row says so rather than counting it in.
  expect(fold.textContent).toContain(`${repeated} marches${shown.finaleCounts ? ' + a last one' : ''}`);
});

test('the whole row is the target: pressing a plan’s name reads that plan', async () => {
  await opened();
  const plan = useRunStore.getState().plan;
  if (!plan) throw new Error('no plan to draw');

  // The bar is one way to walk the trade and the table is the other (design rule 8): a plan's name is a
  // control, and pressing it does what a stop on the bar does — puts that plan on screen, no new search.
  const rows = [
    ...document.querySelectorAll('table[aria-label="Every plan on the trade"] tbody tr'),
  ] as HTMLElement[];
  const away = defaultPlanPosition(plan) === 0 ? 1 : 0;
  const button = within(rows[away] as HTMLElement).getByRole('button');
  fireEvent.click(button);
  expect(useRunStore.getState().planPick).toBe(away);
});

test('a row prices the march the recap is drawing, and the engine’s own battle agrees with it', async () => {
  await opened();
  const plan = useRunStore.getState().plan;
  if (!plan) throw new Error('no plan to draw');

  // The owner's complaint of 2026-09-15: the row's figures were the plan spread over its marches, finale
  // included, so the plan on screen read one damage a march and the row that named it read another. The row
  // is the **repeated** march now, and the engine's `repeat` is what proves it: the real battle of that very
  // march — the call the March section makes — reports the same figure, to the unit.
  const shown = pickOf(plan, defaultPlanPosition(plan));
  const trade = document.querySelector('table[aria-label="Every plan on the trade"]');
  const marked = trade === null ? null : trade.querySelector('tbody tr[data-marked]');
  expect(marked).not.toBeNull();
  expect(marked?.textContent ?? '').toContain(amount(shown.repeat.damage));
  expect(planMarch(request(), shown.counts).summary.avgDamage).toBe(shown.repeat.damage);
  expect(planMarch(request(), shown.counts).summary.recovery.silver).toBe(shown.repeat.silver);
});

test('the trade says how many plans the band refused, and nothing when it refused none', async () => {
  await opened();
  const plan = useRunStore.getState().plan;
  if (!plan) throw new Error('no plan to draw');

  // The extremes are not offered (owner: "just don't show the extremes"), and the fold says so with the
  // engine's own count rather than leaving the bar looking like the whole trade.
  const line = screen.queryByText(/of the plans the search kept are off the goal/);
  if (plan.leftOut === 0) expect(line).toBeNull();
  else expect(line?.textContent ?? '').toContain(amount(plan.leftOut));
});

test('opened, it says what the method is for, then reads the trade a march at a time', async () => {
  await opened();
  const plan = useRunStore.getState().plan;
  if (!plan) throw new Error('no plan to draw');

  // The thesis first: how damage is paid for, and where the sweet spot landed for this army — in its own
  // figures, so it is an analysis and not a motto.
  expect(screen.getByText(/^Damage is paid for twice over:/)).toBeTruthy();
  expect(screen.getByText(/^The sweet spot it found for this army is /)).toBeTruthy();

  // The trade table. Queried through the DOM rather than by role: jsdom keeps the folded panel's table out
  // of the accessibility tree, so `getByRole('table')` finds nothing even with the fold open. The rows are
  // still asserted one by one against the engine's own frontier.
  const trade = document.querySelector('table[aria-label="Every plan on the trade"]');
  expect(trade).not.toBeNull();
  const rows = trade === null ? [] : [...trade.querySelectorAll('tbody tr')];
  // One row per plan the engine put on the trade, and exactly one of them marked as the one on screen.
  expect(rows).toHaveLength(plan.alternatives.length);
  expect(rows.filter((row) => row.getAttribute('data-marked') !== null)).toHaveLength(1);
  // The columns are the decision: what a march hits for, what it costs and what it burns.
  const headers = trade === null ? [] : [...trade.querySelectorAll('thead th')].map((th) => th.textContent);
  expect(headers).toContain('Damage a march');
  expect(headers).toContain('Silver a march');
  expect(headers).toContain('Mercs a march');
  expect(headers).toContain('Per silver');
  expect(headers).toContain('Per mercenary');
  // And the sweet spot is named in words on its own row, not only marked in colour (rule 24).
  const sweet = sweetSpotOf(plan);
  expect(sweet).not.toBeNull();
  expect(rows.filter((row) => (row.textContent ?? '').includes('the sweet spot'))).toHaveLength(1);

  // The totals stay available, one line down, without being the headline.
  expect(screen.getByText(/^Fought to the end: /)).toBeTruthy();

  // And the sentence about which resource ended the plan: the one that matches what the engine said binds.
  const binds = plan.binding;
  const sentence =
    binds.mercenaries && binds.silver
      ? 'Both resources are spent: more silver and more mercenaries would each buy more damage.'
      : binds.mercenaries
        ? 'The mercenary stock is what ends the plan: silver alone would not buy more damage.'
        : binds.silver
          ? 'The silver box is what ends the plan: more silver would buy more marches.'
          : 'Nothing binds yet — the plan stops where more troops stop paying for themselves.';
  expect(screen.getByText(sentence)).toBeTruthy();
}, 60_000);
