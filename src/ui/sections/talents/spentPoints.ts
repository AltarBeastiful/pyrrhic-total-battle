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

/**
 * The plan steps "spend up to here" takes for a selected node: only the viewed tree's steps, in plan order, up to
 * the last step of the selected node or of any node on its row (its neighbours on the same level), so a step
 * that opens a node on the way comes along and the other trees stay as they are.
 */
export function stepsUpToNode<S extends { nodeId: number }>(
  talents: readonly { id: number; tree: TalentTree; layout: { y: number } }[],
  steps: readonly S[],
  nodeId: number,
): S[] {
  const node = talents.find((t) => t.id === nodeId);
  if (node === undefined) return [];
  const inTree = new Set(talents.filter((t) => t.tree === node.tree).map((t) => t.id));
  const level = new Set(
    talents.filter((t) => t.tree === node.tree && t.layout.y === node.layout.y).map((t) => t.id),
  );
  let last = -1;
  steps.forEach((s, i) => {
    if (level.has(s.nodeId)) last = i;
  });
  return steps.slice(0, last + 1).filter((s) => inTree.has(s.nodeId));
}

/**
 * The nodes that must hold a rank before `id` can be bought, parents first: every ancestor that holds none yet,
 * the way the plan counts a locked node (all parents, not one). Empty when the node is already open.
 */
export function unlockChain(
  talents: readonly { id: number; parents: readonly number[] }[],
  ranks: Readonly<Record<string, number>>,
  id: number,
): number[] {
  const byId = new Map(talents.map((t) => [t.id, t]));
  const order: number[] = [];
  const seen = new Set<number>();
  const visit = (nid: number, isTarget: boolean): void => {
    if (seen.has(nid)) return;
    seen.add(nid);
    const rec = byId.get(nid);
    if (rec === undefined) return;
    if (!isTarget && (ranks[String(nid)] ?? 0) >= 1) return;
    for (const parent of rec.parents) visit(parent, false);
    if (!isTarget) order.push(nid);
  };
  visit(id, true);
  return order;
}

/**
 * The lowest rank a node can be taken back to without stranding the tree: a node whose child holds a rank must keep
 * one of its own (the child is only reachable through it), so the floor is 1; otherwise 0.
 */
export function lowestRank(
  talents: readonly { id: number; parents: readonly number[] }[],
  ranks: Readonly<Record<string, number>>,
  id: number,
): number {
  const held = ranks[String(id)] ?? 0;
  if (held === 0) return 0;
  return talents.some((t) => t.parents.includes(id) && (ranks[String(t.id)] ?? 0) > 0) ? 1 : 0;
}
