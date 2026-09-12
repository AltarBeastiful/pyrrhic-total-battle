/**
 * S-22 — kill order (PLAN §3.3).
 *
 * The order is a *ranking*, not a promise: it decides which stack gets the higher HP target in
 * `stacker.ts`. The stack that actually dies first is always the one with the highest total HP (the enemy
 * picks by HP, verified 10/10 kills in the in-game reports), so rounding can still swap same-tier peers —
 * exactly what TotalStack's own output does (ep-8stacks: RD2 97,740 sits above ARC2 97,470).
 *
 * Elite Preservation: engineers first (highest HP per leadership, so they die first anyway), then leadership
 * troops by tier ascending; inside a tier specialists before guardsmen and ranged → melee → mounted → flying.
 * Mercenaries and monsters are ranked the same way inside their own pool. The default custom list captured
 * from TotalStack (SW1, ARC1, SP1, RD1, ARC2, SP2, RD2, ARC3, SP3, RD3, then monsters) matches this rule.
 */
import type { Pool, UnitDef } from '../data/types';
import type { StackingOptions } from './types';

const POOL_RANK: Record<Pool, number> = { leadership: 0, authority: 1, dominance: 2 };
const CATEGORY_RANK = { ranged: 0, melee: 1, mounted: 2, flying: 3 } as const;
const GROUP_RANK = { engineers: -1, specialist: 0, guardsmen: 1, monster: 2 } as const;

function rankKey(unit: UnitDef, index: number): number[] {
  const isEngineer = unit.group === 'engineers';
  return [
    POOL_RANK[unit.pool],
    // Engineers are ranked ahead of every other leadership troop, whatever their tier.
    isEngineer ? 0 : 1,
    unit.tier,
    unit.group ? GROUP_RANK[unit.group] : 1,
    unit.category ? CATEGORY_RANK[unit.category] : 4,
    index,
  ];
}

function compareKeys(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    if (left !== right) return left - right;
  }
  return 0;
}

/** Elite-Preservation ranking of the given units, first-to-die first. */
export function eliteOrder(units: UnitDef[]): UnitDef[] {
  return units
    .map((unit, index) => ({ unit, key: rankKey(unit, index) }))
    .sort((a, b) => compareKeys(a.key, b.key))
    .map((entry) => entry.unit);
}

/**
 * Ranked unit ids, first to die first. Custom orders keep the user's list and append everything they left
 * out in Elite-Preservation order, so a partial list is always a valid order.
 */
export function buildKillOrder(units: UnitDef[], options: StackingOptions): string[] {
  const ordered = eliteOrder(units);
  if (options.method !== 'custom' || !options.customOrder?.length) {
    return ordered.map((unit) => unit.id);
  }
  const known = new Set(ordered.map((unit) => unit.id));
  const listed = options.customOrder.filter((id) => known.has(id));
  const seen = new Set(listed);
  return [...listed, ...ordered.map((unit) => unit.id).filter((id) => !seen.has(id))];
}
