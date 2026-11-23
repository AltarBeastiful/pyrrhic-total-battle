/**
 * **The talent analysis** (B-24): what each rank of one talent is worth to the selected army, under a few
 * leadership shapes. One captain-screen job per shape (`client.captains`): the lineups are the ranks, the first rank (the baseline) is the
 * current lineup, and each rank's own sizing is rated against it (`LineupScreen.sized`), so a rank rates 0 against
 * itself and a talent that adds nothing is a flat zero. The totals of each rank are built on the main thread
 * (`src/state/talentAnalysis.ts`). Results are merged by position, so one worker and six give one answer.
 */
import { CAMPAIGN } from '@/config';
import { sizeStacks } from '@/engine/stacker';
import { meanOf } from '@/engine/talentAnalysis';
import type { MarkerRates } from '@/engine/rating';
import type { BonusTotals, StackRequest } from '@/engine/types';

import type { CalcPool, PoolJob, PoolOutcome } from './pool';
import type { CaptainScreenAnswer } from './protocol';

export interface TalentAnalysisInput {
  /** The selected march's request; its `totals` are not read, every rank brings its own. */
  request: StackRequest;
  /** The rank the march already carries the talent at (B-25); 0 when it carries none of it. */
  baseline?: number | undefined;
  /** The ranks to price, the baseline first, each with the totals the march carries at that rank. */
  ranks: { rank: number; totals: BonusTotals }[];
  /**
   * What the gain is read from: `sized` (the default) re-sizes the march at each rank; `fixed` battles the counts of
   * the baseline sizing under each rank, so no re-sizing noise enters (experiment 365).
   */
  reading?: 'sized' | 'fixed' | undefined;
  /** Pool shapes in percent of the leadership pool; `CAMPAIGN.talentFills` by default. */
  fills?: readonly number[] | undefined;
}

export interface TalentAnalysisOptions {
  signal?: AbortSignal | undefined;
  /** Called as each shape settles, with how many are done out of all of them. */
  onProgress?: ((done: number, total: number) => void) | undefined;
  budgetMs?: number | undefined;
  rates?: MarkerRates | undefined;
}

export interface TalentShape {
  /** The leadership pool as a percentage of the march's own. */
  fill: number;
  /** The owner's rating of each rank against rank 0, in the order of `ranks`. */
  gains: number[];
}

export interface TalentAnalysis {
  ranks: number[];
  shapes: TalentShape[];
  /** The plain mean of the shapes' gains at each rank. */
  mean: number[];
}

/** The march's request with its leadership pool at `fill` percent, whole units. */
function filled(request: StackRequest, fill: number): StackRequest {
  return {
    ...request,
    housing: { ...request.housing, leadership: Math.floor((request.housing.leadership * fill) / 100) },
  };
}

/**
 * The counts a `fixed` reading holds: the baseline's own sizing at `fill`. Every talent of one pass shares the
 * baseline totals, so `cache` (one per pass, keyed by the shape's request) sizes each shape once.
 */
function fixedCounts(
  request: StackRequest,
  totals: BonusTotals,
  cache: Map<string, Record<string, number>>,
): Record<string, number> {
  const key = JSON.stringify([request.housing, request.enemy]);
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const counts: Record<string, number> = {};
  const sized = sizeStacks({ ...request, totals, options: { ...request.options, method: 'elite' } });
  for (const stack of sized.stacks) counts[stack.unitId] = stack.count;
  cache.set(key, counts);
  return counts;
}

/** The jobs of one talent: one captain-screen per pool shape, in the order of the shapes. */
function jobsOf(
  input: TalentAnalysisInput,
  fills: readonly number[],
  rates: MarkerRates,
  counts: Map<string, Record<string, number>> = new Map(),
): PoolJob<CaptainScreenAnswer>[] {
  if (input.ranks[0]?.rank !== (input.baseline ?? 0)) {
    throw new Error('The analysis reads every rank against the baseline, which must come first.');
  }
  const lineups = input.ranks.map(({ rank, totals }) => ({ key: String(rank), totals }));
  const currentKey = lineups[0]?.key ?? '0';
  return fills.map((fill): PoolJob<CaptainScreenAnswer> => {
    const request = filled(input.request, fill);
    const stops =
      input.reading === 'fixed' && lineups[0] !== undefined
        ? [{ pick: 'fixed', counts: fixedCounts(request, lineups[0].totals, counts) }]
        : [];
    return (client, signal) => client.captains({ request, lineups, currentKey, stops, rates }, signal);
  });
}

/** One talent's answer from the outcomes of its shapes' jobs. */
function assemble(
  input: TalentAnalysisInput,
  fills: readonly number[],
  outcomes: readonly PoolOutcome<CaptainScreenAnswer>[],
): TalentAnalysis {
  const shapes = outcomes.map((outcome, index): TalentShape => {
    const fill = fills[index] ?? 100;
    if (outcome.kind === 'error') throw new Error(outcome.message);
    if (outcome.kind === 'cut') throw new Error('The analysis ran out of time.');
    const { screens } = outcome.value;
    if (screens.length !== input.ranks.length) throw new Error('The analysis was cut short.');
    return {
      fill,
      gains: screens.map((screen) => (input.reading === 'fixed' ? (screen.repriced[0] ?? 0) : screen.sized)),
    };
  });
  return { ranks: input.ranks.map(({ rank }) => rank), shapes, mean: meanOf(shapes.map((s) => s.gains)) };
}

function fillsOf(input: { fills?: readonly number[] | undefined }): readonly number[] {
  const fills = input.fills ?? CAMPAIGN.talentFills;
  if (fills.length === 0) throw new Error('The analysis needs at least one pool shape.');
  return fills;
}

export async function runTalentAnalysis(
  input: TalentAnalysisInput,
  pool: CalcPool,
  options: TalentAnalysisOptions = {},
): Promise<TalentAnalysis> {
  const fills = fillsOf(input);
  const jobs = jobsOf(input, fills, options.rates ?? CAMPAIGN.markerRates);
  const outcomes = await pool.map(jobs, {
    budgetMs: options.budgetMs ?? CAMPAIGN.budgets.heroReport,
    signal: options.signal,
    onSettled: (_index, _outcome, settled, total) => {
      options.onProgress?.(settled, total);
    },
  });
  return assemble(input, fills, outcomes);
}

/**
 * **Analyze all** (B-28): every input priced exactly as `runTalentAnalysis` prices one, as one pool pass of a job
 * per talent and shape, merged by position (so the lane count moves nothing). Progress counts jobs. A cancel
 * rejects and returns nothing: there is no partial ranking.
 */
export async function runAllTalentsAnalysis(
  inputs: readonly TalentAnalysisInput[],
  pool: CalcPool,
  options: TalentAnalysisOptions = {},
): Promise<TalentAnalysis[]> {
  const rates = options.rates ?? CAMPAIGN.markerRates;
  const counts = new Map<string, Record<string, number>>();
  const plans = inputs.map((input) => {
    const fills = fillsOf(input);
    return { input, fills, jobs: jobsOf(input, fills, rates, counts) };
  });
  const outcomes = await pool.map(
    plans.flatMap((plan) => plan.jobs),
    {
      budgetMs: options.budgetMs ?? CAMPAIGN.budgets.heroReport * Math.max(1, plans.length),
      signal: options.signal,
      onSettled: (_index, _outcome, settled, total) => {
        options.onProgress?.(settled, total);
      },
    },
  );
  let at = 0;
  return plans.map(({ input, fills, jobs }) => {
    const own = outcomes.slice(at, at + jobs.length);
    at += jobs.length;
    return assemble(input, fills, own);
  });
}
