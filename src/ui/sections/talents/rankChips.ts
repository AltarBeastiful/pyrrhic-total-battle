import { rankGain } from '@/engine/talents';

import { percent } from './labels';

export type RankState = 'now' | 'held' | 'plan' | 'open';

/** The key chips (B-26): rank 1, the held rank, the next planned rank, the midpoint and the last; at most five, no duplicates. */
export function keyRankPicks({
  last,
  bought,
  plus,
}: {
  last: number;
  bought: number;
  plus: number;
}): number[] {
  const picks = [1, bought, plus > 0 ? bought + 1 : 0, Math.round(last / 2), last];
  return [...new Set(picks)].filter((r) => r >= 1 && r <= last).sort((a, b) => a - b);
}

const STATE_WORDS: Record<RankState, string> = { now: 'held', held: 'held', plan: 'planned', open: 'open' };

/** The tooltip and screen-reader label: the chip itself shows rank and total only. */
export function rankChipLabel(a: {
  name: string;
  rank: number;
  values: readonly number[];
  costs: readonly number[];
  state: RankState;
}): string {
  const cost = a.costs[a.rank - 1] ?? 0;
  return `${a.name} rank ${String(a.rank)}, ${STATE_WORDS[a.state]}: costs ${String(cost)} ${cost === 1 ? 'point' : 'points'}, adds +${percent(rankGain(a.values, a.rank))}, total +${percent(a.values[a.rank - 1] ?? 0)}`;
}
