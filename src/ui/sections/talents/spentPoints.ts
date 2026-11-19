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

/**
 * Points in one tree, held and planned apart: `spent` is the cost of the ranks already held, `planned` the cost of
 * the plan's steps in that tree, fillers included (they are points the plan really spends).
 */
export function treePoints(
  talents: readonly { id: number; tree: TalentTree; costs: readonly number[] }[],
  tree: TalentTree,
  ranks: Readonly<Record<string, number>>,
  steps: readonly { nodeId: number; cost: number }[],
): { spent: number; planned: number } {
  const inTree = new Set(talents.filter((t) => t.tree === tree).map((t) => t.id));
  let planned = 0;
  for (const s of steps) if (inTree.has(s.nodeId)) planned += s.cost;
  return { spent: spentPoints(talents, tree, ranks), planned };
}

/** "120 spent + 40 planned"; a part that is zero is left out, and nothing at all reads "0 spent". */
export function pointsWords(p: { spent: number; planned: number }): string {
  if (p.planned === 0) return `${String(p.spent)} spent`;
  return p.spent === 0
    ? `${String(p.planned)} planned`
    : `${String(p.spent)} spent + ${String(p.planned)} planned`;
}
