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
 *   worker and six give the same list. The probes **start longest first** (`jobOrder.ts`, W18 P1.3), which only
 *   changes which probes a binding clock cuts.
 */
import { CAMPAIGN } from '@/config';
import { probeInfo, rankAdvice, type AdvisorRow, type ProbeInfo, type ShownStop } from '@/engine/advisor';
import type { CampaignInput, PlanPick } from '@/engine/plan';
import { isCampaignProbe, type CampaignProbe } from '@/engine/advisor-sweeps';
import type { Probe } from '@/engine/probes';
import type { MarkerRates } from '@/engine/rating';

import { CENSUS, noteCensus, stableKey } from './census';
import { expectedCosts, longestFirst, mapInOrder, planSize, timeInto, type JobTimes } from './jobOrder';
import type { CalcPool, PoolJob, PoolOutcome } from './pool';
import type { ProbeAnswer } from './protocol';

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

/** Each probe's job time on the last pass that ran it, by probe id: the start order of the next (W18 P1.3). */
const PROBE_TIMES: JobTimes = new Map();

/** The settings every job of a pass plans under: the input's own, with no clock and nothing a worker can't take. */
function settingsOf(input: CampaignInput): CampaignInput {
  const settings = { ...input };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

/**
 * Run the advisor over `probes`: the baseline first, then every probe as one pool job, all in one pass under
 * one clock.
 * Rejects when the baseline itself fails (nothing can be read without it) or when `signal` aborts.
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
  const settings = settingsOf(input);
  const infos = probes.map(probeInfo);
  const total = probes.length + 1;
  let done = 0;
  const onSettled = (): void => {
    done += 1;
    onProgress?.(done, total);
  };

  // The baseline's settings, for the profiling run's census only (`census.ts`).
  if (CENSUS) noteCensus(() => ({ kind: 'baseline', pass: 'advisor', key: stableKey(settings) }));
  // The baseline and the probes go out as one pass (W18 P1.2): a probe started before the baseline is known
  // plans and shows its bar at once, and reads it against the baseline in a second call once it is.
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
      const answer = await client.probe({ plan: settings }, jobSignal);
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
  const oneCall =
    (
      plan: CampaignInput,
      info: ProbeInfo,
      baseline: ShownStop[],
      shown?: ShownStop[],
    ): PoolJob<ProbeAnswer> =>
    (client, jobSignal) =>
      client.probe({ plan, against: { probe: info, baseline, rates }, shown }, jobSignal);
  const plans = probes.map((probe) =>
    isCampaignProbe(probe)
      ? probe.applyInput(settings)
      : { ...settings, request: probe.apply(settings.request) },
  );
  const probeJobs = probes.map((probe, index): PoolJob<ProbeAnswer> => {
    const plan = plans[index] ?? settings;
    const info = probeInfo(probe);
    return async (client, jobSignal) => {
      // Timed without its wait for the baseline: the next pass orders on the probe's own work.
      if (known !== null)
        return timeInto(oneCall(plan, info, known), info.id, PROBE_TIMES)(client, jobSignal);
      const began = performance.now();
      const own = await client.probe({ plan }, jobSignal);
      const planned = performance.now() - began;
      const baseline = await baselineReady;
      const read = timeInto(oneCall(plan, info, baseline, own.stops), info.id, PROBE_TIMES);
      const answer = await read(client, jobSignal);
      PROBE_TIMES.set(info.id, planned + (PROBE_TIMES.get(info.id) ?? 0));
      return answer;
    };
  });
  // Longest probes first (W18 P1.3), the baseline ahead of them all: every probe waits on it.
  const costs = expectedCosts(
    infos.map((info) => info.id),
    PROBE_TIMES,
    plans.map(planSize),
  );
  const order = [0, ...longestFirst(costs).map((index) => index + 1)];

  let outcomes: PoolOutcome<ProbeAnswer>[];
  try {
    outcomes = await mapInOrder(pool, [baselineJob, ...probeJobs], order, {
      budgetMs,
      signal: stopPass.signal,
      onSettled,
    });
  } catch (error) {
    throw failure.error ?? error;
    throw error;
  } finally {
    signal?.removeEventListener('abort', onCancel);
  }
  const [first, ...probed] = outcomes;
  if (first?.kind !== 'done') return { baseline: null, rows: [], cut: infos, failed: [] };
  const baseline = first.value.stops;

  const rows: AdvisorRow[] = [];
  const cut: ProbeInfo[] = [];
  const failed: AdvisorFailure[] = [];
  probed.forEach((outcome, index) => {
    const probe = infos[index];
    if (probe === undefined) return;
    if (outcome.kind === 'error') failed.push({ probe, message: outcome.message });
    // A job cancelled inside its worker answers with no row: it did not finish, which is what a cut is.
    else if (outcome.kind === 'cut' || outcome.value.row === null) cut.push(probe);
    else rows.push(outcome.value.row);
  });
  return { baseline, rows: rankAdvice(rows, options.headline), cut, failed };
}
