/**
 * B-32 — Prime Arena army-versus-army match (attack squad).
 *
 * A match is two rounds between the same two armies; each round starts from full armies. The attacker strikes
 * first in round 1, the defender first in round 2. The result follows the in-game wording: win both rounds =
 * victory; a 1-1 split goes to the side with the higher surviving share (housing-cost weighted) in the round
 * that side won; equal = draw. Rules read off two logged fights (docs: prime-report transcript, F1 and F2).
 *
 * The rules are the ones read off the two reports of 2026-11-27 (B-46), which the match replays turn by turn.
 *
 * Round model:
 *   - sides alternate one stack per turn, the round's first side leading. On its turn a side plays its
 *     strongest not-yet-acted living stack, judged on current numbers (count x boosted strength, features
 *     excluded). When a side has no stack left to act in the pass the other keeps acting; when both are done a
 *     new pass starts and the alternation simply continues (the side that did not act last goes next);
 *   - a stack hits, at the living-unit count it has when it acts, the ONE enemy stack it would damage most: its
 *     hit on that target (before any double damage), capped at the health the target has left. Equal capped hits
 *     go to the target that would hit the actor hardest in return (its living count, uncapped);
 *   - strength-against on a hit is the sum of the entry for the target's troop type and, when the target is a
 *     monster, the entry for its race. Arena only (troops.json lacks them): a Specialist deals double damage and
 *     has +105 % strength-against non-monster troops. The bonus against epic monsters does not count here;
 *   - damage accumulates in the target stack's pool, the remainder after whole units are killed is kept for
 *     later hits, and overkill on a wipe is lost: nothing spills to another stack. Health per unit is not
 *     rounded (no whole-point health reproduces the reports' kills);
 *   - double-damage chances (unit, captains) enter as an expected value, unless the match is given the record of
 *     the turns that rolled it (to replay a real report). "Blocked" hits are not modelled;
 *   - a round ends when a side is wiped, or when a whole pass deals no damage (no progress is possible). It is
 *     won by wiping the other side, else by the higher surviving share (surviving housing cost over starting
 *     housing cost), equal = draw.
 */
import type { Race, StrengthAgainstKey, UnitDef } from '../data/types';
import { matchupBonus } from './bonuses';
import { effectiveUnit, healthPercent } from './units';
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
export const PRIME_ARENA_SIDES = ['attacker', 'defender'] as const;

/** Narrows a string (a control's value) to a side. */
export const isPrimeArenaSide = (value: string): value is PrimeArenaSide =>
  (PRIME_ARENA_SIDES as readonly string[]).includes(value);

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

/** Whole units a pool has lost. The slack absorbs the float error of a fractional health (a wipe is a wipe). */
const dead = (pool: HpPool): number => Math.min(pool.units, Math.floor(pool.taken / pool.hpPerUnit + 1e-9));

/**
 * One hit on one stack: the damage joins the stack's pool, the leftover short of a whole unit is kept for the
 * next hit, and what exceeds the remaining pool is lost (nothing spills to another stack).
 */
export function absorbDamage(pool: HpPool, damage: number): { absorbed: number; kills: number } {
  const before = dead(pool);
  const absorbed = Math.max(0, Math.min(damage, pool.units * pool.hpPerUnit - pool.taken));
  pool.taken += absorbed;
  return { absorbed, kills: dead(pool) - before };
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

const NO_FORMATION: EnemyFormation = { melee: 0, ranged: 0, mounted: 0, flying: 0 };

const RACE_TARGET: Record<Race, StrengthAgainstKey> = {
  beast: 'beasts',
  elemental: 'elementals',
  dragon: 'dragons',
  giant: 'giants',
};

/** A unit under one side's bonuses: all a battle reads of it, worked out once however many battles it fights. */
export interface PrimeArenaFighter {
  unit: UnitDef;
  totals: BonusTotals;
  /** Health of one unit with the bonuses, not rounded. */
  hpPerUnit: number;
  /** Boosted strength of one unit, for the turn order. */
  strengthPerUnit: number;
  /** Σ strength bonuses in percent, before the strength-against of a target. */
  strengthPercent: number;
  doubleDamageChance: number;
  /** A Specialist: double damage, and the +105 % against troops. */
  specialist: boolean;
  /** Strength-against in percent per target unit, filled in as targets are met. */
  against: Map<UnitDef, number>;
}

export function primeArenaFighter(unit: UnitDef, totals: BonusTotals): PrimeArenaFighter {
  const effective = effectiveUnit(unit, totals, NO_FORMATION, []);
  return {
    unit,
    totals,
    hpPerUnit: (unit.health * (100 + healthPercent(unit, totals))) / 100,
    strengthPerUnit: effective.strengthPerUnit,
    strengthPercent: effective.strengthPercent,
    doubleDamageChance: effective.doubleDamageChance,
    specialist: unit.kind === 'troop' && unit.group === 'specialist',
    against: new Map(),
  };
}

/** The strength-against of one fighter's hit on a target: its troop type, its race when a monster, the +105. */
function strengthAgainst(fighter: PrimeArenaFighter, target: UnitDef): number {
  let percent = fighter.against.get(target);
  if (percent !== undefined) return percent;
  const keys: StrengthAgainstKey[] = [];
  if (target.category !== undefined) keys.push(target.category);
  if (target.kind === 'monster' && target.race !== undefined) keys.push(RACE_TARGET[target.race]);
  percent = fighter.specialist && target.kind === 'troop' ? ARENA_SPECIALIST_VS_TROOPS : 0;
  for (const key of keys) {
    percent +=
      (fighter.unit.strengthAgainst[key] ?? 0) +
      matchupBonus(fighter.totals.matchup, fighter.unit.category, key);
  }
  fighter.against.set(target, percent);
  return percent;
}

/** The hit of `count` units on a target, before any double damage. */
function strikeDamage(fighter: PrimeArenaFighter, count: number, target: UnitDef): number {
  const percent = 100 + fighter.strengthPercent + strengthAgainst(fighter, target);
  const multiplier = fighter.specialist ? ARENA_SPECIALIST_DAMAGE_MULTIPLIER : 1;
  return Math.round((count * fighter.unit.strength * percent) / 100) * multiplier;
}

const expectedDouble = (fighter: PrimeArenaFighter): number => 1 + fighter.doubleDamageChance / 100;

/**
 * Damage of one hit of `count` units of `unit` on a stack of `target`: the journal formula (`hitDamage`) with
 * the Arena bonuses, the double-damage chance as an expected value.
 */
export function primeArenaHitDamage(
  unit: UnitDef,
  count: number,
  totals: BonusTotals,
  target: UnitDef,
): number {
  const fighter = primeArenaFighter(unit, totals);
  return strikeDamage(fighter, count, target) * expectedDouble(fighter);
}

/** A stack ready to fight: its fighter and how many march. */
export interface PrimeArenaFielded {
  fighter: PrimeArenaFighter;
  count: number;
}

export const primeArenaFielded = ({ stacks, totals }: PrimeArenaArmy): PrimeArenaFielded[] =>
  stacks.map(({ unit, count }) => ({ fighter: primeArenaFighter(unit, totals), count }));

interface LiveStack {
  fighter: PrimeArenaFighter;
  pool: HpPool;
  acted: boolean;
}

interface Side {
  live: LiveStack[];
}

const makeSide = (army: readonly PrimeArenaFielded[]): Side => ({
  live: army.map(({ fighter, count }) => ({
    fighter,
    pool: { units: count, hpPerUnit: fighter.hpPerUnit, taken: 0 },
    acted: false,
  })),
});

const living = (stack: LiveStack): number => stack.pool.units - dead(stack.pool);

function alive(side: Side): boolean {
  return side.live.some((stack) => living(stack) > 0);
}

/** The strongest living stack that has not acted in this pass, on its current numbers (features excluded). */
function nextActor(side: Side): number {
  let best = -1;
  let bestPower = -1;
  for (let index = 0; index < side.live.length; index += 1) {
    const stack = side.live[index]!;
    if (stack.acted) continue;
    const n = living(stack);
    if (n <= 0) continue;
    const power = n * stack.fighter.strengthPerUnit;
    if (power > bestPower) {
      best = index;
      bestPower = power;
    }
  }
  return best;
}

/** Two capped hits are equal within this share of them. */
const EQUAL_HIT = 1e-6;

/**
 * The stack an actor hits: the living one its hit damages most, the hit capped at the health left there; among
 * equal capped hits, the one whose own hit on the actor (its living count, uncapped) is the largest.
 */
function chooseVictim(actor: LiveStack, count: number, foe: Side): number {
  let target = -1;
  let bestHit = 0;
  let bestThreat = 0;
  for (let index = 0; index < foe.live.length; index += 1) {
    const stack = foe.live[index]!;
    const n = living(stack);
    if (n <= 0) continue;
    const left = stack.pool.units * stack.pool.hpPerUnit - stack.pool.taken;
    const hit = Math.min(strikeDamage(actor.fighter, count, stack.fighter.unit), left);
    if (target >= 0 && hit < bestHit * (1 - EQUAL_HIT)) continue;
    const threat = strikeDamage(stack.fighter, n, actor.fighter.unit);
    if (target < 0 || hit > bestHit * (1 + EQUAL_HIT) || threat > bestThreat) {
      target = index;
      bestHit = hit;
      bestThreat = threat;
    }
  }
  return target;
}

function outcome(side: Side): PrimeArenaSideOutcome {
  const stacks = side.live.map((s) => ({
    unit: s.fighter.unit,
    start: s.pool.units,
    survivors: living(s),
  }));
  return { stacks, share: primeArenaShare(stacks) };
}

export const otherSide = (who: PrimeArenaSide): PrimeArenaSide =>
  who === 'attacker' ? 'defender' : 'attacker';

function playRound(
  attackerArmy: readonly PrimeArenaFielded[],
  defenderArmy: readonly PrimeArenaFielded[],
  first: PrimeArenaSide,
  doubleTurns: readonly number[] | undefined,
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
    const actor = sides[who].live[index]!;
    actor.acted = true;
    const count = living(actor);
    const foe = sides[otherSide(who)];
    // The other side is alive, so there is a stack to hit.
    const target = chooseVictim(actor, count, foe);
    const victim = foe.live[target]!;
    let multiplier = expectedDouble(actor.fighter);
    if (doubleTurns !== undefined) multiplier = doubleTurns.includes(steps.length + 1) ? 2 : 1;
    const damage = strikeDamage(actor.fighter, count, victim.fighter.unit) * multiplier;
    const { kills } = absorbDamage(victim.pool, damage);
    steps.push({ side: who, stack: index, target, damage, kills });
    if (damage > 0) progressed = true;
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

/** What really happened in a fight, to replay it: nothing here is used to plan one. */
export interface PrimeArenaRecord {
  /** Per round, the turns (counted from 1) that rolled double damage; every other turn dealt its plain hit. */
  doubleTurns: readonly [readonly number[], readonly number[]];
}

/**
 * The two-round match: attacker strikes first in round 1, defender first in round 2. Both rounds won by one
 * side is a victory; a 1-1 split goes to the side with the higher surviving share in the round it won; equal is
 * a draw. (A win and a draw is the win; two draws a draw.)
 */
export function primeArenaMatch(
  attacker: PrimeArenaArmy,
  defender: PrimeArenaArmy,
  record?: PrimeArenaRecord,
): PrimeArenaMatch {
  return primeArenaFieldedMatch(primeArenaFielded(attacker), primeArenaFielded(defender), record);
}

/** The same match between armies already fielded: for a search that fights the same units many times. */
export function primeArenaFieldedMatch(
  attacker: readonly PrimeArenaFielded[],
  defender: readonly PrimeArenaFielded[],
  record?: PrimeArenaRecord,
): PrimeArenaMatch {
  const rounds: [PrimeArenaRound, PrimeArenaRound] = [
    playRound(attacker, defender, 'attacker', record?.doubleTurns[0]),
    playRound(attacker, defender, 'defender', record?.doubleTurns[1]),
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

/** Rounds a side took in a match. */
export const roundsWonBy = (match: PrimeArenaMatch, side: PrimeArenaSide): number =>
  side === 'attacker' ? match.attackerRoundsWon : match.defenderRoundsWon;

/** A side's score (the attacker's by default): match result, then rounds won, then survivor share. */
export function primeArenaScore(match: PrimeArenaMatch, side: PrimeArenaSide = 'attacker'): PrimeArenaScore {
  return {
    result: match.winner === side ? 2 : match.winner === 'draw' ? 1 : 0,
    roundsWon: roundsWonBy(match, side),
    survivorShare: match.rounds[0][side].share + match.rounds[1][side].share,
  };
}

/** Positive when `a` ranks above `b`. */
export function comparePrimeArenaScore(a: PrimeArenaScore, b: PrimeArenaScore): number {
  return a.result - b.result || a.roundsWon - b.roundsWon || a.survivorShare - b.survivorShare;
}
