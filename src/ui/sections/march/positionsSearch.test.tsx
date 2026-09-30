// @vitest-environment jsdom
/**
 * **The whole bar is priced once, a slide is another table, and the control reads them** (S-147, S-149).
 *
 * The block prices five positions per stop and a plan has two to five stops, so the first thing this has to
 * get right is that moving the bar asks for **nothing**: the stop on screen is asked for first, the rest of
 * the bar behind it, and every table is filed under the plan and the army they are all about
 * (`positionsKey`), not under the march the bar happens to be showing. The second is what the control in the
 * battle summary gets out of it — the row of the stop and the position on screen, and no search of its own
 * (`usePricedRaise`, owner, 2026-09-30: *"make the positions selector (as is, tight…) use the already computed
 * assemblyscript values (should be same as engine/TS)"*).
 *
 * The client is a double here on purpose: what the block computes is held elsewhere
 * (`tests/engine/raise-positions.test.ts`, `tests/kernel/raise-kernel.test.ts`), and what this file is about is
 * the asking — how many jobs, in what order, and what the hook hands back for a stop it has.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { CampaignPlan } from '@/engine/plan';
import type { StackRequest, StackResult } from '@/engine/types';
import type { ResultSnapshot } from '@/ui/resultStore';
import type * as WorkerClient from '@/worker/client';

import type { PositionTrades } from './positions';
import { positionsKey, usePositions, usePositionsStore, usePricedRaise } from './positionsSearch';
import type { PositionsInput } from '@/worker/protocol';

/** Every job the block asked for, in the order the worker was handed them. */
const jobs: Record<string, number>[] = [];

/**
 * The five answers, marked by the stop they are about: the fixture's count is carried into the damage — so a
 * test can say *which* stop's table the hook handed back without reproducing the engine — and into the
 * **counts**, which are the stop's own raised by a hundred, so that what the control lands on is a number
 * nothing else in the fixture produces (S-149).
 */
function priced(counts: Record<string, number>): PositionTrades {
  const mark = counts['unit-1'] ?? 0;
  const own = { damage: mark, mercLost: 0, units: 0, silver: 0, gold: 0, hiredDamage: 0 };
  return {
    own,
    rows: (['tens', 'most', 'v2', 'safe', 'tight'] as const).map((mode) => ({
      mode,
      counts: { ...counts, 'unit-1': mark + 100 },
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

/** One hired stack, as the engine hands a march back: the count is the whole of what the guard reads. */
function march(count: number): StackResult {
  return {
    stacks: [{ unitId: 'unit-1', count }],
    pools: {},
    dropped: [],
    warnings: [],
  } as unknown as StackResult;
}

/**
 * The march on screen. The block reads its `request` (the key's second half, S-149) and the control reads its
 * `result` — the counts it has to recognise before it may take the table's answer for them — and its counts
 * are the bar's own first stop, so the first stop of the fixture is the one whose row the control may read.
 */
const SNAPSHOT = { request: {}, result: march(1) } as unknown as ResultSnapshot;

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

  test('every stop is filed under one plan and one army, and the march behind it does not reprice them', async () => {
    const { result, rerender } = renderHook(
      ({ position, snapshot }: { position: number; snapshot: ResultSnapshot }) =>
        usePositions(snapshot, PLAN, position, true),
      { initialProps: { position: 1, snapshot: SNAPSHOT } },
    );
    await waitFor(() => {
      expect(result.current?.own.damage).toBe(2);
    });
    const key = usePositionsStore.getState().entry?.key;
    expect(key).toBe(positionsKey(PLAN, SNAPSHOT.request));

    // A **new snapshot with the same army in it**, which is what moving the bar makes (`PlanPanel`'s `read`
    // rebuilds the request from the same profile and setup): the key is the plan's and the army's, both
    // unchanged, so the tables stand and nothing is asked again.
    rerender({ position: 1, snapshot: { ...SNAPSHOT, request: { ...SNAPSHOT.request } } });
    expect(result.current?.own.damage).toBe(2);
    expect(jobs.length).toBe(3);
    expect(usePositionsStore.getState().entry?.key).toBe(key);
  });

  test('a setup edited under a standing plan is another army, and the bar is priced again', async () => {
    // The plan's stops are the old **army's** counts sized against the army the bar was priced with, and the
    // March rebuilds its request from the setup as it is now (`PlanPanel`'s `read`). A table is about a march
    // of one army, so it is re-asked rather than left describing an account the page no longer holds (S-149).
    const { result, rerender } = renderHook(
      ({ snapshot }: { snapshot: ResultSnapshot }) => usePositions(snapshot, PLAN, 0, true),
      { initialProps: { snapshot: SNAPSHOT } },
    );
    await waitFor(() => {
      expect(result.current?.own.damage).toBe(1);
    });
    expect(jobs.length).toBe(3);

    rerender({ snapshot: { ...SNAPSHOT, request: { changed: true } } as unknown as ResultSnapshot });
    await waitFor(() => {
      expect(jobs.length).toBe(6);
    });
  });

  test('a stop that is still being priced draws nothing, and one that failed draws nothing either', async () => {
    usePositionsStore.setState({
      entry: { key: positionsKey(PLAN, SNAPSHOT.request), stops: [null, null, null] },
    });
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

/**
 * **What the control in the battle summary reads out of the bar** (S-149). The four questions the guard asks
 * before the March may stand its stacks on a row the plan priced: is the march on screen the plan's own stop,
 * is the table one of this army's, is the position one segment over both blocks, and is it a position at all.
 */
describe('the raise the plan has already priced', () => {
  const linked = { authority: 'most', dominance: 'most' } as const;

  test('the row of the stop and the position on screen is what the March lands on', async () => {
    const { result } = renderHook(() => usePricedRaise(SNAPSHOT, PLAN, 0, linked, true));
    // The stop on screen is the bar's first — its counts are the march's own, count for count — and the
    // fixture's rows are the stop's counts raised by a hundred, which nothing else here produces.
    await waitFor(() => {
      expect(result.current).toEqual({ 'unit-1': 101 });
    });
  });

  test('a march the plan did not size is not read off a row priced for another one', async () => {
    // The same table, the same position — but the bar is on a stop whose counts are not the march's, which
    // is what a March edit leaves behind (`resizeMarch`: *"the same run, re-sized"*).
    const { result } = renderHook(() => usePricedRaise(SNAPSHOT, PLAN, 1, linked, true));
    expect(result.current).toBeNull();
  });

  test('a mixed control, and `As is`, are questions no row answers', async () => {
    const mixed = renderHook(() =>
      usePricedRaise(SNAPSHOT, PLAN, 0, { authority: 'most', dominance: 'v2' }, true),
    );
    expect(mixed.result.current).toBeNull();
    const off = renderHook(() =>
      usePricedRaise(SNAPSHOT, PLAN, 0, { authority: 'off', dominance: 'off' }, true),
    );
    expect(off.result.current).toBeNull();
  });

  test('another army’s table is not this march’s', async () => {
    // The bar priced under a request the March is not holding: the same plan, the same march, another account.
    usePositionsStore.setState({
      entry: {
        key: positionsKey(PLAN, { other: true } as unknown as StackRequest),
        stops: [priced({ 'unit-1': 1 })],
      },
    });
    const { result } = renderHook(() => usePricedRaise(SNAPSHOT, PLAN, 0, linked, true));
    // The March asks again rather than reading it (`usePositions`), so the planted table is replaced by the
    // one this army's own job answers — and the answer is the same shape, from the job and not from the plant.
    await waitFor(() => {
      expect(result.current).toEqual({ 'unit-1': 101 });
    });
    expect(usePositionsStore.getState().entry?.key).toBe(positionsKey(PLAN, SNAPSHOT.request));
  });
});
