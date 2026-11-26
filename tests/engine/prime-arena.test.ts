import { describe, expect, it } from 'vitest';

import { comparePrimeArenaScore, primeArenaMatch, primeArenaScore } from '../../src/engine/primeArena';
import type { PrimeArenaArmy } from '../../src/engine/primeArena';
import { totalsFrom } from '../helpers/request';
import { troopSet } from '../helpers/units';

const [SW1, ARC1, RD1] = troopSet('SW1', 'ARC1', 'RD1');
const NO_BONUS = totalsFrom({});
const STRONG = totalsFrom({ strength: { army: 200 }, health: { army: 100 } });

function army(totals = NO_BONUS): PrimeArenaArmy {
  return {
    totals,
    stacks: [
      { unit: SW1!, count: 600 },
      { unit: ARC1!, count: 500 },
      { unit: RD1!, count: 400 },
    ],
  };
}

describe('primeArenaMatch', () => {
  it('a mirror splits the rounds: each side wins the round it strikes first', () => {
    const match = primeArenaMatch(army(), army());
    expect(match.rounds).toHaveLength(2);
    expect(match.rounds[0]!.first).toBe('attacker');
    expect(match.rounds[1]!.first).toBe('defender');
    expect(match.rounds[0]!.winner).toBe('attacker');
    expect(match.rounds[1]!.winner).toBe('defender');
    expect(match.winner).toBe('draw');
    expect(match.attackerRoundsWon).toBe(1);
  });

  it('each round starts from full armies', () => {
    const match = primeArenaMatch(army(STRONG), army());
    for (const round of match.rounds) {
      expect(round.attacker.stacks.map((s) => s.start)).toEqual([600, 500, 400]);
      expect(round.defender.stacks.map((s) => s.start)).toEqual([600, 500, 400]);
    }
  });

  it('a clearly stronger army wins both rounds and the match', () => {
    const match = primeArenaMatch(army(STRONG), army());
    expect(match.attackerRoundsWon).toBe(2);
    expect(match.winner).toBe('attacker');
    expect(match.rounds[0]!.attacker.share).toBeGreaterThan(0);
    expect(match.rounds[0]!.defender.share).toBe(0);
  });

  it('survivor share is surviving troops over starting troops, in [0, 1]', () => {
    const match = primeArenaMatch(army(), army());
    for (const round of match.rounds) {
      for (const side of [round.attacker, round.defender]) {
        const total = side.stacks.reduce((a, s) => a + s.start, 0);
        const left = side.stacks.reduce((a, s) => a + s.survivors, 0);
        expect(side.share).toBeCloseTo(left / total, 10);
        expect(side.share).toBeGreaterThanOrEqual(0);
        expect(side.share).toBeLessThanOrEqual(1);
      }
    }
  });

  it('the army that strikes first has the edge on an even match', () => {
    const match = primeArenaMatch(army(), army());
    expect(match.rounds[0]!.attacker.share).toBeGreaterThan(match.rounds[0]!.defender.share);
    expect(match.rounds[1]!.defender.share).toBeGreaterThan(match.rounds[1]!.attacker.share);
  });

  it('class counters steer the hit: archers keep more troops against a melee squad than a ranged one', () => {
    const archers: PrimeArenaArmy = { totals: NO_BONUS, stacks: [{ unit: ARC1!, count: 300 }] };
    const melee: PrimeArenaArmy = { totals: NO_BONUS, stacks: [{ unit: SW1!, count: 300 }] };
    const ranged: PrimeArenaArmy = { totals: NO_BONUS, stacks: [{ unit: ARC1!, count: 300 }] };
    const vsMelee = primeArenaMatch(archers, melee).rounds[0]!.attacker;
    const vsRanged = primeArenaMatch(archers, ranged).rounds[0]!.attacker;
    // Mirror archers trade evenly; the +melee counter lets archers keep more troops against swordsmen.
    expect(vsMelee.share).toBeGreaterThan(vsRanged.share);
  });

  it('targets the living stack with the highest total HP first', () => {
    const attacker: PrimeArenaArmy = { totals: NO_BONUS, stacks: [{ unit: SW1!, count: 50 }] };
    const defender: PrimeArenaArmy = {
      totals: NO_BONUS,
      stacks: [
        { unit: SW1!, count: 10 },
        { unit: SW1!, count: 1000 },
      ],
    };
    const round = primeArenaMatch(attacker, defender).rounds[0]!;
    const [small, big] = round.defender.stacks;
    expect(big!.survivors).toBeLessThan(big!.start);
    expect(small!.survivors).toBe(small!.start);
  });

  it('is deterministic', () => {
    expect(primeArenaMatch(army(), army(STRONG))).toEqual(primeArenaMatch(army(), army(STRONG)));
  });
});

describe('primeArenaScore', () => {
  it('counts rounds won, then adds the survivor share over both rounds', () => {
    const win2 = primeArenaMatch(army(STRONG), army());
    const mirror = primeArenaMatch(army(), army());
    const lose2 = primeArenaMatch(army(), army(STRONG));
    expect(primeArenaScore(win2).roundsWon).toBe(2);
    expect(primeArenaScore(mirror).roundsWon).toBe(1);
    expect(primeArenaScore(lose2).roundsWon).toBe(0);
    expect(primeArenaScore(win2).survivorShare).toBeCloseTo(
      win2.rounds[0]!.attacker.share + win2.rounds[1]!.attacker.share,
      10,
    );
  });

  it('orders by rounds won first, survivor share second', () => {
    const better = { roundsWon: 1, survivorShare: 0.2 };
    const worse = { roundsWon: 0, survivorShare: 1.9 };
    const sameRounds = { roundsWon: 1, survivorShare: 0.1 };
    expect(comparePrimeArenaScore(better, worse)).toBeGreaterThan(0);
    expect(comparePrimeArenaScore(better, sameRounds)).toBeGreaterThan(0);
    expect(comparePrimeArenaScore(sameRounds, better)).toBeLessThan(0);
  });
});
