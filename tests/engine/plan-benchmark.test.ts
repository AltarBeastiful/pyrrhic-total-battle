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
 * Read the rows knowing what they are not (validator, 2026-09-18): a plan **stop that repeats a march** used
 * to play fewer marches than the horizon when its stock ran out, while a sizer sequence went on with troops
 * alone, so a "four-march" share could compare three marches with four. Since S-89 (2026-09-18) every stop
 * plays the horizon — the `all-in` march by march, every other stop by appending the same troops-only march
 * once per march its stock does not reach (`PlanTotals.tail`) — so the shares below compare four marches with
 * four on every army the plan answers; a captured answer is one
 * march repeated on its own stock, never
 * re-sized as its stock drains (conservative for it); the 4 000 case's troop types are the ones TotalStack's
 * answer fielded, and TotalStack was asked for damage a silver where this table ranks damage. Both searches
 * run under the app's own budgets (`CAMPAIGN.budgets`).
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign } from '@/engine';
import { simulateBattle } from '@/engine/battle';
import { buildKillOrder } from '@/engine/killOrder';
import type { CampaignPlan } from '@/engine/plan';
import { chunks } from '@/engine/recovery';
import { searchPriority } from '@/engine/search';
import { sizeStacks } from '@/engine/stacker';
import type { Stack, StackRequest, StackResult } from '@/engine/types';
import { effectiveUnit, hitDamage } from '@/engine/units';

// The scenarios themselves, and their pins, live beside this file (`plan-scenarios.ts`) since S-87, so that
// `plan-criteria.test.ts` can hold the shelter criterion on every army this benchmark builds.
import type { Scenario } from './plan-scenarios';
import { HORIZON, OWNER_EXPORT, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';
import { totalstackRows, widenedFor } from './totalstack-rows';

const SEARCH_BUDGET_MS = CAMPAIGN.budgets.search;
const SILVER_FLOOR = 0.95;
const OUT = new URL('../../tools/theorycraft/out/', import.meta.url);
const REPORT = new URL('benchmark-latest.md', OUT);
const FIGURES = new URL('benchmark-latest.json', OUT);
const n = (value: number): string => Math.round(value).toLocaleString('en-US');

// ---- pricing ---------------------------------------------------------------------------------------------

/** A march from explicit counts, priced as the recap prices it: damage, silver and revive gold. */
function price(
  request: StackRequest,
  counts: Record<string, number>,
): { damage: number; silver: number; gold: number } {
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
  // The gold is the hired stacks' own price (S-90): a sizer sequence and a plan stop both pay it, and a
  // campaign total that leaves one of its marches out of it is what this run's own assertion now catches.
  return { damage: summary.avgDamage, silver: summary.recovery.silver, gold: summary.recovery.gold };
}

interface Campaign {
  name: string;
  /** Who produced the marches: one of ours, or a calculator outside this repo. */
  kind: 'sizer' | 'plan' | 'external';
  /**
   * False for a captured answer that fields a troop type the scenario's army does not hold (TotalStack's
   * profile fields Archer III, Spearman III and Swordsman I where the owner's export leaves them out): priced
   * and shown, since it is what the other calculator says, but no pin is judged against a march the player
   * cannot make.
   */
  comparable: boolean;
  marches: number;
  damage: number;
  silver: number;
  /** What the campaign's hired stacks cost to revive, in gold — the recap's figure, summed march by march. */
  gold: number;
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
  let gold = 0;
  let burned = 0;
  for (const counts of marches) {
    const priced = price(request, counts);
    damage += priced.damage;
    silver += priced.silver;
    gold += priced.gold;
    burned += mercIds.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0);
  }
  return { name, kind, comparable: true, marches: marches.length, damage, silver, gold, burned };
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

// ---- one scenario ----------------------------------------------------------------------------------------

interface Measured {
  rows: Campaign[];
  plan: CampaignPlan | null;
  refusal: string | null;
  /**
   * Wall time `planCampaign` itself took on this scenario, in milliseconds — the search only, not the sizer
   * rows beside it. Carried into `benchmark-latest.json` beside the stops (owner, 2026-09-18: a proposal that
   * widens the search has to say what it costs), so a later run compares against a measured number rather
   * than against a memory of how long the suite felt.
   */
  planMs: number;
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
  // The captured answers: the case's own (the 2026-09-15 capture, Kai's extract) and TotalStack's dataset of
  // 2026-09-18 for every scenario it answered, each priced on the request widened to the troop types it
  // fielded (`totalstack-rows.ts`).
  const held = new Set(request.units.map((unit) => unit.id));
  for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
    const outside = Object.entries(external.counts)
      .filter(([id, count]) => count > 0 && !held.has(id))
      .map(([id]) => id);
    const row = asCaptured(widenedFor(request, external.counts), external.name, external.counts);
    if (outside.length > 0) {
      row.comparable = false;
      row.name = `${row.name} — outside the army's window (${outside.join(', ')})`;
    }
    rows.push(row);
  }
  let plan: CampaignPlan | null = null;
  let refusal: string | null = null;
  const startedAt = performance.now();
  try {
    plan = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      // The put-back pass, at the app's own rates (`CAMPAIGN.putBack`): this file measures the plan the app
      // ships, so a stop here is the march the player would be offered, low tiers put back and all.
      putBack: CAMPAIGN.putBack,
    });
  } catch (error) {
    refusal = error instanceof Error ? error.message : String(error);
  }
  const planMs = Math.round(performance.now() - startedAt);
  if (plan) {
    for (const stop of plan.alternatives) {
      // The campaign a stop actually plays: its own sequence, or its repeated march as many times as its
      // stock reaches, its last march, and the troops-only marches the horizon leaves over (`PlanTotals.tail`,
      // S-89 — the same march the `all-in` ends on, appended once per march the stock does not reach).
      const repeats = stop.marches - (stop.finaleCounts ? 1 : 0) - (stop.tail?.marches ?? 0);
      const marches = stop.sequence ?? Array.from({ length: repeats }, () => stop.counts);
      if (!stop.sequence && stop.finaleCounts) marches.push(stop.finaleCounts);
      if (!stop.sequence && stop.tail) {
        for (let i = 0; i < stop.tail.marches; i += 1) marches.push(stop.tail.counts);
      }
      const campaign = campaignOf(request, `Complete optimization · ${stop.pick}`, 'plan', marches);
      // The engine's own campaign figure and the marches priced one by one must agree.
      expect(Math.abs(campaign.damage - stop.totalDamage)).toBeLessThanOrEqual(1);
      // **And so must the gold** (S-90). `PlanTotals.gold` left the finale out until 2026-09-18 — the one
      // campaign total of the four that did — so the row this table printed for a repeated stop was priced
      // over its repeats alone while the damage beside it was priced over every march. It is asserted to the
      // unit, not to one gold: the price is a whole number of coins per revived unit.
      expect(campaign.gold, `${stop.pick}'s gold over its marches`).toBe(stop.gold);
      rows.push(campaign);
    }
  }
  return { rows, plan, refusal, planMs };
}

function record(label: string, measured: Measured): void {
  const lines = [
    `## ${label}`,
    '',
    measured.refusal
      ? `The plan refused: \`${measured.refusal}\`.`
      : `The plan offers ${measured.plan?.alternatives.length ?? 0} stops.`,
    '',
    '| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |',
    '|---|---|---|---|---|---|---|---|',
    ...measured.rows.map(
      (c) =>
        `| ${c.name} | ${c.marches} | ${n(c.damage)} | ${n(c.silver)} | ${n(c.gold)} | ${n(c.burned)} | ${Number.isFinite(perSilver(c)) ? perSilver(c).toFixed(2) : '—'} | ${n(perHired(c))} |`,
    ),
    '',
  ];
  appendFileSync(REPORT, `${lines.join('\n')}\n`);
  const figures = JSON.parse(readFileSync(FIGURES, 'utf8')) as { scenarios: unknown[] };
  figures.scenarios.push({
    label,
    refusal: measured.refusal,
    stops: measured.plan?.alternatives.map((stop) => stop.pick) ?? [],
    planMs: measured.planMs,
    rows: measured.rows.map((c) => ({
      name: c.name,
      kind: c.kind,
      comparable: c.comparable,
      marches: c.marches,
      damage: Math.round(c.damage),
      silver: c.silver,
      gold: c.gold,
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
  const externals = measured.rows.filter((c) => c.kind === 'external' && c.comparable);
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
  // `>=` on both, so an **exact tie** counts: a sizer sequence that matches the sweet spot on silver and on
  // the stock is not behind it on either, and since S-89 that is a case which actually happens (Bear V ×1
  // and ×2 tail into the Tier ladder sizer's own campaign, to the unit). The pin is named for what this
  // measures rather than for a loss it does not always mean — see `Pinned.sweetNotAheadOnEither`.
  const notAhead = sizers.some((c) => perSilver(c) >= perSilver(sweet) && perHired(c) >= perHired(sweet));
  expect(notAhead, `no sizer sequence is behind the sweet spot on either ratio (${tell})`).toBe(
    pinned.sweetNotAheadOnEither,
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
    'Each march priced by `simulateBattle` on its counts — damage, retraining silver and the gold its hired ' +
    'stacks cost to revive (the gold column since S-90, 2026-09-18).\n\n' +
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
