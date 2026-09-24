/**
 * **The kernel's gate: every output `===` the TypeScript engine** (AssemblyScript roadmap, step 1).
 *
 * On every benchmark army (`commonScenarios` + `ownerScenarios`, the set experiments 169–174 plan on), every
 * march on the plan's bar (`planCampaign` with no `budgetMs`, as 169 plans, so no deadline makes a march depend
 * on the machine) plus a few thousand seeded random count vectors — within housing, hired stacks above troop
 * stacks, ties in total HP, single stacks, the empty march — are battled by both, and every field of the
 * kernel's record is compared with `Object.is` against `marchResult(request, counts)` and `marchBill`. `rate`
 * is compared the same way, on full bills and on bills with costs left out. Exact equality: nothing here is
 * `toBeCloseTo`.
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { mulberry32 } from '@/engine';
import { marchResult, planCampaign } from '@/engine/plan';
import type { PlanTotals } from '@/engine/plan';
import type { Bill } from '@/engine/rating';
import { rate } from '@/engine/rating';
import { marchBill } from '@/engine/retype';
import type { RecoverySettings, StackRequest } from '@/engine/types';
import { UNIT_FAMILIES } from '@/engine/types';
import { ALL_COSTS, createKernel, expectedLayout, R, RECORD_SIZE } from '@/kernel';
import type { Kernel } from '@/kernel';

import { marchesOf } from '../engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../engine/plan-scenarios';

import { loadKernelModule } from './load';

const RATES = CAMPAIGN.markerRates;
const RANDOM_PER_ARMY = 3_000;
const COSTS = ['silver', 'gold', 'hired', 'dragonCoins', 'seconds'] as const;

/** The TS reference, in the record's own slots. */
function reference(request: StackRequest, counts: Record<string, number>): Float64Array {
  const { result, summary } = marchResult(request, counts);
  const bill = marchBill(request, counts);
  const out = new Float64Array(RECORD_SIZE);
  out[R.minDamage] = summary.minDamage;
  out[R.silver] = summary.recovery.silver;
  out[R.gold] = summary.recovery.gold;
  out[R.hired] = bill.hired ?? NaN;
  out[R.dragonCoins] = summary.recovery.dragonCoins;
  out[R.seconds] = summary.recovery.seconds;
  out[R.maxDamage] = summary.maxDamage;
  out[R.avgDamage] = summary.avgDamage;
  out[R.leadershipUsed] = result.pools.leadership.used;
  out[R.authorityUsed] = result.pools.authority.used;
  out[R.dominanceUsed] = result.pools.dominance.used;
  out[R.damagePerSilver] = summary.damagePerSilver;
  out[R.damagePerGold] = summary.damagePerGold;
  out[R.damagePerDragonCoin] = summary.damagePerDragonCoin;
  out[R.stackCount] = summary.stackCount;
  // The bill `marchBill` returns must be the record's first six slots.
  if (
    bill.damage !== summary.minDamage ||
    bill.silver !== summary.recovery.silver ||
    bill.gold !== summary.recovery.gold ||
    bill.dragonCoins !== summary.recovery.dragonCoins ||
    bill.seconds !== summary.recovery.seconds
  )
    throw new Error('marchBill and marchResult disagree');
  return out;
}

const SLOT_NAMES = Object.fromEntries(Object.entries(R).map(([name, slot]) => [slot, name]));

function diff(expected: Float64Array, actual: ArrayLike<number>): string[] {
  const out: string[] = [];
  for (const slot of Object.values(R)) {
    if (!Object.is(expected[slot], actual[slot]))
      out.push(`${SLOT_NAMES[slot] ?? slot}: ts ${String(expected[slot])} kernel ${String(actual[slot])}`);
  }
  return out;
}

/** Seeded count vectors within housing, with the shapes a battle is hardest on. */
function randomMarches(request: StackRequest, seed: number, total: number): Record<string, number>[] {
  const random = mulberry32(seed);
  const int = (max: number): number => Math.floor(random() * (max + 1));
  const units = request.units;
  const housing = request.housing;
  const troops = units.filter((u) => u.pool === 'leadership');
  const hired = units.filter((u) => u.pool !== 'leadership');
  const hpOf = (() => {
    const { result } = marchResult(request, Object.fromEntries(units.map((u) => [u.id, 1])));
    return new Map(result.stacks.map((s) => [s.unitId, s.hpPerUnit]));
  })();
  const capOf = (id: string): number => request.caps[id] ?? Infinity;
  const fits = (counts: Record<string, number>): boolean => {
    const used = { leadership: 0, authority: 0, dominance: 0 };
    for (const u of units) {
      const c = counts[u.id] ?? 0;
      if (c > capOf(u.id)) return false;
      used[u.pool] += c * u.cost;
    }
    return (
      used.leadership <= housing.leadership &&
      used.authority <= housing.authority &&
      used.dominance <= housing.dominance
    );
  };
  /** Fill a pool with a random subset of its types, a random share of the room each. */
  const fill = (counts: Record<string, number>, pool: typeof units, room: number, share: number): void => {
    let left = room;
    const picked = pool.filter(() => random() < share);
    for (const u of picked.sort(() => random() - 0.5)) {
      const most = Math.min(capOf(u.id), Math.floor(left / Math.max(1, u.cost)));
      if (most <= 0) continue;
      const c = random() < 0.2 ? most : int(most);
      counts[u.id] = c;
      left -= c * u.cost;
    }
  };
  const out: Record<string, number>[] = [{}];
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  while (out.length < total) {
    const kind = out.length % 6;
    const counts: Record<string, number> = {};
    if (kind === 0 && units.length > 0) {
      // A single stack.
      const u = units[int(units.length - 1)];
      if (u) counts[u.id] = 1 + int(Math.min(capOf(u.id), Math.floor(housing[u.pool] / Math.max(1, u.cost))));
    } else if (kind === 1) {
      // Hired stacks as big as their room allows, troops thin: hired above troops in the kill order.
      fill(counts, troops, housing.leadership * (0.05 + 0.2 * random()), 0.5);
      for (const u of hired) {
        if (random() < 0.5) continue;
        counts[u.id] = Math.min(capOf(u.id), Math.floor(housing[u.pool] / Math.max(1, u.cost) / 2));
      }
    } else if (kind === 2 && units.length >= 2) {
      // A tie in total HP between two types (then the rest filled around it).
      const a = units[int(units.length - 1)];
      const b = units[int(units.length - 1)];
      const ha = a ? hpOf.get(a.id) : undefined;
      const hb = b ? hpOf.get(b.id) : undefined;
      if (a && b && a !== b && ha && hb) {
        const g = gcd(ha, hb);
        const m = 1 + int(4);
        counts[a.id] = (hb / g) * m;
        counts[b.id] = (ha / g) * m;
        fill(
          counts,
          troops.filter((u) => u !== a && u !== b),
          housing.leadership / 3,
          0.3,
        );
      }
    } else if (kind === 3) {
      // Several troop types at the same count: ties in total HP among same-HP types, and in attack base.
      const c = 1 + int(Math.max(1, Math.floor(housing.leadership / Math.max(1, troops.length * 4))));
      for (const u of troops) if (random() < 0.6) counts[u.id] = c;
    } else {
      fill(counts, troops, housing.leadership, 0.4 + 0.5 * random());
      fill(
        counts,
        hired.filter((u) => u.pool === 'authority'),
        housing.authority,
        0.5,
      );
      fill(
        counts,
        hired.filter((u) => u.pool === 'dominance'),
        housing.dominance,
        0.5,
      );
    }
    if (fits(counts)) out.push(counts);
  }
  return out;
}

function planMarches(request: StackRequest): Record<string, number>[] {
  let plan;
  try {
    plan = planCampaign({ request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack });
  } catch {
    return [];
  }
  const out: Record<string, number>[] = [];
  const seen = new Set<string>();
  for (const row of [plan, ...plan.alternatives] as PlanTotals[]) {
    for (const march of marchesOf(row)) {
      const key = JSON.stringify(Object.entries(march).sort());
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(march);
    }
  }
  return out;
}

interface Shapes {
  /** Marches with two stacks at one total HP (the kill rank decides). */
  hpTies: number;
  /** Marches with two stacks at one attack base (the kill order decides). */
  baseTies: number;
  /** Marches where a hired stack dies before some troop stack. */
  hiredAbove: number;
  single: number;
  empty: number;
}

function shapesOf(request: StackRequest, marches: Record<string, number>[]): Shapes {
  const shapes: Shapes = { hpTies: 0, baseTies: 0, hiredAbove: 0, single: 0, empty: 0 };
  for (const counts of marches) {
    const stacks = marchResult(request, counts).result.stacks;
    const hp = stacks.map((s) => s.totalHp);
    const base = stacks.map((s) => s.count * s.strengthPerUnit);
    if (new Set(hp).size < hp.length) shapes.hpTies += 1;
    if (new Set(base).size < base.length) shapes.baseTies += 1;
    const lastTroop = stacks.map((s) => s.pool).lastIndexOf('leadership');
    if (stacks.some((s, i) => s.pool !== 'leadership' && i < lastTroop)) shapes.hiredAbove += 1;
    if (stacks.length === 1) shapes.single += 1;
    if (stacks.length === 0) shapes.empty += 1;
  }
  return shapes;
}

/** Battle `marches` through the kernel and the engine; every difference, at most ten, as text. */
function compare(
  request: StackRequest,
  marches: Record<string, number>[],
  bar: number,
  seed: number,
): string[] {
  const kernel: Kernel = createKernel(loadKernelModule(), request, RATES);
  const mismatches: string[] = [];
  const note = (text: string): void => {
    if (mismatches.length < 10) mismatches.push(text);
  };
  const references: Float64Array[] = [];
  const batch = new Float64Array(marches.length * kernel.types);
  marches.forEach((counts, m) => {
    const expected = reference(request, counts);
    references.push(expected);
    const d = diff(expected, kernel.battle(counts));
    if (d.length > 0) note(`${m < bar ? 'bar' : 'random'} ${JSON.stringify(counts)} — ${d.join('; ')}`);
    kernel.ids.forEach((id, t) => (batch[m * kernel.types + t] = counts[id] ?? 0));
  });
  // The batch reads the same as one battle at a time.
  const records = kernel.battleMany(batch);
  marches.forEach((counts, m) => {
    const d = diff(references[m] as Float64Array, records.subarray(m * RECORD_SIZE, (m + 1) * RECORD_SIZE));
    if (d.length > 0) note(`battleMany ${JSON.stringify(counts)} — ${d.join('; ')}`);
  });
  // `rate`, on consecutive pairs: every cost, then a random subset left out (absent on a bill).
  const pick = mulberry32(seed);
  const billOf = (rec: Float64Array, mask: number): Bill => {
    const bill: Bill = { damage: rec[R.minDamage] as number };
    COSTS.forEach((cost, c) => {
      if (mask & (1 << c)) bill[cost] = rec[1 + c] as number;
    });
    return bill;
  };
  for (let m = 1; m < references.length; m += 1) {
    const before = references[m - 1] as Float64Array;
    const after = references[m] as Float64Array;
    for (const mask of [ALL_COSTS, Math.floor(pick() * 32)]) {
      const ts = rate(billOf(before, mask), billOf(after, mask), RATES);
      const wasm = kernel.rate(before, after, mask);
      if (!Object.is(ts, wasm)) note(`rate mask ${String(mask)}: ts ${String(ts)} kernel ${String(wasm)}`);
    }
  }
  return mismatches;
}

/** The same army under each recovery plan, the selective one reviving a seeded subset of the families. */
function recoveryVariants(request: StackRequest, seed: number): { label: string; request: StackRequest }[] {
  const pick = mulberry32(seed);
  const families = UNIT_FAMILIES.filter(() => pick() < 0.5);
  const withPlan = (plan: RecoverySettings['plan']): StackRequest => ({
    ...request,
    recovery: { ...request.recovery, plan },
  });
  return [
    { label: 'retrain', request: withPlan({ mode: 'retrain' }) },
    { label: 'revive', request: withPlan({ mode: 'revive' }) },
    { label: 'selective, every family', request: withPlan({ mode: 'selective' }) },
    {
      label: `selective, ${families.join('+') || 'no family'}`,
      request: withPlan({ mode: 'selective', reviveFamilies: families }),
    },
  ];
}

const profile = ownerProfile();
const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
const total: Shapes & { marches: number } = {
  marches: 0,
  hpTies: 0,
  baseTies: 0,
  hiredAbove: 0,
  single: 0,
  empty: 0,
};

describe('the kernel', () => {
  it('is built with the layout src/kernel/layout.ts documents', () => {
    const kernel = createKernel(loadKernelModule(), scenarios[0]?.request as StackRequest, RATES);
    expect(kernel.layout()).toEqual(expectedLayout());
  });

  describe.each(scenarios.map((s, i) => [i, s.label, s.request] as const))(
    'army %i: %s',
    (index, _label, request) => {
      const bar = planMarches(request);
      const random = randomMarches(request, 0x5eed + index, RANDOM_PER_ARMY);

      it('battles every bar march and every random march exactly as the engine does, and rates them the same', () => {
        const marches = [...bar, ...random];
        expect(compare(request, marches, bar.length, 0xbeef + index)).toEqual([]);
        const shapes = shapesOf(request, marches);
        total.marches += marches.length;
        for (const key of Object.keys(shapes) as (keyof Shapes)[]) total[key] += shapes[key];
        process.stderr.write(
          `kernel parity, army ${String(index)}: ${String(bar.length)} bar + ${String(random.length)} random — ${JSON.stringify(shapes)}\n`,
        );
      }, 600_000);

      it('reads every recovery plan the same', () => {
        const marches = [...bar, ...random.slice(0, 500)];
        for (const variant of recoveryVariants(request, 0xfa + index)) {
          expect(compare(variant.request, marches, bar.length, 0xcafe + index), variant.label).toEqual([]);
        }
      }, 600_000);
    },
  );

  it('covered the shapes a battle is hardest on', () => {
    process.stderr.write(`kernel parity, all armies: ${JSON.stringify(total)}\n`);
    if (total.marches === 0) return; // filtered to one test
    expect(total.hpTies).toBeGreaterThan(0);
    expect(total.baseTies).toBeGreaterThan(0);
    expect(total.hiredAbove).toBeGreaterThan(0);
    expect(total.single).toBeGreaterThan(0);
    expect(total.empty).toBeGreaterThan(0);
  });
});
