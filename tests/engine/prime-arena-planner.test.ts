/** B-46 — the planner's basics: what a squad may be, whatever it is ranked against. */
import { describe, expect, it } from 'vitest';

import { primeArenaScore } from '../../src/engine/primeArena';
import { planPrimeArena } from '../../src/engine/primeArenaPlanner';
import { evenArenaArmy } from '../../src/engine/primeArenaEnemies';
import { arenaInput, spentIn, squadKey, troopsAt } from '../helpers/primeArenaPlanner';
import { primeArenaPool } from '../../src/engine/primeArenaInputs';
import { monsterSet, troopSet } from '../helpers/units';

describe('planPrimeArena', () => {
  it('stays inside Leadership and Dominance and uses most of both', () => {
    const plan = planPrimeArena(arenaInput());
    expect(spentIn(plan.stacks, 'leadership')).toBeLessThanOrEqual(52_748);
    expect(spentIn(plan.stacks, 'dominance')).toBeLessThanOrEqual(13_011);
    expect(spentIn(plan.stacks, 'leadership')).toBeGreaterThan(52_748 * 0.95);
    expect(spentIn(plan.stacks, 'dominance')).toBeGreaterThan(13_011 * 0.95);
  });

  it('fields only pool units, each once, with positive counts', () => {
    const pool = primeArenaPool(troopsAt(4, { excludedUnitIds: ['rider-4'] }));
    const plan = planPrimeArena(arenaInput({ pool }));
    const ids = plan.stacks.map((s) => s.unit.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of plan.stacks) {
      expect(pool.map((u) => u.id)).toContain(s.unit.id);
      expect(s.count).toBeGreaterThan(0);
    }
  });

  it('takes no monsters when there is no Dominance', () => {
    const plan = planPrimeArena(arenaInput({ housing: { leadership: 40_000, authority: 0, dominance: 0 } }));
    expect(plan.stacks.some((s) => s.unit.kind === 'monster')).toBe(false);
  });

  it('respects maxStacks, which is 8 by default', () => {
    for (const maxStacks of [1, 2, 3]) {
      const plan = planPrimeArena(arenaInput({ maxStacks, maxEvaluations: 300 }));
      expect(plan.stacks.length).toBeLessThanOrEqual(maxStacks);
      expect(plan.start.stacks.length).toBeLessThanOrEqual(maxStacks);
      expect(plan.stacks.length).toBeGreaterThan(0);
    }
    expect(planPrimeArena(arenaInput({ maxEvaluations: 300 })).stacks.length).toBeLessThanOrEqual(8);
  });

  it('starts from the default even fill: the top tiers, each pool split evenly by housing', () => {
    const { start } = planPrimeArena(arenaInput({ maxEvaluations: 1 }));
    const even = evenArenaArmy(4, arenaInput().housing);
    expect(start.stacks.map((s) => s.unit.id).sort()).toEqual(even.map((s) => s.unit.id).sort());
    for (const stack of start.stacks) {
      const plain = even.find((s) => s.unit.id === stack.unit.id)!;
      // The same fill, with the few units the rounding left over added.
      expect(stack.count - plain.count).toBeGreaterThanOrEqual(0);
      expect((stack.count - plain.count) * stack.unit.cost).toBeLessThan(40);
    }
  });

  it('is deterministic', () => {
    expect(squadKey(planPrimeArena(arenaInput()).stacks)).toBe(squadKey(planPrimeArena(arenaInput()).stacks));
  });

  it('honours an evaluation budget', () => {
    const plan = planPrimeArena(arenaInput({ maxEvaluations: 5 }));
    expect(plan.evaluations).toBeLessThanOrEqual(5);
    expect(plan.stacks.length).toBeGreaterThan(0);
  });

  it('honours the wall-clock cap', () => {
    const started = Date.now();
    planPrimeArena(arenaInput({ maxMillis: 300, maxEvaluations: Infinity }));
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  it('gives the headline match the score of our side', () => {
    const plan = planPrimeArena(arenaInput({ maxEvaluations: 50 }));
    expect(plan.score).toEqual(primeArenaScore(plan.match));
  });

  it('plans an empty squad, without enemies, while the level fields nobody', () => {
    const plan = planPrimeArena(
      arenaInput({ pool: [...troopSet('SW1'), ...monsterSet('WE')], level: 0, maxEvaluations: 50 }),
    );
    expect(plan.enemies).toBe(0);
    expect(plan.setScore).toEqual({ wins: 0, roundsWon: 0, lead: 0, badLead: 0 });
  });
});
