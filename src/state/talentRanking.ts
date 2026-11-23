/**
 * **The ranking of Analyze all** (B-28): one row per analysed talent, pure and free of the card so that the keep,
 * stale and row-select work (B-29) can hold the rows anywhere. The gain is the mean of the pool shapes, as the
 * single Analyze shows it; the points are what the ranks above the baseline cost.
 */
import type { TalentRecord } from '../data/types';
import { meanOf, slopeOf } from '../engine/talentAnalysis';
import type { TalentAnalysis } from '../worker/talentAnalysis';

export interface RankingEntry {
  node: TalentRecord;
  /** The rank the account holds. */
  held: number;
  analysis: TalentAnalysis;
  /** What the per-point figure is: the endpoint over the points (the plain list) or the fitted slope (the grid methods). */
  score?: 'endpoint' | 'slope';
}

/** One talent's analyses in several contexts as one: the same ranks, every gain the mean over the contexts. */
export function combineAnalyses(analyses: readonly TalentAnalysis[]): TalentAnalysis {
  const [first] = analyses;
  if (first === undefined) throw new Error('There is nothing to combine.');
  if (analyses.length === 1) return first;
  return { ranks: first.ranks, shapes: first.shapes, mean: meanOf(analyses.map((one) => one.mean)) };
}

/** What each priced rank costs in talent points from the baseline (the baseline itself 0). */
function pointsAt(node: TalentRecord, ranks: readonly number[]): number[] {
  const base = ranks[0] ?? 0;
  return ranks.map((rank) => node.costs.slice(base, rank).reduce((sum, cost) => sum + cost, 0));
}

export interface RankingRow {
  id: number;
  name: string;
  tree: TalentRecord['tree'];
  held: number;
  max: number;
  /** The mean rating gain at the maximum rank over the baseline, in percent. */
  gainAtMax: number;
  /** Talent points from the baseline to the maximum; 0 when nothing is left to buy. */
  points: number;
  /** Gain at max over points; null when nothing is left to buy. */
  perPoint: number | null;
}

export type RankingSort = 'perPoint' | 'gainAtMax' | 'name';

export function rankTalents(entries: readonly RankingEntry[], sort: RankingSort = 'perPoint'): RankingRow[] {
  const rows = entries.map(({ node, held, analysis, score }): RankingRow => {
    const baseline = analysis.ranks[0] ?? held;
    const points = node.costs.slice(baseline, node.maxRank).reduce((sum, cost) => sum + cost, 0);
    const gainAtMax = analysis.mean.at(-1) ?? 0;
    return {
      id: node.id,
      name: node.name,
      tree: node.tree,
      held,
      max: node.maxRank,
      gainAtMax,
      points,
      perPoint:
        points === 0 ? null : score === 'slope' ? slopeOf(pointsAt(node, analysis.ranks), analysis.mean) : gainAtMax / points,
    };
  });
  const measure = (row: RankingRow): number => (sort === 'gainAtMax' ? row.gainAtMax : (row.perPoint ?? 0));
  return rows.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'en', { numeric: true }) || a.id - b.id;
    // A talent with nothing left to buy always goes last.
    if ((a.points === 0) !== (b.points === 0)) return a.points === 0 ? 1 : -1;
    return measure(b) - measure(a) || a.id - b.id;
  });
}
