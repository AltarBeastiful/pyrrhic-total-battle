/** Small builders so each test only spells out what it is actually about. */
import { emptyTotals } from '../../src/engine/bonuses';
import type {
  BonusTotals,
  EnemyFormation,
  ResolvedSource,
  Stack,
  StackRequest,
  StackResult,
  UnitDef,
} from '../../src/engine/types';
import { aggregateBonuses } from '../../src/engine/bonuses';
import { effectiveUnit, hitDamage } from '../../src/engine/units';

/** The 4-squad formation every captured TotalStack run uses. */
export const STANDARD_ENEMY: EnemyFormation = { flying: 1, melee: 1, ranged: 1, mounted: 1 };
/** Arachne's: 8 squads, two of each. */
export const ARACHNE_ENEMY: EnemyFormation = { flying: 2, melee: 2, ranged: 2, mounted: 2 };

export interface RequestOverrides {
  units: UnitDef[];
  housing?: Partial<StackRequest['housing']>;
  caps?: Record<string, number>;
  totals?: BonusTotals;
  options?: Partial<StackRequest['options']>;
  enemy?: EnemyFormation;
  activeEvents?: string[];
  recovery?: Partial<StackRequest['recovery']>;
}

export function makeRequest(overrides: RequestOverrides): StackRequest {
  return {
    units: overrides.units,
    caps: overrides.caps ?? {},
    housing: { leadership: 3000, authority: 1200, dominance: 200, ...overrides.housing },
    totals: overrides.totals ?? emptyTotals(),
    options: {
      method: 'elite',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
      ...overrides.options,
    },
    enemy: overrides.enemy ?? STANDARD_ENEMY,
    activeEvents: overrides.activeEvents ?? [],
    recovery: {
      templeLevel: 0,
      trainingCostReduction: {},
      trainingSpeed: {},
      plan: { mode: 'retrain' },
      ...overrides.recovery,
    },
  };
}

/** One anonymous bonus source, so a test can write `totalsFrom({ health: { army: 25 } })`. */
export function totalsFrom(...contributions: Omit<ResolvedSource, 'id' | 'label' | 'kind'>[]): BonusTotals {
  return aggregateBonuses(
    contributions.map((contribution, index) => ({
      id: `test-${index}`,
      label: `test ${index}`,
      kind: 'custom' as const,
      ...contribution,
    })),
  );
}

/** Stack counts keyed by pill label, the way the fixtures write them. */
export function countsByLabel(result: StackResult, units: UnitDef[]): Record<string, number> {
  const labels = new Map(units.map((unit) => [unit.id, unit.label]));
  const out: Record<string, number> = {};
  for (const stack of result.stacks) out[labels.get(stack.unitId) ?? stack.unitId] = stack.count;
  return out;
}

/** Stacks in kill order, as `LABEL totalHp` strings — the shape the fixtures record. */
export function hpProfile(result: StackResult, units: UnitDef[]): string[] {
  const labels = new Map(units.map((unit) => [unit.id, unit.label]));
  return result.stacks.map((stack: Stack) => `${labels.get(stack.unitId) ?? stack.unitId} ${stack.totalHp}`);
}

/**
 * Builds the `Stack[]` of a captured run directly, in the order the fixture records, so the battle tests
 * exercise the battle model with the *reference* counts instead of re-deriving them from our sizer.
 */
export function stacksInOrder(
  order: { label: string; count: number }[],
  units: UnitDef[],
  totals: BonusTotals,
  enemy: EnemyFormation,
  activeEvents: string[] = [],
): Stack[] {
  const byLabel = new Map(units.map((unit) => [unit.label, unit]));
  return order.map(({ label, count }) => {
    const unit = byLabel.get(label);
    if (!unit) throw new Error(`unknown unit label: ${label}`);
    const effective = effectiveUnit(unit, totals, enemy, activeEvents);
    const { damage, features } = hitDamage(effective, count);
    return {
      unitId: unit.id,
      pool: unit.pool,
      count,
      hpPerUnit: effective.hpPerUnit,
      totalHp: count * effective.hpPerUnit,
      strengthPerUnit: effective.strengthPerUnit,
      target: effective.target,
      damagePerHit: damage,
      featuresDamage: features,
      doubleDamageChance: effective.doubleDamageChance,
      strikeTwoSquadsChance: effective.strikeTwoSquadsChance,
    };
  });
}
