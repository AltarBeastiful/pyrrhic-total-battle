/**
 * B-24 — **the talent analysis job** (`runTalentAnalysis`), on the kernel: one screen per pool shape, each rank's
 * own sizing rated against rank 0, merged by position so the lane count never moves an answer.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { emptyTotals } from '@/engine';
import type { BonusTotals, StackRequest } from '@/engine/types';

import { abortError, createInlineClient } from './client';
import type { CalcClient } from './client';
import { createCalcPool } from './pool';
import { runTalentAnalysis } from './talentAnalysis';

/** The planner's small army (`captains.test.ts`): four troop types and three hired soldiers with a stock. */
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

function withArmy(points: number): BonusTotals {
  const totals = emptyTotals();
  totals.health.army = points;
  totals.strength.army = points;
  return totals;
}

const ranks = [0, 5, 10, 20].map((rank) => ({ rank, totals: withArmy(rank * 4) }));

function poolOf(size: number, wrap?: (client: CalcClient) => Partial<CalcClient>) {
  return createCalcPool({
    size,
    createClient: (): CalcClient => {
      const inline = createInlineClient();
      return { ...inline, mode: 'worker', ...wrap?.(inline) };
    },
  });
}

describe('runTalentAnalysis', () => {
  test('rates each rank against rank 0, which rates 0, and a stronger army never rates lower', async () => {
    const pool = poolOf(1);
    const analysis = await runTalentAnalysis({ request: request(), ranks }, pool);
    pool.dispose();
    expect(analysis.ranks).toEqual([0, 5, 10, 20]);
    expect(analysis.shapes.map((shape) => shape.fill)).toEqual(CAMPAIGN.talentFills);
    for (const shape of analysis.shapes) {
      expect(shape.gains).toHaveLength(4);
      expect(shape.gains[0]).toBe(0);
      expect(shape.gains[1]!).toBeGreaterThan(0);
      for (let i = 1; i < 4; i++) expect(shape.gains[i]!).toBeGreaterThanOrEqual(shape.gains[i - 1]!);
    }
  });

  test('the mean is the plain mean of the shapes at each rank', async () => {
    const pool = poolOf(1);
    const analysis = await runTalentAnalysis({ request: request(), ranks }, pool);
    pool.dispose();
    const [a, b] = analysis.shapes;
    for (let i = 0; i < 4; i++) {
      expect(analysis.mean[i]).toBeCloseTo((a!.gains[i]! + b!.gains[i]!) / 2, 10);
    }
  });

  test('the smaller pool is priced on a smaller army, not the same one twice', async () => {
    const pool = poolOf(1);
    const analysis = await runTalentAnalysis({ request: request(), ranks }, pool);
    pool.dispose();
    const [full, small] = analysis.shapes;
    expect(small!.gains[3]).not.toBe(full!.gains[3]);
  });

  test('one lane and three lanes give the same answer', async () => {
    const one = poolOf(1);
    const three = poolOf(3);
    const a = await runTalentAnalysis({ request: request(), ranks }, one);
    const b = await runTalentAnalysis({ request: request(), ranks }, three);
    one.dispose();
    three.dispose();
    expect(b).toEqual(a);
  });

  test('a cancelled analysis rejects with an abort error', async () => {
    const pool = poolOf(1, () => ({
      captains: (_input, signal) =>
        new Promise((_, reject) => {
          signal?.addEventListener('abort', () => reject(abortError()), { once: true });
        }),
    }));
    const controller = new AbortController();
    const running = runTalentAnalysis({ request: request(), ranks }, pool, { signal: controller.signal });
    controller.abort();
    await expect(running).rejects.toMatchObject({ name: 'AbortError' });
    pool.dispose();
  });

  test('reports a settled job at a time out of the shapes it runs', async () => {
    const pool = poolOf(1);
    const seen: [number, number][] = [];
    await runTalentAnalysis({ request: request(), ranks }, pool, {
      onProgress: (done, total) => seen.push([done, total]),
    });
    pool.dispose();
    expect(seen.at(-1)).toEqual([2, 2]);
  });

  test('a baseline above 0 is the 0 % row, and the rows above it never rate lower', async () => {
    const pool = poolOf(1);
    const above = [8, 20, 40].map((rank) => ({ rank, totals: withArmy(rank * 4) }));
    const analysis = await runTalentAnalysis({ request: request(), baseline: 8, ranks: above }, pool);
    pool.dispose();
    expect(analysis.ranks).toEqual([8, 20, 40]);
    for (const shape of analysis.shapes) {
      expect(shape.gains[0]).toBe(0);
      expect(shape.gains[1]!).toBeGreaterThan(0);
      expect(shape.gains[2]!).toBeGreaterThanOrEqual(shape.gains[1]!);
    }
  });

  test('a first row that is not the baseline is refused', async () => {
    const pool = poolOf(1);
    await expect(runTalentAnalysis({ request: request(), baseline: 3, ranks }, pool)).rejects.toThrow();
    pool.dispose();
  });
});
