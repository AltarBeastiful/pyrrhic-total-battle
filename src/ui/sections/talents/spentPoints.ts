/** Points spent in one hero tree: the game's own cost of each rank held, summed (Army strength is 10 a rank). */
import type { TalentTree } from '@/data/types';

export function spentPoints(
  talents: readonly { id: number; tree: TalentTree; costs: readonly number[] }[],
  tree: TalentTree,
  ranks: Readonly<Record<string, number>>,
): number {
  let total = 0;
  for (const t of talents) {
    if (t.tree !== tree) continue;
    const held = Math.min(ranks[String(t.id)] ?? 0, t.costs.length);
    for (let i = 0; i < held; i++) total += t.costs[i] ?? 0;
  }
  return total;
}
