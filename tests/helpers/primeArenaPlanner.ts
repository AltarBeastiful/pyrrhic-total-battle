/** The arena the planner tests plan for: a level IV account with bonuses shaped like a real one (B-46). */
import { primeArenaPool } from '../../src/engine/primeArenaInputs';
import type { PrimeArenaPlanInput } from '../../src/engine/primeArenaPlanner';
import type { PrimeArenaStack } from '../../src/engine/primeArena';
import type { ProfileTroops } from '../../src/state/schema';
import { totalsFrom } from './request';

export const troopsAt = (level: number, over: Partial<ProfileTroops> = {}): ProfileTroops => ({
  guardsmen: { min: 1, max: level },
  specialists: null,
  engineers: null,
  monsters: null,
  topTierExcluded: { guardsmen: [], specialists: [] },
  excludedUnitIds: [],
  ...over,
});

export const ARENA_BONUS = totalsFrom({
  strength: { army: 300, guardsmen: 290, monster: 255, melee: 240, ranged: 78, mounted: 340, flying: 49 },
  health: { army: 130, melee: 160, ranged: 180, mounted: 330, flying: 250, monster: 110 },
});

export const ARENA_HOUSING = { leadership: 52_748, authority: 0, dominance: 13_011 };

export const arenaInput = (over: Partial<PrimeArenaPlanInput> = {}): PrimeArenaPlanInput => ({
  pool: primeArenaPool(troopsAt(4)),
  level: 4,
  housing: ARENA_HOUSING,
  totals: ARENA_BONUS,
  maxEvaluations: 600,
  maxMillis: 60_000,
  ...over,
});

export const squadKey = (stacks: readonly PrimeArenaStack[]): string =>
  stacks.map((s) => `${s.unit.id}:${String(s.count)}`).join();

export const spentIn = (stacks: readonly PrimeArenaStack[], pool: string): number =>
  stacks.filter((s) => s.unit.pool === pool).reduce((sum, s) => sum + s.unit.cost * s.count, 0);
