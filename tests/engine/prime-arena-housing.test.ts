import { describe, expect, it } from 'vitest';

import { planPrimeArenaAttack } from '../../src/engine/primeArenaPlanner';
import { totalsFrom } from '../helpers/request';
import { monsterSet, troopSet } from '../helpers/units';

const TROOPS = troopSet('SW1', 'ARC1', 'RD1');
const MONSTERS = monsterSet('WE');
const BONUS = totalsFrom({ strength: { army: 80 }, health: { army: 60 } });
const pool = [...TROOPS, ...MONSTERS];
const cheapest = (p: string): number => Math.min(...pool.filter((u) => u.pool === p).map((u) => u.cost));

describe('planPrimeArenaAttack fills the housing as the calculator does', () => {
  const cases: [number, number][] = [
    [40_000, 6_000],
    [40_001, 6_007],
    [12_345, 999],
    [39_999, 5_003],
    [100_003, 77],
  ];
  it.each(cases)('leaves less than the cheapest unit unspent (L %i, D %i)', (leadership, dominance) => {
    const plan = planPrimeArenaAttack({
      pool,
      housing: { leadership, authority: 0, dominance },
      totals: BONUS,
      maxMillis: 1_500,
    });
    expect(plan.unspent.leadership).toBeLessThan(cheapest('leadership'));
    expect(plan.unspent.leadership).toBe(leadership - plan.spent.leadership);
    expect(plan.unspent.dominance).toBe(dominance - plan.spent.dominance);
    expect(plan.unspent.dominance).toBeLessThan(cheapest('dominance'));
    expect(plan.maxed).toEqual({ leadership: true, dominance: true });
  });

  it('is maxed at zero housing and when the leftover buys nothing', () => {
    const none = planPrimeArenaAttack({
      pool,
      housing: { leadership: 40_000, authority: 0, dominance: 0 },
      totals: BONUS,
      maxMillis: 1_500,
    });
    expect(none.unspent.dominance).toBe(0);
    expect(none.maxed.dominance).toBe(true);
    const thin = planPrimeArenaAttack({
      pool,
      housing: { leadership: 40_000, authority: 0, dominance: 1 },
      totals: BONUS,
      maxMillis: 1_500,
    });
    expect(thin.unspent.dominance).toBe(1);
    expect(thin.maxed.dominance).toBe(true);
  });

  it('says a pool is not maxed when the squad has no unit to spend it on', () => {
    const plan = planPrimeArenaAttack({
      pool: TROOPS,
      housing: { leadership: 40_000, authority: 0, dominance: 6_000 },
      totals: BONUS,
      maxMillis: 1_500,
    });
    expect(plan.unspent.dominance).toBe(6_000);
    expect(plan.maxed.dominance).toBe(false);
    expect(plan.maxed.leadership).toBe(true);
  });
});
