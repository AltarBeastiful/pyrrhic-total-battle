/**
 * B-46 — Prime Arena stack planner.
 *
 * With no typed enemy, a squad is ranked against many assumed armies (`primeArenaEnemies.ts`): the share of
 * matches it wins, then its mean lead (our surviving share minus theirs) plus its lead in the bad cases. With a
 * typed enemy the set is that one army, carrying our totals: the match result, then rounds won, then the lead.
 * The role only decides who strikes first in each round: the match is the same for both sides, so is the ranking.
 *
 * A squad is up to `maxStacks` slots (default 8), each a unit and a count; every unit fills at most ONE slot (as
 * in the march calculator, a troop type is one stack) and any pool unit may be used, lower tiers included.
 * Housing bounds the squad: troops spend Leadership, monsters Dominance.
 *
 * Search: hill climbs over slot counts from the default even fill (the game's own: the top tier of each pool,
 * evenly) and from seeded random restarts, sharing one evaluation budget and one deadline. Moves (first
 * improvement, slice of a pool's budget halving from 1/2 to 1/64): transfer money between two slots of a pool,
 * retype a slot, split part of a slot into a new slot, merge a slot into another. Each climbed squad is then
 * filled (best-scoring top-up until no unit is affordable) and the best filled squad wins; the default fill
 * itself is a candidate too, so the result is never worse than it on the ranking in use.
 */
import type { UnitDef } from '../data/types';
import { DEFAULT_ARENA_STACKS } from '../state/schema';
import {
  primeArenaFielded,
  primeArenaFieldedMatch,
  primeArenaFighter,
  primeArenaMatch,
  primeArenaScore,
  roundsWonBy,
} from './primeArena';
import type {
  PrimeArenaArmy,
  PrimeArenaFielded,
  PrimeArenaFighter,
  PrimeArenaMatch,
  PrimeArenaScore,
  PrimeArenaSide,
  PrimeArenaStack,
} from './primeArena';
import { assumedEnemies, evenArenaArmy, mulberry32 } from './primeArenaEnemies';
import type { BonusTotals, Housing } from './types';

export type PrimeArenaRole = PrimeArenaSide;

/** What a plan was ranked against: many assumed enemies, or the one the player typed. */
export type PrimeArenaMode = 'allRound' | 'counter';

/** How a squad does against a set of enemies. */
export interface PrimeArenaSetScore {
  /** Share of the matches won, a draw counting half: what the ranking reads. */
  wins: number;
  /** Share of the matches drawn, so the matches really won can be told apart (`wins - draws / 2`). */
  draws: number;
  /** Mean rounds won per match, of 2. */
  roundsWon: number;
  /** Mean lead per round: our surviving share minus theirs (-1..1). */
  lead: number;
  /** The lead at the worst-tenth mark of the set; the only match's lead when the set is one army. */
  badLead: number;
}

export interface PrimeArenaPlanInput {
  /** Units the squad may field (`primeArenaInputs(...).pool`). */
  pool: readonly UnitDef[];
  /** The Guardsmen level (`primeArenaInputs(...).level`): the tiers of the assumed enemies. */
  level: number;
  /** Leadership and Dominance caps (`primeArenaInputs(...).housing`); authority is not used. */
  housing: Housing;
  /** Bonuses of our army (`primeArenaInputs(...).totals`); a typed enemy carries them too. */
  totals: BonusTotals;
  /** The enemy the player typed (`primeArenaInputs(...).enemy`); empty or absent plans all-round. */
  enemy?: readonly PrimeArenaStack[];
  /** Which side we play (default attacker): who strikes first in each round of the match shown. */
  role?: PrimeArenaRole;
  /** Most stacks in the squad (default 8; the real limit is unknown). A unit is never in two stacks. */
  maxStacks?: number;
  /** Hard cap on search evaluations (default: none). */
  maxEvaluations?: number;
  /** Wall-clock cap in milliseconds (default 60 000). */
  maxMillis?: number;
  /** Random restarts after the climb from the default fill (default 4). */
  restarts?: number;
}

export interface PrimeArenaPlan {
  role: PrimeArenaRole;
  mode: PrimeArenaMode;
  /** The squad's stacks, pool order, zero counts dropped. */
  stacks: PrimeArenaStack[];
  /**
   * The match shown, with our side in `role` (so for a defender plan `match.defender` is us): against the typed
   * enemy, or, all-round, against an even army of our own size with our bonuses (`opponent`).
   */
  match: PrimeArenaMatch;
  /** That match's score for OUR side. */
  score: PrimeArenaScore;
  opponent: PrimeArenaStack[];
  /** How many enemies the squad was ranked on. */
  enemies: number;
  /** The squad's score over them. */
  setScore: PrimeArenaSetScore;
  /** The default even fill, scored on the same enemies. */
  start: { stacks: PrimeArenaStack[]; setScore: PrimeArenaSetScore };
  spent: { leadership: number; dominance: number };
  /** Housing the army leaves empty, per pool (Leadership and Dominance). */
  unspent: { leadership: number; dominance: number };
  /**
   * Whether a pool is filled as far as it can be: what is left costs less than the cheapest unit the squad
   * could field from it. False only when units of the pool exist in the pool list but cannot be fielded, or the
   * pool has housing and no unit at all.
   */
  maxed: { leadership: boolean; dominance: boolean };
  evaluations: number;
}

const DEFAULT_MILLIS = 60_000;
const DEFAULT_RESTARTS = 4;
/** Slice of a pool's budget moved per step, halved until it reaches the floor. */
const FIRST_SLICE = 0.5;
const LAST_SLICE = 1 / 64;

const NO_SCORE: PrimeArenaSetScore = { wins: 0, draws: 0, roundsWon: 0, lead: 0, badLead: 0 };

/** Positive when `a` ranks above `b` in a plan of this mode. */
export function comparePrimeArenaSetScore(
  a: PrimeArenaSetScore,
  b: PrimeArenaSetScore,
  mode: PrimeArenaMode,
): number {
  if (mode === 'counter') return a.wins - b.wins || a.roundsWon - b.roundsWon || a.lead - b.lead;
  return a.wins - b.wins || a.lead + a.badLead - (b.lead + b.badLead);
}

/** The match with our side in `role`. */
const matchFor = (
  role: PrimeArenaRole,
  ours: readonly PrimeArenaFielded[],
  theirs: readonly PrimeArenaFielded[],
): PrimeArenaMatch =>
  role === 'attacker' ? primeArenaFieldedMatch(ours, theirs) : primeArenaFieldedMatch(theirs, ours);

function scoreFielded(
  ours: readonly PrimeArenaFielded[],
  role: PrimeArenaRole,
  enemies: readonly (readonly PrimeArenaFielded[])[],
): PrimeArenaSetScore {
  if (enemies.length === 0) return NO_SCORE;
  const other = role === 'attacker' ? 'defender' : 'attacker';
  let wins = 0;
  let draws = 0;
  let roundsWon = 0;
  const leads = enemies.map((theirs) => {
    const match = matchFor(role, ours, theirs);
    if (match.winner === role) wins += 1;
    else if (match.winner === 'draw') {
      wins += 0.5;
      draws += 1;
    }
    roundsWon += roundsWonBy(match, role);
    const [first, second] = match.rounds;
    return (first[role].share - first[other].share + (second[role].share - second[other].share)) / 2;
  });
  const n = leads.length;
  const lead = leads.reduce((sum, value) => sum + value, 0) / n;
  leads.sort((a, b) => a - b);
  return {
    wins: wins / n,
    draws: draws / n,
    roundsWon: roundsWon / n,
    lead,
    badLead: leads[Math.floor(n / 10)]!,
  };
}

/** A squad's score over a set of enemies. */
export function scorePrimeArenaSet(
  stacks: readonly PrimeArenaStack[],
  totals: BonusTotals,
  role: PrimeArenaRole,
  enemies: readonly PrimeArenaArmy[],
): PrimeArenaSetScore {
  return scoreFielded(
    primeArenaFielded({ stacks: [...stacks], totals }),
    role,
    enemies.map(primeArenaFielded),
  );
}

interface Slot {
  /** Index into the plan's unit list. */
  u: number;
  n: number;
}
type Squad = Slot[];

function budgetOf(unit: UnitDef, housing: Housing): number {
  if (unit.pool === 'leadership') return housing.leadership;
  if (unit.pool === 'dominance') return housing.dominance;
  return 0;
}

export function planPrimeArena(input: PrimeArenaPlanInput): PrimeArenaPlan {
  const role = input.role ?? 'attacker';
  const maxStacks = Math.max(1, Math.floor(input.maxStacks ?? DEFAULT_ARENA_STACKS));
  const maxEvaluations = input.maxEvaluations ?? Infinity;
  const deadline = Date.now() + (input.maxMillis ?? DEFAULT_MILLIS);
  const restarts = input.restarts ?? DEFAULT_RESTARTS;
  // Only units a budget can pay for, and never a free one (a zero cost would be an unbounded stack).
  const units = input.pool.filter((u) => u.cost > 0 && budgetOf(u, input.housing) >= u.cost);
  const typed = (input.enemy ?? []).filter((s) => s.count > 0);
  const mode: PrimeArenaMode = typed.length > 0 ? 'counter' : 'allRound';
  const enemies: PrimeArenaArmy[] =
    mode === 'counter'
      ? [{ stacks: [...typed], totals: input.totals }]
      : assumedEnemies({ level: input.level, housing: input.housing, totals: input.totals });
  // Every unit's figures are worked out once for the whole search: ours here, each enemy's with its army.
  const fighters: PrimeArenaFighter[] = units.map((u) => primeArenaFighter(u, input.totals));
  const fielded = enemies.map(primeArenaFielded);
  const budget = (u: number): number => budgetOf(units[u]!, input.housing);
  const poolOf = (u: number): string => units[u]!.pool;
  const costOf = (u: number): number => units[u]!.cost;

  const canon = (squad: Squad): Squad =>
    squad
      .filter((s) => s.n > 0)
      .sort((a, b) => a.u - b.u || b.n - a.n)
      .map((s) => ({ ...s }));
  const stacksOf = (squad: Squad): PrimeArenaStack[] => squad.map((s) => ({ unit: units[s.u]!, count: s.n }));
  const keyOf = (squad: Squad): string => squad.map((s) => `${s.u}:${s.n}`).join(',');
  const spentIn = (squad: Squad, pool: string): number =>
    squad.reduce((a, s) => (poolOf(s.u) === pool ? a + costOf(s.u) * s.n : a), 0);

  let evaluations = 0;
  const memo = new Map<string, PrimeArenaSetScore>();
  const compare = (a: PrimeArenaSetScore, b: PrimeArenaSetScore): number =>
    comparePrimeArenaSetScore(a, b, mode);
  const score = (squad: Squad, counted = true): PrimeArenaSetScore => {
    const key = keyOf(squad);
    let found = memo.get(key);
    if (found === undefined) {
      if (counted) evaluations += 1;
      const ours = squad.map((s) => ({ fighter: fighters[s.u]!, count: s.n }));
      found = scoreFielded(ours, role, fielded);
      memo.set(key, found);
    }
    return found;
  };
  const budgetLeft = (): boolean => evaluations < maxEvaluations && Date.now() < deadline;

  // ---- starts ------------------------------------------------------------------------------------------
  const pools = (['leadership', 'dominance'] as const).filter((p) => units.some((u) => u.pool === p));
  const unitsOf = (pool: string): number[] =>
    units
      .flatMap((u, i) => (u.pool === pool ? [i] : []))
      .sort((a, b) => units[b]!.tier - units[a]!.tier || a - b);

  /** The units of a pool at its highest tier: what the game's default fill fields. */
  const topOf = (pool: string): number[] => {
    const all = unitsOf(pool);
    return all.filter((u) => units[u]!.tier === units[all[0]!]!.tier);
  };

  /** Slots per pool: all top units when they fit, else a split of the cap in proportion to what each pool has. */
  const slotShare = (): Record<string, number> => {
    const share: Record<string, number> = {};
    const total = pools.reduce((a, p) => a + topOf(p).length, 0);
    if (total <= maxStacks) {
      for (const p of pools) share[p] = topOf(p).length;
      return share;
    }
    if (pools.length === 1 || maxStacks === 1) {
      share[pools[0]!] = Math.min(maxStacks, topOf(pools[0]!).length);
      return share;
    }
    let left = maxStacks;
    for (const p of pools) {
      share[p] = Math.max(1, Math.min(topOf(p).length, Math.round((maxStacks * topOf(p).length) / total)));
      left -= share[p]!;
    }
    // Rounding may overshoot the cap: take the surplus from the pool with the most slots.
    while (left < 0) {
      const biggest = pools.reduce((a, p) => (share[p]! > share[a]! ? p : a));
      share[biggest]! -= 1;
      left += 1;
    }
    return share;
  };

  /** The default even fill: each pool's budget spread evenly over its top units. */
  const evenStart = (): Squad => {
    const share = slotShare();
    const squad: Squad = [];
    for (const p of pools) {
      const chosen = topOf(p).slice(0, share[p] ?? 0);
      for (const u of chosen) squad.push({ u, n: Math.floor(budget(u) / chosen.length / costOf(u)) });
    }
    return canon(squad);
  };

  const randomStart = (rand: () => number): Squad => {
    const squad: Squad = [];
    let slotsLeft = maxStacks;
    pools.forEach((p, idx) => {
      const reserve = pools.length - idx - 1;
      const room = Math.max(1, slotsLeft - reserve);
      if (slotsLeft <= 0) return;
      const k = Math.min(slotsLeft, unitsOf(p).length, 1 + Math.floor(rand() * Math.min(room, 5)));
      slotsLeft -= k;
      // Distinct units: a draw without replacement.
      const list = [...unitsOf(p)];
      const members = Array.from({ length: Math.min(k, list.length) }, () => {
        const [u] = list.splice(Math.floor(rand() * list.length), 1);
        return { u: u!, w: 0.2 + rand() };
      });
      const total = members.reduce((a, m) => a + m.w, 0);
      for (const m of members)
        squad.push({ u: m.u, n: Math.floor((budget(m.u) * (m.w / total)) / costOf(m.u)) });
    });
    return canon(squad);
  };

  // ---- moves -------------------------------------------------------------------------------------------
  function* neighbours(squad: Squad, slice: number): Generator<Squad> {
    for (let a = 0; a < squad.length; a += 1) {
      const from = squad[a]!;
      const pool = poolOf(from.u);
      const fromMoney = from.n * costOf(from.u);
      const money = Math.min(slice * budget(from.u), fromMoney);
      const take = Math.min(from.n, Math.ceil(money / costOf(from.u)));
      if (take <= 0) continue;
      // Transfer to another slot of the pool (merging all of `a` when it is the whole slot).
      for (let b = 0; b < squad.length; b += 1) {
        if (a === b || poolOf(squad[b]!.u) !== pool) continue;
        const give = Math.floor((take * costOf(from.u)) / costOf(squad[b]!.u));
        if (give <= 0) continue;
        const trial = squad.map((s) => ({ ...s }));
        trial[a]!.n -= take;
        trial[b]!.n += give;
        yield canon(trial);
      }
      // Retype the whole slot, and split a slice of it into a new slot (room permitting). Both only to a unit
      // the squad does not field yet: a unit is one stack.
      for (let u = 0; u < units.length; u += 1) {
        if (poolOf(u) !== pool || squad.some((s) => s.u === u)) continue;
        const retyped = squad.map((s) => ({ ...s }));
        retyped[a]!.u = u;
        retyped[a]!.n = Math.floor(fromMoney / costOf(u));
        if (retyped[a]!.n > 0) yield canon(retyped);
        if (squad.length < maxStacks) {
          const give = Math.floor((take * costOf(from.u)) / costOf(u));
          if (give <= 0) continue;
          const trial = squad.map((s) => ({ ...s }));
          trial[a]!.n -= take;
          trial.push({ u, n: give });
          yield canon(trial);
        }
      }
    }
  }

  const climb = (start: Squad): Squad => {
    let current = start;
    let best = score(current);
    for (let slice = FIRST_SLICE; slice >= LAST_SLICE && budgetLeft(); slice /= 2) {
      let improved = true;
      while (improved && budgetLeft()) {
        improved = false;
        for (const trial of neighbours(current, slice)) {
          if (!budgetLeft()) break;
          if (keyOf(trial) === keyOf(current)) continue;
          // Never exceed a pool's budget (a move pays for what it buys with what it frees).
          const result = score(trial);
          if (compare(result, best) > 0) {
            current = trial;
            best = result;
            improved = true;
            break;
          }
        }
      }
    }
    return current;
  };

  // ---- fill ---------------------------------------------------------------------------------------------
  /**
   * Spend what is left: while a pool can pay for a unit, add the best-scoring top-up, to a stack of the squad or,
   * unless `newStacks` is off, as a new one. Outside the evaluation budget.
   */
  const fill = (start: Squad, newStacks = true): Squad => {
    let squad = canon(start);
    for (const p of pools) {
      for (;;) {
        const left = budget(unitsOf(p)[0]!) - spentIn(squad, p);
        let pick: { squad: Squad; s: PrimeArenaSetScore } | null = null;
        const consider = (trial: Squad): void => {
          const next = canon(trial);
          const s = score(next, false);
          if (pick === null || compare(s, pick.s) > 0) pick = { squad: next, s };
        };
        squad.forEach((slot, i) => {
          if (poolOf(slot.u) !== p || costOf(slot.u) > left) return;
          const trial = squad.map((x) => ({ ...x }));
          trial[i]!.n += Math.floor(left / costOf(slot.u));
          consider(trial);
        });
        if (newStacks && squad.length < maxStacks) {
          for (const u of unitsOf(p)) {
            if (costOf(u) <= left && !squad.some((s) => s.u === u))
              consider([...squad.map((x) => ({ ...x })), { u, n: Math.floor(left / costOf(u)) }]);
          }
        }
        if (pick === null) break;
        squad = (pick as { squad: Squad }).squad;
      }
    }
    return squad;
  };

  // ---- run ----------------------------------------------------------------------------------------------
  const empty: Squad = [];
  // The even fill tops up the stacks it has and opens no other: the game's own fill adds no unit.
  const start = fill(units.length === 0 ? empty : evenStart(), false);
  const startScore = score(start, false);
  let bestSquad = start;
  let bestScore = startScore;
  const consider = (squad: Squad): void => {
    const filled = fill(squad);
    const s = score(filled, false);
    if (compare(s, bestScore) > 0) {
      bestSquad = filled;
      bestScore = s;
    }
  };
  if (units.length > 0) {
    consider(start);
    consider(climb(evenStart()));
    const rand = mulberry32(0x5eed);
    for (let r = 0; r < restarts && budgetLeft(); r += 1) consider(climb(randomStart(rand)));
  }

  const stacks = stacksOf(bestSquad);
  const spent = { leadership: spentIn(bestSquad, 'leadership'), dominance: spentIn(bestSquad, 'dominance') };
  const unspent = {
    leadership: input.housing.leadership - spent.leadership,
    dominance: input.housing.dominance - spent.dominance,
  };
  const maxedIn = (pool: 'leadership' | 'dominance'): boolean => {
    const costs = input.pool.filter((u) => u.pool === pool && u.cost > 0).map((u) => u.cost);
    return costs.length === 0 ? unspent[pool] <= 0 : unspent[pool] < Math.min(...costs);
  };
  const opponent = mode === 'counter' ? [...typed] : evenArenaArmy(input.level, input.housing);
  const ours = { stacks, totals: input.totals };
  const theirs = { stacks: opponent, totals: input.totals };
  const match = role === 'attacker' ? primeArenaMatch(ours, theirs) : primeArenaMatch(theirs, ours);
  return {
    role,
    mode,
    stacks,
    match,
    score: primeArenaScore(match, role),
    opponent,
    enemies: enemies.length,
    setScore: bestScore,
    start: { stacks: stacksOf(start), setScore: startScore },
    spent,
    unspent,
    maxed: { leadership: maxedIn('leadership'), dominance: maxedIn('dominance') },
    evaluations,
  };
}
