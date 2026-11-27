/**
 * B-46 — the enemies the Prime Arena planner assumes when the player types none.
 *
 * Nobody knows who the arena will pair them with, so the planner ranks a squad against many armies of the kind
 * players field: the top-tier troop of every type and every top-tier monster of the player's Guardsmen level, in
 * roughly even shares, some smaller and some larger than the player's, carrying bonuses like the player's. The
 * figures are those theory-craft 375 measured, widened upwards so a stronger opponent is covered. Everything is
 * drawn from a seed: the same inputs give the same enemies.
 */
import { BONUS_KEYS } from '../data/types';
import type { UnitDef } from '../data/types';
import type { PrimeArenaArmy, PrimeArenaStack } from './primeArena';
import { arenaUnitsUpTo } from './primeArenaInputs';
import type { BonusTotals, Housing } from './types';

/** How many enemies a plan is ranked on: 16 and 48 gave the same quality in theory-craft 375. */
export const ASSUMED_ENEMIES = 16;
const ENEMY_SEED = 0x1127;

/** An enemy's size against the player's, and its health and strength against the player's. */
const SIZE = [0.8, 1.2] as const;
const BONUS_LEVEL = [0.75, 1.2] as const;
/** A stack's share of its pool is drawn within this much of even, then the pool's shares are normalised. */
const SHARE_SPREAD = 0.25;

/** A small seeded generator, so enemies and search restarts are reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = ([low, high]: readonly [number, number], at: number): number => low + (high - low) * at;

/** The top-tier troop of every type and every top-tier monster of a level. */
const topUnits = (level: number): UnitDef[] => arenaUnitsUpTo(level).filter((unit) => unit.tier === level);

/** Each pool's housing times `size`, shared over the units of that pool in proportion to their weights. */
function army(
  units: readonly UnitDef[],
  housing: Housing,
  size: number,
  weight: () => number,
): PrimeArenaStack[] {
  const stacks: PrimeArenaStack[] = [];
  for (const pool of ['leadership', 'dominance'] as const) {
    const weighted = units.filter((u) => u.pool === pool).map((unit) => ({ unit, w: weight() }));
    const total = weighted.reduce((sum, { w }) => sum + w, 0);
    for (const { unit, w } of weighted) {
      const count = Math.floor((housing[pool] * size * w) / total / unit.cost);
      if (count > 0) stacks.push({ unit, count });
    }
  }
  return stacks;
}

/** The even army of a level and a housing: the one an all-round plan's battle log is read against. */
export function evenArenaArmy(level: number, housing: Housing): PrimeArenaStack[] {
  return army(topUnits(level), housing, 1, () => 1);
}

/** The totals with every health and strength bonus times `factor`; specials and matchups are kept. */
function scaledTotals(totals: BonusTotals, factor: number): BonusTotals {
  const scaled = (record: BonusTotals['health']): BonusTotals['health'] => {
    const out = { ...record };
    for (const key of BONUS_KEYS) out[key] = record[key] * factor;
    return out;
  };
  return { ...totals, health: scaled(totals.health), strength: scaled(totals.strength) };
}

export interface AssumedEnemiesInput {
  /** The player's Guardsmen level, which fixes the enemies' tiers. */
  level: number;
  /** The player's Leadership and Dominance, which the enemies' sizes are measured against. */
  housing: Housing;
  /** The player's bonus totals, which the enemies carry, scaled. */
  totals: BonusTotals;
  seed?: number;
  count?: number;
}

/** The enemy set of an all-round plan; empty when the level fields nobody. */
export function assumedEnemies(input: AssumedEnemiesInput): PrimeArenaArmy[] {
  const units = topUnits(input.level);
  if (units.length === 0) return [];
  const rand = mulberry32(input.seed ?? ENEMY_SEED);
  return Array.from({ length: input.count ?? ASSUMED_ENEMIES }, () => {
    const size = between(SIZE, rand());
    const level = between(BONUS_LEVEL, rand());
    const stacks = army(units, input.housing, size, () =>
      between([1 - SHARE_SPREAD, 1 + SHARE_SPREAD], rand()),
    );
    return { stacks, totals: scaledTotals(input.totals, level) };
  });
}
