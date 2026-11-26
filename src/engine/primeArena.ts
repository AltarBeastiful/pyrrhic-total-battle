/**
 * B-32 — Prime Arena army-versus-army match (attack squad, v1).
 *
 * A match is two rounds between the same two armies; each round starts from full armies. The attacker strikes
 * first in round 1, the defender first in round 2. Win both rounds = victory; split = the higher total
 * surviving-troop share wins; equal = draw. Candidates rank by rounds won, then survivor share summed over
 * both rounds.
 *
 * Round model (our reading of the rules, the support text does not spell it out):
 *   - in a pass every living stack acts once, strongest base damage first (count × strength, as `attackOrder`);
 *   - the two sides alternate one stack at a time, the round's first side leading; a stack already dead when
 *     its turn comes is skipped; passes repeat until a side is wiped (or a pass kills nobody);
 *   - a stack hits the enemy category it has the largest strength-against for among the categories still alive
 *     (`chooseTarget`), at the living-unit count it has when it acts;
 *   - inside that category the hit lands on the living stack with the highest total HP; damage kills whole
 *     units, the remainder is lost, and overkill spills to the next-highest stack of the same category;
 *   - a round is won by wiping the other side, else by the higher surviving-troop share, equal share = draw.
 */
import { CATEGORIES } from '../data/types';
import type { UnitDef } from '../data/types';
import { attackOrder } from './battle';
import { effectiveUnit, hitDamage } from './units';
import type { BonusTotals, EnemyFormation } from './types';

export interface PrimeArenaStack {
  unit: UnitDef;
  count: number;
}

/** An army with the bonus totals that apply to it (the two sides may carry different bonuses). */
export interface PrimeArenaArmy {
  stacks: PrimeArenaStack[];
  totals: BonusTotals;
}

export type PrimeArenaSide = 'attacker' | 'defender';

export interface PrimeArenaStackOutcome {
  unit: UnitDef;
  start: number;
  survivors: number;
}

export interface PrimeArenaSideOutcome {
  stacks: PrimeArenaStackOutcome[];
  /** Surviving troops over starting troops, 0..1. */
  share: number;
}

export interface PrimeArenaRound {
  first: PrimeArenaSide;
  attacker: PrimeArenaSideOutcome;
  defender: PrimeArenaSideOutcome;
  winner: PrimeArenaSide | 'draw';
}

export interface PrimeArenaMatch {
  rounds: [PrimeArenaRound, PrimeArenaRound];
  attackerRoundsWon: number;
  defenderRoundsWon: number;
  winner: PrimeArenaSide | 'draw';
}

export interface PrimeArenaScore {
  roundsWon: number;
  /** Attacker survivor share summed over both rounds (0..2). */
  survivorShare: number;
}

interface LiveStack {
  unit: UnitDef;
  start: number;
  count: number;
  hpPerUnit: number;
}

interface Side {
  army: PrimeArenaArmy;
  live: LiveStack[];
}

function makeSide(army: PrimeArenaArmy): Side {
  return {
    army,
    live: army.stacks.map(({ unit, count }) => ({
      unit,
      start: count,
      count,
      hpPerUnit: effectiveUnit(unit, army.totals, EMPTY_FORMATION, []).hpPerUnit,
    })),
  };
}

const EMPTY_FORMATION: EnemyFormation = { melee: 0, ranged: 0, mounted: 0, flying: 0 };

function formationOf(side: Side): EnemyFormation {
  const formation = { ...EMPTY_FORMATION };
  for (const stack of side.live) {
    if (stack.count > 0 && stack.unit.category) formation[stack.unit.category] += 1;
  }
  return formation;
}

function troops(side: Side): number {
  return side.live.reduce((sum, stack) => sum + stack.count, 0);
}

function alive(side: Side): boolean {
  return side.live.some((stack) => stack.count > 0);
}

/** One stack's strike: pick the category, then kill units highest-total-HP stack first. */
function strike(attacker: Side, index: number, defender: Side): void {
  const stack = attacker.live[index]!;
  const formation = formationOf(defender);
  const effective = effectiveUnit(stack.unit, attacker.army.totals, formation, []);
  let damage = hitDamage(effective, stack.count).damage;

  // No living squad of the chosen category (e.g. engineers' melee fallback): take any living stack.
  const inCategory = CATEGORIES.includes(effective.target) && formation[effective.target] > 0;
  const targets = defender.live
    .filter((s) => s.count > 0 && (!inCategory || s.unit.category === effective.target))
    .sort((a, b) => b.count * b.hpPerUnit - a.count * a.hpPerUnit);
  for (const target of targets) {
    const kills = Math.min(target.count, Math.floor(damage / target.hpPerUnit));
    target.count -= kills;
    damage -= kills * target.hpPerUnit;
    if (target.count > 0) break;
  }
}

function outcome(side: Side): PrimeArenaSideOutcome {
  const stacks = side.live.map((s) => ({ unit: s.unit, start: s.start, survivors: s.count }));
  const total = stacks.reduce((sum, s) => sum + s.start, 0);
  const left = stacks.reduce((sum, s) => sum + s.survivors, 0);
  return { stacks, share: total > 0 ? left / total : 0 };
}

function playRound(
  attackerArmy: PrimeArenaArmy,
  defenderArmy: PrimeArenaArmy,
  first: PrimeArenaSide,
): PrimeArenaRound {
  const sides: Record<PrimeArenaSide, Side> = {
    attacker: makeSide(attackerArmy),
    defender: makeSide(defenderArmy),
  };
  const second: PrimeArenaSide = first === 'attacker' ? 'defender' : 'attacker';
  const armies = { attacker: attackerArmy, defender: defenderArmy };
  const orderOf = (who: PrimeArenaSide): number[] =>
    attackOrder(
      sides[who].live.map((s) => ({
        count: s.count,
        strengthPerUnit: effectiveUnit(s.unit, armies[who].totals, EMPTY_FORMATION, []).strengthPerUnit,
      })),
    );
  // Passes repeat until a side is wiped; a pass that kills nobody is a stalemate (nothing can ever change).
  while (alive(sides.attacker) && alive(sides.defender)) {
    const before = troops(sides.attacker) + troops(sides.defender);
    const orders = { attacker: orderOf('attacker'), defender: orderOf('defender') };
    const turns = Math.max(orders.attacker.length, orders.defender.length);
    for (let turn = 0; turn < turns; turn += 1) {
      for (const who of [first, second]) {
        const index = orders[who][turn];
        if (index === undefined || sides[who].live[index]!.count <= 0) continue;
        strike(sides[who], index, sides[who === 'attacker' ? 'defender' : 'attacker']);
        if (!alive(sides.defender) || !alive(sides.attacker)) break;
      }
      if (!alive(sides.defender) || !alive(sides.attacker)) break;
    }
    if (troops(sides.attacker) + troops(sides.defender) === before) break;
  }
  const attacker = outcome(sides.attacker);
  const defender = outcome(sides.defender);
  const winner =
    attacker.share > defender.share ? 'attacker' : defender.share > attacker.share ? 'defender' : 'draw';
  return { first, attacker, defender, winner };
}

/** The two-round match: attacker strikes first in round 1, defender first in round 2. */
export function primeArenaMatch(attacker: PrimeArenaArmy, defender: PrimeArenaArmy): PrimeArenaMatch {
  const rounds: [PrimeArenaRound, PrimeArenaRound] = [
    playRound(attacker, defender, 'attacker'),
    playRound(attacker, defender, 'defender'),
  ];
  const attackerRoundsWon = rounds.filter((r) => r.winner === 'attacker').length;
  const defenderRoundsWon = rounds.filter((r) => r.winner === 'defender').length;
  let winner: PrimeArenaMatch['winner'] = 'draw';
  if (attackerRoundsWon !== defenderRoundsWon) {
    winner = attackerRoundsWon > defenderRoundsWon ? 'attacker' : 'defender';
  } else {
    const a = rounds[0].attacker.share + rounds[1].attacker.share;
    const d = rounds[0].defender.share + rounds[1].defender.share;
    if (a !== d) winner = a > d ? 'attacker' : 'defender';
  }
  return { rounds, attackerRoundsWon, defenderRoundsWon, winner };
}

/** The attacker's ranking score: rounds won, then survivor share over both rounds. */
export function primeArenaScore(match: PrimeArenaMatch): PrimeArenaScore {
  return {
    roundsWon: match.attackerRoundsWon,
    survivorShare: match.rounds[0].attacker.share + match.rounds[1].attacker.share,
  };
}

/** Positive when `a` ranks above `b`. */
export function comparePrimeArenaScore(a: PrimeArenaScore, b: PrimeArenaScore): number {
  return a.roundsWon - b.roundsWon || a.survivorShare - b.survivorShare;
}
