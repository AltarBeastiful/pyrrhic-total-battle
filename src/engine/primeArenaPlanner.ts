/**
 * B-34 / B-37 — Prime Arena stack planner, role-aware.
 *
 * Finds the best squad against a PANEL of opponents instead of one mirror. Every panel member is a scaled copy
 * of the candidate (same composition, same bonuses unless `opponentTotals` is given):
 *   - `strength` k scales the opponent's size: its stack counts are the candidate's times k (a k = 1.25 opponent
 *     fields a quarter more housing worth of the same units). It is the one scalar that moves with the candidate,
 *     so the panel always measures "how does this army fare against a mirror that is k times as strong";
 *   - `fill` is how much of its housing the opponent filled (players forget to fill); the opponent's counts are
 *     scaled by `strength * fill`, so an under-filled member is a weaker, lighter army.
 * Attacker role: the squad is the attacker (leads round 1); the panel is k 0.8..1.0 and the aggregate is the
 * MEAN score. Defender role: the squad is the defender (leads round 2); the panel is k 1.0..1.25 and the
 * aggregate is the WORST case. A panel score is a `PrimeArenaScore` shape (result, rounds won, survivor share
 * of OUR side) with fractional values for a mean, compared lexicographically as in `primeArena.ts`.
 *
 * A squad is up to `maxStacks` slots (default 8), each a unit and a count; a unit may repeat in several slots and
 * any pool unit may be used, lower tiers included. Housing bounds the squad: troops spend Leadership, monsters
 * Dominance.
 *
 * Search: hill climbs over slot counts from the even-split start and from seeded random restarts, sharing one
 * evaluation budget and one deadline. Moves (first improvement, slice of a pool's budget halving from 1/2 to
 * 1/64): transfer money between two slots of a pool, retype a slot, split part of a slot into a new slot, merge
 * a slot into another. Each climbed squad is then filled (best-scoring top-up until no unit is affordable) and
 * the best filled squad wins; the filled even-split start is always a candidate, so the result is never worse
 * than it on the panel score.
 */
import type { UnitDef } from '../data/types';
import { primeArenaMatch, primeArenaScore } from './primeArena';
import type {
  PrimeArenaArmy,
  PrimeArenaMatch,
  PrimeArenaScore,
  PrimeArenaSide,
  PrimeArenaStack,
} from './primeArena';
import type { BonusTotals, Housing } from './types';

export type PrimeArenaRole = PrimeArenaSide;

/** One opponent of the panel: a scaled copy of the candidate. */
export interface PrimeArenaPanelMember {
  /** Opponent size relative to the candidate (k): its counts are ours times `strength * fill`. */
  strength: number;
  /** Share of its housing the opponent filled, 0..1. */
  fill: number;
  label: string;
}

/** A panel score: `PrimeArenaScore` fields, fractional for a mean. */
export interface PrimeArenaPanelScore {
  result: number;
  roundsWon: number;
  survivorShare: number;
}

export interface PrimeArenaPlanInput {
  /** Units the squad may field (`primeArenaInputs(...).pool`). */
  pool: readonly UnitDef[];
  /** Leadership and Dominance caps (`primeArenaInputs(...).housing`); authority is not used. */
  housing: Housing;
  /** Bonuses of our army (`primeArenaInputs(...).totals`). */
  totals: BonusTotals;
  /** Which side we play (default attacker): fixes the panel and the aggregate. */
  role?: PrimeArenaRole;
  /** Most stacks in the squad (default 8; the real limit is unknown). Repeats of one unit are allowed. */
  maxStacks?: number;
  /**
   * Opponent bonuses. The default is `armyWideTotals(totals)`: our army-wide health and strength and nothing
   * category-, group- or race-specific (a captain such as Leonidas is ours alone), no specials, no matchups.
   */
  opponentTotals?: BonusTotals;
  /** Hard cap on search evaluations (default: none). */
  maxEvaluations?: number;
  /** Wall-clock cap in milliseconds (default 60 000). */
  maxMillis?: number;
  /** Random restarts after the even-split climb (default 4). */
  restarts?: number;
}

export interface PrimeArenaPlan {
  role: PrimeArenaRole;
  /** The squad's stacks, pool order, zero counts dropped. */
  stacks: PrimeArenaStack[];
  /**
   * The headline match: our squad against the full-strength full-fill mirror (k = 1, fill 1), with our side in
   * `role` (so for a defender plan `match.defender` is us).
   */
  match: PrimeArenaMatch;
  /** The headline match's score for OUR side (attacker or defender score, per `role`). */
  score: PrimeArenaScore;
  /** The panel the squad was ranked on, and how its scores combine. */
  panel: PrimeArenaPanelMember[];
  aggregate: 'mean' | 'worst';
  /** The squad's score over the panel. */
  panelScore: PrimeArenaPanelScore;
  /** The even-split start (filled), scored on the same panel. */
  start: { stacks: PrimeArenaStack[]; panelScore: PrimeArenaPanelScore };
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
const DEFAULT_STACKS = 8;
const DEFAULT_RESTARTS = 4;
/** Slice of a pool's budget moved per step, halved until it reaches the floor. */
const FIRST_SLICE = 0.5;
const LAST_SLICE = 1 / 64;

/** The opponent panel of a role. */
export function primeArenaPanel(role: PrimeArenaRole): PrimeArenaPanelMember[] {
  const members: [number, number][] =
    role === 'attacker'
      ? [
          [0.8, 1],
          [0.9, 1],
          [1.0, 1],
          [1.0, 0.85],
          [0.9, 0.7],
        ]
      : [
          [1.0, 1],
          [1.125, 1],
          [1.25, 1],
          [1.25, 0.85],
          [1.0, 0.7],
        ];
  return members.map(([strength, fill]) => ({
    strength,
    fill,
    label: `k ${strength}${fill < 1 ? `, ${Math.round(fill * 100)} % filled` : ''}`,
  }));
}

function scaled(stacks: readonly PrimeArenaStack[], factor: number): PrimeArenaStack[] {
  return stacks.flatMap((s) => {
    const count = Math.floor(s.count * factor);
    return count > 0 ? [{ unit: s.unit, count }] : [];
  });
}

/** Our side's score of a match: attacker or defender perspective. */
function sideScore(match: PrimeArenaMatch, role: PrimeArenaRole): PrimeArenaScore {
  if (role === 'attacker') return primeArenaScore(match);
  return {
    result: match.winner === 'defender' ? 2 : match.winner === 'draw' ? 1 : 0,
    roundsWon: match.defenderRoundsWon,
    survivorShare: match.rounds[0].defender.share + match.rounds[1].defender.share,
  };
}

function matchAgainst(
  stacks: readonly PrimeArenaStack[],
  totals: BonusTotals,
  role: PrimeArenaRole,
  member: PrimeArenaPanelMember,
  opponentTotals: BonusTotals,
): PrimeArenaMatch {
  const ours: PrimeArenaArmy = { stacks: [...stacks], totals };
  const theirs: PrimeArenaArmy = {
    stacks: scaled(stacks, member.strength * member.fill),
    totals: opponentTotals,
  };
  return role === 'attacker' ? primeArenaMatch(ours, theirs) : primeArenaMatch(theirs, ours);
}

export function comparePanelScore(a: PrimeArenaPanelScore, b: PrimeArenaPanelScore): number {
  return a.result - b.result || a.roundsWon - b.roundsWon || a.survivorShare - b.survivorShare;
}

/** A squad's score over a panel: the mean for an attacker, the worst member for a defender. */
export function scorePrimeArenaPanel(
  stacks: readonly PrimeArenaStack[],
  totals: BonusTotals,
  role: PrimeArenaRole,
  panel: readonly PrimeArenaPanelMember[],
  opponentTotals: BonusTotals = armyWideTotals(totals),
): PrimeArenaPanelScore {
  const scores = panel.map((m) => sideScore(matchAgainst(stacks, totals, role, m, opponentTotals), role));
  if (role === 'defender') {
    return scores.reduce((worst, s) => (comparePanelScore(s, worst) < 0 ? s : worst));
  }
  const n = scores.length;
  return {
    result: scores.reduce((a, s) => a + s.result, 0) / n,
    roundsWon: scores.reduce((a, s) => a + s.roundsWon, 0) / n,
    survivorShare: scores.reduce((a, s) => a + s.survivorShare, 0) / n,
  };
}

/** The bonuses every opponent is assumed to have: ours, restricted to the army-wide health and strength. */
export function armyWideTotals(totals: BonusTotals): BonusTotals {
  const only = (rec: BonusTotals['health']): BonusTotals['health'] => {
    const out = {} as BonusTotals['health'];
    for (const key of Object.keys(rec) as (keyof typeof rec)[]) out[key] = key === 'army' ? rec[key] : 0;
    return out;
  };
  const special = {} as BonusTotals['special'];
  for (const key of Object.keys(totals.special) as (keyof typeof totals.special)[]) special[key] = 0;
  return {
    health: only(totals.health),
    strength: only(totals.strength),
    special,
    matchup: [],
    eventStrength: 0,
    breakdown: { health: {}, strength: {}, special: {} },
  };
}

interface Slot {
  /** Index into the plan's unit list. */
  u: number;
  n: number;
}
type Squad = Slot[];

/** Small seeded generator so restarts are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function budgetOf(unit: UnitDef, housing: Housing): number {
  if (unit.pool === 'leadership') return housing.leadership;
  if (unit.pool === 'dominance') return housing.dominance;
  return 0;
}

export function planPrimeArenaAttack(input: PrimeArenaPlanInput): PrimeArenaPlan {
  const role = input.role ?? 'attacker';
  const maxStacks = Math.max(1, Math.floor(input.maxStacks ?? DEFAULT_STACKS));
  const maxEvaluations = input.maxEvaluations ?? Infinity;
  const deadline = Date.now() + (input.maxMillis ?? DEFAULT_MILLIS);
  const restarts = input.restarts ?? DEFAULT_RESTARTS;
  const opponentTotals = input.opponentTotals ?? armyWideTotals(input.totals);
  const panel = primeArenaPanel(role);
  // Only units a budget can pay for, and never a free one (a zero cost would be an unbounded stack).
  const units = input.pool.filter((u) => u.cost > 0 && budgetOf(u, input.housing) >= u.cost);
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
  const memo = new Map<string, PrimeArenaPanelScore>();
  const score = (squad: Squad, counted = true): PrimeArenaPanelScore => {
    const key = keyOf(squad);
    let found = memo.get(key);
    if (found === undefined) {
      if (counted) evaluations += 1;
      found = scorePrimeArenaPanel(stacksOf(squad), input.totals, role, panel, opponentTotals);
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

  /** Slots per pool: all units when they fit, else a split of the cap in proportion to the units each pool has. */
  const slotShare = (): Record<string, number> => {
    const share: Record<string, number> = {};
    const total = pools.reduce((a, p) => a + unitsOf(p).length, 0);
    if (total <= maxStacks) {
      for (const p of pools) share[p] = unitsOf(p).length;
      return share;
    }
    if (pools.length === 1 || maxStacks === 1) {
      share[pools[0]!] = Math.min(maxStacks, unitsOf(pools[0]!).length);
      return share;
    }
    let left = maxStacks;
    for (const p of pools) {
      share[p] = Math.max(
        1,
        Math.min(unitsOf(p).length, Math.round((maxStacks * unitsOf(p).length) / total)),
      );
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

  const evenStart = (): Squad => {
    const share = slotShare();
    const squad: Squad = [];
    for (const p of pools) {
      const k = share[p] ?? 0;
      const chosen = unitsOf(p).slice(0, k);
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
      const k = Math.min(slotsLeft, 1 + Math.floor(rand() * Math.min(room, 5)));
      slotsLeft -= k;
      const members = Array.from({ length: k }, () => {
        const list = unitsOf(p);
        return { u: list[Math.floor(rand() * list.length)]!, w: 0.2 + rand() };
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
      // Retype the whole slot, and split a slice of it into a new slot (room permitting).
      for (let u = 0; u < units.length; u += 1) {
        if (poolOf(u) !== pool) continue;
        if (u !== from.u) {
          const trial = squad.map((s) => ({ ...s }));
          trial[a]!.u = u;
          trial[a]!.n = Math.floor(fromMoney / costOf(u));
          if (trial[a]!.n > 0) yield canon(trial);
        }
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
          if (comparePanelScore(result, best) > 0) {
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
  /** Spend what is left: while a pool can pay for a unit, add the best-scoring top-up. Outside the budget. */
  const fill = (start: Squad): Squad => {
    let squad = canon(start);
    for (const p of pools) {
      for (;;) {
        const left = budget(unitsOf(p)[0]!) - spentIn(squad, p);
        let pick: { squad: Squad; s: PrimeArenaPanelScore } | null = null;
        const consider = (trial: Squad): void => {
          const next = canon(trial);
          const s = score(next, false);
          if (pick === null || comparePanelScore(s, pick.s) > 0) pick = { squad: next, s };
        };
        squad.forEach((slot, i) => {
          if (poolOf(slot.u) !== p || costOf(slot.u) > left) return;
          const trial = squad.map((x) => ({ ...x }));
          trial[i]!.n += Math.floor(left / costOf(slot.u));
          consider(trial);
        });
        if (squad.length < maxStacks) {
          for (const u of unitsOf(p)) {
            if (costOf(u) <= left)
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
  const start = fill(units.length === 0 ? empty : evenStart());
  const startScore = score(start, false);
  let bestSquad = start;
  let bestScore = startScore;
  const consider = (squad: Squad): void => {
    const filled = fill(squad);
    const s = score(filled, false);
    if (comparePanelScore(s, bestScore) > 0) {
      bestSquad = filled;
      bestScore = s;
    }
  };
  if (units.length > 0) {
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
  const headline = panel.find((m) => m.strength === 1 && m.fill === 1)!;
  const match = matchAgainst(stacks, input.totals, role, headline, opponentTotals);
  return {
    role,
    stacks,
    match,
    score: sideScore(match, role),
    panel,
    aggregate: role === 'attacker' ? 'mean' : 'worst',
    panelScore: bestScore,
    start: { stacks: stacksOf(start), panelScore: startScore },
    spent,
    unspent,
    maxed: { leadership: maxedIn('leadership'), dominance: maxedIn('dominance') },
    evaluations,
  };
}
