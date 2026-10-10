/**
 * **Generate, then every question the advisor can ask, measured** (owner, 2026-10-10: *"a generate with all
 * questions options … a simple profiling in devtools"*). Loaded on the press of the profiling
 * button (`ProfileAllButton.tsx`), never otherwise.
 *
 * The phases run **one after the other**, not together, so each reads as its own stretch of the profile and of
 * the Performance panel's Timings track (`performance.measure`, named `pyrrhic:<phase>`):
 *
 *  1. `generate`: the plan, the opening stop and the bar's Tight tables (`runGenerate`);
 *  2. `upgrades-default`: the generic probes (`computeAdvice('default')`);
 *  3. `upgrades-mine`: the typed upgrades, when any are typed;
 *  4. `captains`: the trio screen and the star / level pass, when a captain is owned;
 *  5. `other`: the dominance and leadership sweeps, next tier, merc stock, horizon, silver.
 *
 * There is no `console.profile` any more (owner, 2026-10-10: Chrome's own saved profile was empty and buggy; it
 * only sees the page's thread, which idles while the pool works). The report is the tables and the trace file.
 * **The workers and the kernel**: each worker times its jobs and reports them (`worker/jobTiming.ts`, dev or
 * `VITE_PROFILING=1` builds only), so the second table adds the workers' CPU per job kind and how many were busy.
 * Run `pnpm dev:profile` to have the kernel's functions named in the Performance panel (`kernel/asconfig.json`).
 *
 * It reads and writes the same stores the March card does, so what is on screen afterwards is what a player
 * who pressed every button would see. Display only: no rating, constant or plan is touched.
 */
import { distinctCaptains } from '@/engine/captains';
import { buildPlanRequest } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { startCensus, summariseCensus, type CensusNote, type CensusSummary } from '@/worker/census';
import {
  collectJobTimings,
  DEEP_PROFILING,
  summarise,
  type JobRow,
  type JobTiming,
  type PhaseRow,
  type PhaseSpan,
} from '@/worker/jobTiming';

import { advisorKey, canAdvise, computeAdvice } from './advisorSearch';
import { captainKey, computeCaptains } from './captainSearch';
import { runGenerate } from './generate';
import { downloadTrace, traceOf } from './profileTrace';
import { computeOther, otherKey } from './otherSearch';
import { pickOf, useRunStore } from './runStore';

export interface ProfileReport {
  /** Wall time on the page, CPU time in the workers and how many were busy, per phase. */
  phases: PhaseRow[];
  /** The workers' jobs summed per phase and kind (empty unless the build has the deep profiling in it). */
  jobs: JobRow[];
  /** The cache census of the run (`worker/census.ts`), in a build with the deep profiling only. */
  census?: CensusSummary;
}

/**
 * `DEEP_PROFILING`, read here rather than imported for the census: the bundler folds a module's own constant
 * before it splits chunks, an imported one only after, which would leave the census helpers in production.
 */
const COUNTING = import.meta.env.DEV || import.meta.env.VITE_PROFILING === '1';

async function phase(name: string, spans: PhaseSpan[], work: () => Promise<void>): Promise<void> {
  const began = performance.now();
  const start = Date.now();
  try {
    await work();
  } finally {
    performance.measure(`pyrrhic:${name}`, { start: began, end: performance.now() });
    spans.push({ phase: name, start, end: Date.now() });
  }
}

/** The questions there is something to ask, one after the other, each as its own phase. */
async function runPhases(spans: PhaseSpan[]): Promise<void> {
  await phase('generate', spans, runGenerate);

  const state = useStore.getState();
  const profile = selectActiveProfile(state);
  const setup = selectActiveSetup(state);
  const { plan, planPick } = useRunStore.getState();
  if (profile === undefined || setup === undefined || plan === null) return;
  if (!canAdvise()) return;

  const input = buildPlanRequest(profile, setup);
  const headline = pickOf(plan, planPick).pick;
  const upgrades = profile.upgrades;

  await phase('upgrades-default', spans, () =>
    computeAdvice('default', advisorKey(plan, input), input, headline),
  );
  if (upgrades.length > 0) {
    await phase('upgrades-mine', spans, () =>
      computeAdvice('mine', advisorKey(plan, input, upgrades), input, headline, upgrades),
    );
  }
  if (distinctCaptains(profile.sources.captains).length > 0) {
    await phase('captains', spans, () =>
      computeCaptains(captainKey(plan, input, profile, setup), input, profile, setup),
    );
  }
  await phase('other', spans, () => computeOther(otherKey(plan, input), input, plan.silver, headline));
}

/**
 * Run everything once and print the report: a table of the phases and one of
 * the workers' jobs. A phase with nothing to ask is skipped. The jobs table is empty in a build without the deep
 * profiling (`DEEP_PROFILING`, `jobTiming.ts`), and the table says so.
 */
export async function profileEverything(): Promise<ProfileReport> {
  const spans: PhaseSpan[] = [];
  const collector = collectJobTimings();
  const pageCensus = COUNTING ? startCensus() : null;
  let heard: JobTiming[];
  let noted: CensusNote[];
  try {
    await runPhases(spans);
  } finally {
    // The last worker messages can land a moment after the last `await`.
    await new Promise((resolve) => setTimeout(resolve, 150));
    heard = collector.stop();
    noted = pageCensus?.stop() ?? [];
  }
  const report: ProfileReport = summarise(spans, heard);
  // eslint-disable-next-line no-console -- the tables are the report
  console.table(report.phases);
  if (DEEP_PROFILING) {
    // eslint-disable-next-line no-console -- the tables are the report
    console.table(report.jobs);
  } else {
    // eslint-disable-next-line no-console -- say why there is no second table
    console.info(
      'Pyrrhic profile: no per-job table; this build has no worker timing (pnpm dev, or VITE_PROFILING=1).',
    );
  }
  if (COUNTING) {
    report.census = summariseCensus([...noted, ...heard.flatMap((one) => one.census ?? [])]);
    // eslint-disable-next-line no-console -- the tables are the report
    console.table(report.census);
  }
  // The trace: every worker's jobs and the page's phases, as a file for the Performance panel (Load profile…)
  // or https://ui.perfetto.dev. the pool is not on the page's thread.
  const trace = traceOf(spans, heard);
  if (DEEP_PROFILING) downloadTrace(trace);
  // Also on `window`, so the numbers can be read back from the console or a script.
  Object.assign(globalThis, { pyrrhicProfile: report, pyrrhicTrace: trace });
  return report;
}
