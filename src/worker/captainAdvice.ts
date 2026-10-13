/**
 * **The captain advice pass** (W17 C5a, `docs/plans/progression-advisor.md` §4 C5): the current lineup's plan,
 * every allowed lineup screened in one job, and the best of the screen planned in full — each a job of the
 * calculation pool, all under the advisor's one clock.
 *
 * 1. **Baseline** — the march's own plan, as the March shows it (`runProbe` with nothing to read against). It is
 *    the current lineup's plan, so the current lineup is always in the answer and every other lineup is read against it.
 * 2. **Screen** — `runCaptainScreen`, one job: every lineup's sized and re-priced ratings against the current one's.
 * 3. **Confirm** — the first `confirm` lineups of the screen (`shortlistLineups`, a work count: `CAMPAIGN.captainConfirm`)
 *    each planned in full on its own totals and read as C3 reads a probe (`readProbe`): re-priced counts,
 *    re-planned stop, gain clamped at 0, so **a lineup is never reported as worse than the one marched now**.
 *
 * The answer is the best lineup per stop of the bar (the silver saver and the all-in may want different
 * captains), the current lineup where no other gains. Results are merged by shortlist position, never by arrival
 * (§1 rule 2), and no job carries a clock, so one worker and six give one answer. Which lineups there are, and
 * their totals, are the main thread's (`src/state/captainLineups.ts`); this pass takes them as keys and totals.
 */
import { CAMPAIGN } from '@/config';
import {
  probeInfo,
  type AdvisorRow,
  type ProbeInfo,
  type ShownStop,
  type StopAdvice,
} from '@/engine/advisor';
import {
  shortlistLineups,
  type ScreenLineup,
  type ShortlistFrom,
  type LineupScreen,
} from '@/engine/captains';
import type { CampaignInput, PlanPick } from '@/engine/plan';
import type { MarkerRates } from '@/engine/rating';

import { CENSUS, noteCensus, stableKey } from './census';
import type { CalcPool, PoolJob, PoolOutcome } from './pool';
import type { CaptainScreenAnswer, ProbeAnswer } from './protocol';

export interface CaptainAdviceOptions {
  /** Aborting it rejects the pass with an `AbortError` and stops every job (a new Generate, the Cancel button). */
  signal?: AbortSignal | undefined;
  /** Called as each job settles, with how many of the pass's jobs are done out of the most it can run. */
  onProgress?: ((done: number, total: number) => void) | undefined;
  /** The whole pass's clock; `CAMPAIGN.budgets.extra` by default. */
  budgetMs?: number | undefined;
  /** The owner's rating; `CAMPAIGN.markerRates` by default. */
  rates?: MarkerRates | undefined;
  /** Lineups planned in full besides the current one; `CAMPAIGN.captainConfirm` by default. */
  confirm?: number | undefined;
  /** Which screen the shortlist is taken from; the re-priced one by default (experiment 193). */
  from?: ShortlistFrom | undefined;
}

/** The best lineup for one stop of the bar. */
export interface LineupStopAdvice {
  pick: PlanPick;
  /** Key of the lineup: the current one where no other gains on this stop. */
  lineup: string;
  /** The gain over the current lineup on the owner's rating; 0 for the current lineup. Never negative. */
  gain: number;
  /** The reading behind the gain; `null` for the current lineup. */
  advice: StopAdvice | null;
}

export interface CaptainAdviceFailure {
  lineup: string;
  message: string;
}

export interface CaptainAdviceResult {
  currentKey: string;
  /** The current lineup's bar as shown; `null` when the clock cut the baseline. */
  baseline: ShownStop[] | null;
  /** Every lineup's screen, in the order the lineups were given; empty when the screen was cut. */
  screens: LineupScreen[];
  /** The screen did not finish (the clock, or a cancel inside the worker): nothing was confirmed. */
  screenCut: boolean;
  /** The lineups planned in full, best of the screen first. */
  confirmed: string[];
  /** One row per confirmed lineup that finished (`id` is the lineup's key), in `confirmed` order. */
  rows: AdvisorRow[];
  /**
   * Every plan the pass finished, as the March shows it, by lineup key: the current lineup's baseline and each
   * confirmed lineup that finished. The upgrade pass reads its lead lineup's bar from here.
   */
  plans: Record<string, ShownStop[]>;
  /** The best lineup per stop of the baseline bar, in the bar's order; never below the current lineup. */
  best: LineupStopAdvice[];
  /** The confirmed lineups the pass's clock stopped before they finished. */
  cut: string[];
  /** The confirmed lineups whose job failed, with what it said. */
  failed: CaptainAdviceFailure[];
}

/** The settings every job of a pass plans under: the input's own, with no clock and nothing a worker can't take. */
function settingsOf(input: CampaignInput): CampaignInput {
  const settings = { ...input };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

function infoOf(key: string): ProbeInfo {
  return { id: key, family: 'captains', label: key };
}

/** The best row per stop: the strictly highest gain, the current lineup (gain 0) first and winning every tie. */
function bestPerStop(
  baseline: readonly ShownStop[],
  currentKey: string,
  rows: readonly AdvisorRow[],
): LineupStopAdvice[] {
  return baseline.map((stop, index) => {
    let best: LineupStopAdvice = { pick: stop.pick, lineup: currentKey, gain: 0, advice: null };
    for (const row of rows) {
      const advice = row.stops[index];
      if (advice !== undefined && advice.gain > best.gain)
        best = { pick: stop.pick, lineup: row.id, gain: advice.gain, advice };
    }
    return best;
  });
}

/**
 * Run the captain advice over `lineups` (the current one included, whose key is `currentKey`) on the pool.
 * Rejects when the baseline or the screen fails (nothing can be read without them) or when `signal` aborts.
 */
export async function runCaptainAdvice(
  input: CampaignInput,
  lineups: readonly ScreenLineup[],
  currentKey: string,
  pool: CalcPool,
  options: CaptainAdviceOptions = {},
): Promise<CaptainAdviceResult> {
  const { signal, onProgress } = options;
  const budgetMs = options.budgetMs ?? CAMPAIGN.budgets.extra;
  const rates = options.rates ?? CAMPAIGN.markerRates;
  const confirm = Math.max(0, options.confirm ?? CAMPAIGN.captainConfirm);
  const settings = settingsOf(input);
  const total = 2 + Math.min(confirm, Math.max(0, lineups.length - 1));
  let done = 0;
  const onSettled = (): void => {
    done += 1;
    onProgress?.(done, total);
  };
  const began = performance.now();
  const empty: CaptainAdviceResult = {
    currentKey,
    baseline: null,
    screens: [],
    screenCut: true,
    confirmed: [],
    rows: [],
    plans: {},
    best: [],
    cut: [],
    failed: [],
  };

  // The baseline's settings, for the profiling run's census only (`census.ts`).
  if (CENSUS) noteCensus(() => ({ kind: 'baseline', pass: 'captains', key: stableKey(settings) }));
  const baselineJob: PoolJob<ProbeAnswer> = (client, jobSignal) =>
    client.probe({ plan: settings }, jobSignal);
  const [first] = await pool.map([baselineJob], { budgetMs, signal, onSettled });
  if (first?.kind === 'error') throw new Error(first.message);
  if (first?.kind !== 'done') return empty;
  const baseline = first.value.stops;
  const withBaseline = {
    ...empty,
    baseline,
    plans: { [currentKey]: baseline },
    best: bestPerStop(baseline, currentKey, []),
  };

  const screenJob: PoolJob<CaptainScreenAnswer> = (client, jobSignal) =>
    client.captains(
      {
        request: settings.request,
        lineups: [...lineups],
        currentKey,
        stops: baseline.map((stop) => ({ pick: stop.pick, counts: stop.counts })),
        rates,
      },
      jobSignal,
    );
  const [screened] = await pool.map([screenJob], {
    budgetMs: budgetMs - (performance.now() - began),
    signal,
    onSettled,
  });
  if (screened?.kind === 'error') throw new Error(screened.message);
  // A screen cancelled inside its worker answers part of the lineups: not a ranking to take a shortlist from.
  if (screened?.kind !== 'done' || screened.value.screens.length < lineups.length) return withBaseline;
  const { screens } = screened.value;

  const confirmed = shortlistLineups(screens, currentKey, confirm, options.from ?? 'repriced');
  const jobs = confirmed.map((key): PoolJob<ProbeAnswer> => {
    const lineup = lineups.find((candidate) => candidate.key === key);
    if (lineup === undefined)
      throw new Error(`The shortlisted lineup ${key} is not among the lineups given.`);
    return (client, jobSignal) =>
      client.probe(
        {
          plan: { ...settings, request: { ...settings.request, totals: lineup.totals } },
          against: { probe: probeInfo(infoOf(key)), baseline, rates },
        },
        jobSignal,
      );
  });
  const left = budgetMs - (performance.now() - began);
  const outcomes: PoolOutcome<ProbeAnswer>[] =
    left > 0 && jobs.length > 0
      ? await pool.map(jobs, { budgetMs: left, signal, onSettled })
      : jobs.map(() => ({ kind: 'cut' }));

  const rows: AdvisorRow[] = [];
  const plans: Record<string, ShownStop[]> = { [currentKey]: baseline };
  const cut: string[] = [];
  const failed: CaptainAdviceFailure[] = [];
  outcomes.forEach((outcome, index) => {
    const lineup = confirmed[index];
    if (lineup === undefined) return;
    if (outcome.kind === 'error') failed.push({ lineup, message: outcome.message });
    // A job cancelled inside its worker answers with no row: it did not finish, which is what a cut is.
    else if (outcome.kind === 'cut' || outcome.value.row === null) cut.push(lineup);
    else {
      rows.push(outcome.value.row);
      plans[lineup] = outcome.value.stops;
    }
  });
  return {
    currentKey,
    baseline,
    screens,
    screenCut: false,
    confirmed,
    rows,
    plans,
    best: bestPerStop(baseline, currentKey, rows),
    cut,
    failed,
  };
}
