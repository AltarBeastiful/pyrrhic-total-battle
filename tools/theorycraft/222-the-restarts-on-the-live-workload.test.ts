/**
 * 222 — **what the restarts buy on the live workload** (follows 218 and 221; coordinator, 2026-10-12).
 *
 * Experiment 221 priced the **restarts** knob on the 7 searched stops of the benchmark: with the cap, rank,
 * seed and sweep limit identical and only `EXACT_DEFAULTS.restarts` moved, the owner's rating was the **same
 * at 1 start as at 64** on every one, while the wall was linear in the starts (46 593 ms → 570 ms on the 1.9e25
 * stop). Since **287 of the 921 `positionTrades` calls** of the live workload are above `MEMO_CAP` and carry
 * **74.4 %** of its time (218), the same knob may be the whole of that cost. This experiment asks whether 1
 * start is free **on the real workload** the way it is on the benchmark.
 *
 * The harness is 218's, unchanged: the same one full Generate + advisor on `pyrrhic-my-account-2026-10-11.json`
 * in-process on the release kernel, every `positionTrades` call wrapped and recorded. Then, for the calls the
 * default actually **searches**, this re-prices the identical box at `restarts ∈ {0, 3, 7, 15, 31, 63}` (1…64
 * starts) through `createRaiseKernel(module, { ...EXACT_DEFAULTS, restarts })`, exactly as 221 does, and reads
 * each arm's wall ms and the owner's rating (`rate(as is, bill, markerRates)`, `applyCounts` + `hiredLost`).
 *
 * **Cost.** Re-pricing all 418 searched calls across 6 arms would be hours, so the sample is the **top 40 by
 * default wall ms plus a random 40 more searched calls** (218's own ms figures decide the top; the random 40
 * are a seeded draw, `mulberry32`).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/222-the-restarts-on-the-live-workload.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planMarch, withMethod } from '../../src/engine';
import { leadLineup } from '../../src/engine/captainUpgrades';
import { RAISE_TIGHT } from '../../src/engine/fast';
import type { CampaignInput } from '../../src/engine/plan';
import { genericProbes } from '../../src/engine/probes';
import { rate, type Bill } from '../../src/engine/rating';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { createRaiseKernel, EXACT_DEFAULTS } from '../../src/kernel/raise';
import { parseImport } from '../../src/share/exportImport';
import { captainLineups } from '../../src/state/captainLineups';
import { captainUpgradeCandidates } from '../../src/state/captainUpgrades';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { applyCounts } from '../../src/ui/sections/march/manual';
import { otherProbes } from '../../src/ui/sections/march/otherSearch';
import type * as positions from '../../src/ui/sections/march/positions';
import { shelterCeiling, troopFloor } from '../../src/ui/sections/march/raise';
import { openingPosition, pickOf } from '../../src/ui/sections/march/runStore';
import { runAdvisor } from '../../src/worker/advisor';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { runCaptainUpgrades, type UpgradeAsk } from '../../src/worker/captainUpgrades';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';

import { loadKernelModule } from '../../tests/kernel/load';
import { Report, n } from './harness';

/**
 * The census every wrapped `positionTrades` call feeds — identical to 218's, hoisted so the `vi.mock` factory
 * (which runs before the test body) can see it; `pass`/`label` are set by the client wrapper (one job at a time).
 */
interface RowAnswer {
  how: 'walked' | 'searched' | null;
  space: number;
  scored: number;
  counts: Record<string, number>;
}
interface RecordedCall {
  label: string;
  request: StackRequest;
  base: StackResult;
  ms: number;
  row: RowAnswer | null;
}
const cap = vi.hoisted(() => ({
  pass: 'generate',
  label: 'setup',
  calls: [] as RecordedCall[],
}));

vi.mock('../../src/ui/sections/march/positions', async (importOriginal) => {
  const real = await importOriginal<typeof positions>();
  return {
    ...real,
    positionTrades: (...args: Parameters<typeof real.positionTrades>) => {
      const began = performance.now();
      const out = real.positionTrades(...args);
      const ms = performance.now() - began;
      const tight = out.rows.find((row) => row.mode === 'tight');
      cap.calls.push({
        label: `${cap.pass}/${cap.label}`,
        request: args[0],
        base: args[1],
        ms,
        row:
          tight === undefined
            ? null
            : { how: tight.how, space: tight.space, scored: tight.scored, counts: tight.counts },
      });
      return out;
    },
  };
});

/** The account investigation 0025 profiled (never committed, `pyrrhic-my-account-2026-10-11.json` at the root). */
const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
/** A pass clock no run reaches (`206`): nothing is cut, so the workload is the machine's own. */
const NO_CLOCK = 1_000_000_000;
/** `kernel/assembly/index.ts`: above this box the score memo is switched off. */
const MEMO_CAP = 4_194_304;
/** The starts tried (`221`): `restarts` is the seeded starts; the default is `EXACT_DEFAULTS.restarts` (64). */
const RESTARTS = [0, 3, 7, 15, 31, 63] as const;
/** The sample: the top by default wall ms, plus a seeded draw of the remaining searched calls. */
const TOP = 40;
const RANDOM = 40;
const SEED = 20_261_012;
/** A guard so a pathological run still writes a report well under the coordinator's 15-minute ceiling. */
const REPRICE_BUDGET_MS = 12 * 60_000;

const MODES = { authority: RAISE_TIGHT, dominance: RAISE_TIGHT } as const;

function countsOf(base: StackResult): Record<string, number> {
  const out: Record<string, number> = {};
  for (const stack of base.stacks) out[stack.unitId] = stack.count;
  return out;
}

/** Whether two count records are the same march, an absent type read as zero. */
function sameCounts(one: Record<string, number>, other: Record<string, number>): boolean {
  const ids = new Set([...Object.keys(one), ...Object.keys(other)]);
  for (const id of ids) if ((one[id] ?? 0) !== (other[id] ?? 0)) return false;
  return true;
}

const MAX_SAFE = Number.MAX_SAFE_INTEGER;
const chunkTop = (value: number): number => 10 * Math.ceil(value / 10);

/** One count the kernel may move — 216's slot, the plan's own count up to `min(shelter ceiling, stock)`. */
interface Slot {
  id: string;
  pool: 'authority' | 'dominance';
  from: number;
  to: number;
  cost: number;
}
function slotsOf(request: StackRequest, base: StackResult): Slot[] {
  const floor = troopFloor(base);
  if (floor === null) return [];
  const costOf = new Map(request.units.map((unit) => [unit.id, unit.cost]));
  return base.stacks
    .filter((stack) => stack.count > 0 && (stack.pool === 'authority' || stack.pool === 'dominance'))
    .map((stack) => ({
      id: stack.unitId,
      pool: stack.pool as 'authority' | 'dominance',
      from: stack.count,
      to: Math.min(shelterCeiling(floor, stack.hpPerUnit), request.caps[stack.unitId] ?? MAX_SAFE),
      cost: costOf.get(stack.unitId) ?? 0,
    }))
    .filter((slot) => slot.to > slot.from);
}

/**
 * The box a call would have if the caller passed the clamps as `request.caps` — 216's `capsFor`, the same
 * arithmetic 218 re-priced: each authority slot at its own chunk top `10·ceil(from/10)`, every pool's slots at
 * their housing spare. Pure arithmetic over the recorded request and base; no kernel is asked anything.
 */
function clampedSpaceOf(request: StackRequest, base: StackResult): number {
  const slots = slotsOf(request, base);
  const spare = (pool: 'authority' | 'dominance'): number => {
    const used = slots
      .filter((slot) => slot.pool === pool)
      .reduce((sum, slot) => sum + slot.from * slot.cost, 0);
    return request.housing[pool] - used;
  };
  let space = 1;
  for (const slot of slots) {
    const toTop = slot.pool === 'authority' ? chunkTop(slot.from) : slot.to;
    const toSpare = slot.cost > 0 ? slot.from + Math.floor(spare(slot.pool) / slot.cost) : slot.to;
    const width = Math.max(0, Math.min(slot.to, toTop, toSpare) - slot.from + 1);
    if (width > 0) space *= width;
  }
  return slots.length === 0 ? 0 : space;
}

const rngFrom = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** The client the app runs through, tagging each job so a `positionTrades` call knows whose it is (218's own). */
function lane(): CalcClient {
  const inner: CalcClient = { ...createInlineClient(), mode: 'worker' as const };
  return {
    ...inner,
    async plan(request, signal) {
      cap.label = 'plan';
      return inner.plan(request, signal);
    },
    async positions(request, signal) {
      cap.label = 'positions';
      return inner.positions(request, signal);
    },
    async probe(request, signal) {
      cap.label = `probe ${request.against?.probe.id ?? (request.shown === undefined ? 'baseline' : 'shown')}`;
      return inner.probe(request, signal);
    },
    async captains(request, signal) {
      cap.label = 'captains';
      return inner.captains(request, signal);
    },
  };
}

/** The whole run 206 records, replayed here only to make the app call `positionTrades` where it really does. */
async function runWorkload(profile: Profile): Promise<CalcClient> {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('no active setup');
  const input: CampaignInput = buildPlanRequest(profile, setup);
  const request = buildStackRequest(profile, setup);
  const client = lane();
  const pool = createCalcPool({ size: 1, createClient: lane });
  try {
    cap.pass = 'generate';
    const planned = await client.plan(input);
    const chosen = pickOf(planned, openingPosition(planned, null));
    const marchRequest = withMethod(request, 'elite');
    if (troopFloor(planMarch(request, chosen.counts).result) !== null)
      for (const row of planned.alternatives)
        await client.positions({ request: marchRequest, counts: row.counts });
    const headline = chosen.pick;

    cap.pass = 'upgrades';
    const upgrades = await runAdvisor(input, genericProbes(), pool, { headline, budgetMs: NO_CLOCK });
    expect(upgrades.cut).toEqual([]);

    cap.pass = 'captains';
    const { currentKey, lineups, size } = captainLineups(profile, setup);
    const advice = await runCaptainAdvice(
      input,
      lineups.map(({ key, totals }) => ({ key, totals })),
      currentKey,
      pool,
      { budgetMs: NO_CLOCK },
    );
    expect(advice.cut).toEqual([]);
    const lead = leadLineup(advice.best, currentKey);
    const leadCandidate = lineups.find((trio) => trio.key === lead);
    const leadStops = advice.plans[lead];
    if (leadCandidate !== undefined && leadStops !== undefined) {
      const asks: UpgradeAsk[] = captainUpgradeCandidates(profile, setup, leadCandidate, size).map(
        (candidate) => ({
          id: candidate.spec.id,
          label: `${candidate.name} ${candidate.change}`,
          lineups: candidate.lineups.map(({ key, totals }) => ({ key, totals })),
        }),
      );
      const upgraded = await runCaptainUpgrades(
        input,
        { key: lead, totals: leadCandidate.totals, stops: leadStops },
        asks,
        pool,
        { budgetMs: NO_CLOCK },
      );
      expect(upgraded.cut).toEqual([]);
    }

    cap.pass = 'other';
    const { probes } = otherProbes(input, planned.silver);
    const other = await runAdvisor(input, probes, pool, { headline, budgetMs: NO_CLOCK });
    expect(other.cut).toEqual([]);
  } finally {
    pool.dispose();
    client.dispose();
  }
  return client;
}

/** One re-priced box: what the default answered, and what each arm bought. */
interface Sampled {
  label: string;
  space: number;
  how: 'walked' | 'searched' | null;
  defaultMs: number;
  defaultRating: number;
  arms: { restarts: number; ms: number; rating: number; differ: boolean }[];
}

describe.skipIf(!process.env.THEORY)('222 — the restarts on the live workload', () => {
  it(
    'prices the sampled searched boxes from one start to the default',
    async () => {
      expect(existsSync(ACCOUNT), `the timing fixture ${ACCOUNT}`).toBe(true);
      const module = loadKernelModule();
      const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
      expect(parsed.kind).toBe('profile');
      if (parsed.kind !== 'profile') return;
      const profile = parsed.payload as Profile;

      await runWorkload(profile);

      // ---- The sample: the top by default ms, plus a seeded draw of the rest. ---------------------------
      const searched = cap.calls.filter((call) => call.row?.how === 'searched');
      const byMs = [...searched].sort((a, b) => b.ms - a.ms);
      const top = byMs.slice(0, TOP);
      const topSet = new Set(top);
      // The draw is taken in **capture order** (the order the app made the calls, timing-independent) so the
      // random 40 are the same on every run; only the top 40, chosen by ms, can move a little with the clock.
      const rest = searched.filter((call) => !topSet.has(call));
      const rng = rngFrom(SEED);
      for (let i = rest.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        const swap = rest[i] as RecordedCall;
        rest[i] = rest[j] as RecordedCall;
        rest[j] = swap;
      }
      const sample = [...top, ...rest.slice(0, RANDOM)];

      // ---- The clamp's own count: one cheap line over the same recorded calls (no kernel work). ----------
      // Of the calls the default **searches**, how many have a box the caller's own caps would bring under the
      // walk cap — i.e. the kernel would then walk them (exhaustive over the feasible set, an exact optimum
      // rather than a heuristic's best). A walked call's box only shrinks, so all of them stay walked.
      const WALK_CAP = EXACT_DEFAULTS.walkCap;
      const walkedAll = cap.calls.filter((call) => call.row?.how === 'walked');
      const clampedWalkable = searched.filter((call) => {
        const clamped = clampedSpaceOf(call.request, call.base);
        return clamped > 0 && clamped <= WALK_CAP;
      }).length;

      // ---- Re-price each sampled box, one fresh kernel an arm. ------------------------------------------
      const sampled: Sampled[] = [];
      const beganAll = performance.now();
      let budgetHit = false;
      for (const call of sample) {
        if (performance.now() - beganAll > REPRICE_BUDGET_MS) {
          budgetHit = true;
          break;
        }
        const request = call.request;
        const base = call.base;
        const own = countsOf(base);
        const bill = (counts: Record<string, number>): Bill => {
          const { result, summary } = applyCounts(request, base, counts);
          return {
            damage: summary.minDamage,
            silver: summary.recovery.silver,
            gold: summary.recovery.gold,
            hired: hiredLost(result.stacks),
          };
        };
        const asIs = bill(own);
        const rowCounts = call.row?.counts ?? own;
        const defaultRating = rate(asIs, bill({ ...own, ...rowCounts }), CAMPAIGN.markerRates);
        const arms = RESTARTS.map((restarts) => {
          const kernel = createRaiseKernel(module, { ...EXACT_DEFAULTS, restarts });
          const began = performance.now();
          const answer = kernel.position({ request, base, modes: MODES });
          const ms = performance.now() - began;
          if (answer === null) return { restarts, ms, rating: Number.NaN, differ: true };
          const rating = rate(asIs, bill({ ...own, ...answer.counts }), CAMPAIGN.markerRates);
          return { restarts, ms, rating, differ: !sameCounts(rowCounts, answer.counts) };
        });
        sampled.push({
          label: call.label,
          space: call.row?.space ?? 0,
          how: call.row?.how ?? null,
          defaultMs: call.ms,
          defaultRating,
          arms,
        });
      }

      // ---- Report. -------------------------------------------------------------------------------------
      const report = new Report('222-the-restarts-on-the-live-workload');
      const overMemo = sampled.filter((one) => one.space > MEMO_CAP);
      const perArm = RESTARTS.map((restarts, i) => {
        let ms = 0;
        let given = 0;
        let differ = 0;
        for (const one of sampled) {
          const arm = one.arms[i];
          if (arm === undefined) continue;
          ms += arm.ms;
          // Rating given up: `0` where the counts are the default's or the rating is equal (a cheaper arm that
          // ties). A negative (a cheaper arm rating *higher*) is clamped — nothing was given up.
          const gap = one.defaultRating - arm.rating;
          given += Number.isFinite(gap) && gap > 0 ? gap : 0;
          if (arm.differ) differ += 1;
        }
        return { restarts, starts: restarts + 1, ms, given, differ };
      });

      report.add(
        [
          `The **${sampled.length}** searched calls of the live workload${budgetHit ? ' (the wall budget stopped the draw early)' : ''},`,
          `sampled as the **top ${TOP} by default wall ms plus a random ${RANDOM} more** of the ${searched.length} the`,
          `default searches (${overMemo.length} of the sample are above \`MEMO_CAP\`, ${n(MEMO_CAP)}). Each row reads across the`,
          `starts, with the identical cap, rank, seed and sweep limit and only \`EXACT_DEFAULTS.restarts\` moved`,
          `(the default is ${EXACT_DEFAULTS.restarts}). **default** is the real run's own \`Tight\` row; a cell is`,
          '`ms · rating`, and a trailing `*` marks an arm that answered **different counts** than the default.',
          '**rating** is the owner’s `rate(as is, ·, markerRates)`.',
          '',
          `| call | space | default | ${RESTARTS.map((r) => `${r + 1} start${r === 0 ? '' : 's'}`).join(' | ')} |`,
          `|---|---:|---:${RESTARTS.map(() => '---:').join('|')}|`,
        ].join('\n'),
      );
      for (const one of sampled) {
        const cells = one.arms.map(
          (arm) =>
            `${arm.ms.toFixed(0)} · ${Number.isFinite(arm.rating) ? arm.rating.toFixed(2) : '—'}${arm.differ ? ' *' : ''}`,
        );
        report.add(
          `| ${one.label} · ${n(one.space)} | ${n(one.space)} | ${one.defaultMs.toFixed(0)} · ${one.defaultRating.toFixed(2)} | ${cells.join(' | ')} |`,
        );
      }

      const oneStart = perArm[0];
      const worst = [...sampled].sort(
        (a, b) =>
          b.defaultRating - (b.arms[0]?.rating ?? NaN) - (a.defaultRating - (a.arms[0]?.rating ?? NaN)),
      )[0];
      const worstGap = worst === undefined ? 0 : worst.defaultRating - (worst.arms[0]?.rating ?? NaN);
      const free = oneStart !== undefined && oneStart.given === 0 && oneStart.differ === 0;
      report.add(
        [
          '',
          '## What the numbers say',
          '',
          `- **${sampled.length} searched calls re-priced** (${overMemo.length} above \`MEMO_CAP\`), each at ${RESTARTS.length} arms (1…${(RESTARTS.at(-1) as number) + 1} starts).`,
          '',
          '| starts | Σ ms | Σ rating given up | calls answering different counts |',
          '|---:|---:|---:|---:|',
          ...perArm.map(
            (arm) => `| ${arm.starts} | ${arm.ms.toFixed(0)} | ${arm.given.toFixed(3)} | ${arm.differ} |`,
          ),
          '',
          free
            ? `- **1 start is free on the live workload** — no sampled call gave up any rating and none answered different counts at 1 start, exactly as 221 found on the benchmark.`
            : `- **1 start is NOT free on the live workload**: at 1 start the sample gives up **${oneStart?.given.toFixed(3)}** rating and **${oneStart?.differ}** call${oneStart?.differ === 1 ? '' : 's'} answer different counts. Worst stop: **${worst?.label}** (space ${worst === undefined ? '—' : n(worst.space)}), giving up **${Number.isFinite(worstGap) ? worstGap.toFixed(3) : '—'}**.`,
          `- Wall, whole sample: **${perArm[0]?.ms.toFixed(0)} ms at 1 start** vs **${perArm.at(-1)?.ms.toFixed(0)} ms at ${(RESTARTS.at(-1) as number) + 1} starts** — ×${((perArm.at(-1)?.ms ?? 0) / (perArm[0]?.ms || 1)).toFixed(1)}.`,
          `- **The clamp's own count**: of the ${searched.length} calls the default **searches**, **${clampedWalkable}** have a box the caller's own caps (216's \`capsFor\`) would bring to ≤ the walk cap (${n(WALK_CAP)}) — the kernel would then **walk** them (exhaustive over the feasible set, an exact optimum rather than a heuristic's best). All **${walkedAll.length}** walked calls stay walked (the clamp only shrinks a box).`,
        ].join('\n'),
      );

      report.save();
      expect(sampled.length).toBeGreaterThan(0);
    },
    60 * 60_000,
  );
});
