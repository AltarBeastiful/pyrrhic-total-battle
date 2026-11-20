/**
 * **The ranking of Analyze all** (B-28): one row per analysed talent, pure and free of the card so that the keep,
 * stale and row-select work (B-29) can hold the rows anywhere. The gain is the mean of the pool shapes, as the
 * single Analyze shows it; the points are what the ranks above the baseline cost.
 */
import type { TalentRecord } from '../data/types';
import type { TalentAnalysis } from '../worker/talentAnalysis';

export interface RankingEntry {
  node: TalentRecord;
  /** The rank the account holds. */
  held: number;
  analysis: TalentAnalysis;
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
  const rows = entries.map(({ node, held, analysis }): RankingRow => {
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
      perPoint: points > 0 ? gainAtMax / points : null,
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
