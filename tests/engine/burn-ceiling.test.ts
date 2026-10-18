/**
 * **The burn ceiling** (`docs/plans/burn-ceiling.md` §3.2/§3.3, the engine half; the owner, 2026-10-18: *"on the
 * silver saver I know I can remove a weak stack like SW1 to put more monsters but this ups the merc burned
 * automatically [...] there should be a way to conserve merc burns"*).
 *
 * Experiment 242 found where the burn climbed (SW1 out of the burn saver: 7 chunks to 17): the re-size's hired caps
 * are the stock's sustained count, and the leadership a take-out hands back raised the floor the sizer then
 * filled. The promises held here:
 *
 *  1. **The cut** (`trimToBurn`): a chunk at a time, from the stack whose chunk costs least, down to the ceiling.
 *  2. **The re-size keeps to a ceiling** (`MarchWithin.burnCap`) on every take-out of every stop of the benchmark
 *     armies — at the stop's own burn (the take-out default, `editBurnCap`) and at half of it — and answers a
 *     legal march: hired stacks under the troop floor, under the caps it was given. A ceiling no march can reach
 *     changes nothing, to the byte.
 *  3. **The raise keeps to it** (`RaiseInput.burnCap`): `Safe` under a ceiling, the kernel's answer and the
 *     TypeScript research copy's (`tools/theorycraft/exact-raise.ts`) the same counts; a ceiling below the
 *     march's own burn trims the march first (`liftedCounts`); a ceiling at the march's own burn is today's
 *     `Tight`, byte for byte, on every march of the raise corpus.
 *  4. **The pool line keeps to it**: the push never opens a chunk past it, and the round never opens one at all.
 *
 * **One test, both paths**: the re-size runs on the plan kernel and again on the declining kernel
 * (`tests/kernel/declining.ts`, the TypeScript the kernel was held to); the raise on the raise kernel and on the
 * research copy. The SW1 case itself is the owner's account and lives in experiment 243.
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import {
  emptyTotals,
  largestSustained,
  planCampaign,
  planMarch,
  planRepeats,
  resizeMarchOver,
  trimToBurn,
} from '@/engine';
import { chunks } from '@/engine/recovery';
import type { PlanKernel } from '@/engine/fast';
import { setKernel } from '@/engine/fast';
import { effectiveTable } from '@/engine/plan';
import type { CampaignPlan, MarchWithin, ResizedMarch } from '@/engine/plan';
import type { StackRequest, StackResult } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';
import { editBurnCap, hiredLost } from '@/ui/sections/march/hired';
import { applyCounts } from '@/ui/sections/march/manual';
import { liftedCounts } from '@/ui/sections/march/positions';
import { burnOf, countsOf, pushedCounts, roundedCounts, troopFloor } from '@/ui/sections/march/raise';
import type { RaiseModes } from '@/ui/sections/march/raise';
import { runRaise } from '@/worker/jobs';

import { exactRaise as researchRaise } from '../../tools/theorycraft/exact-raise';
import { decliningKernel } from '../kernel/declining';
import { loadKernelModule } from '../kernel/load';
import { marchesOf } from '../kernel/seeded-marches';

import { HORIZON, criteriaScenarios } from './plan-scenarios';

const MODULE = loadKernelModule();
const PATHS: readonly [string, () => PlanKernel][] = [
  ['kernel', () => createPlanKernel(MODULE)],
  ['ts', () => decliningKernel(createPlanKernel(MODULE))],
];
/**
 * The armies the re-size and the corpus are walked on: every benchmark army with two hired types or more — the
 * ones a take-out can re-spend a burn on — every stop, every take-out.
 */
const ARMIES = criteriaScenarios().filter(
  (army) => army.request.units.filter((unit) => unit.pool === 'authority').length >= 2,
);

describe('the cut', () => {
  test('one chunk a step, from the stack whose chunk costs least, down to the ceiling', () => {
    // Damage per unit: A 10, B 1, C 5. The odd units of each go first where they are worth least.
    const per: Record<string, number> = { A: 10, B: 1, C: 5 };
    const damage = (counts: Record<string, number>): number =>
      Object.entries(counts).reduce((sum, [id, n]) => sum + n * (per[id] ?? 0), 0);
    const cut = trimToBurn({ A: 23, B: 20, C: 7 }, 4, damage);
    // Burn 3 + 2 + 1 = 6 → 4: B's ten (−10) first; then B's last ten and C's seven would empty a stack, so A's
    // three go (−30) — the set is kept while the ceiling allows one chunk a stack.
    expect(cut).toEqual({ A: 20, B: 10, C: 7 });
    expect(Object.values(cut).reduce((sum, n) => sum + chunks(n), 0)).toBe(4);
    // Under the ceiling: unchanged, and no battle asked.
    let asked = 0;
    const counting = (counts: Record<string, number>): number => ((asked += 1), damage(counts));
    expect(trimToBurn({ A: 23 }, 3, counting)).toEqual({ A: 23 });
    expect(asked).toBe(0);
    // Below one chunk a stack, a stack goes home only once no other has a chunk to spare; a ceiling of nothing empties the stock.
    expect(trimToBurn({ A: 23, B: 20, C: 7 }, 2, damage)).toEqual({ A: 10, B: 0, C: 7 });
    expect(trimToBurn({ A: 23, C: 7 }, 0, damage)).toEqual({ A: 0, C: 0 });
  });
});

/** The app's own plan of an army (`plan-resize.test.ts`' own call). */
function planFor(request: StackRequest): CampaignPlan | null {
  try {
    return planCampaign({ request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack });
  } catch {
    return null;
  }
}

/** `planStopAgain`'s own arguments for a take-out (`generate.ts`'s `capOf`, verbatim). */
function takeOut(
  request: StackRequest,
  stop: CampaignPlan['alternatives'][number],
  out: string,
): { within: MarchWithin; included: Set<string> } {
  const repeats = planRepeats(stop);
  const included = new Set(Object.keys(stop.counts).filter((id) => (stop.counts[id] ?? 0) > 0 && id !== out));
  const troopIds: string[] = [];
  const hired: Record<string, number> = {};
  for (const unit of request.units) {
    if (!included.has(unit.id)) continue;
    if (unit.pool === 'leadership') {
      troopIds.push(unit.id);
      continue;
    }
    const held = request.caps[unit.id];
    hired[unit.id] =
      unit.pool === 'dominance'
        ? Math.max(stop.counts[unit.id] ?? 0, Math.floor(request.housing.dominance / Math.max(1, unit.cost)))
        : held === undefined
          ? Math.floor(request.housing.authority / Math.max(1, unit.cost))
          : largestSustained(held, repeats);
  }
  return {
    within: { troopIds, hired, stop: stop.counts, fills: CAMPAIGN.editFills, putBack: CAMPAIGN.putBack },
    included,
  };
}

/** The answer is a march the game takes: every hired stack under the troop floor, and under the cap it was given. */
function expectLegal(request: StackRequest, within: MarchWithin, answer: ResizedMarch): void {
  const byId = new Map(effectiveTable(request).map((entry) => [entry.id, entry]));
  let floor = Infinity;
  let top = 0;
  for (const [id, count] of Object.entries(answer.counts)) {
    if (count <= 0) continue;
    const entry = byId.get(id);
    if (entry === undefined) continue;
    if (entry.pool === 'leadership') floor = Math.min(floor, count * entry.hp);
    else {
      top = Math.max(top, count * entry.hp);
      expect(count).toBeLessThanOrEqual(within.hired[id] ?? 0);
    }
  }
  expect(top).toBeLessThan(floor);
}

for (const [path, kernel] of PATHS) {
  describe(`the re-size keeps to the ceiling (${path})`, () => {
    beforeAll(() => {
      setKernel(kernel());
    });
    afterAll(() => {
      setKernel(createPlanKernel(MODULE));
    });

    for (const army of ARMIES) {
      test(
        army.label,
        () => {
          const plan = planFor(army.request);
          if (plan === null) return;
          for (const stop of plan.alternatives) {
            const fielded = Object.keys(stop.counts).filter((id) => (stop.counts[id] ?? 0) > 0);
            const own = hiredLost(
              army.request.units.map((unit) => ({ pool: unit.pool, count: stop.counts[unit.id] ?? 0 })),
            );
            for (const out of fielded) {
              const { within, included } = takeOut(army.request, stop, out);
              if (within.troopIds.length === 0) continue;
              const where = `${stop.pick} without ${out}`;
              // The take-out default is the stop's own burn.
              expect(editBurnCap(army.request, stop.counts, included), where).toBe(own);
              for (const burnCap of [own, Math.floor(own / 2)]) {
                const answer = resizeMarchOver(army.request, { ...within, burnCap });
                if (answer === null) continue;
                expect(answer.mercLost, `${where} under ${String(burnCap)}`).toBeLessThanOrEqual(burnCap);
                expectLegal(army.request, within, answer);
              }
              // A ceiling no march reaches is no ceiling at all.
              expect(resizeMarchOver(army.request, { ...within, burnCap: 1e9 }), where).toEqual(
                resizeMarchOver(army.request, within),
              );
            }
          }
        },
        600_000,
      );
    }
  });
}

describe('the take-out default', () => {
  test('the stop’s own burn on a take-out, nothing on a mercenary put back, and the player’s ceiling over both', () => {
    const units = [
      { id: 'T', pool: 'leadership' as const },
      { id: 'M', pool: 'authority' as const },
      { id: 'N', pool: 'authority' as const },
      { id: 'D', pool: 'dominance' as const },
    ];
    const request = { units } as unknown as StackRequest;
    const stop = { T: 100, M: 23, D: 4 };
    // A take-out: the stop burns ⌈23/10⌉ = 3.
    expect(editBurnCap(request, stop, new Set(['T', 'D']))).toBe(3);
    // A monster put back keeps the cap; a mercenary put back is a request to spend.
    expect(editBurnCap(request, stop, new Set(['T', 'M', 'D']))).toBe(3);
    expect(editBurnCap(request, stop, new Set(['T', 'M', 'N', 'D']))).toBeUndefined();
    // The player's ceiling wins, whatever the edit.
    expect(editBurnCap(request, stop, new Set(['T', 'M', 'N', 'D']), 1)).toBe(1);
  });
});

/** The raise's fixture (`src/ui/sections/march/raise.test.ts`): two troop stacks, hunters and a monster. */
const UNITS = getUnits();
const RD1 = 'rider-1';
const RD3 = 'rider-3';
const HUNTER = 'epic-monster-hunter-6';
const MONSTER = 'ancient-terror';
const HOUSING = { leadership: 100_000, authority: 100_000, dominance: 100_000 };
function request(): StackRequest {
  return {
    units: UNITS,
    caps: {},
    housing: HOUSING,
    totals: emptyTotals(),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { flying: 1, melee: 1, ranged: 1, mounted: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
}
const marchAt = (hunters: number): StackResult =>
  planMarch(request(), { [RD3]: 8_000, [RD1]: 6_000, [HUNTER]: hunters, [MONSTER]: 1 }).result;
const SAFE: RaiseModes = { authority: 'safe', dominance: 'safe' };
const TIGHT: RaiseModes = { authority: 'tight', dominance: 'tight' };

describe('the raise keeps to the ceiling', () => {
  test('Safe under a ceiling: the kernel and the TypeScript research copy answer the same counts', () => {
    const base = marchAt(5);
    // The kernel answers dense (every type of the request) and the research copy over its slots: read both as
    // the march they field.
    const whole = (counts: Record<string, number>): Record<string, number> =>
      Object.fromEntries(Object.entries({ ...countsOf(base), ...counts }).filter(([, n]) => n > 0));
    const plain = runRaise({ request: request(), base, modes: SAFE });
    expect(plain).not.toBeNull();
    // The fixture's Safe burns more than the march's own chunk, so a ceiling at 2 binds.
    expect(burnOf(base, whole(plain?.counts ?? {}))).toBeGreaterThan(2);
    for (const burnCap of [1, 2, 3]) {
      const kernel = runRaise({ request: request(), base, modes: SAFE, burnCap });
      const ts = researchRaise(request(), base, SAFE, undefined, burnCap);
      expect(kernel, `cap ${String(burnCap)}`).not.toBeNull();
      expect(burnOf(base, whole(kernel?.counts ?? {})), `kernel, cap ${String(burnCap)}`).toBeLessThanOrEqual(
        burnCap,
      );
      expect(burnOf(base, whole(ts?.counts ?? {})), `ts, cap ${String(burnCap)}`).toBeLessThanOrEqual(
        burnCap,
      );
      expect(whole(kernel?.counts ?? {}), `cap ${String(burnCap)}`).toEqual(whole(ts?.counts ?? {}));
    }
  });

  test('a ceiling below the march’s own burn trims the march, and the answer is a legal march', () => {
    const base = marchAt(95); // ten chunks
    expect(burnOf(base, countsOf(base))).toBe(10);
    const floor = troopFloor(base) ?? 0;
    for (const modes of [SAFE, TIGHT]) {
      for (const burnCap of [7, 3, 0]) {
        const lifted = liftedCounts(request(), base, modes, burnCap);
        expect(lifted).not.toBeNull();
        const counts = { ...countsOf(base), ...lifted?.counts };
        expect(burnOf(base, counts)).toBeLessThanOrEqual(burnCap);
        const after = applyCounts(request(), base, counts).result;
        for (const stack of after.stacks) {
          if (stack.pool !== 'leadership' && stack.count > 0) expect(stack.totalHp).toBeLessThan(floor);
        }
      }
    }
  });

  test('a ceiling at the march’s own burn is today’s Tight, byte for byte, on every march of the corpus', () => {
    for (const army of ARMIES) {
      for (const { name, request: asked, base } of marchesOf(army.request)) {
        if (troopFloor(base) === null) continue;
        const own = burnOf(base, countsOf(base));
        expect(liftedCounts(asked, base, TIGHT, own), `${army.label}: ${name}`).toEqual(
          liftedCounts(asked, base, TIGHT),
        );
      }
    }
  }, 600_000);
});

describe('the pool line keeps to the ceiling', () => {
  test('the push opens no chunk past the ceiling, and fills the chunks already burnt', () => {
    const base = marchAt(5);
    const start = applyCounts(request(), base, {}).result;
    const free = pushedCounts(request(), start, ['authority']);
    expect(burnOf(start, { ...countsOf(start), ...free })).toBeGreaterThan(1);
    // At the march's own burn the push may fill its one chunk and no more.
    const held = pushedCounts(request(), start, ['authority'], 1);
    expect(held).toEqual({ [HUNTER]: 10 });
    for (const burnCap of [2, 3]) {
      const pushed = pushedCounts(request(), start, ['authority', 'dominance'], burnCap);
      expect(burnOf(start, { ...countsOf(start), ...pushed })).toBeLessThanOrEqual(burnCap);
    }
  });

  test('the round never burns a chunk more, on any march of the corpus', () => {
    for (const army of ARMIES) {
      for (const { request: asked, base } of marchesOf(army.request)) {
        const start = applyCounts(asked, base, {}).result;
        const moves = roundedCounts(asked, base, start, countsOf(start), 'authority');
        if (moves === null) continue;
        expect(burnOf(start, { ...countsOf(start), ...moves })).toBeLessThanOrEqual(
          burnOf(start, countsOf(start)),
        );
      }
    }
  }, 600_000);
});
