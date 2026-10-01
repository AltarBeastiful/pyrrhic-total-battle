/**
 * **The five raise positions keep their promises** (S-147), on the kernel — the only path that computes them
 * since W16 E3 S5b retired the March's TypeScript search. `tests/kernel/raise-kernel.test.ts` holds the
 * kernel's *answers* to that TypeScript's testimony (`tests/golden/raise-kernel.json`); this file holds them to
 * the promises, so a defect that a golden capture would have baked in is still a failure here.
 *
 * The promises are the ones the control makes and the ones `docs/plans/best-v2.md` §5 lists, measured on
 * every benchmark army from the sizer's own march and three seeded ones:
 *
 *   1. **Every raised stack is sheltered and legal** — under `min(shelter ceiling, owned stock)`, with no
 *      pool over its housing, and the whole march still under the troop floor (a position that left a hired
 *      stack at or above it would be the one thing the control exists to prevent).
 *   2. **A damage position never loses damage** — `Best v2` and `Safe` are at least the climb they are seeded
 *      with, `Tight` at least the plan's own march, and all three at least the plan's own march.
 *   3. **A capped position keeps its cap** — `Safe` burns no more authority chunks than the climb, `Tight` not
 *      more than the plan's own counts (not one extra chunk).
 *   4. **`Most` fields the most units** — no other position fields more than it does.
 *
 * `tools/theorycraft/180-the-positions.test.ts` asserts the same list over the whole corpus, every stop of
 * every plan; this file is the same gate the suite runs, on marches that cost milliseconds.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { mulberry32 } from '@/engine';
import { setRaiseKernel } from '@/engine/fast';
import { marchResult } from '@/engine/plan';
import { sizeStacks } from '@/engine/stacker';
import type { StackRequest, StackResult } from '@/engine/types';
import { createRaiseKernel } from '@/kernel/raise';
import { applyCounts } from '@/ui/sections/march/manual';
import { positionTrades } from '@/ui/sections/march/positions';
import type { PositionTrade } from '@/ui/sections/march/positions';
import { burnOf, countsOf, raisedCounts, shelterCeiling, troopFloor } from '@/ui/sections/march/raise';

import { loadKernelModule } from '../kernel/load';

import { criteriaScenarios } from './plan-scenarios';

const SEEDED = 3;

beforeAll(() => {
  setRaiseKernel(createRaiseKernel(loadKernelModule()));
});
afterAll(() => {
  setRaiseKernel(null);
});

/**
 * The plan's own lowering (`shelterUnder`), applied to a march: every hired stack capped at
 * `min(shelter ceiling, owned stock)`. The positions are offered on a **plan's** march — one the plan sized
 * to the shelter — so a fixture that is not sheltered would be measuring a march the control is never drawn
 * on, and every ceiling it keeps would look broken on it.
 */
function sheltered(request: StackRequest, result: StackResult): Record<string, number> {
  const counts = countsOf(result);
  const floor = troopFloor(result);
  if (floor === null) return counts;
  for (const stack of result.stacks) {
    if (stack.pool === 'leadership') continue;
    const ceiling = Math.min(
      shelterCeiling(floor, stack.hpPerUnit),
      request.caps[stack.unitId] ?? Number.MAX_SAFE_INTEGER,
    );
    counts[stack.unitId] = Math.min(counts[stack.unitId] ?? 0, ceiling);
  }
  return counts;
}

/** Seeded marches within housing, so a position has something to move on most armies. */
function seeded(request: StackRequest, own: Record<string, number>, total: number): Record<string, number>[] {
  const random = mulberry32(0x5eed_147);
  const int = (max: number): number => Math.floor(random() * (max + 1));
  const out: Record<string, number>[] = [own];
  while (out.length < total) {
    const counts: Record<string, number> = {};
    for (const unit of request.units) {
      if (random() < 0.3) continue;
      const room = request.housing[unit.pool] / Math.max(1, unit.cost) / Math.max(2, request.units.length);
      const cap = request.caps[unit.id] ?? Math.max(1, Math.floor(room));
      const count = int(Math.min(cap, Math.max(1, Math.ceil(room / 2))));
      if (count > 0) counts[unit.id] = count;
    }
    out.push(counts);
  }
  return out;
}

describe('the raise positions', () => {
  describe.each(criteriaScenarios().map((scenario) => [scenario.label, scenario.request] as const))(
    'army %s',
    (_label, request) => {
      const own = sizeStacks(request);
      const bases: StackResult[] = [
        marchResult(request, sheltered(request, own)).result,
        ...seeded(request, countsOf(own), SEEDED + 1)
          .slice(1)
          .map(
            (counts) => marchResult(request, sheltered(request, marchResult(request, counts).result)).result,
          ),
      ];

      it('keeps every promise on every march, for every position', () => {
        const broken: string[] = [];
        let priced = 0;
        for (const base of bases) {
          const floor = troopFloor(base);
          const plan = countsOf(base);
          const climb = raisedCounts(request, base, { authority: 'v2', dominance: 'v2' });
          const climbed = { ...plan, ...climb };
          const climbBurn = burnOf(base, climbed);
          const planBurn = burnOf(base, plan);
          const ownDamage = applyCounts(request, base, plan).summary.minDamage;
          const climbDamage = applyCounts(request, base, climbed).summary.minDamage;

          const { rows } = positionTrades(request, base);
          expect(rows.map((row) => row.mode)).toEqual(['tens', 'most', 'v2', 'safe', 'tight']);
          const byMode = new Map(rows.map((row) => [row.mode, row]));
          const most = byMode.get('most') as PositionTrade;

          for (const row of rows) {
            priced += 1;
            const counts = { ...plan, ...row.counts };
            // 1. Legal and sheltered: the ceiling, the stock, the housing, and the floor the whole control
            //    exists to keep.
            for (const [unitId, count] of Object.entries(row.counts)) {
              const stack = base.stacks.find((one) => one.unitId === unitId);
              const unit = request.units.find((one) => one.id === unitId);
              // The shelter is the **hired** stacks' bound: the troops are what shelters, never what is
              // sheltered (`raise.ts`'s own two pools).
              if (stack === undefined || unit === undefined || unit.pool === 'leadership') continue;
              const ceiling = Math.min(
                floor === null ? 0 : shelterCeiling(floor, stack.hpPerUnit),
                request.caps[unitId] ?? Number.MAX_SAFE_INTEGER,
              );
              if (count > ceiling) broken.push(`${row.mode}: ${unitId} over its ceiling`);
              if (count < stack.count) broken.push(`${row.mode}: ${unitId} below the plan's own count`);
            }
            const used = { authority: 0, dominance: 0 };
            for (const unit of request.units) {
              if (unit.pool === 'leadership') continue;
              used[unit.pool] += (counts[unit.id] ?? 0) * unit.cost;
            }
            if (used.authority > request.housing.authority || used.dominance > request.housing.dominance) {
              broken.push(`${row.mode}: a pool over its housing`);
            }
            const result = applyCounts(request, base, counts).result.stacks.filter(
              (stack) => stack.pool !== 'leadership' && stack.count > 0,
            );
            if (floor !== null) {
              for (const stack of result) {
                if (stack.totalHp >= floor) broken.push(`${row.mode}: ${stack.unitId} at or over the floor`);
              }
            }

            // 2. The damage promises.
            if (row.mode !== 'tens' && row.mode !== 'most' && row.damage < ownDamage) {
              broken.push(`${row.mode} lost the plan's own damage`);
            }
            if ((row.mode === 'v2' || row.mode === 'safe') && row.damage < climbDamage) {
              broken.push(`${row.mode} came out below the climb`);
            }
            // 3. The caps.
            if (row.mode === 'safe' && row.mercLost > climbBurn) broken.push('safe burnt past the climb');
            if (row.mode === 'tight' && row.mercLost > planBurn) broken.push('tight burnt past the plan');
            // 4. `Most` is the units answer.
            if (row.mode !== 'most' && row.units > most.units) broken.push(`${row.mode} fielded past most`);
          }
        }
        expect(priced).toBeGreaterThan(0);
        expect(broken, broken.join('\n')).toEqual([]);
      }, 600_000);
    },
  );
});
