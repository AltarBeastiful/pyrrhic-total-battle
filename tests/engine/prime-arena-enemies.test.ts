/** B-46 — the enemies the planner assumes when the player types none. */
import { describe, expect, it } from 'vitest';

import { ASSUMED_ENEMIES, assumedEnemies, evenArenaArmy } from '../../src/engine/primeArenaEnemies';
import type { PrimeArenaArmy } from '../../src/engine/primeArena';
import { ARENA_BONUS, ARENA_HOUSING, spentIn } from '../helpers/primeArenaPlanner';

const TOP_IV = [
  'archer-4',
  'gorgon-medusa',
  'ice-phoenix',
  'magic-dragon',
  'many-armed-guardian',
  'rider-4',
  'spearman-4',
  'swordsman-4',
];
const ids = (army: PrimeArenaArmy): string[] => army.stacks.map((s) => s.unit.id).sort();
const input = { level: 4, housing: ARENA_HOUSING, totals: ARENA_BONUS };

describe('the even army of a level', () => {
  it('fields every top-tier troop type and monster, each pool split evenly by housing', () => {
    const stacks = evenArenaArmy(4, ARENA_HOUSING);
    expect(stacks.map((s) => s.unit.id).sort()).toEqual(TOP_IV);
    for (const pool of ['leadership', 'dominance'] as const) {
      const spends = stacks.filter((s) => s.unit.pool === pool).map((s) => s.unit.cost * s.count);
      const quarter = ARENA_HOUSING[pool] / 4;
      for (const spend of spends) expect(Math.abs(spend - quarter)).toBeLessThan(20);
      expect(spentIn(stacks, pool)).toBeLessThanOrEqual(ARENA_HOUSING[pool]);
    }
  });

  it('follows the level: the top tier of that level, and no monster below the first monster tier', () => {
    const nine = evenArenaArmy(9, ARENA_HOUSING);
    expect(nine.every((s) => s.unit.tier === 9)).toBe(true);
    expect(evenArenaArmy(2, ARENA_HOUSING).every((s) => s.unit.kind === 'troop')).toBe(true);
    expect(evenArenaArmy(0, ARENA_HOUSING)).toEqual([]);
  });
});

describe('the assumed enemies', () => {
  const armies = assumedEnemies({ ...input, count: 200 });

  it('are at least sixteen by default', () => {
    expect(ASSUMED_ENEMIES).toBeGreaterThanOrEqual(16);
    expect(assumedEnemies(input)).toHaveLength(ASSUMED_ENEMIES);
  });

  it('each field every top-tier troop type and monster of the level', () => {
    for (const army of armies) expect(ids(army)).toEqual(TOP_IV);
  });

  it('vary in size from 80 to 120 % of the player, each pool by the same factor', () => {
    const sizes = armies.map((army) => spentIn(army.stacks, 'leadership') / ARENA_HOUSING.leadership);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(0.79);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(1.2);
    expect(Math.min(...sizes)).toBeLessThan(0.85);
    expect(Math.max(...sizes)).toBeGreaterThan(1.15);
    for (const army of armies) {
      const l = spentIn(army.stacks, 'leadership') / ARENA_HOUSING.leadership;
      const d = spentIn(army.stacks, 'dominance') / ARENA_HOUSING.dominance;
      expect(Math.abs(l - d)).toBeLessThan(0.01);
    }
  });

  it('spread each pool in roughly even shares: weights within 25 % of even, then normalised', () => {
    for (const army of armies) {
      for (const pool of ['leadership', 'dominance'] as const) {
        const spends = army.stacks.filter((s) => s.unit.pool === pool).map((s) => s.unit.cost * s.count);
        // The widest ratio two weights of 0.75..1.25 allow, with a little room for whole units.
        expect(Math.max(...spends) / Math.min(...spends)).toBeLessThan(1.25 / 0.75 + 0.02);
      }
    }
  });

  it('carry the player totals with health and strength scaled between 75 and 120 %', () => {
    const levels = armies.map((army) => army.totals.strength.army / ARENA_BONUS.strength.army);
    expect(Math.min(...levels)).toBeGreaterThanOrEqual(0.75);
    expect(Math.max(...levels)).toBeLessThanOrEqual(1.2);
    expect(Math.max(...levels)).toBeGreaterThan(1.1);
    for (const [i, army] of armies.entries()) {
      for (const key of ['melee', 'mounted', 'monster'] as const) {
        expect(army.totals.strength[key]).toBeCloseTo(ARENA_BONUS.strength[key] * levels[i]!, 6);
        expect(army.totals.health[key]).toBeCloseTo(ARENA_BONUS.health[key] * levels[i]!, 6);
      }
      expect(army.totals.special).toEqual(ARENA_BONUS.special);
      expect(army.totals.matchup).toEqual(ARENA_BONUS.matchup);
    }
  });

  it('are the same for the same seed, and others for another seed', () => {
    expect(assumedEnemies(input)).toEqual(assumedEnemies(input));
    const other = assumedEnemies({ ...input, seed: 987_654 });
    expect(other).not.toEqual(assumedEnemies(input));
  });

  it('are none while the level fields nobody', () => {
    expect(assumedEnemies({ ...input, level: 0 })).toEqual([]);
  });
});
