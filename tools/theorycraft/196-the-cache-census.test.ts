/**
 * 196 — **the cache census** (W18 P0.3, `docs/plans/profile-drilldown.md`): before any cache is built, count on
 * real data how often it would be hit and what each hit saves. The run is the profiling run's own work
 * (`src/ui/sections/march/profileRun.ts`, as `tests/kernel/advisor-golden.test.ts` calls it at the worker
 * level): Generate's plan and its bar's Tight tables, then the advisor's three passes — the 29 generic probes,
 * the captain trio screen with its lead trio's upgrades, and the other questions — in-process, on one inline
 * lane, with no clock, on the **profile kernel** (compiled to a temporary file: `kernel/build/kernel.wasm`
 * stays the release build), which counts every raise search (`RaiseCensus`), and with the JS census listening
 * (`src/worker/census.ts`).
 *
 * The candidates, each with its entries, hits, hits per entry, the measured cost of one miss and the
 * projected saving (hits × miss cost, ms and share of the run's CPU):
 *
 *  - **K1** a rated value memo inside one raise search (a memo hit under `Tight` still rates the vector);
 *  - **K2** the kill order a memo miss builds twice (`raiseScore` and `raiseRating`), a refactor;
 *  - **K3** a `shownMarch` priced in more than one job — keyed two ways: the JS census's exact key (the whole
 *    elite request + counts) and the raise kernel's own input (its packed table, base, caps and modes), which
 *    sees a probe that changed only something the kernel does not read as the same work;
 *  - **K4** the same baseline planned by more than one pass;
 *  - **K5** a Tight pricing of Generate's bar that a probe job prices again;
 *  - **K6** the sizer's two journals (`sizerScore`), a fusion refactor: counted here, timed from the trace.
 *
 * The cost of one rating and of one battle is not timed inside the wasm (there is no clock there): it is fitted
 * over every Tight search of the run, ms = a + b · battles + c · ratings. The split of a rating between its kill
 * order and its bill, and the sizer's share, are the owner's trace's (`.maestro/playbooks/Working/w18/k-shares.py`
 * on `chrome-202696-18048.pftrace.gz`, quoted in `TRACE` below).
 *
 * Runs on the committed owner fixture and, when present, on the account the owner profiled
 * (`CENSUS_ACCOUNT`, default `pyrrhic-my-account-2026-10-07.json` at the repo root; never committed).
 * Writes `tools/theorycraft/out/196-the-cache-census.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/196-the-cache-census.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planMarch, withMethod } from '../../src/engine';
import { leadTrio } from '../../src/engine/captainUpgrades';
import {
  setKernel,
  setRaiseKernel,
  type RaiseAnswer,
  type RaiseCensus,
  type RaiseInput,
} from '../../src/engine/fast';
import { genericProbes } from '../../src/engine/probes';
import { packRequest } from '../../src/kernel/pack';
import { createPlanKernel } from '../../src/kernel/plan';
import { createRaiseKernel } from '../../src/kernel/raise';
import { parseImport } from '../../src/share/exportImport';
import { captainTrios } from '../../src/state/captainTrios';
import { captainUpgradeCandidates } from '../../src/state/captainUpgrades';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { otherProbes } from '../../src/ui/sections/march/otherSearch';
import { raiseCode } from '../../src/ui/sections/march/positions';
import { troopFloor } from '../../src/ui/sections/march/raise';
import { openingPosition, pickOf } from '../../src/ui/sections/march/runStore';
import { runAdvisor } from '../../src/worker/advisor';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { runCaptainUpgrades, type UpgradeAsk } from '../../src/worker/captainUpgrades';
import {
  noteCensus,
  pricingKey,
  stableKey,
  startCensus,
  summariseCensus,
  type CensusNote,
  type CensusSummary,
} from '../../src/worker/census';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { countsKey } from '../../src/worker/jobs';
import { createCalcPool } from '../../src/worker/pool';
import { ownerProfile } from '../../tests/engine/plan-scenarios';
import { loadKernelModule, loadProfileKernelModule } from '../../tests/kernel/load';

const OUT = 'tools/theorycraft/out/196-the-cache-census.md';
const ACCOUNT = process.env.CENSUS_ACCOUNT ?? 'pyrrhic-my-account-2026-10-07.json';
/** A pass clock no run reaches (`advisor-golden.test.ts`): nothing is cut, so the counts are the machine's own. */
const NO_CLOCK = 1_000_000_000;
const TIGHT = raiseCode('tight');

/**
 * The owner's trace (2026-10-10, 508 071 busy pool samples), read by `k-shares.py`: shares of the Tight raise
 * (`positionTrades`) and of all busy pool CPU.
 */
const TRACE = {
  tightOfBusy: 0.491,
  ratingOfTight: 0.384,
  ratingKillOrderOfTight: 0.18,
  killOrderOfTight: 0.345,
  sizerOfBusy: 0.004,
  sizerJournalsOfBusy: 0.0025,
};

type Phase = 'generate' | 'upgrades-default' | 'captains' | 'other';

interface RaiseCall {
  phase: Phase;
  job: number;
  tight: boolean;
  ms: number;
  key: string;
  scored: number;
  census: RaiseCensus;
}

interface JobCall {
  phase: Phase;
  kind: 'baseline' | 'probe' | 'captains' | 'plan' | 'positions';
  ms: number;
}

interface RunCensus {
  label: string;
  cpuMs: number;
  phaseCpu: Record<Phase, number>;
  raises: RaiseCall[];
  jobs: JobCall[];
  notes: Record<Phase, CensusNote[]>;
  sizerCalls: number;
}

const cpuMs = (usage: NodeJS.CpuUsage): number => (usage.user + usage.system) / 1000;
const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);
const median = (values: readonly number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
};
const f = (value: number, digits = 0): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
/** A cost in ms, or in µs below a hundredth of a ms (a rating costs well under one). */
const cost = (ms: number): string => (ms <= 0 ? '—' : ms < 0.01 ? `${f(ms * 1000, 3)} µs` : `${f(ms, 3)} ms`);
const pct = (part: number, whole: number): string => (whole > 0 ? `${f((100 * part) / whole, 2)} %` : '—');

/** Hits per stored entry over a list of keys in the order they were met: mean, median, max of (uses − 1). */
function perEntry(keys: readonly string[]): {
  entries: number;
  hits: number;
  mean: number;
  median: number;
  max: number;
} {
  const uses = new Map<string, number>();
  for (const key of keys) uses.set(key, (uses.get(key) ?? 0) + 1);
  const hits = [...uses.values()].map((n) => n - 1);
  return {
    entries: uses.size,
    hits: sum(hits),
    mean: uses.size > 0 ? sum(hits) / uses.size : 0,
    median: median(hits),
    max: hits.length > 0 ? Math.max(...hits) : 0,
  };
}

/** Least squares of ms = a + b · battles + c · ratings over the Tight searches (3 × 3 normal equations). */
function fitCosts(calls: readonly RaiseCall[]): { a: number; b: number; c: number } {
  const rows = calls.map((call) => [1, call.census.battles, call.census.ratings]);
  const m = [0, 1, 2].map((i) =>
    [0, 1, 2].map((j) => sum(rows.map((row) => (row[i] as number) * (row[j] as number)))),
  );
  const v = [0, 1, 2].map((i) => sum(rows.map((row, k) => (row[i] as number) * (calls[k] as RaiseCall).ms)));
  // Gaussian elimination with partial pivoting.
  const aug = m.map((row, i) => [...row, v[i] as number]);
  for (let col = 0; col < 3; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < 3; r += 1)
      if (Math.abs((aug[r] as number[])[col] as number) > Math.abs((aug[pivot] as number[])[col] as number))
        pivot = r;
    [aug[col], aug[pivot]] = [aug[pivot] as number[], aug[col] as number[]];
    const p = aug[col] as number[];
    for (let r = 0; r < 3; r += 1) {
      if (r === col) continue;
      const row = aug[r] as number[];
      const factor = (row[col] as number) / (p[col] as number);
      for (let k = col; k < 4; k += 1) row[k] = (row[k] as number) - factor * (p[k] as number);
    }
  }
  const x = aug.map((row, i) => (row[3] as number) / (row[i] as number));
  return { a: x[0] as number, b: x[1] as number, c: x[2] as number };
}

interface Exports {
  alloc(bytes: number): number;
  memory: WebAssembly.Memory;
  raiseCensus(outPtr: number): number;
}

/**
 * **Every kernel instance the run makes**, for the sizer's count (`raiseCensus`' sixth figure is the instance's
 * own total, never reset): held weakly, read after every job, the growth since the last read summed.
 */
function instanceCounter(): { sweep: () => void; total: () => number; restore: () => void } {
  const Original = WebAssembly.Instance;
  const live: WeakRef<Exports>[] = [];
  const read = new WeakMap<Exports, number>();
  let total = 0;
  const scratch = new WeakMap<Exports, number>();
  class Counted extends Original {
    constructor(module: WebAssembly.Module, imports?: WebAssembly.Imports) {
      super(module, imports);
      live.push(new WeakRef(this.exports as unknown as Exports));
    }
  }
  (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = Counted;
  const sweep = (): void => {
    for (let i = live.length - 1; i >= 0; i -= 1) {
      const raw = (live[i] as WeakRef<Exports>).deref();
      if (raw === undefined) {
        live.splice(i, 1);
        continue;
      }
      let at = scratch.get(raw);
      if (at === undefined) {
        at = raw.alloc(48);
        scratch.set(raw, at);
      }
      if (raw.raiseCensus(at) !== 1) continue;
      const now = new Float64Array(raw.memory.buffer, at, 6)[5] as number;
      total += now - (read.get(raw) ?? 0);
      read.set(raw, now);
    }
  };
  return {
    sweep,
    total: () => total,
    restore: () => {
      (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = Original;
    },
  };
}

/** The raise kernel's own input, as one key: what it packs, the base it stands on, the caps and the modes. */
function kernelKey(input: RaiseInput): string {
  const order = new Map(input.base.stacks.map((stack, index) => [stack.unitId, index]));
  const packed = packRequest(
    input.request,
    CAMPAIGN.markerRates,
    undefined,
    Int32Array.from(input.request.units, (unit) => order.get(unit.id) ?? -1),
  );
  return stableKey([
    Array.from(packed.table),
    input.base.stacks.map((stack) => [stack.unitId, stack.count]),
    input.request.caps,
    input.modes,
  ]);
}

async function censusOf(label: string, profile: Profile): Promise<RunCensus> {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error(`${label}: no active setup`);
  const module = loadProfileKernelModule();
  const counter = instanceCounter();
  const raise = createRaiseKernel(module);
  const raises: RaiseCall[] = [];
  const jobs: JobCall[] = [];
  let phase: Phase = 'generate';
  let job = 0;
  let overhead = 0;
  setKernel(createPlanKernel(module));
  setRaiseKernel({
    position(input: RaiseInput): RaiseAnswer | null {
      const began = performance.now();
      const answer = raise.position(input);
      const ms = performance.now() - began;
      if (answer?.census !== undefined) {
        const keyed = performance.now();
        raises.push({
          phase,
          job,
          tight: input.modes.authority === TIGHT,
          ms,
          key: kernelKey(input),
          scored: answer.scored,
          census: answer.census,
        });
        overhead += performance.now() - keyed;
      }
      return answer;
    },
  });

  /** One inline lane whose every job is timed and labelled (the pool runs one job at a time on it). */
  const lane = (): CalcClient => {
    const inner = { ...createInlineClient(), mode: 'worker' as const };
    const timed =
      <A extends unknown[], T>(run: (...args: A) => Promise<T>, kind: (...args: A) => JobCall['kind']) =>
      async (...args: A): Promise<T> => {
        job += 1;
        const began = performance.now();
        try {
          return await run(...args);
        } finally {
          jobs.push({ phase, kind: kind(...args), ms: performance.now() - began });
          counter.sweep();
        }
      };
    return {
      ...inner,
      plan: timed(inner.plan, () => 'plan'),
      positions: timed(inner.positions, () => 'positions'),
      probe: timed(inner.probe, (request) => (request.against === undefined ? 'baseline' : 'probe')),
      captains: timed(inner.captains, () => 'captains'),
    };
  };

  const notes = {} as Record<Phase, CensusNote[]>;
  const phaseCpu = {} as Record<Phase, number>;
  const input = buildPlanRequest(profile, setup);
  const request = buildStackRequest(profile, setup);
  const client = lane();
  const pool = createCalcPool({ size: 1, createClient: lane });
  const cpu0 = process.cpuUsage();
  const during = async <T>(name: Phase, work: () => Promise<T>): Promise<T> => {
    phase = name;
    const listening = startCensus();
    const began = process.cpuUsage();
    try {
      return await work();
    } finally {
      phaseCpu[name] = cpuMs(process.cpuUsage(began));
      notes[name] = listening.stop();
    }
  };
  try {
    // 1. generate: the plan, then the bar's Tight tables one after the other (the golden's `Promise.all`, timed).
    const { plan, headline } = await during('generate', async () => {
      const planned = await client.plan(input);
      const chosen = pickOf(planned, openingPosition(planned, null));
      const marchRequest = withMethod(request, 'elite');
      if (troopFloor(planMarch(request, chosen.counts).result) !== null) {
        noteCensus(() => ({
          kind: 'bar',
          keys: planned.alternatives.map((row) => pricingKey(marchRequest, countsKey(row.counts))),
        }));
        for (const row of planned.alternatives)
          await client.positions({ request: marchRequest, counts: row.counts });
      }
      return { plan: planned, headline: chosen.pick };
    });

    // 2. upgrades-default.
    const upgrades = await during('upgrades-default', () =>
      runAdvisor(input, genericProbes(), pool, { headline, budgetMs: NO_CLOCK }),
    );
    expect(upgrades.cut, `${label} upgrades-default`).toEqual([]);

    // 3. captains: the trio screen, then the lead trio's next stars and levels.
    await during('captains', async () => {
      const { currentKey, trios } = captainTrios(profile, setup);
      const advice = await runCaptainAdvice(
        input,
        trios.map(({ key, totals }) => ({ key, totals })),
        currentKey,
        pool,
        { budgetMs: NO_CLOCK },
      );
      expect(advice.cut, `${label} captains`).toEqual([]);
      const lead = leadTrio(advice.best, currentKey);
      const leadCandidate = trios.find((trio) => trio.key === lead);
      const leadStops = advice.plans[lead];
      if (leadCandidate === undefined || leadStops === undefined) return;
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
      expect(upgraded.cut, `${label} captain upgrades`).toEqual([]);
    });

    // 4. other: the five questions.
    await during('other', async () => {
      const { probes } = otherProbes(input, plan.silver);
      const other = await runAdvisor(input, probes, pool, { headline, budgetMs: NO_CLOCK });
      expect(other.cut, `${label} other`).toEqual([]);
    });
    counter.sweep();
    return {
      label,
      cpuMs: cpuMs(process.cpuUsage(cpu0)) - overhead,
      phaseCpu,
      raises,
      jobs,
      notes,
      sizerCalls: counter.total(),
    };
  } finally {
    pool.dispose();
    client.dispose();
    counter.restore();
    const release = loadKernelModule();
    setKernel(createPlanKernel(release));
    setRaiseKernel(createRaiseKernel(release));
  }
}

interface Verdictable {
  name: string;
  entries: string;
  hits: number;
  perEntry: string;
  missMs: number;
  savingMs: number;
  note: string;
}

function report(run: RunCensus): { markdown: string; rows: Verdictable[] } {
  const PHASES: Phase[] = ['generate', 'upgrades-default', 'captains', 'other'];
  const all = PHASES.flatMap((name) => run.notes[name] ?? []);
  const summary: CensusSummary = summariseCensus(all);
  const tight = run.raises.filter((call) => call.tight);
  const fit = fitCosts(tight);
  const tightMs = sum(tight.map((call) => call.ms));
  const raiseMs = sum(run.raises.map((call) => call.ms));
  const c = (key: keyof RaiseCensus, calls: readonly RaiseCall[] = run.raises): number =>
    sum(calls.map((call) => call.census[key]));
  const ratings = c('ratings', tight);
  const onHit = c('ratingsOnHit', tight);
  const ratingMsFit = fit.c;
  const ratingMsTrace = ratings > 0 ? (TRACE.ratingOfTight * tightMs) / ratings : 0;
  const ratingMs = ratingMsFit > 0 ? ratingMsFit : ratingMsTrace;
  const ratingShare = tightMs > 0 ? (ratingMs * ratings) / tightMs : 0;
  const killOrderMs = ratingMs * (TRACE.ratingKillOrderOfTight / TRACE.ratingOfTight);
  const perCall = tight
    .filter((call) => call.census.ratings - call.census.ratingsOnHit > 0)
    .map((call) => call.census.ratingsOnHit / (call.census.ratings - call.census.ratingsOnHit));

  // K3: the JS census's exact key, and the kernel's own input across jobs.
  const priced = PHASES.flatMap((name) =>
    (run.notes[name] ?? []).flatMap((note) => (note.kind === 'probe' ? note.priced : [])),
  );
  const exact = perEntry(priced.map((one) => one.key));
  const firstJob = new Map<string, number>();
  let crossJob = 0;
  let crossJobMs = 0;
  const probeRaises = run.raises.filter((call) => call.phase !== 'generate' && call.tight);
  for (const call of probeRaises) {
    const first = firstJob.get(call.key);
    if (first === undefined) firstJob.set(call.key, call.job);
    else if (first !== call.job) {
      crossJob += 1;
      crossJobMs += call.ms;
    }
  }
  const kernelK3 = perEntry(probeRaises.map((call) => call.key));
  const kernelK3Miss = median(probeRaises.map((call) => call.ms));

  // K4: the baselines.
  const baselineJobs = run.jobs.filter((one) => one.kind === 'baseline');
  const baselineKeys = all.flatMap((note) => (note.kind === 'baseline' ? [note.key] : []));
  const k4 = perEntry(baselineKeys);
  const baselineMs = median(baselineJobs.map((one) => one.ms));

  // K5: the bar's pricings priced again by a probe job — the exact key, and the kernel's.
  const barTight = run.raises.filter((call) => call.phase === 'generate' && call.tight);
  const barKernelKeys = new Set(barTight.map((call) => call.key));
  const k5Kernel = probeRaises.filter((call) => barKernelKeys.has(call.key));
  const barMs = median(barTight.map((call) => call.ms));

  const rows: Verdictable[] = [
    {
      name: 'K1 rated value memo',
      entries: f(ratings - onHit),
      hits: onHit,
      perEntry: `${f(onHit / Math.max(1, ratings - onHit), 2)} overall; per search mean ${f(sum(perCall) / Math.max(1, perCall.length), 2)}, median ${f(median(perCall), 2)}, max ${f(perCall.length > 0 ? Math.max(...perCall) : 0, 2)}`,
      missMs: ratingMs,
      savingMs: onHit * ratingMs,
      note: 'entries = rated misses (distinct rated vectors under the score memo); hits = ratingsOnHit',
    },
    {
      name: 'K2 shared kill order',
      entries: '— (refactor)',
      hits: ratings - onHit,
      perEntry: '1 per rated miss',
      missMs: killOrderMs,
      savingMs: (ratings - onHit) * killOrderMs,
      note: `duplicated killOrderBy = rated misses; cost = rating × ${f(TRACE.ratingKillOrderOfTight / TRACE.ratingOfTight, 2)} (trace's kill-order share of raiseRating)`,
    },
    {
      name: 'K3 shownMarch across jobs (exact request key)',
      entries: f(exact.entries),
      hits: summary.repricedAcrossJobs,
      perEntry: `mean ${f(exact.mean, 2)}, median ${f(exact.median, 1)}, max ${f(exact.max)}`,
      missMs: median(priced.map((one) => one.ms)),
      savingMs: summary.repricedMs,
      note: 'saving = Σ measured ms of the re-priced marches',
    },
    {
      name: 'K3 shownMarch across jobs (kernel input key)',
      entries: f(kernelK3.entries),
      hits: crossJob,
      perEntry: `mean ${f(kernelK3.mean, 2)}, median ${f(kernelK3.median, 1)}, max ${f(kernelK3.max)}`,
      missMs: kernelK3Miss,
      savingMs: crossJobMs,
      note: 'Tight raise calls whose packed input an earlier job already raised; saving = Σ measured ms of those calls',
    },
    {
      name: 'K4 baseline across passes',
      entries: f(k4.entries),
      hits: k4.hits,
      perEntry: `mean ${f(k4.mean, 2)}, median ${f(k4.median, 1)}, max ${f(k4.max)}`,
      missMs: baselineMs,
      savingMs: k4.hits * baselineMs,
      note: `${String(baselineJobs.length)} baseline jobs, median measured`,
    },
    {
      name: 'K5 Generate ↔ advisor (exact key)',
      entries: f(summary.barPricings),
      hits: summary.barRepricedByProbes,
      perEntry: '—',
      missMs: barMs,
      savingMs: summary.barRepricedByProbes * barMs,
      note: 'bar keys a probe job priced again',
    },
    {
      name: 'K5 Generate ↔ advisor (kernel input key)',
      entries: f(barKernelKeys.size),
      hits: k5Kernel.length,
      perEntry: `${f(k5Kernel.length / Math.max(1, barKernelKeys.size), 2)} mean`,
      missMs: barMs,
      savingMs: sum(k5Kernel.map((call) => call.ms)),
      note: 'probe Tight raises on a bar march; saving = Σ their measured ms',
    },
    {
      name: 'K6 sizer journals fused',
      entries: '— (refactor)',
      hits: run.sizerCalls,
      perEntry: '—',
      missMs: 0,
      savingMs: (TRACE.sizerJournalsOfBusy / 2) * run.cpuMs,
      note: `calls = sizerScore + buildStacks (one counter); ceiling = one of the two journals, trace ${f(100 * TRACE.sizerJournalsOfBusy, 2)} % of busy pool CPU for both`,
    },
  ];

  const lines: string[] = [];
  lines.push(`## ${run.label}\n`);
  lines.push(
    `Run CPU **${f(run.cpuMs)} ms** (one lane, census hashing removed): generate ${f(run.phaseCpu.generate)}, upgrades-default ${f(run.phaseCpu['upgrades-default'])}, captains ${f(run.phaseCpu.captains)}, other ${f(run.phaseCpu.other)} ms. Jobs: ${String(run.jobs.length)} (${String(baselineJobs.length)} baselines, ${String(run.jobs.filter((one) => one.kind === 'probe').length)} probes). Raise calls: ${String(run.raises.length)} (${String(tight.length)} Tight), ${f(raiseMs)} ms = ${pct(raiseMs, run.cpuMs)} of the run; Tight ${f(tightMs)} ms = ${pct(tightMs, run.cpuMs)}.\n`,
  );
  lines.push('### The raise searches\n');
  lines.push('| | all | Tight |');
  lines.push('|---|---:|---:|');
  const both = (key: keyof RaiseCensus): string => `${f(c(key))} | ${f(c(key, tight))}`;
  lines.push(`| calls | ${String(run.raises.length)} | ${String(tight.length)} |`);
  lines.push(
    `| scored (vectors asked) | ${f(sum(run.raises.map((r) => r.scored)))} | ${f(sum(tight.map((r) => r.scored)))} |`,
  );
  lines.push(`| battles (≈ distinct vectors battled, memo misses) | ${both('battles')} |`);
  lines.push(`| ratings | ${both('ratings')} |`);
  lines.push(`| of which on a memo hit | ${both('ratingsOnHit')} |`);
  lines.push(`| kill orders from battles | ${both('killOrdersScore')} |`);
  lines.push(`| kill orders from ratings | ${both('killOrdersRating')} |`);
  lines.push(`| sizer kill orders (all kernel instances) | ${f(run.sizerCalls)} | — |`);
  lines.push(`| ms | ${f(raiseMs)} | ${f(tightMs)} |`);
  lines.push('');
  lines.push(
    `Fit over the ${String(tight.length)} Tight searches: ms = ${f(fit.a, 3)} + ${f(fit.b * 1000, 3)} µs · battles + ${f(fit.c * 1000, 3)} µs · ratings. A rating costs **${f(ratingMs * 1000, 3)} µs** (${ratingMsFit > 0 ? 'fit' : 'trace share, the fit was not positive'}; the trace's share gives ${f(ratingMsTrace * 1000, 3)} µs); **raiseRating is ${pct(ratingShare, 1)} of the rated searches' time** (trace: ${f(100 * TRACE.ratingOfTight, 1)} %).\n`,
  );
  lines.push(
    `**Against the trace**: the Tight raise is ${pct(tightMs, run.cpuMs)} of this run's CPU, the trace's pool workers spent ${f(100 * TRACE.tightOfBusy, 1)} % in it. Every candidate whose miss cost comes from the raise reads on this run's own clock, so its share here is the in-process one; see the verdict section of the plan for what the gap means.\n`,
  );
  lines.push('### The JS census\n');
  lines.push(
    '| phase | jobs | shows | read hits | priced | re-priced across jobs | ms | baselines | repeated |',
  );
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const name of PHASES) {
    const s = summariseCensus(run.notes[name] ?? []);
    lines.push(
      `| ${name} | ${String(s.jobs)} | ${String(s.shows)} | ${String(s.readHits)} | ${String(s.priced)} | ${String(s.repricedAcrossJobs)} | ${f(s.repricedMs)} | ${String(s.baselines)} | ${String(s.repeatedBaselines)} |`,
    );
  }
  lines.push(
    `| **run** | ${String(summary.jobs)} | ${String(summary.shows)} | ${String(summary.readHits)} | ${String(summary.priced)} (${String(summary.distinctPriced)} distinct) | ${String(summary.repricedAcrossJobs)} | ${f(summary.repricedMs)} | ${String(summary.baselines)} | ${String(summary.repeatedBaselines)} |`,
  );
  lines.push('');
  lines.push('### The candidates\n');
  lines.push(
    '| candidate | entries | hits | hits per entry | miss cost | projected saving | share of run CPU | how |',
  );
  lines.push('|---|---:|---:|---|---:|---:|---:|---|');
  for (const row of rows) {
    lines.push(
      `| ${row.name} | ${row.entries} | ${f(row.hits)} | ${row.perEntry} | ${cost(row.missMs)} | ${f(row.savingMs)} ms | **${pct(row.savingMs, run.cpuMs)}** | ${row.note} |`,
    );
  }
  lines.push('');
  return { markdown: lines.join('\n'), rows };
}

function accountProfile(): Profile | null {
  if (!existsSync(ACCOUNT)) return null;
  const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

describe.skipIf(!process.env.THEORY)('196 — the cache census', () => {
  it(
    'counts what each candidate cache would be hit by, on the owner fixture and the profiled account',
    async () => {
      const owner = ownerProfile();
      expect(owner, 'the committed owner fixture').not.toBeNull();
      const runs: RunCensus[] = [];
      if (owner !== null) runs.push(await censusOf('Exactness fixture (owner export 2026-09-17)', owner));
      const account = accountProfile();
      if (account !== null)
        runs.push(await censusOf(`Timing fixture (\`${ACCOUNT}\`, not committed)`, account));

      const sections = runs.map(report);
      const out = [
        '# 196 — the cache census\n',
        `W18 P0.3 (\`docs/plans/profile-drilldown.md\`). Run ${new Date().toISOString().slice(0, 10)}: the profiling run's work (Generate + upgrades-default + captains + other) in-process on one lane, no clock, profile kernel. Projected saving = hits × measured miss cost. The trace figures (Tight raise ${f(100 * TRACE.tightOfBusy, 1)} % of busy pool CPU, raiseRating ${f(100 * TRACE.ratingOfTight, 1)} % of it, its kill order ${f(100 * TRACE.ratingKillOrderOfTight, 1)} %, sizerScore ${f(100 * TRACE.sizerOfBusy, 2)} % of busy) are from \`.maestro/playbooks/Working/w18/k-shares.py\`.\n`,
        account === null ? `The timing fixture \`${ACCOUNT}\` is absent: one fixture only.\n` : '',
        ...sections.map((section) => section.markdown),
      ].join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
      for (const run of runs) expect(run.raises.length, run.label).toBeGreaterThan(0);
    },
    60 * 60_000,
  );
});
