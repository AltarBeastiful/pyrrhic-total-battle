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
 * **The reading changed on 2026-09-19** (S-94): the damage column is every march's **worst opening**
 * (`minDamage`, the enemy-first journal) where it was the midpoint of the two openings, on every row of every
 * scenario. The owner will not spend on a coin flip, the plan is ranked on the bad flip, and a table that
 * ranked the plan against its rivals on a different figure would be comparing two arithmetics. The figures
 * below are therefore **lower in level** than every snapshot up to `benchmark-2026-09-19-11-thrift-end`; the
 * per-scenario worst/expected ratio that bridges the two is in `benchmark-2026-09-19-12-reliable-damage.md`
 * and in `tools/theorycraft/out/109-reliable-damage.md` §C. `price()` below is the one place it is decided.
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
 *  - a first-run army that has unlocked the **monster tiers** — 12 dominance types over tiers 3–5 against a
 *    900 dominance pool, experiment 110's camp (added 2026-09-19, S-96: the first scenario here with a pool
 *    other than leadership and authority in it, and the one that holds the plan to fielding and sheltering
 *    the monsters it can house). Its 20 000-dominance sibling is not here because its search does not
 *    finish inside `CAMPAIGN.budgets.plan` — see `monsterCamp` in `plan-scenarios.ts`;
 *  - the 4 000-leadership case of 2026-09-15, the one case two other calculators answered.
 *
 * **Two things hold a run, and they answer different questions.**
 *
 *  1. **The hand pins** (`plan-scenarios.ts`): its hardest-hitting campaign reaches the pinned share of the
 *     best sizer sequence's four-march damage, its best stop a hired unit beats every sizer sequence unless
 *     pinned otherwise, its best stop a silver reaches 95 % of the best sizer sequence's, and the bar carries
 *     the pinned number of stops. They say *how far above the sizers* the plan must stand, and each was
 *     chosen by a person, dated and explained on its own scenario.
 *  2. **The registered baseline** (`plan-baseline.ts`, `checkBaseline` below), since 2026-09-19: the figures
 *     the **owner** has registered as acceptable, stop by stop, which no run may come in under — *"the
 *     benchmark is like non-regression tests. A given scenario should not be worse, or it's a discrepancy, or
 *     a new baseline needs to be registered by me if the trade is ok."* Nothing in this repo re-bases either
 *     of them. `pnpm bench:baseline` writes `tests/engine/plan-baseline.proposed.json`; the owner reads it,
 *     sets `registeredBy` and renames it. Until he does, the baseline half asserts nothing and the report
 *     says so.
 *
 * **Three pins are failing as of 2026-09-19 (S-95)**, left failing on purpose for him to judge with the
 * proposal in hand: `stops` on the 7 000 export (4 registered, 5 offered) and on the 12 000 export (5, 4),
 * and `externals.damageFloor` on his live account at 20 000 (1.02 registered, 1.018 measured). The reliable
 * reading moved the bar on those armies; whether the trade is worth a new baseline is his call, not this
 * file's.
 *
 * S-94 left **four**: the evening account's `stops` pin (5 registered, 4 offered) came back on its own when
 * the band's token-field arm moved from the count of hired units to the damage (S-95), because the bar
 * carries five stops there again. No pin was touched to make that happen.
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
import type { CampaignPlan, PlanTotals } from '@/engine/plan';
import { chunks } from '@/engine/recovery';
import { searchPriority } from '@/engine/search';
import { sizeStacks } from '@/engine/stacker';
import type { Stack, StackRequest, StackResult } from '@/engine/types';
import { effectiveUnit, hitDamage } from '@/engine/units';

// The scenarios themselves, and their pins, live beside this file (`plan-scenarios.ts`) since S-87, so that
// `plan-criteria.test.ts` can hold the shelter criterion on every army this benchmark builds.
import type { Baseline, BaselineScenario, BaselineTotals } from './plan-baseline';
import { compareToBaseline, registeredBaseline } from './plan-baseline';
import type { Scenario } from './plan-scenarios';
import { HORIZON, OWNER_EXPORT, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';
// The rare-stock readings the owner asked for on 2026-09-19 — "at least the same as TotalStack full opt in
// silver/dmg, merc/dmg and monster/dmg" — defined once, beside the sheltered-march yardstick, so this table
// and `plan-criteria.test.ts` split the stock the same way (S-98).
import { perMonsterOf, perSoldierOf, rareStockOf } from './plan-yardsticks';
import { totalstackRows, widenedFor } from './totalstack-rows';

const SEARCH_BUDGET_MS = CAMPAIGN.budgets.search;
const SILVER_FLOOR = 0.95;
const OUT = new URL('../../tools/theorycraft/out/', import.meta.url);
const REPORT = new URL('benchmark-latest.md', OUT);
const FIGURES = new URL('benchmark-latest.json', OUT);
const n = (value: number): string => Math.round(value).toLocaleString('en-US');

// ---- pricing ---------------------------------------------------------------------------------------------

/**
 * A march from explicit counts, priced as the recap prices it: damage, silver and revive gold.
 *
 * **Damage is the worst opening since 2026-09-19** (S-94; the owner: *"average damage is not average for
 * sure; it's too risky for me to spend 3M silver on a coin flip to get 1M damage or 3M. We want reliable
 * damage actually."*). Every row of this table — the plan's stops, the sizer sequences and the captured
 * answers alike — is priced on `summary.minDamage`, the enemy-first journal, because the plan is now ranked
 * on it: a rival priced on the midpoint of the two openings against a plan priced on the bad flip would win
 * a comparison the arithmetic made rather than the march. The Generate rows keep their **own** objective
 * (average damage): that is what the other calculator answers, and only the reading it is scored on here has
 * changed.
 */
function price(
  request: StackRequest,
  counts: Record<string, number>,
): { damage: number; silver: number; gold: number; dragonCoins: number; seconds: number } {
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
  return {
    damage: summary.minDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    // The fourth price, and the rarest (S-98): dragon coins, which only the dominance pool ever charges —
    // taken off the recap exactly as the silver and the gold above are, so the column and the bar's own
    // `PlanTotals.dragonCoins` are one figure (asserted on every plan row in `measure`).
    dragonCoins: summary.recovery.dragonCoins,
    // The training queue rides with the other two prices: the registered baseline records it so the owner
    // sees the whole trade when he judges one (`plan-baseline.ts`).
    seconds: summary.recovery.seconds,
  };
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
  /** How long its losses sit in the training queue, in seconds, summed march by march. */
  seconds: number;
  burned: number;
  /**
   * **The rare stock split** (S-98, 2026-09-19; the owner: *"at least the same as TotalStack full opt in
   * silver/dmg, merc/dmg and monster/dmg"*). `burned` above is the one axis the bar is ordered by, the
   * chunks of ten every hired pool loses together; these two are the same chunks told apart — the hired
   * **soldiers** and the **monsters** (monster mercenaries and dominance monsters, `isMonsterUnit` in
   * `plan-yardsticks.ts`, which states the definition and what TotalStack's `monsterSaving` does and does
   * not say about it). `soldiersLost + monstersLost === burned` on every row, by construction here and by
   * criterion in `plan-criteria.test.ts` on the bar itself.
   */
  soldiersLost: number;
  monstersLost: number;
  /** What the campaign's monsters cost to recruit again, in dragon coins — the recap's figure, summed. */
  dragonCoins: number;
}

/**
 * The ids whose chunks the `hired burned` column counts: **every pool but `leadership`** (S-96, 2026-09-19).
 * The bar is ordered by the rare stock a march does not get back, and since S-96 that is the dominance pool's
 * monsters as well as the authority pool's mercenaries — `PlanTotals.mercLost` pools them, so the column that
 * is compared against it has to pool them too. It read `=== 'authority'` until then, which was the same set
 * on every army this file measured before the monster camp was added: none of the ten holds a dominance unit.
 */
const hiredIds = (request: StackRequest): string[] =>
  request.units.filter((u) => u.pool !== 'leadership').map((u) => u.id);

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
  let dragonCoins = 0;
  let seconds = 0;
  let burned = 0;
  let soldiersLost = 0;
  let monstersLost = 0;
  for (const counts of marches) {
    const priced = price(request, counts);
    damage += priced.damage;
    silver += priced.silver;
    gold += priced.gold;
    dragonCoins += priced.dragonCoins;
    seconds += priced.seconds;
    burned += mercIds.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0);
    const rare = rareStockOf(request.units, counts);
    soldiersLost += rare.soldiersLost;
    monstersLost += rare.monstersLost;
  }
  return {
    name,
    kind,
    comparable: true,
    marches: marches.length,
    damage,
    silver,
    gold,
    seconds,
    burned,
    soldiersLost,
    monstersLost,
    dragonCoins,
  };
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
/**
 * Damage a hired soldier and damage a monster (S-98), on `perHired`'s own zero rule: a campaign that spent
 * none of one kind reads at `damage / 1`, never at `Infinity`, so a row that fields no monster sits in the
 * same column as one that does instead of topping it by arithmetic.
 */
const perSoldier = (c: Campaign): number => perSoldierOf(c.damage, c.soldiersLost);
const perMonster = (c: Campaign): number => perMonsterOf(c.damage, c.monstersLost);

// ---- one scenario ----------------------------------------------------------------------------------------

/**
 * The marches a stop (or the plan itself) plays, first to last, the way `PlanTotals` says to read them: its
 * own sequence, or the repeated march, the finale and the troops-only tail the horizon leaves over
 * (`PlanTotals.tail`, S-89). Lifted out of `measure` by S-98 so `asBaseline` can split the **plan's own**
 * campaign over exactly the marches the bar prices it on.
 */
const marchesOf = (row: PlanTotals): Record<string, number>[] => {
  if (row.sequence) return row.sequence;
  const tail = row.tail?.marches ?? 0;
  const repeats = row.marches - (row.finaleCounts ? 1 : 0) - tail;
  const marches = Array.from({ length: repeats }, () => row.counts);
  if (row.finaleCounts) marches.push(row.finaleCounts);
  for (let index = 0; index < tail; index += 1) marches.push(row.tail?.counts ?? {});
  return marches;
};

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
  /** Which stop each plan row is, by object identity — the baseline is keyed on the engine's own `pick`. */
  picks: Map<Campaign, string>;
  /** The army measured, so the plan's own campaign can be split over its units (S-98). */
  request: StackRequest;
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
  // Which stop each plan row is, by object identity: the row's `name` is prose and the baseline is keyed on
  // the engine's own `pick`.
  const picks = new Map<Campaign, string>();
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
      const marches = marchesOf(stop as PlanTotals);
      const campaign = campaignOf(request, `Complete optimization · ${stop.pick}`, 'plan', marches);
      picks.set(campaign, stop.pick);
      // The engine's own campaign figure and the marches priced one by one must agree.
      expect(Math.abs(campaign.damage - stop.totalDamage)).toBeLessThanOrEqual(1);
      // **And so must the gold** (S-90). `PlanTotals.gold` left the finale out until 2026-09-18 — the one
      // campaign total of the four that did — so the row this table printed for a repeated stop was priced
      // over its repeats alone while the damage beside it was priced over every march. It is asserted to the
      // unit, not to one gold: the price is a whole number of coins per revived unit.
      expect(campaign.gold, `${stop.pick}'s gold over its marches`).toBe(stop.gold);
      // **And the dragon coins** (S-98), for the same reason and in the same way: the column this table now
      // prints is the recap's, and `PlanTotals.dragonCoins` is the bar's — one figure or a bug.
      expect(campaign.dragonCoins, `${stop.pick}'s dragon coins over its marches`).toBe(stop.dragonCoins);
      rows.push(campaign);
    }
  }
  return { rows, plan, refusal, planMs, picks, request };
}

/**
 * This run's figures in the shape the registered baseline holds (`plan-baseline.ts`): every stop the bar
 * offered, the plan's own campaign, and the standing ratios against the sizers and the captured answers. It
 * is what `pnpm bench:baseline` writes out for the owner and what `check` compares a run against.
 */
function asBaseline(measured: Measured): BaselineScenario | null {
  const { plan } = measured;
  if (!plan) return null;
  const totals = (c: Campaign): BaselineTotals => ({
    marches: c.marches,
    damage: Math.round(c.damage),
    silver: c.silver,
    gold: c.gold,
    seconds: c.seconds,
    burned: c.burned,
    perSilver: Number.isFinite(perSilver(c)) ? perSilver(c) : null,
    perHired: perHired(c),
    // The rare stock told apart, and the coins (S-98) — added after the fields above and never among them,
    // so a proposal written before this story and one written after differ only by these five lines.
    soldiersLost: c.soldiersLost,
    monstersLost: c.monstersLost,
    dragonCoins: c.dragonCoins,
    perSoldier: perSoldier(c),
    perMonster: perMonster(c),
  });
  const stops: Record<string, BaselineTotals> = {};
  for (const row of measured.rows) {
    const pick = measured.picks.get(row);
    if (pick !== undefined) stops[pick] = totals(row);
  }
  const sizers = measured.rows.filter((c) => c.kind === 'sizer');
  const externals = measured.rows.filter((c) => c.kind === 'external' && c.comparable);
  const plans = measured.rows.filter((c) => c.kind === 'plan');
  const best = Math.max(...plans.map((c) => c.damage));
  const bestSizer = Math.max(...sizers.map((c) => c.damage));
  // The plan's own campaign, split over exactly the marches the bar prices it on (S-98). `plan.mercLost`
  // is the pooled figure the search is ordered by; this is the same chunks told apart.
  const planRare = marchesOf(plan as PlanTotals).reduce<{ soldiersLost: number; monstersLost: number }>(
    (into, counts) => {
      const one = rareStockOf(measured.request.units, counts);
      return {
        soldiersLost: into.soldiersLost + one.soldiersLost,
        monstersLost: into.monstersLost + one.monstersLost,
      };
    },
    { soldiersLost: 0, monstersLost: 0 },
  );
  /** The best reading of one ratio over a set of campaigns, and the plan's standing against it (S-98). */
  const standing = (
    of: (c: Campaign) => number,
  ): { bestSizer: number; externals: Record<string, number> } => {
    const ours = Math.max(...plans.map(of));
    const theirs = Math.max(...sizers.map(of));
    return {
      bestSizer: theirs > 0 ? ours / theirs : 0,
      externals: Object.fromEntries(externals.filter((c) => of(c) > 0).map((c) => [c.name, ours / of(c)])),
    };
  };
  return {
    stops,
    // The plan's own campaign is the engine's figures, not a row of the table: the criterion in
    // `plan-criteria.test.ts` already holds them equal to its marches' sum.
    plan: {
      marches: plan.marches,
      damage: plan.totalDamage,
      silver: plan.silver,
      gold: plan.gold,
      seconds: plan.seconds,
      burned: plan.mercLost,
      perSilver: plan.silver > 0 ? plan.totalDamage / plan.silver : null,
      perHired: plan.totalDamage / Math.max(1, plan.mercLost),
      soldiersLost: planRare.soldiersLost,
      monstersLost: planRare.monstersLost,
      dragonCoins: plan.dragonCoins,
      perSoldier: perSoldierOf(plan.totalDamage, planRare.soldiersLost),
      perMonster: perMonsterOf(plan.totalDamage, planRare.monstersLost),
    },
    ratios: {
      bestSizer: bestSizer > 0 ? best / bestSizer : 0,
      externals: Object.fromEntries(
        externals.filter((c) => c.damage > 0).map((c) => [c.name, best / c.damage]),
      ),
      // The two standings the owner's floors will be pinned on, beside the damage one above (S-98): the
      // bar's best damage a hired soldier and a monster over the best sizer sequence's and over each
      // comparable captured answer's. Added after `externals` so an older proposal's lines are untouched.
      perSoldier: standing(perSoldier),
      perMonster: standing(perMonster),
    },
  };
}

function record(label: string, measured: Measured): void {
  const lines = [
    `## ${label}`,
    '',
    measured.refusal
      ? `The plan refused: \`${measured.refusal}\`.`
      : `The plan offers ${measured.plan?.alternatives.length ?? 0} stops.`,
    '',
    '| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |' +
      ' soldiers burned | monsters burned | dragon coins | a soldier | a monster |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...measured.rows.map(
      (c) =>
        `| ${c.name} | ${c.marches} | ${n(c.damage)} | ${n(c.silver)} | ${n(c.gold)} | ${n(c.burned)} | ${Number.isFinite(perSilver(c)) ? perSilver(c).toFixed(2) : '—'} | ${n(perHired(c))} |` +
        ` ${n(c.soldiersLost)} | ${n(c.monstersLost)} | ${n(c.dragonCoins)} | ${n(perSoldier(c))} | ${n(perMonster(c))} |`,
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
    // The shape a registered baseline holds, carried in the run's own figures so `pnpm bench:baseline` can
    // write a proposal out of this file without running the suite twice (`plan-baseline.ts`).
    baseline: asBaseline(measured),
    rows: measured.rows.map((c) => ({
      name: c.name,
      kind: c.kind,
      comparable: c.comparable,
      marches: c.marches,
      damage: Math.round(c.damage),
      silver: c.silver,
      gold: c.gold,
      seconds: c.seconds,
      burned: c.burned,
      perSilver: Number.isFinite(perSilver(c)) ? Math.round(perSilver(c) * 1000) / 1000 : null,
      perHired: Math.round(perHired(c)),
      // S-98, appended: every field above is written exactly as it was, so a snapshot taken before this
      // story and one taken after differ by these five lines and by nothing else.
      soldiersLost: c.soldiersLost,
      monstersLost: c.monstersLost,
      dragonCoins: c.dragonCoins,
      perSoldier: Math.round(perSoldier(c)),
      perMonster: Math.round(perMonster(c)),
    })),
  });
  writeFileSync(FIGURES, `${JSON.stringify(figures, null, 1)}\n`);
}

/**
 * **The registered baseline, if the owner has registered one** (2026-09-19: *"the benchmark is like
 * non-regression tests. A given scenario should not be worse, or it's a discrepancy, or a new baseline needs
 * to be registered by me if the trade is ok."*).
 *
 * Read once for the whole file. `null` — no `plan-baseline.json`, or one that still reads
 * `registeredBy: null` — means nothing below is asserted and the run says so in its report, so a tree with
 * no baseline is an honest "not measured yet" rather than a silent pass. `pnpm bench:baseline` writes the
 * proposal the owner registers.
 */
const BASELINE: Baseline | null = registeredBaseline();

function checkBaseline(scenario: Scenario, measured: Measured): void {
  if (!BASELINE) return;
  const was = BASELINE.scenarios[scenario.label];
  if (!was) {
    // A scenario the baseline does not hold is news, not a failure: the owner registers armies, and one he
    // has not registered has nothing to be worse than.
    process.stdout.write(`  baseline — ${scenario.label}: not registered\n`);
    return;
  }
  const now = asBaseline(measured);
  expect(now, `${scenario.label}: the plan refused an army the baseline holds`).not.toBeNull();
  if (!now) return;
  const { failures, added } = compareToBaseline(was, now);
  for (const line of added) process.stdout.write(`  baseline — ${scenario.label}: ${line}\n`);
  expect(
    failures.join('\n'),
    `this run is behind the baseline the owner registered\n${failures.join('\n')}`,
  ).toBe('');
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
    'The last five columns are the rare stock read the way the owner asked for it on 2026-09-19 (S-98): the ' +
    'chunks of ten burned told apart into **hired soldiers** and **monsters** — monster mercenaries and ' +
    'dominance monsters together, `isMonsterUnit` in `tests/engine/plan-yardsticks.ts` — the dragon coins ' +
    'the monsters cost to recruit again, and damage a soldier and damage a monster beside damage a hired ' +
    'unit. `soldiers burned + monsters burned = hired burned` on every row; a campaign that burned none of ' +
    'one kind reads its ratio at `damage / 1`, exactly as `a hired` has always done.\n\n' +
    `Run: ${new Date().toISOString()}, commit ${process.env.GIT_COMMIT ?? '(working tree)'}\n\n`,
);
writeFileSync(FIGURES, `${JSON.stringify({ run: new Date().toISOString(), scenarios: [] }, null, 1)}\n`);
appendFileSync(
  REPORT,
  BASELINE === null
    ? 'No baseline is registered (`tests/engine/plan-baseline.json` is absent or still reads ' +
        '`registeredBy: null`), so **no row below is held to a previous run**. `pnpm bench:baseline` writes ' +
        'a proposal for the owner to register.\n\n'
    : `Held against the baseline ${BASELINE.registeredBy ?? ''} registered on ${BASELINE.registeredAt ?? '—'}` +
        ` (${BASELINE.reading}): no stop may hit less hard, cost more silver or burn more of the stock than` +
        ' the figures in `tests/engine/plan-baseline.json`.\n\n',
);

const runAll = (cases: Scenario[]): void => {
  for (const scenario of cases) {
    test(
      scenario.label,
      () => {
        const measured = measure(scenario);
        record(scenario.label, measured);
        checkBaseline(scenario, measured);
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
