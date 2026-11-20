import { CAMPAIGN } from '@/config';

/** One talent family of a tree: its bonus now and after the plan, and its ranks held or planned over its maximum. */
export interface RecapRow {
  readonly label: string;
  readonly now: number;
  readonly after: number;
  readonly ranks: number;
  readonly maxRanks: number;
}

const size = (r: RecapRow) => Math.max(r.now, r.after);

/**
 * Rows ordered by the larger of now and after; a family below the completion threshold is hidden, except the
 * largest `minRows` which always show (B-27).
 */
export function splitRecap(rows: readonly RecapRow[]): { shown: RecapRow[]; hidden: RecapRow[] } {
  const { minCompletion, minRows } = CAMPAIGN.talentRecap;
  const sorted = [...rows].sort((a, b) => size(b) - size(a) || a.label.localeCompare(b.label));
  const shown: RecapRow[] = [];
  const hidden: RecapRow[] = [];
  sorted.forEach((r, i) => {
    const complete = r.maxRanks > 0 && r.ranks / r.maxRanks >= minCompletion;
    (i < minRows || complete ? shown : hidden).push(r);
  });
  return { shown, hidden };
}
