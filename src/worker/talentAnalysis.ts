/**
 * **The talent analysis** (B-24): what each rank of one talent is worth to the selected army, under a few
 * leadership shapes. One captain-screen job per shape (`client.captains`): the lineups are the ranks, rank 0 is the
 * current lineup, and each rank's own sizing is rated against it (`LineupScreen.sized`), so a rank rates 0 against
 * itself and a talent that adds nothing is a flat zero. The totals of each rank are built on the main thread
 * (`src/state/talentAnalysis.ts`). Results are merged by position, so one worker and six give one answer.
 */
import { CAMPAIGN } from '@/config';
import { meanOf } from '@/engine/talentAnalysis';
import type { MarkerRates } from '@/engine/rating';
import type { BonusTotals, StackRequest } from '@/engine/types';

import type { CalcPool, PoolJob } from './pool';
import type { CaptainScreenAnswer } from './protocol';

export interface TalentAnalysisInput {
  /** The selected march's request; its `totals` are not read, every rank brings its own. */
  request: StackRequest;
  /** The ranks to price, rank 0 first, each with the totals the march carries at that rank. */
  ranks: { rank: number; totals: BonusTotals }[];
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

export async function runTalentAnalysis(
  input: TalentAnalysisInput,
  pool: CalcPool,
  options: TalentAnalysisOptions = {},
): Promise<TalentAnalysis> {
  const fills = input.fills ?? CAMPAIGN.talentFills;
  const rates = options.rates ?? CAMPAIGN.markerRates;
  if (fills.length === 0) throw new Error('The analysis needs at least one pool shape.');
  if (input.ranks[0]?.rank !== 0) throw new Error('The analysis reads every rank against rank 0, which must come first.');
  const lineups = input.ranks.map(({ rank, totals }) => ({ key: String(rank), totals }));
  const currentKey = lineups[0]?.key ?? '0';
  const jobs = fills.map(
    (fill): PoolJob<CaptainScreenAnswer> =>
      (client, signal) =>
        client.captains({ request: filled(input.request, fill), lineups, currentKey, stops: [], rates }, signal),
  );
  const outcomes = await pool.map(jobs, {
    budgetMs: options.budgetMs ?? CAMPAIGN.budgets.heroReport,
    signal: options.signal,
    onSettled: (_index, _outcome, settled, total) => {
      options.onProgress?.(settled, total);
    },
  });
  const shapes = outcomes.map((outcome, index): TalentShape => {
    const fill = fills[index] ?? 100;
    if (outcome.kind === 'error') throw new Error(outcome.message);
    if (outcome.kind === 'cut') throw new Error('The analysis ran out of time.');
    const { screens } = outcome.value;
    if (screens.length !== lineups.length) throw new Error('The analysis was cut short.');
    return { fill, gains: screens.map((screen) => screen.sized) };
  });
  return { ranks: input.ranks.map(({ rank }) => rank), shapes, mean: meanOf(shapes.map((s) => s.gains)) };
}
