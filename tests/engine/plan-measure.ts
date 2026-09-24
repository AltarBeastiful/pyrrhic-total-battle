/**
 * **One benchmark army, measured** — `measure` (every row the benchmark prices on an army: the sizers, every
 * Generate objective, the sizer switches, the captured answers and the plan's stops) and `figuresOf` (the
 * figures `benchmark-run.json` records for it), lifted out of `plan-benchmark.test.ts` so a second reading of
 * the same armies is the same code (the precedent is `plan-campaign.ts`, S-131).
 *
 * The second reading is `tests/kernel/benchmark-equivalence.*.test.ts`: every army measured once on the
 * TypeScript engine and once with the plan kernel set, and the two `figuresOf` payloads held equal except for
 * the wall-clock fields (`TIMING_FIELDS`). Nothing here changed in the move.
 */
import { expect } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign } from '@/engine';
import type { CampaignPlan, PlanTotals } from '@/engine/plan';
import { searchPriority } from '@/engine/search';
import { sizeStacks } from '@/engine/stacker';
import type { StackRequest } from '@/engine/types';

import type { BaselineScenario, BaselineTotals } from './plan-baseline';
import type { Campaign } from './plan-campaign';
import { asCaptured, campaignOf, countsOf, greedy, marchesOf, price } from './plan-campaign';
import type { Contender, MatchedSpend } from './matched-spend';
import { TOLERANCE, markerFloors, matchedSpend, verdictWord } from './matched-spend';
import type { Scenario } from './plan-scenarios';
import { HORIZON } from './plan-scenarios';
import { perDragonCoinOf, perMonsterOf, perSoldierOf, rareStockOf } from './plan-yardsticks';
import { totalstackRows, widenedFor } from './totalstack-rows';

export const SEARCH_BUDGET_MS = CAMPAIGN.budgets.search;

// ---- the ratio readings ----------------------------------------------------------------------------------

/** Damage a silver, or NaN for a sequence that spent none (a ratio it does not have, never a record). */
export const perSilver = (c: Campaign): number => (c.silver > 0 ? c.damage / c.silver : NaN);
/**
 * **Damage a hired unit is the hired stacks' own damage per hired unit lost** (S-105, 2026-09-19; the owner:
 * *"it says over a million but in total they do less than 1M"*, then *"dmg per hired is still broken: it
 * shows a damage per hired almost above total damage"*). It read `c.damage / burned` — the **whole**
 * campaign's worst opening over the chunks of the authority pool — so on a table where the troops do most of
 * the hitting the column printed nearly the damage column again. The numerator is the part of that opening
 * the hired stacks struck for (`price`), which is the reading `PlanTotals.damagePerMercenary` is on.
 *
 * The zero rule is unchanged: `damage / 1` for a campaign that burned nothing, never `Infinity`.
 */
export const perHired = (c: Campaign): number => c.hiredDamage / Math.max(1, c.burned);
/**
 * Damage a hired soldier and damage a monster (S-98), on `perHired`'s own zero rule: a campaign that spent
 * none of one kind reads at `damage / 1`, never at `Infinity`, so a row that fields no monster sits in the
 * same column as one that does instead of topping it by arithmetic.
 *
 * **And on its own numerator since S-105**, for the reason `perHired` above is: a soldier chunk is worth what
 * the hired soldiers struck for, a monster chunk what the monsters did. The three splits are drawn off the
 * same enemy-first journal the damage column is, so each is a share of it.
 */
export const perSoldier = (c: Campaign): number => perSoldierOf(c.soldierDamage, c.soldiersLost);
export const perMonster = (c: Campaign): number => perMonsterOf(c.monsterDamage, c.monstersLost);
/**
 * **Damage a dragon coin** (S-102, 2026-09-19; the owner: *"TotalStack computes the total of dragon coins
 * needed for a stack if present and the dmg/dragon coins."*). The third currency a monster is paid in, read
 * on the same zero rule: a campaign that spends no coin — every row of every scenario here but the monster
 * camp — reads at `damage / 1` rather than topping the column by arithmetic.
 *
 * **A captured answer's coins are priced by our engine, exactly as its silver and its gold are.** TotalStack
 * sends no `monsterCaps` and comes back with an empty `monsterCounts` in all 308 captured answers
 * (`plan-yardsticks.ts` on `monsterSaving`), so no row here carries a coin figure of its own; every row on
 * the table is the same `recoveryCosts` arithmetic over the counts it answered with.
 */
export const perDragonCoin = (c: Campaign): number => perDragonCoinOf(c.damage, c.dragonCoins);

// ---- one scenario ----------------------------------------------------------------------------------------

/**
 * **The four objectives beside `avgDamage`**, as the Battle card names them (`ui/sections/battle/choices.ts`).
 * A Generate with one of these selected does not run the sizer at all — `runGenerate` branches on the
 * objective first — so a method row without them measures only half of what the button does.
 */
export const OTHER_OBJECTIVES = [
  ['minDamage', 'best worst case'],
  ['damagePerSilver', 'damage per silver'],
  ['damagePerGold', 'damage per gold'],
  ['damagePerDragonCoin', 'damage per dragon coin'],
] as const;

/**
 * **The sizer switches**, and whether each needs a dominance pool to mean anything (`engine/stacker.ts`):
 * *Allow damage trades* grows a hired stack past the floor while the worst opening improves, and works on any
 * army; *Monsters after troops* and *Monsters after mercenaries* write a ceiling on the **dominance** pool, so
 * on an army with no monster in it they answer exactly what the plain row answers.
 */
export const SIZER_VARIANTS: readonly [
  'elite' | 'ms',
  string,
  string,
  Partial<StackRequest['options']>,
  boolean,
][] = [
  ['ms', 'Troops first', 'allow damage trades', { relaxedPreservation: true }, false],
  ['elite', 'Tier ladder', 'monsters after troops', { monstersLast: true }, true],
  ['ms', 'Troops first', 'monsters after mercenaries', { strictMercsAboveMonsters: true }, true],
];

export interface Measured {
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
  /**
   * **Wall time spent inside `searchPriority`** on this army, summed over the ten Generate rows that call it
   * (S-124, 2026-09-22; the owner: *"pin where we spend time and especially where we're constrained by a
   * budget"*).
   *
   * The two searches this repo ships are budgeted differently and only one of them is actually **bound** by
   * its budget, which is the distinction that decides whether making something faster buys a better answer
   * or only a shorter wait. `planCampaign` fills whatever clock it is given — experiment 129 measured the
   * 20 000-dominance camp at 40,843–40,934 ms against a 40,000 ms cap — so a millisecond saved there is one
   * more candidate considered, and the answer improves. `searchPriority` finishes well inside its 8 000 ms
   * on every army here, so a millisecond saved there is a millisecond the player waits less and **nothing
   * else**. Until this story that difference had never been written down anywhere a run could see it, and
   * the first perf refactor of the engine was justified out loud on the wrong one of the two.
   */
  searchMs: number;
  /**
   * How many times this army called into the priority search — **ten rows, each re-searched once a march**,
   * so forty on a four-march horizon. `searchMs` is their sum, and the budget is **per call**, so the two
   * are only comparable through this number.
   */
  searchCalls: number;
  /** Which stop each plan row is, by object identity — the baseline is keyed on the engine's own `pick`. */
  picks: Map<Campaign, string>;
  /** The army measured, so the plan's own campaign can be split over its units (S-98). */
  request: StackRequest;
}

/**
 * The clocks `measure` runs under: the app's own (`CAMPAIGN.budgets`) by default, which is what the benchmark
 * measures. `UNBUDGETED` lifts both, so no deadline makes an answer depend on the machine's speed or load —
 * how `benchmark-equivalence.*.test.ts` compares the two engine paths (no army here is budget-bound, S-124, so
 * the answers are the same ones).
 */
export interface Budgets {
  /** Per `searchPriority` call; `0` is no deadline. */
  search: number;
  /** The plan's; `undefined` is no deadline. */
  plan: number | undefined;
}
export const APP_BUDGETS: Budgets = { search: SEARCH_BUDGET_MS, plan: CAMPAIGN.budgets.plan };
export const UNBUDGETED: Budgets = { search: 0, plan: undefined };

export function measure(scenario: Scenario, budgets: Budgets = APP_BUDGETS): Measured {
  const { request } = scenario;
  const rows: Campaign[] = [];
  // Every call into the priority search on this army, timed (S-124). It is wrapped here rather than inside
  // the engine so that measuring costs the app nothing.
  let searchMs = 0;
  let searchCalls = 0;
  const timedSearch = (r: StackRequest, objective: Parameters<typeof searchPriority>[0]['objective']) => {
    const startedSearch = performance.now();
    const found = searchPriority({ request: r, objective, budgetMs: budgets.search });
    searchMs += performance.now() - startedSearch;
    searchCalls += 1;
    return found;
  };
  const housesMonsters =
    request.housing.dominance > 0 && request.units.some((unit) => unit.pool === 'dominance');
  for (const [method, title] of [
    ['elite', 'Tier ladder'],
    ['ms', 'Troops first'],
  ] as const) {
    rows.push(greedy(request, method, `${title} · all types`, (r) => countsOf(sizeStacks(r))));
    rows.push(
      greedy(request, method, `${title} · Generate (average damage)`, (r) =>
        countsOf(timedSearch(r, 'avgDamage').result),
      ),
    );
    // **Every other objective the Battle card offers** (S-118). `avgDamage` above is the one this table has
    // asked for since it was written, and the four below had no row on any army — which is how a march that
    // fields *no troops at all* stayed invisible: `damagePerSilver` empties the leadership pool on every
    // army here that houses a dominance pool, because dropping the troops takes the silver bill down far
    // faster than it takes the damage. They are `variant` rows, so no pin moves (see `Campaign.kind`).
    for (const [objective, words] of OTHER_OBJECTIVES) {
      rows.push(
        greedy(
          request,
          method,
          `${title} · Generate (${words})`,
          (r) => countsOf(timedSearch(r, objective).result),
          'variant',
        ),
      );
    }
  }
  // **The sizer flags** (S-118): the three switches the Battle card puts under the method, each a row of its
  // own so a change to one is a change a reader can see. Two of them only *do* anything on an army that
  // houses monsters — they write a ceiling on the dominance pool — so on the fourteen armies that hold none
  // they would be a second copy of the row above and are left off rather than printed as filler.
  for (const [method, title, words, flags, needsMonsters] of SIZER_VARIANTS) {
    if (needsMonsters && !housesMonsters) continue;
    rows.push(
      greedy(request, method, `${title} · ${words}`, (r) => countsOf(sizeStacks(r)), 'variant', flags),
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
  /**
   * **No two rows on one table may share a name** (S-121, 2026-09-22). A hard throw, because it says the
   * data or this file is wrong rather than that the engine is: `asBaseline` keys `ratios.externals` by name
   * through `Object.fromEntries`, so a collision does not fail, it **overwrites** — one of the pair's
   * standings simply never reaches the baseline. Eight armies carried such a pair until `methodOf` was
   * taught to read `monsterSaving` on the `optimize` route, and nothing said so.
   */
  const names = new Set<string>();
  for (const row of rows) {
    expect(names.has(row.name), `two rows on ${scenario.label} are both called "${row.name}"`).toBe(false);
    names.add(row.name);
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
      ...(budgets.plan === undefined ? {} : { budgetMs: budgets.plan }),
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
  return { rows, plan, refusal, planMs, searchMs: Math.round(searchMs), searchCalls, picks, request };
}

/**
 * This run's figures in the shape the registered baseline holds (`plan-baseline.ts`): every stop the bar
 * offered, the plan's own campaign, and the standing ratios against the sizers and the captured answers. It
 * is what `pnpm bench:baseline` writes out for the owner and what `check` compares a run against.
 */
export function asBaseline(measured: Measured): BaselineScenario | null {
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
    // And the third currency's ratio (S-102), appended after the five S-98 added for the same reason: a
    // proposal written before this story and one written after differ by this one line.
    perDragonCoin: perDragonCoin(c),
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
  // is the pooled figure the search is ordered by; this is the same chunks told apart — and, since S-105,
  // the damage each of those two groups struck for, priced off the same marches by `price` so the two
  // ratios below divide a numerator of their own rather than the campaign's whole damage.
  const planRare = marchesOf(plan as PlanTotals).reduce<{
    soldiersLost: number;
    monstersLost: number;
    soldierDamage: number;
    monsterDamage: number;
  }>(
    (into, counts) => {
      const one = rareStockOf(measured.request.units, counts);
      const struck = price(measured.request, counts);
      return {
        soldiersLost: into.soldiersLost + one.soldiersLost,
        monstersLost: into.monstersLost + one.monstersLost,
        soldierDamage: into.soldierDamage + struck.soldierDamage,
        monsterDamage: into.monsterDamage + struck.monsterDamage,
      };
    },
    { soldiersLost: 0, monstersLost: 0, soldierDamage: 0, monsterDamage: 0 },
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
      // The engine's own `hiredDamage` over its own burn (S-105) — the same ratio as
      // `PlanTotals.damagePerMercenary`, on the table's zero rule rather than on the payload's `Infinity`.
      perHired: plan.hiredDamage / Math.max(1, plan.mercLost),
      soldiersLost: planRare.soldiersLost,
      monstersLost: planRare.monstersLost,
      dragonCoins: plan.dragonCoins,
      perSoldier: perSoldierOf(planRare.soldierDamage, planRare.soldiersLost),
      perMonster: perMonsterOf(planRare.monsterDamage, planRare.monstersLost),
      // The engine's own `PlanTotals.damagePerDragonCoin` answers `Infinity` where no coin was spent; the
      // baseline's column is a figure a run is compared on, so it takes the table's zero rule (S-102).
      perDragonCoin: perDragonCoinOf(plan.totalDamage, plan.dragonCoins),
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
      // The monsters' own third price, standing where the two above it do (S-102): the bar's best damage a
      // dragon coin over the best sizer sequence's and over each comparable captured answer's. Their coins
      // are our engine's pricing of the counts they answered with — no calculator outside this repo reports
      // one — so the quotient is two marches compared, not two arithmetics.
      perDragonCoin: standing(perDragonCoin),
      // The third of the owner's three readings (S-101), added last for the same reason: his goal names
      // *"silver/dmg, merc/dmg and monster/dmg"*, and only the last two of those were registered. Damage a
      // silver was on the table as a **pin** (`silverFloor`, against the sizers) and in every row of the
      // report, but never as a standing the baseline holds, so a run that gave up ground on it against a
      // captured answer was not a failure. It is one now.
      perSilver: standing((c) => (Number.isFinite(perSilver(c)) ? perSilver(c) : 0)),
    },
  };
}

// ---- the primary reading: dominance at matched spend (S-121) ---------------------------------------------

/**
 * **The two sides of the comparison**: every stop the bar offered, and every march a calculator outside this
 * repo answered that the army could actually field.
 *
 * *Ours* is the **plan's stops** and nothing else, because the sentence being tested is about the bar — the
 * thing the app recommends. The sizers and the fifteen variant rows beside them are what we *could* have
 * answered with, and on more than one army here they hit harder than every stop does (§3's G1 is exactly
 * that: our own Tier ladder within 11 % of TotalStack where our best stop is 3.2× behind it). That is worth
 * knowing and it is printed below as a diagnostic, but a verdict that let the bar claim a sizer's march
 * would be scoring a product nobody ships.
 */
export const contenders = (rows: Campaign[], kind: Campaign['kind']): Contender[] =>
  rows.filter((c) => c.kind === kind && c.comparable);

export interface Verdict {
  matched: MatchedSpend;
  /**
   * **The same question asked of everything we can answer with** — the stops, the two sizers, their three
   * switches and all five objectives. Never pinned and never a verdict: it is the diagnostic that told us
   * G1 and G4 apart from the rest, because an army where *this* beats them and the bar does not is an army
   * where the damage is provably reachable and the plan is simply not reaching it.
   */
  anything: MatchedSpend;
  floors: ReturnType<typeof markerFloors>;
}

export function verdictOf(measured: Measured): Verdict {
  const plans = contenders(measured.rows, 'plan');
  const externals = contenders(measured.rows, 'external');
  const everything = measured.rows.filter((c) => c.kind !== 'external' && c.comparable);
  return {
    matched: matchedSpend(plans, externals),
    anything: matchedSpend(everything, externals),
    floors: markerFloors(plans, externals),
  };
}

/**
 * **The figures `benchmark-run.json` records for one army** — everything the run writes about it, in the order
 * it has always written it. The wall-clock fields among them are `TIMING_FIELDS`.
 */
export function figuresOf(label: string, measured: Measured, verdict: Verdict = verdictOf(measured)) {
  return {
    label,
    refusal: measured.refusal,
    stops: measured.plan?.alternatives.map((stop) => stop.pick) ?? [],
    planMs: measured.planMs,
    // **Where the time went, and whether a clock was binding** (S-124). Timings are machine-dependent and
    // nothing here is asserted on them; what is worth recording is the *shape* — which of the two searches
    // spent the time, and whether either of them ran out of budget rather than out of ideas.
    searchMs: measured.searchMs,
    searchCalls: measured.searchCalls,
    planBudgetMs: CAMPAIGN.budgets.plan,
    searchBudgetMs: SEARCH_BUDGET_MS,
    planBudgetBound: measured.planMs >= CAMPAIGN.budgets.plan * 0.98,
    // The shape a registered baseline holds, carried in the run's own figures so `pnpm bench:baseline` can
    // write a proposal out of this file without running the suite twice (`plan-baseline.ts`).
    baseline: asBaseline(measured),
    // **The matched-spend verdict** (S-121), carried in the payload so the standing table at the end of the
    // run — and any later before/after comparison — reads the same figures the assertions did rather than
    // recomputing them from the rows and drifting.
    matched: {
      tolerance: TOLERANCE,
      verdict: verdictWord(verdict.matched.hardest),
      hardest: verdict.matched.hardest?.theirs.name ?? null,
      theirDamage: Math.round(verdict.matched.hardest?.theirs.damage ?? 0),
      ourStop: verdict.matched.hardest?.ours?.name ?? null,
      ourDamage: Math.round(verdict.matched.hardest?.ours?.damage ?? 0),
      delta: Number.isFinite(verdict.matched.hardest?.delta ?? Number.NaN)
        ? Math.round((verdict.matched.hardest?.delta ?? 0) * 10_000) / 10_000
        : null,
      over: verdict.matched.hardest?.over ?? [],
      rows: verdict.matched.rows.length,
      rowsBeaten: verdict.matched.rowsBeaten,
      unfitted: verdict.matched.unfitted,
      worst: verdict.matched.worst
        ? {
            name: verdict.matched.worst.theirs.name,
            delta: Math.round(verdict.matched.worst.delta * 10_000) / 10_000,
          }
        : null,
      // The diagnostic, never a verdict: what every algorithm the app offers would have dominated.
      anythingBeaten: verdict.anything.rowsBeaten,
      floors: verdict.floors,
    },
    rows: measured.rows.map((c) => ({
      name: c.name,
      kind: c.kind,
      comparable: c.comparable,
      marches: c.marches,
      troopTypes: c.troopTypes,
      leadershipUsed: c.leadershipUsed,
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
      // S-102, appended last for the reason S-98's five were: every field above is written exactly as it
      // was, so a snapshot taken before this story and one taken after differ by this line and by the
      // figures the monster camp itself moved.
      perDragonCoin: Math.round(perDragonCoin(c)),
      // S-105, appended last for the same reason: the numerators of the three rare readings above, so a
      // reader of the snapshot can see what the hired stacks, the hired soldiers and the monsters of this
      // campaign actually struck for beside the ratios they are divided into.
      hiredDamage: Math.round(c.hiredDamage),
      soldierDamage: Math.round(c.soldierDamage),
      monsterDamage: Math.round(c.monsterDamage),
    })),
  };
}

/** The fields of `figuresOf` that read a clock (S-124), and so differ between two runs of the same engine. */
export const TIMING_FIELDS = ['planMs', 'searchMs', 'planBudgetBound'] as const;
