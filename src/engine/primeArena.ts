/**
 * B-32 — Prime Arena army-versus-army match (attack squad).
 *
 * A match is two rounds between the same two armies; each round starts from full armies. The attacker strikes
 * first in round 1, the defender first in round 2. The result follows the in-game wording: win both rounds =
 * victory; a 1-1 split goes to the side with the higher surviving share (housing-cost weighted) in the round
 * that side won; equal = draw. Rules read off two logged fights (docs: prime-report transcript, F1 and F2).
 *
 * Round model:
 *   - sides alternate one stack per turn, the round's first side leading. On its turn a side plays its
 *     strongest not-yet-acted living stack, judged on current numbers (count x boosted strength, features
 *     excluded). When a side has no stack left to act in the pass the other keeps acting; when both are done a
 *     new pass starts and the alternation simply continues (the side that did not act last goes next);
 *   - a stack hits the enemy category it has the largest strength-against for among the categories still alive
 *     (picked inside `effectiveUnit`), at the living-unit count it has when it acts;
 *   - inside that category the hit lands on ONE stack: the living stack with the highest remaining HP pool.
 *     Damage accumulates in that stack's pool, the remainder after whole units are killed is kept for later hits,
 *     and overkill on a wipe is lost: nothing spills to another stack;
 *   - Arena-only bonuses (troops.json lacks them): a Specialist deals double damage, and +105 % strength-against
 *     non-monster troops. Double-damage chances (unit, captains) enter as an expected value; "blocked" hits are
 *     not modelled. Race-aware targeting is not modelled either;
 *   - a round ends when a side is wiped, or when a whole pass deals no damage (no progress is possible). It is
 *     won by wiping the other side, else by the higher surviving share (surviving housing cost over starting
 *     housing cost), equal = draw.
 */
import { CATEGORIES } from '../data/types';
import type { UnitDef } from '../data/types';
import { effectiveUnit } from './units';
import type { BonusTotals, EnemyFormation } from './types';

/** Arena-only: a Specialist deals double damage (troops.json does not carry it). */
export const ARENA_SPECIALIST_DAMAGE_MULTIPLIER = 2;
/** Arena-only: a Specialist's strength-against every non-monster troop, in percent (added to the table's). */
export const ARENA_SPECIALIST_VS_TROOPS = 105;

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
  /** Surviving housing cost over starting housing cost, 0..1 (the percentage the game shows). */
  share: number;
}

/** One turn of a round: `side`'s stack number `stack` (index in its army) hit the other side's stack `target`. */
export interface PrimeArenaStep {
  side: PrimeArenaSide;
  stack: number;
  target: number;
  /** Damage dealt (expected value when a double-damage chance applies). */
  damage: number;
  /** Units the hit killed, leftover HP of earlier hits included. */
  kills: number;
}

export interface PrimeArenaRound {
  first: PrimeArenaSide;
  attacker: PrimeArenaSideOutcome;
  defender: PrimeArenaSideOutcome;
  winner: PrimeArenaSide | 'draw';
  steps: PrimeArenaStep[];
}

export interface PrimeArenaMatch {
  rounds: [PrimeArenaRound, PrimeArenaRound];
  attackerRoundsWon: number;
  defenderRoundsWon: number;
  winner: PrimeArenaSide | 'draw';
}

export interface PrimeArenaScore {
  /** Match result for the attacker: 2 victory, 1 draw, 0 defeat. */
  result: 0 | 1 | 2;
  roundsWon: number;
  /** Attacker surviving-cost share summed over both rounds (0..2). */
  survivorShare: number;
}

/** A stack's HP pool: `units` at the start, `taken` damage accumulated, whole units dead = floor(taken / hp). */
export interface HpPool {
  units: number;
  hpPerUnit: number;
  taken: number;
}

/**
 * One hit on one stack: the damage joins the stack's pool, the leftover short of a whole unit is kept for the
 * next hit, and what exceeds the remaining pool is lost (nothing spills to another stack).
 */
export function absorbDamage(pool: HpPool, damage: number): { absorbed: number; kills: number } {
  const before = Math.floor(pool.taken / pool.hpPerUnit);
  const absorbed = Math.max(0, Math.min(damage, pool.units * pool.hpPerUnit - pool.taken));
  pool.taken += absorbed;
  const after = Math.min(pool.units, Math.floor(pool.taken / pool.hpPerUnit));
  return { absorbed, kills: after - before };
}

/** Surviving housing cost over starting housing cost: the round percentage of the game. */
export function primeArenaShare(stacks: readonly PrimeArenaStackOutcome[]): number {
  let total = 0;
  let left = 0;
  for (const s of stacks) {
    total += s.start * s.unit.cost;
    left += s.survivors * s.unit.cost;
  }
  return total > 0 ? left / total : 0;
}

const EMPTY_FORMATION: EnemyFormation = { melee: 0, ranged: 0, mounted: 0, flying: 0 };

function isSpecialist(unit: UnitDef): boolean {
  return unit.kind === 'troop' && unit.group === 'specialist';
}

type Effective = ReturnType<typeof effectiveUnit>;

function strikeDamage(effective: Effective, count: number, target: UnitDef): number {
  const { unit } = effective;
  const specialist = isSpecialist(unit);
  const vsTroops = specialist && target.kind === 'troop' ? ARENA_SPECIALIST_VS_TROOPS : 0;
  const scale = count * unit.strength;
  const percent = 100 + effective.strengthPercent + effective.strengthAgainst + vsTroops;
  const multiplier =
    (specialist ? ARENA_SPECIALIST_DAMAGE_MULTIPLIER : 1) * (1 + effective.doubleDamageChance / 100);
  return Math.round((scale * percent) / 100) * multiplier;
}

/**
 * Damage of one hit of `count` units of `unit` on a stack of `target`: the journal formula (`hitDamage`) with
 * the Arena bonuses, the double-damage chance as an expected value. The target category is the one the unit
 * picks against a formation that holds only `target`'s category (or `formation` when given).
 */
export function primeArenaHitDamage(
  unit: UnitDef,
  count: number,
  totals: BonusTotals,
  target: UnitDef,
  formation?: EnemyFormation,
): number {
  const present: EnemyFormation = formation ?? {
    ...EMPTY_FORMATION,
    ...(target.category ? { [target.category]: 1 } : {}),
  };
  return strikeDamage(effectiveUnit(unit, totals, present, []), count, target);
}

interface LiveStack {
  unit: UnitDef;
  pool: HpPool;
  /** Boosted strength of one unit, for the turn order. */
  strengthPerUnit: number;
  acted: boolean;
}

interface Side {
  army: PrimeArenaArmy;
  live: LiveStack[];
}

function makeSide(army: PrimeArenaArmy): Side {
  return {
    army,
    live: army.stacks.map(({ unit, count }) => {
      const effective = effectiveUnit(unit, army.totals, EMPTY_FORMATION, []);
      return {
        unit,
        pool: { units: count, hpPerUnit: effective.hpPerUnit, taken: 0 },
        strengthPerUnit: effective.strengthPerUnit,
        acted: false,
      };
    }),
  };
}

function living(stack: LiveStack): number {
  return stack.pool.units - Math.floor(stack.pool.taken / stack.pool.hpPerUnit);
}

function remainingHp(stack: LiveStack): number {
  return stack.pool.units * stack.pool.hpPerUnit - stack.pool.taken;
}

function formationOf(side: Side): EnemyFormation {
  const formation = { ...EMPTY_FORMATION };
  for (const stack of side.live) {
    if (living(stack) > 0 && stack.unit.category) formation[stack.unit.category] += 1;
  }
  return formation;
}

function alive(side: Side): boolean {
  return side.live.some((stack) => living(stack) > 0);
}

/** The strongest living stack that has not acted in this pass, on its current numbers (features excluded). */
function nextActor(side: Side): number {
  let best = -1;
  let bestPower = -1;
  side.live.forEach((stack, index) => {
    const n = living(stack);
    if (n <= 0 || stack.acted) return;
    const power = n * stack.strengthPerUnit;
    if (power > bestPower) {
      best = index;
      bestPower = power;
    }
  });
  return best;
}

/** One stack's strike: pick the category, then hit the living stack of it with the largest remaining HP pool. */
function strike(attacker: Side, index: number, defender: Side, who: PrimeArenaSide): PrimeArenaStep | null {
  const stack = attacker.live[index]!;
  const formation = formationOf(defender);
  const effective = effectiveUnit(stack.unit, attacker.army.totals, formation, []);

  // No living squad of the chosen category (e.g. engineers' melee fallback): take any living stack.
  const inCategory = CATEGORIES.includes(effective.target) && formation[effective.target] > 0;
  let target = -1;
  let targetHp = -1;
  defender.live.forEach((s, i) => {
    if (living(s) <= 0 || (inCategory && s.unit.category !== effective.target)) return;
    const hp = remainingHp(s);
    if (hp > targetHp) {
      target = i;
      targetHp = hp;
    }
  });
  if (target < 0) return null;
  const victim = defender.live[target]!;
  const damage = strikeDamage(effective, living(stack), victim.unit);
  const { kills } = absorbDamage(victim.pool, damage);
  return { side: who, stack: index, target, damage, kills };
}

function outcome(side: Side): PrimeArenaSideOutcome {
  const stacks = side.live.map((s) => ({ unit: s.unit, start: s.pool.units, survivors: living(s) }));
  return { stacks, share: primeArenaShare(stacks) };
}

const otherSide = (who: PrimeArenaSide): PrimeArenaSide => (who === 'attacker' ? 'defender' : 'attacker');

function playRound(
  attackerArmy: PrimeArenaArmy,
  defenderArmy: PrimeArenaArmy,
  first: PrimeArenaSide,
): PrimeArenaRound {
  const sides: Record<PrimeArenaSide, Side> = {
    attacker: makeSide(attackerArmy),
    defender: makeSide(defenderArmy),
  };
  const steps: PrimeArenaStep[] = [];
  let turn: PrimeArenaSide = first;
  let progressed = false;
  // Sides alternate one stack per turn. A side with nothing left to act in the pass yields to the other; when
  // both are done a new pass starts and the alternation continues. A pass that deals no damage leaves the
  // armies as they were, so the next would be the same: it ends the round.
  while (alive(sides.attacker) && alive(sides.defender)) {
    let who = turn;
    let index = nextActor(sides[who]);
    if (index < 0) {
      who = otherSide(who);
      index = nextActor(sides[who]);
    }
    if (index < 0) {
      if (!progressed) break;
      progressed = false;
      for (const side of [sides.attacker, sides.defender]) for (const s of side.live) s.acted = false;
      continue;
    }
    sides[who].live[index]!.acted = true;
    const step = strike(sides[who], index, sides[otherSide(who)], who);
    if (step !== null) {
      steps.push(step);
      if (step.damage > 0) progressed = true;
    }
    turn = otherSide(who);
  }
  const attacker = outcome(sides.attacker);
  const defender = outcome(sides.defender);
  let winner: PrimeArenaRound['winner'] = 'draw';
  if (!alive(sides.defender) && alive(sides.attacker)) winner = 'attacker';
  else if (!alive(sides.attacker) && alive(sides.defender)) winner = 'defender';
  else if (attacker.share !== defender.share)
    winner = attacker.share > defender.share ? 'attacker' : 'defender';
  return { first, attacker, defender, winner, steps };
}

/**
 * The two-round match: attacker strikes first in round 1, defender first in round 2. Both rounds won by one
 * side is a victory; a 1-1 split goes to the side with the higher surviving share in the round it won; equal is
 * a draw. (A win and a draw is the win; two draws a draw.)
 */
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
  } else if (attackerRoundsWon === 1) {
    const a = rounds.find((r) => r.winner === 'attacker')!.attacker.share;
    const d = rounds.find((r) => r.winner === 'defender')!.defender.share;
    if (a !== d) winner = a > d ? 'attacker' : 'defender';
  }
  return { rounds, attackerRoundsWon, defenderRoundsWon, winner };
}

/** The attacker's ranking score: match result, then rounds won, then survivor share over both rounds. */
export function primeArenaScore(match: PrimeArenaMatch): PrimeArenaScore {
  return {
    result: match.winner === 'attacker' ? 2 : match.winner === 'draw' ? 1 : 0,
    roundsWon: match.attackerRoundsWon,
    survivorShare: match.rounds[0].attacker.share + match.rounds[1].attacker.share,
  };
}

/** Positive when `a` ranks above `b`. */
export function comparePrimeArenaScore(a: PrimeArenaScore, b: PrimeArenaScore): number {
  return a.result - b.result || a.roundsWon - b.roundsWon || a.survivorShare - b.survivorShare;
}
