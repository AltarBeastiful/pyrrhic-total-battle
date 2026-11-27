/** B-46 — what the planner ranks on: many assumed enemies, or the one the player typed; and the two roles. */
import { describe, expect, it } from 'vitest';

import { unitById } from '../../src/data';
import type { PrimeArenaStack } from '../../src/engine/primeArena';
import { assumedEnemies, evenArenaArmy } from '../../src/engine/primeArenaEnemies';
import {
  comparePrimeArenaSetScore,
  planPrimeArena,
  scorePrimeArenaSet,
} from '../../src/engine/primeArenaPlanner';
import { ARENA_BONUS, ARENA_HOUSING, arenaInput, spentIn, squadKey } from '../helpers/primeArenaPlanner';

const stack = (id: string, count: number): PrimeArenaStack => ({ unit: unitById(id)!, count });
/** A lopsided enemy, far from the even armies the all-round plan is built against. */
const TYPED = [stack('rider-4', 20_000), stack('spearman-4', 12_000), stack('many-armed-guardian', 900)];
const SEARCH = { maxEvaluations: 3_000 };
const full = planPrimeArena(arenaInput(SEARCH));

describe('without a typed enemy: one squad against many assumed ones', () => {
  it('names its mode, its enemies and the log it shows: an even army of our own size', () => {
    expect(full.mode).toBe('allRound');
    expect(full.enemies).toBeGreaterThanOrEqual(16);
    expect(full.opponent).toEqual(evenArenaArmy(4, ARENA_HOUSING));
    const [first] = full.match.rounds;
    expect(first.defender.stacks.map((s) => s.start)).toEqual(full.opponent.map((s) => s.count));
    expect(first.attacker.stacks.map((s) => s.start)).toEqual(full.stacks.map((s) => s.count));
  });

  it('beats the default even fill on enemies it never searched against', () => {
    const heldOut = assumedEnemies({
      level: 4,
      housing: ARENA_HOUSING,
      totals: ARENA_BONUS,
      seed: 987_654,
      count: 200,
    });
    const planned = scorePrimeArenaSet(full.stacks, ARENA_BONUS, 'attacker', heldOut);
    const fill = scorePrimeArenaSet(full.start.stacks, ARENA_BONUS, 'attacker', heldOut);
    expect(comparePrimeArenaSetScore(planned, fill, 'allRound')).toBeGreaterThan(0);
    expect(planned.wins).toBeGreaterThanOrEqual(fill.wins);
    expect(planned.lead).toBeGreaterThan(fill.lead);
  });

  it('is never worse than the default even fill on its own ranking', () => {
    for (const maxEvaluations of [1, 40, 600]) {
      const plan = planPrimeArena(arenaInput({ maxEvaluations }));
      expect(comparePrimeArenaSetScore(plan.setScore, plan.start.setScore, plan.mode)).toBeGreaterThanOrEqual(
        0,
      );
    }
  });

  it('ranks wins first, then how far ahead it finishes and how it does in the bad cases', () => {
    const base = { wins: 0.5, roundsWon: 1, lead: 0.2, badLead: -0.1 };
    const better = (other: Partial<typeof base>): number =>
      comparePrimeArenaSetScore({ ...base, ...other }, base, 'allRound');
    expect(better({ wins: 0.6, lead: -1, badLead: -1 })).toBeGreaterThan(0);
    expect(better({ lead: 0.3 })).toBeGreaterThan(0);
    expect(better({ badLead: 0 })).toBeGreaterThan(0);
    expect(better({ lead: 0.3, badLead: -0.3 })).toBeLessThan(0);
    expect(better({ roundsWon: 2 })).toBe(0);
  });

  it('plans the same squad for both roles: the role only decides who strikes first', () => {
    const attack = planPrimeArena(arenaInput({ role: 'attacker' }));
    const defence = planPrimeArena(arenaInput({ role: 'defender' }));
    expect(squadKey(defence.stacks)).toBe(squadKey(attack.stacks));
    expect(defence.setScore).toEqual(attack.setScore);
    expect(defence.role).toBe('defender');
    // As the defender we are the other side of the match, and strike first in round 2.
    const [, second] = defence.match.rounds;
    expect(second.first).toBe('defender');
    expect(second.defender.stacks.map((s) => s.start)).toEqual(defence.stacks.map((s) => s.count));
  });

  it('spends all housing: what is left buys no unit of the pool', () => {
    const pool = arenaInput().pool;
    const plan = planPrimeArena(
      arenaInput({ housing: { leadership: 52_001, authority: 0, dominance: 13_007 } }),
    );
    const cheapest = (p: string): number => Math.min(...pool.filter((u) => u.pool === p).map((u) => u.cost));
    expect(52_001 - spentIn(plan.stacks, 'leadership')).toBeLessThan(cheapest('leadership'));
    expect(13_007 - spentIn(plan.stacks, 'dominance')).toBeLessThan(cheapest('dominance'));
  });
});

describe('with a typed enemy: a counter-pick', () => {
  const counter = planPrimeArena(arenaInput({ ...SEARCH, enemy: TYPED }));

  it('fights exactly that army, carrying our own totals', () => {
    expect(counter.mode).toBe('counter');
    expect(counter.enemies).toBe(1);
    expect(counter.opponent).toEqual(TYPED);
    expect(counter.match.rounds[0].defender.stacks.map((s) => s.start)).toEqual(TYPED.map((s) => s.count));
    const army = { stacks: TYPED, totals: ARENA_BONUS };
    expect(counter.setScore).toEqual(scorePrimeArenaSet(counter.stacks, ARENA_BONUS, 'attacker', [army]));
  });

  it('does at least as well against it as the all-round squad', () => {
    const army = { stacks: TYPED, totals: ARENA_BONUS };
    const allRound = scorePrimeArenaSet(full.stacks, ARENA_BONUS, 'attacker', [army]);
    expect(comparePrimeArenaSetScore(counter.setScore, allRound, 'counter')).toBeGreaterThanOrEqual(0);
    expect(
      comparePrimeArenaSetScore(counter.setScore, counter.start.setScore, 'counter'),
    ).toBeGreaterThanOrEqual(0);
  });

  it('ranks the match result, then rounds won, then the lead', () => {
    const base = { wins: 0.5, roundsWon: 1, lead: 0.2, badLead: 0.2 };
    const better = (other: Partial<typeof base>): number =>
      comparePrimeArenaSetScore({ ...base, ...other }, base, 'counter');
    expect(better({ wins: 1, roundsWon: 0, lead: -1 })).toBeGreaterThan(0);
    expect(better({ roundsWon: 2, lead: -1 })).toBeGreaterThan(0);
    expect(better({ lead: 0.3 })).toBeGreaterThan(0);
  });

  it('is all-round again once the typed rows hold nobody', () => {
    const plan = planPrimeArena(arenaInput({ enemy: [], maxEvaluations: 20 }));
    expect(plan.mode).toBe('allRound');
  });
});
