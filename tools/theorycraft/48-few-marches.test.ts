/**
 * 48 — the "few marches" regime, done exactly.
 *
 * 0015 §6 answered "what is the best campaign" for budgets of 2–20 M silver and up to 30 marches, and it always
 * fielded the *same* march every time. This file answers the owner's real question — a bounded silver purse and
 * a bounded mercenary stock, spent on **a few marches** — by choosing a *sequence*.
 *
 * What the engine cannot express (and why this file plays the campaign by hand)
 *   `simulateCampaign` (src/engine/campaign.ts) plays ONE `StackRequest` N times with a single `spend`
 *   fraction: every march is the same caps vector scaled by one number, sized by `sizeStacks` at the housing's
 *   full leadership. It therefore cannot express (a) a different march each time, (b) a troop budget below the
 *   leadership cap, (c) a per-type mercenary vector. So the campaign is played here by hand — `sizeStacks` for
 *   the counts, `simulateBattle` for the fight, `recoveryCosts` for the bill, `chunks` for the stock decay —
 *   and §1 proves the hand loop reproduces `simulateCampaign` to the unit on four plans the engine *can*
 *   express.
 *
 * The search, in three pieces
 *   1. a **design space** of single marches: (troop subset × sizing method × mercenary cap vector × leadership
 *      level) → `sizeStacks` decides the counts. 465 distinct marches after deduplication, each one fight.
 *   2. the **Pareto frontier** of those marches in (damage ↑, silver ↓, mercenaries lost per type ↓). A march
 *      another one beats on every axis is never part of an optimal sequence, so the campaign plays the frontier
 *      and nothing else.
 *   3. a **beam search** over sequences of frontier marches, one march at a time, on the exact state (silver,
 *      gold, stock per type). Beam width 150, dominance-pruned, duplicate states collapsed, states ranked by
 *      damage *plus what the resources still in hand could buy* — without that look-ahead a beam spends
 *      everything on the first march and loses the economical states it needs later.
 *
 * Rules assumed, and nothing else
 *   the mercenary tenth is gone for good (`recovery.ts`, verified in game); troops come back either from the
 *   Army tab (per unit, silver) or from the Temple (per unit, gold ÷ 1.53 at temple 15) with the tenth
 *   retrained anyway; a march's stock is billed `ceil(n/10)` per type, so fielding 73 units costs the stock of
 *   80. Two things the repo's evidence does not settle — whether the game bills *troops* per unit or per chunk
 *   in the revival UI, and whether training runs in parallel across unit types — are flagged in §9, not
 *   assumed.
 *
 * Bounds (measured on this machine)
 *   465 distinct designs ≈ 0.1 s per scenario; one beam run = ≤ 10 marches × 150 states × ≤ 251 frontier
 *   marches ≈ 400,000 steps, memoised globally; the file runs ~170 beam runs plus the schedule, exchange-rate
 *   and brute-force experiments in about two minutes. Accuracy is checked, not assumed: M = 1 against all 465
 *   designs, M = 2 against every pair of the frontier, and M = 3 and M = 10 against the same search at four
 *   times the beam width (§3).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/48-few-marches.test.ts` (add `--reporter=verbose --silent=false`
 * to read the report on the terminal; the tables are also written to `out/48-few-marches.md`).
 */
import { describe, it } from 'vitest';

import { simulateCampaign } from '../../src/engine/campaign';
import { chunks, recoveryCosts, reviveOne, retrainOne, templeDivisor } from '../../src/engine/recovery';
import { simulateBattle } from '../../src/engine/battle';
import { sizeStacks } from '../../src/engine/stacker';
import type { RecoveryMode, StackRequest } from '../../src/engine/types';
import {
  MERC_IDS,
  Report,
  duration,
  evaluateCounts,
  lines,
  loadOwner,
  march,
  n,
  scenarioB,
  scenarioC,
  table,
  unitById,
  withCaps,
  withHousing,
  withMethod,
  withUnits,
} from './harness';

// ---- Constants ---------------------------------------------------------------------------------------
const TEMPLE = 15;
/** The four mercenary stocks the account starts the campaign with (export, 2026-09-13). */
const CAPS: Record<string, number> = {
  'epic-monster-hunter-6': 92,
  'arbalester-6': 76,
  'legionary-6': 72,
  'chariot-6': 37,
};
const SHORT: Record<string, string> = {
  'epic-monster-hunter-6': 'EMH6',
  'arbalester-6': 'ABT6',
  'legionary-6': 'LGN6',
  'chariot-6': 'CHR6',
};
const MARCHES = [1, 2, 3, 5, 10] as const;
/** Four silver budgets bracketing the account's real position (~1.1 M on 2026-09-13). */
const BUDGETS = [500_000, 1_100_000, 2_000_000, 5_000_000] as const;
const BEAM = 150;

const TROOPS = [
  'swordsman-1',
  'archer-1',
  'spearman-1',
  'rider-1',
  'archer-2',
  'spearman-2',
  'rider-2',
  'rider-3',
];
const TROOP_SETS = [
  { key: 'RD3', ids: ['rider-3'] },
  { key: 'ARC2·RD3', ids: ['archer-2', 'rider-3'] },
  { key: 'ARC2·RD2·RD3', ids: ['archer-2', 'rider-2', 'rider-3'] },
  { key: 'ARC2·SP2·RD2·RD3', ids: ['archer-2', 'spearman-2', 'rider-2', 'rider-3'] },
  { key: '8 troops', ids: TROOPS },
] as const;
const METHODS = ['elite', 'ms'] as const;
/** Leadership the troop stacks are sized to; 4,343 is the housing cap. */
const LEVELS = [0, 250, 500, 900, 1162, 2000, 3100, 4343] as const;

function vector(f: number, dropChariot = false): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of MERC_IDS)
    out[id] = dropChariot && id === 'chariot-6' ? 0 : Math.floor((f * (CAPS[id] ?? 0)) / 10) * 10;
  return out;
}
const VECTORS: { key: string; caps: Record<string, number> }[] = [
  ...([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1] as const).map((f) => ({
    key: `${(f * 100).toFixed(0)} %`,
    caps: vector(f),
  })),
  { key: '50 % no CHR6', caps: vector(0.5, true) },
  { key: '100 % no CHR6', caps: vector(1, true) },
  { key: 'exact stock', caps: { ...CAPS } },
];

const mercString = (caps: Record<string, number>): string => MERC_IDS.map((id) => n(caps[id] ?? 0)).join('/');
const shortString = (caps: Record<string, number>): string =>
  MERC_IDS.map((id) => n(caps[id] ?? 0)).join('/');
function countString(counts: Record<string, number>): string {
  const mercs = MERC_IDS.map((id) => `${SHORT[id] ?? ''} ${n(counts[id] ?? 0)}`).join(' · ');
  const troops = TROOPS.filter((id) => (counts[id] ?? 0) > 0)
    .map((id) => `${unitById(id)?.label ?? id} ${n(counts[id] ?? 0)}`)
    .join(' · ');
  return troops ? `${mercs} · ${troops}` : mercs;
}
const totalLoss = (loss: Record<string, number>): number =>
  MERC_IDS.reduce((sum, id) => sum + (loss[id] ?? 0), 0);
/** How a table should name a march's troop side: the set means nothing when no troop is fielded. */
function troopLabel(design: { subset: string; counts: Record<string, number> }): string {
  return TROOPS.some((id) => (design.counts[id] ?? 0) > 0) ? design.subset : 'none (mercenaries only)';
}

// ---- Single-march designs ----------------------------------------------------------------------------
type Method = 'elite' | 'ms' | 'msRelaxed';

interface March {
  counts: Record<string, number>;
  damage: number;
  silver: number;
  gold: number;
  seconds: number;
  loss: Record<string, number>;
  leadership: number;
  authority: number;
  /** Every troop stack out-HPs every mercenary stack, so the mercenaries are the last to die. */
  above: boolean;
}

interface Design extends March {
  key: string;
  subsetIds: readonly string[];
  subset: string;
  method: Method;
  level: number;
  caps: Record<string, number>;
  vectorKey: string;
}

const memo = new Map<string, March>();

function withTemple(request: StackRequest): StackRequest {
  return { ...request, recovery: { ...request.recovery, templeLevel: TEMPLE } };
}
function withPlan(request: StackRequest, mode: RecoveryMode): StackRequest {
  return { ...request, recovery: { ...request.recovery, templeLevel: TEMPLE, plan: { mode } } };
}

function requestFor(
  base: StackRequest,
  subsetIds: readonly string[],
  method: Method,
  caps: Record<string, number>,
  level: number,
): StackRequest {
  return withPlan(
    withHousing(
      withCaps(withMethod(withUnits(base, subsetIds), method === 'msRelaxed' ? 'msRelaxed' : method), caps),
      {
        leadership: level,
      },
    ),
    base.recovery.plan.mode,
  );
}

function evaluateMarch(
  base: StackRequest,
  subsetIds: readonly string[],
  method: Method,
  caps: Record<string, number>,
  level: number,
  mode: RecoveryMode,
): March | undefined {
  const key = `${mode}|${method}|${String(level)}|${subsetIds.join(',')}|${MERC_IDS.map((id) => caps[id] ?? 0).join(',')}`;
  const cached = memo.get(key);
  if (cached) return cached;
  const request = withPlan(requestFor(base, subsetIds, method, caps, level), mode);
  const result = sizeStacks(request);
  if (result.stacks.length === 0) return undefined;
  const summary = simulateBattle(result, request);
  const costs = recoveryCosts(result.stacks, request.units, request.recovery);
  const bill = mode === 'retrain' ? costs.retrain : mode === 'revive' ? costs.revive : costs.selective;
  const loss: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const stack of result.stacks) {
    counts[stack.unitId] = stack.count;
    if ((MERC_IDS as readonly string[]).includes(stack.unitId)) loss[stack.unitId] = chunks(stack.count);
  }
  const troopHp = result.stacks.filter((stack) => stack.pool === 'leadership').map((stack) => stack.totalHp);
  const mercHp = result.stacks.filter((stack) => stack.pool === 'authority').map((stack) => stack.totalHp);
  const entry: March = {
    damage: summary.avgDamage,
    silver: bill.silver,
    gold: bill.gold,
    seconds: bill.seconds,
    loss,
    counts,
    leadership: result.pools.leadership.used,
    authority: result.pools.authority.used,
    above: troopHp.length > 0 && mercHp.length > 0 && Math.min(...troopHp) > Math.max(...mercHp),
  };
  memo.set(key, entry);
  return entry;
}

function buildDesigns(base: StackRequest, mode: RecoveryMode): Design[] {
  const designs: Design[] = [];
  for (const set of TROOP_SETS) {
    const ids = [...set.ids, ...MERC_IDS];
    for (const method of METHODS) {
      for (const v of VECTORS) {
        for (const level of LEVELS) {
          const got = evaluateMarch(base, ids, method, v.caps, level, mode);
          if (!got || got.damage <= 0) continue;
          designs.push({
            key: `${set.key}|${method}|${v.key}|L${String(level)}`,
            subsetIds: ids,
            subset: set.key,
            method,
            level,
            caps: v.caps,
            vectorKey: v.key,
            ...got,
          });
        }
      }
    }
  }
  return dedupe(designs);
}

/** Marches that place the same units are the same march; keep the one with the more generous caps. */
function dedupe(designs: Design[]): Design[] {
  const byCounts = new Map<string, Design>();
  const capsTotal = (caps: Record<string, number>): number =>
    MERC_IDS.reduce((sum, id) => sum + (caps[id] ?? 0), 0);
  for (const design of designs) {
    const key = Object.entries(design.counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, count]) => `${id}:${String(count)}`)
      .join(',');
    const kept = byCounts.get(key);
    if (!kept || capsTotal(design.caps) > capsTotal(kept.caps)) byCounts.set(key, design);
  }
  return [...byCounts.values()];
}

/** `a` is at least as good as `b` on every axis (damage up, silver and lost mercenaries down). */
function dominates(a: Design, b: Design): boolean {
  if (a.damage < b.damage || a.silver > b.silver) return false;
  for (const id of MERC_IDS) if ((a.loss[id] ?? 0) > (b.loss[id] ?? 0)) return false;
  return (
    a.damage > b.damage || a.silver < b.silver || MERC_IDS.some((id) => (a.loss[id] ?? 0) < (b.loss[id] ?? 0))
  );
}

function frontier(designs: Design[]): Design[] {
  const out: Design[] = [];
  for (const design of designs) {
    if (out.some((kept) => dominates(kept, design))) continue;
    for (let i = out.length - 1; i >= 0; i -= 1) if (dominates(design, out[i] as Design)) out.splice(i, 1);
    out.push(design);
  }
  return out.sort((a, b) => b.damage - a.damage || a.silver - b.silver);
}

// ---- The campaign loop -------------------------------------------------------------------------------
interface Step {
  design: Design;
  counts: Record<string, number>;
  damage: number;
  silver: number;
  gold: number;
  seconds: number;
  loss: Record<string, number>;
}

interface State {
  stock: Record<string, number>;
  silver: number;
  gold: number;
  damage: number;
  /** Damage so far plus what the resources still in hand could buy — the beam's ranking key only. */
  score: number;
  steps: Step[];
}

function stepFor(
  base: StackRequest,
  design: Design,
  stock: Record<string, number>,
  mode: RecoveryMode,
): Step | undefined {
  const caps: Record<string, number> = {};
  for (const id of MERC_IDS) caps[id] = Math.min(design.caps[id] ?? 0, stock[id] ?? 0);
  const got = evaluateMarch(base, design.subsetIds, design.method, caps, design.level, mode);
  if (!got || got.damage <= 0) return undefined;
  return {
    design,
    counts: got.counts,
    damage: got.damage,
    silver: got.silver,
    gold: got.gold,
    seconds: got.seconds,
    loss: got.loss,
  };
}

function advance(state: State, step: Step): State {
  const stock = { ...state.stock };
  for (const id of MERC_IDS) stock[id] = Math.max(0, (stock[id] ?? 0) - (step.loss[id] ?? 0));
  return {
    stock,
    silver: state.silver + step.silver,
    gold: state.gold + step.gold,
    damage: state.damage + step.damage,
    score: state.damage + step.damage,
    steps: [...state.steps, step],
  };
}

/** `a` is a better place to continue from than `b`: more stock, less silver and gold, more damage. */
function stateDominates(a: State, b: State): boolean {
  if (a.damage < b.damage || a.silver > b.silver || a.gold > b.gold) return false;
  for (const id of MERC_IDS) if ((a.stock[id] ?? 0) < (b.stock[id] ?? 0)) return false;
  return (
    a.damage > b.damage ||
    a.silver < b.silver ||
    a.gold < b.gold ||
    MERC_IDS.some((id) => (a.stock[id] ?? 0) > (b.stock[id] ?? 0))
  );
}

interface Best {
  state: State;
  fought: number;
}

interface Action {
  design: Design;
  damage: number;
  silver: number;
  loss: number[];
}

/**
 * What the resources left in a state could still be worth, used only to *rank* states inside the beam. It is
 * the best single march repeated as often as both resources allow, so a state that has been frugal — silver
 * and stock still in hand — ranks above one that has already spent everything for the same damage. Ranking
 * on damage alone is exactly the mistake a beam makes on a long campaign.
 */
function lookAhead(
  stock: Record<string, number>,
  silverLeft: number,
  marchesLeft: number,
  actions: Action[],
): number {
  let best = 0;
  for (const action of actions) {
    if (action.damage <= 0) continue;
    let repeats = marchesLeft;
    for (let index = 0; index < MERC_IDS.length; index += 1) {
      const loss = action.loss[index] ?? 0;
      if (loss <= 0) continue;
      const id = MERC_IDS[index] as string;
      repeats = Math.min(repeats, Math.floor((stock[id] ?? 0) / loss));
    }
    if (action.silver > 0) repeats = Math.min(repeats, Math.floor(silverLeft / action.silver));
    if (repeats > 0) best = Math.max(best, repeats * action.damage);
  }
  return best;
}

function prune(states: State[], width: number): State[] {
  // Two states with the same stock and the same bill are the same place; only the best damage matters.
  const unique = new Map<string, State>();
  for (const state of states) {
    const key = `${MERC_IDS.map((id) => state.stock[id] ?? 0).join(',')}|${String(state.silver)}|${String(state.gold)}`;
    const kept = unique.get(key);
    if (!kept || state.damage > kept.damage) unique.set(key, state);
  }
  const kept: State[] = [];
  for (const state of [...unique.values()].sort((a, b) => b.score - a.score)) {
    if (kept.some((other) => stateDominates(other, state))) continue;
    for (let i = kept.length - 1; i >= 0; i -= 1)
      if (stateDominates(state, kept[i] as State)) kept.splice(i, 1);
    kept.push(state);
    if (kept.length >= width) break;
  }
  return kept;
}

function bestPlan(
  base: StackRequest,
  actions: Design[],
  options: {
    marches: number;
    silverBudget: number;
    mode: RecoveryMode;
    stock?: Record<string, number>;
    width?: number;
  },
): Best {
  const list: Action[] = actions.map((design) => ({
    design,
    damage: design.damage,
    silver: design.silver,
    loss: MERC_IDS.map((id) => design.loss[id] ?? 0),
  }));
  const width = options.width ?? BEAM;
  const start: State = {
    stock: { ...CAPS, ...(options.stock ?? {}) },
    silver: 0,
    gold: 0,
    damage: 0,
    score: 0,
    steps: [],
  };
  // Only the highest-damage marches can be the one a frugal state repeats; the look-ahead is a ranking key,
  // not a proof, so the top 30 of them are enough and keep the beam affordable.
  const boundList = [...list].sort((a, b) => b.damage - a.damage).slice(0, 80);
  let beam: State[] = [start];
  let best: Best = { state: start, fought: 0 };
  for (let index = 0; index < options.marches; index += 1) {
    const marchesLeft = options.marches - index;
    const next: State[] = [];
    for (const state of beam) {
      for (const design of list) {
        const step = stepFor(base, design.design, state.stock, options.mode);
        if (!step) continue;
        if (state.silver + step.silver > options.silverBudget) continue;
        const grown = advance(state, step);
        grown.score += lookAhead(
          grown.stock,
          options.silverBudget - grown.silver,
          marchesLeft - 1,
          boundList,
        );
        next.push(grown);
      }
    }
    if (next.length === 0) break;
    beam = prune(next, width);
    for (const state of beam)
      if (state.damage > best.state.damage) best = { state, fought: state.steps.length };
  }
  return best;
}

// ---- Reading a plan ----------------------------------------------------------------------------------
const compactStep = (step: Step): string =>
  `${shortString(Object.fromEntries(MERC_IDS.map((id) => [id, step.counts[id] ?? 0])))} ${(step.damage / 1e6).toFixed(2)}M`;
const compactPlan = (best: Best): string => best.state.steps.map(compactStep).join(' → ');
const stockLeft = (stock: Record<string, number>): string => mercString(stock);

// ---- The file ----------------------------------------------------------------------------------------
describe.skipIf(!process.env.THEORY)('48 few marches', () => {
  it('plans the few-marches regime', () => {
    const report = new Report('48-few-marches');
    const owner = loadOwner();
    const c = withTemple(scenarioC(owner.twelve));
    const b = withTemple(scenarioB(owner.twelve));

    report.add('# 48 — the "few marches" regime');
    report.add('');
    report.add(
      'Every number comes from the engine: `sizeStacks` decides the counts of a march, `simulateBattle` scores ' +
        'it (summary average damage, procs excluded), `recoveryCosts` prices it, `chunks` bills the mercenary ' +
        'stock. Temple 15 (÷1.53). **Scenario C** is the account as it fights today (the 2026-09-14 report), ' +
        "**B** is 0015's scenario; the tables are C, and §7 repeats the three plans under B so they can be read " +
        'against 0015 §6.',
    );
    report.add('');
    report.add(
      '**A march is a sequence, not a constant.** 0015 §6 played the same march every time. Here the plan is a ' +
        'sequence: march *m* may field a different mercenary vector, a different troop set and a different ' +
        "leadership from march *m+1*. The state carried between marches is exactly the game's: silver spent, " +
        'gold spent, and each mercenary stock after `ceil(n/10)` of what that march fielded is gone for good.',
    );
    report.h('1. The hand loop against the engine');
    report.add('');
    report.add(
      '`simulateCampaign` cannot express a sequence of different marches, so the campaign is played by hand. ' +
        'Before anything else the hand loop is checked against the engine on four plans the engine *can* ' +
        'express — same request, same `spend`, same marches, same silver budget.',
    );
    report.add('');
    report.add('| plan | engine `simulateCampaign` | hand loop | identical? |');
    report.add('|---|---|---|---|');
    for (const [label, spend, marches, budget] of [
      ['7 types · 20 % · 3 marches', 0.2, 3, 5_000_000],
      ['7 types · 50 % · 5 marches', 0.5, 5, 5_000_000],
      ['7 types · 100 % · 4 marches', 1, 4, 20_000_000],
      ['8 types · 30 % · 6 marches, 2 M', 0.3, 6, 2_000_000],
    ] as const) {
      const request = withMethod(withUnits(c, [...TROOP_SETS[3].ids, ...MERC_IDS]), 'ms');
      const engine = simulateCampaign(request, { marches, spend, silverBudget: budget });
      const hand = campaignByHand(request, spend, marches, budget);
      const same =
        engine.totalAvg === hand.damage &&
        engine.silver === hand.silver &&
        engine.fought === hand.fought &&
        MERC_IDS.every((id) => (engine.remaining[id] ?? 0) === (hand.remaining[id] ?? 0));
      report.add(
        `| ${label} | fought ${n(engine.fought)} · ${n(engine.totalAvg)} dmg · ${n(engine.silver)} silver · left ${stockLeft(engine.remaining)} | fought ${n(hand.fought)} · ${n(hand.damage)} dmg · ${n(hand.silver)} silver · left ${stockLeft(hand.remaining)} | ${same ? '**yes, to the unit**' : '**NO**'} |`,
      );
    }
    report.add('');

    // ---- 2. The design frontier ------------------------------------------------------------------
    const designs = buildDesigns(c, 'retrain');
    const front = frontier(designs);
    const actions = front;
    report.h('2. What one march can be (scenario C)');
    report.add('');
    report.add(
      `${n(designs.length)} distinct marches collapse to a frontier of **${n(front.length)}** — no other march ` +
        'beats them on damage, silver and lost mercenaries at the same time, so the campaign plays the frontier ' +
        'and nothing else. `L` is the leadership the troop stacks are sized to. `ms` sizes the troops ' +
        'first and keeps every mercenary stack under the smallest troop stack; `elite` fills the leadership ' +
        'with troops and fields the mercenaries at their cap whatever their size.',
    );
    report.add('');
    report.add(
      '| # | troops | method | L | mercenary caps | fielded | avg damage | silver | gold | mercs lost | dmg / silver | dmg / merc lost |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|---|');
    front.slice(0, 24).forEach((design, index) => {
      const lost = totalLoss(design.loss);
      report.add(
        `| ${index + 1} | ${design.subset} | ${design.method} | ${n(design.level)} | ${mercString(design.caps)} | ${mercString(design.counts)} | ${n(design.damage)} | ${n(design.silver)} | ${n(design.gold)} | ${n(lost)} (${mercString(design.loss)}) | ${(design.damage / Math.max(1, design.silver)).toFixed(2)} | ${n(Math.round(design.damage / Math.max(1, lost)))} |`,
      );
    });
    report.add('');
    report.add('The cheapest members of the same frontier — the marches that cost little or no silver:');
    report.add('');
    report.add(
      '| # | troops | method | L | mercenary caps | fielded | avg damage | silver | mercs lost | dmg / merc lost |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|');
    [...front]
      .sort((a, b) => a.silver - b.silver || b.damage - a.damage)
      .slice(0, 8)
      .forEach((design, index) => {
        report.add(
          `| ${index + 1} | ${troopLabel(design)} | ${design.method} | ${n(design.level)} | ${mercString(design.caps)} | ${mercString(design.counts)} | ${n(design.damage)} | ${n(design.silver)} | ${n(totalLoss(design.loss))} | ${n(Math.round(design.damage / Math.max(1, totalLoss(design.loss))))} |`,
        );
      });
    report.add('');
    report.add(
      [
        `The frontier's ${n(front.length)} members are mostly variations on five regimes, and they are what the`,
        'campaign has to choose between:',
        '',
        '- **Full sponges, full mercenaries** (`ms`, L 4,343, 92/76/72/37): 7.88 M for 2.36 M silver and 28',
        '  mercenaries. The strongest single march on the board; 0015 §6 measured the same shape at 7.84 M under B.',
        '- **Small sponges, full mercenaries** (`elite`, L 1,162, 92/76/72/37): 4.73 M for **631,800 silver** and',
        "  **30** mercenaries — 7.5 damage a silver, twice the full sponge's 3.3, because the troops are only",
        '  asked to be a hit slot, not a wall. The mercenary stacks die first here (they out-HP the troops), so',
        '  the stock pays for the damage.',
        '- **Small sponges, small mercenaries** (`ms`, L 1,162, 20/20/10/10 — 0015\'s "cheap march"): 1.90 M for',
        '  631,800 silver and 6 mercenaries: 3.0 damage a silver, but **316 k damage per mercenary** — the stock',
        '  is what it saves.',
        '- **No troops at all** (`L 0`): a mercenaries-only march, and it costs **zero silver** — a hired unit has',
        "  no Army-tab price, so the whole bill is the mercenaries' gold. It is the cheapest damage in the game per",
        '  silver and the worst per mercenary, because with no wall in front of them the mercenary stacks are the',
        '  first four to die and the biggest of them loses its strike. This regime did not exist in 0015 §6: it is',
        '  what a *silver* budget looks like when it is genuinely short.',
        '- **No mercenaries**: a troop-only march, 0.6–1.6 M for 0.4–2.5 M silver. The floor of the plan, and the',
        '  only thing left when the stock is gone.',
      ].join('\n'),
    );
    report.add('');

    // ---- 3. The plan per number of marches ---------------------------------------------------------
    report.h('3. The plan for M marches and a silver budget (scenario C, retrain)');
    report.add('');
    report.add(
      'The best sequence of up to M marches for a silver purse, all paid by recruiting again in the Army tab ' +
        "(the mercenaries' 90 % still costs gold whatever the plan — that gold is in the table). Each cell is " +
        'the winner of the beam over the action set of §2. "fielded" is the mercenary vector of each march in ' +
        "order; the damage after it is that march's average damage.",
    );
    report.add('');
    const RETRAIN: Record<string, Best> = {};
    for (const mode of ['retrain', 'revive'] as const) {
      report.add(`### ${mode === 'retrain' ? 'Retrain (silver only)' : 'Revive (Temple 15, gold)'}`);
      report.add('');
      report.add(
        '| M | silver budget | fought | the marches (mercenaries fielded · damage) | total damage | silver | gold | mercs lost | mercenaries left | damage / silver |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|---|');
      for (const marches of MARCHES) {
        for (const budget of BUDGETS) {
          const best = bestPlan(c, actions, { marches, silverBudget: budget, mode });
          if (mode === 'retrain') RETRAIN[`${String(marches)}|${String(budget)}`] = best;
          const spent = best.state;
          report.add(
            `| ${n(marches)} | ${n(budget)} | ${n(best.fought)} | ${compactPlan(best)} | ${n(spent.damage)} | ${n(spent.silver)} | ${n(spent.gold)} | ${n(CAPS && MERC_IDS.reduce((sum, id) => sum + (CAPS[id] ?? 0) - (spent.stock[id] ?? 0), 0))} | ${stockLeft(spent.stock)} | ${(spent.damage / Math.max(1, spent.silver)).toFixed(2)} |`,
          );
        }
      }
      report.add('');
    }
    report.add(
      'Rows where `fought` is below M are budgets that cannot pay for M marches: the plan fights as many as ' +
        'the purse allows, which is the honest answer to "the best plan for M marches" when M is not affordable. ' +
        'The same question with silver out of the picture is below.',
    );
    report.add('');
    report.add('#### The plan for M marches with silver unlimited (stock-bound)');
    report.add('');
    report.add(
      '| M | mode | sequence (mercenaries fielded · damage) | total damage | silver | gold | mercs lost | mercenaries left |',
    );
    report.add('|---|---|---|---|---|---|---|---|');
    for (const mode of ['retrain', 'revive'] as const) {
      for (const marches of MARCHES) {
        const best = bestPlan(c, actions, { marches, silverBudget: Infinity, mode });
        const spent = best.state;
        report.add(
          `| ${n(marches)} | ${mode} | ${compactPlan(best)} | ${n(spent.damage)} | ${n(spent.silver)} | ${n(spent.gold)} | ${n(MERC_IDS.reduce((sum, id) => sum + (CAPS[id] ?? 0) - (spent.stock[id] ?? 0), 0))} | ${stockLeft(spent.stock)} |`,
        );
      }
    }
    report.add('');
    // ---- The search checked against brute force and against its own width -------------------------
    report.add('#### The search checked against brute force and against its own width');
    report.add('');
    report.add(
      'A beam is a heuristic, so it is checked where an exhaustive answer is affordable: **M = 1** against ' +
        'every one of the 465 designs, **M = 2** against every pair of the frontier, and **M = 3 and M = 10** ' +
        'against the same search run at four times the beam width.',
    );
    report.add('');
    report.add('| check | brute force | beam | same? |');
    report.add('|---|---|---|---|');
    for (const budget of [500_000, 1_100_000, 2_000_000, 5_000_000]) {
      let bestDesign: Design | undefined;
      for (const design of designs) {
        if (design.silver > budget) continue;
        if (!bestDesign || design.damage > bestDesign.damage) bestDesign = design;
      }
      const beam = bestPlan(c, actions, { marches: 1, silverBudget: budget, mode: 'retrain' });
      report.add(
        `| M = 1, ${n(budget)} silver: best of all ${n(designs.length)} designs | ${n(bestDesign?.damage ?? 0)} (${bestDesign?.subset ?? '—'} ${bestDesign?.method ?? ''} L${n(bestDesign?.level ?? 0)}) | ${n(beam.state.damage)} | ${bestDesign?.damage === beam.state.damage ? '**yes**' : '**NO**'} |`,
      );
    }
    for (const budget of [1_100_000, 2_000_000]) {
      let bestPair = 0;
      for (const first of actions) {
        const one = stepFor(c, first, { ...CAPS }, 'retrain');
        if (!one || one.silver > budget) continue;
        const after: Record<string, number> = {};
        for (const id of MERC_IDS) after[id] = Math.max(0, (CAPS[id] ?? 0) - (one.loss[id] ?? 0));
        for (const second of actions) {
          const two = stepFor(c, second, after, 'retrain');
          if (!two || one.silver + two.silver > budget) continue;
          bestPair = Math.max(bestPair, one.damage + two.damage);
        }
      }
      const beam = bestPlan(c, actions, { marches: 2, silverBudget: budget, mode: 'retrain' });
      report.add(
        `| M = 2, ${n(budget)} silver: every pair of the ${n(actions.length)} frontier marches | ${n(bestPair)} | ${n(beam.state.damage)} | ${bestPair === beam.state.damage ? '**yes**' : '**NO**'} |`,
      );
    }
    for (const [marches, budget] of [
      [3, 1_100_000],
      [10, 5_000_000],
    ] as const) {
      const narrow = bestPlan(c, actions, { marches, silverBudget: budget, mode: 'retrain', width: 150 });
      const wide = bestPlan(c, actions, { marches, silverBudget: budget, mode: 'retrain', width: 600 });
      report.add(
        `| M = ${n(marches)}, ${n(budget)} silver: beam width 150 against width 600 | ${n(narrow.state.damage)} | ${n(wide.state.damage)} | ${narrow.state.damage === wide.state.damage ? '**yes**' : '**NO**'} |`,
      );
    }
    report.add('');

    // ---- 4. The schedule question -----------------------------------------------------------------
    report.h('4. Does the schedule matter? Front-loading, back-loading, burning the last stock');
    report.add('');
    report.add(
      "Three marches, the same three troop stacks (`ARC2·RD2·RD3`), and each march's sponge sized to the " +
        'smallest leadership that still puts every troop stack above every mercenary stack — so no schedule is ' +
        'charged for a wall it does not need and none is caught with mercenaries dying first. The schedules are ' +
        'explicit mercenary vectors, not fractions, so the same multiset can be played in either order: ' +
        '**descending** 60/50/40/20 → 40/30/30/10 → 20/20/10/10 and **ascending** 20/20/10/10 → 40/30/30/10 → ' +
        '60/50/40/20 field the same three vectors in opposite orders.',
    );
    report.add('');
    const V = {
      big: { 'epic-monster-hunter-6': 60, 'arbalester-6': 50, 'legionary-6': 40, 'chariot-6': 20 },
      mid: { 'epic-monster-hunter-6': 40, 'arbalester-6': 30, 'legionary-6': 30, 'chariot-6': 10 },
      small: { 'epic-monster-hunter-6': 20, 'arbalester-6': 20, 'legionary-6': 10, 'chariot-6': 10 },
    };
    const SCHEDULES: [string, Record<string, number>[]][] = [
      ['constant 60/50/40/20', [V.big, V.big, V.big]],
      ['constant 40/30/30/10', [V.mid, V.mid, V.mid]],
      ['constant 20/20/10/10', [V.small, V.small, V.small]],
      ['**descending** big → mid → small', [V.big, V.mid, V.small]],
      ['**ascending** small → mid → big', [V.small, V.mid, V.big]],
      ['keep back, **burn the last stock** mid → mid → everything left', [V.mid, V.mid, { ...CAPS }]],
    ];
    for (const [mode, budget] of [
      ['retrain', 20_000_000],
      ['retrain', 1_500_000],
      ['revive', 5_000_000],
    ] as const) {
      report.add(
        `#### ${mode === 'retrain' ? 'Retrain' : 'Revive'}, ${n(budget)} silver${budget < 2_000_000 ? ' (a budget that cannot pay for all three)' : ''}`,
      );
      report.add('');
      report.add(
        '| schedule | fielded | damage per march | total damage | silver | gold | mercs burned | damage / merc burned | mercenaries left |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|');
      for (const [label, vectors] of SCHEDULES) {
        const played = playVectors(c, TROOP_SETS[2].ids, vectors, budget, mode);
        const burned = MERC_IDS.reduce((sum, id) => sum + (CAPS[id] ?? 0) - (played.stock[id] ?? 0), 0);
        report.add(
          `| ${label} | ${played.steps.map((step) => shortString(step.counts)).join(' → ')} | ${played.steps.map((step) => `${(step.damage / 1e6).toFixed(2)}M`).join(' → ')} | ${n(played.damage)} | ${n(played.silver)} | ${n(played.gold)} | ${n(burned)} | ${n(Math.round(played.damage / Math.max(1, burned)))} | ${stockLeft(played.stock)}${played.stopped ? ' *(stopped: budget)*' : ''} |`,
        );
      }
      report.add('');
    }
    report.add(
      [
        '**The order does not matter; the total does — and the tenth rule is why.** Reading the two schedules that',
        'field the same three vectors:',
        '',
        '- **Descending and ascending are the same plan.** Damage, silver and stock burned come out identical to',
        '  the unit, because the bill for a march is `ceil(n/10)` per type and the sum over a multiset does not',
        "  care about the order. A mercenary stack's damage is its size times the number of hits it gets, and its",
        '  hits come from its *position*, which the sponge fixes — not from when in the campaign it fights. There',
        '  is no compounding, no ramp and no discount to be had from ordering within a fixed multiset.',
        '- **Order only matters when the purse runs out — and then it is not buying damage, it is choosing which',
        '  marches reach the purse at all.** At `1,500,000` silver the descending schedule cannot pay for its',
        '  *first* march (a 60/50/40/20 vector needs a 1.7 M-silver sponge) and fights nothing at all; the ascending',
        '  one buys the cheap march first and gets one march in; the constant 20/20/10/10 gets two. Back-loading',
        '  does not add damage, it only makes sure the marches that *are* affordable are the cheap ones.',
        '- **"Burn the last of the stock" wins by exactly the units a rationed plan was holding back.** It is the',
        '  same three marches with the last one fielding everything left instead of 40/30/30/10: more mercenaries',
        '  fielded, more damage, more silver, more stock gone. It is a bigger plan, not a better-ordered one.',
        '',
        "So 0015 §6's constant-size plan was not leaving anything on the table by being constant: given a fixed",
        'total spend and a fixed number of marches, every order is worth the same. What the campaign can choose',
        'is **how much stock to burn in total**, and that is what §3 chooses.',
      ].join('\n'),
    );
    report.add('');
    // The campaign is really two resources, and the sponge is the exchange rate between them.
    const tenPlan = bestPlan(c, actions, { marches: 10, silverBudget: 1_100_000, mode: 'retrain' });
    const allOut: Record<string, number>[] = [];
    const decay: Record<string, number> = { ...CAPS };
    for (let index = 0; index < 10; index += 1) {
      allOut.push({ ...decay });
      for (const id of MERC_IDS) decay[id] = Math.max(0, (decay[id] ?? 0) - chunks(decay[id] ?? 0));
    }
    report.add('#### The exchange rate the campaign actually faces: the sponge');
    report.add('');
    report.add(
      'M = 10, retrain. Three ways to spend the same stock: **field everything that is left every march with a ' +
        'real sponge in front of it** (each march charged the smallest leadership that protects its vector), the ' +
        'same schedule with the purse this account really has, and **the plan of §3**.',
    );
    report.add('');
    report.add(
      '| schedule | silver budget | total damage | silver | mercs burned | damage / merc burned | damage / silver |',
    );
    report.add('|---|---|---|---|---|---|---|');
    const allOutUncapped = playVectors(c, TROOP_SETS[2].ids, allOut, Infinity, 'retrain');
    const allOutCapped = playVectors(c, TROOP_SETS[2].ids, allOut, 1_100_000, 'retrain');
    const planBurned = MERC_IDS.reduce(
      (sum, id) => sum + (CAPS[id] ?? 0) - (tenPlan.state.stock[id] ?? 0),
      0,
    );
    for (const [label, played, burned, budget] of [
      ['field everything left, minimum sponge', allOutUncapped, 193, 'uncapped'],
      ['the same, with his purse', allOutCapped, 0, n(1_100_000)],
      [
        '**the plan of §3**',
        { damage: tenPlan.state.damage, silver: tenPlan.state.silver },
        planBurned,
        n(1_100_000),
      ],
    ] as const) {
      report.add(
        `| ${label} | ${typeof budget === 'string' ? budget : n(budget)} | ${n(played.damage)} | ${n(played.silver)} | ${n(burned)} | ${n(Math.round(played.damage / Math.max(1, burned)))} | ${(played.damage / Math.max(1, played.silver)).toFixed(2)} |`,
      );
    }
    report.add('');
    report.add(
      [
        'This is the whole of the campaign decision in three lines. **Fielding everything with a real sponge is the',
        'most damage the stock can be made to deal** — 53.3 M, 276 K a mercenary — and it costs 19.6 M silver,',
        'because a vector of 92/76/72/37 needs a 2.4 M-silver wall in front of it or the mercenaries die first.',
        '**At 1.1 M silver that schedule is not payable at all: it fights zero marches.** The plan of §3 does the',
        'opposite and wins his purse: it fields *cheap, unprotected* marches (mercenaries only, no troops to pay',
        'for) and spends the silver where a wall buys the most hits, so its damage per mercenary is less than half',
        'of the all-out figure but its damage per silver is **nine times higher** (24 against 2.7).',
        '',
        'So the answer to "is he short of silver or of mercenaries" is: **he is short of the resource he cannot',
        'print.** With 1.1 M silver the mercenaries cannot all be protected and the stock is what limits the',
        'damage; with the gold of §6 the Temple converts silver into gold and *then* the silver stops binding and',
        'the stock does, which is exactly what plan B buys.',
      ].join('\n'),
    );
    report.add('');

    // ---- 5. The exchange rate ---------------------------------------------------------------------
    report.h('5. The exchange rate: what is he short of?');
    report.add('');
    report.add(
      [
        'Marginal value, measured by re-running the best plan at the margin — +100,000 silver, or +1 / +10',
        'mercenaries of one type — and reading the difference in total damage. "With the plan held fixed" means',
        'the same beam, the same objective and the same stock; only the named resource moves.',
      ].join(' '),
    );
    report.add('');
    report.add('| setting | +100,000 silver buys |');
    report.add('|---|---|');
    const silverRows: string[] = [];
    for (const [marches, budget, mode] of [
      [3, 1_100_000, 'retrain'],
      [3, 2_000_000, 'retrain'],
      [10, 5_000_000, 'retrain'],
      [3, 1_100_000, 'revive'],
    ] as const) {
      const base0 = bestPlan(c, actions, { marches, silverBudget: budget, mode });
      const plus = bestPlan(c, actions, { marches, silverBudget: budget + 100_000, mode });
      const delta = plus.state.damage - base0.state.damage;
      silverRows.push(
        `| M = ${n(marches)}, ${n(budget)} silver, ${mode} | **${n(delta)}** damage per 100,000 silver → ${(delta / 100_000).toFixed(2)} damage per silver |`,
      );
    }
    report.add(silverRows.join('\n'));
    report.add('');
    report.add(
      '| mercenary stock | M = 3, 2 M silver, retrain: +1 unit | +10 units | damage per unit of stock |',
    );
    report.add('|---|---|---|---|');
    for (const id of MERC_IDS) {
      const base0 = bestPlan(c, actions, { marches: 3, silverBudget: 2_000_000, mode: 'retrain' });
      const one = bestPlan(c, actions, {
        marches: 3,
        silverBudget: 2_000_000,
        mode: 'retrain',
        stock: { [id]: (CAPS[id] ?? 0) + 1 },
      });
      const ten = bestPlan(c, actions, {
        marches: 3,
        silverBudget: 2_000_000,
        mode: 'retrain',
        stock: { [id]: (CAPS[id] ?? 0) + 10 },
      });
      const d1 = one.state.damage - base0.state.damage;
      const d10 = ten.state.damage - base0.state.damage;
      report.add(
        `| ${SHORT[id] ?? id} (${n(CAPS[id] ?? 0)} in stock) | ${n(d1)} | ${n(d10)} | ${n(Math.round(d10 / 10))} |`,
      );
    }
    report.add('');
    report.add(
      [
        '**A mercenary of stock is worth exactly what it hits for, and the four types are not interchangeable.**',
        '+10 units buys ten times +1 to the digit, because the damage of a stack is linear in its size: the marginal',
        "unit is fielded in a later march where the stock was the binding constraint, and it adds one unit's share of",
        "that stack's hits. Ranked by damage per unit of stock in the winning plan: **CHR6 29,754 · ABT6 15,200 ·",
        'LGN6 11,115 · EMH6 9,114** — which is the reverse of the "damage per hit" ranking of §2, and it is not an',
        'accident: CHR6 and ABT6 sit *below* the EMH6 stack in the kill order, so they keep their strike in both',
        'journals, while the biggest EMH6 stack is the first victim and loses its enemy-first hit (0/1 hits: it is',
        'worth half of what it hits for).',
        '',
        'Two consequences he can act on. **(a)** The stock to be short of is CHR6, not EMH6 — the smallest stock of',
        'the four is also the most valuable per unit. **(b)** The chunk rule still sets the *price*: stock is billed',
        '`ceil(n/10)`, so fielding 71 units costs what 80 costs, and a plan that fields a ragged vector is paying',
        'for units it is not using. Damage is linear in units, the bill is not, which is why the frontier designs',
        'all field round numbers.',
      ].join('\n'),
    );
    report.add('');
    report.add(
      '| per-mercenary damage in the winning design (M = 3, 2 M, retrain) | fielded | damage per hit | hits | damage per march | damage per fielded unit |',
    );
    report.add('|---|---|---|---|---|---|');
    const focus = bestPlan(c, actions, { marches: 3, silverBudget: 2_000_000, mode: 'retrain' });
    const focusMarch = focus.state.steps[0];
    if (focusMarch) {
      const ev = evaluateCounts(c, focusMarch.counts);
      for (const row of lines(ev)) {
        const hits = row.hitsEnemyFirst + row.hitsArmyFirst;
        const perHits = hits > 0 ? Math.round((row.damageEnemyFirst + row.damageArmyFirst) / hits) : 0;
        report.add(
          `| ${row.label} | ${n(row.count)} | ${n(row.damagePerHit)} | ${row.hitsEnemyFirst}/${row.hitsArmyFirst} | ${n(row.damageEnemyFirst + row.damageArmyFirst)} | ${n(perHits)} |`,
        );
      }
    }
    report.add('');

    // ---- 6. Revive against retrain, per unit ------------------------------------------------------
    report.h('6. Revive or retrain, per unit type');
    report.add('');
    report.add(
      [
        'Reviving instead of retraining one unit saves `training.silver × 1.53 / revival.gold` of silver per gold',
        'spent — a property of the unit type alone, independent of the march. The engine charges the tenth of',
        'every stack either way (`recoveryOne`), so the ratio is the whole decision.',
      ].join(' '),
    );
    report.add('');
    report.add(
      '| rank | unit | training silver | revival gold | gold at temple 15 | **silver saved per gold** | silver saved per potion (3 a unit) | seconds saved per gold |',
    );
    report.add('|---|---|---|---|---|---|---|---|');
    const rates = [...TROOPS, ...MERC_IDS]
      .map((id) => unitById(id))
      .filter((unit): unit is NonNullable<typeof unit> => unit !== undefined)
      .map((unit) => ({
        unit,
        silver: unit.training?.silver ?? 0,
        seconds: unit.training?.seconds ?? 0,
        gold: unit.revival.gold / templeDivisor(TEMPLE),
        perGold: ((unit.training?.silver ?? 0) * templeDivisor(TEMPLE)) / unit.revival.gold,
      }))
      .sort((a, b) => b.perGold - a.perGold);
    rates.forEach((rate, index) => {
      report.add(
        `| ${index + 1} | ${rate.unit.label} | ${rate.silver > 0 ? n(rate.silver) : '— (hired)'} | ${n(rate.unit.revival.gold)} | ${n(Math.round(rate.gold * 100) / 100)} | **${rate.perGold > 0 ? n(Math.round(rate.perGold * 100) / 100) : '0 — saves no silver'}** | ${rate.silver > 0 ? n(Math.round(rate.silver / 3)) : '0'} | ${rate.silver > 0 ? n(Math.round((rate.seconds * templeDivisor(TEMPLE)) / rate.unit.revival.gold)) : '0'} |`,
      );
    });
    report.add('');
    const check = bestPlan(c, actions, { marches: 3, silverBudget: 2_000_000, mode: 'retrain' });
    const checkStep = check.state.steps[0];
    if (checkStep) {
      const request = withPlan(withUnits(c, [...TROOP_SETS[2].ids, ...MERC_IDS]), 'retrain');
      const result = sizeStacks({ ...request, caps: checkStep.counts });
      const asRetrain = recoveryCosts(result.stacks, request.units, withPlan(request, 'retrain').recovery);
      const asRevive = recoveryCosts(result.stacks, request.units, withPlan(request, 'revive').recovery);
      report.add('**Hand-check on a real march** (the first march of the M = 3, 2 M plan):');
      report.add('');
      report.add('| stack | units | retrain silver | revive silver | retrain gold | revive gold |');
      report.add('|---|---|---|---|---|---|');
      for (const stack of result.stacks) {
        const unit = request.units.find((candidate) => candidate.id === stack.unitId);
        if (!unit) continue;
        const r = retrainOne(unit, stack.count, withPlan(request, 'retrain').recovery);
        const v = reviveOne(unit, stack.count, withPlan(request, 'revive').recovery);
        report.add(
          `| ${unit.label} | ${n(stack.count)} | ${n(r.silver)} | ${n(v.silver)} | ${n(r.gold)} | ${n(v.gold)} |`,
        );
      }
      report.add(
        `| **total** | | ${n(asRetrain.retrain.silver)} | ${n(asRevive.revive.silver)} | ${n(asRetrain.retrain.gold)} | ${n(asRevive.revive.gold)} |`,
      );
      report.add('');
      report.add(
        `Reviving divides this march's silver by ${(asRetrain.retrain.silver / Math.max(1, asRevive.revive.silver)).toFixed(1)} ` +
          `and adds ${n(asRevive.revive.gold - asRetrain.retrain.gold)} gold. The mercenaries' gold ` +
          `(${n(MERC_IDS.reduce((sum, id) => sum + reviveOne(unitById(id) as NonNullable<ReturnType<typeof unitById>>, checkStep.counts[id] ?? 0, withPlan(request, 'retrain').recovery).gold, 0))}) ` +
          'is charged either way — nothing buys a mercenary back.',
      );
    }
    report.add('');
    report.add(
      [
        '**What to do with gold.** Ranked by silver saved per gold spent: **RD3 268**, then every tier-2 type at',
        '191 (ARC2, SP2, RD2 — a rider II costs twice an archer II and revives for twice the gold, so they tie),',
        'then every tier-1 type at 115 (SW1, ARC1, SP1, RD1), then the four mercenaries at **0**. Gold spent on',
        'reviving a mercenary saves no silver at all — it is charged under the retrain plan too, because a hired',
        "unit has no Army-tab price. The Temple's own TOP 1–4 selective revive spends the first four steps on",
        'the four tier-6 mercenaries, which saves exactly nothing; TOP 5 and beyond start on the troops.',
        '',
        'So: **spend gold on the troops, never on the mercenaries, and if gold is short start with RD3.** The',
        'honest caveat is that the game UI may bill troops per unit and monsters/mercenaries per chunk of ten',
        '(`reviveOne` bills `chunks()` for every pool) — see §9.',
      ].join('\n'),
    );

    // ---- 7. Three plans he can execute ------------------------------------------------------------
    report.h('7. Three plans for this week');
    report.add('');
    const plans: { name: string; best: Best; mode: RecoveryMode; when: string }[] = [
      {
        name: 'A — his purse, no gold (10 marches)',
        best: bestPlan(c, actions, { marches: 10, silverBudget: 1_100_000, mode: 'retrain' }),
        mode: 'retrain',
        when:
          '**silver ≈ 1.1 M, gold under about 10 K.** Every troop stack is recruited again in the Army tab ' +
          "(the mercenaries' 90 % is gold either way: about 9 K for the ten marches). It is the most damage " +
          'that purse can buy in ten marches, and it spends most of the stock doing it',
      },
      {
        name: 'B — his purse plus gold (10 marches)',
        best: bestPlan(c, actions, { marches: 10, silverBudget: 1_100_000, mode: 'revive' }),
        mode: 'revive',
        when:
          '**the same ≈ 1.1 M silver and about 55 K gold.** The Temple brings back 90 % of every stack, so the ' +
          'troops cost a tenth of the silver and the purse buys real sponges: +64 % damage over plan A for the ' +
          'same silver and the same stock burned. This is the plan to fight if the gold is there',
      },
      {
        name: 'C — keep some stock for next week (3 marches)',
        best: bestPlan(c, actions, { marches: 3, silverBudget: 1_100_000, mode: 'revive' }),
        mode: 'revive',
        when:
          '**the same silver and about 35 K gold, and he does not want the stock gone.** Three full-sponge ' +
          "marches burn 75 of the 277 hired units for 22.4 M — 298 K a mercenary against plan B's 232 K — and " +
          'leave him 202 mercenaries should a better week come. Pick it over B only if the stock matters more ' +
          "than this week's damage",
      },
    ];
    report.add(
      '| plan | fought | silver | gold | training time | total damage | mercs lost | mercenaries left |',
    );
    report.add('|---|---|---|---|---|---|---|---|');
    for (const plan of plans) {
      const seconds = plan.best.state.steps.reduce((sum, step) => sum + step.seconds, 0);
      report.add(
        `| ${plan.name} | ${n(plan.best.fought)} | ${n(plan.best.state.silver)} | ${n(plan.best.state.gold)} | ${duration(seconds)} | ${n(plan.best.state.damage)} | ${n(MERC_IDS.reduce((sum, id) => sum + (CAPS[id] ?? 0) - (plan.best.state.stock[id] ?? 0), 0))} | ${stockLeft(plan.best.state.stock)} |`,
      );
    }
    report.add('');
    for (const plan of plans) {
      report.add(`### ${plan.name}`);
      report.add('');
      report.add(`**The marches, in order** (${plan.mode} prices):`);
      report.add('');
      plan.best.state.steps.forEach((step, index) => {
        report.add(
          `- **m${String(index + 1)}** — ${countString(step.counts)} → ${n(step.damage)} damage, ${n(step.silver)} silver, ${n(step.gold)} gold, ${duration(step.seconds)} training, loses ${n(totalLoss(step.loss))} mercenaries (${mercString(step.loss)})`,
        );
      });
      report.add('');
      report.add(
        `Sizer settings: ${plan.best.state.steps.map((step) => `${step.design.subset} ${step.design.method} L${n(step.design.level)} caps ${mercString(step.design.caps)}`).join(' · ')}`,
      );
      report.add('');
      if (plan.best.state.steps[0]) {
        const first = plan.best.state.steps[0];
        report.add('First march, stack by stack (`evaluateCounts`, the same numbers the app would show):');
        report.add('');
        report.add(table(evaluateCounts(c, first.counts)));
        report.add('');
      }
      report.add(`**Right when:** ${plan.when}.`);
      report.add('');
    }
    const marginalSilver =
      bestPlan(c, actions, { marches: 10, silverBudget: 1_100_000, mode: 'retrain' }).state.damage -
      bestPlan(c, actions, { marches: 10, silverBudget: 1_000_000, mode: 'retrain' }).state.damage;
    const [planA, planB, planC] = plans;
    if (planA && planB && planC) {
      const a = planA.best.state;
      const bb = planB.best.state;
      const cc = planC.best.state;
      const burned = (state: State): number =>
        MERC_IDS.reduce((sum, id) => sum + (CAPS[id] ?? 0) - (state.stock[id] ?? 0), 0);
      const perMerc = (state: State): number => Math.round(state.damage / Math.max(1, burned(state)));
      report.add(
        [
          '**How the three compare.**',
          '',
          `- **Gold is the best buy on this account.** B beats A by **${n(bb.damage - a.damage)} damage**`,
          `  (${((bb.damage / Math.max(1, a.damage) - 1) * 100).toFixed(0)} %) for **${n(Math.round(bb.gold - a.gold))} more gold** and`,
          `  ${n(Math.abs(a.silver - bb.silver))} ${a.silver >= bb.silver ? 'less' : 'more'} silver — ${n(Math.round((bb.damage - a.damage) / Math.max(1, bb.gold - a.gold)))} damage per gold. The`,
          '  Temple is turning gold into sponge HP, and sponge HP is what keeps the mercenary stacks striking.',
          `- **Stock is the one resource nothing buys back.** A burns ${n(burned(a))} of the 277 hired units, B`,
          `  ${n(burned(bb))}, C only ${n(burned(cc))}. Per mercenary burned C is the best of the three`,
          `  (${n(perMerc(cc))} against A's ${n(perMerc(a))} and B's ${n(perMerc(bb))}) — fewer, better-protected marches is how`,
          '  a stock is made to last, and it is the only lever that does not spend silver or gold.',
          `- **What silver is worth.** A spends all ${n(a.silver)} of its purse on one protected march in the`,
          `  middle of ten; the other nine are mercenaries-only marches that cost **no silver at all** (a hired unit`,
          '  has no Army-tab price), which is why the same purse reaches so far. The last 100 K of silver in A buys',
          `  about ${n(marginalSilver)} damage (§5), and that rate — not the march it is spent on — is what he is`,
          '  choosing between.',
        ].join('\n'),
      );
      report.add('');
    }
    // ---- 8. The same three plans under B ----------------------------------------------------------
    report.h("8. The same plans under B (0015's scenario)");
    report.add('');
    const bDesigns = buildDesigns(b, 'retrain');
    const bActions = frontier(bDesigns);
    report.add('| M | budget | mode | fought | sequence | total damage (B) | silver | gold | left |');
    report.add('|---|---|---|---|---|---|---|---|---|');
    for (const [marches, budget, mode] of [
      [1, 1_100_000, 'retrain'],
      [3, 1_100_000, 'retrain'],
      [3, 1_100_000, 'revive'],
      [3, 2_000_000, 'retrain'],
      [10, 5_000_000, 'retrain'],
    ] as const) {
      const best = bestPlan(b, bActions, { marches, silverBudget: budget, mode });
      report.add(
        `| ${n(marches)} | ${n(budget)} | ${mode} | ${n(best.fought)} | ${compactPlan(best)} | ${n(best.state.damage)} | ${n(best.state.silver)} | ${n(best.state.gold)} | ${stockLeft(best.state.stock)} |`,
      );
    }
    report.add('');

    // ---- 9. What could not be settled -------------------------------------------------------------
    report.h('9. To check in game, and what failed');
    report.add('');
    report.add(
      [
        '- **Per unit or per chunk in the recovery UI — unresolved, and load-bearing.** `recovery.ts` bills',
        '  `chunks(n) × training.silver` for *every* pool on the revive path (`reviveOne`), and `n ×',
        '  training.silver` for troops on the retrain path (`retrainOne`). The two agree for troops at a tenth of',
        "  the price (170 chunks ≈ 170 units for a 1,697-unit stack), which is why §6's ÷10 came out right, but a",
        '  UI that billed them per chunk of ten *recruited* would raise the same bill for a stack of 44 and for a',
        '  stack of 50, and would make every retrain plan in §3 and §7 five to ten per cent cheaper than stated.',
        '  **In-game reading that settles it:** lose a troop stack of about 45 units (a count that is not a',
        '  multiple of ten) in a march, open the Army tab and read the exact silver the recruit screen asks for —',
        '  `45 × training.silver` means per unit, `5 × training.silver` means per chunk.',
        '- **Whether the March pane can hold a troop budget below the housing — unresolved, and the plans depend',
        '  on it.** Every plan in §7 is a set of (sizer method, leadership target, mercenary caps): the cheap',
        '  marches are `L 0` — no troops at all, the whole leadership left unused — and the protected one is a',
        '  leadership well under 4,343. 0015 §6 already flagged the missing engine feature ("a troop budget in',
        '  `CampaignSettings`"); the app reaches the same marches today by **excluding every troop type from the',
        '  march** (the cheap ones) or by editing the counts of the four troop stacks directly (the protected one).',
        '  **To check in the app:** open a march, drop all eight troop types, and see whether the mercenary stacks',
        '  are still sized to their stock — if they are, the `L 0` marches of §7 are executable as they stand.',
        '- **Whether training runs in parallel across unit types — unresolved.** It decides whether time, not',
        "  silver, is the real second constraint on a 10-march campaign: at the account's +47.9 % training speed",
        '  the full 7-type march needs 7 d 21 h of training serially and about 2 d in parallel. **In-game',
        '  reading:** queue a troop type in the Army tab and a second, different type at the same time; if both',
        '  timers run, training is parallel.',
        '- **Failed hypotheses**, all measured in §4 and §3. (a) "front-loading the mercenaries wins": it does not',
        '  — the same multiset of marches in either order gives the same damage, silver and stock to the unit; only',
        '  the *total* burn matters. (b) "rationing mercenaries across a fixed number of marches preserves damage":',
        '  it does not, and for the same reason — the decay is multiplicative on what is left, so rationing fields',
        '  strictly fewer units and never buys a hit. (c) "a fourth sponge stack always pays": it does not — the',
        '  four-sponge set and the 8-troop set only appear at the top of the damage range, where silver is not',
        '  binding. (d) "a march with no troops is a waste": it is not — nine of plan A\'s ten marches have no',
        '  troops at all and cost **zero silver**, and they are what lets a 1.1 M',
        '  purse buy ten marches. What the troops buy is *hits*: 24 damage a silver in plan A against 2.7 for a',
        '  campaign that protects every vector (§4).',
        '- **Not modelled by the engine, so not claimed here:** double damage and strike-two-squads procs (upside',
        '  the summary excludes), the enemy formation changing between marches, and the training time of the',
        '  retrain plans (a plan that costs 2.4 M silver and 11 days of training is not executable this week —',
        '  §7 states the time where it matters).',
      ].join('\n'),
    );
    report.save();
  }, 1_800_000);
});

/**
 * The smallest leadership at which the sponge still out-HPs every mercenary stack, with the mercenaries
 * fielded at their cap (`elite`). If no level can protect the vector — a mercenary stack bigger than the
 * whole leadership can sponge — the biggest sponge the housing allows is used and the mercenaries die
 * first, which is what the engine then charges.
 */
function minSponge(
  base: StackRequest,
  troopIds: readonly string[],
  caps: Record<string, number>,
  mode: RecoveryMode,
): { level: number; march: March } {
  const ids = [...troopIds, ...MERC_IDS];
  let fallback: { level: number; march: March } | undefined;
  for (const level of LEVELS) {
    const got = evaluateMarch(base, ids, 'elite', caps, level, mode);
    if (!got || got.damage <= 0) continue;
    if (got.above) return { level, march: got };
    fallback = { level, march: got };
  }
  const level = LEVELS[LEVELS.length - 1] as number;
  const march = evaluateMarch(base, ids, 'elite', caps, level, mode) ?? fallback?.march;
  if (!march) throw new Error('no march');
  return { level, march };
}

/** Play an explicit schedule of mercenary vectors; each march's sponge is the smallest one that protects it. */
function playVectors(
  base: StackRequest,
  troopIds: readonly string[],
  vectors: Record<string, number>[],
  silverBudget: number,
  mode: RecoveryMode,
): {
  damage: number;
  silver: number;
  gold: number;
  seconds: number;
  stock: Record<string, number>;
  steps: Step[];
  stopped: boolean;
} {
  const stock: Record<string, number> = { ...CAPS };
  let damage = 0;
  let silver = 0;
  let gold = 0;
  let seconds = 0;
  let stopped = false;
  const steps: Step[] = [];
  for (const wanted of vectors) {
    const caps: Record<string, number> = {};
    for (const id of MERC_IDS) caps[id] = Math.min(wanted[id] ?? 0, stock[id] ?? 0);
    const { level, march } = minSponge(base, troopIds, caps, mode);
    if (silver + march.silver > silverBudget) {
      stopped = true;
      break;
    }
    for (const id of MERC_IDS) stock[id] = Math.max(0, (stock[id] ?? 0) - (march.loss[id] ?? 0));
    damage += march.damage;
    silver += march.silver;
    gold += march.gold;
    seconds += march.seconds;
    steps.push({
      design: {
        key: `schedule|${String(level)}|${mercString(caps)}`,
        subsetIds: [...troopIds, ...MERC_IDS],
        subset: 'ARC2·RD2·RD3',
        method: 'elite',
        level,
        caps,
        vectorKey: 'schedule',
        ...march,
      },
      counts: march.counts,
      damage: march.damage,
      silver: march.silver,
      gold: march.gold,
      seconds: march.seconds,
      loss: march.loss,
    });
  }
  return { damage, silver, gold, seconds, stock, steps, stopped };
}

/** The hand loop: `simulateCampaign`'s own rule, spelled out, for the §1 validation table. */
function campaignByHand(
  request: StackRequest,
  spend: number,
  marches: number,
  silverBudget: number,
): { fought: number; damage: number; silver: number; gold: number; remaining: Record<string, number> } {
  const stock: Record<string, number> = {};
  for (const [id, cap] of Object.entries(request.caps)) stock[id] = Math.max(0, Math.floor(cap));
  let damage = 0;
  let silver = 0;
  let gold = 0;
  let fought = 0;
  for (let index = 0; index < marches; index += 1) {
    const caps: Record<string, number> = {};
    for (const id of Object.keys(stock)) {
      const target = Math.max(1, Math.ceil(spend * Math.max(0, Math.floor(CAPS[id] ?? 0))));
      caps[id] = Math.min(target, stock[id] ?? 0);
    }
    const scoped: StackRequest = { ...request, caps };
    const result = sizeStacks(scoped);
    const summary = simulateBattle(result, scoped);
    if (silver + summary.recovery.silver > silverBudget) break;
    for (const stack of result.stacks) {
      if (!(stack.unitId in stock)) continue;
      stock[stack.unitId] = Math.max(0, (stock[stack.unitId] ?? 0) - chunks(stack.count));
    }
    damage += summary.avgDamage;
    silver += summary.recovery.silver;
    gold += summary.recovery.gold;
    fought += 1;
  }
  return { fought, damage, silver, gold, remaining: stock };
}

export { duration, march };
