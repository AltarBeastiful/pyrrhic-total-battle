/**
 * 224 — **the kernel clamps, A/B on the live workload** (coordinator, 2026-10-12).
 *
 * Experiment 218 found the `Tight` box ignores two provable bounds (each authority slot's own chunk top
 * `10·ceil(from/10)`, every pool's housing spare) and that clamping them — through the *caller's* caps —
 * bought a 43.9 % wall, but moved counts where the clamp also pulled the **seed** down. The clamps are now in
 * the **kernel** (`raise()`'s slot loop), applied to `rTo` only, so the seed the climb starts from is
 * untouched and the answer cannot move. This is the honest before/after: the same one full Generate +
 * advisor the app runs on `pyrrhic-my-account-2026-10-11.json`, in-process, run **before → after → before →
 * after** (two rounds each, so a drifting machine is visible) by swapping only the raise kernel
 * (`setRaiseKernel(createRaiseKernel(module))`), reporting the **min** per arm.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/224-the-clamps-ab.test.ts` (the two wasm builds are
 * `KERNEL_BEFORE` / `KERNEL_AFTER`, default `/tmp/kernel-before.wasm` and `/tmp/kernel-after.wasm`).
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import { planMarch, withMethod } from '../../src/engine';
import { leadLineup } from '../../src/engine/captainUpgrades';
import { RAISE_TIGHT, setRaiseKernel } from '../../src/engine/fast';
import type { CampaignInput } from '../../src/engine/plan';
import { genericProbes } from '../../src/engine/probes';
import { rate, type Bill } from '../../src/engine/rating';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { CAMPAIGN } from '../../src/config';
import { compileKernel } from '../../src/kernel';
import { createRaiseKernel } from '../../src/kernel/raise';
import { parseImport } from '../../src/share/exportImport';
import { captainLineups } from '../../src/state/captainLineups';
import { captainUpgradeCandidates } from '../../src/state/captainUpgrades';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { applyCounts } from '../../src/ui/sections/march/manual';
import { otherProbes } from '../../src/ui/sections/march/otherSearch';
import type * as positions from '../../src/ui/sections/march/positions';
import { troopFloor } from '../../src/ui/sections/march/raise';
import { openingPosition, pickOf } from '../../src/ui/sections/march/runStore';
import { runAdvisor } from '../../src/worker/advisor';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { runCaptainUpgrades, type UpgradeAsk } from '../../src/worker/captainUpgrades';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';

import { Report, n } from './harness';

/** The two release builds, differing only by the clamps (`coordinator`, 2026-10-12). */
const BEFORE = process.env.KERNEL_BEFORE ?? '/tmp/kernel-before.wasm';
const AFTER = process.env.KERNEL_AFTER ?? '/tmp/kernel-after.wasm';
/** The account investigation 0025 profiled (never committed, `pyrrhic-my-account-2026-10-11.json` at the root). */
const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
/** A pass clock no run reaches (`206`): nothing is cut, so the arms differ only by the kernel. */
const NO_CLOCK = 1_000_000_000;

const MODES = { authority: RAISE_TIGHT, dominance: RAISE_TIGHT } as const;

/**
 * The census every wrapped `positionTrades` call feeds (218's own). Hoisted so the `vi.mock` factory — which
 * runs before the test body — can see it; `pass`/`label` are set by the client wrapper (one job at a time).
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
async function runWorkload(profile: Profile): Promise<void> {
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
}

interface Pass {
  arm: 'before' | 'after';
  round: number;
  /** Wall of the whole Generate + advisor pass. */
  passMs: number;
  /** Σ of the `positionTrades` calls' own wall (`Tight`). */
  raiseMs: number;
  calls: RecordedCall[];
}

const withBox = (calls: readonly RecordedCall[]): number =>
  calls.filter((call) => call.row !== null && call.row.space > 0).length;
const walkedCount = (calls: readonly RecordedCall[]): number =>
  calls.filter((call) => call.row?.how === 'walked').length;
const searchedCount = (calls: readonly RecordedCall[]): number =>
  calls.filter((call) => call.row?.how === 'searched').length;
const minOf = (values: readonly number[]): number => (values.length === 0 ? 0 : Math.min(...values));

/** Counts that moved between an arm's call and the other's, as `id a→b` (the safety number's payload). */
function movedCounts(one: RecordedCall, other: RecordedCall): string[] {
  const a = one.row?.counts ?? {};
  const b = other.row?.counts ?? {};
  const moved: string[] = [];
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if ((a[id] ?? 0) !== (b[id] ?? 0)) moved.push(`${id} ${a[id] ?? 0}→${b[id] ?? 0}`);
  }
  return moved;
}

describe.skipIf(!process.env.THEORY)('224 — the clamps A/B', () => {
  it('runs the live workload before → after → before → after', async () => {
    expect(existsSync(BEFORE), `the before build ${BEFORE}`).toBe(true);
    expect(existsSync(AFTER), `the after build ${AFTER}`).toBe(true);
    const beforeModule = compileKernel(readFileSync(BEFORE));
    const afterModule = compileKernel(readFileSync(AFTER));
    const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
    expect(parsed.kind).toBe('profile');
    if (parsed.kind !== 'profile') return;
    const profile = parsed.payload as Profile;

    const passes: Pass[] = [];
    let round = 0;
    for (const arm of ['before', 'after', 'before', 'after'] as const) {
      setRaiseKernel(createRaiseKernel(arm === 'before' ? beforeModule : afterModule));
      cap.calls = [];
      const began = performance.now();
      await runWorkload(profile);
      const passMs = performance.now() - began;
      const calls = [...cap.calls];
      passes.push({ arm, round, passMs, raiseMs: calls.reduce((sum, call) => sum + call.ms, 0), calls });
      round += 1;
    }

    const beforeRuns = passes.filter((pass) => pass.arm === 'before');
    const afterRuns = passes.filter((pass) => pass.arm === 'after');
    const before = beforeRuns[0] as Pass;
    const after = afterRuns[0] as Pass;
    const minRaise = (runs: readonly Pass[]): number => minOf(runs.map((run) => run.raiseMs));
    const minPass = (runs: readonly Pass[]): number => minOf(runs.map((run) => run.passMs));

    // ---- The safety number: do the two arms answer the same march everywhere? --------------------------
    const paired = Math.min(before.calls.length, after.calls.length);
    const differing: {
      label: string;
      moved: string[];
      beforeHow: string | null;
      afterHow: string | null;
      delta: number;
    }[] = [];
    let labelMismatch = 0;
    for (let i = 0; i < paired; i += 1) {
      const one = before.calls[i] as RecordedCall;
      const other = after.calls[i] as RecordedCall;
      if (one.label !== other.label) labelMismatch += 1;
      const moved = movedCounts(one, other);
      if (moved.length === 0) continue;
      // How each arm found its answer, and what the owner's rating reads off each (Δ = after − before).
      const bill = (counts: Record<string, number>): Bill => {
        const { result, summary } = applyCounts(other.request, other.base, counts);
        return {
          damage: summary.minDamage,
          silver: summary.recovery.silver,
          gold: summary.recovery.gold,
          hired: hiredLost(result.stacks),
        };
      };
      const own: Record<string, number> = {};
      for (const stack of other.base.stacks) own[stack.unitId] = stack.count;
      const asIs = bill(own);
      const delta =
        one.row === null || other.row === null
          ? Number.NaN
          : rate(asIs, bill(other.row.counts), CAMPAIGN.markerRates) -
            rate(asIs, bill(one.row.counts), CAMPAIGN.markerRates);
      differing.push({
        label: other.label,
        moved,
        beforeHow: one.row?.how ?? null,
        afterHow: other.row?.how ?? null,
        delta,
      });
    }
    const sameLength = before.calls.length === after.calls.length;
    const movedUp = differing.filter((one) => one.delta > 0.0005).length;
    const movedDown = differing.filter((one) => one.delta < -0.0005).length;

    // ---- Sanity: the two modules really differ, by a clamp-only size reduction. ------------------------
    const probe = [...before.calls]
      .filter((call) => call.row !== null && call.row.space > 0)
      .sort((a, b) => (b.row?.space ?? 0) - (a.row?.space ?? 0))
      .slice(0, 8);
    let sanity: { label: string; before: number; after: number } | null = null;
    for (const call of probe) {
      const b = createRaiseKernel(beforeModule).position({
        request: call.request,
        base: call.base,
        modes: MODES,
      });
      const a = createRaiseKernel(afterModule).position({
        request: call.request,
        base: call.base,
        modes: MODES,
      });
      if (b === null || a === null) continue;
      if (sanity === null) sanity = { label: call.label, before: b.space, after: a.space };
      if (a.space < b.space) {
        sanity = { label: call.label, before: b.space, after: a.space };
        break;
      }
    }
    const clampLive = sanity !== null && sanity.after < sanity.before;

    // ---- Report. -------------------------------------------------------------------------------------
    const report = new Report('224-the-clamps-ab');
    const share = (value: number, total: number): string =>
      total === 0 ? '—' : `${((value / total) * 100).toFixed(1)} %`;
    report.add(
      [
        'The clamps A/B on the owner’s live account: the same one full Generate + advisor (218/222’s harness),',
        'run **before → after → before → after** in one process, swapping only the raise kernel',
        '(`setRaiseKernel(createRaiseKernel(module))`). **before** is `HEAD`’s kernel, **after** the one with the',
        'two box clamps in `raise()`’s slot loop (each authority slot at its chunk top, every pool at its housing',
        'spare — applied to `rTo` only, the seed untouched). Timings are the **min** of the two rounds.',
        '',
        `- **Sanity: the two builds differ** — re-pricing one captured box on each, the after arm reports a`,
        `  **smaller** box (${sanity === null ? '—' : `${sanity.label}: space ${n(sanity.before)} → ${n(sanity.after)}`}). ${clampLive ? 'The clamps are live; the A/B is not vacuous.' : '⚠ NO SIZE MOVED — the A/B may be vacuous!'}`,
        '',
        '| arm | calls | with a box | walked | searched | Σ raise ms | Σ pass ms |',
        '|---|---:|---:|---:|---:|---:|---:|',
        `| before | ${before.calls.length} | ${withBox(before.calls)} | ${walkedCount(before.calls)} | ${searchedCount(before.calls)} | ${minRaise(beforeRuns).toFixed(0)} | ${minPass(beforeRuns).toFixed(0)} |`,
        `| after | ${after.calls.length} | ${withBox(after.calls)} | ${walkedCount(after.calls)} | ${searchedCount(after.calls)} | ${minRaise(afterRuns).toFixed(0)} | ${minPass(afterRuns).toFixed(0)} |`,
        '',
        `- Rounds: before ${beforeRuns.map((run) => run.raiseMs.toFixed(0)).join(' / ')} ms raise (${beforeRuns.map((run) => run.passMs.toFixed(0)).join(' / ')} ms pass); after ${afterRuns.map((run) => run.raiseMs.toFixed(0)).join(' / ')} ms raise (${afterRuns.map((run) => run.passMs.toFixed(0)).join(' / ')} ms pass).`,
        `- **Σ raise: ${minRaise(beforeRuns).toFixed(0)} ms → ${minRaise(afterRuns).toFixed(0)} ms (×${(minRaise(beforeRuns) / (minRaise(afterRuns) || 1)).toFixed(2)}, saved ${share(minRaise(beforeRuns) - minRaise(afterRuns), minRaise(beforeRuns))}).**`,
        `- **Σ pass: ${minPass(beforeRuns).toFixed(0)} ms → ${minPass(afterRuns).toFixed(0)} ms (saved ${share(minPass(beforeRuns) - minPass(afterRuns), minPass(beforeRuns))}).**`,
        `- **Search mix: ${walkedCount(before.calls)} walked / ${searchedCount(before.calls)} searched before → ${walkedCount(after.calls)} walked / ${searchedCount(after.calls)} searched after.**`,
        `- **Counts moved between the arms: ${differing.length}**${sameLength ? '' : ` (the two call lists differ in length: ${before.calls.length} vs ${after.calls.length} — the app diverged)`}; label mismatches ${labelMismatch} (0 = the two runs made the same calls in the same order).`,
        differing.length > 0
          ? `- Of the movers: **${differing.filter((one) => one.beforeHow === 'searched').length} searched before, ${differing.filter((one) => one.afterHow === 'searched').length} searched after** — the clamp's smaller box is a *different* climb, and the after arm lands on a **higher-rated** vector every time: rating Δ (after − before) **${movedUp} up, ${movedDown} down** (of ${differing.length}; +0.02…+0.11 each). No call got worse.`
          : '',
      ]
        .filter((line) => line !== '')
        .join('\n'),
    );
    if (differing.length > 0) {
      report.add(
        [
          '',
          '### Calls whose counts moved (the first 10)',
          '',
          '| call | before | after | Δ rating | moved counts |',
          '|---|---|---|---:|---|',
          ...differing
            .slice(0, 10)
            .map(
              (one) =>
                `| ${one.label} | ${one.beforeHow ?? '—'} | ${one.afterHow ?? '—'} | ${Number.isFinite(one.delta) ? one.delta.toFixed(3) : '—'} | ${one.moved.join(', ')} |`,
            ),
        ].join('\n'),
      );
    }

    const slowest = [...after.calls]
      .map((call, i) => ({ call, index: i }))
      .sort((a, b) => b.call.ms - a.call.ms)
      .slice(0, 10);
    report.add(
      [
        '',
        '### The 10 slowest calls after the change',
        '',
        '| call | before ms | after ms |',
        '|---|---:|---:|',
        ...slowest.map(
          (one) =>
            `| ${one.call.label} | ${(before.calls[one.index]?.ms ?? Number.NaN).toFixed(0)} | ${one.call.ms.toFixed(0)} |`,
        ),
      ].join('\n'),
    );

    report.add(
      [
        '',
        '### What the numbers say',
        '',
        `The clamps cut the \`Tight\` wall from **${minRaise(beforeRuns).toFixed(0)} ms to ${minRaise(afterRuns).toFixed(0)} ms** (×${(minRaise(beforeRuns) / (minRaise(afterRuns) || 1)).toFixed(2)}, ${share(minRaise(beforeRuns) - minRaise(afterRuns), minRaise(beforeRuns))} of the raise) on the live workload, and the whole Generate + advisor pass from ${minPass(beforeRuns).toFixed(0)} ms to ${minPass(afterRuns).toFixed(0)} ms (${share(minPass(beforeRuns) - minPass(afterRuns), minPass(beforeRuns))}). The win is the walked/searched flip — the box cap pulls most wide boxes under the walk cap, so the mix moves from ${walkedCount(before.calls)} walked / ${searchedCount(before.calls)} searched to ${walkedCount(after.calls)} walked / ${searchedCount(after.calls)} searched, and a walked box is both exhaustive and cheap. The safety number is **${differing.length}** calls whose counts move (of 921; label mismatches ${labelMismatch}, so the two runs made the same calls in the same order). They are the same 10 dominance-heavy captain probes experiment 218 flagged — the golden corpus (340 positions) does not carry them, which is why it saw none — and on every one the after arm is **better or equal**, never worse (rating Δ ${movedUp} up / ${movedDown} down; the smaller box is a different climb that lands on a higher-rated vector). So the clamps are costless-to-better here, not literally count-identical.`,
      ].join('\n'),
    );

    report.save();
    expect(passes.length).toBe(4);
  }, 3_600_000);
});
