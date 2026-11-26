import { describe, expect, it } from 'vitest';

import {
  planPrimeArenaAttack,
  primeArenaPanel,
  scorePrimeArenaPanel,
} from '../../src/engine/primeArenaPlanner';
import type { PrimeArenaPlanInput } from '../../src/engine/primeArenaPlanner';
import { totalsFrom } from '../helpers/request';
import { monsterSet, troopSet } from '../helpers/units';

const TROOPS = troopSet('SW1', 'ARC1', 'RD1');
const MONSTERS = monsterSet('WE');
const POOL = [...TROOPS, ...MONSTERS];
const BONUS = totalsFrom({ strength: { army: 80 }, health: { army: 60 } });
const HOUSING = { leadership: 20_000, authority: 0, dominance: 3_000 };

const input = (over: Partial<PrimeArenaPlanInput> = {}): PrimeArenaPlanInput => ({
  pool: POOL,
  housing: HOUSING,
  totals: BONUS,
  maxMillis: 1_500,
  maxEvaluations: 3_000,
  ...over,
});

type Plan = ReturnType<typeof planPrimeArenaAttack>;

const meleeShare = (plan: Plan): number => {
  const cost = (s: Plan['stacks'][number]): number => s.unit.cost * s.count;
  const all = plan.stacks.reduce((a, s) => a + cost(s), 0);
  const melee = plan.stacks.filter((s) => s.unit.category === 'melee').reduce((a, s) => a + cost(s), 0);
  return melee / all;
};

const key = (p: Plan): string => p.stacks.map((s) => `${s.unit.id}:${s.count}`).join();

describe('planPrimeArenaAttack: panel and role', () => {
  it('never ranks below the even-split start, on the same panel score', () => {
    for (const role of ['attacker', 'defender'] as const) {
      const plan = planPrimeArenaAttack(input({ role }));
      expect(plan.panelScore.result).toBeGreaterThanOrEqual(plan.start.panelScore.result - 1e-9);
      if (Math.abs(plan.panelScore.result - plan.start.panelScore.result) < 1e-9) {
        expect(plan.panelScore.roundsWon).toBeGreaterThanOrEqual(plan.start.panelScore.roundsWon - 1e-9);
      }
      // The start is also reproducible from outside: an even split of each pool, scored by the exported scorer.
      const even = [
        ...TROOPS.map((unit) => ({ unit, count: Math.floor(HOUSING.leadership / 3 / unit.cost) })),
        ...MONSTERS.map((unit) => ({ unit, count: Math.floor(HOUSING.dominance / unit.cost) })),
      ];
      const outside = scorePrimeArenaPanel(even, BONUS, role, plan.panel);
      expect(plan.panelScore.result).toBeGreaterThanOrEqual(outside.result - 1e-9);
    }
  });

  it('spends all housing: what is left buys no unit of the pool', () => {
    const plan = planPrimeArenaAttack(
      input({ housing: { leadership: 20_003, authority: 0, dominance: 3_007 } }),
    );
    const cheapest = (p: string): number => Math.min(...POOL.filter((u) => u.pool === p).map((u) => u.cost));
    expect(plan.unspent.leadership).toBeLessThan(cheapest('leadership'));
    expect(plan.unspent.dominance).toBeLessThan(cheapest('dominance'));
  });

  it('describes the panel: attacker 0.8..1.0 mean, defender 1.0..1.25 worst, under-filled members present', () => {
    const attacker = planPrimeArenaAttack(input({ role: 'attacker', maxEvaluations: 20 }));
    const defender = planPrimeArenaAttack(input({ role: 'defender', maxEvaluations: 20 }));
    expect(attacker.panel).toEqual(primeArenaPanel('attacker'));
    expect(defender.panel).toEqual(primeArenaPanel('defender'));
    const strengths = (p: typeof attacker.panel): number[] => p.map((m) => m.strength);
    expect(Math.min(...strengths(attacker.panel))).toBeCloseTo(0.8);
    expect(Math.max(...strengths(attacker.panel))).toBeCloseTo(1.0);
    expect(Math.min(...strengths(defender.panel))).toBeCloseTo(1.0);
    expect(Math.max(...strengths(defender.panel))).toBeCloseTo(1.25);
    expect(attacker.panel.some((m) => m.fill < 1 && m.fill >= 0.7)).toBe(true);
    expect(defender.panel.some((m) => m.fill < 1 && m.fill >= 0.7)).toBe(true);
    expect(attacker.aggregate).toBe('mean');
    expect(defender.aggregate).toBe('worst');
  });

  it('defaults to the attacker role', () => {
    expect(planPrimeArenaAttack(input({ maxEvaluations: 20 })).role).toBe('attacker');
  });

  it('role changes the panel and so what the plan is judged on', () => {
    const a = planPrimeArenaAttack(input({ role: 'attacker' }));
    const d = planPrimeArenaAttack(input({ role: 'defender' }));
    expect(a.panel).not.toEqual(d.panel);
    expect(key(a) !== key(d) || a.panelScore.survivorShare !== d.panelScore.survivorShare).toBe(true);
  });

  it('respects maxStacks, with repeats of a unit allowed', () => {
    for (const maxStacks of [1, 2, 3]) {
      const plan = planPrimeArenaAttack(input({ maxStacks, maxEvaluations: 800 }));
      expect(plan.stacks.length).toBeLessThanOrEqual(maxStacks);
      expect(plan.stacks.length).toBeGreaterThan(0);
    }
    const wide = planPrimeArenaAttack(input({ pool: troopSet('SW1'), maxStacks: 4, maxEvaluations: 800 }));
    expect(wide.stacks.length).toBeLessThanOrEqual(4);
  });

  it('defaults the stack cap to 8', () => {
    const many = troopSet('SW1', 'SW2', 'SW3', 'ARC1', 'ARC2', 'ARC3', 'RD1', 'RD2', 'RD3', 'RD4');
    const plan = planPrimeArenaAttack(input({ pool: many, maxEvaluations: 300 }));
    expect(plan.stacks.length).toBeLessThanOrEqual(8);
  });

  it('fields melee when a Leonidas-style +280 % melee health is in the totals', () => {
    const troopsOnly = { pool: TROOPS, housing: { leadership: 20_000, authority: 0, dominance: 0 } };
    const base = planPrimeArenaAttack(input({ ...troopsOnly, maxEvaluations: 2_500 }));
    const leonidas = planPrimeArenaAttack(
      input({
        ...troopsOnly,
        totals: totalsFrom({ strength: { army: 80 }, health: { army: 60, melee: 280 } }),
      }),
    );
    expect(meleeShare(leonidas)).toBeGreaterThan(meleeShare(base) + 0.15);
  });

  it('a captain health bonus on one category changes the plan', () => {
    const base = planPrimeArenaAttack(input({ maxEvaluations: 2_500 }));
    const boosted = planPrimeArenaAttack(
      input({ totals: totalsFrom({ strength: { army: 80 }, health: { army: 60, ranged: 200 } }) }),
    );
    expect(key(boosted)).not.toBe(key(base));
  });

  it('is deterministic under an evaluation budget', () => {
    const a = planPrimeArenaAttack(input({ maxMillis: 60_000, maxEvaluations: 600 }));
    const b = planPrimeArenaAttack(input({ maxMillis: 60_000, maxEvaluations: 600 }));
    expect(key(b)).toBe(key(a));
  });

  it('honours the wall-clock cap', () => {
    const started = Date.now();
    planPrimeArenaAttack(input({ maxMillis: 300, maxEvaluations: Infinity }));
    expect(Date.now() - started).toBeLessThan(2_000);
  });
});
