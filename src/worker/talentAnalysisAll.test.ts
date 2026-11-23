/**
 * B-28 — **Analyze all, the job** (`runAllTalentsAnalysis`): every talent priced exactly as the single Analyze
 * prices it, one job per talent and pool shape, merged by position. **One test, both paths**: run on the plan
 * kernel and again on the declining kernel (the TypeScript the kernel is held to).
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { getUnits } from '@/data';
import { emptyTotals } from '@/engine';
import { setKernel } from '@/engine/fast';
import type { PlanKernel } from '@/engine/fast';
import type { BonusTotals, StackRequest } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';

import { decliningKernel } from '../../tests/kernel/declining';
import { loadKernelModule } from '../../tests/kernel/load';
import { abortError, createInlineClient } from './client';
import type { CalcClient } from './client';
import { createCalcPool } from './pool';
import { runAllTalentsAnalysis, runTalentAnalysis } from './talentAnalysis';
import type { TalentAnalysis, TalentAnalysisInput } from './talentAnalysis';

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

function totalsOf(line: 'strength' | 'health', points: number): BonusTotals {
  const totals = emptyTotals();
  totals[line].army = points;
  return totals;
}

/** Three talents: a strength one, a health one, and one that adds nothing (flat zero). */
function inputs(): TalentAnalysisInput[] {
  const ranksOf = (make: (rank: number) => BonusTotals) =>
    [0, 5, 10, 20].map((rank) => ({ rank, totals: make(rank) }));
  return [
    { request: request(), ranks: ranksOf((r) => totalsOf('strength', r * 4)) },
    { request: request(), ranks: ranksOf((r) => totalsOf('health', r * 3)) },
    { request: request(), ranks: ranksOf(() => emptyTotals()) },
  ];
}

function poolOf(size: number, wrap?: (client: CalcClient) => Partial<CalcClient>) {
  return createCalcPool({
    size,
    createClient: (): CalcClient => {
      const inline = createInlineClient();
      return { ...inline, mode: 'worker', ...wrap?.(inline) };
    },
  });
}

const KERNEL = createPlanKernel(loadKernelModule());
const PATHS: [string, PlanKernel][] = [
  ['kernel', KERNEL],
  ['TypeScript', decliningKernel(KERNEL)],
];

describe.each(PATHS)('Analyze all, %s path', (_name, kernel) => {
  beforeAll(() => {
    setKernel(kernel);
  });
  afterAll(() => {
    setKernel(KERNEL);
  });

  test('each talent matches the single Analyze of the same talent, to the digit', async () => {
    const pool = poolOf(1);
    const all = await runAllTalentsAnalysis(inputs(), pool);
    const single: TalentAnalysis[] = [];
    for (const input of inputs()) single.push(await runTalentAnalysis(input, pool));
    pool.dispose();
    expect(all).toEqual(single);
    expect(all[2]!.mean.every((gain) => gain === 0)).toBe(true);
    expect(all[0]!.mean.at(-1)!).toBeGreaterThan(0);
  });

  test('one lane and three lanes give the same answer', async () => {
    const one = poolOf(1);
    const three = poolOf(3);
    const a = await runAllTalentsAnalysis(inputs(), one);
    const b = await runAllTalentsAnalysis(inputs(), three);
    one.dispose();
    three.dispose();
    expect(b).toEqual(a);
  });

  test('progress counts every talent and shape, ending at the whole', async () => {
    const pool = poolOf(1);
    const seen: [number, number][] = [];
    await runAllTalentsAnalysis(inputs(), pool, { onProgress: (done, total) => seen.push([done, total]) });
    pool.dispose();
    expect(seen.at(-1)).toEqual([6, 6]);
    expect(seen.map(([done]) => done)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('a cancelled run rejects and returns no partial ranking', async () => {
    const pool = poolOf(1, () => ({
      captains: (_input, signal) =>
        new Promise((_, reject) => {
          signal?.addEventListener('abort', () => reject(abortError()), { once: true });
        }),
    }));
    const controller = new AbortController();
    const running = runAllTalentsAnalysis(inputs(), pool, { signal: controller.signal });
    controller.abort();
    await expect(running).rejects.toMatchObject({ name: 'AbortError' });
    pool.dispose();
  });

  test('a fixed reading keeps the baseline counts: a talent that adds nothing is 0, a bonus gains, and it is lane-independent', async () => {
    const fixed = inputs().map((input) => ({ ...input, reading: 'fixed' as const }));
    const one = poolOf(1);
    const three = poolOf(3);
    const a = await runAllTalentsAnalysis(fixed, one);
    const b = await runAllTalentsAnalysis(fixed, three);
    one.dispose();
    three.dispose();
    expect(b).toEqual(a);
    expect(a[2]!.mean.every((gain) => gain === 0)).toBe(true);
    expect(a[0]!.mean.at(-1)!).toBeGreaterThan(0);
    // The screen is asked to re-price the baseline's own counts (one stop), not to re-size.
    const stops: number[] = [];
    const spy = poolOf(1, (inline) => ({
      captains: (input, signal) => {
        stops.push(input.stops.length);
        if (input.stops.length > 0) expect(Object.keys(input.stops[0]!.counts).length).toBeGreaterThan(0);
        return inline.captains(input, signal);
      },
    }));
    await runAllTalentsAnalysis(fixed, spy);
    const sized: number[] = stops.splice(0);
    await runAllTalentsAnalysis(inputs(), spy);
    spy.dispose();
    expect(sized.every((n) => n === 1)).toBe(true);
    expect(stops.every((n) => n === 0)).toBe(true);
  });
});
