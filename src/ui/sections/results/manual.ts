/**
 * Manual count editing (the cheap half of D-03): re-run the battle on counts the player changed by
 * hand, without re-sizing anything.
 *
 * The sizer is not involved — that is the point. Only the three quantities that depend on the count are
 * recomputed (total HP, journal damage, the features part of it), the stacks are re-ordered the way the
 * enemy would now kill them (total HP descending), and `simulateBattle` is run again on the result. The
 * pool usage is recomputed too, so going over a housing capacity can be flagged instead of silently
 * producing a march the game would refuse.
 */
import { effectiveUnit, hitDamage, simulateBattle } from '@/engine';
import type { BattleSummary, Pool, Stack, StackRequest, StackResult } from '@/engine/types';

const POOLS: Pool[] = ['leadership', 'authority', 'dominance'];

export interface EditedResult {
  result: StackResult;
  summary: BattleSummary;
  /** Pools the edited counts no longer fit in. */
  overflow: Pool[];
}

/** Are these counts the generated ones? */
export function hasEdits(base: StackResult, counts: Record<string, number>): boolean {
  return base.stacks.some((stack) => {
    const edited = counts[stack.unitId];
    return edited !== undefined && edited !== stack.count;
  });
}

/**
 * The generated result with the player's counts applied. Stacks edited down to zero stay out of the
 * battle but keep their pill (the caller renders from the generated list), so they can be raised again.
 */
export function applyCounts(
  request: StackRequest,
  base: StackResult,
  counts: Record<string, number>,
): EditedResult {
  const units = new Map(request.units.map((unit) => [unit.id, unit]));
  const rank = new Map(base.stacks.map((stack, index) => [stack.unitId, index]));

  const stacks: Stack[] = [];
  const used: Record<Pool, number> = { leadership: 0, authority: 0, dominance: 0 };
  for (const stack of base.stacks) {
    const count = Math.max(0, Math.round(counts[stack.unitId] ?? stack.count));
    const unit = units.get(stack.unitId);
    used[stack.pool] += count * (unit?.cost ?? 0);
    if (count <= 0) continue;
    if (!unit) {
      stacks.push({ ...stack, count, totalHp: count * stack.hpPerUnit });
      continue;
    }
    const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
    const { damage, features } = hitDamage(effective, count);
    stacks.push({
      ...stack,
      count,
      totalHp: count * stack.hpPerUnit,
      damagePerHit: damage,
      featuresDamage: features,
    });
  }

  stacks.sort((a, b) => b.totalHp - a.totalHp || (rank.get(a.unitId) ?? 0) - (rank.get(b.unitId) ?? 0));

  const pools = {} as StackResult['pools'];
  const overflow: Pool[] = [];
  for (const pool of POOLS) {
    const capacity = request.housing[pool];
    pools[pool] = { used: used[pool], capacity };
    if (used[pool] > capacity) overflow.push(pool);
  }

  const result: StackResult = { stacks, pools, dropped: base.dropped, warnings: base.warnings };
  return { result, summary: simulateBattle(result, request), overflow };
}
