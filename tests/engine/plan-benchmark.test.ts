/**
 * **The benchmark, as a standing test** (owner, 2026-09-18: *"always benchmark our total optimization against
 * the two others to understand if we're finding something interesting or just changing numbers without really
 * improving on the current stack algorithm"*; later that day: *"update the benchmark with the needed test
 * scenarios to prove everything … so we have a definitive benchmark over the main use cases of the
 * calculators"*).
 *
 * Complete optimization against Tier ladder and Troops first — each as the plain sizer and as Generate runs
 * it, the priority search on average damage — and every plan stop, all played for the same four marches: the
 * sizer methods re-sized each march on the stock the last one left (a chunk of ten lost per hired stack
 * fielded), the plan as its own sequence of repeats and finale. Where a calculator outside this repo answered
 * the same case (TotalStack's optimize capture of 2026-09-15, Kai's calculator's extract of the same day), its
 * march is a row too, played as captured while the stock lasts. Every march is priced by `simulateBattle` on
 * its counts.
 *
 * **The scenarios** are the main use cases of the calculators, each pinned to what the engine does today so
 * that a change either way is news:
 *
 *  - the owner's 2026-09-17 export at its setup (7 000 leadership — the case where a hired stack on top was
 *    the best sponge, experiment 101 §A) and at 12 000;
 *  - his live account of 2026-09-18 (one hired type, 20 000) and its evening form (four types, one of them
 *    hired as unlimited, 11 000);
 *  - a first-run army with Bear V at a stock of 1, 2, 3 and 10 (experiment 101 §B: the small stocks where
 *    the plan refuses or offers one stop), and with the hunter at 83 (the e2e seed);
 *  - the 4 000-leadership case of 2026-09-15, the one case two other calculators answered.
 *
 * What must hold on every case the plan answers, or the plan is changing numbers rather than improving on
 * the sizers: its hardest-hitting campaign reaches the pinned share of the best sizer sequence's four-march
 * damage, its best stop a hired unit beats every sizer sequence unless pinned otherwise, and its best stop a
 * silver reaches 95 % of the best sizer sequence's. The pins are measured, not chosen — each carries the
 * date and the figure — and a proposal that moves one moves the pin with it.
 *
 * The table each case measured is written to `tools/theorycraft/out/benchmark-latest.md`, the figures to
 * `benchmark-latest.json` beside it (what a before/after comparison reads). The first-run and 4 000 cases run
 * everywhere; the owner's cases run where his export is.
 *
 * Read the rows knowing what they are not (validator, 2026-09-18): the plan may play fewer marches than the
 * horizon when its stock runs out, while a sizer sequence goes on with troops alone, so a "four-march" share
 * can compare three marches with four; a captured answer is one march repeated on its own stock, never
 * re-sized as its stock drains (conservative for it); the 4 000 case's troop types are the ones TotalStack's
 * answer fielded, and TotalStack was asked for damage a silver where this table ranks damage. Both searches
 * run under the app's own budgets (`CAMPAIGN.budgets`).
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { unitById } from '@/data';
import { planCampaign } from '@/engine';
import { simulateBattle } from '@/engine/battle';
import { aggregateBonuses } from '@/engine/bonuses';
import { buildKillOrder } from '@/engine/killOrder';
import type { CampaignPlan } from '@/engine/plan';
import { chunks } from '@/engine/recovery';
import { searchPriority } from '@/engine/search';
import { sizeStacks } from '@/engine/stacker';
import type { ResolvedSource, Stack, StackRequest, StackResult, UnitDef } from '@/engine/types';
import { effectiveUnit, hitDamage } from '@/engine/units';
import { parseImport } from '@/share/exportImport';
import { newProfile } from '@/state/defaults';
import { buildStackRequest } from '@/state/derive';
import type { Profile } from '@/state/schema';

const OWNER_EXPORT =
  process.env.PYRRHIC_EXPORT_2026_09_17 ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-17 (2).json';
const TOTALSTACK_CAPTURE = new URL(
  '../../docs/research/fixtures/totalstack-2026-09-15-optimize.json',
  import.meta.url,
);
const KAI_EXTRACT = new URL('../../docs/research/fixtures/kai-extract-2026-09-15-4000.json', import.meta.url);
const HORIZON = 4;
const SEARCH_BUDGET_MS = CAMPAIGN.budgets.search;
const SILVER_FLOOR = 0.95;
const OUT = new URL('../../tools/theorycraft/out/', import.meta.url);
const REPORT = new URL('benchmark-latest.md', OUT);
const FIGURES = new URL('benchmark-latest.json', OUT);
const n = (value: number): string => Math.round(value).toLocaleString('en-US');

// ---- pricing ---------------------------------------------------------------------------------------------

/** A march from explicit counts, priced as the recap prices it. */
function price(request: StackRequest, counts: Record<string, number>): { damage: number; silver: number } {
  const rank = new Map(buildKillOrder(request.units, request.options).map((id, index) => [id, index]));
  const stacks: Stack[] = [];
  for (const unit of request.units) {
    const count = Math.floor(counts[unit.id] ?? 0);
    if (count <= 0) continue;
    const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
    const { damage, features } = hitDamage(effective, count);
    stacks.push({
      unitId: unit.id,
      pool: unit.pool,
      count,
      hpPerUnit: effective.hpPerUnit,
      totalHp: count * effective.hpPerUnit,
      strengthPerUnit: effective.strengthPerUnit,
      target: effective.target,
      damagePerHit: damage,
      featuresDamage: features,
      doubleDamageChance: effective.doubleDamageChance,
      strikeTwoSquadsChance: effective.strikeTwoSquadsChance,
    });
  }
  stacks.sort((a, b) => b.totalHp - a.totalHp || (rank.get(a.unitId) ?? 0) - (rank.get(b.unitId) ?? 0));
  const pools = {
    leadership: { used: 0, capacity: request.housing.leadership },
    authority: { used: 0, capacity: request.housing.authority },
    dominance: { used: 0, capacity: request.housing.dominance },
  };
  const result: StackResult = { stacks, pools, dropped: [], warnings: [] };
  const summary = simulateBattle(result, request);
  return { damage: summary.avgDamage, silver: summary.recovery.silver };
}

interface Campaign {
  name: string;
  /** Who produced the marches: one of ours, or a calculator outside this repo. */
  kind: 'sizer' | 'plan' | 'external';
  marches: number;
  damage: number;
  silver: number;
  burned: number;
}

const hiredIds = (request: StackRequest): string[] =>
  request.units.filter((u) => u.pool === 'authority').map((u) => u.id);

function campaignOf(
  request: StackRequest,
  name: string,
  kind: Campaign['kind'],
  marches: Record<string, number>[],
): Campaign {
  const mercIds = hiredIds(request);
  let damage = 0;
  let silver = 0;
  let burned = 0;
  for (const counts of marches) {
    const priced = price(request, counts);
    damage += priced.damage;
    silver += priced.silver;
    burned += mercIds.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0);
  }
  return { name, kind, marches: marches.length, damage, silver, burned };
}

/** A sizer method played for the horizon the way a player plays it: Generate, march, lose a chunk, again. */
function greedy(
  base: StackRequest,
  method: 'elite' | 'ms',
  name: string,
  pick: (request: StackRequest) => Record<string, number>,
): Campaign {
  const first: StackRequest = { ...base, options: { ...base.options, method } };
  const mercIds = hiredIds(first);
  const caps = { ...first.caps };
  const marches: Record<string, number>[] = [];
  for (let i = 0; i < HORIZON; i += 1) {
    const request = { ...first, caps: { ...caps } };
    const counts = pick(request);
    if (Object.values(counts).every((c) => c <= 0)) break;
    marches.push(counts);
    for (const id of mercIds) {
      if (caps[id] !== undefined) caps[id] = Math.max(0, caps[id] - chunks(counts[id] ?? 0));
    }
  }
  return campaignOf(first, name, 'sizer', marches);
}

/**
 * A march another calculator answered, played as captured while its stock lasts: the stock is the query's cap
 * or the captured count where that is larger (Kai's extract was made at 18/18, above the query's caps), and a
 * hired stack is clamped to what is left.
 */
function asCaptured(base: StackRequest, name: string, counts: Record<string, number>): Campaign {
  const mercIds = hiredIds(base);
  const caps = { ...base.caps };
  for (const id of mercIds) {
    if (caps[id] !== undefined) caps[id] = Math.max(caps[id], counts[id] ?? 0);
  }
  const marches: Record<string, number>[] = [];
  for (let i = 0; i < HORIZON; i += 1) {
    const march = { ...counts };
    for (const id of mercIds) {
      const cap = caps[id];
      if (cap !== undefined) march[id] = Math.min(march[id] ?? 0, cap);
    }
    marches.push(march);
    for (const id of mercIds) {
      if (caps[id] !== undefined) caps[id] = Math.max(0, caps[id] - chunks(march[id] ?? 0));
    }
  }
  return campaignOf(base, name, 'external', marches);
}

const countsOf = (result: StackResult): Record<string, number> =>
  Object.fromEntries(result.stacks.map((s) => [s.unitId, s.count]));
/** Damage a silver, or NaN for a sequence that spent none (a ratio it does not have, never a record). */
const perSilver = (c: Campaign): number => (c.silver > 0 ? c.damage / c.silver : NaN);
const perHired = (c: Campaign): number => c.damage / Math.max(1, c.burned);

// ---- the scenarios ---------------------------------------------------------------------------------------

interface Pinned {
  /** The plan refuses this army outright (`planCampaign` throws). */
  refuses: boolean;
  /** Stops on the bar. */
  stops: number;
  /** The sweet spot beaten on both ratios by a sizer sequence. */
  sweetLosesOnBoth: boolean;
  /** The share of the best sizer sequence's four-march damage the plan's hardest campaign reaches. */
  damageFloor: number;
  /** The plan's best stop a hired unit beats every sizer sequence. */
  winsHired: boolean;
  /** The share of the best sizer sequence's damage a silver the plan's best stop reaches (0.95 unless a case says why). */
  silverFloor?: number;
  /** Against the calculators outside this repo, where a case has them: the same two readings. */
  externals?: { damageFloor: number; winsHired: boolean };
}

interface Scenario {
  label: string;
  request: StackRequest;
  /** Marches answered by calculators outside this repo, priced under this scenario's own bonuses. */
  externals: { name: string; counts: Record<string, number> }[];
  pinned: Pinned;
}

function ownerProfile(): Profile | null {
  if (!existsSync(OWNER_EXPORT)) return null;
  const parsed = parseImport(readFileSync(OWNER_EXPORT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

/** The owner's live browser account of 2026-09-18: his export's profile with the captains he had enlisted. */
function liveProfile(profile: Profile, hired: { id: string; cap: number | null }[]): Profile {
  const live = structuredClone(profile);
  live.mercenaries.selected = hired;
  live.sources.captains = [
    { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
    { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
    { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
  ];
  return live;
}

/** A first-run army (Guardsmen I–III, Specialists I, no bonuses) with one hired type at a stock. */
function firstRun(hired: { id: string; cap: number }, leadership: number): StackRequest {
  const profile = newProfile('first run');
  profile.mercenaries.selected = [hired];
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return buildStackRequest(profile, { ...setup, housing: { leadership, authority: 40_000, dominance: 0 } });
}

interface Capture {
  request: {
    inputValue: number;
    authorityValue: number;
    mercenaryCaps: Record<string, number>;
    selectedMercenaryIds: string[];
    relaxedPreservation: boolean;
    healthBonuses: Record<string, number>;
    strengthBonuses: Record<string, number>;
    templeLevel: number;
    enemyFormation: Record<string, number>;
  };
  response: { calculation: { troopCounts: Record<string, number>; mercenaryCounts: Record<string, number> } };
}
interface KaiExtract {
  payload: { army: { name: string; count: number }[] };
}
const KAI_NAMES: Record<string, string> = {
  'Spearman I': 'spearman-1',
  'Rider I': 'rider-1',
  'Archer I': 'archer-1',
  'Spearman II': 'spearman-2',
  'Rider II': 'rider-2',
  'Archer II': 'archer-2',
  'Rider III': 'rider-3',
  Legionary: 'legionary-6',
  Arbalester: 'arbalester-6',
  'Epic Monster Hunter VI': 'epic-monster-hunter-6',
  Chariot: 'chariot-6',
};

/**
 * The 4 000-leadership case of 2026-09-15 as TotalStack was asked it: its own answer's troop types (the
 * query's tier window as it read it), the four hired types with the caps of the query, its bonuses (melee
 * +35 / +70, army +3 / +3), its enemy and temple. TotalStack's answer and Kai's extract of the same day are
 * the external rows; Kai's extract carries no bonus figures, so it is priced under the query's.
 */
function fourThousand(): Scenario {
  const capture = JSON.parse(readFileSync(TOTALSTACK_CAPTURE, 'utf8')) as Capture;
  const kai = JSON.parse(readFileSync(KAI_EXTRACT, 'utf8')) as KaiExtract;
  const query = capture.request;
  const theirs = {
    ...capture.response.calculation.troopCounts,
    ...capture.response.calculation.mercenaryCounts,
  };
  const troopIds = Object.keys(capture.response.calculation.troopCounts);
  const units = [...troopIds, ...query.selectedMercenaryIds].map((id) => {
    const unit = unitById(id);
    if (!unit) throw new Error(`unknown unit ${id}`);
    return unit as UnitDef;
  });
  const caps = Object.fromEntries(query.selectedMercenaryIds.map((id) => [id, query.mercenaryCaps[id] ?? 0]));
  const source: ResolvedSource = {
    id: 'totalstack-2026-09-15',
    label: 'the capture request',
    kind: 'custom',
    health: { melee: query.healthBonuses['melee'] ?? 0, army: query.healthBonuses['army'] ?? 0 },
    strength: { melee: query.strengthBonuses['melee'] ?? 0, army: query.strengthBonuses['army'] ?? 0 },
  };
  const request: StackRequest = {
    units,
    caps,
    housing: { leadership: query.inputValue, authority: query.authorityValue, dominance: 0 },
    totals: aggregateBonuses([source]),
    options: {
      method: 'ms',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
      relaxedPreservation: query.relaxedPreservation,
    },
    enemy: {
      melee: query.enemyFormation['melee'] ?? 0,
      ranged: query.enemyFormation['ranged'] ?? 0,
      mounted: query.enemyFormation['mounted'] ?? 0,
      flying: query.enemyFormation['flying'] ?? 0,
    },
    activeEvents: [],
    recovery: {
      templeLevel: query.templeLevel,
      trainingCostReduction: {},
      trainingSpeed: {},
      plan: { mode: 'retrain' },
    },
  };
  const kaiCounts: Record<string, number> = {};
  for (const stack of kai.payload.army) {
    const id = KAI_NAMES[stack.name];
    if (!id) throw new Error(`unmapped Kai stack ${stack.name}`);
    kaiCounts[id] = stack.count;
  }
  return {
    label:
      'the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)',
    request,
    externals: [
      { name: 'TotalStack · optimize (as captured, repeated)', counts: theirs },
      { name: 'Kai’s calculator · extract (as captured, repeated)', counts: kaiCounts },
    ],
    // Measured 2026-09-18: three stops; 96.5 % of the best sizer sequence's damage. TotalStack's own answer,
    // repeated, out-hits every row here by 3.2 % (Troops first · Generate) to 9.3 % (the all-in) at the same
    // silver, 24 burned against the plan's 21; the plan keeps the better damage a hired.
    pinned: {
      refuses: false,
      stops: 3,
      sweetLosesOnBoth: false,
      damageFloor: 0.96,
      winsHired: true,
      externals: { damageFloor: 0.93, winsHired: true },
    },
  };
}

function ownerScenarios(profile: Profile): Scenario[] {
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  const at = (leadership: number, p: Profile = profile): StackRequest =>
    buildStackRequest(p, { ...setup, housing: { ...setup.housing, leadership } });
  const live = (hired: { id: string; cap: number | null }[], leadership: number): StackRequest =>
    buildStackRequest(liveProfile(profile, hired), {
      ...setup,
      housing: { leadership, authority: 2_180, dominance: 0 },
    });
  return [
    {
      // Pinned 2026-09-18: the plain Troops-first sequence beat the sweet spot on both ratios (2.14 · 426 216
      // against 1.95 · 376 087) until every hired type was kept and every hired stack sheltered (S-75); the
      // shelter cost 6 % of the top damage here (89.6 % of the sizers, experiment 101 §A).
      // S-77, 2026-09-18: only an **unlimited** hired stack is clamped under the troops, so the capped
      // legionaries may stand on top again as the enemy's first kill — 89.6 % → 95.6 % of the sizers. The bar
      // keeps four stops: the middle rule's tie now goes to the rung the other does not dominate over the
      // campaign (11 burned, not 10), and no march left of it is as efficient a silver, so no silver saver is
      // offered. The Troops-first sequence still beats the sweet spot on both **campaign** ratios (2.1394 ·
      // 426 215 against 2.0119 · 393 667): this case is a sizer shape either way, and the sweet spot is the
      // middle of the bar rather than the hardest march it can find. With the silver saver gone so is the
      // plan's win a hired unit here — it was that stop's 523 723 that beat the sizers' 426 215, and the four
      // stops left top out at the sweet spot's 393 667. The bar's thrift end on this army is now the sweet
      // spot itself; a proposal that brings a thriftier stop back should move this pin with it.
      label: '2026-09-17 export, its setup (7 000 leadership)',
      request: buildStackRequest(profile, setup),
      externals: [],
      pinned: { refuses: false, stops: 4, sweetLosesOnBoth: true, damageFloor: 0.95, winsHired: false },
    },
    {
      label: '2026-09-17 export, 12 000 leadership',
      request: at(12_000),
      externals: [],
      // Measured 2026-09-18 before the proposals: 94.9 % of the sizers' damage, four stops (no more-mercs rung).
      pinned: { refuses: false, stops: 4, sweetLosesOnBoth: false, damageFloor: 0.94, winsHired: true },
    },
    {
      label: 'live account of 2026-09-18 (one hired type, 20 000 leadership)',
      request: live([{ id: 'epic-monster-hunter-6', cap: 83 }], 20_000),
      externals: [],
      // Measured 2026-09-18: 99.1 %, four stops.
      pinned: { refuses: false, stops: 4, sweetLosesOnBoth: false, damageFloor: 0.99, winsHired: true },
    },
    {
      label: 'live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)',
      request: live(
        [
          { id: 'epic-monster-hunter-6', cap: 83 },
          { id: 'legionary-6', cap: null },
          { id: 'chariot-6', cap: 10 },
          { id: 'arbalester-6', cap: 60 },
        ],
        11_000,
      ),
      externals: [],
      // Measured 2026-09-18: the sizers field the unlimited legionaries by the authority pool alone — 2 017 to
      // 2 064 a march, 874 burned over four — and Generate under Troops first answers a march of legionaries
      // and no troops at all (no silver, 52 M damage), so their damage is no yardstick here: the plan's 30.1 M
      // at 70 burned is 37 % of it and wins a hired by four times. A row without silver has no ratio a silver,
      // and the Tier ladder's 4.21 a silver rides on legionaries that cost gold, not silver: 41 % of it is pinned.
      pinned: {
        refuses: false,
        stops: 5,
        sweetLosesOnBoth: false,
        damageFloor: 0.37,
        winsHired: true,
        silverFloor: 0.41,
      },
    },
  ];
}

/** The cases that need no export: a first-run army with one hired type, and the 4 000 case two calculators answered. */
function commonScenarios(): Scenario[] {
  return [
    {
      label: 'first-run army, Bear V ×1 (20 000 leadership)',
      request: firstRun({ id: 'bear-5', cap: 1 }, 20_000),
      externals: [],
      // Measured 2026-09-18, once the horizon became a ceiling: one stop of **one** march — a stock of one
      // bear sustains no repeat — 4 722 842 for 8 131 400, 19.8 % of the four-march sizers' damage and the
      // best of every row a silver (0.581 against 0.570). It refused outright before.
      pinned: { refuses: false, stops: 1, sweetLosesOnBoth: false, damageFloor: 0.19, winsHired: false },
    },
    {
      label: 'first-run army, Bear V ×2 (20 000 leadership)',
      request: firstRun({ id: 'bear-5', cap: 2 }, 20_000),
      externals: [],
      // Measured 2026-09-18, once the horizon became a ceiling: one stop of **two** marches — two bears
      // fielded, then the one the chunk left — 9 557 884 for 16 262 800, 39.9 % of the four-march sizers'
      // damage and the best of every row a silver (0.588 against 0.577). It refused outright before.
      pinned: { refuses: false, stops: 1, sweetLosesOnBoth: false, damageFloor: 0.39, winsHired: false },
    },
    {
      label: 'first-run army, Bear V ×3 (20 000 leadership)',
      request: firstRun({ id: 'bear-5', cap: 3 }, 20_000),
      externals: [],
      // Measured 2026-09-18 (experiment 101 §B): one stop, one bear fielded; the sizers field all three and
      // burn the same one a march — 58.8 % of their damage, beaten a hired and on both ratios.
      pinned: { refuses: false, stops: 1, sweetLosesOnBoth: true, damageFloor: 0.58, winsHired: false },
    },
    {
      label: 'first-run army, Bear V ×10 (20 000 leadership)',
      request: firstRun({ id: 'bear-5', cap: 10 }, 20_000),
      externals: [],
      // Measured 2026-09-18 (experiment 101 §B): one stop, six bears under the Elite sizer; the sizers field
      // ten, nine, eight, seven for the same four chunks — 84.1 % of their damage, beaten a hired.
      // S-77, 2026-09-18: the bears are capped, so the sizer's shape no longer lowers them under the troops
      // and the stop hits harder — 84.1 % → 86.4 %.
      pinned: { refuses: false, stops: 1, sweetLosesOnBoth: true, damageFloor: 0.86, winsHired: false },
    },
    {
      label: 'first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)',
      request: firstRun({ id: 'epic-monster-hunter-6', cap: 83 }, 20_000),
      externals: [],
      // Measured 2026-09-18: 98.8 %, three stops (no silver saver, no more-mercs rung).
      pinned: { refuses: false, stops: 3, sweetLosesOnBoth: false, damageFloor: 0.98, winsHired: true },
    },
    fourThousand(),
  ];
}

// ---- one scenario ----------------------------------------------------------------------------------------

interface Measured {
  rows: Campaign[];
  plan: CampaignPlan | null;
  refusal: string | null;
}

function measure(scenario: Scenario): Measured {
  const { request } = scenario;
  const rows: Campaign[] = [];
  for (const [method, title] of [
    ['elite', 'Tier ladder'],
    ['ms', 'Troops first'],
  ] as const) {
    rows.push(greedy(request, method, `${title} · all types`, (r) => countsOf(sizeStacks(r))));
    rows.push(
      greedy(request, method, `${title} · Generate (average damage)`, (r) =>
        countsOf(searchPriority({ request: r, objective: 'avgDamage', budgetMs: SEARCH_BUDGET_MS }).result),
      ),
    );
  }
  for (const external of scenario.externals) rows.push(asCaptured(request, external.name, external.counts));
  let plan: CampaignPlan | null = null;
  let refusal: string | null = null;
  try {
    plan = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
    });
  } catch (error) {
    refusal = error instanceof Error ? error.message : String(error);
  }
  if (plan) {
    for (const stop of plan.alternatives) {
      const repeats = stop.marches - (stop.finaleCounts ? 1 : 0);
      const marches = stop.sequence ?? Array.from({ length: repeats }, () => stop.counts);
      if (!stop.sequence && stop.finaleCounts) marches.push(stop.finaleCounts);
      const campaign = campaignOf(request, `Complete optimization · ${stop.pick}`, 'plan', marches);
      // The engine's own campaign figure and the marches priced one by one must agree.
      expect(Math.abs(campaign.damage - stop.totalDamage)).toBeLessThanOrEqual(1);
      rows.push(campaign);
    }
  }
  return { rows, plan, refusal };
}

function record(label: string, measured: Measured): void {
  const lines = [
    `## ${label}`,
    '',
    measured.refusal
      ? `The plan refused: \`${measured.refusal}\`.`
      : `The plan offers ${measured.plan?.alternatives.length ?? 0} stops.`,
    '',
    '| sequence | marches | four-march damage | silver | hired burned | a silver | a hired |',
    '|---|---|---|---|---|---|---|',
    ...measured.rows.map(
      (c) =>
        `| ${c.name} | ${c.marches} | ${n(c.damage)} | ${n(c.silver)} | ${n(c.burned)} | ${Number.isFinite(perSilver(c)) ? perSilver(c).toFixed(2) : '—'} | ${n(perHired(c))} |`,
    ),
    '',
  ];
  appendFileSync(REPORT, `${lines.join('\n')}\n`);
  const figures = JSON.parse(readFileSync(FIGURES, 'utf8')) as { scenarios: unknown[] };
  figures.scenarios.push({
    label,
    refusal: measured.refusal,
    stops: measured.plan?.alternatives.map((stop) => stop.pick) ?? [],
    rows: measured.rows.map((c) => ({
      name: c.name,
      kind: c.kind,
      marches: c.marches,
      damage: Math.round(c.damage),
      silver: c.silver,
      burned: c.burned,
      perSilver: Number.isFinite(perSilver(c)) ? Math.round(perSilver(c) * 1000) / 1000 : null,
      perHired: Math.round(perHired(c)),
    })),
  });
  writeFileSync(FIGURES, `${JSON.stringify(figures, null, 1)}\n`);
}

function check(scenario: Scenario, measured: Measured): void {
  const { pinned } = scenario;
  const tell = measured.rows
    .map((c) => `${c.name}: ${n(c.damage)} / ${n(c.silver)} / ${n(c.burned)}`)
    .join('; ');
  expect(measured.refusal !== null, `the plan refuses (${measured.refusal ?? 'no'})`).toBe(pinned.refuses);
  expect(measured.plan?.alternatives.length ?? 0, `stops on the bar (${tell})`).toBe(pinned.stops);
  const sizers = measured.rows.filter((c) => c.kind === 'sizer');
  // Four sizer sequences, each of at least one march: a floor against nothing would hold of anything.
  expect(sizers.length).toBe(4);
  for (const c of sizers) expect(c.marches, `${c.name} played no march`).toBeGreaterThan(0);
  if (!measured.plan) return;
  const plan = measured.rows.filter((c) => c.kind === 'plan');
  const externals = measured.rows.filter((c) => c.kind === 'external');
  const sweet = plan.find((c) => c.name.endsWith('sweet-spot'));
  const most = plan.reduce<Campaign | undefined>((b, c) => (!b || c.damage > b.damage ? c : b), undefined);
  if (!sweet || !most) throw new Error('no sweet spot or top');
  const bestSizerDamage = Math.max(...sizers.map((c) => c.damage));
  const finite = (values: number[]): number => Math.max(...values.filter(Number.isFinite));
  const bestSizerPerSilver = finite(sizers.map(perSilver));
  const bestSizerPerHired = Math.max(...sizers.map(perHired));
  const planPerSilver = finite(plan.map(perSilver));
  const planPerHired = Math.max(...plan.map(perHired));
  expect(
    most.damage,
    `the plan's hardest campaign against the best sizer sequence (${tell})`,
  ).toBeGreaterThanOrEqual(pinned.damageFloor * bestSizerDamage);
  expect(planPerHired > bestSizerPerHired, `the plan's best a hired beats the sizers (${tell})`).toBe(
    pinned.winsHired,
  );
  expect(planPerSilver, `the plan's best a silver against the sizers (${tell})`).toBeGreaterThanOrEqual(
    (pinned.silverFloor ?? SILVER_FLOOR) * bestSizerPerSilver,
  );
  const sweetLoses = sizers.some((c) => perSilver(c) >= perSilver(sweet) && perHired(c) >= perHired(sweet));
  expect(sweetLoses, `the sweet spot beaten on both ratios by a sizer sequence (${tell})`).toBe(
    pinned.sweetLosesOnBoth,
  );
  if (externals.length > 0) {
    if (!pinned.externals) throw new Error('a case with external rows must pin them');
    const bestExternalDamage = Math.max(...externals.map((c) => c.damage));
    const bestExternalPerHired = Math.max(...externals.map(perHired));
    expect(
      most.damage,
      `the plan's hardest campaign against the other calculators (${tell})`,
    ).toBeGreaterThanOrEqual(pinned.externals.damageFloor * bestExternalDamage);
    expect(
      planPerHired > bestExternalPerHired,
      `the plan's best a hired beats the other calculators (${tell})`,
    ).toBe(pinned.externals.winsHired);
  }
}

// ---- the suite -------------------------------------------------------------------------------------------

mkdirSync(OUT, { recursive: true });
writeFileSync(
  REPORT,
  '# The plan against Tier ladder, Troops first and the other calculators — the latest run of `tests/engine/plan-benchmark.test.ts`\n\n' +
    'Every sequence is four marches: the sizers re-sized each march on the stock the last one left (Generate ' +
    'four times), the plan as its own repeats and finale, a captured answer repeated while its stock lasts. ' +
    'Each march priced by `simulateBattle` on its counts.\n\n' +
    `Run: ${new Date().toISOString()}, commit ${process.env.GIT_COMMIT ?? '(working tree)'}\n\n`,
);
writeFileSync(FIGURES, `${JSON.stringify({ run: new Date().toISOString(), scenarios: [] }, null, 1)}\n`);

const runAll = (cases: Scenario[]): void => {
  for (const scenario of cases) {
    test(
      scenario.label,
      () => {
        const measured = measure(scenario);
        record(scenario.label, measured);
        check(scenario, measured);
      },
      300_000,
    );
  }
};

describe('the plan against Tier ladder, Troops first and the other calculators, over four marches', () => {
  runAll(commonScenarios());
});

describe.skipIf(!existsSync(OWNER_EXPORT))('the same, on the owner’s account', () => {
  const profile = ownerProfile();
  runAll(profile ? ownerScenarios(profile) : []);
});
