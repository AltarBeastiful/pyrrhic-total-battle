// @vitest-environment jsdom
/**
 * **The five positions, as the block under the plan draws them** (S-147).
 *
 * The numbers here are hand-made on purpose: what this file is about is the *reading* — the control's own
 * names, the delta against the plan's own march and where it is silent, the caption, and the fact that the
 * rows are read and not pressed. What the five answers *are* is held elsewhere and on both paths
 * (`tests/engine/raise-positions.test.ts`, `tests/kernel/raise-kernel.test.ts`).
 */
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import type { CampaignPlan } from '@/engine/plan';
import { simulateBattle } from '@/engine/battle';
import { sizeStacks } from '@/engine/stacker';
import { buildStackRequest } from '@/state/derive';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';
import { useResultStore } from '@/ui/resultStore';

import { PositionTable } from './PositionTrade';
import type { PositionTrades } from './positions';
import { positionsKey, usePositionsStore } from './positionsSearch';
import { useRunStore } from './runStore';

/**
 * The five answers, with the changes a reader has to be able to see (`compact` and `signedPercent`). `gold`
 * is the parameter: a march that pays none draws no gold column at all (design rule 15).
 */
function trades(gold = 0): PositionTrades {
  const own = {
    damage: 1_000_000,
    mercLost: 10,
    units: 500,
    silver: 8_000_000,
    gold,
    hiredDamage: 400_000,
  };
  const figured = { counts: {}, how: null, space: 0, scored: 0, ...own };
  return {
    own,
    rows: [
      { ...figured, mode: 'tens', damage: 1_020_000, mercLost: 11, units: 520, silver: 8_400_000 },
      { ...figured, mode: 'most', damage: 900_000, mercLost: 14, units: 600, silver: 9_600_000 },
      // A damage raise that costs more of every purse.
      {
        ...figured,
        mode: 'v2',
        damage: 1_100_000,
        mercLost: 12,
        units: 540,
        silver: 10_000_000,
        gold: gold === 0 ? 0 : 1_500,
        how: 'walked',
        space: 10,
        scored: 4,
      },
      // A position that changes nothing says nothing: no note under any figure.
      { ...figured, mode: 'safe', how: 'walked', space: 10, scored: 4 },
      // And one that spends less: `Tight` may not burn more than the plan's own counts (S-144).
      {
        ...figured,
        mode: 'tight',
        damage: 1_050_000,
        mercLost: 6,
        units: 460,
        how: 'searched',
        space: 10,
        scored: 90,
      },
    ],
  };
}

/**
 * The plan the fixture's March came from. One stop is enough for the block: it draws the table of the stop
 * the bar is standing on, and `planPick` opens at the first.
 */
const PLAN = { alternatives: [{ pick: 'sweet-spot' as const, counts: {} }] } as unknown as CampaignPlan;

/**
 * Plant the priced bar: the plan the fixture holds has one stop, so the block's stop is entry 0. `gold` is
 * what the fixture's march pays the Temple.
 */
function plant(gold: number): void {
  usePositionsStore.setState({ entry: { key: positionsKey(PLAN), stops: [trades(gold)] } });
}

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  useResultStore.getState().clear();
  useRunStore.getState().reset();
  useStore.getState().updateActiveSetup({ housing: { leadership: 4_100, authority: 0, dominance: 0 } });
  const state = useStore.getState();
  const profile = selectActiveProfile(state);
  const setup = selectActiveSetup(state);
  if (!profile || !setup) throw new Error('the fixture has no profile');
  const request = buildStackRequest(profile, setup);
  const result = sizeStacks(request);
  useResultStore.getState().setResult({
    request,
    result,
    summary: simulateBattle(result, request),
    profileId: profile.id,
    setupId: setup.id,
  });
  // The block is only drawn on a plan's march (`useMarch`'s own two facts); what kind of plan it is has
  // nothing to do with the table, so the run store only has to hold one.
  useRunStore.setState({ plan: PLAN });
  plant(0);
});

afterEach(() => {
  cleanup();
  usePositionsStore.setState({ entry: null });
});

/** The row of one position, by the row header the block draws. */
function row(label: string): HTMLElement {
  const head = screen.getByRole('rowheader', { name: label });
  const line = head.closest('tr');
  if (line === null) throw new Error(`no row for ${label}`);
  return line;
}

test('the five positions are drawn, in the control’s own order and its own words', () => {
  renderWithTheme(<PositionTable />);
  const heads = screen.getAllByRole('rowheader').map((cell) => cell.textContent);
  expect(heads).toEqual(['Most, in tens', 'Most', 'Best v2', 'Safe', 'Tight']);
});

test('a figure carries its change against the plan’s own march, and nothing when it did not move', () => {
  renderWithTheme(<PositionTable />);
  const v2 = row('Best v2');
  // The figure, then the percentage as the note under it (the trade’s own idiom): +10 % of damage for
  // +25 % of the silver and +20 % of the mercenaries.
  expect(within(v2).getByText('1.1M')).toBeTruthy();
  expect(within(v2).getByText('+10%')).toBeTruthy();
  expect(within(v2).getByText('10M')).toBeTruthy();
  expect(within(v2).getByText('+25%')).toBeTruthy();
  expect(within(v2).getByText('12')).toBeTruthy();
  expect(within(v2).getByText('+20%')).toBeTruthy();

  // `Safe` here is the plan’s own march: no note under any figure, and no baseline row anywhere.
  const safe = row('Safe');
  expect(within(safe).getByText('1M')).toBeTruthy();
  expect(within(safe).queryByText(/^[+-]/)).toBeNull();
  expect(screen.queryByRole('rowheader', { name: 'As is' })).toBeNull();
  // **Units are not a column** (owner, 2026-09-29: *"i don't care about units, they're cheap"*).
  expect(screen.queryByRole('columnheader', { name: 'Units' })).toBeNull();
});

test('gold is drawn only where a march pays any, and carries its change where it does', () => {
  const { unmount } = renderWithTheme(<PositionTable />);
  expect(screen.queryByRole('columnheader', { name: /Gold/ })).toBeNull();
  unmount();

  plant(1_000);
  renderWithTheme(<PositionTable />);
  expect(screen.getByRole('columnheader', { name: /Gold/ })).toBeTruthy();
  const v2 = row('Best v2');
  expect(within(v2).getByText('1.5K')).toBeTruthy();
  expect(within(v2).getByText('+50%')).toBeTruthy();
});

test('the rows are read, not pressed, and each says what it is', () => {
  renderWithTheme(<PositionTable />);
  // No row is a control: the plan’s trade above is the list a player picks from, and the five positions are
  // all reachable from the summary’s own control (design rule 8 is about *that* table).
  expect(screen.queryAllByRole('grid')).toEqual([]);
  for (const cell of screen.getAllByRole('rowheader')) {
    expect(cell.closest('tr')?.getAttribute('tabindex')).toBeNull();
  }
  const row5 = row('Most');
  const name = row5.getAttribute('aria-label') ?? '';
  expect(name).toContain('Most:');
  expect(name).toContain('silver');
  expect(name).toContain('mercs lost a march');
});

test('the caption names the baseline and what the three columns are', () => {
  renderWithTheme(<PositionTable />);
  const caption = screen.getByText(/What each raise position makes of the plan's own march/);
  expect(caption.textContent).toContain('against the march the bar is on');
  expect(screen.getByRole('columnheader', { name: /Damage/ })).toBeTruthy();
  expect(screen.getByRole('columnheader', { name: /Silver/ })).toBeTruthy();
  expect(screen.getByRole('columnheader', { name: 'Merc' })).toBeTruthy();
});
