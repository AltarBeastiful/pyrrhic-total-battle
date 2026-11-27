import { describe, expect, it } from 'vitest';

import { unitById } from '../../src/data';
import type { UnitDef } from '../../src/data/types';
import {
  absorbDamage,
  comparePrimeArenaScore,
  primeArenaHitDamage,
  primeArenaMatch,
  primeArenaScore,
  primeArenaShare,
} from '../../src/engine/primeArena';
import type { PrimeArenaArmy, PrimeArenaScore } from '../../src/engine/primeArena';
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

  it('survivor share is surviving housing cost over starting housing cost, in [0, 1]', () => {
    const match = primeArenaMatch(army(), army());
    for (const round of match.rounds) {
      for (const side of [round.attacker, round.defender]) {
        const total = side.stacks.reduce((n, st) => n + st.start * st.unit.cost, 0);
        const left = side.stacks.reduce((n, st) => n + st.survivors * st.unit.cost, 0);
        expect(side.share).toBeCloseTo(left / total, 10);
        expect(side.share).toBeGreaterThanOrEqual(0);
        expect(side.share).toBeLessThanOrEqual(1);
      }
    }
  });

  it('sides alternate one stack per turn, the round leader first, strongest unacted stack first', () => {
    const match = primeArenaMatch(army(), army());
    const stacks = army().stacks;
    const power = (i: number): number => stacks[i]!.count * stacks[i]!.unit.strength;
    const strongest = [0, 1, 2].reduce((best, i) => (power(i) > power(best) ? i : best), 0);
    for (const round of match.rounds) {
      const other = round.first === 'attacker' ? 'defender' : 'attacker';
      expect(round.steps[0]!.side).toBe(round.first);
      expect(round.steps.slice(0, 6).map((st) => st.side)).toEqual([
        round.first,
        other,
        round.first,
        other,
        round.first,
        other,
      ]);
      expect(round.steps[0]!.stack).toBe(strongest);
    }
  });

  it('records the damage and the kills of every step', () => {
    const round = primeArenaMatch(army(STRONG), army()).rounds[0]!;
    expect(round.steps.length).toBeGreaterThan(0);
    for (const step of round.steps) {
      expect(step.damage).toBeGreaterThan(0);
      expect(step.kills).toBeGreaterThanOrEqual(0);
    }
  });

  it('the army that strikes first has the edge on an even match', () => {
    const match = primeArenaMatch(army(), army());
    expect(match.rounds[0]!.attacker.share).toBeGreaterThan(match.rounds[0]!.defender.share);
    expect(match.rounds[1]!.defender.share).toBeGreaterThan(match.rounds[1]!.attacker.share);
  });

  it('class counters steer the hit: archers keep more troops against a melee squad than a ranged one', () => {
    const archers: PrimeArenaArmy = { totals: NO_BONUS, stacks: [{ unit: ARC1!, count: 300 }] };
    const melee: PrimeArenaArmy = { totals: NO_BONUS, stacks: [{ unit: U('spearman-1'), count: 300 }] };
    const ranged: PrimeArenaArmy = { totals: NO_BONUS, stacks: [{ unit: ARC1!, count: 300 }] };
    const vsMelee = primeArenaMatch(archers, melee).rounds[0]!.attacker;
    const vsRanged = primeArenaMatch(archers, ranged).rounds[0]!.attacker;
    // Mirror archers trade evenly; the +melee counter lets archers keep more troops against swordsmen.
    expect(vsMelee.share).toBeGreaterThan(vsRanged.share);
  });

  it('is deterministic', () => {
    expect(primeArenaMatch(army(), army(STRONG))).toEqual(primeArenaMatch(army(), army(STRONG)));
  });
});

const U = (id: string): UnitDef => {
  const unit = unitById(id);
  if (!unit) throw new Error(`no unit ${id}`);
  return unit;
};

describe('absorbDamage: a running HP pool per stack, the remainder is kept, nothing spills', () => {
  // Replay of F1 round 2, Dorikelv's Magic Dragon stack: 419 dragons at 163,800 HP take seven hits.
  it('replays the seven logged hits on a 419-dragon stack', () => {
    const pool = { units: 419, hpPerUnit: 163_800, taken: 0 };
    const hits = [1_124_400, 32_597_500, 5_782_210, 1_124_400, 7_514_000, 11_570_756, 8_918_934];
    const kills = hits.map((damage) => absorbDamage(pool, damage).kills);
    // Logged counts before the next hit: 413, 214, 178, 171, 126, 55, then wiped.
    expect(kills).toEqual([6, 199, 36, 7, 45, 71, 55]);
    // The seven figures add up to the whole pool: 419 x 163,800.
    expect(pool.taken).toBe(68_632_200);
  });

  it('keeps the leftover between hits: two 1,124,400 hits kill 6 then 7, not 6 and 6', () => {
    const pool = { units: 419, hpPerUnit: 163_800, taken: 0 };
    expect(absorbDamage(pool, 1_124_400).kills).toBe(6);
    expect(absorbDamage(pool, 1_124_400).kills).toBe(7);
  });

  it('a wipe absorbs exactly the remaining pool and loses the overkill', () => {
    const pool = { units: 419, hpPerUnit: 163_800, taken: 0 };
    const hit = absorbDamage(pool, 100_000_000);
    expect(hit.absorbed).toBe(68_632_200);
    expect(hit.kills).toBe(419);
    expect(absorbDamage(pool, 5).absorbed).toBe(0);
  });
});

describe('primeArenaShare: the round percentage is surviving housing cost', () => {
  type Row = [string, number, number];
  // [unit, start, survivors] from the logged fights; the game shows the rounded percentage.
  // F1 R1 survivors derive from the logged losses (A 5,738 / W 4,860 / MD 33 / IP 201 / GM 259 / R 6,569).
  const cases: [string, number, number, Row[]][] = [
    [
      'F1 R1 Zololar',
      54.55,
      55,
      [
        ['archer-4', 13_139, 13_139 - 5_738],
        ['spearman-4', 13_138, 13_138],
        ['rider-4', 6_569, 0],
        ['swordsman-4', 13_138, 13_138 - 4_860],
        ['magic-dragon', 250, 250 - 33],
        ['many-armed-guardian', 295, 295],
        ['ice-phoenix', 215, 215 - 201],
        ['gorgon-medusa', 323, 323 - 259],
      ],
    ],
    [
      'F1 R2 Zololar',
      12.74,
      13,
      [
        ['archer-4', 13_139, 2_016],
        ['spearman-4', 13_138, 3_173],
        ['rider-4', 6_569, 0],
        ['swordsman-4', 13_138, 2_084],
        ['magic-dragon', 250, 8],
        ['many-armed-guardian', 295, 68],
        ['ice-phoenix', 215, 12],
        ['gorgon-medusa', 323, 4],
      ],
    ],
    [
      'F2 R1 Bad Boy',
      9.04,
      9,
      [
        ['archer-4', 13_926, 1_246],
        ['spearman-4', 13_926, 0],
        ['rider-4', 6_963, 0],
        ['swordsman-4', 13_926, 1_723],
        ['magic-dragon', 274, 99],
        ['many-armed-guardian', 324, 188],
        ['ice-phoenix', 237, 0],
        ['gorgon-medusa', 356, 0],
      ],
    ],
    [
      'F2 R2 Bad Boy',
      22.98,
      23,
      [
        ['archer-4', 13_926, 5_361],
        ['spearman-4', 13_926, 155],
        ['rider-4', 6_963, 197],
        ['swordsman-4', 13_926, 4_858],
        ['magic-dragon', 274, 190],
        ['many-armed-guardian', 324, 258],
        ['ice-phoenix', 237, 0],
        ['gorgon-medusa', 356, 0],
      ],
    ],
  ];
  it.each(cases)('%s: %s %%', (_name, exact, shown, rows) => {
    const share =
      primeArenaShare(rows.map(([id, start, survivors]) => ({ unit: U(id), start, survivors }))) * 100;
    expect(share).toBeCloseTo(exact, 2);
    expect(Math.round(share)).toBe(shown);
  });
});

describe('Arena specialist bonuses: double damage and +105 % against non-monster troops', () => {
  const SW4 = U('swordsman-4');
  const hit = (count: number, strengthPct: number, target: string): number =>
    primeArenaHitDamage(SW4, count, totalsFrom({ strength: { specialist: strengthPct } }), U(target));

  // Swordsman IV, 290 strength. Logged: Zololar's 13,138 hit a Rider (mounted: 66 table + 105) for 61,722,324
  // at a 6.39 strength multiplier; Dorikelv's 3,809 hit a Swordsman for 10,427,518 at 3.67; Bad Boy's 7,825
  // hit a Spearman for 27,072,152 at 4.915; Zololar's 3,122 hit a Magic Dragon for 11,570,756.
  it('Zololar 13,138 Swordsmen against Riders', () => {
    expect(hit(13_138, 539, 'rider-4')).toBe(61_722_324);
  });
  it('Dorikelv 3,809 Swordsmen against Swordsmen', () => {
    expect(hit(3_809, 267, 'swordsman-4')).toBe(10_427_518);
  });
  it('Bad Boy 7,825 Swordsmen against Spearmen', () => {
    expect(hit(7_825, 391.5, 'spearman-4')).toBe(27_072_152);
  });
  it('against a monster only the double damage applies (no +105)', () => {
    expect(hit(3_122, 539, 'magic-dragon')).toBe(11_570_756);
  });
  it('a non-specialist gets neither', () => {
    // Archer IV: 290 strength, +176 % against melee
    expect(primeArenaHitDamage(U('archer-4'), 100, totalsFrom({}), U('spearman-4'))).toBe(
      Math.round(100 * 290 * 2.76),
    );
  });
  it('double-damage chance is an expected value on top', () => {
    // Rider IV: 580 strength, +219 % against ranged, 5 % double-damage chance
    expect(primeArenaHitDamage(U('rider-4'), 100, totalsFrom({}), U('archer-4'))).toBeCloseTo(
      100 * 580 * 3.19 * 1.05,
      4,
    );
  });
});

describe('primeArenaMatch result wording', () => {
  const unit = U('archer-4');
  const mk = (n: number): PrimeArenaArmy => ({ totals: NO_BONUS, stacks: [{ unit, count: n }] });
  it('winning both rounds is a victory', () => {
    const match = primeArenaMatch(mk(2000), mk(200));
    expect(match.attackerRoundsWon).toBe(2);
    expect(match.winner).toBe('attacker');
  });
  it('a 1-1 mirror split is a draw: equal shares in the rounds each side won', () => {
    const match = primeArenaMatch(mk(1000), mk(1000));
    expect(match.attackerRoundsWon).toBe(1);
    expect(match.defenderRoundsWon).toBe(1);
    expect(match.rounds[0]!.attacker.share).toBeCloseTo(match.rounds[1]!.defender.share, 10);
    expect(match.winner).toBe('draw');
  });
  it('a 1-1 split goes to the higher share in the round that side won', () => {
    // Attacker slightly stronger: it still wins its own round by more than the defender wins its round.
    const match = primeArenaMatch(mk(1030), mk(1000));
    expect(match.attackerRoundsWon).toBe(1);
    expect(match.defenderRoundsWon).toBe(1);
    const a = match.rounds.find((r) => r.winner === 'attacker')!.attacker.share;
    const d = match.rounds.find((r) => r.winner === 'defender')!.defender.share;
    expect(a).toBeGreaterThan(d);
    expect(match.winner).toBe('attacker');
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

  it('the match result outranks rounds and share: win > draw > loss', () => {
    const win: PrimeArenaScore = { result: 2, roundsWon: 1, survivorShare: 0.1 };
    const draw: PrimeArenaScore = { result: 1, roundsWon: 1, survivorShare: 1.9 };
    expect(comparePrimeArenaScore(win, draw)).toBeGreaterThan(0);
    expect(primeArenaScore(primeArenaMatch(army(STRONG), army())).result).toBe(2);
    expect(primeArenaScore(primeArenaMatch(army(), army())).result).toBe(1);
    expect(primeArenaScore(primeArenaMatch(army(), army(STRONG))).result).toBe(0);
  });

  it('orders by rounds won first, survivor share second', () => {
    const better: PrimeArenaScore = { result: 1, roundsWon: 1, survivorShare: 0.2 };
    const worse: PrimeArenaScore = { result: 1, roundsWon: 0, survivorShare: 1.9 };
    const sameRounds: PrimeArenaScore = { result: 1, roundsWon: 1, survivorShare: 0.1 };
    expect(comparePrimeArenaScore(better, worse)).toBeGreaterThan(0);
    expect(comparePrimeArenaScore(better, sameRounds)).toBeGreaterThan(0);
    expect(comparePrimeArenaScore(sameRounds, better)).toBeLessThan(0);
  });
});

/** A unit made for one rule: a table unit with its figures replaced, so a hit is easy to work out by hand. */
const made = (id: string, over: Partial<UnitDef>): UnitDef => ({
  ...U('swordsman-4'),
  id,
  name: id,
  group: 'guardsmen',
  category: 'melee',
  health: 100,
  strength: 10,
  strengthAgainst: {},
  doubleDamageChance: 0,
  ...over,
});
const monster = (id: string, over: Partial<UnitDef>): UnitDef =>
  made(id, { kind: 'monster', group: 'monster', race: 'beast', ...over });
const side = (...stacks: [UnitDef, number][]): PrimeArenaArmy => ({
  totals: NO_BONUS,
  stacks: stacks.map(([unit, count]) => ({ unit, count })),
});
/** The stack the attacker's first turn of round 1 hit. */
const firstTarget = (attacker: PrimeArenaArmy, defender: PrimeArenaArmy): number =>
  primeArenaMatch(attacker, defender).rounds[0].steps[0]!.target;

describe('target choice: the stack the hit would damage most, up to what it has left (B-46)', () => {
  // 100 units of strength 10: 1,000 damage, 2,000 on a flying stack (+100 %).
  const hitter = made('hitter', { strengthAgainst: { flying: 100 } });

  it('takes the larger hit over the larger stack', () => {
    const attacker = side([hitter, 100]);
    const defender = side([made('wall', {}), 1_000], [made('bird', { category: 'flying' }), 100]);
    expect(firstTarget(attacker, defender)).toBe(1);
  });

  it('counts only the damage a stack can still take', () => {
    // The flying stack holds 5 x 100 = 500 health: 500 of the 2,000 would count, less than 1,000 on the wall.
    const attacker = side([hitter, 100]);
    const defender = side([made('wall', {}), 1_000], [made('bird', { category: 'flying' }), 5]);
    expect(firstTarget(attacker, defender)).toBe(0);
  });

  it('breaks an equal hit toward the stack that would hit back hardest', () => {
    const attacker = side([hitter, 100]);
    const weak = made('weak', { strength: 5 });
    const strong = made('strong', { strength: 50 });
    expect(firstTarget(attacker, side([weak, 1_000], [strong, 1_000]))).toBe(1);
    expect(firstTarget(attacker, side([strong, 1_000], [weak, 1_000]))).toBe(0);
  });

  it('weighs what the target would hit back for against the actor, strength-against included', () => {
    const attacker = side([hitter, 100]);
    const plain = made('plain', { strength: 15 });
    const counter = made('counter', { strength: 10, strengthAgainst: { melee: 100 } });
    expect(firstTarget(attacker, side([plain, 1_000], [counter, 1_000]))).toBe(1);
  });
});

describe('strength-against in the Arena (B-46)', () => {
  const dragonBane = made('bane', { strengthAgainst: { flying: 20, dragons: 300, epicMonsters: 500 } });

  it('adds the monster race to the troop type on one hit', () => {
    const dragon = monster('dragon', { category: 'flying', race: 'dragon' });
    expect(primeArenaHitDamage(dragonBane, 100, NO_BONUS, dragon)).toBe(100 * 10 * 4.2);
    const beast = monster('beast', { category: 'flying' });
    expect(primeArenaHitDamage(dragonBane, 100, NO_BONUS, beast)).toBe(100 * 10 * 1.2);
  });

  it('reads no race on a troop', () => {
    const griffin = made('griffin', { category: 'flying', race: 'dragon' });
    expect(primeArenaHitDamage(dragonBane, 100, NO_BONUS, griffin)).toBe(100 * 10 * 1.2);
  });

  it('counts an equipment matchup against the race as well as against the troop type', () => {
    const dragon = monster('dragon', { category: 'flying', race: 'dragon' });
    const totals = totalsFrom({
      matchup: [
        { attacker: 'melee', target: 'dragons', value: 30 },
        { attacker: 'melee', target: 'flying', value: 50 },
      ],
    });
    expect(primeArenaHitDamage(dragonBane, 100, totals, dragon)).toBe(100 * 10 * 5);
  });

  it('adds no bonus against epic monsters, from the unit or from the army', () => {
    const totals = totalsFrom({
      special: { armyStrengthAgainstEpicMonsters: 400 },
      matchup: [{ attacker: 'melee', target: 'epicMonsters', value: 200 }],
    });
    const target = monster('beast', { category: 'mounted' });
    expect(primeArenaHitDamage(dragonBane, 100, totals, target)).toBe(100 * 10);
  });

  it('turns the hit to the monster the race bonus favours', () => {
    const attacker = side([dragonBane, 100]);
    const defender = side(
      [monster('beast', {}), 1_000],
      [monster('dragon', { category: 'mounted', race: 'dragon' }), 1_000],
    );
    expect(firstTarget(attacker, defender)).toBe(1);
  });
});

describe('health per unit is not rounded in the Arena (B-46)', () => {
  it('kills by the exact health: 870 with +478.2 % is 5,030.34, so 5,030 units of damage kill nobody', () => {
    const attacker = side([made('one', { strength: 5_030 }), 1]);
    const target = made('tough', { health: 870, strength: 1 });
    const defender: PrimeArenaArmy = {
      totals: totalsFrom({ health: { army: 478.2 } }),
      stacks: [{ unit: target, count: 3 }],
    };
    expect(primeArenaMatch(attacker, defender).rounds[0].steps[0]!.kills).toBe(0);
  });

  it('a stack of fractional health is wiped whole by a hit large enough', () => {
    const attacker = side([made('big', { strength: 1_000_000 }), 1]);
    const defender: PrimeArenaArmy = {
      totals: totalsFrom({ health: { army: 0.1 } }),
      stacks: [{ unit: made('thin', { health: 3 }), count: 7 }],
    };
    const [first] = primeArenaMatch(attacker, defender).rounds;
    expect(first.steps[0]!.kills).toBe(7);
    expect(first.defender.stacks[0]!.survivors).toBe(0);
  });
});

describe('the record of double damage replays a real round (B-46)', () => {
  const lucky = made('lucky', { doubleDamageChance: 50 });
  const damages = (doubleTurns?: [number[], number[]]): number[] =>
    primeArenaMatch(
      side([lucky, 100]),
      side([made('wall', { strength: 1 }), 1_000]),
      doubleTurns === undefined ? undefined : { doubleTurns },
    ).rounds[0].steps.map((s) => s.damage);

  it('plans on the expected value when there is no record', () => {
    expect(damages()[0]).toBe(1_000 * 1.5);
  });

  it('doubles exactly the recorded turns, counted from 1, and no other', () => {
    const plain = damages([[], []]);
    const recorded = damages([[3], []]);
    expect(recorded[0]).toBe(1_000);
    expect(plain[0]).toBe(1_000);
    // Turn 3 is our second hit: the same living count in both, so exactly twice the damage.
    expect(recorded[2]).toBe(2 * plain[2]!);
  });
});
