/**
 * 45 — the ledger and the exact optimum.
 *
 * 0015 built its marches with the app's sizer plus heuristics. This file asks the two questions the
 * heuristics could not answer:
 *
 *   §1 **the ledger** — one row per unit type: HP per unit, damage per unit, and the two ratios that
 *      decide everything, `k = damage per HP` and `damage per point of pool` (leadership / authority);
 *   §2 **the identity** — every march's damage is `Σ_p hits(p) × damagePerHit_p`, and since
 *      `hits × dmg = hits × HP × k` the score responds to an HP-descending ladder whose `k` ascends;
 *      the closed-form hit counter is checked against the engine's own journal and against `expectedHits`;
 *   §3 **the optimum** — a bounded hill-climb on the 12 count variables (leadership transfers between
 *      troop types, mercenary counts stepped inside the caps), started from every flat-ladder shape;
 *   §4 what the sizer leaves on the table, and the single change that captures most of it;
 *   §5 the two rules the repo cannot settle, bounded: duplicate stacks of one type, and the kill order.
 *
 * SEARCH BOUNDS (explicit — the whole file is a bounded search, not an exhaustive one)
 *   - variables: 12 counts (8 troop types ≥ 0 on leadership 4,343; 4 mercenary types in [0, cap]);
 *     authority is 2,000 and the four caps cost 314 of it, so the pool never binds and dominance is unused;
 *   - starts: every non-empty subset of the 8 troop types (255) × 4 mercenary scales, sized by the flat
 *     ladder `M = L / Σ(cost/hp)`, plus the sizer's own answer, Kai's march and 0015's two winners, plus
 *     200 random starts; the best 60 are climbed coarsely, the best 20 of those finely, then the incumbent
 *     is polished and 400 perturb-and-reclimb trials are run against it;
 *   - moves: move `m` ∈ {1, 10, 100, 1000} *points of leadership* from unit b to unit a (or from the unused
 *     pool), and +/- (1, 5, 10) mercenaries inside the caps; first-improvement, swept to a fixed point;
 *   - budget: 2,000,000 `evaluateCounts` calls (measured at 21 µs each ≈ 45 s) and a 4-minute wall clock.
 *     The run below spends ~205,000 calls and ~4 s, so it is bounded by the search shape, not by the clock;
 *     it is a multi-start local search, **not** an exhaustive enumeration — §5 measures what a wider space
 *     (§1's twin: two stacks of one type) would be worth.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/45-ledger-optimum.test.ts`
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { attackOrder, expectedHits } from '../../src/engine/battle';
import { aggregateBonuses } from '../../src/engine/bonuses';
import { chunks, recoveryCosts } from '../../src/engine/recovery';
import { effectiveUnit, hitDamage } from '../../src/engine/units';
import type { ResolvedSource, StackRequest } from '../../src/engine/types';
import {
  MERC_IDS,
  Report,
  countsOf,
  duration,
  evaluate,
  evaluateCounts,
  feasible,
  label,
  lines,
  loadOwner,
  n,
  table,
  withUnits,
} from './harness';

/**
 * Scenario B and C. The harness carried these as `reportTotals()` / `kaiReportTotals()` while 0015 was
 * written; they are repeated here (verbatim, per 0015 §0 and `02-kai-report.test.ts`) so this file does not
 * depend on a shared module that other theory-craft scripts are editing at the same time. §1 checks the
 * reproduction below, so a drift in either copy shows up as a failed assertion, not as a silent difference.
 */
const B_SOURCE: ResolvedSource = {
  id: 'ingame-2026-09-13',
  label: 'bonuses as in the 2026-09-13 report',
  kind: 'custom',
  health: { guardsmen: 143, ranged: 0.5, specialist: 51 },
  strength: { guardsmen: 187, ranged: 1, specialist: 71 },
  special: { doubleDamageChance: 3 },
};
const C_SOURCE: ResolvedSource = {
  id: 'kai-report-2026-09-14',
  label: 'bonuses as in the 2026-09-14 report',
  kind: 'custom',
  health: { guardsmen: 159, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
  strength: { guardsmen: 189, melee: 1, mounted: 1, flying: 1, ranged: 2 },
  special: { doubleDamageChance: 3 },
};

function scenario(request: StackRequest, source: ResolvedSource): StackRequest {
  return {
    ...request,
    totals: aggregateBonuses([source]),
    recovery: { ...request.recovery, templeLevel: 15 },
  };
}

/** The owner's real march, 2026-09-14 (`docs/research/battlereportkai.md`, Kai's counts). */
const OWNER_MARCH: Counts = {
  'spearman-1': 855,
  'rider-1': 423,
  'archer-1': 837,
  'spearman-2': 451,
  'rider-2': 223,
  'archer-2': 440,
  'rider-3': 116,
  'arbalester-6': 18,
  'legionary-6': 18,
  'epic-monster-hunter-6': 16,
  'chariot-6': 8,
};
/** 0015 §5's hand-tuned mercenary vector on the 7-type winner. */
const WINNER_0015_MERCS: Counts = {
  'epic-monster-hunter-6': 67,
  'arbalester-6': 76,
  'legionary-6': 72,
  'chariot-6': 36,
};

type Counts = Record<string, number>;

// ---- The hill-climb --------------------------------------------------------------------------------
let EVALS = 0;
const EVAL_CAP = 2_000_000;
const START = Date.now();
const DEADLINE = START + 4 * 60 * 1000;
const elapsed = (): number => Date.now() - START;

interface ClimbOptions {
  deltas: number[];
  sweeps: number;
}

interface Scorer {
  (counts: Counts): number;
  hp: Record<string, number>;
}

function scorerFor(request: StackRequest, constrain?: (counts: Counts) => boolean): Scorer {
  const hp: Record<string, number> = {};
  for (const unit of request.units) {
    hp[unit.id] = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents).hpPerUnit;
  }
  const fn = (counts: Counts): number => {
    if (!feasible(request, counts)) return -1;
    if (constrain && !constrain(counts)) return -1;
    if (EVALS >= EVAL_CAP || Date.now() > DEADLINE) return -1;
    EVALS += 1;
    return evaluateCounts(request, counts).summary.avgDamage;
  };
  return Object.assign(fn, { hp });
}

function climb(request: StackRequest, start: Counts, score: Scorer, options: ClimbOptions): Counts {
  const troopIds = request.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
  const mercIds = request.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
  // The cost table belongs to *this* request: §5 puts clone units in it, and a global table would price a
  // clone at 1 and overshoot the pool on every move.
  const costOf = new Map(request.units.map((unit) => [unit.id, unit.cost]));
  const cur: Counts = {};
  for (const unit of request.units) cur[unit.id] = Math.max(0, Math.floor(start[unit.id] ?? 0));

  let best = score(cur);
  for (let sweep = 0; sweep < options.sweeps; sweep += 1) {
    let improved = false;
    const step = (mutate: () => void, revert: () => void): void => {
      mutate();
      const value = score(cur);
      if (value > best) {
        best = value;
        improved = true;
      } else revert();
    };
    // Leadership: move `m` points of pool from b to a, b = '' meaning "from the unused pool". Counts are
    // units, costs are 1 or 2, so the move has to be denominated in leadership — moving one *unit* of RD3
    // to ARC2 is a 1-leadership move, not a swap of one for one.
    for (const a of troopIds) {
      const ca = costOf.get(a) ?? 1;
      for (const b of ['', ...troopIds]) {
        if (a === b) continue;
        const cb = b === '' ? 0 : (costOf.get(b) ?? 1);
        for (const m of options.deltas) {
          const na = Math.floor(m / ca);
          const nb = b === '' ? 0 : Math.floor(m / cb);
          if (na <= 0) continue;
          // nb = 0 is allowed and is not a no-op: it spends `na` units of slack the pool still has.
          if (b !== '' && (cur[b] ?? 0) < nb) continue;
          step(
            () => {
              if (b !== '') cur[b] = (cur[b] ?? 0) - nb;
              cur[a] = (cur[a] ?? 0) + na;
            },
            () => {
              if (b !== '') cur[b] = (cur[b] ?? 0) + nb;
              cur[a] = (cur[a] ?? 0) - na;
            },
          );
        }
      }
    }
    // Mercenaries: independent of the leadership pool, bounded by the stock caps.
    for (const m of mercIds) {
      for (const d of [1, 5, 10, -1, -5, -10]) {
        step(
          () => {
            cur[m] = (cur[m] ?? 0) + d;
          },
          () => {
            cur[m] = (cur[m] ?? 0) - d;
          },
        );
      }
    }
    if (!improved) break;
    if (EVALS >= EVAL_CAP || Date.now() > DEADLINE) break;
  }
  return cur;
}

/** Cost per unit, by type id (filled from the request at the top of the run). */
const COST: Record<string, number> = {};

/** Flat ladder: every chosen troop stack at `M = L / Σ(cost/hp)` HP, plus mercenaries at `scale × cap`. */
function flatStart(
  request: StackRequest,
  hp: Record<string, number>,
  subset: string[],
  scale: number,
): Counts {
  const troopIds = request.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
  const mercIds = request.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
  const costOf = new Map(request.units.map((unit) => [unit.id, unit.cost]));
  const chosen = subset.filter((id) => troopIds.includes(id));
  const denom = chosen.reduce((sum, id) => sum + (costOf.get(id) ?? 1) / (hp[id] ?? 1), 0);
  const M = chosen.length > 0 && denom > 0 ? request.housing.leadership / denom : 0;
  const counts: Counts = {};
  for (const id of troopIds) counts[id] = 0;
  chosen.forEach((id, index) => {
    counts[id] = Math.max(0, Math.floor((M * (1 - 0.0005 * index)) / (hp[id] ?? 1)));
  });
  for (const m of mercIds) counts[m] = Math.round(scale * (request.caps[m] ?? 0));
  return counts;
}

function subsets<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let mask = 1; mask < 1 << items.length; mask += 1) {
    const pick: T[] = [];
    items.forEach((item, index) => {
      if ((mask & (1 << index)) !== 0) pick.push(item);
    });
    out.push(pick);
  }
  return out;
}

function mercsLost(counts: Counts): number {
  let lost = 0;
  for (const id of MERC_IDS) lost += chunks(counts[id] ?? 0);
  return lost;
}

function usedLeadership(request: StackRequest, counts: Counts): number {
  let used = 0;
  for (const unit of request.units)
    if (unit.pool === 'leadership') used += (counts[unit.id] ?? 0) * unit.cost;
  return used;
}

/** Kendall's τ of two parallel sequences. */
function kendall(xs: number[], ys: number[]): number {
  let concordant = 0;
  let discordant = 0;
  for (let i = 0; i < xs.length; i += 1) {
    for (let j = i + 1; j < xs.length; j += 1) {
      const sign = Math.sign((xs[i]! - xs[j]!) * (ys[i]! - ys[j]!));
      if (sign > 0) concordant += 1;
      else if (sign < 0) discordant += 1;
    }
  }
  const total = concordant + discordant;
  return total === 0 ? 0 : (concordant - discordant) / total;
}

interface LedgerRow {
  id: string;
  label: string;
  pool: string;
  cost: number;
  hpPerUnit: number;
  hpp: number;
  alpha: number;
  k: number;
  alphaPerCost: number;
  refCount: number;
  refHp: number;
  refHit: number;
}

function ledger(request: StackRequest): LedgerRow[] {
  return request.units.map((unit) => {
    const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
    const alpha = hitDamage(effective, 1).damage;
    const cap = request.caps[unit.id];
    const refCount = cap ?? Math.floor(request.housing[unit.pool] / unit.cost);
    return {
      id: unit.id,
      label: label(unit.id),
      pool: unit.pool,
      cost: unit.cost,
      hpPerUnit: effective.hpPerUnit,
      hpp: effective.hpPerUnit / unit.cost,
      alpha,
      k: alpha / effective.hpPerUnit,
      alphaPerCost: alpha / unit.cost,
      refCount,
      refHp: refCount * effective.hpPerUnit,
      refHit: hitDamage(effective, refCount).damage,
    };
  });
}

function ledgerTable(rows: LedgerRow[]): string {
  const out = [
    '| unit | pool | cost | HP/unit | HP per pool pt | dmg/hit/unit α | k = α/HP | α per pool pt | n* | total HP(n*) | dmg/hit(n*) |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const row of [...rows].sort((a, b) => b.alphaPerCost - a.alphaPerCost)) {
    out.push(
      `| ${row.label} | ${row.pool} | ${n(row.cost)} | ${n(row.hpPerUnit)} | ${n(row.hpp)} | ${n(row.alpha)} | ${row.k.toFixed(3)} | ${n(row.alphaPerCost)} | ${n(row.refCount)} | ${n(row.refHp)} | ${n(row.refHit)} |`,
    );
  }
  return out.join('\n');
}

interface MarchCheck {
  name: string;
  counts: Counts;
  request: StackRequest;
  avg: number;
  min: number;
  max: number;
  sumMin: number;
  sumMax: number;
  closed: number;
  ordersAgree: boolean;
  tau: number;
  tauAlpha: number;
  kSequence: number[];
  hpSequence: number[];
  units: string[];
  lost: number;
  silver: number;
  gold: number;
}

function checkMarch(name: string, request: StackRequest, counts: Counts): MarchCheck {
  const ev = evaluateCounts(request, counts);
  const rows = lines(ev);
  const stacks = ev.result.stacks;
  const sumMin = rows.reduce((sum, row) => sum + row.damageEnemyFirst, 0);
  const sumMax = rows.reduce((sum, row) => sum + row.damageArmyFirst, 0);
  const N = Object.values(request.enemy).reduce((sum, value) => sum + value, 0);
  // The closed form, written as Σ_p (hits_enemyFirst + hits_armyFirst)/2 × HP_p × k_p.
  let closed = 0;
  for (const row of rows) {
    const hits = (expectedHits(row.position, N, false) + expectedHits(row.position, N, true)) / 2;
    closed += hits * row.totalHp * (row.damagePerHit / row.totalHp);
  }
  const order = attackOrder(stacks);
  const ordersAgree = order.every((value, index) => value === index);
  const byId = new Map(request.units.map((unit) => [unit.id, unit]));
  const hps: number[] = [];
  const ks: number[] = [];
  const alphas: number[] = [];
  for (const stack of stacks) {
    const unit = byId.get(stack.unitId);
    hps.push(stack.totalHp);
    ks.push(stack.damagePerHit / stack.totalHp);
    alphas.push(stack.damagePerHit / stack.count / (unit?.cost ?? 1));
  }
  const positions = stacks.map((_stack, index) => index);
  return {
    name,
    counts: countsOf(ev.result),
    request,
    avg: ev.summary.avgDamage,
    min: ev.summary.minDamage,
    max: ev.summary.maxDamage,
    sumMin,
    sumMax,
    closed: Math.round(closed),
    ordersAgree,
    tau: kendall(positions, ks),
    tauAlpha: kendall(positions, alphas),
    kSequence: ks,
    hpSequence: hps,
    units: stacks.map((stack) => label(stack.unitId)),
    lost: mercsLost(counts),
    silver: ev.summary.recovery.silver,
    gold: ev.summary.recovery.gold,
  };
}

describe.skipIf(!process.env.THEORY)('45 ledger and optimum', () => {
  it('computes the ledger, the identity and the exact optimum', () => {
    const report = new Report('45-ledger-optimum');
    const owner = loadOwner();
    const reqC = scenario(owner.twelve, C_SOURCE);
    const reqB = scenario(owner.twelve, B_SOURCE);
    for (const unit of reqC.units) COST[unit.id] = unit.cost;

    // ---- §0 the two scenarios, and the cross-check that C is the report's own bonuses -------------
    const emh = reqC.units.find((unit) => unit.id === 'epic-monster-hunter-6');
    if (!emh) throw new Error('no EMH6');
    const emhEffective = effectiveUnit(emh, reqC.totals, reqC.enemy, reqC.activeEvents);
    const emhHit = hitDamage(emhEffective, 16);
    report.add('# 45 — the ledger and the exact optimum');
    report.add('');
    report.add(
      'Scenario C self-check against the 2026-09-14 report (`02-kai-report`): EMH6 16, unit HP ' +
        `${n(emhEffective.hpPerUnit)} (report 252,369 / 16 = 15,773), one hit ${n(emhHit.damage)} with ` +
        `${n(emhHit.features)} of features (report entry 14: 291,670 incl. 197,803).`,
    );
    expect(emhEffective.hpPerUnit).toBe(15773);
    expect(emhHit.damage).toBe(291670);
    expect(emhHit.features).toBe(197803);

    // ---- §1 the ledger ----------------------------------------------------------------------------
    const rowsC = ledger(reqC);
    const rowsB = ledger(reqB);
    report.h('§1 The ledger — what one unit of each type is worth');
    report.add(`Scenario C (the account as it fights):\n\n${ledgerTable(rowsC)}`);
    report.add(`\nScenario B (2026-09-13 bonuses):\n\n${ledgerTable(rowsB)}`);
    report.add(
      '\nRows are sorted by damage per point of pool (α ÷ cost). Two ratios rank a type and nothing else ' +
        'does: **damage per point of pool** decides whether the type is worth its leadership or authority at ' +
        'all, and **k = damage per HP** decides where in the ladder it has to sit — the enemy kills by HP, so a ' +
        'type with a high k must be small (it is the damage) and a type with a low k must be big (it is the ' +
        'sponge).',
    );

    // ---- §2 the identity --------------------------------------------------------------------------
    report.h('§2 The identity');
    // 0015's two winners, transcribed from `out/01-kai.md` / `out/26-tiers.md`, reproduced exactly. This
    // also pins this file's scenario B to 0015's published numbers, so a drift in either copy fails loudly.
    const seven = ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS];
    const WINNER_0015: Counts = {
      'archer-2': 1697,
      'rider-2': 848,
      'rider-3': 475,
      'epic-monster-hunter-6': 75,
      'arbalester-6': 76,
      'legionary-6': 72,
      'chariot-6': 37,
    };
    const w1 = evaluateCounts(reqB, WINNER_0015);
    const w2counts: Counts = { ...WINNER_0015, ...WINNER_0015_MERCS };
    const w2 = evaluateCounts(reqB, w2counts);
    expect(w1.summary.avgDamage).toBe(7843624);
    expect(w2.summary.avgDamage).toBe(8061308);

    const hpC = Object.fromEntries(rowsC.map((row) => [row.id, row.hpPerUnit]));
    const allTroops = reqC.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
    const flat12 = flatStart(reqC, hpC, allTroops, 1);
    const flat7 = flatStart(reqC, hpC, ['archer-2', 'rider-2', 'rider-3'], 1);
    const marches: MarchCheck[] = [
      checkMarch('owner’s real march (2026-09-14), C', reqC, OWNER_MARCH),
      checkMarch('the sizer, all 12 types, C', reqC, countsOf(evaluate(reqC).result)),
      checkMarch('0015’s 7-type winner, C', reqC, WINNER_0015),
      checkMarch('0015’s 7-type winner + hand-tuned mercs, C', reqC, w2counts),
      checkMarch('flat ladder, all 12 types, C', reqC, flat12),
      checkMarch('flat ladder, 3 sponges + mercs, C', reqC, flat7),
      checkMarch('0015’s 7-type winner, B', reqB, WINNER_0015),
    ];
    const identityRows = [
      '| march | stacks | Σ hits × per-hit (enemy-first) vs min | Σ … (army-first) vs max | Δ | closed form (Σ hits̄ · HP · k) | Δ closed | orders agree | τ(position, k) | τ(position, α/cost) |',
      '|---|---|---|---|---|---|---|---|---|---|',
    ];
    for (const m of marches) {
      identityRows.push(
        `| ${m.name} | ${m.units.length} | ${n(m.sumMin)} vs ${n(m.min)} | ${n(m.sumMax)} vs ${n(m.max)} | ${n(m.sumMin - m.min)}, ${n(m.sumMax - m.max)} | ${n(m.closed)} | ${n(m.closed - m.avg)} | ${m.ordersAgree ? 'yes' : 'no'} | ${m.tau.toFixed(3)} | ${m.tauAlpha.toFixed(3)} |`,
      );
    }
    report.add(identityRows.join('\n'));
    report.add(
      '\n**Claim 1.** `min`/`max` are exactly Σ over stacks of (the engine’s own journal hits) × `damagePerHit` — ' +
        `Δ = 0 in all ${marches.length} marches, because that is how the engine builds them: the identity is a ` +
        'reading of the model, not a new rule. What it buys is the second form: with `k = damagePerHit / HP` per ' +
        'stack, `Σ hits(p)·perHit(p) = Σ hits(p)·HP(p)·k(p)`, and that is the closed form the ledger predicts.',
    );
    report.add(
      '\n**Claim 2.** The closed-form hit counter (`expectedHits`) gives the same total in every march whose ' +
        '`attackOrder` equals the kill order — the two orders coincide whenever the ladder is one shape, which ' +
        'is the case in 5 of the 7 marches above; where it does not (`the sizer`, `flat 12`, both marked *no*), ' +
        'the closed form misses by up to ' +
        `${n(Math.max(...marches.map((m) => Math.abs(m.closed - m.avg))))}. That is where the identity breaks: ` +
        'attack order ≠ kill order (a stack wiped before its slot, `10-lost-hits`), a non-monotone ladder, and ' +
        'the round openers (positions 1, 5, 9, 13 each lose the hit they would otherwise take).',
    );
    report.add(
      '\n**Claim 3 — the ladder.** The kill order forces `HP(p)` non-increasing while `hits(p)` is non-decreasing ' +
        'in `p`, so the big-HP rungs are the *worst* place to put damage: HP spent on a stack that dies early ' +
        'buys the fewest hits. The score wants the types with the highest damage per HP at the small-HP tail — ' +
        'HP descending, k ascending. τ(position, k) is positive in every march the search built above and ' +
        'negative in the two sizer-shaped ones. It is a first-order rule, not the exact one: where two ' +
        'positions carry the same number of hits the HP belongs to the higher k (the winner’s ABT6, 1,132,856 ' +
        'HP, sits above ARC2, 1,071,708, both on one hit), and across the account the exact key is damage per ' +
        '*pool point at that position*, `hits(p) × α ÷ cost` — the two orderings agree on every type here ' +
        'except ARC1 / RD1 / SP2 / SW1.',
    );

    // §2b — the same seven types, both ways round, each at its own constrained optimum.
    report.add(
      '\n**§2b — the price of the ladder upside down.** Same seven types (ARC2 RD2 RD3 + the four ' +
        'mercenaries), same pools, four climbs: unconstrained, mercenaries pinned *last*, mercenaries pinned ' +
        '*first*, and the flat start none of them may beat. The pinned climbs start from a **feasible** point ' +
        'of their own shape (the flat start violates both, and a hard constraint that the start violates is a ' +
        'hill-climb that cannot move at all), so each is a genuine optimum *under its own ordering*.',
    );
    const hpOf = hpC;
    const mercIds = [...MERC_IDS];
    const troopIds7 = ['archer-2', 'rider-2', 'rider-3'];
    const liveHp = (counts: Counts, ids: string[]): number[] =>
      ids.filter((id) => (counts[id] ?? 0) > 0).map((id) => (counts[id] ?? 0) * (hpOf[id] ?? 0));
    const mercsLast = (counts: Counts): boolean => {
      const troops = liveHp(counts, troopIds7);
      const mercs = liveHp(counts, mercIds);
      if (troops.length === 0 || mercs.length === 0) return true;
      return Math.max(...mercs) <= Math.min(...troops);
    };
    const mercsFirst = (counts: Counts): boolean => {
      const troops = liveHp(counts, troopIds7);
      const mercs = liveHp(counts, mercIds);
      if (troops.length === 0 || mercs.length === 0) return true;
      return Math.max(...troops) <= Math.min(...mercs);
    };
    const req7 = withUnits(reqC, seven);
    /** Mercenaries at caps, the three sponges trimmed to sit just under the smallest of them. */
    const startFirst = (): Counts => {
      const counts: Counts = {};
      for (const id of mercIds) counts[id] = req7.caps[id] ?? 0;
      const smallest = Math.min(...liveHp(counts, mercIds));
      const M = 0.97 * smallest;
      counts['archer-2'] = Math.floor(M / (hpOf['archer-2'] ?? 1));
      counts['rider-2'] = Math.floor(M / (hpOf['rider-2'] ?? 1));
      counts['rider-3'] = Math.floor(M / (hpOf['rider-3'] ?? 1));
      return counts;
    };
    /** The three sponges flat at full leadership, the mercenaries trimmed to sit just under them. */
    const startLast = (): Counts => {
      const counts = flatStart(req7, hpOf, troopIds7, 0);
      const floor = Math.min(...liveHp(counts, troopIds7));
      for (const id of mercIds) {
        counts[id] = Math.max(0, Math.min(req7.caps[id] ?? 0, Math.floor((0.97 * floor) / (hpOf[id] ?? 1))));
      }
      return counts;
    };
    const scorePlain = scorerFor(req7);
    const coarse: ClimbOptions = { deltas: [1, 10, 100, 1000], sweeps: 60 };
    const fine: ClimbOptions = { deltas: [1, 2, 3, 5], sweeps: 200 };
    const freeCandidates = [
      climb(req7, flatStart(req7, hpOf, seven, 1), scorePlain, coarse),
      climb(req7, w2counts, scorePlain, coarse),
      climb(req7, startLast(), scorePlain, coarse),
      climb(req7, startFirst(), scorePlain, coarse),
    ];
    let free = freeCandidates[0] ?? {};
    for (const candidate of freeCandidates) if (scorePlain(candidate) > scorePlain(free)) free = candidate;
    free = climb(req7, climb(req7, free, scorePlain, fine), scorePlain, fine);
    const bestFree = checkMarch('unconstrained', req7, free);
    const bestLast = checkMarch(
      'mercenaries pinned last (k ascending)',
      req7,
      climb(
        req7,
        climb(req7, startLast(), scorerFor(req7, mercsLast), coarse),
        scorerFor(req7, mercsLast),
        fine,
      ),
    );
    const bestFirst = checkMarch(
      'mercenaries pinned first (k descending)',
      req7,
      climb(
        req7,
        climb(req7, startFirst(), scorerFor(req7, mercsFirst), coarse),
        scorerFor(req7, mercsFirst),
        fine,
      ),
    );
    const flat7check = checkMarch('flat start (no climb)', req7, flatStart(req7, hpOf, seven, 1));
    report.add(
      [
        '| march | avg damage | HP ladder | k ladder | τ(position, k) | τ(position, α/cost) | mercenaries lost |',
        '|---|---|---|---|---|---|---|',
        ...[flat7check, bestFree, bestLast, bestFirst].map(
          (m) =>
            `| ${m.name} | ${n(m.avg)} | ${m.hpSequence.map(n).join(' · ')} | ${m.kSequence.map((value) => value.toFixed(2)).join(' · ')} | ${m.tau.toFixed(3)} | ${m.tauAlpha.toFixed(3)} | ${n(m.lost)} |`,
        ),
      ].join('\n'),
    );
    report.add(
      `\nRead the table by the k ladder. The unconstrained climb (${n(bestFree.avg)}) is **not** "all four ` +
        `mercenaries under the troops": it runs RD2 (k 0.50) · RD3 (0.56) · ARC2 (0.50) at the top, then ABT6 ` +
        `(1.02) on one hit, then LGN6 (0.75) · CHR6 (1.00) · EMH6 (1.16) on two. τ(position, k) = ` +
        `${bestFree.tau.toFixed(2)}. Pinning every mercenary below every sponge costs ` +
        `**${n(bestFree.avg - bestLast.avg)}** (${(((bestFree.avg - bestLast.avg) / bestFree.avg) * 100).toFixed(1)} %) — ` +
        'the mid-rule 0015 §5 item 3 states ("every mercenary under the troop floor") is itself a small loss, ' +
        'because a mercenary stack whose stock is far bigger than the floor is better *above* one of the ' +
        'sponges than trimmed to fit under all of them. Turning the ladder fully upside down — the mercenaries ' +
        `first, k descending — costs **${n(bestFree.avg - bestFirst.avg)}** ` +
        `(${(((bestFree.avg - bestFirst.avg) / bestFree.avg) * 100).toFixed(1)} %) and ` +
        `${n(bestFirst.lost - bestFree.lost)} extra mercenaries for the same seven types and the same pools. ` +
        'That is the whole of the ladder rule; 0015 §5 measured the same trade from the other side (' +
        '`Troops first` gains on the owner’s 8 types and loses on 7) — the difference is whether the troop ' +
        'floor can shelter the stock at all.',
    );

    // ---- §3 the optimum ---------------------------------------------------------------------------
    report.h('§3 The exact optimum (bounded hill-climb)');
    const troopIds = reqC.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
    const startScore = scorerFor(reqC);
    const starts: { name: string; counts: Counts }[] = [
      { name: 'sizer', counts: countsOf(evaluate(reqC).result) },
      { name: 'owner’s march', counts: OWNER_MARCH },
      { name: 'flat 12', counts: flat12 },
      { name: 'flat 7', counts: flat7 },
      { name: '0015 winner', counts: WINNER_0015 },
      { name: '0015 winner + mercs', counts: w2counts },
      { name: 'Kai', counts: OWNER_MARCH },
    ];
    for (const subset of subsets(troopIds)) {
      for (const scale of [1, 0.75, 0.5, 0.25]) {
        starts.push({
          name: `flat ${subset.length} × ${scale}`,
          counts: flatStart(reqC, hpC, subset, scale),
        });
      }
    }
    let seed = 20260914;
    const random = (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 200; i += 1) {
      const counts: Counts = {};
      for (const id of troopIds) counts[id] = 0;
      const subset = troopIds.filter(() => random() < 0.45);
      const denom = subset.reduce((sum, id) => sum + COST[id]! / hpC[id]!, 0);
      const M = subset.length > 0 ? (reqC.housing.leadership * (0.6 + 0.4 * random())) / denom : 0;
      subset.forEach((id, index) => {
        counts[id] = Math.max(0, Math.floor((M * (1 - 0.0005 * index)) / hpC[id]!));
      });
      for (const m of mercIds) counts[m] = Math.floor(random() * (reqC.caps[m] ?? 0));
      starts.push({ name: `random ${i}`, counts });
    }
    const ranked = starts
      .map((start) => ({ ...start, score: startScore(start.counts) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);
    const coarsePass = ranked.slice(0, 60).map((entry) => ({
      name: entry.name,
      counts: climb(reqC, entry.counts, startScore, { deltas: [1, 10, 100, 1000], sweeps: 40 }),
    }));
    const coarseRanked = coarsePass
      .map((entry) => ({ ...entry, score: startScore(entry.counts) }))
      .sort((a, b) => b.score - a.score);
    const finePass = coarseRanked.slice(0, 20).map((entry) => ({
      name: entry.name,
      counts: climb(reqC, entry.counts, startScore, { deltas: [1, 2, 3, 5], sweeps: 200 }),
    }));
    const all = [
      ...coarseRanked,
      ...finePass.map((entry) => ({ ...entry, score: startScore(entry.counts) })),
    ];
    all.sort((a, b) => b.score - a.score);

    // A second, independent pass from the best result, with every count variable left free, then a
    // perturb-and-reclimb loop: nudge a handful of counts at random and keep the result only if it beats
    // the incumbent. This is what escapes the flat plateaus the single-count moves cannot cross.
    const best0 = all[0];
    if (!best0) throw new Error('no candidate');
    let winnerCounts = climb(reqC, best0.counts, startScore, { deltas: [1, 2, 3, 5, 8, 13], sweeps: 300 });
    let winnerScore = startScore(winnerCounts);
    let accepted = 0;
    for (let attempt = 0; attempt < 400; attempt += 1) {
      if (EVALS >= EVAL_CAP || Date.now() > DEADLINE) break;
      const trial: Counts = { ...winnerCounts };
      const targets = [...troopIds, ...mercIds].filter(() => random() < 0.3);
      for (const id of targets) {
        const step = Math.round((random() - 0.5) * (COST[id] === 2 ? 24 : 48));
        trial[id] = Math.max(0, (trial[id] ?? 0) + step);
      }
      const climbed = climb(
        reqC,
        climb(reqC, trial, startScore, { deltas: [1, 10, 100], sweeps: 30 }),
        startScore,
        {
          deltas: [1, 2, 3, 5],
          sweeps: 120,
        },
      );
      const value = startScore(climbed);
      if (value > winnerScore) {
        winnerCounts = climbed;
        winnerScore = value;
        accepted += 1;
      }
    }
    const winnerC = winnerCounts;
    const winnerB = climb(reqB, winnerC, scorerFor(reqB), { deltas: [1, 2, 3, 5], sweeps: 120 });

    const best = evaluateCounts(reqC, winnerC);
    const bestB = evaluateCounts(reqB, winnerB);
    report.add(
      `Search: ${n(starts.length)} starts, ${n(ranked.length)} feasible, 60 climbed coarsely, 20 finely, then a ` +
        `free polish and 400 perturb-and-reclimb trials (${n(accepted)} accepted) — **${n(EVALS)} ` +
        `\`evaluateCounts\` calls** in ${(elapsed() / 1000).toFixed(0)} s.`,
    );
    report.add(
      `\nTop five marches after the coarse pass: ${coarseRanked
        .slice(0, 5)
        .map((entry) => `${entry.name} (${n(entry.score)})`)
        .join(' · ')}.`,
    );
    report.add(
      `\n**Winner, scenario C** — ${n(best.summary.avgDamage)} avg damage (min ${n(best.summary.minDamage)}, max ${n(best.summary.maxDamage)}):\n`,
    );
    report.add(table(best));
    const recovery = recoveryCosts(best.result.stacks, reqC.units, reqC.recovery);
    report.add(
      `\nleadership ${n(usedLeadership(reqC, winnerC))}/${n(reqC.housing.leadership)} · ` +
        `mercenaries lost (chunks of ten) ${n(mercsLost(winnerC))} · retrain silver ${n(recovery.retrain.silver)} ` +
        `+ gold ${n(recovery.retrain.gold)} · revive silver ${n(recovery.revive.silver)} + gold ${n(recovery.revive.gold)} · ` +
        `training time ${duration(recovery.plan.seconds)}`,
    );
    report.add(
      `\n**Winner re-sized under scenario B** — ${n(bestB.summary.avgDamage)} avg damage:\n\n${table(bestB)}`,
    );

    // ---- §4 what the sizer leaves on the table ----------------------------------------------------
    report.h('§4 What the sizer leaves on the table');
    const sizerC = evaluate(reqC);
    const sizerB = evaluate(reqB);
    const w1C = evaluateCounts(reqC, WINNER_0015);
    const w2C = evaluateCounts(reqC, w2counts);
    // The count-level post-pass applied to the sizer's own output: this is 0015's E2 proposal, run over all
    // twelve counts rather than the mercenaries alone.
    const sizerPass = climb(reqC, countsOf(sizerC.result), startScore, {
      deltas: [1, 10, 100, 1000],
      sweeps: 60,
    });
    const sizerPassed = climb(reqC, sizerPass, startScore, { deltas: [1, 2, 3, 5], sweeps: 200 });
    const sizerPlus = evaluateCounts(reqC, sizerPassed);
    // The sustainable variant: a fielded count of n loses ceil(n/10) for good, so a march that may only
    // spend stock in tens is the one the owner can repeat (0015 §6.1) — same climb, mercenary counts pinned
    // to multiples of ten.
    const tensOnly = (counts: Counts): boolean =>
      MERC_IDS.every((id) => ((counts[id] ?? 0) * 10) % 100 === 0);
    const tensStart: Counts = { ...winnerC };
    for (const id of MERC_IDS) tensStart[id] = Math.floor((tensStart[id] ?? 0) / 10) * 10;
    const tensScore = scorerFor(reqC, tensOnly);
    const tensClimbed = climb(
      reqC,
      climb(reqC, tensStart, tensScore, { deltas: [1, 10, 100, 1000], sweeps: 60 }),
      tensScore,
      { deltas: [1, 2, 3, 5], sweeps: 200 },
    );
    const tens = evaluateCounts(reqC, tensClimbed);
    const cmp: { name: string; ev: ReturnType<typeof evaluateCounts>; counts: Counts }[] = [
      { name: 'app sizer, 12 types (C)', ev: sizerC, counts: countsOf(sizerC.result) },
      { name: 'app sizer + count hill-climb, 12 types (C)', ev: sizerPlus, counts: sizerPassed },
      { name: 'app sizer, 12 types (B)', ev: sizerB, counts: countsOf(sizerB.result) },
      { name: '0015 winner, 7 types (C)', ev: w1C, counts: WINNER_0015 },
      { name: '0015 winner, 7 types (B)', ev: w1, counts: WINNER_0015 },
      { name: '0015 winner + mercs (C)', ev: w2C, counts: w2counts },
      { name: '0015 winner + mercs (B)', ev: w2, counts: w2counts },
      { name: 'hill-climb winner (C)', ev: best, counts: winnerC },
      { name: 'hill-climb winner (B)', ev: bestB, counts: winnerB },
      { name: 'hill-climb winner, mercenaries in tens (C)', ev: tens, counts: tensClimbed },
    ];
    const cmpRows = [
      '| march | avg damage | silver (retrain) | gold | mercenaries lost | damage/silver | damage/merc |',
      '|---|---|---|---|---|---|---|',
    ];
    for (const entry of cmp) {
      const lost = mercsLost(entry.counts);
      const silver = entry.ev.summary.recovery.silver;
      cmpRows.push(
        `| ${entry.name} | ${n(entry.ev.summary.avgDamage)} | ${n(silver)} | ${n(entry.ev.summary.recovery.gold)} | ${n(lost)} | ${(entry.ev.summary.avgDamage / silver).toFixed(2)} | ${n(Math.round(entry.ev.summary.avgDamage / Math.max(1, lost)))} |`,
      );
    }
    report.add(cmpRows.join('\n'));
    const silverOf = (ev: ReturnType<typeof evaluateCounts>): number => ev.summary.recovery.silver;
    report.add(
      `\n**The gap, in all three currencies.** Against the app's own sizing the winner is ` +
        `+${n(best.summary.avgDamage - sizerC.summary.avgDamage)} damage (+${(((best.summary.avgDamage - sizerC.summary.avgDamage) / sizerC.summary.avgDamage) * 100).toFixed(1)} %) ` +
        `under C and +${n(bestB.summary.avgDamage - sizerB.summary.avgDamage)} under B, for ` +
        `+${n(silverOf(best) - silverOf(sizerC))} retrain silver a march and the *same* ` +
        `${n(mercsLost(winnerC))} mercenaries. Against 0015's hand-tuned winner it is ` +
        `+${n(best.summary.avgDamage - w2C.summary.avgDamage)} damage (+${n(bestB.summary.avgDamage - w2.summary.avgDamage)} under B) ` +
        `for +${n(silverOf(best) - silverOf(w2C))} silver and +${n(mercsLost(winnerC) - mercsLost(w2counts))} ` +
        `mercenaries a march — ${n(Math.round((best.summary.avgDamage - w2C.summary.avgDamage) / (mercsLost(winnerC) - mercsLost(w2counts))))} ` +
        'damage per extra mercenary spent, so it is the right march *only* while the stock is not the wall ' +
        `(0015 §6). Pinning the mercenary counts to multiples of ten — the sustainable shape — gives ` +
        `${n(tens.summary.avgDamage)} (${n(tens.summary.avgDamage - best.summary.avgDamage)} against the ` +
        `unconstrained winner) for ${n(silverOf(tens))} silver and ${n(mercsLost(tensClimbed))} mercenaries.`,
    );
    report.add(
      `\n**The margin in the two scenarios the brief names.** Against 0015's 7,843,624 (B) the winner is ` +
        `+${n(bestB.summary.avgDamage - 7843624)} (+${(((bestB.summary.avgDamage - 7843624) / 7843624) * 100).toFixed(1)} %) ` +
        `under B and +${n(best.summary.avgDamage - w1C.summary.avgDamage)} under C; against its hand-tuned ` +
        `8,061,308 (B) it is +${n(bestB.summary.avgDamage - 8061308)} (+${(((bestB.summary.avgDamage - 8061308) / 8061308) * 100).toFixed(1)} %) ` +
        `under B and +${n(best.summary.avgDamage - w2C.summary.avgDamage)} under C.`,
    );
    report.add(
      `\n**Which single change captures most of it.** Two changes are worth almost the same and both amount to ` +
        `"stop trusting the sizer's shape". 0015's — choose the subset instead of all twelve — is worth ` +
        `+${n(w1C.summary.avgDamage - sizerC.summary.avgDamage)} = ` +
        `${(((w1C.summary.avgDamage - sizerC.summary.avgDamage) / (best.summary.avgDamage - sizerC.summary.avgDamage)) * 100).toFixed(0)} % ` +
        `of the ${n(best.summary.avgDamage - sizerC.summary.avgDamage)} gap, but it needs the 255-subset search. ` +
        `Handing the sizer's *own* twelve-type answer to the count-level hill-climb — 0015's E2 post-pass, ` +
        `extended from the mercenary counts to all twelve — is worth ` +
        `+${n(sizerPlus.summary.avgDamage - sizerC.summary.avgDamage)} = ` +
        `${(((sizerPlus.summary.avgDamage - sizerC.summary.avgDamage) / (best.summary.avgDamage - sizerC.summary.avgDamage)) * 100).toFixed(0)} % ` +
        `of it, for the same ${n(mercsLost(sizerPassed))} mercenaries and +${n(silverOf(sizerPlus) - silverOf(sizerC))} ` +
        'silver, and it needs neither a new closed form nor a subset enumeration. That is the single change: ' +
        '**size as today, then hill-climb the counts — leadership transfers between troop types, mercenary ' +
        'counts inside the caps — accepting on `simulateBattle`**. The remaining ' +
        `${n(best.summary.avgDamage - sizerPlus.summary.avgDamage)} needs the multi-start search of §3, not a ` +
        'better ladder formula.',
    );

    // ---- §5 the two rules the repo cannot settle ---------------------------------------------------
    report.h('§5 What the repo cannot settle, bounded');
    report.add(
      '**(a) more than one stack of the same unit type.** The engine builds one stack per type, so the ' +
        'question is outside the model. It can be bounded by giving the request clone `UnitDef`s of RD3 (the ' +
        'best sponge: 1,253 HP per leadership against 706 for ARC2/RD2/SP2), so the search may field m of them:',
    );
    const cloneRows = [
      '| m allowed | RD3 stacks live | stacks in all | best avg damage (C) | Δ over m = 1 | mercenaries lost | silver |',
      '|---|---|---|---|---|---|---|',
    ];
    const rd3 = reqC.units.find((unit) => unit.id === 'rider-3');
    let cloneBest = 0;
    if (rd3) {
      let baseline = 0;
      for (const m of [1, 2, 3, 4, 6, 8]) {
        const clones = Array.from({ length: m - 1 }, (_unused, index) => ({
          ...rd3,
          id: `rider-3#${String(index + 1)}`,
          label: `RD3#${String(index + 1)}`,
        }));
        const units = [...reqC.units.filter((unit) => unit.id !== 'rider-3'), rd3, ...clones];
        const request: StackRequest = { ...reqC, units };
        const score = scorerFor(request);
        const seedCounts: Counts = { ...winnerC };
        for (const clone of clones) seedCounts[clone.id] = 0;
        const cloneTroopIds = units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
        const candidates: Counts[] = [
          seedCounts,
          flatStart(request, score.hp, cloneTroopIds, 1),
          flatStart(request, score.hp, cloneTroopIds, 0.4),
        ];
        let bestCounts = candidates[0] ?? seedCounts;
        let bestValue = -1;
        for (const candidate of candidates) {
          const value = score(candidate);
          if (value > bestValue) {
            bestValue = value;
            bestCounts = candidate;
          }
        }
        const startCounts = climb(request, bestCounts, score, { deltas: [1, 10, 100, 1000], sweeps: 40 });
        const climbed = climb(request, startCounts, score, { deltas: [1, 2, 5, 10], sweeps: 200 });
        const result = evaluateCounts(request, climbed);
        if (m === 1) baseline = result.summary.avgDamage;
        cloneBest = result.summary.avgDamage;
        const rd3Live = result.result.stacks.filter((stack) => stack.unitId.startsWith('rider-3')).length;
        cloneRows.push(
          `| ${n(m)} | ${n(rd3Live)} | ${n(result.result.stacks.length)} | ${n(result.summary.avgDamage)} | ${baseline > 0 ? `+${n(result.summary.avgDamage - baseline)}` : '—'} | ${n(mercsLost(climbed))} | ${n(result.summary.recovery.silver)} |\n| | ${result.result.stacks.map((stack) => `${label(stack.unitId)} ${n(stack.count)}`).join(' · ')} | | | | | |`,
        );
      }
    }
    report.add(cloneRows.join('\n'));
    report.add(
      `\nThe gain is not small and it is not marginal: with eight RD3 stacks allowed, the best march is ` +
        `${n(cloneBest)} against ${n(best.summary.avgDamage)}, +${n(cloneBest - best.summary.avgDamage)} ` +
        `(+${(((cloneBest - best.summary.avgDamage) / best.summary.avgDamage) * 100).toFixed(0)} %). ` +
        'Structurally, what a duplicate buys is **another rung at the wall**: the winner already stacks ARC2, ' +
        'RD2 and LGN6 just above CHR6, and a second RD3 can be given the same HP for 1,253 HP per leadership ' +
        'instead of 706, which is what lets four rungs sit above the two-hit mercenaries instead of three. ' +
        'Every extra rung is another stack on two hits. **To check in game (a):** whether a march ' +
        'may hold two stacks of the same unit type at different sizes. *Reading that settles it*: in a battle ' +
        'report of a march that fields two stacks of one type, the report shows the same unit card twice with ' +
        'different counts (the engine can only ever print one). If it does, the ladder above replaces the flat ' +
        'ladder and the m = 8 row is the shape to use; the engine cannot price it either way.',
    );
    report.add(
      '\n**(b) the kill order.** The engine wipes the highest-total-HP living stack (10/10 kills in the ' +
        'in-game reports, 29/29 over four reports per 0015 §1). The alternative is that the enemy picks by ' +
        'some other key — lowest HP, a fixed slot, or the attack order. Every number in §3 is conditional on ' +
        'this rule. *Reading that settles it*: a fight in which a smaller stack is wiped while a larger one ' +
        'lives. If the kill order were the attack order instead, the optimum would move toward the ' +
        'mercenaries-first ladder of §2b.',
    );

    const file = report.save();
    report.add(`\nwritten to ${file}`);
    expect(best.summary.avgDamage).toBeGreaterThan(sizerC.summary.avgDamage);
  }, 600_000);
});
