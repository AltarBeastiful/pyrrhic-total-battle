import { afterEach, describe, expect, test, vi } from 'vitest';

import { getUnits } from '@/data';
import { emptyTotals, planCampaign } from '@/engine';
import type { StackRequest } from '@/engine/types';

import { createInlineClient, isAbortError, type CalcClient } from './client';
import { createCalcPool, poolSize, type PoolJob } from './pool';

/** A client double: only `mode` and `dispose` matter to the pool, the jobs below never call the engine. */
function fakeClient(mode: CalcClient['mode'] = 'worker'): CalcClient {
  return { mode, dispose: vi.fn() } as unknown as CalcClient;
}

const wait = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('aborted', 'AbortError'));
    });
  });

/** A job answering `value` after `ms`. */
const after =
  <T>(ms: number, value: T): PoolJob<T> =>
  async (_client, signal) => {
    await wait(ms, signal);
    return value;
  };

/** The planner's small army (`plan-fixes.test.ts`). */
function request(): StackRequest {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3).slice(0, 4);
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000).slice(0, 3);
  const caps: Record<string, number> = {};
  for (const merc of mercs) caps[merc.id] = 30;
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

afterEach(() => {
  vi.useRealTimers();
});

describe('poolSize', () => {
  test('leaves a core to the page, at least one worker and at most six', () => {
    expect(poolSize(1)).toBe(1);
    expect(poolSize(2)).toBe(1);
    expect(poolSize(4)).toBe(3);
    expect(poolSize(16)).toBe(6);
    expect(poolSize(Number.NaN)).toBe(1);
  });
});

describe('the calculation pool', () => {
  test('returns results in job order whatever order the jobs finish in', async () => {
    const pool = createCalcPool({ size: 3, createClient: () => fakeClient() });
    const finished: number[] = [];
    const outcomes = await pool.map([after(30, 'a'), after(5, 'b'), after(15, 'c'), after(1, 'd')], {
      onSettled: (index) => finished.push(index),
    });
    expect(outcomes).toEqual(['a', 'b', 'c', 'd'].map((value) => ({ kind: 'done', value })));
    expect(finished).not.toEqual([0, 1, 2, 3]);
    pool.dispose();
  });

  test('a job that throws comes back as an error and the others still run', async () => {
    const pool = createCalcPool({ size: 2, createClient: () => fakeClient() });
    const boom: PoolJob<string> = () => Promise.reject(new Error('boom'));
    const outcomes = await pool.map([after(1, 'a'), boom, after(1, 'c')]);
    expect(outcomes).toEqual([
      { kind: 'done', value: 'a' },
      { kind: 'error', message: 'boom' },
      { kind: 'done', value: 'c' },
    ]);
    pool.dispose();
  });

  test('the pass clock cuts what has not finished and keeps what has', async () => {
    const pool = createCalcPool({ size: 1, createClient: () => fakeClient() });
    const outcomes = await pool.map([after(1, 'a'), after(500, 'b'), after(1, 'c')], { budgetMs: 50 });
    expect(outcomes).toEqual([{ kind: 'done', value: 'a' }, { kind: 'cut' }, { kind: 'cut' }]);
    pool.dispose();
  });

  test('a cancel rejects the pass, stops every job and terminates the workers', async () => {
    const made: CalcClient[] = [];
    const pool = createCalcPool({
      size: 2,
      createClient: () => {
        const client = fakeClient();
        made.push(client);
        return client;
      },
    });
    const controller = new AbortController();
    const running = pool.map([after(500, 'a'), after(500, 'b'), after(500, 'c')], {
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(), 10);
    const error: unknown = await running.catch((caught: unknown) => caught);
    expect(isAbortError(error)).toBe(true);
    expect(made).toHaveLength(2);
    for (const client of made) expect(client.dispose).toHaveBeenCalled();
    expect(pool.alive).toBe(0);
    pool.dispose();
  });

  test('runs one client, never an inline pool, when the platform falls back to the main thread', async () => {
    const createClient = vi.fn(() => fakeClient('inline'));
    const pool = createCalcPool({ size: 4, createClient });
    const outcomes = await pool.map([after(1, 1), after(1, 2), after(1, 3)]);
    expect(outcomes.map((outcome) => outcome.kind)).toEqual(['done', 'done', 'done']);
    expect(createClient).toHaveBeenCalledTimes(1);
    pool.dispose();
  });

  test('starts lazily and terminates its workers once idle', async () => {
    vi.useFakeTimers();
    const made: CalcClient[] = [];
    const pool = createCalcPool({
      size: 2,
      idleMs: 1_000,
      createClient: () => {
        const client = fakeClient();
        made.push(client);
        return client;
      },
    });
    expect(pool.alive).toBe(0);
    await pool.map([() => Promise.resolve(1)]);
    expect(pool.alive).toBe(2);
    await vi.advanceTimersByTimeAsync(1_001);
    expect(pool.alive).toBe(0);
    for (const client of made) expect(client.dispose).toHaveBeenCalled();
    pool.dispose();
  });

  test('plans through one worker or three are the plans the engine gives directly', async () => {
    // Inline clients that report a worker, so the pool really runs three lanes.
    const lanes = (): CalcClient => ({ ...createInlineClient(), mode: 'worker' });
    const inputs = [2, 3, 4].map((marchTarget) => ({ request: request(), marchTarget }));
    const jobs = inputs.map(
      (input): PoolJob<unknown> =>
        (client, signal) =>
          client.plan(input, signal),
    );
    const direct = inputs.map((input) => ({ kind: 'done', value: planCampaign(input) }));
    const one = createCalcPool({ size: 1, createClient: lanes });
    const three = createCalcPool({ size: 3, createClient: lanes });
    expect(await one.map(jobs)).toEqual(direct);
    expect(await three.map(jobs)).toEqual(direct);
    one.dispose();
    three.dispose();
  }, 60_000);
});
