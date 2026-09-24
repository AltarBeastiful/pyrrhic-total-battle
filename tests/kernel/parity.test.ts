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
import { effectiveTable, marchResult, planCampaign } from '@/engine/plan';
import type { PlanTotals } from '@/engine/plan';
import type { Bill } from '@/engine/rating';
import { rate } from '@/engine/rating';
import { marchBill } from '@/engine/retype';
import type { RecoverySettings, StackRequest } from '@/engine/types';
import { UNIT_FAMILIES } from '@/engine/types';
import { ALL_COSTS, createKernel, expectedLayout, POOL_BITS, R, RECORD_SIZE } from '@/kernel';
import type { Enumeration, EnumerationSpec, Kernel } from '@/kernel';

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

/**
 * `Kernel.enumerate` (experiment 175) against the same walk in TypeScript: the same assignments in the same
 * order, sized, capped and housed the same way, battled by `marchBill` and rated by `rate` — every count and
 * every best `Object.is`.
 */
function enumerateReference(
  request: StackRequest,
  ids: readonly string[],
  spec: EnumerationSpec,
): Enumeration {
  const table = effectiveTable(request);
  const byId = new Map(table.map((entry) => [entry.id, entry]));
  const rows = ids.map((id) => byId.get(id) as (typeof table)[number]);
  const k = spec.slots.length;
  const m = spec.candidates.length;
  const housing = request.housing;
  const counts = Array.from(ids, (_, t) => spec.fixed[t] ?? 0);
  const used = { leadership: 0, authority: 0, dominance: 0 };
  rows.forEach((row, t) => (used[row.pool] += (counts[t] ?? 0) * row.cost));
  const bits = {
    leadership: POOL_BITS.leadership,
    authority: POOL_BITS.authority,
    dominance: POOL_BITS.dominance,
  };
  const base: Bill = { damage: spec.base[R.minDamage] as number };
  COSTS.forEach((cost, c) => (base[cost] = spec.base[1 + c] as number));
  const out: Enumeration = {
    battles: 0,
    complete: true,
    admissible: 0,
    positive: 0,
    best: { rating: -Infinity, assignment: Array.from({ length: k }, () => -1) },
    guarded: { rating: -Infinity, assignment: Array.from({ length: k }, () => -1) },
    damage: { damage: -Infinity, assignment: Array.from({ length: k }, () => -1) },
  };
  const max = spec.maxBattles ?? Infinity;
  const maxNodes = max * 16;
  let nodes = 0;
  const lastFit = spec.candidates.map((t) => {
    const row = rows[t] as (typeof table)[number];
    let last = -1;
    spec.slots.forEach((hp, slot) => {
      if (Math.ceil(hp / row.hp) <= (spec.caps?.[t] ?? Infinity)) last = slot;
    });
    return last;
  });
  const firstFit = spec.candidates.map((t) => {
    const row = rows[t] as (typeof table)[number];
    const first = spec.slots.findIndex((hp) => Math.ceil(hp / row.hp) <= (spec.caps?.[t] ?? Infinity));
    return first < 0 ? k : first;
  });
  const descending = spec.slots.every((hp, slot) => slot === 0 || hp <= (spec.slots[slot - 1] as number));
  const open = (c: number): boolean => spec.required?.[c] === true && !inUse[c];
  const hallFails = (slot: number): boolean =>
    descending &&
    spec.candidates.some((_, c) => {
      if (!open(c)) return false;
      const from = firstFit[c] as number;
      const need = spec.candidates.filter((__, d) => open(d) && (firstFit[d] as number) >= from).length;
      return need > k - Math.max(from, slot);
    });
  const inUse = new Array<boolean>(m).fill(false);
  const assign = new Array<number>(k).fill(-1);
  let abort = false;
  const leaf = (): void => {
    if (out.battles >= max) {
      abort = true;
      return;
    }
    out.battles += 1;
    const march = Object.fromEntries(ids.map((id, t) => [id, counts[t] ?? 0]));
    const bill = marchBill(request, march);
    if (bill.damage > out.damage.damage) out.damage = { damage: bill.damage, assignment: [...assign] };
    if (bill.damage < base.damage - 1e-6) return;
    out.admissible += 1;
    const score = rate(base, bill, RATES);
    if (score > 1e-9) out.positive += 1;
    if (score > out.best.rating) out.best = { rating: score, assignment: [...assign] };
    if ((bill.silver ?? 0) <= (base.silver ?? 0) && score > out.guarded.rating)
      out.guarded = { rating: score, assignment: [...assign] };
  };
  const walk = (slot: number, unplaced: number): void => {
    if (abort) return;
    if (slot === k) {
      if (unplaced === 0) leaf();
      return;
    }
    if (nodes >= maxNodes) {
      abort = true;
      return;
    }
    nodes += 1;
    if (
      unplaced > 0 &&
      (spec.candidates.some((_, c) => open(c) && (lastFit[c] as number) < slot) || hallFails(slot))
    )
      return;
    for (let c = 0; c < m; c += 1) {
      if (inUse[c]) continue;
      const left = unplaced - (spec.required?.[c] === true ? 1 : 0);
      if (left > k - slot - 1) continue;
      const t = spec.candidates[c] as number;
      const row = rows[t] as (typeof table)[number];
      const count = Math.ceil((spec.slots[slot] as number) / row.hp);
      if (count > (spec.caps?.[t] ?? Infinity)) continue;
      const add = count * row.cost;
      if ((spec.pools & bits[row.pool]) !== 0 && used[row.pool] + add > housing[row.pool]) continue;
      used[row.pool] += add;
      inUse[c] = true;
      assign[slot] = c;
      counts[t] = count;
      walk(slot + 1, left);
      counts[t] = 0;
      inUse[c] = false;
      used[row.pool] -= add;
      if (abort) return;
    }
  };
  const required = spec.required?.filter((r) => r).length ?? 0;
  if (k > 0) walk(0, required);
  out.complete = !abort;
  return out;
}

describe('the kernel’s enumeration', () => {
  it.each(scenarios.map((s, i) => [i, s.label, s.request] as const))(
    'walks every assignment of army %i (%s) exactly as TypeScript does',
    (_index, _label, request) => {
      const kernel = createKernel(loadKernelModule(), request, RATES);
      const table = effectiveTable(request);
      const march = planMarches(request)[0];
      if (!march) return;
      const stacks = marchResult(request, march).result.stacks;
      const troops = stacks.filter((s) => s.pool === 'leadership');
      const hired = stacks.filter((s) => s.pool !== 'leadership');
      const row = (id: string): number => kernel.ids.indexOf(id);
      const base = kernel.battle(march);
      const specs: EnumerationSpec[] = [];
      // The re-typing space on the three biggest troop slots, the other stacks fixed.
      const top = troops.slice(0, 3);
      const fixed = new Float64Array(kernel.types);
      for (const s of stacks) if (!top.includes(s)) fixed[row(s.unitId)] = s.count;
      const free = table
        .map((entry, t) => ({ entry, t }))
        .filter(({ entry, t }) => entry.pool === 'leadership' && fixed[t] === 0)
        .map(({ t }) => t);
      specs.push({
        slots: top.map((s) => s.totalHp),
        candidates: free,
        fixed,
        pools: POOL_BITS.leadership,
        base,
      });
      specs.push({ ...(specs[0] as EnumerationSpec), maxBattles: 17 });
      // Hired stacks placed too, required, capped by stock, every pool housed.
      if (hired.length > 0 && hired.length <= 3) {
        const low = troops.slice(0, 2);
        const fixed3 = new Float64Array(kernel.types);
        for (const s of troops) if (!low.includes(s)) fixed3[row(s.unitId)] = s.count;
        const hiredRows = hired.map((s) => row(s.unitId));
        const free3 = table
          .map((entry, t) => ({ entry, t }))
          .filter(({ entry, t }) => entry.pool === 'leadership' && fixed3[t] === 0)
          .map(({ t }) => t);
        const caps = Float64Array.from(kernel.ids, (id) => request.caps[id] ?? Infinity);
        specs.push({
          slots: [...low, ...hired].map((s) => s.totalHp),
          candidates: [...hiredRows, ...free3],
          required: [...hiredRows.map(() => true), ...free3.map(() => false)],
          fixed: fixed3,
          caps,
          pools: POOL_BITS.leadership | POOL_BITS.authority | POOL_BITS.dominance,
          base,
        });
      }
      for (const spec of specs) {
        const expected = enumerateReference(request, kernel.ids, spec);
        const actual = kernel.enumerate(spec);
        expect(actual).toEqual(expected);
        expect(Object.is(actual.best.rating, expected.best.rating)).toBe(true);
        expect(Object.is(actual.guarded.rating, expected.guarded.rating)).toBe(true);
        expect(expected.battles).toBeGreaterThan(0);
      }
    },
    600_000,
  );
});
