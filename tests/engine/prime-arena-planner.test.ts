import { describe, expect, it } from 'vitest';

import { primeArenaScore } from '../../src/engine/primeArena';
import {
  comparePanelScore,
  planPrimeArena,
  scorePrimeArenaPanel,
} from '../../src/engine/primeArenaPlanner';
import type { PrimeArenaPlanInput } from '../../src/engine/primeArenaPlanner';
import { totalsFrom } from '../helpers/request';
import { monsterSet, troopSet } from '../helpers/units';

const TROOPS = troopSet('SW1', 'ARC1', 'RD1');
const MONSTERS = monsterSet('WE');
const BONUS = totalsFrom({ strength: { army: 80 }, health: { army: 60 } });

const input = (over: Partial<PrimeArenaPlanInput> = {}): PrimeArenaPlanInput => ({
  pool: [...TROOPS, ...MONSTERS],
  housing: { leadership: 40_000, authority: 0, dominance: 6_000 },
  totals: BONUS,
  maxMillis: 3_000,
  ...over,
});

const spent = (stacks: { unit: { pool: string; cost: number }; count: number }[], pool: string): number =>
  stacks.filter((s) => s.unit.pool === pool).reduce((a, s) => a + s.unit.cost * s.count, 0);

describe('planPrimeArena', () => {
  it('stays inside Leadership and Dominance and uses most of both', () => {
    const plan = planPrimeArena(input());
    expect(spent(plan.stacks, 'leadership')).toBeLessThanOrEqual(40_000);
    expect(spent(plan.stacks, 'dominance')).toBeLessThanOrEqual(6_000);
    expect(spent(plan.stacks, 'leadership')).toBeGreaterThan(40_000 * 0.95);
    expect(spent(plan.stacks, 'dominance')).toBeGreaterThan(6_000 * 0.95);
  });

  it('fields only pool units, with positive counts', () => {
    const plan = planPrimeArena(input());
    const ids = new Set([...TROOPS, ...MONSTERS].map((u) => u.id));
    expect(plan.stacks.length).toBeGreaterThan(0);
    for (const s of plan.stacks) {
      expect(ids.has(s.unit.id)).toBe(true);
      expect(s.count).toBeGreaterThan(0);
    }
  });

  it('takes no monsters when there is no Dominance', () => {
    const plan = planPrimeArena(input({ housing: { leadership: 40_000, authority: 0, dominance: 0 } }));
    expect(plan.stacks.some((s) => s.unit.kind === 'monster')).toBe(false);
  });

  it('breaks the match down per round against a mirror of the same composition', () => {
    const plan = planPrimeArena(input());
    expect(plan.match.rounds).toHaveLength(2);
    expect(plan.match.rounds[0].first).toBe('attacker');
    expect(plan.match.rounds[1].first).toBe('defender');
    const mine = plan.stacks.map((s) => s.count);
    for (const round of plan.match.rounds) {
      expect(round.attacker.stacks.map((s) => s.start)).toEqual(mine);
      expect(round.defender.stacks.map((s) => s.start)).toEqual(mine);
    }
    expect(plan.score).toEqual(primeArenaScore(plan.match));
  });

  it('ranks at least as high as an even split of each pool', () => {
    const plan = planPrimeArena(input());
    const even = [
      ...TROOPS.map((unit) => ({ unit, count: Math.floor(40_000 / TROOPS.length / unit.cost) })),
      ...MONSTERS.map((unit) => ({ unit, count: Math.floor(6_000 / MONSTERS.length / unit.cost) })),
    ];
    const baseline = scorePrimeArenaPanel(even, BONUS, 'attacker', plan.panel);
    expect(comparePanelScore(plan.panelScore, baseline)).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic', () => {
    const a = planPrimeArena(input());
    const b = planPrimeArena(input());
    expect(b.stacks.map((s) => [s.unit.id, s.count])).toEqual(a.stacks.map((s) => [s.unit.id, s.count]));
  });

  it('honours an evaluation budget', () => {
    const plan = planPrimeArena(input({ maxEvaluations: 5 }));
    expect(plan.evaluations).toBeLessThanOrEqual(5);
    expect(plan.stacks.length).toBeGreaterThan(0);
  });

  it('finishes within a few seconds at a full-size arena', () => {
    const started = Date.now();
    planPrimeArena(
      input({ housing: { leadership: 2_000_000, authority: 0, dominance: 300_000 }, maxMillis: 3_000 }),
    );
    expect(Date.now() - started).toBeLessThan(5_000);
  });
});
