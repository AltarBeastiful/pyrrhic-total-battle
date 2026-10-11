/**
 * **The progression advisor's pass** (W17 C3, `docs/plans/progression-advisor.md` §4): the baseline and every
 * probe, each a whole plan read as the March shows it (`runProbe`), run over the calculation pool and ranked
 * by the reading of `src/engine/advisor.ts`.
 *
 * It lives beside the pool rather than in `src/engine/`, which imports neither the config nor the workers: the
 * pass needs both — `CAMPAIGN.budgets.extra` and `CAMPAIGN.markerRates`, and a pool to run on.
 *
 * - **The baseline is planned here, first**, under the probes' own settings (owner, 2026-10-07), never taken
 *   from the main plan: every probe job reads its stops against it. It is the pass's first job, not a step of
 *   its own (W18 P1.2): the probes the other workers start meanwhile plan and show their bars, and read them
 *   once the baseline is known; every later probe is one round trip.
 * - **No job carries a clock** (W17 A0): `budgetMs` is taken off the input, so a phone and a desktop give one
 *   answer. The 20 s is the pool's, for the whole pass, and every job it did not finish is reported cut.
 * - **Results are merged by probe, never by arrival** (§1 rule 2), and ranked with ties in probe order, so one
 *   worker and six give the same list.
 */
import { CAMPAIGN } from '@/config';
import { probeInfo, rankAdvice, type AdvisorRow, type ProbeInfo, type ShownStop } from '@/engine/advisor';
import type { CampaignInput, PlanPick } from '@/engine/plan';
import { isCampaignProbe, type CampaignProbe } from '@/engine/advisor-sweeps';
import type { Probe } from '@/engine/probes';
import type { MarkerRates } from '@/engine/rating';

import { CENSUS, noteCensus, stableKey } from './census';
import type { CalcPool, PoolJob, PoolOutcome } from './pool';
import type { ProbeAnswer, ProbeReading } from './protocol';

export interface AdvisorOptions {
  /** Aborting it rejects the pass with an `AbortError` and stops every job (a new Generate, the Cancel button). */
  signal?: AbortSignal | undefined;
  /** Called as each job settles, with how many of the pass's jobs — the baseline and every probe — are done. */
  onProgress?: ((done: number, total: number) => void) | undefined;
  /** The whole pass's clock; `CAMPAIGN.budgets.extra` by default. */
  budgetMs?: number | undefined;
  /** The stop the rows are ranked on: the one selected on the bar, the sweet spot by default (`headlineOf`). */
  headline?: PlanPick | undefined;
  /** The owner's rating; `CAMPAIGN.markerRates` by default. */
  rates?: MarkerRates | undefined;
  /**
   * Read every march one way and skip the screen: `tight` (the March's own) or `as-is` (no raise). For
   * experiments; the app leaves it out and gets the screened pass.
   */
  reading?: ProbeReading | undefined;
  /** The screen's rule (`CAMPAIGN.advisorScreen` by default); `null` reads every probe by Tight, in one pass. */
  screen?: { top: number; share: number } | null | undefined;
}

export interface AdvisorResult {
  /** The baseline's bar as shown, which every row is read against; `null` when the clock cut it. */
  baseline: ShownStop[] | null;
  /** The probes read, ranked by their headline stop's gain. */
  rows: AdvisorRow[];
  /** The probes the pass's clock stopped before they finished, in probe order. */
  cut: ProbeInfo[];
  /** The probes whose job failed, in probe order, with what it said. */
  failed: AdvisorFailure[];
}

export interface AdvisorFailure {
  probe: ProbeInfo;
  message: string;
}

/** The settings every job of a pass plans under: the input's own, with no clock and nothing a worker can't take. */
function settingsOf(input: CampaignInput): CampaignInput {
  const settings = { ...input };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

/** What one pass over the pool settled: the baseline's outcome and each probe's, in probe order. */
interface Pass {
  first: PoolOutcome<ProbeAnswer> | undefined;
  probed: PoolOutcome<ProbeAnswer>[];
}

interface PassOptions {
  reading: ProbeReading;
  rates: MarkerRates;
  signal: AbortSignal | undefined;
  budgetMs: number;
  onSettled: () => void;
  /**
   * The bars an earlier pass already planned (the screen's): the baseline's, and each probe's by index. A job
   * given its bar does not plan; it reads the same counts again under `reading` (`reread`).
   */
  seed?: { baseline: ShownStop[]; bars: Map<number, ShownStop[]> } | undefined;
}

/**
 * One pass: the baseline and every probe as pool jobs, read under one `reading`. The baseline goes out with the
 * probes (W18 P1.2): a probe started before the baseline is known plans and shows its bar at once, and reads it
 * against the baseline in a second call once it is. Rejects when the baseline fails or `signal` aborts.
 */
async function runPass(
  settings: CampaignInput,
  probes: readonly (Probe | CampaignProbe)[],
  indices: readonly number[],
  pool: CalcPool,
  { reading, rates, signal, budgetMs, onSettled, seed }: PassOptions,
): Promise<Pass> {
  // The baseline's settings, for the profiling run's census only (`census.ts`).
  if (CENSUS) noteCensus(() => ({ kind: 'baseline', pass: 'advisor', key: stableKey(settings) }));
  let known: ShownStop[] | null = null;
  const failure: { error?: Error } = {};
  let baselineIs!: (stops: ShownStop[]) => void;
  let baselineFails!: (error: unknown) => void;
  const baselineReady = new Promise<ShownStop[]>((resolve, reject) => {
    baselineIs = resolve;
    baselineFails = reject;
  });
  baselineReady.catch(() => undefined);
  // A failed baseline stops the pass at once: nothing can be read without it.
  const stopPass = new AbortController();
  const onCancel = (): void => stopPass.abort();
  signal?.addEventListener('abort', onCancel, { once: true });
  if (signal?.aborted === true) stopPass.abort();

  const baselineJob: PoolJob<ProbeAnswer> = async (client, jobSignal) => {
    try {
      const answer = await client.probe(
        seed === undefined
          ? { plan: settings, reading }
          : { plan: settings, reading, shown: seed.baseline, reread: true },
        jobSignal,
      );
      known = answer.stops;
      baselineIs(answer.stops);
      return answer;
    } catch (error) {
      baselineFails(error);
      if (!jobSignal.aborted) {
        failure.error = error instanceof Error ? error : new Error(String(error));
        stopPass.abort();
      }
      throw error;
    }
  };
  const probeJobs = indices.map((index): PoolJob<ProbeAnswer> => {
    const probe = probes[index];
    if (probe === undefined) throw new Error(`no probe ${String(index)}`);
    const plan = isCampaignProbe(probe)
      ? probe.applyInput(settings)
      : { ...settings, request: probe.apply(settings.request) };
    const info = probeInfo(probe);
    const bar = seed?.bars.get(index);
    return async (client, jobSignal) => {
      if (known !== null && bar === undefined)
        return client.probe({ plan, reading, against: { probe: info, baseline: known, rates } }, jobSignal);
      const own = await client.probe(
        bar === undefined ? { plan, reading } : { plan, reading, shown: bar, reread: true },
        jobSignal,
      );
      const baseline = await baselineReady;
      return client.probe(
        { plan, reading, against: { probe: info, baseline, rates }, shown: own.stops },
        jobSignal,
      );
    };
  });

  try {
    const outcomes = await pool.map([baselineJob, ...probeJobs], {
      budgetMs,
      signal: stopPass.signal,
      onSettled,
    });
    const [first, ...probed] = outcomes;
    return { first, probed };
  } catch (error) {
    throw failure.error ?? error;
  } finally {
    signal?.removeEventListener('abort', onCancel);
  }
}

/** The rows a pass read, its cut probes and its failed ones, each in probe order. */
function sortOutcomes(
  probed: readonly PoolOutcome<ProbeAnswer>[],
  indices: readonly number[],
  infos: readonly ProbeInfo[],
): { rows: Map<number, AdvisorRow>; cut: number[]; failed: { index: number; message: string }[] } {
  const rows = new Map<number, AdvisorRow>();
  const cut: number[] = [];
  const failed: { index: number; message: string }[] = [];
  probed.forEach((outcome, at) => {
    const index = indices[at];
    if (index === undefined || infos[index] === undefined) return;
    if (outcome.kind === 'error') failed.push({ index, message: outcome.message });
    // A job cancelled inside its worker answers with no row: it did not finish, which is what a cut is.
    else if (outcome.kind === 'cut' || outcome.value.row === null) cut.push(index);
    else rows.set(index, outcome.value.row);
  });
  return { rows, cut, failed };
}

/**
 * **Which probes the screen sends on to the Tight reading** (`CAMPAIGN.advisorScreen`,
 * `docs/plans/screen-then-tight.md`): a probe whose best stop gains at least `share` of the best probe's best
 * stop, always the `top` best, never one that gains nothing. Ties keep probe order.
 */
export function screenSurvivors(
  rows: ReadonlyMap<number, AdvisorRow>,
  screen: { top: number; share: number },
): Set<number> {
  const best = (row: AdvisorRow): number => Math.max(0, ...row.stops.map((stop) => stop.gain));
  const ranked = [...rows.entries()].sort((a, b) => best(b[1]) - best(a[1]) || a[0] - b[0]);
  const floor = (ranked[0] === undefined ? 0 : best(ranked[0][1])) * screen.share;
  return new Set(
    ranked
      .filter(([, row], at) => best(row) > 0 && (at < screen.top || best(row) >= floor))
      .map(([index]) => index),
  );
}

/**
 * Run the advisor over `probes`: the baseline first, then every probe as one pool job, all in one pass under
 * one clock. Rejects when the baseline itself fails (nothing can be read without it) or when `signal` aborts.
 *
 * **Screened** (`options.screen`, the default `CAMPAIGN.advisorScreen`; owner, 2026-10-11): the whole pass is
 * first read **As is** (the plan's counts battled untouched, no Tight raise), which ranks the probes as Tight
 * does at a part of the cost (experiment 202). The probes that pass `screenSurvivors`, and the baseline, are
 * then read **again by Tight on the very bars the screen planned** (no second plan, `reread`), so their rows
 * are exactly the rows an unscreened pass gives. A probe the screen dropped keeps its As-is row, marked
 * `screened`: its gain was too small to be worth a Tight reading. `screen: null` reads every probe by Tight.
 */
export async function runAdvisor(
  input: CampaignInput,
  probes: readonly (Probe | CampaignProbe)[],
  pool: CalcPool,
  options: AdvisorOptions = {},
): Promise<AdvisorResult> {
  const { signal, onProgress } = options;
  const budgetMs = options.budgetMs ?? CAMPAIGN.budgets.extra;
  const rates = options.rates ?? CAMPAIGN.markerRates;
  const screen = options.screen === undefined ? CAMPAIGN.advisorScreen : options.screen;
  const settings = settingsOf(input);
  const infos = probes.map(probeInfo);
  const all = probes.map((_, index) => index);
  const began = Date.now();
  let done = 0;
  let total = probes.length + 1;
  const onSettled = (): void => {
    done += 1;
    onProgress?.(done, total);
  };

  // Without a screen, or with a reading asked for outright: one pass.
  const reading = options.reading ?? (screen === null ? 'tight' : 'as-is');
  const first = await runPass(settings, probes, all, pool, { reading, rates, signal, budgetMs, onSettled });
  if (first.first?.kind !== 'done') return { baseline: null, rows: [], cut: infos, failed: [] };
  const sorted = sortOutcomes(first.probed, all, infos);
  const failedOf = (): AdvisorFailure[] =>
    sorted.failed.map(({ index, message }) => ({ probe: infos[index] as ProbeInfo, message }));
  const cutOf = (): ProbeInfo[] => sorted.cut.map((index) => infos[index] as ProbeInfo);
  const inOrder = (rows: Map<number, AdvisorRow>): AdvisorRow[] =>
    all.flatMap((index) => rows.get(index) ?? []);

  if (options.reading !== undefined || screen === null) {
    return {
      baseline: first.first.value.stops,
      rows: rankAdvice(inOrder(sorted.rows), options.headline),
      cut: cutOf(),
      failed: failedOf(),
    };
  }

  // The second stage: Tight on the survivors, on the bars the screen planned.
  const survivors = screenSurvivors(sorted.rows, screen);
  const picked = all.filter((index) => survivors.has(index));
  total = probes.length + 1 + picked.length + 1;
  const bars = new Map<number, ShownStop[]>();
  const stops = new Map<number, ShownStop[]>();
  first.probed.forEach((outcome, index) => {
    if (outcome.kind === 'done') stops.set(index, outcome.value.stops);
  });
  for (const index of picked) {
    const bar = stops.get(index);
    if (bar !== undefined) bars.set(index, bar);
  }
  const second = await runPass(settings, probes, picked, pool, {
    reading: 'tight',
    rates,
    signal,
    budgetMs: Math.max(1, budgetMs - (Date.now() - began)),
    onSettled,
    seed: { baseline: first.first.value.stops, bars },
  });
  const tight = sortOutcomes(second.probed, picked, infos);
  const rows = new Map<number, AdvisorRow>();
  for (const [index, row] of sorted.rows)
    rows.set(index, tight.rows.get(index) ?? { ...row, screened: true });
  // A survivor the clock or a failure stopped in the second stage did not finish: cut or failed, not screened.
  for (const index of [...tight.cut, ...tight.failed.map((one) => one.index)]) rows.delete(index);
  if (second.first?.kind !== 'done') {
    // No Tight baseline to read against: the screen's rows stand, each marked as screened.
    return {
      baseline: first.first.value.stops,
      rows: rankAdvice(
        inOrder(new Map([...sorted.rows].map(([i, row]) => [i, { ...row, screened: true }]))),
        options.headline,
      ),
      cut: cutOf(),
      failed: failedOf(),
    };
  }
  return {
    baseline: second.first.value.stops,
    rows: rankAdvice(inOrder(rows), options.headline),
    cut: [...sorted.cut, ...tight.cut].sort((a, b) => a - b).map((index) => infos[index] as ProbeInfo),
    failed: [...sorted.failed, ...tight.failed]
      .sort((a, b) => a.index - b.index)
      .map(({ index, message }) => ({ probe: infos[index] as ProbeInfo, message })),
  };
}
