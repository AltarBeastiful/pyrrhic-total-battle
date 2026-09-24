/**
 * **The plan kernel's doors, each `Object.is` to the TypeScript it stands in for** (AssemblyScript roadmap,
 * step 2; `src/kernel/plan.ts`, `src/engine/fast.ts`).
 *
 * On every benchmark army, under every recovery plan:
 *
 *  - `march` against `marchOf` — every bar march and a few thousand seeded random ones (ties in total HP, hired
 *    stacks above troops, single stacks), each **in several stack orders** (a tie the rank does not break
 *    falls by the caller's order), every figure compared;
 *  - `bill` against `recoveryCosts(...).plan` over the same stacks in the same orders;
 *  - `marchBill` (the re-typing's battle and bill) against the engine's, on the same marches;
 *  - `sizePool` through `sizeStacks` — the whole `StackResult`, deep-equal — under both sizer methods,
 *    relaxed or not, in tens or not, monsters last, strict mercenaries above monsters, with seeded caps.
 *
 * And the fallbacks: entries no bound table built, entries from two tables, and a recovery that is not the
 * bound request's are all answered `null`, so the engine runs its TypeScript.
 */
/// <reference types="node" />
import { afterEach, describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { mulberry32 } from '@/engine';
import { enemySquadCount } from '@/engine/battle';
import { setKernel } from '@/engine/fast';
import type { Effective } from '@/engine/plan';
import { effectiveTable, marchOf, planCampaign } from '@/engine/plan';
import type { PlanTotals } from '@/engine/plan';
import { recoveryCosts } from '@/engine/recovery';
import { marchBill } from '@/engine/retype';
import { sizeStacks } from '@/engine/stacker';
import type { RecoverySettings, Stack, StackRequest } from '@/engine/types';
import { UNIT_FAMILIES } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';

import { marchesOf } from '../engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../engine/plan-scenarios';

import { loadKernelModule } from './load';

const RANDOM_PER_ARMY = 1_500;
const ORDERS = 3;
const SEARCH_RECOVERY: RecoverySettings = {
  templeLevel: 0,
  trainingCostReduction: {},
  trainingSpeed: {},
  plan: { mode: 'retrain' },
};

afterEach(() => setKernel(null));

type Fielded = { entry: Effective; count: number }[];

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Seeded marches within housing, with ties in total HP and hired stacks above troops. */
function randomMarches(request: StackRequest, table: Effective[], seed: number, total: number): Fielded[] {
  const random = mulberry32(seed);
  const int = (max: number): number => Math.floor(random() * (max + 1));
  const capOf = (id: string): number => request.caps[id] ?? Infinity;
  const out: Fielded[] = [[]];
  while (out.length < total) {
    const kind = out.length % 4;
    const march: Fielded = [];
    if (kind === 0 && table.length > 0) {
      const entry = table[int(table.length - 1)] as Effective;
      march.push({ entry, count: 1 + int(Math.min(capOf(entry.id), 5_000)) });
    } else if (kind === 1 && table.length >= 2) {
      // Two types at one total HP, the rest around them.
      const a = table[int(table.length - 1)] as Effective;
      const b = table[int(table.length - 1)] as Effective;
      if (a !== b) {
        const m = 1 + int(4);
        march.push({ entry: a, count: b.hp * m }, { entry: b, count: a.hp * m });
      }
      for (const entry of table) {
        if (entry === a || entry === b || random() < 0.6) continue;
        march.push({ entry, count: int(Math.min(capOf(entry.id), 3_000)) });
      }
    } else {
      for (const entry of table) {
        if (random() < 0.4) continue;
        const room = request.housing[entry.pool] / Math.max(1, entry.cost) / 3;
        march.push({ entry, count: int(Math.min(capOf(entry.id), Math.max(1, Math.floor(room)))) });
      }
    }
    out.push(march);
  }
  return out;
}

function barMarches(request: StackRequest, table: Effective[]): Fielded[] {
  let plan;
  try {
    plan = planCampaign({ request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack });
  } catch {
    return [];
  }
  const byId = new Map(table.map((entry) => [entry.id, entry]));
  const out: Fielded[] = [];
  for (const row of [plan, ...plan.alternatives] as PlanTotals[]) {
    for (const counts of marchesOf(row)) {
      out.push(
        Object.entries(counts)
          .filter(([id]) => byId.has(id))
          .map(([id, count]) => ({ entry: byId.get(id) as Effective, count })),
      );
    }
  }
  return out;
}

function recoveryVariants(request: StackRequest, seed: number): StackRequest[] {
  const pick = mulberry32(seed);
  const families = UNIT_FAMILIES.filter(() => pick() < 0.5);
  const withPlan = (plan: RecoverySettings['plan']): StackRequest => ({
    ...request,
    recovery: { ...request.recovery, plan },
  });
  return [
    request,
    withPlan({ mode: 'retrain' }),
    withPlan({ mode: 'revive' }),
    withPlan({ mode: 'selective' }),
    withPlan({ mode: 'selective', reviveFamilies: families }),
  ];
}

const figures = (m: ReturnType<typeof marchOf>): number[] => [
  m.damage,
  m.hiredDamage,
  m.silver,
  m.gold,
  m.mercLost,
  m.strikes,
];

const profile = ownerProfile();
const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];

describe('the plan kernel', () => {
  describe.each(scenarios.map((s, i) => [i, s.label, s.request] as const))(
    'army %i: %s',
    (index, _label, base) => {
      it('answers marchOf and the plan bill exactly, in every stack order, under every recovery plan', () => {
        const kernel = createPlanKernel(loadKernelModule());
        const mismatches: string[] = [];
        const note = (text: string): void => {
          if (mismatches.length < 10) mismatches.push(text);
        };
        let compared = 0;
        recoveryVariants(base, 0xfa + index).forEach((request, variant) => {
          const table = effectiveTable(request);
          kernel.bindTable(request, table);
          const enemy = enemySquadCount(request.enemy);
          const random = mulberry32(0x0dd + index * 7 + variant);
          const marches = [
            ...(variant === 0 ? barMarches(request, table) : []),
            ...randomMarches(request, table, 0x5eed + index * 13 + variant, RANDOM_PER_ARMY),
          ];
          for (const march of marches) {
            // `marchBill` (the re-typing's battle): the kernel's step-1 record against the engine's.
            const counts = Object.fromEntries(march.map((s) => [s.entry.id, s.count]));
            const tsBill = marchBill(request, counts);
            const fastBill = kernel.marchBill(request, counts);
            if (
              !fastBill ||
              JSON.stringify(Object.entries(tsBill)) !== JSON.stringify(Object.entries(fastBill)) ||
              Object.keys(tsBill).some(
                (key) =>
                  !Object.is(tsBill[key as keyof typeof tsBill], fastBill[key as keyof typeof fastBill]),
              )
            )
              note(
                `marchBill ${String(variant)} ${JSON.stringify(counts)}: ts ${JSON.stringify(tsBill)} kernel ${JSON.stringify(fastBill)}`,
              );
            for (let o = 0; o < ORDERS; o += 1) {
              const stacks = o === 0 ? march : shuffled(march, random);
              if (stacks.length === 0) {
                // Nothing to lay: the kernel declines and the engine answers (its figures are all 0).
                expect(kernel.march(stacks, enemy, SEARCH_RECOVERY)).toBeNull();
                expect(kernel.bill(stacks, request.recovery)).toBeNull();
                continue;
              }
              compared += 1;
              if (variant === 0) {
                const ts = figures(marchOf(stacks, enemy));
                const fast = kernel.march(stacks, enemy, SEARCH_RECOVERY);
                const got = fast ? figures({ ...fast, stacks: [] }) : null;
                if (!got || ts.some((v, i) => !Object.is(v, got[i])))
                  note(
                    `march ${JSON.stringify(stacks.map((s) => [s.entry.id, s.count]))}: ts ${String(ts)} kernel ${String(got)}`,
                  );
              }
              const fielded = stacks.filter((s) => s.count > 0);
              if (fielded.length === 0) {
                expect(kernel.bill(fielded, request.recovery)).toBeNull();
                continue;
              }
              const ts = recoveryCosts(
                fielded.map((s) => ({ unitId: s.entry.unit.id, count: s.count }) as Stack),
                fielded.map((s) => s.entry.unit),
                request.recovery,
              ).plan;
              const got = kernel.bill(fielded, request.recovery);
              if (
                !got ||
                !Object.is(ts.silver, got.silver) ||
                !Object.is(ts.gold, got.gold) ||
                !Object.is(ts.dragonCoins, got.dragonCoins) ||
                !Object.is(ts.seconds, got.seconds)
              )
                note(
                  `bill ${String(variant)} ${JSON.stringify(fielded.map((s) => [s.entry.id, s.count]))}: ts ${JSON.stringify(ts)} kernel ${JSON.stringify(got)}`,
                );
            }
          }
        });
        expect(mismatches).toEqual([]);
        expect(compared).toBeGreaterThan(RANDOM_PER_ARMY);
      }, 600_000);

      it('sizes every pool exactly as the engine does', () => {
        const random = mulberry32(0x512e + index);
        const requests: StackRequest[] = [];
        for (const method of ['ms', 'elite'] as const) {
          for (const flags of [0, 1, 2, 3, 4, 5, 6, 7]) {
            const caps: Record<string, number> = { ...base.caps };
            if (flags & 4)
              for (const u of base.units) if (random() < 0.4) caps[u.id] = Math.floor(random() * 400);
            requests.push({
              ...base,
              caps,
              options: {
                ...base.options,
                method,
                relaxedPreservation: (flags & 1) !== 0,
                roundTo10: (flags & 2) !== 0,
                monstersLast: random() < 0.5,
                strictMercsAboveMonsters: random() < 0.5,
              },
            });
          }
        }
        // A handful of the plan's own shapes: a subset of the troops, the hired capped at a random stock.
        for (let i = 0; i < 12; i += 1) {
          const caps: Record<string, number> = { ...base.caps };
          for (const u of base.units) if (u.pool !== 'leadership') caps[u.id] = Math.floor(random() * 600);
          requests.push({
            ...base,
            caps,
            units: base.units.filter((u) => u.pool !== 'leadership' || random() < 0.7),
            options: {
              ...base.options,
              method: i % 3 === 0 ? 'elite' : 'ms',
              relaxedPreservation: i % 3 === 2,
            },
          });
        }
        const kernel = createPlanKernel(loadKernelModule());
        for (const request of requests) {
          setKernel(null);
          const ts = sizeStacks(request);
          setKernel(kernel);
          const fast = sizeStacks(request);
          setKernel(null);
          expect(fast).toEqual(ts);
        }
      }, 600_000);
    },
  );

  it('answers null where it cannot answer for the engine', () => {
    const kernel = createPlanKernel(loadKernelModule());
    const request = scenarios[0]?.request as StackRequest;
    const unbound = effectiveTable(request);
    const stacks = unbound.slice(0, 3).map((entry) => ({ entry, count: 10 }));
    expect(kernel.march(stacks, 1, SEARCH_RECOVERY)).toBeNull();
    const table = effectiveTable(request);
    kernel.bindTable(request, table);
    const bound = table.slice(0, 3).map((entry) => ({ entry, count: 10 }));
    expect(kernel.march(bound, 1, SEARCH_RECOVERY)).not.toBeNull();
    // Two tables in one march.
    expect(kernel.march([...bound.slice(0, 2), ...stacks.slice(2)], 1, SEARCH_RECOVERY)).toBeNull();
    // A recovery that is not the bound request's.
    expect(kernel.bill(bound, { ...request.recovery })).toBeNull();
    expect(kernel.bill(bound, request.recovery)).not.toBeNull();
    // A search recovery with a reduction.
    expect(
      kernel.march(bound, 1, {
        ...SEARCH_RECOVERY,
        trainingCostReduction: { infantry: 5 },
      } as RecoverySettings),
    ).toBeNull();
  });
});
