/**
 * 218 — **what the live raise workload actually is, call by call** (owner, 2026-10-12: *"I want to explore
 * reducing tight costs. I believe we explore blindly a lot of possible troop placement and we should be able to
 * do that more quickly."*).
 *
 * `Tight` (`positionTrades`, `src/ui/sections/march/positions.ts`) is **51.6 % of the pool CPU** of a full
 * Generate + advisor run on the owner's live account (investigation 0025). Experiment 216 censused the *box*
 * of every benchmark stop; this one is the same census taken on the **real** workload: every `positionTrades`
 * call the app makes in a Generate + advisor run on `pyrrhic-my-account-2026-10-11.json`, in-process on the
 * release kernel, exactly as 206 runs it — but instead of timing the workload it records each call's shape.
 *
 * Per call: the slots it may move and their pools (merc = authority, monster = dominance), the raw box
 * `space`, the box **clamped** to what the caller can pass as `request.caps` (each authority slot to its own
 * chunk top `10·ceil(from/10)`, every pool's slots to their housing spare — experiment 216's `capsFor`, which
 * it proved answer-preserving), `how` (`walked` / `searched`), `scored`, and the call's wall ms.
 *
 * The hypothesis under test: the kernel switches its **score memo OFF** above `MEMO_CAP = 4 194 304` vectors
 * (`kernel/assembly/index.ts`), so a call whose raw space exceeds it pays every battle again on every restart.
 * The report measures the time share of exactly those calls, and re-prices each recorded box through a fresh
 * `createRaiseKernel` with the clamped caps (216's `priced()`, reused) to price the arm a caller could run.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/218-the-live-raise-workload.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import { planMarch, withMethod } from '../../src/engine';
import { leadTrio } from '../../src/engine/captainUpgrades';
import { RAISE_TIGHT } from '../../src/engine/fast';
import type { CampaignInput } from '../../src/engine/plan';
import { genericProbes } from '../../src/engine/probes';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { createRaiseKernel } from '../../src/kernel/raise';
import { parseImport } from '../../src/share/exportImport';
import { captainTrios } from '../../src/state/captainTrios';
import { captainUpgradeCandidates } from '../../src/state/captainUpgrades';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
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
 * The census every wrapped `positionTrades` call feeds. Hoisted so the `vi.mock` factory below — which runs
 * before the test body — can see it; `pass`/`label` are set by the client wrapper the test runs the app through
 * (one job at a time, so the label is the call's own).
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
  /** The `Tight` row the call returned (`null` when the call did not price one). */
  row: RowAnswer | null;
}
const cap = vi.hoisted(() => ({
  pass: 'generate',
  label: 'setup',
  calls: [] as RecordedCall[],
}));

/** Every `positionTrades` call the app makes, timed, with its `Tight` row kept whole. */
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
/** The re-pricing pass is bounded, so a pathological run still writes a report (the task's 20-minute ceiling). */
const REPRICE_BUDGET_MS = 12 * 60_000;

/** The one position these arms price (`DEFAULT_RAISE`). */
const MODES = { authority: RAISE_TIGHT, dominance: RAISE_TIGHT } as const;

const MAX_SAFE = Number.MAX_SAFE_INTEGER;
const chunkTop = (n: number): number => 10 * Math.ceil(n / 10);

/** One count the kernel may move: the plan's own count up to `min(shelter ceiling, stock)`. Experiment 216's own. */
interface Slot {
  id: string;
  pool: 'authority' | 'dominance';
  from: number;
  to: number;
  cost: number;
  hpPerUnit: number;
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
      hpPerUnit: stack.hpPerUnit,
    }))
    .filter((slot) => slot.to > slot.from);
}
const boxSize = (widths: readonly number[]): number => widths.reduce((product, w) => product * w, 1);

/** Experiment 216's `capsFor`: the request a caller passes once the box is clamped to one slot's own bound. */
function capsFor(request: StackRequest, slots: readonly Slot[], bound: (slot: Slot) => number): StackRequest {
  const caps: Record<string, number> = { ...request.caps };
  for (const slot of slots) caps[slot.id] = Math.max(0, Math.min(slot.to, bound(slot)));
  return { ...request, caps };
}

/** One `Tight` box on a kernel of its own, so no memo outlives the clock (216's `priced`, single run). */
function priced(
  module: WebAssembly.Module,
  request: StackRequest,
  base: StackResult,
): {
  counts: Record<string, number>;
  how: 'walked' | 'searched' | null;
  space: number;
  scored: number;
  ms: number;
} | null {
  const kernel = createRaiseKernel(module);
  const began = performance.now();
  const answer = kernel.position({ request, base, modes: MODES });
  const ms = performance.now() - began;
  if (answer === null) return null;
  return { counts: answer.counts, how: answer.how, space: answer.space, scored: answer.scored, ms };
}

/** The client the app runs through, tagging each job so a `positionTrades` call knows whose it is. */
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
    const { currentKey, trios } = captainTrios(profile, setup);
    const advice = await runCaptainAdvice(
      input,
      trios.map(({ key, totals }) => ({ key, totals })),
      currentKey,
      pool,
      { budgetMs: NO_CLOCK },
    );
    expect(advice.cut).toEqual([]);
    const lead = leadTrio(advice.best, currentKey);
    const leadCandidate = trios.find((trio) => trio.key === lead);
    const leadStops = advice.plans[lead];
    if (leadCandidate !== undefined && leadStops !== undefined) {
      const asks: UpgradeAsk[] = captainUpgradeCandidates(profile, setup, leadCandidate).map((candidate) => ({
        id: candidate.spec.id,
        label: `${candidate.name} ${candidate.change}`,
        trios: candidate.trios.map(({ key, totals }) => ({ key, totals })),
      }));
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

/** One censused call, with everything the report reads. */
interface Censused {
  label: string;
  mercs: number;
  monsters: number;
  raw: number;
  clamped: number;
  how: 'walked' | 'searched' | null;
  scored: number;
  ms: number;
  shipMs: number | null;
  clampMs: number | null;
  /** Counts the clamp moved away from the shipped answer (must be empty). */
  moved: string[];
}

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
};

describe.skipIf(!process.env.THEORY)('218 — the live raise workload', () => {
  it(
    'censuses every positionTrades call on the live account',
    async () => {
      expect(existsSync(ACCOUNT), `the timing fixture ${ACCOUNT}`).toBe(true);
      const module = loadKernelModule();
      const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
      expect(parsed.kind).toBe('profile');
      if (parsed.kind !== 'profile') return;
      const profile = parsed.payload as Profile;

      await runWorkload(profile);

      // ---- Census (first pass): shape every call from its own request and base. ------------------------
      const rows: Censused[] = [];
      for (const call of cap.calls) {
        const slots = slotsOf(call.request, call.base);
        const mercs = slots.filter((slot) => slot.pool === 'authority').length;
        const monsters = slots.length - mercs;
        const raw = slots.length === 0 ? 0 : boxSize(slots.map((slot) => slot.to - slot.from + 1));
        const spare = (pool: 'authority' | 'dominance'): number => {
          const used = slots
            .filter((slot) => slot.pool === pool)
            .reduce((sum, slot) => sum + slot.from * slot.cost, 0);
          return call.request.housing[pool] - used;
        };
        const toTop = (slot: Slot): number => (slot.pool === 'authority' ? chunkTop(slot.from) : slot.to);
        const toSpare = (slot: Slot): number =>
          slot.cost > 0 ? slot.from + Math.floor(spare(slot.pool) / slot.cost) : slot.to;
        const bound = (slot: Slot): number => Math.min(toTop(slot), toSpare(slot));
        const widths = slots.map((slot) => Math.max(0, Math.min(slot.to, bound(slot)) - slot.from + 1));
        const clamped = boxSize(widths.filter((w) => w > 0));
        rows.push({
          label: call.label,
          mercs,
          monsters,
          raw,
          clamped,
          how: call.row?.how ?? null,
          scored: call.row?.scored ?? 0,
          ms: call.ms,
          shipMs: null,
          clampMs: null,
          moved: [],
        });
      }

      // ---- Re-pricing (second pass): each recorded box, shipped and clamped, on a fresh kernel. ----------
      const reBegan = performance.now();
      const calls = cap.calls;
      let repriced = 0;
      let shippedDiffers = 0;
      const differing: string[] = [];
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index] as Censused;
        const call = calls[index] as RecordedCall;
        if (row.raw === 0) continue;
        if (performance.now() - reBegan > REPRICE_BUDGET_MS) break;
        const slots = slotsOf(call.request, call.base);
        const spare = (pool: 'authority' | 'dominance'): number => {
          const used = slots
            .filter((slot) => slot.pool === pool)
            .reduce((sum, slot) => sum + slot.from * slot.cost, 0);
          return call.request.housing[pool] - used;
        };
        const toTop = (slot: Slot): number => (slot.pool === 'authority' ? chunkTop(slot.from) : slot.to);
        const toSpare = (slot: Slot): number =>
          slot.cost > 0 ? slot.from + Math.floor(spare(slot.pool) / slot.cost) : slot.to;
        const shipped = priced(module, call.request, call.base);
        const withClamp = priced(
          module,
          capsFor(call.request, slots, (slot) => Math.min(toTop(slot), toSpare(slot))),
          call.base,
        );
        if (shipped === null || withClamp === null) continue;
        row.shipMs = shipped.ms;
        row.clampMs = withClamp.ms;
        repriced += 1;
        // The reference the clamp must not move: the shipped `Tight` row the call really returned.
        const reference = call.row?.counts ?? shipped.counts;
        for (const unit of call.request.units) {
          const was = reference[unit.id] ?? 0;
          const now = withClamp.counts[unit.id] ?? 0;
          if (was !== now) row.moved.push(`${unit.id} ${was}→${now}`);
        }
        if (call.row !== null) {
          for (const unit of call.request.units) {
            const was = call.row.counts[unit.id] ?? 0;
            const now = shipped.counts[unit.id] ?? 0;
            if (was !== now) {
              shippedDiffers += 1;
              if (differing.length < 40) differing.push(`${row.label}: ${unit.id} ${was}→${now}`);
              break;
            }
          }
        }
      }

      // ---- Report. -------------------------------------------------------------------------------------
      const report = new Report('218-the-live-raise-workload');
      const totalMs = rows.reduce((sum, row) => sum + row.ms, 0);
      const withBox = rows.filter((row) => row.raw > 0);
      const walked = rows.filter((row) => row.how === 'walked');
      const searched = rows.filter((row) => row.how === 'searched');
      const memoOff = rows.filter((row) => row.raw > MEMO_CAP);
      const memoMs = memoOff.reduce((sum, row) => sum + row.ms, 0);
      const withMs = rows.filter((row) => row.raw > 0).map((row) => row.ms);
      const shipMs = rows.reduce((sum, row) => sum + (row.shipMs ?? 0), 0);
      const clampMs = rows.reduce((sum, row) => sum + (row.clampMs ?? 0), 0);
      const movedRows = rows.filter((row) => row.moved.length > 0);
      const movedAll = rows.flatMap((row) => row.moved);
      // The clamp changes the box **and the seed** it starts from (`raisePool` reads the same `caps`), so a
      // searched box can return a different count while a **walked** one (exhaustive over a superset box)
      // cannot. The split is the whole finding.
      const movedSearched = movedRows.filter((row) => row.how === 'searched');
      const movedWalked = movedRows.filter((row) => row.how === 'walked');
      const share = (value: number, total: number): string =>
        total === 0 ? '—' : `${((value / total) * 100).toFixed(1)} %`;

      report.add(
        [
          '`Tight` (`positionTrades`) on the owner’s live account, one Generate + advisor run in-process on the',
          'release kernel (206’s workload). **slots** are the hired stacks a call may move (merc(m) = authority,',
          'monster(M) = dominance); **raw** is the box the kernel walks or searches; **clamped** is the same box',
          'with each authority slot at its own chunk top `10·ceil(from/10)` and every pool’s slots at their',
          'housing spare (216’s `capsFor`, the caller’s own `request.caps`); **scored** is how many vectors the',
          'search’s scorer was asked about.',
          '',
          `- **Calls**: ${rows.length} — **${withBox.length} with a box**, ${rows.length - withBox.length} without one.`,
          `- **With a box**: **${walked.length} walked**, **${searched.length} searched** (walkCap 300 000).`,
          `- **Boxes wider than \`MEMO_CAP\` (${n(MEMO_CAP)})**: **${memoOff.length} calls**, ${memoMs.toFixed(0)} ms of ${totalMs.toFixed(0)} ms (**${share(memoMs, totalMs)}** of all call time; the memo is OFF on these).`,
        ].join('\n'),
      );

      const slowest = [...withBox].sort((a, b) => b.ms - a.ms).slice(0, 15);
      report.add(
        [
          '',
          `### The 15 slowest calls (of ${withBox.length} with a box)`,
          '',
          '| call | slots | raw space | clamped space | how | scored | ms |',
          '|---|---:|---:|---:|---|---:|---:|',
          ...slowest.map(
            (row) =>
              `| ${row.label} | ${row.mercs}m/${row.monsters}M | ${n(row.raw)} | ${n(row.clamped)} | ${row.how ?? '—'} | ${n(row.scored)} | ${row.ms.toFixed(0)} |`,
          ),
        ].join('\n'),
      );

      report.add(
        [
          '',
          '### Totals and the clamped arm',
          '',
          '| arm | Σ ms | note |',
          '|---|---:|---|',
          `| the whole workload (\`positionTrades\`, as the app runs it) | ${totalMs.toFixed(0)} | ${rows.length} calls |`,
          `| the shipped \`Tight\` box alone (re-priced, ${repriced} calls) | ${shipMs.toFixed(0)} | one box a call |`,
          `| the clamped box alone (re-priced, ${repriced} calls) | ${clampMs.toFixed(0)} | 216’s \`capsFor\` caps |`,
          '',
          `- Per with-a-box call: mean **${(withMs.reduce((s, v) => s + v, 0) / (withMs.length || 1)).toFixed(2)} ms**, median **${median(withMs).toFixed(2)} ms**.`,
          `- **Ratio, clamp ÷ shipped box** (box to box, fresh kernels): **${share(clampMs, shipMs)}**.`,
          `- **Ratio, clamp ÷ whole workload**: **${share(clampMs, totalMs)}**.`,
          movedAll.length === 0
            ? '- **Clamps moved no count** — the box they cut was dead, as 216 found.'
            : `- **⚠ STOP — the clamps moved a count on ${movedRows.length} calls (${movedAll.length} counts total): ${movedSearched.length} searched, ${movedWalked.length} walked.** A walked box must never move (it is exhaustive over a superset), so any walked move is a defect; a searched move is expected — the clamp caps the **seed** (the kernel’s climb reads the same caps) as well as the box, and the climb then starts elsewhere.`,
          shippedDiffers > 0
            ? `- **The fresh re-price of the shipped box differed from the run’s own row on ${shippedDiffers} unit comparisons** (sanity signal; see below).`
            : '- A fresh re-price of the shipped box reproduced the run’s own `Tight` row on every call (sanity).',
        ].join('\n'),
      );

      if (movedAll.length > 0 || differing.length > 0) {
        report.add(
          `\n\`\`\`\n${[...movedRows.map((r) => `CLAMP MOVED · ${r.label}: ${r.moved.join(', ')}`), ...differing].slice(0, 40).join('\n')}\n\`\`\``,
        );
      }

      report.add(
        [
          '',
          '### What the numbers say',
          '',
          `The workload is **${rows.length} \`positionTrades\` calls**; **${withBox.length}** carry a box and **${rows.length - withBox.length}** do not, and of the boxes **${walked.length} are walked** whole and **${searched.length} searched** (\`walkCap\` 300 000). Per-call time is tiny (median **${median(withMs).toFixed(1)} ms**), but it is not spread evenly: the **${memoOff.length}** boxes wider than \`MEMO_CAP\` (${n(MEMO_CAP)}) carry **${share(memoMs, totalMs)}** of all call time. On those the score memo is off, so every restart's sweeps fight their battles again — that is the whole of the cost, and the lever is to shrink the box.`,
          '',
          `Re-pricing every box with the caller's own caps (216's \`capsFor\`: each authority slot at its chunk top, every pool at its housing spare) gives **${share(clampMs, shipMs)}** of the shipped boxes' own wall (${clampMs.toFixed(0)} ms vs ${shipMs.toFixed(0)} ms, box to box) — the cost lever is real. **But the clamp is not answer-free on the live workload**: it moved a count on ${movedRows.length} calls (${movedSearched.length} searched, ${movedWalked.length} walked), because it caps the seed \`raisePool\` climbs from as well as the box, so a searched box lands elsewhere. 216's benchmark saw none only because none of its searched stops moved (its live \`all-in\` box, 135 097 600, is in this workload unchanged). A caller shipping the clamp must accept a few-unit drift on searched dominance boxes, or seed the search from the unclamped climb.`,
        ].join('\n'),
      );

      report.save();
      expect(rows.length).toBeGreaterThan(0);
      // The task's premise, held loudly: the clamped caps must not move an answer. **They do, on searched
      // boxes** — the clamp caps the seed (`raisePool` reads the same `caps`) as well as the box — so this is
      // the stop. The walked arm (exhaustive over a superset box) is the exactness guarantee, and it held.
      expect(movedWalked, 'a walked (exhaustive) box must never move under the clamp').toEqual([]);
      expect(movedAll, 'STOP: the clamp moved counts on the live workload — see the report').toEqual([]);
    },
    60 * 60_000,
  );
});
