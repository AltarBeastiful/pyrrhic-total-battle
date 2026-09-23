/**
 * **The rated re-typing of one march** (W11 §3.1, `docs/plans/the-rated-retyping.md`): experiment 157's
 * `rated` search (`tools/theorycraft/silver-aware.ts`), moved into the engine.
 *
 * Complete optimization chooses which troop type stands in which stack on damage alone. This pass keeps the
 * march's **hired stacks** (every pool but `leadership`) exactly, reads its troop stacks as **slots**, each
 * with its total HP, and tries every assignment of the account's troop types to those slots — exhaustively up
 * to {@link EXHAUSTIVE} assignments, else a best-improvement climb of swaps and replacements from the march as
 * it stands. Each type is sized to **at least its slot's HP** (so the kill order's HP levels and the hired
 * stacks' shelter hold). An assignment is admissible when the leadership fits and it deals **at least the
 * march's worst-opening damage**; among those the best **positive** rating by the owner's `MarkerRates`
 * (`rate`, `rating.ts`) is kept.
 *
 * Every figure is the battle's own reading: `marchResult` (`plan.ts`, exported as `planMarch`), the same call
 * 157 priced with — worst-opening damage (`summary.minDamage`) and the account's recovery bill
 * (`summary.recovery`: silver, gold, dragon coins, queue seconds). The hired burn (chunks of ten of every
 * `authority` stack, as the plan counts `mercLost`) is carried too, so the rating forgets no cost; it cannot
 * move, since the hired stacks are kept.
 */
import { buildKillOrder } from './killOrder';
import { marchResult, effectiveTable, rankTroops } from './plan';
import type { Bill, MarkerRates } from './rating';
import { rate } from './rating';
import { chunks } from './recovery';
import type { StackRequest } from './types';

/** Up to this many assignments are tried one by one; above it, the swap/replace climb. */
export const EXHAUSTIVE = 5_000;
/** The climb's step cap (157's). */
const CLIMB_STEPS = 60;

export interface RetypeOptions {
  /**
   * A wall-clock deadline, as a `Date.now()` timestamp (the clock `planCampaign`'s budget reads). Once past
   * it the search stops and returns the best assignment found so far (W11 §3.5).
   */
  deadline?: number | undefined;
  /**
   * **Tier order as a candidate, and three seeds** (W13 §2 step 1, `docs/plans/every-ordering.md`, experiment
   * 169; `CAMPAIGN.planFixes.tierCandidate`). The march's own types in S-22's kill order over its own slots —
   * the first to die on the biggest slot, each type at least its slot's HP, not re-scaled — are always tried
   * (one battle), and the climb starts from three places: the march as it is, that tier order, and the
   * ranking's order (`rankTroops`, the weakest per HP on the biggest slot). The best positive rating over all
   * of them is kept, and then offered its own types in kill order over its **own** slots (§3's twin), taken
   * while it rates above it. Off, the search is exactly the one before.
   */
  tierCandidate?: boolean | undefined;
}

/** Which start the kept assignment was found from (a diagnostic of experiment 169). */
export type RetypeSeed = 'as-is' | 'tier' | 'ranking' | 'exhaustive';

export interface Retyped {
  /** The re-typed march: the hired stacks as they were, the troop stacks re-chosen. */
  counts: Record<string, number>;
  /** Its rating against the march as it was (`rate`, damage-percent equivalents; always positive). */
  rating: number;
  /** Admissible-by-leadership assignments battled. */
  tried: number;
  /** Every assignment was enumerated (not the climb). */
  exhaustive: boolean;
  /** The deadline stopped the search before it finished. */
  cut: boolean;
  /** Where the kept assignment was found (`tierCandidate` only). */
  seed?: RetypeSeed | undefined;
}

/** A march's bill, the battle's way: worst-opening damage and every cost its recovery carries. */
export function marchBill(request: StackRequest, counts: Record<string, number>): Bill {
  const { summary } = marchResult(request, counts);
  let hired = 0;
  for (const unit of request.units) if (unit.pool === 'authority') hired += chunks(counts[unit.id] ?? 0);
  return {
    damage: summary.minDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    hired,
    dragonCoins: summary.recovery.dragonCoins,
    seconds: summary.recovery.seconds,
  };
}

/**
 * The best-rated re-typing of one march, or `null` when no admissible assignment rates positive (or the march
 * fields no troop stack).
 */
export function retypeMarch(
  request: StackRequest,
  counts: Record<string, number>,
  rates: MarkerRates,
  options: RetypeOptions = {},
): Retyped | null {
  const deadline = options.deadline ?? Infinity;
  let cut = false;
  const outOfTime = (): boolean => {
    if (!cut && Date.now() > deadline) cut = true;
    return cut;
  };
  const table = effectiveTable(request).filter((e) => e.pool === 'leadership');
  const { result } = marchResult(request, counts);
  const troopStacks = result.stacks.filter((s) => s.pool === 'leadership');
  const slots = troopStacks.map((s) => s.totalHp);
  if (slots.length === 0) return null;
  const hired: Record<string, number> = {};
  for (const s of result.stacks) if (s.pool !== 'leadership') hired[s.unitId] = s.count;
  const base = marchBill(request, counts);

  const build = (types: number[]): Record<string, number> | null => {
    const next: Record<string, number> = { ...hired };
    let lead = 0;
    types.forEach((ti, slot) => {
      const t = table[ti];
      if (!t) return;
      const count = Math.ceil((slots[slot] ?? 0) / t.hp);
      next[t.id] = count;
      lead += count * t.cost;
    });
    return lead <= request.housing.leadership ? next : null;
  };

  let best: { counts: Record<string, number>; rating: number; seed?: RetypeSeed } | null = null;
  let tried = 0;
  const tierCandidate = options.tierCandidate === true;
  /** The start the search is climbing from, credited with any best it finds (`tierCandidate` only). */
  let from: RetypeSeed | undefined;
  /** Every assignment already battled, so three climbs never battle one twice (`tierCandidate` only). */
  const seen = new Map<string, number>();
  /** The candidate's rating, or −∞ when it does not fit or deals less damage. */
  const consider = (types: number[]): number => {
    const key = tierCandidate ? types.join(',') : '';
    if (tierCandidate) {
      const hit = seen.get(key);
      if (hit !== undefined) return hit;
    }
    const c = build(types);
    if (!c) {
      if (tierCandidate) seen.set(key, -Infinity);
      return -Infinity;
    }
    tried += 1;
    const bill = marchBill(request, c);
    const score = bill.damage < base.damage - 1e-6 ? -Infinity : rate(base, bill, rates);
    if (tierCandidate) seen.set(key, score);
    if (score > 1e-9 && (!best || score > best.rating))
      best = tierCandidate
        ? { counts: c, rating: score, seed: from as RetypeSeed }
        : { counts: c, rating: score };
    return score;
  };

  const k = slots.length;
  const m = table.length;
  let perms = 1;
  for (let i = 0; i < k; i += 1) perms *= m - i;
  const exhaustive = perms <= EXHAUSTIVE;
  const asIs = troopStacks.map((s) => table.findIndex((t) => t.id === s.unitId));
  let tier = asIs;
  let ranking = asIs;
  if (tierCandidate) {
    // The march's own types laid over its own slots, biggest slot first, in a given order of first to die.
    const bySlotHp = slots.map((_, i) => i).sort((a, b) => (slots[b] ?? 0) - (slots[a] ?? 0));
    const laid = (rank: Map<string, number>): number[] => {
      const types = [...asIs].sort(
        (a, b) =>
          (rank.get(table[a]?.id ?? '') ?? Infinity) - (rank.get(table[b]?.id ?? '') ?? Infinity) || a - b,
      );
      const out = [...asIs];
      bySlotHp.forEach((slot, i) => (out[slot] = types[i] as number));
      return out;
    };
    tier = laid(new Map(buildKillOrder(request.units, request.options).map((id, i) => [id, i])));
    ranking = laid(new Map(rankTroops(effectiveTable(request)).map((entry, i) => [entry.id, i])));
    // Tier order is always tried, whatever the search below: one battle.
    from = 'tier';
    consider(tier);
  }
  if (exhaustive) {
    from = 'exhaustive';
    const walk = (acc: number[], used: Set<number>): void => {
      if (outOfTime()) return;
      if (acc.length === k) {
        consider(acc);
        return;
      }
      for (let i = 0; i < m; i += 1) {
        if (used.has(i)) continue;
        used.add(i);
        acc.push(i);
        walk(acc, used);
        acc.pop();
        used.delete(i);
      }
    };
    walk([], new Set());
  } else {
    // A best-improvement climb from the march as it stands (rating 0 against itself): swap two slots, or put
    // an unused type in a slot; move to the best neighbour while it rates higher than where the climb stands.
    const climb = (start: number[], startScore: number): void => {
      let current = start;
      let currentScore = startScore;
      for (let step = 0; step < CLIMB_STEPS && !outOfTime(); step += 1) {
        let moved: { types: number[]; score: number } | null = null;
        const neighbours: number[][] = [];
        for (let a = 0; a < k; a += 1) {
          for (let b = a + 1; b < k; b += 1) {
            const next = [...current];
            [next[a], next[b]] = [next[b] as number, next[a] as number];
            neighbours.push(next);
          }
          for (let t = 0; t < m; t += 1) {
            if (current.includes(t)) continue;
            const next = [...current];
            next[a] = t;
            neighbours.push(next);
          }
        }
        for (const next of neighbours) {
          if (outOfTime()) break;
          const s = consider(next);
          if (s > currentScore + 1e-6 && (!moved || s > moved.score)) moved = { types: next, score: s };
        }
        if (!moved) break;
        current = moved.types;
        currentScore = moved.score;
      }
    };
    if (!tierCandidate) climb(asIs, 0);
    else {
      const same = (a: number[], b: number[]): boolean => a.every((t, i) => t === b[i]);
      const tierScore = seen.get(tier.join(',')) ?? -Infinity;
      from = 'as-is';
      climb(asIs, 0);
      if (!same(tier, asIs)) {
        from = 'tier';
        climb(tier, tierScore);
      }
      if (!same(ranking, asIs) && !same(ranking, tier)) {
        from = 'ranking';
        climb(ranking, consider(ranking));
      }
    }
  }
  if (tierCandidate && best !== null && !cut) {
    // **The kept march against its own tier order** (§3's twin): the assignment kept was rated on the slots of
    // the march handed in, and each type rounded up to whole units, so it stands on slots of its own — where
    // its own types in kill order can rate above it. Taken while it does, still above the march handed in and
    // holding its damage (experiment 169 §D: three marches of the message camp, +0.03 each).
    const killRank = new Map(buildKillOrder(request.units, request.options).map((id, i) => [id, i]));
    const byId = new Map(table.map((entry) => [entry.id, entry]));
    for (let round = 0; round < 3; round += 1) {
      const kept = best as { counts: Record<string, number>; rating: number; seed?: RetypeSeed };
      const own = marchResult(request, kept.counts).result.stacks.filter(
        (s) => s.pool === 'leadership' && s.count > 0,
      );
      const ownSlots = own.map((s) => s.totalHp).sort((a, b) => b - a);
      const ownTypes = own
        .map((s) => s.unitId)
        .sort((a, b) => (killRank.get(a) ?? Infinity) - (killRank.get(b) ?? Infinity));
      const twin: Record<string, number> = { ...hired };
      let lead = 0;
      ownTypes.forEach((id, i) => {
        const entry = byId.get(id);
        if (!entry) return;
        const count = Math.ceil((ownSlots[i] ?? 0) / entry.hp);
        twin[id] = count;
        lead += count * entry.cost;
      });
      if (lead > request.housing.leadership) break;
      if (ownTypes.every((id) => twin[id] === kept.counts[id])) break;
      tried += 1;
      const bill = marchBill(request, twin);
      if (bill.damage < base.damage - 1e-6) break;
      if (!(rate(marchBill(request, kept.counts), bill, rates) > 1e-9)) break;
      const score = rate(base, bill, rates);
      if (!(score > 1e-9)) break;
      best = { counts: twin, rating: score, seed: 'tier' };
    }
  }
  const found = best as { counts: Record<string, number>; rating: number; seed?: RetypeSeed } | null;
  if (!found) return null;
  return tierCandidate
    ? {
        counts: found.counts,
        rating: found.rating,
        tried,
        exhaustive,
        cut,
        seed: found.seed,
      }
    : { counts: found.counts, rating: found.rating, tried, exhaustive, cut };
}
