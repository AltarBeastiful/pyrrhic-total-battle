/**
 * **The progression advisor's pass** (W17 C3, `docs/plans/progression-advisor.md` §4): the baseline and every
 * probe, each a whole plan read as the March shows it (`runProbe`), run over the calculation pool and ranked
 * by the reading of `src/engine/advisor.ts`.
 *
 * It lives beside the pool rather than in `src/engine/`, which imports neither the config nor the workers: the
 * pass needs both — `CAMPAIGN.budgets.extra` and `CAMPAIGN.markerRates`, and a pool to run on.
 *
 * - **The baseline is planned here, first**, under the probes' own settings (owner, 2026-10-07), never taken
 *   from the main plan: every probe job reads its stops against it, so it is one job ahead of the others, and
 *   each probe is then one round trip.
 * - **No job carries a clock** (W17 A0): `budgetMs` is taken off the input, so a phone and a desktop give one
 *   answer. The 20 s is the pool's, for the whole pass, and every job it did not finish is reported cut.
 * - **Results are merged by probe, never by arrival** (§1 rule 2), and ranked with ties in probe order, so one
 *   worker and six give the same list.
 */
import { CAMPAIGN } from '@/config';
import { probeInfo, rankAdvice, type AdvisorRow, type ProbeInfo, type ShownStop } from '@/engine/advisor';
import type { CampaignInput, PlanPick } from '@/engine/plan';
import type { Probe } from '@/engine/probes';
import type { MarkerRates } from '@/engine/rating';

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

/** The settings every job of a pass plans under: the input's own, with no clock and nothing a worker can't take. */
function settingsOf(input: CampaignInput): CampaignInput {
  const settings = { ...input };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

/**
 * Run the advisor over `probes`: the baseline first, then every probe as one pool job, all under one clock.
 * Rejects when the baseline itself fails (nothing can be read without it) or when `signal` aborts.
 */
export async function runAdvisor(
  input: CampaignInput,
  probes: readonly Probe[],
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
  const began = performance.now();

  const baselineJob: PoolJob<ProbeAnswer> = (client, jobSignal) =>
    client.probe({ plan: settings }, jobSignal);
  const [first] = await pool.map([baselineJob], { budgetMs, signal, onSettled });
  if (first?.kind === 'error') throw new Error(first.message);
  if (first?.kind !== 'done') return { baseline: null, rows: [], cut: infos, failed: [] };
  const baseline = first.value.stops;

  const jobs = probes.map(
    (probe): PoolJob<ProbeAnswer> =>
      (client, jobSignal) =>
        client.probe(
          {
            plan: { ...settings, request: probe.apply(settings.request) },
            against: { probe: probeInfo(probe), baseline, rates },
          },
          jobSignal,
        ),
  );
  const left = budgetMs - (performance.now() - began);
  const outcomes: PoolOutcome<ProbeAnswer>[] =
    left > 0
      ? await pool.map(jobs, { budgetMs: left, signal, onSettled })
      : jobs.map(() => ({ kind: 'cut' }));

  const rows: AdvisorRow[] = [];
  const cut: ProbeInfo[] = [];
  const failed: AdvisorFailure[] = [];
  outcomes.forEach((outcome, index) => {
    const probe = infos[index];
    if (probe === undefined) return;
    if (outcome.kind === 'error') failed.push({ probe, message: outcome.message });
    // A job cancelled inside its worker answers with no row: it did not finish, which is what a cut is.
    else if (outcome.kind === 'cut' || outcome.value.row === null) cut.push(probe);
    else rows.push(outcome.value.row);
  });
  return { baseline, rows: rankAdvice(rows, options.headline), cut, failed };
}
