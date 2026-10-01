/**
 * **The two reasons the kernel used to hand back to the TypeScript, answered by the kernel** (W16 E3 port).
 *
 * The census (`docs/plans/refactor-speed.md`, "E3 S1 census") found the kernel declining on two player-facing
 * features: a **custom kill order** (`sizeStacks` answered `null` whenever `options.method` was `custom` with a
 * list) and a **training cost reduction or training speed** (`march` and `ladders` answered `null` whenever
 * the recovery they price a march's losses under carried either). Each is held here to the TypeScript it
 * stands in for, on the benchmark armies, with `toStrictEqual`:
 *
 *  - `sizeStacks` under a custom kill order — several orders (the Elite order reversed, hired types listed
 *    before troops, a partial list, monsters first) × the sizer's other options × seeded subsets and caps —
 *    against `sizeStacks` of `stacker.ts`, unit, order and count;
 *  - `march` under a search recovery with training cost reductions, speeds and a temple — the figures
 *    `marchOf` reports, with the losses billed by `retrainOne` under that recovery, stack by stack in kill
 *    order (the bill `marchOf` makes under `SEARCH_RECOVERY`, which this test checks first);
 *  - `ladders` under the same recoveries: a ladder shape's march figures against that same reference;
 *  - **the whole plan** (`planCampaign`) on armies whose own options carry a custom kill order and whose own
 *    recovery carries training reductions and speeds, kernel against TypeScript, with every kernel door
 *    counted: not one declines.
 */
/// <reference types="node" />
import { afterEach, describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import type { UnitDef } from '@/data/types';
import { GROUPS } from '@/data/types';
import { mulberry32 } from '@/engine';
import { enemySquadCount } from '@/engine/battle';
import type { LadderKernel, MarchFigures, PlanKernel } from '@/engine/fast';
import { LADDER_SHAPE, setKernel } from '@/engine/fast';
import { eliteOrder } from '@/engine/killOrder';
import type { CampaignInput, Effective } from '@/engine/plan';
import { DEPTHS, LADDER_GROWTHS, effectiveTable, marchOf, planCampaign, rankTroops } from '@/engine/plan';
import { retrainOne } from '@/engine/recovery';
import { sizeStacks } from '@/engine/stacker';
import type { RecoverySettings, StackRequest, StackingOptions } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';

import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../engine/plan-scenarios';

import { loadKernelModule } from './load';

afterEach(() => setKernel(null));

const module = loadKernelModule();
const profile = ownerProfile();
const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];

const SEARCH_RECOVERY: RecoverySettings = {
  templeLevel: 0,
  trainingCostReduction: {},
  trainingSpeed: {},
  plan: { mode: 'retrain' },
};

/**
 * Realistic account settings (the profile's Recovery sheet: a percent per group, decimals allowed): the
 * discounts the captured runs carried (guardsmen 12.5 %), a research-heavy account, a speed-only one.
 */
const TRAININGS: {
  label: string;
  reduction: RecoverySettings['trainingCostReduction'];
  speed: RecoverySettings['trainingSpeed'];
}[] = [
  { label: 'guardsmen 12.5 %', reduction: { guardsmen: 12.5 }, speed: {} },
  {
    label: 'every group, reductions and speeds',
    reduction: { guardsmen: 12.5, specialist: 12.5, engineers: 8, monster: 10 },
    speed: { guardsmen: 25, specialist: 25, engineers: 20, monster: 40 },
  },
  { label: 'speeds only', reduction: {}, speed: { guardsmen: 50, monster: 15.5 } },
  {
    label: 'odd figures',
    reduction: { guardsmen: 33.3, specialist: 7.25, monster: 2.5 },
    speed: { specialist: 3 },
  },
];

function recoveryOf(training: (typeof TRAININGS)[number], templeLevel = 0): RecoverySettings {
  return {
    templeLevel,
    trainingCostReduction: training.reduction,
    trainingSpeed: training.speed,
    plan: { mode: 'retrain' },
  };
}

/** Custom kill orders over `units`: the list a player builds in the Battle section's editor. */
function customOrders(units: readonly UnitDef[]): { label: string; order: string[] }[] {
  const elite = eliteOrder([...units]).map((unit) => unit.id);
  const hired = units.filter((unit) => unit.pool !== 'leadership').map((unit) => unit.id);
  const troops = units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
  const monsters = units.filter((unit) => unit.pool === 'dominance').map((unit) => unit.id);
  const interleaved: string[] = [];
  for (let i = 0; i < Math.max(hired.length, troops.length); i += 1) {
    if (hired[i] !== undefined) interleaved.push(hired[i] as string);
    if (troops[i] !== undefined) interleaved.push(troops[i] as string);
  }
  return [
    { label: 'Elite reversed', order: [...elite].reverse() },
    { label: 'hired before troops', order: [...hired, ...troops.reverse()] },
    { label: 'interleaved', order: interleaved },
    { label: 'partial', order: elite.filter((_id, i) => i % 3 === 1) },
    { label: 'monsters first', order: [...monsters, 'not-a-unit'] },
  ].filter((custom) => custom.order.length > 0);
}

/** `marchOf`'s figures with the losses billed by `retrainOne` under `recovery`, in kill order. */
function referenceMarch(
  stacks: { entry: Effective; count: number }[],
  enemyStacks: number,
  recovery: RecoverySettings,
): MarchFigures {
  setKernel(null);
  const ts = marchOf(stacks, enemyStacks);
  const unitOf = new Map(stacks.map((stack) => [stack.entry.id, stack.entry.unit]));
  let silver = 0;
  let gold = 0;
  for (const stack of ts.stacks) {
    const unit = unitOf.get(stack.unitId) as UnitDef;
    const one = retrainOne(unit, stack.count, recovery);
    silver += one.silver;
    if (unit.pool !== 'leadership') gold += one.gold;
  }
  return {
    damage: ts.damage,
    hiredDamage: ts.hiredDamage,
    silver,
    gold,
    mercLost: ts.mercLost,
    strikes: ts.strikes,
  };
}

function figuresOf(march: MarchFigures): MarchFigures {
  const { damage, hiredDamage, silver, gold, mercLost, strikes } = march;
  return { damage, hiredDamage, silver, gold, mercLost, strikes };
}

/** Seeded marches over a bound table: a few stacks of every pool, counts within a third of each housing. */
function marches(request: StackRequest, table: Effective[], seed: number, total: number) {
  const random = mulberry32(seed);
  const out: { entry: Effective; count: number }[][] = [];
  while (out.length < total) {
    const march: { entry: Effective; count: number }[] = [];
    for (const entry of table) {
      if (random() < 0.45) continue;
      const room = request.housing[entry.pool] / Math.max(1, entry.cost) / 3;
      march.push({ entry, count: Math.floor(random() * Math.max(1, Math.floor(room))) });
    }
    if (march.length > 0) out.push(march);
  }
  return out;
}

describe('the ported declines', () => {
  it('runs over all 18 benchmark armies where the owner’s export is present', () => {
    if (profile) expect(scenarios.length).toBe(18);
  });

  describe.each(scenarios.map((s, i) => [i, s.label, s.request] as const))(
    'army %i: %s',
    (index, _label, request) => {
      it('sizes a custom kill order exactly as sizeStacks', () => {
        const kernel = createPlanKernel(module);
        const random = mulberry32(0xc0de + index);
        let compared = 0;
        for (const custom of customOrders(request.units)) {
          for (let i = 0; i < 12; i += 1) {
            const units =
              i === 0
                ? request.units
                : request.units.filter((unit) => unit.pool !== 'leadership' || random() < 0.7);
            const caps: Record<string, number> = i % 2 === 0 ? { ...request.caps } : {};
            for (const unit of units)
              if (random() < 0.3)
                caps[unit.id] = Math.floor(random() * (unit.pool === 'leadership' ? 20_000 : 900));
            const options: StackingOptions = {
              ...request.options,
              method: 'custom',
              customOrder: custom.order,
              relaxedPreservation: random() < 0.5,
              roundTo10: random() < 0.3,
              monstersLast: random() < 0.5,
              strictMercsAboveMonsters: random() < 0.5,
            };
            setKernel(null);
            const ts = sizeStacks({ ...request, units, caps, options }).stacks.map((stack) => ({
              unitId: stack.unitId,
              count: stack.count,
            }));
            const fast = kernel.sizeStacks(request, units, caps, options);
            expect(fast, `${custom.label} #${String(i)}`).toStrictEqual(ts);
            compared += 1;
          }
        }
        expect(compared).toBeGreaterThan(0);
      });

      it('marches under training reductions, speeds and a temple exactly as marchOf billed by retrainOne', () => {
        const kernel = createPlanKernel(module);
        const table = effectiveTable(request);
        kernel.bindTable(request, table);
        const enemy = enemySquadCount(request.enemy);
        const all = marches(request, table, 0x7ea + index, 60);
        // The reference is the engine's own bill where the search prices it (`SEARCH_RECOVERY`).
        for (const march of all.slice(0, 10)) {
          setKernel(null);
          const ts = marchOf(march, enemy);
          expect(referenceMarch(march, enemy, SEARCH_RECOVERY)).toStrictEqual(figuresOf(ts));
        }
        for (const [t, training] of TRAININGS.entries()) {
          const recovery = recoveryOf(training, t * 5);
          for (const march of all) {
            const fast = kernel.march(march, enemy, recovery);
            expect(fast, training.label).not.toBeNull();
            expect(figuresOf(fast as MarchFigures), training.label).toStrictEqual(
              referenceMarch(march, enemy, recovery),
            );
          }
        }
        // And back to the search's own recovery on the same instance: nothing of the last one stays.
        for (const march of all.slice(0, 10)) {
          setKernel(null);
          const ts = marchOf(march, enemy);
          expect(kernel.march(march, enemy, SEARCH_RECOVERY)).toStrictEqual(figuresOf(ts));
        }
      });

      it('ladders under training reductions and speeds: every shape’s march as marchOf billed by retrainOne', () => {
        const kernel = createPlanKernel(module);
        const table = effectiveTable(request);
        kernel.bindTable(request, table);
        const troops = rankTroops(table);
        const mercTypes = table.filter((entry) => entry.pool !== 'leadership');
        if (troops.length === 0 || mercTypes.length === 0) return;
        const enemy = enemySquadCount(request.enemy);
        const powers = Array.from({ length: 64 }, (_unused, k) => 1.02 ** k);
        const random = mulberry32(0x1add + index);
        let shapes = 0;
        for (const [t, training] of TRAININGS.entries()) {
          const recovery = recoveryOf(training, t * 7);
          const lk = kernel.ladders(troops, mercTypes, enemy, recovery, powers, DEPTHS, LADDER_GROWTHS);
          expect(lk, training.label).not.toBeNull();
          const ladder = lk as LadderKernel;
          for (let trial = 0; trial < 24; trial += 1) {
            for (let i = 0; i < mercTypes.length; i += 1) {
              const entry = mercTypes[i] as Effective;
              const room = Math.min(
                request.caps[entry.id] ?? 200,
                request.housing[entry.pool] / Math.max(1, entry.cost) / 4,
              );
              const count = random() < 0.4 ? 0 : 1 + Math.floor(random() * Math.max(1, Math.min(200, room)));
              ladder.vector[i] = count;
              ladder.held[i] = count * 10;
            }
            const depth = 1 + Math.floor(random() * Math.min(8, troops.length));
            const order = troops.slice(-depth);
            const scale = LADDER_GROWTHS[Math.floor(random() * LADDER_GROWTHS.length)] as number;
            const status = ladder.shape(
              1,
              depth,
              scale,
              order,
              0.25,
              request.housing.leadership,
              undefined,
              undefined,
            );
            if (status !== LADDER_SHAPE) continue;
            const stacks = [
              ...order.map((entry, r) => ({ entry, count: ladder.rungs[r] as number })),
              ...mercTypes.map((entry, i) => ({ entry, count: ladder.sheltered[i] as number })),
            ];
            const out = ladder.out;
            expect(
              {
                damage: out[0],
                hiredDamage: out[1],
                silver: out[2],
                gold: out[3],
                mercLost: out[4],
                strikes: out[5],
              },
              training.label,
            ).toStrictEqual(referenceMarch(stacks, enemy, recovery));
            shapes += 1;
          }
        }
        expect(shapes).toBeGreaterThan(0);
      });
    },
  );
});

// ---- the whole plan ------------------------------------------------------------------------------------

/** Remove the wall-clock fields (`retype.ms`) wherever they sit (as `plan-equivalence.test.ts` does). */
function stripClock(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripClock);
  if (value === null || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    if (key === 'retype' && inner !== null && typeof inner === 'object') {
      const { ms: _ms, ...rest } = inner as Record<string, unknown>;
      out[key] = stripClock(rest);
    } else out[key] = stripClock(inner);
  }
  return out;
}

function plan(input: CampaignInput): { plan?: unknown; refused?: string } {
  try {
    return { plan: stripClock(planCampaign(input)) };
  } catch (error) {
    return { refused: error instanceof Error ? error.message : String(error) };
  }
}

/** The kernel with every door counted: how often it answers `null` (a decline: the TypeScript answers). */
function counted(kernel: PlanKernel): { kernel: PlanKernel; declines: Record<string, number> } {
  const declines: Record<string, number> = {};
  const note = (door: string, declined: boolean): void => {
    if (declined) declines[door] = (declines[door] ?? 0) + 1;
  };
  const wrapped: PlanKernel = {
    bindTable: (request, table) => kernel.bindTable(request, table),
    march: (stacks, enemy, recovery) => {
      const out = kernel.march(stacks, enemy, recovery);
      note('march', out === null);
      return out;
    },
    bill: (stacks, recovery) => {
      const out = kernel.bill(stacks, recovery);
      note('bill', out === null);
      return out;
    },
    marchBill: (request, counts) => {
      const out = kernel.marchBill(request, counts);
      note('marchBill', out === null);
      return out;
    },
    sizePool: (slots, capacity, ceiling, spread) => {
      const out = kernel.sizePool(slots, capacity, ceiling, spread);
      note('sizePool', out === null);
      return out;
    },
    sizeStacks: (request, units, caps, options) => {
      const out = kernel.sizeStacks(request, units, caps, options);
      note('sizeStacks', out === null);
      return out;
    },
    ladders: (...args) => {
      const out = kernel.ladders(...args);
      note('ladders', out === null);
      return out;
    },
  };
  return { kernel: wrapped, declines };
}

/** The armies the plan is held on: the first two common ones and the owner's first two. */
const planned = [...commonScenarios().slice(0, 2), ...(profile ? ownerScenarios(profile).slice(0, 2) : [])];

const accounts: { label: string; request: (request: StackRequest) => StackRequest }[] = [
  {
    label: 'a custom kill order (Elite reversed)',
    request: (request) => ({
      ...request,
      options: {
        ...request.options,
        method: 'custom',
        customOrder: eliteOrder([...request.units])
          .map((unit) => unit.id)
          .reverse(),
      },
    }),
  },
  {
    label: 'training reductions and speeds on every group',
    request: (request) => ({
      ...request,
      recovery: {
        ...request.recovery,
        trainingCostReduction: { guardsmen: 12.5, specialist: 12.5, engineers: 8, monster: 10 },
        trainingSpeed: Object.fromEntries(GROUPS.map((group, i) => [group, 10 * (i + 1)])),
      },
    }),
  },
  {
    label: 'both, under the selective plan and a temple',
    request: (request) => ({
      ...request,
      options: {
        ...request.options,
        method: 'custom',
        customOrder: request.units.filter((unit) => unit.pool !== 'leadership').map((unit) => unit.id),
      },
      recovery: {
        templeLevel: 15,
        trainingCostReduction: { guardsmen: 33.3, monster: 2.5 },
        trainingSpeed: { specialist: 7.25 },
        plan: { mode: 'selective' },
      },
    }),
  },
];

describe('planCampaign on an account with a custom kill order or training bonuses', () => {
  describe.each(planned.map((s, i) => [i, s.label, s.request] as const))(
    'army %i: %s',
    (_index, _label, base) => {
      it.each(accounts.map((a) => [a.label, a.request] as const))(
        '%s: the kernel answers every door, and the plan is the TypeScript’s',
        (_account, account) => {
          const request = account(base);
          const input: CampaignInput = {
            request,
            marchTarget: HORIZON,
            ...CAMPAIGN.planFixes,
            putBack: CAMPAIGN.putBack,
          };
          setKernel(null);
          const reference = plan(input);
          const { kernel, declines } = counted(createPlanKernel(module));
          setKernel(kernel);
          const fast = plan(input);
          setKernel(null);
          expect(reference.plan ?? reference.refused).toBeDefined();
          expect(fast).toStrictEqual(reference);
          expect(declines).toStrictEqual({});
        },
        600_000,
      );
    },
  );
});
