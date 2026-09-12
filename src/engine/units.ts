/**
 * S-21 — effective unit stats (PLAN §3.2), validated against TotalStack journals and two in-game reports
 * (docs/research/battle-model-observations.md §1b).
 *
 *   hpPerUnit       = round(baseHealth × (1 + Σ health[keys(unit)] / 100))        integer, like the game sheet
 *   strengthPerUnit = baseStrength × (1 + (Σ strength[keys(unit)] + event) / 100)
 *   damage(n)       = n × strengthPerUnit + n × baseStrength × SA[target] / 100   (SA on the BASE strength)
 */
import { CATEGORIES } from '../data/types';
import type { Category, StrengthAgainstKey, UnitDef } from '../data/types';
import { matchupBonus } from './bonuses';
import type { BonusTotals, EnemyFormation } from './types';

/** Event ids that switch on the `swarmUnits` strength-against of the units that carry it. */
export const SWARM_EVENT_IDS = ['arachnes'] as const;

const GROUP_DOUBLE_DAMAGE_KEY = {
  guardsmen: 'guardsmenDoubleDamageChance',
  specialist: 'specialistsDoubleDamageChance',
  engineers: 'engineersDoubleDamageChance',
  monster: 'monstersDoubleDamageChance',
} as const;

const RACE_STRIKE_TWO_KEY = {
  beast: 'beastsStrikeTwoSquadsChance',
  elemental: 'elementalsStrikeTwoSquadsChance',
  dragon: 'dragonsStrikeTwoSquadsChance',
  giant: 'giantsStrikeTwoSquadsChance',
} as const;

export interface EffectiveUnit {
  unit: UnitDef;
  /** Integer HP of one unit, rounded like the game sheet. */
  hpPerUnit: number;
  /** Strength of one unit after the additive strength bracket (event strength included). */
  strengthPerUnit: number;
  /** Enemy squad this unit hits. */
  target: Category;
  /** Strength-against percentage applied against that target ("as entered", e.g. 67 = +67 %). */
  strengthAgainst: number;
  doubleDamageChance: number;
  strikeTwoSquadsChance: number;
  /** Σ strength bonuses "as entered"; kept so damage divides by 100 exactly once, at the very end. */
  strengthPercent: number;
}

/** Is the `swarmUnits` strength-against live for this march? */
export function swarmActive(activeEvents: readonly string[]): boolean {
  return SWARM_EVENT_IDS.some((id) => activeEvents.includes(id));
}

/** The per-category part of a unit's strength-against — the only part that can steer the target choice. */
function categoryStrengthAgainst(unit: UnitDef, totals: BonusTotals, target: Category): number {
  return (unit.strengthAgainst[target] ?? 0) + matchupBonus(totals.matchup, unit.category, target);
}

/**
 * Constant strength-against that applies whatever the target is: the unit's own `epicMonsters` line (we only
 * ever fight epic monsters), the army-wide `armyStrengthAgainstEpicMonsters` special key, and — when the
 * matching event is active — the `swarmUnits` line.
 */
function constantStrengthAgainst(
  unit: UnitDef,
  totals: BonusTotals,
  activeEvents: readonly string[],
): number {
  let sum = (unit.strengthAgainst.epicMonsters ?? 0) + totals.special.armyStrengthAgainstEpicMonsters;
  sum += matchupBonus(totals.matchup, unit.category, 'epicMonsters' satisfies StrengthAgainstKey);
  if (swarmActive(activeEvents)) {
    sum += unit.strengthAgainst.swarmUnits ?? 0;
    sum += matchupBonus(totals.matchup, unit.category, 'swarmUnits' satisfies StrengthAgainstKey);
  }
  return sum;
}

/**
 * Which enemy squad a stack hits: the category present in the formation it has the largest strength-against
 * for; with no usable bonus (engineers, or a formation that misses every bonus) it hits the melee squad.
 * Verified on every journal line of three TotalStack journals and both in-game reports.
 */
export function chooseTarget(
  unit: UnitDef,
  totals: BonusTotals,
  enemy: EnemyFormation,
): { target: Category; value: number } {
  let best: Category = 'melee';
  let bestValue = 0;
  for (const category of CATEGORIES) {
    if ((enemy[category] ?? 0) <= 0) continue;
    const value = categoryStrengthAgainst(unit, totals, category);
    if (value > bestValue) {
      best = category;
      bestValue = value;
    }
  }
  return { target: best, value: bestValue };
}

/** Σ of the health bonuses a unit benefits from, "as entered" (43.5 means +43.5 %). */
export function healthPercent(unit: UnitDef, totals: BonusTotals): number {
  let sum = 0;
  for (const key of unit.keys) sum += totals.health[key];
  return sum;
}

/** Σ of the strength bonuses a unit benefits from, event strength included, "as entered". */
export function strengthPercent(unit: UnitDef, totals: BonusTotals): number {
  let sum = totals.eventStrength;
  for (const key of unit.keys) sum += totals.strength[key];
  return sum;
}

export function healthMultiplier(unit: UnitDef, totals: BonusTotals): number {
  return (100 + healthPercent(unit, totals)) / 100;
}

export function strengthMultiplier(unit: UnitDef, totals: BonusTotals): number {
  return (100 + strengthPercent(unit, totals)) / 100;
}

export function effectiveUnit(
  unit: UnitDef,
  totals: BonusTotals,
  enemy: EnemyFormation,
  activeEvents: readonly string[],
): EffectiveUnit {
  const { target, value } = chooseTarget(unit, totals, enemy);
  const groupKey = unit.group ? GROUP_DOUBLE_DAMAGE_KEY[unit.group] : undefined;
  const raceKey = unit.race ? RACE_STRIKE_TWO_KEY[unit.race] : undefined;
  const strength = strengthPercent(unit, totals);
  return {
    unit,
    hpPerUnit: Math.round((unit.health * (100 + healthPercent(unit, totals))) / 100),
    strengthPerUnit: (unit.strength * (100 + strength)) / 100,
    strengthPercent: strength,
    target,
    strengthAgainst: value + constantStrengthAgainst(unit, totals, activeEvents),
    doubleDamageChance:
      unit.doubleDamageChance + totals.special.doubleDamageChance + (groupKey ? totals.special[groupKey] : 0),
    strikeTwoSquadsChance: totals.special.strikeTwoSquadsChance + (raceKey ? totals.special[raceKey] : 0),
  };
}

/**
 * Journal damage of one hit of `count` units, and the "features" part shown next to it.
 * The percentages are summed first and divided by 100 exactly once, so a value like SW1 × 2.55 lands on
 * 65,037.5 (→ 65,038, the journal number) instead of 65,037.4999 through binary rounding.
 */
export function hitDamage(effective: EffectiveUnit, count: number): { damage: number; features: number } {
  const scale = count * effective.unit.strength;
  const features = (scale * effective.strengthAgainst) / 100;
  return {
    damage: Math.round((scale * (100 + effective.strengthPercent + effective.strengthAgainst)) / 100),
    features: Math.round(features),
  };
}
