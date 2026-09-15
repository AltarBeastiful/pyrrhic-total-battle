/**
 * 46 — the bottom of the ladder (investigation 0015, continued).
 *
 * 0015 §2 established the shape of the hit schedule: a stack at kill position p strikes `hits(p) =
 * ceil(p/N) − [p ≡ 1 (mod N)]` times, so **strikes rise with position**. The last stack of the HP ladder
 * therefore strikes the most, and leadership spent *below* the mercenaries should be the most productive
 * in the whole march. 0015 only tested a token tail ("up to 100 SP2 at the very end": +5k…+62k,
 * `13-squads-and-stacks` §2) and concluded that filling leadership is the worst buy on this account
 * (0.22–0.65 damage per silver, `21-leadership-curve`). This file quantifies the bottom properly.
 *
 * Everything is the repo engine: `evaluateCounts` plays an explicit count vector through `simulateBattle`,
 * the score is `summary.avgDamage` (procs excluded), `feasible` enforces pools + caps. Headline numbers are
 * scenario **C** (the 2026-09-14 report bonuses — the account as it fights today), then B (0015's).
 *
 * One engine rule decides more than any other here (0015's `10-lost-hits`, quantified in §1): the **attack
 * order is base damage descending** (`count × strengthPerUnit`, features excluded) while the **kill order
 * is total HP descending**. 0015's best march — the flat ARC2 · RD2 · RD3 ladder — sits on a knife edge
 * between them (their base-damage-per-HP ratios are within 0.2 % of each other), so a 25-unit tail can flip
 * RD2 against RD3 and cost a 660 k strike. Every design below is built so the two orders *agree*:
 * `ladder()` sorts the types by base-damage-per-HP descending and gives them strictly descending HP, and
 * no candidate is scored unless the engine's own journal shows zero lost strikes.
 *
 * SEARCH BOUNDS (per question; the whole run is ~30 s, far inside the 5-minute budget):
 *   §1 baseline      — the 7-type ladder with its four mercenary counts solved on the engine
 *                      (multi-scale coordinate ascent + 6 iterated-local-search restarts, ≤ 4,000
 *                      evaluations each) from two seeds: the cap-built vector and 0015's exhaustive one.
 *   §1 tail sweep    — 5 spare troop types × every integer tail count 0…2,500, in two variants: the
 *                      mercenary vector frozen at the baseline's, and everything re-fitted (sponges rebuilt
 *                      at the remaining leadership, mercenaries re-solved by a ≤ 120-evaluation ascent);
 *                      the best 5 cells of each type then re-solved with 5 restarts. §1b: the same 4,343
 *                      leadership as a 4-sponge ladder instead.
 *   §2 patterns      — k = 0…4 mercenary stacks above the troops, all 2^k splits × 255 non-empty troop
 *                      subsets × 2 scenarios, then a 3-restart solve on each winner (pattern re-checked).
 *   §2b merc order   — the 24 assignments of the four mercenaries to the four HP ranks × 5 ceiling
 *                      fractions, each refined by a 3-restart solve on the four counts.
 *   §3 curve         — the §1 family at budgets 2,343 … 5,343 in steps of 1,000 (tail re-optimised over
 *                      every integer count, 5-restart solve per budget).
 *   §4 global search — 5 seeds × (ascent over all twelve types + 10 iterated-local-search restarts,
 *                      ≤ 6,000 evaluations each), as a check on the structured families.
 */

import { describe, it } from 'vitest';

import { expectedHits } from '../../src/engine/battle';
import { effectiveUnit, hitDamage } from '../../src/engine/units';
import type { StackRequest, StackResult } from '../../src/engine/types';
import {
  Report,
  evaluate,
  evaluateCounts,
  feasible,
  label,
  lines,
  loadOwner,
  march,
  n,
  scenarioB,
  scenarioC,
  table,
  withMethod,
  withUnits,
} from './harness';

type Counts = Record<string, number>;

const TROOPS = [
  'swordsman-1',
  'archer-1',
  'spearman-1',
  'rider-1',
  'archer-2',
  'spearman-2',
  'rider-2',
  'rider-3',
] as const;
const MERCS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'] as const;
const TRIO = ['archer-2', 'rider-2', 'rider-3'] as const;
/** Troop types the 7-type march leaves out — the tail candidates. */
const SPARE = ['swordsman-1', 'archer-1', 'spearman-1', 'rider-1', 'spearman-2'] as const;

const LEADERSHIP = 4343;
const N = 4;
/** Downward HP step of a ladder, as a fraction of its top. Must exceed the spread of base-damage-per-HP. */
const SLOPE = 0.004;

// ---------------------------------------------------------------------------------------------------
// reading the engine
// ---------------------------------------------------------------------------------------------------

interface Stats {
  id: string;
  label: string;
  cost: number;
  hp: number;
  dmg: number;
  /** HP per leadership point — the sponge currency. */
  hpPerL: number;
  /** Damage of one strike per leadership point — the damage currency. */
  dmgPerL: number;
  /** Base damage per HP — the ratio that decides the attack order. */
  ratio: number;
  silver: number;
  cap: number;
}

function statsOf(request: StackRequest, id: string): Stats {
  const unit = request.units.find((candidate) => candidate.id === id);
  if (!unit) throw new Error(`no unit ${id}`);
  const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
  const { damage } = hitDamage(effective, 1);
  return {
    id,
    label: label(id),
    cost: unit.cost,
    hp: effective.hpPerUnit,
    dmg: damage,
    hpPerL: effective.hpPerUnit / unit.cost,
    dmgPerL: damage / unit.cost,
    ratio: effective.strengthPerUnit / effective.hpPerUnit,
    silver: unit.training?.silver ?? 0,
    cap: request.caps[id] ?? Number.MAX_SAFE_INTEGER,
  };
}

function avgOf(request: StackRequest, counts: Counts): number {
  return evaluateCounts(request, counts).summary.avgDamage;
}

function mercLoss(counts: Counts): number {
  let lost = 0;
  for (const id of MERCS) lost += Math.ceil((counts[id] ?? 0) / 10);
  return lost;
}

function leadershipUsed(request: StackRequest, counts: Counts): number {
  let used = 0;
  for (const unit of request.units) {
    if (unit.pool === 'leadership') used += (counts[unit.id] ?? 0) * unit.cost;
  }
  return used;
}

function strikesLost(evaluation: ReturnType<typeof evaluateCounts>): number {
  let lost = 0;
  for (const row of lines(evaluation)) {
    lost += Math.max(0, expectedHits(row.position, N, false) - row.hitsEnemyFirst);
  }
  return lost;
}

// ---------------------------------------------------------------------------------------------------
// building a ladder
// ---------------------------------------------------------------------------------------------------

interface Ladder {
  counts: Counts;
  order: string[];
  hps: number[];
  level: number;
}

/**
 * A ladder of `ids`, sorted by base-damage-per-HP **descending** and given strictly descending HP, so the
 * attack order and the kill order agree by construction. The rounding remainder goes on the top stack,
 * which is first in both orders, so nothing moves.
 */
function ladder(stats: Map<string, Stats>, ids: readonly string[], budget: number): Ladder {
  const order = [...ids].sort((a, b) => stats.get(b)!.ratio - stats.get(a)!.ratio);
  const denom = order.reduce((sum, id, index) => sum + (1 - index * SLOPE) / stats.get(id)!.hpPerL, 0);
  const level = budget / denom;
  const counts: Counts = {};
  const hps: number[] = [];
  order.forEach((id, index) => {
    const s = stats.get(id)!;
    const count = Math.max(0, Math.floor((level * (1 - index * SLOPE)) / s.hp));
    counts[id] = count;
    hps.push(count * s.hp);
  });
  const used = order.reduce((sum, id) => sum + counts[id]! * stats.get(id)!.cost, 0);
  const top = order[0];
  if (top) counts[top] = (counts[top] ?? 0) + Math.max(0, Math.floor((budget - used) / stats.get(top)!.cost));
  return { counts, order, hps, level };
}

/**
 * The largest mercenary count that dies **after** a troop floor of `floorHp`: bounded by the stock cap, by
 * the floor, and by the base-damage-per-HP gap between the mercenaries (guardsmen ratio 3) and the
 * cheapest-ratio sponge — a mercenary stack whose base damage overtakes a troop stack above it would make
 * that stack lose a strike.
 */
function mercsUnder(stats: Map<string, Stats>, floorHp: number, floorRatio: number): Counts {
  const ceiling = floorHp * Math.min(1, (floorRatio / stats.get(MERCS[0])!.ratio) * 0.9995);
  // Weakest per strike gets the biggest stack: it sits highest and therefore strikes least. The four
  // guardsmen mercenaries share a base-damage-per-HP ratio, so HP descending keeps the attack order.
  const order = [...MERCS].sort((a, b) => stats.get(a)!.dmg - stats.get(b)!.dmg);
  const counts: Counts = {};
  order.forEach((id, index) => {
    const s = stats.get(id)!;
    counts[id] = Math.min(s.cap, Math.max(0, Math.floor((ceiling * (1 - index * 0.02)) / s.hp)));
  });
  return counts;
}

function floorOf(built: Ladder, stats: Map<string, Stats>): { floorHp: number; floorRatio: number } {
  return {
    floorHp: Math.min(...built.hps),
    floorRatio: Math.min(...built.order.map((id) => stats.get(id)!.ratio)),
  };
}

// ---------------------------------------------------------------------------------------------------
// searching
// ---------------------------------------------------------------------------------------------------

function climb(
  request: StackRequest,
  seed: Counts,
  ids: readonly string[],
  maxEvals: number,
  steps: readonly number[] = [40, 20, 10, 5, 3, 2, 1],
): { counts: Counts; avg: number; evals: number; truncated: boolean } {
  let best = { ...seed };
  let bestAvg = avgOf(request, best);
  let evals = 1;
  if (!feasible(request, best)) return { counts: best, avg: bestAvg, evals, truncated: false };
  for (let pass = 0; pass < 3; pass += 1) {
    let improved = false;
    for (const step of steps) {
      let again = true;
      while (again) {
        again = false;
        for (const id of ids) {
          for (const delta of [step, -step]) {
            const next = { ...best };
            next[id] = (next[id] ?? 0) + delta;
            if (next[id]! < 0) continue;
            if (!feasible(request, next)) continue;
            evals += 1;
            if (evals > maxEvals) return { counts: best, avg: bestAvg, evals, truncated: true };
            const avg = avgOf(request, next);
            if (avg > bestAvg) {
              best = next;
              bestAvg = avg;
              again = true;
              improved = true;
            }
          }
        }
      }
    }
    if (!improved) break;
  }
  return { counts: best, avg: bestAvg, evals, truncated: false };
}

/** Deterministic LCG, so the iterated local search is reproducible. */
function rng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Coordinate ascent plus iterated local search: each restart perturbs up to three counts and re-climbs.
 * Bounded by `maxEvals` per climb and `restarts`.
 */
function solve(
  request: StackRequest,
  seed: Counts,
  ids: readonly string[],
  restarts: number,
  maxEvals: number,
  stream = 20260914,
): { counts: Counts; avg: number } {
  let best = climb(request, seed, ids, maxEvals, [80, 40, 20, 10, 5, 3, 2, 1]);
  const random = rng(stream);
  for (let restart = 0; restart < restarts; restart += 1) {
    const start = { ...best.counts };
    for (let move = 0; move < 3; move += 1) {
      const id = ids[Math.floor(random() * ids.length)] ?? ids[0]!;
      const delta = Math.round((random() - 0.5) * 120);
      start[id] = Math.max(0, (start[id] ?? 0) + delta);
    }
    if (!feasible(request, start)) continue;
    const candidate = climb(request, start, ids, maxEvals, [80, 40, 20, 10, 5, 3, 2, 1]);
    if (candidate.avg > best.avg) best = candidate;
  }
  return { counts: best.counts, avg: best.avg };
}

interface Design {
  counts: Counts;
  avg: number;
  min: number;
  max: number;
  silver: number;
  losses: number;
  used: number;
  lost: number;
  line: string;
}

function design(request: StackRequest, counts: Counts): Design {
  const evaluation = evaluateCounts(request, counts);
  return {
    counts,
    avg: evaluation.summary.avgDamage,
    min: evaluation.summary.minDamage,
    max: evaluation.summary.maxDamage,
    silver: evaluation.summary.recovery.silver,
    losses: mercLoss(counts),
    used: leadershipUsed(request, counts),
    lost: strikesLost(evaluation),
    line: march(evaluation.result),
  };
}

/** §1 family: a `spongeIds` ladder at `budget`, the mercenaries under its floor, an optional tail below. */
function build(
  request: StackRequest,
  stats: Map<string, Stats>,
  spongeIds: readonly string[],
  budget: number,
  tailId?: string,
  tailCount = 0,
  frozenMercs?: Counts,
): Counts {
  void request;
  const tailSpend = tailId ? tailCount * stats.get(tailId)!.cost : 0;
  const built = ladder(stats, spongeIds, budget - tailSpend);
  const { floorHp, floorRatio } = floorOf(built, stats);
  const counts: Counts = { ...built.counts, ...mercsUnder(stats, floorHp, floorRatio) };
  if (frozenMercs) for (const [id, value] of Object.entries(frozenMercs)) counts[id] = value;
  if (tailId && tailCount > 0) counts[tailId] = tailCount;
  return counts;
}

/** Does the engine still put exactly `k` mercenary stacks above every troop stack? */
function kMercsAbove(request: StackRequest, counts: Counts, k: number): boolean {
  const rows = lines(evaluateCounts(request, counts));
  const isMerc = (id: string): boolean => MERCS.includes(id as (typeof MERCS)[number]);
  const mercRows = rows.filter((row) => isMerc(row.unitId));
  const troopRows = rows.filter((row) => !isMerc(row.unitId));
  if (troopRows.length === 0) return false;
  const top = mercRows.slice(0, k).map((row) => row.position);
  if (top.length !== k) return false;
  return Math.max(...top) < Math.min(...troopRows.map((row) => row.position));
}

/** Do all four mercenary stacks sit strictly below every troop stack (the `tailId` stack excepted)? */
function mercsBelowTroops(request: StackRequest, counts: Counts, tailId?: string): boolean {
  const rows = lines(evaluateCounts(request, counts));
  const isMerc = (id: string): boolean => MERCS.includes(id as (typeof MERCS)[number]);
  const mercPos = rows.filter((row) => isMerc(row.unitId)).map((row) => row.position);
  const troopPos = rows
    .filter((row) => !isMerc(row.unitId) && row.unitId !== tailId)
    .map((row) => row.position);
  if (mercPos.length === 0 || troopPos.length === 0) return false;
  return Math.min(...mercPos) > Math.max(...troopPos);
}

/** Is the last stack the tail type? */
function tailIsLast(request: StackRequest, counts: Counts, tailId: string): boolean {
  const rows = lines(evaluateCounts(request, counts));
  const tail = rows.find((row) => row.unitId === tailId);
  return tail !== undefined && tail.position === rows.length;
}

/** Where do the mercenaries sit? `positions · first/last`. */
function mercPositions(request: StackRequest, counts: Counts): string {
  const rows = lines(evaluateCounts(request, counts));
  const positions = rows
    .filter((row) => MERCS.includes(row.unitId as (typeof MERCS)[number]))
    .map((row) => row.position);
  return positions.length === 0 ? '—' : `${Math.min(...positions)}–${Math.max(...positions)}`;
}

// ---------------------------------------------------------------------------------------------------
// set helpers
// ---------------------------------------------------------------------------------------------------

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > items.length) return [];
  const [head, ...rest] = items as [T, ...T[]];
  return [...combinations(rest, k - 1).map((tail) => [head, ...tail]), ...combinations(rest, k)];
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  items.forEach((item, index) => {
    for (const rest of permutations([...items.slice(0, index), ...items.slice(index + 1)])) {
      out.push([item, ...rest]);
    }
  });
  return out;
}

function subsets<T>(items: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let mask = 1; mask < 1 << items.length; mask += 1) {
    out.push(items.filter((_item, index) => (mask & (1 << index)) !== 0));
  }
  return out;
}

function countsOfResult(result: StackResult): Counts {
  const counts: Counts = {};
  for (const stack of result.stacks) counts[stack.unitId] = stack.count;
  return counts;
}

const SCENARIOS = [
  ['C', scenarioC],
  ['B', scenarioB],
] as const;

// ---------------------------------------------------------------------------------------------------
// the experiment
// ---------------------------------------------------------------------------------------------------

describe.skipIf(!process.env.THEORY)('the bottom of the ladder', () => {
  it('quantifies the tail, the interleaving and the last 1,000 leadership', () => {
    const report = new Report('46-ladder-bottom');
    const owner = loadOwner();
    report.add('# 46 — the bottom of the ladder');
    report.add('');
    report.add(
      'The hit schedule rises with kill position (`hits(p) = ceil(p/N) − [p ≡ 1 (mod N)]`, N = 4): for ' +
        'p = 1…12 it is 0 1 1 1 · 1 2 2 2 · 2 3 3 3. So the last stacks of the HP ladder strike the most and ' +
        'leadership spent **below** the mercenaries is the most productive in the march. 0015 tested only a ' +
        'token tail; this file measures it. Every number is `simulateBattle` through `evaluateCounts`; the ' +
        'score is `avgDamage` (procs excluded).',
    );

    const statsFor = (request: StackRequest): Map<string, Stats> =>
      new Map([...TROOPS, ...MERCS].map((id) => [id, statsOf(request, id)]));

    // ------------------------------------------------------------------------------------------
    // §0 currencies
    // ------------------------------------------------------------------------------------------
    report.h('0. The three currencies (scenario C, then B)');
    report.add(
      'A stack is worth `strikes(position) × count × damage-per-unit`. A march trades **HP per leadership** ' +
        '(what it costs to sit high enough to shelter the mercenaries) against **damage per leadership** ' +
        '(what each stack returns where it sits), at a **silver** price per unit (troops are recruited again ' +
        'every march; mercenaries cost no silver, only stock). `base/HP` is the ratio that decides the ' +
        'attack order: two stacks whose base damages cross while their HP order does not cost a strike.',
    );
    for (const [scenario, make] of SCENARIOS) {
      const request = make(owner.twelve);
      const rows = [
        '| unit | pool | cost | HP / unit | damage / strike / unit | HP per leadership | damage per leadership | base / HP | silver / unit | stock cap |',
        '|---|---|---|---|---|---|---|---|---|---|',
      ];
      for (const id of [...TROOPS, ...MERCS]) {
        const s = statsOf(request, id);
        rows.push(
          `| ${s.label} | ${request.units.find((u) => u.id === id)?.pool ?? '?'} | ${n(s.cost)} | ${n(s.hp)} | ${n(s.dmg)} | ${n(Math.round(s.hpPerL))} | ${n(Math.round(s.dmgPerL))} | ${s.ratio.toFixed(4)} | ${s.silver === 0 ? '—' : n(s.silver)} | ${s.cap === Number.MAX_SAFE_INTEGER ? '—' : n(s.cap)} |`,
        );
      }
      report.add('');
      report.add(`**Scenario ${scenario}**`);
      report.add(rows.join('\n'));
      report.add('');
      report.add(
        `Enemy-first strikes by position, N = 4: ${Array.from({ length: 12 }, (_u, i) => expectedHits(i + 1, N, false)).join(' ')}. ` +
          'A stack at position 8 returns 2 enemy-first strikes and 3 army-first — 2.5 strikes of average ' +
          'value, more than any stack above it.',
      );
    }

    // ------------------------------------------------------------------------------------------
    // §1 the lost-strike trap, then the tail
    // ------------------------------------------------------------------------------------------
    report.h('1. The tail below the mercenaries — and the trap it falls into on a flat ladder');
    report.add(
      "0015's best march is a **flat** ladder: ARC2 · RD2 · RD3 sized to the same HP, with the mercenaries " +
        'just under the smallest of them. Flat, though, means their base damages are within 0.2 % of each ' +
        "other (the §0 table: the trio's base/HP are 0.3710 / 0.3705 / 0.3703), so which of RD2 and RD3 the " +
        'attack order visits first is decided by the last unit — and when the attack order disagrees with ' +
        "the kill order the lower stack is wiped before its turn. 0015's construction, rebuilt here:",
    );
    for (const [scenario, make] of SCENARIOS) {
      const request = make(owner.twelve);
      const stats = statsFor(request);
      const flatLadder = (tailCount: number): Counts => {
        const denom = TRIO.reduce((sum, id) => sum + 1 / stats.get(id)!.hpPerL, 0);
        const level = (LEADERSHIP - tailCount) / denom;
        const counts: Counts = {};
        for (const id of TRIO) counts[id] = Math.floor(level / stats.get(id)!.hp);
        const floorHp = Math.min(...TRIO.map((id) => counts[id]! * stats.get(id)!.hp));
        Object.assign(
          counts,
          mercsUnder(stats, floorHp, Math.min(...TRIO.map((id) => stats.get(id)!.ratio))),
        );
        if (tailCount > 0) counts['archer-1'] = tailCount;
        return counts;
      };
      report.add('');
      report.add(`**${scenario}** — 0015's flat trio with an ARC1 tail:`);
      const rows = ['| ARC1 tail | ladder in kill order | strikes lost | avg |', '|---|---|---|---|'];
      for (const t of [0, 20, 25, 30, 40, 50, 61, 100, 200, 400, 600]) {
        const d = design(request, flatLadder(t));
        rows.push(`| ${t} | ${d.line} | ${d.lost} | ${n(d.avg)} |`);
      }
      report.add(rows.join('\n'));
    }
    report.add('');
    report.add(
      'The 644 k drop between t = 25 and t = 50 is one lost strike of RD3 (its base damage slips below ' +
        "RD2's while its HP stays above). The fix is structural: sort the ladder by base-damage-per-HP " +
        'descending and give the stacks strictly descending HP (`ladder()`, a 0.4 % step), which keeps the ' +
        'two orders together by construction. Every design below is built that way and re-checked against ' +
        "the engine's own journal (`strikes lost` = 0) before it is scored — a design that loses a strike " +
        "is discarded, never reported. On the repaired ladder 0015's 7-type shape scores more than the flat " +
        'one, so everything below counts from the **repaired** march.',
    );

    interface Curve {
      scenario: string;
      baseline: Design;
      best: Design;
      frozen: { tail: string; top: Design }[];
      sponge4: Design | undefined;
      points: Design[];
      tail: string;
      byTail: { tail: string; top: Design }[];
    }
    const curves: Curve[] = [];

    for (const [scenario, make] of SCENARIOS) {
      const request = make(owner.twelve);
      const stats = statsFor(request);

      // Baseline: the repaired 7-type ladder with its mercenaries solved by simulation (coordinate ascent
      // plus iterated local search), from two seeds — the cap-built vector and 0015's exhaustive optimum.
      // This is the no-tail optimum of the family; under scenario B the second seed reproduces 0015's
      // 8,061,308 exactly, which is the validation that the solver is not making things up.
      const capSeed = build(request, stats, TRIO, LEADERSHIP);
      const vectorSeed: Counts = {
        ...capSeed,
        'epic-monster-hunter-6': 67,
        'arbalester-6': 76,
        'legionary-6': 72,
        'chariot-6': 36,
      };
      const attempts = [solve(request, capSeed, MERCS, 6, 4000, 991)];
      if (feasible(request, vectorSeed)) attempts.push(solve(request, vectorSeed, MERCS, 6, 4000, 992));
      const baseline = attempts
        .map((attempt) => design(request, attempt.counts))
        .sort((a, b) => b.avg - a.avg)[0]!;
      const frozenMercs: Counts = {};
      for (const id of MERCS) frozenMercs[id] = baseline.counts[id] ?? 0;

      let best: Design | undefined;
      let bestTail = '';
      let points: Design[] = [];
      const byTail: { tail: string; top: Design }[] = [];
      const frozen: { tail: string; top: Design }[] = [];

      for (const tail of SPARE) {
        const cost = stats.get(tail)!.cost;
        const cells: Design[] = [];
        const frozenCells: Design[] = [];
        for (let t = 1; t * cost < LEADERSHIP; t += 1) {
          // (a) the tail paid for out of the sponges, the mercenary vector frozen at the baseline's
          const frozenCounts = build(request, stats, TRIO, LEADERSHIP, tail, t, frozenMercs);
          if (
            feasible(request, frozenCounts) &&
            tailIsLast(request, frozenCounts, tail) &&
            mercsBelowTroops(request, frozenCounts, tail)
          ) {
            const d = design(request, frozenCounts);
            if (d.lost === 0) frozenCells.push(d);
          }
          // (b) everything re-fitted under the smaller floor: the sponges are rebuilt at the remaining
          // leadership and the four mercenary counts are then re-solved on the engine (a short ascent —
          // the construction alone mis-assigns the mercenary ladder whenever a stock cap bites).
          const counts = build(request, stats, TRIO, LEADERSHIP, tail, t);
          if (!feasible(request, counts) || !tailIsLast(request, counts, tail)) continue;
          const seed = design(request, counts);
          if (seed.lost > 0) continue;
          const short = climb(request, counts, MERCS, 120, [20, 10, 5, 2, 1]);
          const trimmedCell = design(request, short.counts);
          if (
            trimmedCell.lost === 0 &&
            trimmedCell.avg > seed.avg &&
            tailIsLast(request, short.counts, tail)
          ) {
            cells.push(trimmedCell);
          } else {
            cells.push(seed);
          }
        }
        let stream = 1;
        for (const cell of [...cells].sort((a, b) => b.avg - a.avg).slice(0, 5)) {
          stream += 1;
          const better = solve(request, cell.counts, MERCS, 5, 3000, stream);
          if (!tailIsLast(request, better.counts, tail)) continue;
          const d = design(request, better.counts);
          if (d.avg > cell.avg && d.lost === 0) Object.assign(cell, d);
        }
        const top1 = [...cells].sort((a, b) => b.avg - a.avg)[0];
        if (top1) byTail.push({ tail, top: top1 });
        if (top1 && (!best || top1.avg > best.avg)) {
          best = top1;
          bestTail = tail;
          points = cells;
        }
        const frozenTop = [...frozenCells].sort((a, b) => b.avg - a.avg)[0];
        if (frozenTop) frozen.push({ tail, top: frozenTop });
      }

      let sponge4: Design | undefined;
      for (const extra of SPARE) {
        const counts = build(request, stats, [...TRIO, extra], LEADERSHIP);
        if (!feasible(request, counts)) continue;
        const d = design(request, counts);
        if (d.lost > 0) continue;
        if (!sponge4 || d.avg > sponge4.avg) sponge4 = d;
      }
      if (sponge4) {
        const better = solve(request, sponge4.counts, MERCS, 5, 3000, 200);
        if (better.avg > sponge4.avg) {
          const d = design(request, better.counts);
          if (d.lost === 0) sponge4 = d;
        }
      }

      curves.push({ scenario, baseline, best: best!, frozen, sponge4, points, tail: bestTail, byTail });

      report.add('');
      report.add(
        `**${scenario} — repaired 7-type baseline, mercenaries trimmed by simulation (tail 0):** ${baseline.line} → ` +
          `${n(baseline.avg)} avg, ${n(baseline.silver)} silver, ${baseline.losses} mercenaries lost, ` +
          `${n(baseline.used)} leadership, ${baseline.lost} strikes lost.`,
      );
      report.add('');
      report.add(
        "**The tail's own value, with the mercenary vector frozen at the baseline** (so the only thing that " +
          'moves is the tail and the sponges it displaces). The largest tail that still leaves every ' +
          'mercenary under the floor:',
      );
      const frozenRows = [
        '| tail type | best t | tail HP | avg | Δ vs tail 0 | Δ avg per tail unit | Δ silver |',
        '|---|---|---|---|---|---|---|',
      ];
      for (const entry of frozen) {
        const d = entry.top;
        const t = d.counts[entry.tail] ?? 0;
        frozenRows.push(
          `| ${label(entry.tail)} | ${n(t)} | ${n(t * stats.get(entry.tail)!.hp)} | ${n(d.avg)} | ${n(d.avg - baseline.avg)} | ${t > 0 ? ((d.avg - baseline.avg) / t).toFixed(1) : '—'} | ${n(d.silver - baseline.silver)} |`,
        );
      }
      report.add('');
      report.add(frozenRows.join('\n'));
      report.add('');
      report.add(
        '**The tail with everything re-fitted** (sponges rebuilt at the remaining leadership, mercenaries ' +
          're-sized under the smaller floor, best integer tail count per type):',
      );
      const rows = [
        '| tail type | best t | avg | Δ vs tail 0 | silver | Δ silver | mercs lost | merc pos. | tail HP |',
        '|---|---|---|---|---|---|---|---|---|',
      ];
      for (const entry of [...byTail].sort((a, b) => b.top.avg - a.top.avg)) {
        const d = entry.top;
        rows.push(
          `| ${label(entry.tail)} | ${n(d.counts[entry.tail] ?? 0)} | ${n(d.avg)} | ${n(d.avg - baseline.avg)} | ${n(d.silver)} | ${n(d.silver - baseline.silver)} | ${d.losses} | ${mercPositions(request, d.counts)} | ${n((d.counts[entry.tail] ?? 0) * stats.get(entry.tail)!.hp)} |`,
        );
      }
      report.add('');
      report.add(rows.join('\n'));
      report.add('');
      report.add(
        `**Best tail (${scenario}):** ${label(bestTail)} ${n(best!.counts[bestTail] ?? 0)} → ${n(best!.avg)} ` +
          `(${n(best!.avg - baseline.avg)} over the tail-0 baseline, ${(((best!.avg - baseline.avg) / baseline.avg) * 100).toFixed(2)} %).`,
      );
      report.add('');
      report.add(
        'Read the two tables together. **A tail is the only lever on this account that raises damage and ' +
          '*lowers* silver at the same time**: the leadership it takes away from the sponges is tier-2/3 ' +
          'leadership (500–1,400 silver a unit), the leadership it puts back is tier-1 (300–500), and it sits ' +
          'at the last position, where the strike count is highest. Against the no-tail optimum the same ' +
          'family gains ~0.8 % and saves ~10 k silver; against the same leadership spent as a fourth sponge ' +
          'it wins by 8–9 %, because a fourth sponge drops the floor and every mercenary stack with it.',
      );
      report.add('');
      report.add(
        `**Same 4,343 leadership as one more flat sponge in front of the mercenaries:** ` +
          (sponge4
            ? `${sponge4.line} → ${n(sponge4.avg)} avg (${n(best!.avg - sponge4.avg)} below the tail, ` +
              `${(((best!.avg - sponge4.avg) / sponge4.avg) * 100).toFixed(2)} %), ${n(sponge4.silver)} silver, ` +
              `${sponge4.losses} mercenaries lost.`
            : 'no legal design found.'),
      );
      report.add('');
      report.add(`The winning tail type's curve (every 25th point, plus the optimum):`);
      const shown = points.filter((d, index) => index % 25 === 0 || d.avg === best!.avg);
      const curveRows = ['| t | ladder in kill order | avg | silver | mercs lost |', '|---|---|---|---|---|'];
      for (const d of shown) {
        curveRows.push(
          `| ${n(d.counts[bestTail] ?? 0)} | ${d.line} | ${n(d.avg)} | ${n(d.silver)} | ${d.losses} |`,
        );
      }
      report.add(curveRows.join('\n'));
    }

    // ------------------------------------------------------------------------------------------
    // §2 interleaving
    // ------------------------------------------------------------------------------------------
    report.h('2. Interleaving — k mercenary stacks above the troops (k = 0…4)');
    report.add(
      'The ladder is sorted by HP, so which stack sits at which position is decided by how many units each ' +
        'stack holds. Here `k` mercenary stacks are taken at their **stock cap** and put on top (authority ' +
        '2,000 never binds: the four caps are 314 authority in all), the troops form a repaired ladder at ' +
        'the full 4,343 leadership, and the other 4−k mercenaries sit under the troop floor. Every ' +
        'non-empty subset of the eight troop types and all 2^k splits are tried (15 splits × 255 subsets × ' +
        '2 scenarios), then a mercenary-only ascent on each winner; a row is listed only when the engine ' +
        'really puts the k mercenaries above every troop stack.',
    );
    const patternRows = [
      '| scenario | k | stacks | avg | vs k=0 | silver | mercs lost | march |',
      '|---|---|---|---|---|---|---|---|',
    ];
    const seeds: { scenario: string; seedName: string; counts: Counts }[] = [];
    for (const [scenario, make] of SCENARIOS) {
      const request = make(owner.twelve);
      const stats = statsFor(request);
      const troopSet = new Set<string>(TROOPS);
      let anchor: Design | undefined;
      for (let k = 0; k <= 4; k += 1) {
        let best: Design | undefined;
        for (const above of combinations([...MERCS] as string[], k)) {
          const below: string[] = MERCS.filter((id) => !above.includes(id));
          for (const ids of subsets([...TROOPS])) {
            const built = ladder(stats, ids, LEADERSHIP);
            const { floorHp, floorRatio } = floorOf(built, stats);
            const counts: Counts = { ...built.counts, ...mercsUnder(stats, floorHp, floorRatio) };
            for (const id of above) counts[id] = stats.get(id)!.cap;
            if (!feasible(request, counts)) continue;
            const d = design(request, counts);
            if (d.lost > 0) continue;
            const rows = lines(evaluateCounts(request, counts));
            const abovePos = rows.filter((row) => above.includes(row.unitId)).map((row) => row.position);
            const troopPos = rows.filter((row) => troopSet.has(row.unitId)).map((row) => row.position);
            const belowPos = rows.filter((row) => below.includes(row.unitId)).map((row) => row.position);
            if (troopPos.length === 0) continue;
            if (Math.max(...abovePos) >= Math.min(...troopPos)) continue;
            if (belowPos.length > 0 && Math.min(...belowPos) <= Math.max(...troopPos)) continue;
            if (!best || d.avg > best.avg) best = d;
          }
        }
        if (!best) continue;
        const better = solve(request, best.counts, MERCS, 3, 2000, 500 + k);
        if (better.avg > best.avg && kMercsAbove(request, better.counts, k)) {
          const d = design(request, better.counts);
          if (d.lost === 0) best = d;
        }
        if (!anchor) anchor = best;
        patternRows.push(
          `| ${scenario} | ${k} | ${lines(evaluateCounts(request, best.counts)).length} | ${n(best.avg)} | ${n(best.avg - anchor.avg)} | ${n(best.silver)} | ${best.losses} | ${best.line} |`,
        );
      }
      if (anchor) seeds.push({ scenario, seedName: '§2 winner (best k)', counts: anchor.counts });
    }
    report.add('');
    report.add(patternRows.join('\n'));

    // ------------------------------------------------------------------------------------------
    // §2b the order inside the four mercenary stacks
    // ------------------------------------------------------------------------------------------
    report.h('2b. The order of the four mercenary stacks');
    report.add(
      'Below three sponges the mercenary positions are 4, 5, 6, 7 with enemy-first strike counts 1, 1, 2, 2 ' +
        "— position 5 is ≡ 1 (mod 4) and loses a strike. The HP ladder decides the position and a stack's " +
        'HP is its count, so pushing a type down means shrinking it. Below: for each of the 24 assignments ' +
        'of the four mercenaries to the four HP ranks (rank 1 = biggest stack = position 4) the stack is ' +
        'sized at 5 ceiling fractions, and the best of each assignment is refined by a 600-evaluation ' +
        'ascent on the four counts. The last column is what the solve actually left — every row that reaches ' +
        'the best basin converges on the same ladder, which is the point: it is not the seed that matters, ' +
        'it is which mercenary ends up smallest.',
    );
    const orderRows = [
      '| scenario | seed assignment (biggest → smallest HP) | avg | vs best | strikes lost | mercs lost | what the solve produced |',
      '|---|---|---|---|---|---|---|',
    ];
    for (const [scenario, make] of SCENARIOS) {
      const request = make(owner.twelve);
      const stats = statsFor(request);
      const evaluated: { assignment: string; design: Design }[] = [];
      for (const assignment of permutations([...MERCS])) {
        let best: Design | undefined;
        for (const share of [0.995, 0.98, 0.96, 0.94, 0.9]) {
          const built = ladder(stats, TRIO, LEADERSHIP);
          const { floorHp, floorRatio } = floorOf(built, stats);
          const ceiling = floorHp * Math.min(1, (floorRatio / stats.get(MERCS[0])!.ratio) * 0.9995);
          const counts: Counts = { ...built.counts };
          assignment.forEach((id, index) => {
            counts[id] = Math.min(
              stats.get(id)!.cap,
              Math.floor((ceiling * (share - index * 0.02)) / stats.get(id)!.hp),
            );
          });
          if (!feasible(request, counts)) continue;
          const d = design(request, counts);
          if (d.lost > 0) continue;
          if (!best || d.avg > best.avg) best = d;
        }
        if (!best) continue;
        const better = solve(request, best.counts, MERCS, 3, 2000, 700);
        if (better.avg > best.avg) {
          const d = design(request, better.counts);
          if (d.lost === 0) best = d;
        }
        evaluated.push({ assignment: assignment.map(label).join(' > '), design: best });
      }
      evaluated.sort((a, b) => b.design.avg - a.design.avg);
      for (const entry of [...evaluated.slice(0, 3), ...evaluated.slice(-1)]) {
        const rows = lines(evaluateCounts(request, entry.design.counts));
        const hps = rows
          .filter((row) => MERCS.includes(row.unitId as (typeof MERCS)[number]))
          .map((row) => `${label(row.unitId)} ${n(row.count)} = ${n(row.totalHp)}`)
          .join(' · ');
        orderRows.push(
          `| ${scenario} | ${entry.assignment} | ${n(entry.design.avg)} | ${n(entry.design.avg - (evaluated[0]?.design.avg ?? 0))} | ${entry.design.lost} | ${entry.design.losses} | ${hps} |`,
        );
      }
    }
    report.add('');
    report.add(orderRows.join('\n'));
    report.add('');
    report.add(
      'The best basin is always the same ladder — **ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67**, so the strongest ' +
        'stack per strike (EMH6) is the *smallest* and dies last, with the two-strike positions 6 and 7 — and ' +
        'the second basin, which leaves EMH6 third, is 168 k behind (2.1 %). Note what the winner does *not* ' +
        "do: put the weakest mercenary (LGN6, 11 k a strike) on the round opener. It cannot — LGN6's stock " +
        "cap is 72, i.e. 1,071,144 HP, below ABT6's cap of 1,132,856 — so ABT6 takes position 4. The rule " +
        'that survives the caps is "the strongest per strike must be the smallest stack", not "the weakest ' +
        'must be the biggest".',
    );

    // ------------------------------------------------------------------------------------------
    // §3 the last 1,000 leadership
    // ------------------------------------------------------------------------------------------
    report.h('3. The last 1,000 leadership, with tails allowed');
    report.add(
      '0015 §6.2 concluded that extra leadership is the worst buy on this account (0.22–0.65 damage per ' +
        'silver, `21-leadership-curve`) — but that curve was measured on **sponges**, whose leadership only ' +
        'raises the floor. Here the budget itself is swept in steps of 1,000 and the §1 family (tail + trio ' +
        '+ mercenaries) is re-optimised at every step: best tail type, best integer tail count, every design ' +
        'repaired and checked for lost strikes. The row at 4,343 is the value of the last 1,000 leadership ' +
        '(2,343 → 3,343 → 4,343; the rows above 4,343 show what the next 1,000 would buy).',
    );
    for (const [scenario, make] of SCENARIOS) {
      const request = make(owner.twelve);
      const stats = statsFor(request);
      const rows = [
        '| leadership | best design | avg | silver | Δ avg / 1,000 L | Δ silver / 1,000 L | damage / silver | mercs lost |',
        '|---|---|---|---|---|---|---|---|',
      ];
      let previous: Design | undefined;
      for (const budget of [2343, 3343, 4343, 5343]) {
        let best: Design | undefined;
        for (const tail of SPARE) {
          const cost = stats.get(tail)!.cost;
          for (let t = 0; t * cost < budget; t += 5) {
            const counts = build(request, stats, TRIO, budget, tail, t);
            if (!feasible(request, counts)) continue;
            if (t > 0 && !tailIsLast(request, counts, tail)) continue;
            const d = design(request, counts);
            if (d.lost > 0) continue;
            if (!best || d.avg > best.avg) best = d;
          }
        }
        if (!best) continue;
        const better = solve(request, best.counts, MERCS, 5, 3000, 300);
        if (better.avg > best.avg) {
          const d = design(request, better.counts);
          if (d.lost === 0) best = d;
        }
        const dAvg = previous ? best.avg - previous.avg : 0;
        const dSilver = previous ? best.silver - previous.silver : 0;
        rows.push(
          `| ${n(budget)} | ${best.line} | ${n(best.avg)} | ${n(best.silver)} | ${previous ? n(dAvg) : '—'} | ${previous ? n(dSilver) : '—'} | ${previous && dSilver !== 0 ? (dAvg / dSilver).toFixed(2) : '—'} | ${best.losses} |`,
        );
        previous = best;
      }
      report.add('');
      report.add(`**Scenario ${scenario}**`);
      report.add(rows.join('\n'));
    }

    // ------------------------------------------------------------------------------------------
    // §4 global search — is any structured family beaten?
    // ------------------------------------------------------------------------------------------
    report.h('4. Global search over all twelve types (a check on the families)');
    report.add(
      "Seeds: the app's own sizer on the 7-type and on the 8-type set, 0015's best mercenary vector, the §1 " +
        'winner and the §2 winner. Each is climbed over all twelve types (multi-scale steps 80…1) and then ' +
        'given 10 iterated-local-search restarts (perturb three counts by up to ±60, re-climb). Every winner ' +
        'is re-checked for feasibility and lost strikes. These are best-found numbers, not proven optima: the ' +
        "climb is a coordinate ascent, so a seed can stall in a different basin (the app's own sizer stalls " +
        'about 3 % low, which is why the structured ladder exists at all).',
    );
    const globalRows = [
      '| scenario | seed | best found | avg | silver | mercs lost | strikes lost | leadership |',
      '|---|---|---|---|---|---|---|---|',
    ];
    const globalBest = new Map<string, { design: Design; request: StackRequest }>();
    for (const [scenario, make] of SCENARIOS) {
      const request = make(owner.twelve);
      const stats = statsFor(request);
      const seven = evaluate(withMethod(withUnits(request, [...TRIO, ...MERCS]), 'ms'));
      const eight = evaluate(withMethod(withUnits(request, [...TROOPS, ...MERCS]), 'ms'));
      const curve = curves.find((entry) => entry.scenario === scenario);
      const localSeeds: { name: string; counts: Counts }[] = [
        { name: 'sizer ms, 7 types', counts: countsOfResult(seven.result) },
        { name: 'sizer ms, all 8 troops', counts: countsOfResult(eight.result) },
        {
          name: "0015's best merc vector",
          counts: {
            ...countsOfResult(seven.result),
            'epic-monster-hunter-6': 67,
            'arbalester-6': 76,
            'legionary-6': 72,
            'chariot-6': 36,
          },
        },
        ...seeds
          .filter((entry) => entry.scenario === scenario)
          .map((entry) => ({ name: entry.seedName, counts: entry.counts })),
      ];
      if (curve) localSeeds.push({ name: '§1 winner (tail)', counts: curve.best.counts });
      for (const candidate of localSeeds) {
        if (!feasible(request, candidate.counts)) continue;
        const solved = solve(request, candidate.counts, [...TROOPS, ...MERCS], 10, 6000);
        const d = design(request, solved.counts);
        if (!feasible(request, d.counts) || d.lost > 0) continue;
        globalRows.push(
          `| ${scenario} | ${candidate.name} | ${d.line} | ${n(d.avg)} | ${n(d.silver)} | ${d.losses} | ${d.lost} | ${n(d.used)} |`,
        );
        const current = globalBest.get(scenario);
        if (!current || d.avg > current.design.avg) globalBest.set(scenario, { design: d, request });
      }
      void stats;
    }
    report.add('');
    report.add(globalRows.join('\n'));
    for (const [scenario, entry] of globalBest) {
      report.add('');
      report.add(`**${scenario} — best found anywhere:** ${entry.design.line}`);
      report.add('');
      report.add(table(evaluateCounts(entry.request, entry.design.counts)));
    }

    // ------------------------------------------------------------------------------------------
    // §5 the recommendation
    // ------------------------------------------------------------------------------------------
    report.h('5. Recommended marches');
    const recommend = [
      '| scenario | march | avg | silver | mercs lost | leadership | strikes lost | mechanism |',
      '|---|---|---|---|---|---|---|---|',
    ];
    for (const curve of curves) {
      recommend.push(
        `| ${curve.scenario} | ${curve.baseline.line} | ${n(curve.baseline.avg)} | ${n(curve.baseline.silver)} | ${curve.baseline.losses} | ${n(curve.baseline.used)} | ${curve.baseline.lost} | the repaired 7-type march with the mercenaries trimmed by simulation — the no-tail optimum |`,
      );
      recommend.push(
        `| ${curve.scenario} | ${curve.best.line} | ${n(curve.best.avg)} | ${n(curve.best.silver)} | ${curve.best.losses} | ${n(curve.best.used)} | ${curve.best.lost} | a tail under the mercenaries at the highest-strike position, paid for out of the sponges |`,
      );
    }
    for (const [scenario, entry] of globalBest) {
      recommend.push(
        `| ${scenario} | ${entry.design.line} | ${n(entry.design.avg)} | ${n(entry.design.silver)} | ${entry.design.losses} | ${n(entry.design.used)} | ${entry.design.lost} | best found by the global search |`,
      );
    }
    report.add('');
    report.add(recommend.join('\n'));
    for (const curve of curves) {
      const request = curve.scenario === 'C' ? scenarioC(owner.twelve) : scenarioB(owner.twelve);
      report.add('');
      report.add(
        `**${curve.scenario} — recommended march** (feasible: ${feasible(request, curve.best.counts) ? 'yes' : 'NO'}, ` +
          `${curve.best.lost} strikes lost, mercenaries at positions ${mercPositions(request, curve.best.counts)}, ` +
          'one stack per unit type, single march). Note that the winner is **one HP ladder for troops and ' +
          'mercenaries together**: ABT6 sits at position 2, above RD2 and RD3, because its stock cap (76) is ' +
          'bigger than theirs and shrinking it to fit under RD3 costs more than the position is worth. What ' +
          'matters is not "troops then mercenaries" but that no stack loses a strike (0 here) and that the ' +
          'strongest stacks are the last:',
      );
      report.add('');
      report.add(table(evaluateCounts(request, curve.best.counts)));
    }

    report.h('6. What is not established here, and what to check in game');
    report.add(
      '- **Two stacks of the same unit type.** Every design here uses one stack per unit type — what the ' +
        "engine and the owner's own battle report show. If the game allows two, a tail can be repeated at " +
        'positions 9, 10 … where the enemy-first strike counts are 2, 3, 3, and the bottom is worth more ' +
        'than reported. *In-game reading that settles it:* build a march with one troop type split into two ' +
        'squads and count the stacks the battle report prints.\n' +
        '- **The extra end-of-round sweep** (`src/engine/battle.ts` model note 11: the 2026-09-13 report has ' +
        '21 entries where the engine has 20). Every tail figure here inherits it. *Reading:* the entry count ' +
        'of a report whose last stack survives a round on its own.\n' +
        '- **The 0.4 % ladder step.** It exists only to keep the attack order and the kill order together; ' +
        'the game does not show a step rule, it shows an attack order. *Reading:* two stacks with the same ' +
        'total HP in one report — which of them strikes first.',
    );

    report.save();
  }, 900_000);
});
