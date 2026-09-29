// @vitest-environment jsdom
/**
 * **The whole bar is priced once, and a slide is another table** (S-147; owner, 2026-09-29: *"why the table
 * doesn't appear for each slider spot? merc save, sweet spot… all those should have their table when clicking
 * on the plan slider. Best is to compute it ahead for all like the slider spots"*).
 *
 * The block prices five positions per stop and a plan has two to five stops, so the one thing this has to get
 * right is that moving the bar asks for **nothing**: the stop on screen is asked for first, the rest of the
 * bar behind it, and every table is filed under the plan they are all about (`positionsKey`), not under the
 * march the bar happens to be showing.
 *
 * The client is a double here on purpose: what the block computes is held elsewhere
 * (`tests/engine/raise-positions.test.ts`, `tests/kernel/raise-kernel.test.ts`), and what this file is about is
 * the asking — how many jobs, in what order, and what the hook hands back for a stop it has.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { CampaignPlan } from '@/engine/plan';
import type { ResultSnapshot } from '@/ui/resultStore';
import type * as WorkerClient from '@/worker/client';

import type { PositionTrades } from './positions';
import { positionsKey, usePositions, usePositionsStore } from './positionsSearch';
import type { PositionsInput } from '@/worker/protocol';

/** Every job the block asked for, in the order the worker was handed them. */
const jobs: Record<string, number>[] = [];

/**
 * The five answers, marked by the stop they are about: the fixture's count is carried into the damage, so a
 * test can say *which* stop's table the hook handed back without reproducing the engine.
 */
function priced(counts: Record<string, number>): PositionTrades {
  const mark = counts['unit-1'] ?? 0;
  const own = { damage: mark, mercLost: 0, units: 0, silver: 0, gold: 0, hiredDamage: 0 };
  return {
    own,
    rows: (['tens', 'most', 'v2', 'safe', 'tight'] as const).map((mode) => ({
      mode,
      counts,
      how: null,
      space: 0,
      scored: 0,
      ...own,
    })),
  };
}

vi.mock('@/worker/client', async () => {
  const actual = await vi.importActual<typeof WorkerClient>('@/worker/client');
  return {
    isAbortError: actual.isAbortError,
    createCalcClient: () => ({
      mode: 'worker' as const,
      positions: (input: PositionsInput) => {
        jobs.push(input.counts);
        return Promise.resolve(priced(input.counts));
      },
      dispose: () => undefined,
    }),
  };
});

/** A plan of three stops, which is the shape the bar has on a real army. */
const PLAN = {
  alternatives: [
    { pick: 'merc-saver', counts: { 'unit-1': 1 } },
    { pick: 'sweet-spot', counts: { 'unit-1': 2 } },
    { pick: 'all-in', counts: { 'unit-1': 3 } },
  ],
} as unknown as CampaignPlan;

/** The march on screen; the block only ever reads its `request` (`marchId`'s own reason). */
const SNAPSHOT = { request: {} } as unknown as ResultSnapshot;

beforeEach(() => {
  jobs.length = 0;
  usePositionsStore.setState({ entry: null });
});

afterEach(() => {
  usePositionsStore.getState().stop();
});

describe('the priced bar', () => {
  test('asks for the stop on screen first, then the rest of the bar', async () => {
    renderHook(() => usePositions(SNAPSHOT, PLAN, 1, true));
    await waitFor(() => {
      expect(jobs.length).toBe(3);
    });
    // The stop the player is looking at, before its neighbours: a worker runs one job at a time.
    expect(jobs[0]).toEqual({ 'unit-1': 2 });
    expect(new Set(jobs.map((counts) => counts['unit-1']))).toEqual(new Set([1, 2, 3]));
  });

  test('a slide to another stop is another table and no new job', async () => {
    const { result, rerender } = renderHook(
      ({ position }: { position: number }) => usePositions(SNAPSHOT, PLAN, position, true),
      { initialProps: { position: 1 } },
    );
    await waitFor(() => {
      expect(result.current?.own.damage).toBe(2);
    });
    expect(jobs.length).toBe(3);

    rerender({ position: 0 });
    // Nothing was asked for: the table of that stop was already in the store.
    expect(result.current?.own.damage).toBe(1);
    expect(jobs.length).toBe(3);

    rerender({ position: 2 });
    expect(result.current?.own.damage).toBe(3);
    expect(jobs.length).toBe(3);
  });

  test('every stop of the bar is filed under one plan, and the march behind it does not reprice them', async () => {
    const { result, rerender } = renderHook(
      ({ position, snapshot }: { position: number; snapshot: ResultSnapshot }) =>
        usePositions(snapshot, PLAN, position, true),
      { initialProps: { position: 1, snapshot: SNAPSHOT } },
    );
    await waitFor(() => {
      expect(result.current?.own.damage).toBe(2);
    });
    const key = usePositionsStore.getState().entry?.key;
    expect(key).toBe(positionsKey(PLAN));

    // A **new snapshot** for a stop already on the bar (which is what moving the bar makes): the key is the
    // plan's, so the tables stand and nothing is asked again.
    rerender({ position: 1, snapshot: { request: { other: true } } as unknown as ResultSnapshot });
    expect(result.current?.own.damage).toBe(2);
    expect(jobs.length).toBe(3);
    expect(usePositionsStore.getState().entry?.key).toBe(key);
  });

  test('a stop that is still being priced draws nothing, and one that failed draws nothing either', async () => {
    usePositionsStore.setState({ entry: { key: positionsKey(PLAN), stops: [null, null, null] } });
    const { result } = renderHook(() => usePositions(SNAPSHOT, PLAN, 0, true));
    expect(result.current).toBeNull();
  });

  test('a new plan is priced again, and the old tables are forgotten', async () => {
    const { result, rerender } = renderHook(
      ({ plan }: { plan: CampaignPlan }) => usePositions(SNAPSHOT, plan, 0, true),
      { initialProps: { plan: PLAN } },
    );
    await waitFor(() => {
      expect(result.current?.own.damage).toBe(1);
    });
    const next = {
      alternatives: [{ pick: 'sweet-spot', counts: { 'unit-1': 9 } }],
    } as unknown as CampaignPlan;
    rerender({ plan: next });
    await waitFor(() => {
      expect(result.current?.own.damage).toBe(9);
    });
    expect(jobs.length).toBe(4);
  });
});
