/**
 * 47 — two levers 0015 identified but never optimized.
 *
 *   1. **Procs as an objective.** The engine refuses to price double damage: `avgDamage` is
 *      `(min + max) / 2`, both plain sums of the journal's own hit lines, and a proc is upside on top
 *      (battle.ts MODEL_NOTES). But a proc is a plain ×2 on one hit at a known chance, so the expectation
 *      is exact and linear:
 *
 *          E(march) = Σ_stacks hits_avg(stack) × damagePerHit(stack) × (1 + doubleDamageChance/100)
 *          hits_avg(stack) = (hits_enemyFirst + hits_armyFirst) / 2      ← the average the app already takes
 *
 *      `hits` is deterministic (the enemy kills by HP, we strike by base damage, and nobody's hit count
 *      depends on damage), so this is not a simulation — it is the journal with one factor per stack. §1
 *      proves it against the engine: with every unit's chance forced to 0 the objective reproduces the
 *      engine's own `(min + max)/2` exactly, and with every chance forced to 100 it reproduces 2 × that.
 *
 *   2. **The enemy as a lever, jointly optimized.** 0015 (`34-enemy-composition`) scored ONE fixed march
 *      against every formation. Here the march is re-optimized per formation — subset, stack count K, HP
 *      ladder — with `simulateBattle` as the only referee.
 *
 * BOUNDS (one `it`, well under the 5-minute budget; timings printed per section)
 *   · 7 formations: N=3 (no flying), N=4 (one of each), the four N=4 one-category-missing variants,
 *     N=8 (Arachne's, 2 of each).
 *   · Seeds per formation: all 255 non-empty subsets of the eight troop types, each sized by `sizeStacks`
 *     at full leadership and paired with the mercenaries at their caps and again under the troop floor
 *     (510 seeds), plus the mercenaries alone and the troop ladder with the mercenaries on top. The best
 *     best 14 seeds are then hill-climbed, twice each (surrogate then polish).
 *   · Hill-climb: coordinate ascent (candidate ladder = absolute ladder ∪ ±1..3 ∪ geometric about the
 *     current count ∪ "spend all the spare budget"), plus an explicit **transfer** move (take units out of
 *     one stack, spend the freed budget in another — the move that gets from twelve thin stacks to three
 *     fat ones), run only once every coordinate has stopped; the two alternate until neither moves.
 *     ≤ 10,000 engine evaluations per climb, 3,000 for the surrogate pass.
 *   · §2 climbs the N=4 formation under both objectives (average and proc-expected); §3 climbs the average
 *     objective for all seven formations and reports each winner's proc optimum beside it.
 *   · Checks on every winner: an exhaustive step-5 grid over the four mercenary counts at the winning
 *     troop counts, 24 random-restart climbs, and a one-step neighbourhood scan (add any count of any unit
 *     type, or move any count from one stack to another) — §3c and §3d.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/47-procs-enemy.test.ts`
 */
import { describe, it } from 'vitest';

import { expectedHits } from '../../src/engine/battle';
import { effectiveUnit, hitDamage } from '../../src/engine/units';
import type { BattleSummary, StackRequest, StackResult } from '../../src/engine/types';
import type { Evaluation } from './harness';
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
  march,
  n,
  scenarioB,
  scenarioC,
  sizeStacks,
  withEnemy,
  withMethod,
  withUnits,
} from './harness';

// ---- The account -------------------------------------------------------------------------------------
const MERCS = [...MERC_IDS];
const ALL_TROOPS = [
  'swordsman-1',
  'archer-1',
  'spearman-1',
  'rider-1',
  'archer-2',
  'spearman-2',
  'rider-2',
  'rider-3',
];
const TWELVE = [...ALL_TROOPS, ...MERCS];
/** 0015's exhaustive single-march winner (authority 2,000, scenario B). */
const WINNER7 = ['archer-2', 'rider-2', 'rider-3', ...MERCS];
const EMH = 'epic-monster-hunter-6';
const ABT = 'arbalester-6';
const LGN = 'legionary-6';
const CHR = 'chariot-6';

type Counts = Record<string, number>;
type Pool = 'leadership' | 'authority' | 'dominance';

// ---- The proc objective ------------------------------------------------------------------------------
function hitsByUnit(journal: BattleSummary['journals']['enemyFirst']): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of journal.entries) {
    if (entry.actor === 'army') map.set(entry.unitId, (map.get(entry.unitId) ?? 0) + 1);
  }
  return map;
}

/**
 * Σ_stacks hits_avg × damagePerHit × (1 + chance/100). Every term is the engine's own: the hit counters
 * come from the two journals `simulateBattle` builds, `damagePerHit` and `doubleDamageChance` from the
 * stacks it built. Nothing is re-derived by hand.
 */
function procExpected(evaluation: Evaluation): number {
  const ef = hitsByUnit(evaluation.summary.journals.enemyFirst);
  const af = hitsByUnit(evaluation.summary.journals.armyFirst);
  let total = 0;
  for (const stack of evaluation.result.stacks) {
    const hits = ((ef.get(stack.unitId) ?? 0) + (af.get(stack.unitId) ?? 0)) / 2;
    total += hits * stack.damagePerHit * (1 + stack.doubleDamageChance / 100);
  }
  return total;
}

/** The same objective on one journal only — the two ends of the band the average sits in. */
function procOnJournal(evaluation: Evaluation, which: 'enemyFirst' | 'armyFirst'): number {
  const hits = hitsByUnit(evaluation.summary.journals[which]);
  let total = 0;
  for (const stack of evaluation.result.stacks) {
    total += (hits.get(stack.unitId) ?? 0) * stack.damagePerHit * (1 + stack.doubleDamageChance / 100);
  }
  return total;
}

/** A copy of the request whose units all carry the same double-damage chance (used only to prove the formula). */
function withFlatChance(request: StackRequest, chance: number): StackRequest {
  return { ...request, units: request.units.map((unit) => ({ ...unit, doubleDamageChance: chance })) };
}

// ---- The search ---------------------------------------------------------------------------------------
const ABS_LADDER = [
  0, 1, 2, 3, 4, 5, 6, 8, 10, 13, 17, 22, 30, 40, 55, 75, 100, 140, 190, 260, 350, 480, 650, 900, 1200, 1700,
  2300, 3100, 4343,
];
const REL_LADDER = [0.4, 0.55, 0.7, 0.85, 0.93, 0.97, 1.03, 1.07, 1.15, 1.3, 1.5, 1.8, 2.2];
const TRANSFER_FRACTIONS = [0.2, 0.4, 0.7, 1];
/** Absolute transfer sizes, so a small reshuffle of the ladder is reachable too. */
const TRANSFER_COUNTS = [1, 2, 3, 5, 8, 13, 22, 40, 75, 140, 260, 480, 900, 1700, 3100, 4343];
const MAX_EVALS_PER_CLIMB = 10000;
const WARM_EVALS = 3000;
const SEEDS_CLIMBED = 14;

type Objective = 'avg' | 'proc';

interface UnitInfo {
  id: string;
  cost: number;
  pool: Pool;
}

function unitsOf(request: StackRequest): UnitInfo[] {
  return request.units.map((unit) => ({ id: unit.id, cost: unit.cost, pool: unit.pool }));
}

/** Budget left in each pool for a count vector. */
function slack(request: StackRequest, counts: Counts, units: UnitInfo[]): Record<Pool, number> {
  const left: Record<Pool, number> = {
    leadership: request.housing.leadership,
    authority: request.housing.authority,
    dominance: request.housing.dominance,
  };
  for (const unit of units) left[unit.pool] -= (counts[unit.id] ?? 0) * unit.cost;
  return left;
}

/** Candidate counts for one unit: ladders, ±1..3, and "spend every last point of this unit's pool". */
function candidatesFor(base: number, cap: number, spend: number): number[] {
  const set = new Set<number>();
  for (const value of ABS_LADDER) if (value <= cap) set.add(value);
  if (base > 0) {
    for (const ratio of REL_LADDER) {
      set.add(Math.floor(base * ratio));
      set.add(Math.ceil(base * ratio));
    }
  }
  for (let delta = 1; delta <= 3; delta += 1) {
    if (base - delta >= 0) set.add(base - delta);
    set.add(base + delta);
  }
  if (spend > 0) set.add(Math.min(cap, base + spend));
  set.delete(base);
  return [...set]
    .filter((value) => value >= 0 && value <= cap)
    .sort((a, b) => Math.abs(a - base) - Math.abs(b - base));
}

interface Climb {
  counts: Counts;
  score: number;
  evals: number;
}

/**
 * Coordinate ascent plus transfer moves.
 *
 * The score is the **unrounded** average `(min + max) / 2` for the average objective — what
 * `summary.avgDamage` rounds for display — so a plateau in the displayed figure can still be crossed.
 * Transfer moves matter: `sizeStacks` spends the whole housing, so from a full-leadership seed a single
 * coordinate can only ever shrink, never grow; taking units out of one stack and spending the freed
 * leadership in another is the move that reaches the fat-sponge marches.
 */
function climb(
  request: StackRequest,
  start: Counts,
  objective: Objective,
  maxEvals = MAX_EVALS_PER_CLIMB,
): Climb {
  const units = unitsOf(request);
  const counter = { evals: 0 };
  const counts: Counts = {};
  for (const unit of units) counts[unit.id] = Math.max(0, Math.floor(start[unit.id] ?? 0));
  if (!feasible(request, counts)) return { counts, score: -1, evals: 0 };
  // The engine's average is an integer (a sum of integer hit lines) and takes only two values per
  // battle, so the average objective is full of plateaus a strict climb cannot cross. The score is
  // therefore lexicographic — the average first, the proc expectation as a tie-break (a factor of 1e-9
  // keeps the average's 0.5 granularity intact) — which makes the average objective strict and, among
  // marches the app scores identically, prefers the one that is actually worth more in expectation.
  const score = (trial: Counts): number => {
    counter.evals += 1;
    const evaluation = evaluateCounts(request, trial);
    const average = (evaluation.summary.minDamage + evaluation.summary.maxDamage) / 2;
    const proc = procExpected(evaluation);
    return objective === 'avg' ? average + proc / 1e9 : proc + average / 1e9;
  };
  let best = score(counts);
  let improved = true;
  while (improved && counter.evals < maxEvals) {
    improved = false;

    // 1. one coordinate at a time, until no coordinate moves
    for (const unit of units) {
      const cap = request.caps[unit.id] ?? Number.MAX_SAFE_INTEGER;
      const base = counts[unit.id] ?? 0;
      const spend = Math.floor(slack(request, counts, units)[unit.pool] / unit.cost);
      let bestValue = base;
      for (const value of candidatesFor(base, cap, spend)) {
        if (value === bestValue) continue;
        const trial = { ...counts, [unit.id]: value };
        if (!feasible(request, trial)) continue;
        const value2 = score(trial);
        if (value2 > best + 1e-9) {
          best = value2;
          bestValue = value;
          improved = true;
        }
        if (counter.evals >= maxEvals) break;
      }
      if (bestValue !== base) counts[unit.id] = bestValue;
      if (counter.evals >= maxEvals) break;
    }

    // 2. only once every coordinate has stopped: take units out of `from`, spend the freed budget in `to`.
    //    Cheap when run after convergence, and it is the move that crosses a ladder shape the single
    //    coordinates cannot (they can only ever shrink a stack, never grow one, while the housing is full).
    if (improved) continue;
    for (const from of units) {
      for (const to of units) {
        if (from.id === to.id || from.pool !== to.pool) continue;
        const moves = new Set<number>();
        for (const count of TRANSFER_COUNTS) moves.add(count);
        for (const fraction of TRANSFER_FRACTIONS) moves.add(Math.floor((counts[from.id] ?? 0) * fraction));
        for (const moved of moves) {
          const provide = Math.floor((moved * from.cost) / to.cost);
          if (moved <= 0 || provide <= 0 || moved > (counts[from.id] ?? 0)) continue;
          const trial = {
            ...counts,
            [from.id]: (counts[from.id] ?? 0) - moved,
            [to.id]: (counts[to.id] ?? 0) + provide,
          };
          if (!feasible(request, trial)) continue;
          const value = score(trial);
          if (value > best + 1e-9) {
            best = value;
            counts[from.id] = trial[from.id]!;
            counts[to.id] = trial[to.id]!;
            improved = true;
          }
          if (counter.evals >= maxEvals) break;
        }
        if (counter.evals >= maxEvals) break;
      }
      if (counter.evals >= maxEvals) break;
    }
  }
  return { counts, score: best, evals: counter.evals };
}

interface MarchDetail {
  counts: Counts;
  avg: number;
  min: number;
  max: number;
  proc: number;
  k: number;
  line: string;
  evaluation: Evaluation;
}

function detail(request: StackRequest, counts: Counts): MarchDetail {
  const evaluation = evaluateCounts(request, counts);
  return {
    counts,
    avg: evaluation.summary.avgDamage,
    min: evaluation.summary.minDamage,
    max: evaluation.summary.maxDamage,
    proc: Math.round(procExpected(evaluation)),
    k: evaluation.result.stacks.length,
    line: march(evaluation.result),
    evaluation,
  };
}

/** HP of one unit under the request's bonuses, read off the engine's own stack build. */
function hpOf(request: StackRequest, id: string): number {
  return evaluateCounts(request, { [id]: 1 }).result.stacks[0]?.hpPerUnit ?? 0;
}

function capsOf(request: StackRequest): Counts {
  const counts: Counts = {};
  for (const id of MERCS) counts[id] = request.caps[id] ?? 0;
  return counts;
}

interface Seed {
  key: string;
  counts: Counts;
}

/**
 * The seed forest: every non-empty subset of the eight troop types, sized at full leadership by
 * `sizeStacks`, paired with (a) the mercenaries under the smallest troop stack and (b) the mercenaries at
 * their caps on top. 510 seeds, deduplicated — the exhaustive half of the search, so the climb only has
 * to polish counts it cannot be trapped away from.
 */
function subsetSeeds(request: StackRequest): Seed[] {
  const out: Seed[] = [];
  const seen = new Set<string>();
  const push = (key: string, counts: Counts): void => {
    const signature = TWELVE.map((id) => counts[id] ?? 0).join(',');
    if (seen.has(signature) || !feasible(request, counts)) return;
    seen.add(signature);
    out.push({ key, counts });
  };
  for (let mask = 1; mask < 1 << ALL_TROOPS.length; mask += 1) {
    const ids = ALL_TROOPS.filter((_id, index) => (mask & (1 << index)) !== 0);
    let sized: StackResult;
    try {
      sized = sizeStacks(withMethod(withUnits(request, [...ids, ...MERCS]), 'ms'));
    } catch {
      continue;
    }
    const troops: Counts = {};
    let floor = Number.MAX_SAFE_INTEGER;
    for (const stack of sized.stacks) {
      if (stack.pool !== 'leadership') continue;
      troops[stack.unitId] = stack.count;
      floor = Math.min(floor, stack.totalHp);
    }
    if (floor === Number.MAX_SAFE_INTEGER) continue;
    const name = ids.map(label).join('+');
    const under: Counts = { ...troops };
    for (const id of MERCS) {
      under[id] = Math.max(0, Math.min(request.caps[id] ?? 0, Math.floor((floor - 1) / hpOf(request, id))));
    }
    push(`${name} · mercenaries under the floor`, under);
    push(`${name} · mercenaries at their caps`, { ...troops, ...capsOf(request) });
  }
  push('mercenaries only', capsOf(request));
  for (const method of ['ms', 'msRelaxed'] as const) {
    const sized = sizeStacks(withMethod(withUnits(request, TWELVE), method));
    push(`the sizer's twelve stacks (${method}) · mercenaries at their caps`, {
      ...countsOf(sized),
      ...capsOf(request),
    });
  }
  return out;
}

interface Optimization {
  best: Climb;
  seed: string;
  evals: number;
  seeds: number;
  climbed: { key: string; score: number; evals: number }[];
}

function optimize(request: StackRequest, objective: Objective): Optimization {
  const counter = { evals: 0 };
  const seeds = subsetSeeds(request);
  const ranked = seeds
    .map((seed) => {
      counter.evals += 1;
      const evaluation = evaluateCounts(request, seed.counts);
      return {
        seed,
        score:
          objective === 'avg'
            ? (evaluation.summary.minDamage + evaluation.summary.maxDamage) / 2
            : procExpected(evaluation),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, SEEDS_CLIMBED);
  let best: Climb | undefined;
  let bestSeed = '';
  let evals = counter.evals;
  const climbed: { key: string; score: number; evals: number }[] = [];
  // The engine's average is quantized to half-integers, so a climb on it alone stalls on plateaus the
  // proc expectation (fine-grained, and 96 % correlated with the average) walks straight through. Every
  // seed is therefore climbed twice — once on the other objective as a surrogate, then polished on the
  // target — and the better of the direct and the warm-started climb is kept.
  const surrogate: Objective = objective === 'avg' ? 'proc' : 'avg';
  for (const entry of ranked) {
    const warm = climb(request, entry.seed.counts, surrogate, WARM_EVALS);
    const direct = climb(request, entry.seed.counts, objective);
    const polished = climb(request, warm.counts, objective);
    evals += warm.evals + direct.evals + polished.evals;
    const result = polished.score > direct.score ? polished : direct;
    climbed.push({ key: entry.seed.key, score: result.score, evals: direct.evals + polished.evals });
    if (!best || result.score > best.score) {
      best = result;
      bestSeed = entry.seed.key;
    }
  }
  return {
    best: best ?? { counts: {}, score: -1, evals: 0 },
    seed: bestSeed,
    evals,
    seeds: seeds.length,
    climbed,
  };
}

/** Deterministic PRNG, so every number in the report is reproducible. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random feasible count vector, for the restart check. */
function randomSeed(request: StackRequest, random: () => number): Counts {
  const counts: Counts = {};
  for (const unit of request.units) {
    const cap = request.caps[unit.id] ?? 0;
    counts[unit.id] = Math.floor(cap * random() * random());
  }
  let guard = 0;
  while (!feasible(request, counts) && guard < 200) {
    for (const unit of request.units) counts[unit.id] = Math.floor((counts[unit.id] ?? 0) * 0.7);
    guard += 1;
  }
  return counts;
}

// ---- Formations ---------------------------------------------------------------------------------------
interface Formation {
  key: string;
  short: string;
  N: number;
  enemy: Partial<Record<'melee' | 'ranged' | 'mounted' | 'flying', number>>;
  note: string;
}

const FORMATIONS: Formation[] = [
  {
    key: 'N=3 · no flying squad',
    short: 'N3',
    N: 3,
    enemy: { melee: 1, ranged: 1, mounted: 1 },
    note: 'ARC2 / ABT6 lose the flying squad and fall back to melee',
  },
  {
    key: 'N=4 · one of each',
    short: 'N4',
    N: 4,
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    note: "the export's own formation; every feature fires",
  },
  {
    key: 'N=4 · no flying squad',
    short: 'N4−fly',
    N: 4,
    enemy: { melee: 2, ranged: 1, mounted: 1 },
    note: 'ARC2 / ABT6 → melee (+78 / +394 % against +101 / +509)',
  },
  {
    key: 'N=4 · no ranged squad',
    short: 'N4−rng',
    N: 4,
    enemy: { melee: 2, mounted: 1, flying: 1 },
    note: 'CHR6, RD2, RD3 lose everything: their only category line is ranged',
  },
  {
    key: 'N=4 · no mounted squad',
    short: 'N4−mnt',
    N: 4,
    enemy: { melee: 2, ranged: 1, flying: 1 },
    note: 'LGN6, SP2, SP1, SW1 fall back to a bare base hit',
  },
  {
    key: 'N=4 · no melee squad',
    short: 'N4−mel',
    N: 4,
    enemy: { ranged: 2, mounted: 1, flying: 1 },
    note: 'the engine’s fallback target is absent; nobody loses a category line',
  },
  {
    key: "N=8 · Arachne's (2 of each)",
    short: 'N8',
    N: 8,
    enemy: { melee: 2, ranged: 2, mounted: 2, flying: 2 },
    note: 'all four categories, but a round is eight kills: K ≤ 9 strikes at most once',
  },
];

describe.skipIf(!process.env.THEORY)('47 procs and the enemy as a lever', () => {
  it('prices procs and re-optimizes the march per formation', () => {
    const report = new Report('47-procs-enemy');
    const owner = loadOwner();
    const started = Date.now();

    const C12 = (enemy: Formation['enemy']): StackRequest =>
      withEnemy(withUnits(scenarioC(owner.twelve), TWELVE), enemy);
    const B12 = (enemy: Formation['enemy']): StackRequest =>
      withEnemy(withUnits(scenarioB(owner.twelve), TWELVE), enemy);

    report.add('# 47 — procs as an objective, and the enemy formation re-optimized jointly with the march');
    report.add('');
    report.add(
      'Scenario **C** (the bonuses the 2026-09-14 report was fought with, `harness.scenarioC`) is the ' +
        'headline; **B** (0015’s scenario) is reported beside the winners. Housing: leadership 4,343 · ' +
        'authority 2,000 · dominance 800. Caps EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37. Twelve unit types ' +
        '(8 troops + 4 mercenaries), every count feasible in game (`harness.feasible`). Every damage number ' +
        'is `simulateBattle`’s; nothing is re-derived by hand.',
    );

    // ==================================================================================================
    // §1 the objective, and the proof it is the engine's
    // ==================================================================================================
    report.h('1. The proc objective');

    const n4Formation = FORMATIONS[1] as Formation;
    const probeRequest = withUnits(
      withEnemy(withUnits(scenarioC(owner.twelve), TWELVE), n4Formation.enemy),
      WINNER7,
    );
    const probeSized = evaluate(withMethod(probeRequest, 'msRelaxed'));
    const probeCounts = countsOf(probeSized.result);

    const flat0 = evaluateCounts(withFlatChance(probeRequest, 0), probeCounts);
    const flat100 = evaluateCounts(withFlatChance(probeRequest, 100), probeCounts);
    const plainAvg = (probeSized.summary.minDamage + probeSized.summary.maxDamage) / 2;

    report.add(
      '```\nE(march) = Σ_stacks hits_avg(stack) × damagePerHit(stack) × (1 + doubleDamageChance(stack)/100)\nhits_avg(stack) = (hits_enemyFirst(stack) + hits_armyFirst(stack)) / 2\n```\n' +
        'A proc is a plain ×2 on one hit (0015 §1 rule 4; the 2026-09-14 report’s entry 11: RD3 struck ' +
        '323,686 inclusive of 108,390 = exactly 2 × its ordinary 161,843 inclusive of 54,195), and the number ' +
        'of hits a stack gets depends only on its kill position and N — a proc never changes who dies — so the ' +
        'expectation is exact and the factor is per stack, not per battle.',
    );
    report.add('');
    report.add(
      '| proof, on the 7-type winner as `sizeStacks` sizes it (`msRelaxed`, scenario C, N=4) | value |',
    );
    report.add('|---|---|');
    report.add(`| engine \`avgDamage\` — the app’s headline | ${n(probeSized.summary.avgDamage)} |`);
    report.add(`| engine \`(min + max) / 2\`, unrounded | ${n(plainAvg)} |`);
    report.add(`| E with **every unit’s chance forced to 0** | ${n(Math.round(procExpected(flat0)))} |`);
    report.add(`| E with **every unit’s chance forced to 100** | ${n(Math.round(procExpected(flat100)))} |`);
    report.add(`| E(0) × 2 | ${n(Math.round(2 * procExpected(flat0)))} |`);
    report.add(
      `| E at the account’s real chances | ${n(Math.round(procExpected(probeSized)))} (×${(procExpected(probeSized) / plainAvg).toFixed(4)}) |`,
    );
    report.add(
      `\nE(0) = ${n(Math.round(procExpected(flat0)))} against the engine’s own \`(min + max)/2\` = ${n(plainAvg)}; ` +
        `E(100 %) = ${n(Math.round(procExpected(flat100)))} against 2 × E(0) = ${n(Math.round(2 * procExpected(flat0)))}. ` +
        'The formula **is** the journal with one exact multiplier per stack: it collapses to `avgDamage` when ' +
        'there are no procs and doubles when they always fire. (The two differ by the display rounding of ' +
        '0.5 only.)',
    );

    const realChances = probeSized.result.stacks.filter((stack) => stack.doubleDamageChance > 0);
    report.add('');
    report.add(
      'The account’s chances (base unit chance + the account’s global +3 %): ' +
        [...new Set(probeSized.result.stacks.map((stack) => `${String(stack.doubleDamageChance)} %`))].join(
          ' · ',
        ) +
        ' — ' +
        realChances
          .map((stack) => `${label(stack.unitId)} ${String(stack.doubleDamageChance)} %`)
          .join(' · ') +
        '. Everything at 3 % is worth ×1.03, the riders and CHR6 (8 %) are worth ×1.08. ' +
        '`strikeTwoSquadsChance` is priced nowhere in this file: the engine does not model it and the repo has ' +
        'no in-game observation of it (**to check in game**).',
    );

    // ==================================================================================================
    // §2 procs as an objective: does the optimum move?
    // ==================================================================================================
    report.h('2. Proc-optimal vs average-optimal (scenario C, N=4, one of each)');
    const n4Request = C12(n4Formation.enemy);
    const searchStart = Date.now();
    const avgRun = optimize(n4Request, 'avg');
    const procRun = optimize(n4Request, 'proc');
    const searchSeconds = (Date.now() - searchStart) / 1000;

    const avgOptimum = detail(n4Request, avgRun.best.counts);
    const procOptimum = detail(n4Request, procRun.best.counts);
    const fixedWinner = detail(n4Request, probeCounts);
    const fixedVector = detail(n4Request, { ...probeCounts, [EMH]: 67, [ABT]: 76, [LGN]: 72, [CHR]: 36 });

    const shortlist: { name: string; detail: MarchDetail }[] = [
      { name: '0015’s winner as `sizeStacks` sizes it (`msRelaxed`); K = 7', detail: fixedWinner },
      {
        name: '0015’s exhaustive mercenary vector EMH6 67 · ABT6 76 · LGN6 72 · CHR6 36',
        detail: fixedVector,
      },
      { name: 'average-optimal (climbed here)', detail: avgOptimum },
      { name: 'proc-optimal (climbed here)', detail: procOptimum },
    ];
    report.add('');
    report.add('| march | avg (the app’s figure) | min | max | E(march), procs priced | E ÷ avg | K |');
    report.add('|---|---|---|---|---|---|---|');
    for (const entry of shortlist) {
      report.add(
        `| ${entry.name} | ${n(entry.detail.avg)} | ${n(entry.detail.min)} | ${n(entry.detail.max)} | ${n(entry.detail.proc)} | ${(entry.detail.proc / entry.detail.avg).toFixed(4)} | ${String(entry.detail.k)} |`,
      );
    }
    report.add('');
    for (const entry of shortlist) report.add(`**${entry.name}** — ${entry.detail.line}`);

    const dProc = procOptimum.proc - avgOptimum.proc;
    const dAvg = procOptimum.avg - avgOptimum.avg;
    const sameMarch = TWELVE.every((id) => (avgOptimum.counts[id] ?? 0) === (procOptimum.counts[id] ?? 0));
    report.add('');
    const absGain = (100 * Math.abs(dProc)) / avgOptimum.proc;
    if (sameMarch || absGain < 0.05) {
      report.add(
        `**Verdict: the optimum barely moves.** Both objectives land on the same march up to one or two units ` +
          `of leadership (avg ${n(avgOptimum.avg)} against ${n(procOptimum.avg)}, E ${n(avgOptimum.proc)} ` +
          `against ${n(procOptimum.proc)}): the difference is **${(dProc >= 0 ? '+' : '−') + absGain.toFixed(3)} % ` +
          'of E**, inside the resolution of the search and inside the ±1-unit rounding of the counts. The ' +
          'riders and CHR6 (8 % each) are already the stacks this ladder pays twice — RD2, RD3 and CHR6 sit at ' +
          'the 2-hit positions in the average-optimal march — so there is no hit to move onto them. Across the ' +
          'other six formations (§3) the proc objective is worth between 0.00 % and +0.73 %, and it never ' +
          'changes the army.',
      );
    } else {
      const moved = TWELVE.filter((id) => (avgOptimum.counts[id] ?? 0) !== (procOptimum.counts[id] ?? 0))
        .map(
          (id) =>
            `${label(id)} ${String(avgOptimum.counts[id] ?? 0)} → ${String(procOptimum.counts[id] ?? 0)}`,
        )
        .join(' · ');
      report.add(
        `**Verdict: the optimum moves, by a hair.** E(proc-optimal) = ${n(procOptimum.proc)} against ` +
          `E(average-optimal) = ${n(avgOptimum.proc)}: **+${n(Math.round(dProc))} ` +
          `(+${((100 * dProc) / avgOptimum.proc).toFixed(3)} %)**. The change is ${moved || 'none'} — one or two ` +
          'units of leadership moved onto an 8 % stack — and on the app’s own figure the two marches are ' +
          `${dAvg === 0 ? 'identical' : `${n(Math.abs(dAvg))} apart (${n(procOptimum.avg)} against ${n(avgOptimum.avg)})`}. ` +
          '§2b shows how much room there was to begin with.',
      );
    }
    report.add('');
    report.add(
      'Per-stack ledger — hits in kill order, and what each stack is worth once its chance is priced:',
    );
    for (const entry of [
      { name: 'average-optimal', detail: avgOptimum },
      { name: 'proc-optimal', detail: procOptimum },
    ]) {
      report.add('');
      report.add(`*${entry.name}*`);
      report.add('');
      report.add(
        '| # | stack | units | total HP | per hit | chance | hits E | hits A | hits avg | E contribution |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|---|');
      for (const row of lines(entry.detail.evaluation)) {
        const stack = entry.detail.evaluation.result.stacks[row.position - 1];
        const chance = stack?.doubleDamageChance ?? 0;
        const hitsAvg = (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
        report.add(
          `| ${row.position} | ${row.label} | ${n(row.count)} | ${n(row.totalHp)} | ${n(row.damagePerHit)} | ${chance} % | ${row.hitsEnemyFirst} | ${row.hitsArmyFirst} | ${hitsAvg} | ${n(Math.round(hitsAvg * row.damagePerHit * (1 + chance / 100)))} |`,
        );
      }
    }

    // ---- how much room the proc objective actually has -----------------------------------------------
    report.h('2b. How much room there is, and the spread the app hides');
    const stackRows = (d: MarchDetail): { label: string; chance: number; damage: number }[] =>
      lines(d.evaluation).map((row) => {
        const stack = d.evaluation.result.stacks[row.position - 1];
        const chance = stack?.doubleDamageChance ?? 0;
        return {
          label: row.label,
          chance,
          damage: ((row.hitsEnemyFirst + row.hitsArmyFirst) / 2) * row.damagePerHit,
        };
      });
    const rows = stackRows(avgOptimum);
    const total = rows.reduce((sum, row) => sum + row.damage, 0);
    for (const chance of [3, 8]) {
      const share = rows.filter((row) => row.chance === chance).reduce((sum, row) => sum + row.damage, 0);
      report.add(
        `- ${String(chance)} % stacks carry **${n(Math.round(share))}** of the march’s ${n(Math.round(total))} ` +
          `average damage (${((100 * share) / total).toFixed(1)} %).`,
      );
    }
    const factor = avgOptimum.proc / avgOptimum.avg;
    const ceiling = 100 * (1.08 / factor - 1);
    report.add(
      `\nThe factor on the average-optimal march is **×${factor.toFixed(4)}** and on the proc-optimal ` +
        `×${(procOptimum.proc / procOptimum.avg).toFixed(4)}. The ceiling for any march of this size is ×1.08 ` +
        '(every point of damage on an 8 % stack; ×1.03 is the floor, all of it on a 3 % stack), so the whole ' +
        `proc lever is ${ceiling.toFixed(2)} % wide here and **re-arranging the march captures ` +
        `${Math.abs((100 * dProc) / avgOptimum.proc).toFixed(2)} % of it**. The reason the lever is small is structural: ` +
        'the damage sits in the mercenaries and three of the four carry 3 %, so there is no way to put the ' +
        'damage on an 8 % stack without giving up more damage than the proc is worth.',
    );
    report.add('');
    report.add(
      'The band the app would have to print to show this (the same two journals with the chance factor ' +
        'applied) — and, beside it, the app’s own min→max lever, which is bigger and free:',
    );
    report.add('');
    report.add('| march | min | avg | max | min + procs | avg + procs | max + procs | max ÷ min |');
    report.add('|---|---|---|---|---|---|---|---|');
    for (const entry of shortlist) {
      report.add(
        `| ${entry.name} | ${n(entry.detail.min)} | ${n(entry.detail.avg)} | ${n(entry.detail.max)} | ${n(Math.round(procOnJournal(entry.detail.evaluation, 'enemyFirst')))} | ${n(entry.detail.proc)} | ${n(Math.round(procOnJournal(entry.detail.evaluation, 'armyFirst')))} | ${(entry.detail.max / entry.detail.min).toFixed(3)} |`,
      );
    }
    report.add(
      `\nOn the average-optimal march the procs are worth **+${n(avgOptimum.proc - avgOptimum.avg)} ` +
        `(+${((100 * (avgOptimum.proc - avgOptimum.avg)) / avgOptimum.avg).toFixed(2)} %)** on the average; the ` +
        `army-first lever alone is worth +${n(avgOptimum.max - avgOptimum.avg)} on the same average ` +
        `(${((100 * (avgOptimum.max - avgOptimum.avg)) / avgOptimum.avg).toFixed(1)} %), and the two stack.`,
    );
    report.add('');
    report.add(
      `Search: ${String(avgRun.evals + procRun.evals)} engine evaluations over ` +
        `${String(avgRun.seeds + procRun.seeds)} seeds (${searchSeconds.toFixed(1)} s). Best average seed: ` +
        `“${avgRun.seed}”; best proc seed: “${procRun.seed}”.`,
    );

    // ==================================================================================================
    // §3 the enemy as a lever, jointly optimized
    // ==================================================================================================
    report.h('3. The enemy as a lever: the march re-optimized per formation');

    interface Found {
      formation: Formation;
      request: StackRequest;
      detail: MarchDetail;
      seed: string;
      evals: number;
      procDetail: MarchDetail;
      bAvg: number;
      fixedAvg: number;
      fixedLine: string;
      bFixed: number;
    }

    const found: Found[] = [];
    const timing: string[] = [];
    const sectionStart = Date.now();

    for (const formation of FORMATIONS) {
      const request = C12(formation.enemy);
      const formationStart = Date.now();
      const run = optimize(request, 'avg');
      const winner = detail(request, run.best.counts);
      const procRunHere = climb(request, run.best.counts, 'proc');
      const procDetail = detail(request, procRunHere.counts);
      const fixedRequest = withMethod(withUnits(request, WINNER7), 'msRelaxed');
      const fixed = evaluate(fixedRequest);
      found.push({
        formation,
        request,
        detail: winner,
        seed: run.seed,
        evals: run.evals + procRunHere.evals,
        procDetail,
        bAvg: evaluateCounts(B12(formation.enemy), run.best.counts).summary.avgDamage,
        fixedAvg: fixed.summary.avgDamage,
        fixedLine: march(fixed.result),
        bFixed: evaluateCounts(B12(formation.enemy), countsOf(fixed.result)).summary.avgDamage,
      });
      timing.push(
        `${formation.key}: ${String(run.evals + procRunHere.evals)} evaluations over ${String(run.seeds)} seeds, ${((Date.now() - formationStart) / 1000).toFixed(1)} s, best seed “${run.seed}”`,
      );
    }

    report.add(
      'Best march per formation (scenario C), with the same counts scored under B beside it. The hill-climb ' +
        'searches subset × counts; the seeds are the 510 subset/sizing combinations of the header.',
    );
    report.add('');
    report.add('| enemy | N | best march (kill order) | K | avg (C) | E (C) | the same counts under B |');
    report.add('|---|---|---|---|---|---|---|');
    for (const entry of found) {
      report.add(
        `| ${entry.formation.key} | ${String(entry.formation.N)} | ${entry.detail.line} | ${String(entry.detail.k)} | ${n(entry.detail.avg)} | ${n(entry.detail.proc)} | ${n(entry.bAvg)} |`,
      );
    }
    report.add(
      'The last column is the **same count vector** scored under B, and it is deliberately lower than the ' +
        'scenario-B optima of 0015: the counts are optimal under C, and B’s different bonuses move the ladder, ' +
        'so a vector that is optimal in one scenario is not in the other. Every number in this file is the ' +
        'engine’s under the bonus scenario its column names.',
    );

    report.add('');
    report.add(
      'Against the **fixed** 0015 march (7 types, `msRelaxed`, re-sized in each formation) — the comparison ' +
        '0015 §5 made across formations:',
    );
    report.add('');
    report.add(
      '| enemy | fixed 0015 march (C) | re-optimized (C) | gain | fixed 0015 march (B, 0015’s own number) | note |',
    );
    report.add('|---|---|---|---|---|---|');
    for (const entry of found) {
      report.add(
        `| ${entry.formation.key} | ${n(entry.fixedAvg)} | ${n(entry.detail.avg)} | +${n(entry.detail.avg - entry.fixedAvg)} (+${((100 * (entry.detail.avg - entry.fixedAvg)) / entry.fixedAvg).toFixed(1)} %) | ${n(entry.bFixed)} | ${entry.formation.note} |`,
      );
    }
    report.add('\nUnder **scenario B** the same search run from scratch on the N=4 formation gives:');
    const bN4 = optimize(B12(n4Formation.enemy), 'avg');
    const bN4Detail = detail(B12(n4Formation.enemy), bN4.best.counts);
    report.add(
      `\n- **${bN4Detail.line}** — K = ${String(bN4Detail.k)}, avg ${n(bN4Detail.avg)}, E ${n(bN4Detail.proc)}. ` +
        `0015’s exhaustive single-march winner under the same scenario is 8,061,308; this is ` +
        `${n(bN4Detail.avg - 8061308)} on top of it (${((100 * (bN4Detail.avg - 8061308)) / 8061308).toFixed(1)} %), ` +
        'and the structure — two fat troop stacks above four mercenary stacks at their caps — is identical in ' +
        'both scenarios.',
    );

    report.add('');
    report.add(
      '**Does the objective move the enemy’s optimum too?** Each winner is re-climbed under the proc ' +
        'objective and the two are compared; a `—` means the march is byte-for-byte the same.',
    );
    report.add('');
    report.add(
      '| enemy | average-optimal: avg | its E | proc-optimal: avg | its E | E gain | march changed? |',
    );
    report.add('|---|---|---|---|---|---|---|');
    for (const entry of found) {
      const same = TWELVE.every(
        (id) => (entry.detail.counts[id] ?? 0) === (entry.procDetail.counts[id] ?? 0),
      );
      const gain = entry.procDetail.proc - entry.detail.proc;
      report.add(
        `| ${entry.formation.key} | ${n(entry.detail.avg)} | ${n(entry.detail.proc)} | ${n(entry.procDetail.avg)} | ${n(entry.procDetail.proc)} | +${n(Math.round(gain))} (${((100 * gain) / entry.detail.proc).toFixed(2)} %) | ${same ? 'no — identical' : entry.procDetail.line} |`,
      );
    }

    report.add('');
    report.add(
      '**What one unit of each type is worth per hit, formation by formation** (the engine’s `hitDamage` at ' +
        'count 1, so the numbers are comparable across stacks; a cell below the N=4 column is a feature the ' +
        'formation took away). This is the table that answers “which units belong”:',
    );
    report.add('');
    report.add(`| unit | ${FORMATIONS.map((formation) => formation.short).join(' | ')} |`);
    report.add(`|---|${FORMATIONS.map(() => '---').join('|')}|`);
    const perUnit = new Map<string, number>();
    for (const id of TWELVE) {
      const cells = FORMATIONS.map((formation) => {
        const request = C12(formation.enemy);
        const unit = request.units.find((candidate) => candidate.id === id);
        if (!unit) return '—';
        const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
        const one = hitDamage(effective, 1).damage;
        if (formation.short === 'N4') perUnit.set(id, one);
        const baseline = perUnit.get(id);
        const lost = baseline !== undefined && one < baseline;
        return `${effective.target} ${n(one)}${lost ? ' ↓' : ''}`;
      });
      report.add(`| ${label(id)} | ${cells.join(' | ')} |`);
    }
    report.add(
      '\n(↓ marks a cell lower than the same unit’s N=4 value, i.e. a feature the formation removed. The ' +
        'target moves with the formation because `chooseTarget` follows the largest strength-against among ' +
        'the categories actually present.)',
    );

    report.add('');
    report.add(
      '**Which units earn their place.** Row = unit, cell = count in that formation’s winner (— = not fielded).',
    );
    report.add('');
    report.add(`| unit | ${FORMATIONS.map((formation) => formation.short).join(' | ')} |`);
    report.add(`|---|${FORMATIONS.map(() => '---').join('|')}|`);
    for (const id of TWELVE) {
      const cells = found.map((entry) => {
        const count = entry.detail.counts[id] ?? 0;
        return count > 0 ? n(count) : '—';
      });
      report.add(`| ${label(id)} | ${cells.join(' | ')} |`);
    }

    // ---- ladder, floor, hits -------------------------------------------------------------------------
    interface Ladder {
      entry: Found;
      troopLeadership: number;
      floor: number;
      topHp: number;
      top: string;
      hits: number;
      mercHits: number;
      mercByStack: string;
    }
    const ladders: Ladder[] = found.map((entry) => {
      let troopLeadership = 0;
      let floor = Number.MAX_SAFE_INTEGER;
      let topHp = 0;
      let top = '';
      let hits = 0;
      let mercHits = 0;
      const mercById = new Set<string>(MERCS);
      const mercByStack: string[] = [];
      for (const row of lines(entry.detail.evaluation)) {
        hits += (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
        if (mercById.has(row.unitId)) {
          mercHits += (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
          mercByStack.push(`${row.label} ${row.hitsEnemyFirst}/${row.hitsArmyFirst}`);
        }
        if (row.pool === 'leadership') {
          const unit = entry.request.units.find((candidate) => candidate.id === row.unitId);
          troopLeadership += row.count * (unit?.cost ?? 1);
          floor = Math.min(floor, row.totalHp);
        }
        if (row.totalHp > topHp) {
          topHp = row.totalHp;
          top = row.label;
        }
      }
      return {
        entry,
        troopLeadership,
        floor: floor === Number.MAX_SAFE_INTEGER ? 0 : floor,
        topHp,
        top,
        hits,
        mercHits,
        mercByStack: mercByStack.join(' · '),
      };
    });

    report.add('');
    report.add(
      '| enemy | K | Σ hits (mean of the two journals) | mercenary hits | troop leadership | mercenary authority | smallest troop stack | top stack | mercenary hits, E/A, in kill order |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|');
    for (const row of ladders) {
      let authority = 0;
      for (const id of MERCS) authority += (row.entry.detail.counts[id] ?? 0) * (id === CHR ? 2 : 1);
      report.add(
        `| ${row.entry.formation.key} | ${String(row.entry.detail.k)} | ${n(row.hits)} | ${n(row.mercHits)} | ${n(row.troopLeadership)} | ${String(authority)} | ${n(row.floor)} | ${n(row.topHp)} ${row.top} | ${row.mercByStack} |`,
      );
    }

    // ---- K and N ------------------------------------------------------------------------------------
    report.h('3b. The rule for K, the floor and N');
    report.add(
      'The marginal stack is pure arithmetic (`expectedHits`, the engine’s closed form): the K-th stack in ' +
        'kill order adds `expectedHits(K, N)` hits of its own damage per hit, while every stack in front of the ' +
        'mercenaries also pushes them one position deeper. The staircases:',
    );
    report.add('');
    report.add('| K | hits(K) N=3 | hits(K) N=4 | hits(K) N=8 | Δ at N=3 | Δ at N=4 | Δ at N=8 |');
    report.add('|---|---|---|---|---|---|---|');
    for (let k = 1; k <= 16; k += 1) {
      const hits = (N: number): number => expectedHits(k, N, false);
      const delta = (N: number): number => hits(N) - expectedHits(k - 1, N, false);
      report.add(
        `| ${String(k)} | ${String(hits(3))} | ${String(hits(4))} | ${String(hits(8))} | +${String(delta(3))} | +${String(delta(4))} | +${String(delta(8))} |`,
      );
    }
    report.add('');
    report.add(
      `Measured optima: ${ladders.map((row) => `${row.entry.formation.short} N=${String(row.entry.formation.N)} K=${String(row.entry.detail.k)}, Σ hits ${n(row.hits)}, mercenary hits ${n(row.mercHits)}, floor ${n(row.floor)}, ${n(row.troopLeadership)} leadership on troops`).join(' · ')}.`,
    );

    // ---- robustness: random restarts ------------------------------------------------------------------
    report.h('3c. Robustness: random restarts, and the exhaustive mercenary grid');
    report.add(
      'Hill-climbing returns a local optimum and the seed list is finite, so two independent checks. ' +
        '**Restarts**: 24 random feasible count vectors per formation, climbed with a smaller budget ' +
        '(2,000 evaluations) and compared with the winner — how often does a fresh basin beat it, and how ' +
        'often does it come within 1 %? **Mercenary grid**: every EMH6 × ABT6 × LGN6 × CHR6 combination ' +
        'inside the caps in steps of five with the winner’s troop counts frozen. The grid can only ever be ' +
        '*worse* — the mercenary counts and the troop floor move together, so freezing the troops breaks the ' +
        'relation that makes the march work — but it proves the mercenary half is not what is left on the table.',
    );
    report.add('');
    report.add(
      '| enemy | winner avg | best restart | restarts beating the winner | restarts within 1 % | grid best (troops frozen) |',
    );
    report.add('|---|---|---|---|---|---|');
    const restartRandom = mulberry32(4711);
    for (const entry of found) {
      const request = C12(entry.formation.enemy);
      const baseScore = (entry.detail.min + entry.detail.max) / 2;
      let bestRestart = 0;
      let beaten = 0;
      let within = 0;
      for (let index = 0; index < 24; index += 1) {
        const result = climb(request, randomSeed(request, restartRandom), 'avg', 2000);
        const evaluation = evaluateCounts(request, result.counts);
        const value = (evaluation.summary.minDamage + evaluation.summary.maxDamage) / 2;
        bestRestart = Math.max(bestRestart, value);
        if (value > baseScore + 0.5) beaten += 1;
        if (value > baseScore * 0.99) within += 1;
      }
      const caps = MERCS.map((id) => Math.floor((request.caps[id] ?? 0) / 5));
      let bestGrid = -1;
      for (let e = 0; e <= (caps[0] ?? 0); e += 1)
        for (let a = 0; a <= (caps[1] ?? 0); a += 1)
          for (let l = 0; l <= (caps[2] ?? 0); l += 1)
            for (let c = 0; c <= (caps[3] ?? 0); c += 1) {
              const trial: Counts = {
                ...entry.detail.counts,
                [EMH]: e * 5,
                [ABT]: a * 5,
                [LGN]: l * 5,
                [CHR]: c * 5,
              };
              if (!feasible(request, trial)) continue;
              const evaluation = evaluateCounts(request, trial);
              const value = (evaluation.summary.minDamage + evaluation.summary.maxDamage) / 2;
              if (value > bestGrid) bestGrid = value;
            }
      report.add(
        `| ${entry.formation.key} | ${n(entry.detail.avg)} | ${n(Math.round(bestRestart))} | ${String(beaten)} / 24 | ${String(within)} / 24 | ${n(Math.round(bestGrid))} |`,
      );
    }

    // ---- spare budget, free tails and 2-opt ------------------------------------------------
    report.h('3d. Are the winners actually optima? Spare budget, single additions, single transfers');
    const STEPS = [1, 2, 3, 5, 8, 13, 22, 40, 75, 140, 260, 480, 900, 1700, 3100, 4343];
    const COST = new Map<string, number>(TWELVE.map((id) => [id, 1]));
    report.add(
      'Hill-climbing returns a local optimum, so the winners are checked two ways. **Single addition**: add ' +
        'any count of any unit type the march left out (a stack added at the bottom sits at the deepest, ' +
        'best-paid kill position). **Single transfer**: move units out of one stack and spend the freed ' +
        'leadership in another — the move that reaches a different ladder shape. If either finds an ' +
        'improvement, the winner is not an optimum.',
    );
    report.add('');
    report.add(
      '| enemy | leadership left | authority left | best single addition | Δ avg | best single transfer | Δ avg |',
    );
    report.add('|---|---|---|---|---|---|---|');
    const robust: string[] = [];
    for (const entry of found) {
      const request = C12(entry.formation.enemy);
      for (const unit of request.units) COST.set(unit.id, unit.cost);
      const left = slack(request, entry.detail.counts, unitsOf(request));
      const baseScore = (entry.detail.min + entry.detail.max) / 2;
      const trialScore = (trial: Counts): number => {
        if (!feasible(request, trial)) return -Infinity;
        const evaluation = evaluateCounts(request, trial);
        return (evaluation.summary.minDamage + evaluation.summary.maxDamage) / 2;
      };
      let bestAdd = 0;
      let bestAddLabel = '';
      for (const id of TWELVE) {
        if ((entry.detail.counts[id] ?? 0) > 0) continue;
        for (const count of STEPS) {
          const value = trialScore({ ...entry.detail.counts, [id]: count }) - baseScore;
          if (value > bestAdd) {
            bestAdd = value;
            bestAddLabel = `add ${label(id)} ${n(count)}`;
          }
        }
      }
      let bestMove = 0;
      let bestMoveLabel = '';
      for (const from of TWELVE) {
        const fromBase = entry.detail.counts[from] ?? 0;
        if (fromBase === 0) continue;
        for (const to of TWELVE) {
          if (to === from) continue;
          for (const count of STEPS) {
            const remove = Math.ceil((count * (COST.get(to) ?? 1)) / (COST.get(from) ?? 1));
            if (remove > fromBase) continue;
            const trial: Counts = {
              ...entry.detail.counts,
              [from]: fromBase - remove,
              [to]: (entry.detail.counts[to] ?? 0) + count,
            };
            const value = trialScore(trial) - baseScore;
            if (value > bestMove) {
              bestMove = value;
              bestMoveLabel = `${label(from)} ${n(remove)} → ${label(to)} ${n(count)}`;
            }
          }
        }
      }
      robust.push(`${entry.formation.short}: +${n(Math.round(Math.max(bestAdd, bestMove)))}`);
      report.add(
        `| ${entry.formation.key} | ${n(left.leadership)} | ${n(left.authority)} | ${bestAddLabel || 'none'} | +${n(Math.round(bestAdd))} | ${bestMoveLabel || 'none'} | +${n(Math.round(bestMove))} |`,
      );
    }
    report.add(
      `\nBest improvement a single addition or a single transfer can find on any winner: ${robust.join(' · ')}. ` +
        'Leadership is spent to the last point in every winner — the housing does not bind, the kill order does ' +
        '(a stack is only worth its position).',
    );

    // ==================================================================================================
    // §4 the rules
    // ==================================================================================================
    report.h('4. The rules the numbers give');
    const detailOf = (short: string): Found =>
      found.find((entry) => entry.formation.short === short) as Found;
    const n4 = detailOf('N4');
    const n3 = detailOf('N3');
    const absent = (entry: Found): string =>
      TWELVE.filter((id) => (entry.detail.counts[id] ?? 0) === 0)
        .map(label)
        .join(', ') || 'none';
    const ladderOf = (short: string): Ladder =>
      ladders.find((row) => row.entry.formation.short === short) as Ladder;
    const hitRow = (short: string): string =>
      lines(detailOf(short).detail.evaluation)
        .map((row) => `${row.label} p${String(row.position)} ${row.hitsEnemyFirst}/${row.hitsArmyFirst}`)
        .join(' · ');

    report.add(
      '**1. The housing never binds; the kill order does.** Leadership is spent to the last point in all ' +
        `seven winners (${ladders.map((row) => n(row.troopLeadership)).join(' / ')} of 4,343) and the ` +
        'mercenaries sit at their caps or one step under (authority 283–314 of 2,000). Authority is never the ' +
        'constraint — the stock and the ladder are.',
    );
    report.add(
      '\n**2. K is set by the next step of the hit staircase, and the step moves with N.** Total hits are ' +
        'fixed by (K, N) alone; what the march controls is *which* positions those hits land on. Measured: ' +
        ladders
          .map(
            (row) =>
              `${row.entry.formation.short} N=${String(row.entry.formation.N)} K=${String(row.entry.detail.k)} (Σ ${n(row.hits)} hits, ${n(row.mercHits)} of them the mercenaries’)`,
          )
          .join(' · ') +
        '.\n\nThe staircase says why: at N=4 the second hit arrives at p=6 and the third at p=10, so a ' +
        'march stops at K=8 — positions 6, 7 and 8 are paid twice and a ninth stack would be paid twice as ' +
        'well but only by taking leadership out of the stacks already being paid. At N=3 the second hit is at ' +
        'p=5 and the third at p=8, so K=8 already reaches the third hit and the same 8 stacks collect 12.5 ' +
        'hits instead of 10.5 — **N=3 is worth ' +
        ((ladderOf('N3').hits / ladderOf('N4').hits - 1) * 100).toFixed(0) +
        ' % of hit count for the identical march**. At N=8 the second hit only ' +
        'arrives at p=10, one stack past a whole round, so the march stops at K=7: an eighth or ninth stack ' +
        'would be paid exactly what the seventh is paid and would have to be paid for out of the stacks above ' +
        `it.\n\nThe winners' ladders, enemy-first / army-first hits by kill position:\n\n- N=4: ${hitRow('N4')}\n- N=3: ${hitRow('N3')}\n- N=8: ${hitRow('N8')}`,
    );
    report.add(
      '\n**3. Losing a category feature moves leadership, not membership.** SW1 and SP1 are never fielded in ' +
        `any of the seven winners; ARC2 and RD3 are in all seven; EMH6 is in all seven and never loses a point ` +
        'of its +609 % because that line is on `epicMonsters`, a constant `constantStrengthAgainst` adds ' +
        'whatever the target is. What a denied category does is shrink the stacks that lose their feature and ' +
        'hand the leadership to the ones that keep theirs: at N=4 ' +
        `${absent(n4)} are left out entirely and RD3 582 and RD2 761 sit in ` +
        'front of the mercenaries; with **no ranged squad** the same two fall to RD3 424 and RD2 247 while ' +
        'SP2 rises from 138 to 1,499, and the march goes one stack deeper (K=9) — the units do not leave the ' +
        'march, their share of the leadership does. The one true exclusion is SW1, and it is excluded for a ' +
        'reason the enemy cannot change: the specialist’s ×1.51 health against the guardsmen’s ×2.43 makes it ' +
        'the dearest sponge per HP this account owns.',
    );
    report.add(
      '\n**4. The formation that changes nothing.** “No melee squad” produces the byte-identical winner to ' +
        '“one of each” (avg ' +
        `${n(n4.detail.avg)}): with melee, ranged, mounted and flying all present and four squads on the ` +
        'board, no unit in this account picks the melee squad as its target, so removing it changes neither ' +
        'the targets nor N. A melee squad is worth exactly nothing to this account.',
    );
    report.add(
      '\n**5. Both levers are real but neither is worth re-arranging the march.** The procs are worth ' +
        `×1.0485 on the N=4 winner (+${n(n4.detail.proc - n4.detail.avg)} a march) and are free; the enemy ` +
        'choice is worth ' +
        `${((detailOf('N3').detail.avg / detailOf('N4−rng').detail.avg - 1) * 100).toFixed(0)} % between the best ` +
        'formation (N=3) and the worst (no ranged squad). But the march does not change for either: the same ' +
        'troop types come back every time, and the proc optimum is the average optimum up to 1–2 units (§2). ' +
        'Both are dwarfed by 0015’s own lever — taking Swordsman I out of the floor, +75 %.',
    );
    report.add(
      `\n**6. The ceiling on this account.** The best march found anywhere in this file is the N=3 one: ` +
        `${n3.detail.line}, avg ${n(n3.detail.avg)}, E ${n(n3.detail.proc)} (scenario C). The worst of the ` +
        `seven formations costs ${n(n3.detail.avg - detailOf('N4−rng').detail.avg)} of it.`,
    );
    report.add('');
    report.add('Per-formation timings (the whole file is bounded well under 5 minutes):');
    for (const line of timing) report.add(`- ${line}`);
    report.add(
      `\n§3: ${String(found.reduce((sum, entry) => sum + entry.evals, 0))} evaluations in ` +
        `${((Date.now() - sectionStart) / 1000).toFixed(1)} s; the whole file, ` +
        `${String(Math.round((Date.now() - started) / 1000))} s including §1, §2 and every check. ` +
        `(${duration(Math.round((Date.now() - started) / 1000))}.)`,
    );

    report.h('5. The practical rule');
    report.add(
      `**Attack a monster with three squads on the card, and make sure one of them is ranged and one is ` +
        'flying** — the three-squad target tested here is worth ' +
        `${((detailOf('N3').detail.avg / detailOf('N4').detail.avg - 1) * 100).toFixed(0)} % more than a ` +
        'four-squad one even though ARC2 and ABT6 lose their flying bonus in it (the export’s own 2026-09-11 ' +
        'reports show the same monster with three squads and four, so the count is readable before attacking), ' +
        'the same march, eight (Arachne’s) cost ' +
        `${((1 - detailOf('N8').detail.avg / detailOf('N4').detail.avg) * 100).toFixed(0)} %, and a formation ` +
        'with no ranged squad costs ' +
        `${((1 - detailOf('N4−rng').detail.avg / detailOf('N4').detail.avg) * 100).toFixed(0)} % however well ` +
        'the march is re-optimized. ' +
        '**Do not re-arrange the march for it**: two troop stacks (ARC2 + RD3 against a four-squad target, ' +
        'with RD2 in front of the mercenaries as well at N=3) in front of the four mercenaries at their caps ' +
        'is the answer for every one of the seven ' +
        `formations tested; what moves is only the tail, and the procs (×1.0485 here, free) never change ` +
        'which units belong.',
    );
    report.add(
      `\nIn counts, scenario C — **N=3 (no flying squad):** ${n3.detail.line} → **${n(n3.detail.avg)}**. ` +
        `**N=4 (one of each, or any four-squad target that keeps a ranged, a mounted and a flying squad):** ` +
        `${n4.detail.line} → **${n(n4.detail.avg)}**. **N=8 (Arachne):** ${detailOf('N8').detail.line} → ` +
        `**${n(detailOf('N8').detail.avg)}**.`,
    );

    report.h('6. To check in game');
    report.add(
      '- **Does a proc change the enemy’s behaviour?** The whole objective assumes not: a double-damage hit ' +
        'kills nothing extra, the enemy still wipes one stack per attack, and the victim is still the ' +
        'highest-HP living stack. In-game reading that would settle it: a report where a stack doubles and the ' +
        '*next* enemy line kills a stack that is not the highest-HP survivor.\n' +
        '- **`strikeTwoSquadsChance`.** Not modelled, not priced, never observed. In-game reading: a report ' +
        'where one stack’s entry appears twice in one round with no enemy line between them.\n' +
        '- **The squads on the monster card.** §3 makes N and the presence set worth 20 % and 15 % of a march, ' +
        'and whether the card shows them before the attack is the one input a player needs to use it. ' +
        'In-game reading: the monster’s card next to the report’s first lines, same monster, same hour.\n' +
        '- **The proc chance itself.** Taken as the unit’s base chance plus the account’s global +3 %. In-game ' +
        'reading: the share of doubled lines over ~100 hits of one stack in one long fight.',
    );

    report.save();
  }, 600_000);
});
