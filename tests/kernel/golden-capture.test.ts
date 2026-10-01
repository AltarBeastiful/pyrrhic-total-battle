/**
 * **The non-regression floor for the day the TypeScript engine is gone** (E3 S0, `docs/plans/refactor-speed.md`
 * §4 round 2). Every other kernel-vs-TS test in this repo needs both paths alive to mean anything; this one does
 * not — it is the TS path's testimony, taken once and kept, so the kernel can be held to it after the testimony
 * is retired.
 *
 * `CAPTURE=1 pnpm vitest run tests/kernel/golden-capture.test.ts` runs **both** paths the way `plan-equivalence`,
 * `benchmark-equivalence` and experiment 184 did — `setKernel`/`setRaiseKernel` toggled around the same calls;
 * since W16 E3 S5c the plan's "TS path" is the kernel declining every door (`./declining.ts`) — asserts they agree, and writes the kernel's own answer (the two are equal, so either would do) to
 * `tests/golden/*.json`:
 *
 *  - `plans.json` — `plan-equivalence`'s 18 benchmark armies × its four variants, unbudgeted (no `budgetMs`, so
 *    no machine's clock can move a march), wall-clock fields stripped.
 *  - `raise.json` — experiment 184's own setup (`criteriaScenarios()`, the app's own `planCampaign` call,
 *    `positionTrades` per stop): every stop of every army, its five positions' `counts`, `how`, `space` and
 *    `scored` (the figures the port promises and the ones a press reads, S-149). Since W16 E3 S5b retired the
 *    TypeScript raise, a capture writes this one from the kernel alone.
 *  - `sizepool.json` — `pool-bisection`'s seeded generator (same seed, a smaller sample), each trial's pool and
 *    the bisection's answer.
 *
 * Without `CAPTURE`, the same file is the fast check: one `planCampaign`/`positionTrades`/`sizePool` call per
 * golden entry, **on the kernel alone**, compared to the stored answer. No TS path runs here in that mode — this
 * is meant to become the main non-regression test once the TS engine is gone (E3), so it does not lean on it.
 */
/// <reference types="node" />
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { mulberry32, planCampaign, planMarch } from '@/engine';
import { setKernel, setRaiseKernel } from '@/engine/fast';
import type { CampaignInput, CampaignPlan } from '@/engine/plan';
import { RANK_SPREAD } from '@/engine/stacker';
import type { StackRequest } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';
import { createRaiseKernel } from '@/kernel/raise';
import { positionTrades } from '@/ui/sections/march/positions';
import type { PositionTrade } from '@/ui/sections/march/positions';
import { countsOf } from '@/ui/sections/march/raise';

import {
  HORIZON,
  commonScenarios,
  criteriaScenarios,
  ownerProfile,
  ownerScenarios,
} from '../engine/plan-scenarios';

import { decliningKernel } from './declining';
import { loadKernelModule } from './load';

/** The engine with every kernel door declined: the TypeScript reference (`./declining.ts`). */
const DECLINING = decliningKernel();

const CAPTURE = process.env.CAPTURE === '1';

const GOLDEN_DIR = fileURLToPath(new URL('../golden/', import.meta.url));

function goldenFile(name: string): string {
  return `${GOLDEN_DIR}${name}`;
}

/** `JSON.stringify` turns `Infinity`/`-Infinity`/`NaN` into `null`; the seeded pools use all three. */
function encodeNumber(value: number): unknown {
  if (Number.isFinite(value)) return value;
  if (Number.isNaN(value)) return { $num: 'NaN' };
  return { $num: value > 0 ? 'Infinity' : '-Infinity' };
}

function decodeNumber(value: Record<string, unknown>): number {
  return value.$num === 'NaN' ? NaN : value.$num === 'Infinity' ? Infinity : -Infinity;
}

/** Every object's keys sorted, recursively — array order is data and stays; the JSON text is then stable. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === 'number') return encodeNumber(value);
  if (value === null || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    out[key] = canonical((value as Record<string, unknown>)[key]);
  }
  return out;
}

/** The other half of `canonical`'s number encoding, on the way back in. */
function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value === null || typeof value !== 'object') return value;
  const obj = value as Record<string, unknown>;
  if (typeof obj.$num === 'string' && Object.keys(obj).length === 1) return decodeNumber(obj);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) out[key] = decode(obj[key]);
  return out;
}

function readGolden<T>(name: string): T {
  return decode(JSON.parse(readFileSync(goldenFile(name), 'utf8'))) as T;
}

/** Writes the golden file and reports its size, in the gate's own words. */
function writeGolden(name: string, data: unknown): void {
  mkdirSync(GOLDEN_DIR, { recursive: true });
  const text = `${JSON.stringify(canonical(data), null, 1)}\n`;
  writeFileSync(goldenFile(name), text);
  // eslint-disable-next-line no-console -- the gate's report, run by hand under CAPTURE=1
  console.log(`${name}: ${String(Buffer.byteLength(text, 'utf8'))} bytes`);
}

const kernel = createPlanKernel(loadKernelModule());
const raiseKernel = createRaiseKernel(loadKernelModule());

afterEach(() => {
  setKernel(DECLINING);
  setRaiseKernel(null);
});

// ---- plans.json: plan-equivalence's own corpus -------------------------------------------------------------

/** The same four variants `tests/kernel/plan-equivalence.test.ts` holds the kernel to, unbudgeted. */
const planVariants: { label: string; input: (request: StackRequest) => CampaignInput }[] = [
  {
    label: 'the benchmark’s plan',
    input: (request) => ({ request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack }),
  },
  { label: 'the bare engine', input: (request) => ({ request, marchTarget: HORIZON }) },
  {
    label: 'one march',
    input: (request) => ({ request, marchTarget: 1, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack }),
  },
  {
    label: 'selective recovery',
    input: (request) => ({
      request: { ...request, recovery: { ...request.recovery, plan: { mode: 'selective' } } },
      marchTarget: HORIZON,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    }),
  },
];

/** Remove the wall-clock fields (`retype.ms`) wherever they sit — `plan-equivalence`'s own `stripClock`. */
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
    return { plan: stripClock(planCampaign(input) satisfies CampaignPlan) };
  } catch (error) {
    return { refused: error instanceof Error ? error.message : String(error) };
  }
}

interface PlanEntry {
  army: string;
  variant: string;
  result: { plan?: unknown; refused?: string };
}

const profile = ownerProfile();
const planScenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];

function buildPlans(onKernel: boolean): PlanEntry[] {
  const entries: PlanEntry[] = [];
  for (const scenario of planScenarios) {
    for (const variant of planVariants) {
      setKernel(onKernel ? kernel : DECLINING);
      entries.push({
        army: scenario.label,
        variant: variant.label,
        result: plan(variant.input(scenario.request)),
      });
      setKernel(DECLINING);
    }
  }
  return entries;
}

// ---- raise.json: experiment 184's own setup -----------------------------------------------------------------

interface RaiseRow {
  mode: PositionTrade['mode'];
  counts: Record<string, number>;
  how: 'walked' | 'searched' | null;
  space: number;
  scored: number;
}

interface RaiseEntry {
  army: string;
  stop: string;
  rows: RaiseRow[];
}

/**
 * The counts a march really stands at, as a map over every unit the request carries — experiment 184's own
 * `effective`. The TS path's `.counts` is a sparse delta over the raised pools, the kernel's is dense over
 * every hired type (`RaiseAnswer.counts`'s own doc in `src/engine/fast.ts`): the two are the same march read
 * two shapes, and this is the shape they agree on.
 */
function effective(request: StackRequest, own: Record<string, number>, counts: Record<string, number>) {
  const merged = { ...own, ...counts };
  return Object.fromEntries(request.units.map((unit) => [unit.id, merged[unit.id] ?? 0]));
}

function toRow(request: StackRequest, own: Record<string, number>, row: PositionTrade): RaiseRow {
  return {
    mode: row.mode,
    counts: effective(request, own, row.counts),
    how: row.how,
    space: row.space,
    scored: row.scored,
  };
}

/** Every stop of every benchmark army, the app's own plan call (experiment 184's), positions read off it. */
function buildRaise(): RaiseEntry[] {
  // The plan under every row is the kernel's too: since S5a the TypeScript sizer is gone, and the golden was
  // captured with both paths answering the same plan.
  setKernel(kernel);
  const entries: RaiseEntry[] = [];
  for (const scenario of criteriaScenarios()) {
    let campaign;
    try {
      campaign = planCampaign({
        request: scenario.request,
        marchTarget: HORIZON,
        budgetMs: CAMPAIGN.budgets.plan,
        ...CAMPAIGN.planFixes,
        putBack: CAMPAIGN.putBack,
      });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
      continue;
    }
    for (const stop of campaign.alternatives) {
      const base = planMarch(scenario.request, stop.counts).result;
      const own = countsOf(base);
      setRaiseKernel(raiseKernel);
      const trades = positionTrades(scenario.request, base);
      setRaiseKernel(null);
      entries.push({
        army: scenario.label,
        stop: stop.pick,
        rows: trades.rows.map((row) => toRow(scenario.request, own, row)),
      });
    }
  }
  return entries;
}

// ---- sizepool.json: pool-bisection's own seeded generator -----------------------------------------------------

interface PoolSlotIn {
  hp: number;
  cost: number;
  cap: number;
}

interface PoolTrial {
  slots: PoolSlotIn[];
  capacity: number;
  ceiling: number | undefined;
  counts: number[];
  used: number;
}

/** `sizePool` of `src/engine/stacker.ts`, the TypeScript branch — `pool-bisection.test.ts`'s own reference. */
function referencePool(
  slots: (PoolSlotIn & { count: number })[],
  capacity: number,
  ceiling: number | undefined,
): number[] | 'none' {
  if (slots.length === 0 || capacity <= 0) return 'none';
  const unitsForTarget = (slot: PoolSlotIn, target: number): number =>
    slot.hp <= 0 || slot.cost <= 0 ? 0 : Math.max(0, Math.min(Math.floor(target / slot.hp), slot.cap));
  const countsAt = (ceilingHp: number): number[] => {
    const delta = RANK_SPREAD * ceilingHp;
    return slots.map((slot, index) => unitsForTarget(slot, ceilingHp - index * delta));
  };
  const usedBy = (counts: number[]): number =>
    counts.reduce((sum, count, index) => sum + count * (slots[index]?.cost ?? 0), 0);
  const maxHp = Math.max(...slots.map((slot) => slot.hp));
  let low = 0;
  let high = ceiling ?? (capacity + 1) * Math.max(maxHp, 1);
  if (ceiling !== undefined && usedBy(countsAt(ceiling)) <= capacity) low = ceiling;
  else {
    for (let step = 0; step < 200; step += 1) {
      const mid = (low + high) / 2;
      if (usedBy(countsAt(mid)) <= capacity) low = mid;
      else high = mid;
    }
  }
  const counts = countsAt(low);
  let rest = capacity - usedBy(counts);
  let changed = true;
  while (changed && rest > 0) {
    changed = false;
    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      if (!slot || slot.hp <= 0) continue;
      const next = (counts[index] ?? 0) + 1;
      if (slot.cost > rest || next > slot.cap) continue;
      if (ceiling !== undefined && next * slot.hp > ceiling) continue;
      counts[index] = next;
      rest -= slot.cost;
      changed = true;
    }
  }
  return [...counts, capacity - rest];
}

const POOL_SEED = 0x5e5;
/** A sample of `pool-bisection.test.ts`'s own 20 000 — the same seeded sequence, kept to a golden-sized slice. */
const POOL_SAMPLE = 1_500;

/** The same generator `pool-bisection.test.ts` walks, kept to the trials both paths agree answer something. */
function poolTrials(
  sample: number,
): { slots: PoolSlotIn[]; capacity: number; ceiling: number | undefined }[] {
  const random = mulberry32(POOL_SEED);
  const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)] as T;
  const hps = [0, 1, 3, 7.5, 120, 1_200, 45_000, 2e6, 1e15, 1e300, Infinity];
  const costs = [0, 1, 2, 3, 5, 12, 40, 1e9, 1e300];
  const caps = [0, 1, 10, 83, 450, 5_000];
  const capacities = [1, 7, 900, 2_180, 5_600, 20_000, 1e9, 1e15, 1e300, 8.9e307, 1.7e308];
  const out: { slots: PoolSlotIn[]; capacity: number; ceiling: number | undefined }[] = [];
  for (let trial = 0; trial < sample; trial += 1) {
    const extreme = random() < 0.35;
    const n = 1 + Math.floor(random() * 12);
    const slots: PoolSlotIn[] = Array.from({ length: n }, () => ({
      hp: extreme ? pick(hps) : 1 + Math.floor(random() * 50_000),
      cost: extreme ? pick(costs) : 1 + Math.floor(random() * 12),
      cap: extreme || random() < 0.3 ? pick(caps) : Number.MAX_SAFE_INTEGER,
    }));
    const capacity = extreme ? pick(capacities) : 1 + Math.floor(random() * 20_000);
    const ceiling =
      random() < 0.4 ? (extreme ? pick([0, 1, 1e6, 1e300, Infinity]) : random() * 3e6) : undefined;
    out.push({ slots, capacity, ceiling });
  }
  return out;
}

describe('the golden capture (E3 S0)', () => {
  if (CAPTURE) {
    it('runs both paths, asserts them equal, and writes the goldens', () => {
      // plans.json
      if (profile) expect(planScenarios.length).toBe(18);
      const planTs = buildPlans(false);
      const planKernel = buildPlans(true);
      expect(planKernel).toStrictEqual(planTs);
      writeGolden('plans.json', planKernel);

      // raise.json — the kernel's alone: the TypeScript raise search is retired (W16 E3 S5b), so a capture
      // here is a re-base and not a second testimony.
      writeGolden('raise.json', buildRaise());

      // sizepool.json
      const trials = poolTrials(POOL_SAMPLE);
      const results: PoolTrial[] = [];
      for (const trial of trials) {
        const reference = referencePool(
          trial.slots.map((slot) => ({ ...slot, count: -1 })),
          trial.capacity,
          trial.ceiling,
        );
        if (reference === 'none') continue;
        const mine = trial.slots.map((slot) => ({ ...slot, count: -1 }));
        const used = kernel.sizePool(mine, trial.capacity, trial.ceiling, RANK_SPREAD);
        if (used === null) continue;
        const got = [...mine.map((slot) => slot.count), used];
        expect(got).toStrictEqual(reference);
        results.push({
          slots: trial.slots,
          capacity: trial.capacity,
          ceiling: trial.ceiling,
          counts: got.slice(0, -1),
          used: got[got.length - 1] as number,
        });
      }
      expect(results.length).toBeGreaterThan(POOL_SAMPLE / 2);
      writeGolden('sizepool.json', results);
    }, 600_000);
  } else {
    it('plans.json: the kernel alone answers what the TypeScript once did', () => {
      const golden = readGolden<PlanEntry[]>('plans.json');
      // `toEqual`, not `toStrictEqual`: JSON drops a key whose value is `undefined` (`CampaignPlan`'s own
      // optional fields, e.g. `finale`), so the golden has no key where the fresh plan has one set to
      // `undefined` — the same march either way, which `toEqual` reads correctly and `toStrictEqual` would not.
      expect(buildPlans(true)).toEqual(golden);
    }, 120_000);

    it('raise.json: the kernel alone answers every stop’s five positions', () => {
      const golden = readGolden<RaiseEntry[]>('raise.json');
      expect(buildRaise()).toStrictEqual(golden);
    }, 60_000);

    it('sizepool.json: the kernel alone answers the seeded pools', () => {
      const golden = readGolden<PoolTrial[]>('sizepool.json');
      for (const trial of golden) {
        const mine = trial.slots.map((slot) => ({ ...slot, count: -1 }));
        const used = kernel.sizePool(mine, trial.capacity, trial.ceiling, RANK_SPREAD);
        expect(used).toBe(trial.used);
        expect(mine.map((slot) => slot.count)).toStrictEqual(trial.counts);
      }
    }, 30_000);
  }
});
