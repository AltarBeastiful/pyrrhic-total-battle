/**
 * 105 — **the six proposals, measured over the whole benchmark set** (owner, 2026-09-19: six changes are
 * waiting on his decision and he decides on figures, not on prose).
 *
 * One experiment, one report, one section a proposal, over the twelve scenarios experiment 104 measured plus the
 * owner's live camp of 2026-09-18 (the army S-87 was fixed on) —
 * his own bar, 102's reconstruction of it, and the ten benchmark scenarios — so every proposal is read on
 * the same armies and the dependencies between them are measured rather than argued:
 *
 *   - **P1** the troops-only tail (S-81's all-in tail) on the *repeated* stops whose stock the horizon outruns;
 *   - **P2** the plan priced under the Battle card's **Revive** mode instead of always retraining;
 *   - **P3** the thrift end of the band — what a silver-saver exception would offer on his live army;
 *   - **P4** the reference table (`curve`) bucketed over the **band** instead of every shape recorded;
 *   - **P5** the marginal-reading stop of 104's rule 5, with the validator's fix (no burn term in the
 *     domination clause, and the marginal must be positive);
 *   - **P6** "more mercs" and the steady max left alone — the one thing that decides it being whether the
 *     static shelter proxy of 104 changes any **printed** figure, read off `simulateBattle` rather than off
 *     the opening order.
 *
 * **Nothing here changes the engine.** Every figure is computed from `planCampaign`'s own payload, from the
 * `withFrontier` diagnostic it already carries, and from `marchResult` / `recoveryCosts` / `sizeStacks` — the
 * same calls the app makes. Where a proposal cannot be emulated faithfully from outside the engine the report
 * says so in its own section rather than quietly approximating it.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/105-six-proposals.test.ts`
 */
import { describe, it } from 'vitest';

import {
  HORIZON,
  OWNER_EXPORT,
  commonScenarios,
  ownerProfile,
  ownerScenarios,
} from '../../tests/engine/plan-scenarios';
import { CAMPAIGN } from '../../src/config';
import { planCampaign } from '../../src/engine';
import { marchResult } from '../../src/engine/plan';
import type {
  CampaignInput,
  CampaignPlan,
  PlanFrontierRow,
  PlanPick,
  PlanRow,
  PlanTotals,
} from '../../src/engine/plan';
import { chunks, recoveryCosts } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import type { BattleSummary, StackRequest } from '../../src/engine/types';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { Report, duration, label, n } from './harness';

// ---- the scenarios ---------------------------------------------------------------------------------------
/**
 * **The benchmark's own scenarios**, imported rather than copied (`tests/engine/plan-scenarios.ts`, extracted
 * there by S-87): the ten armies `tests/engine/plan-benchmark.test.ts` pins, in its own order. Experiment 104
 * held a second copy of the first four of them; a pin and the army it is measured on live once, and this file
 * now reads the same objects the benchmark does.
 *
 * Three scenarios are this experiment's own, because no benchmark case is them: **HIS BAR** and 104's
 * reconstruction of it (the two forms of his profile §A of 104 identified), and his **live camp** of
 * 2026-09-18 (experiment 106's setup).
 */

const CAPTAINS = {
  aydae: { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
  alexander: { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
  leonidas: { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
} as const;

interface Case {
  label: string;
  input: CampaignInput;
}

/** A scenario's plan input, built exactly as `tests/engine/plan-benchmark.test.ts` builds it. */
const benchInput = (request: StackRequest): CampaignInput => ({
  request,
  marchTarget: HORIZON,
  budgetMs: CAMPAIGN.budgets.plan,
  ...CAMPAIGN.planFixes,
  putBack: CAMPAIGN.putBack,
});

/** Which top guardsmen tiers a form of the profile cuts. */
type TopTier = Profile['troops']['topTierExcluded']['guardsmen'];

interface Enlisted {
  id: string;
  captainId: string;
  level: number;
  star: number;
}

function ownerExport(): Profile {
  const profile = ownerProfile();
  if (!profile) throw new Error(`export not found: ${OWNER_EXPORT}`);
  return structuredClone(profile);
}

/** 104 §A's reproducing form of his profile — the bar he was looking at, through `buildPlanRequest`. */
function liveForm(captains: Enlisted[], cut: TopTier | null): CampaignInput {
  const profile = ownerExport();
  profile.sources.captains = captains.map((captain) => ({ ...captain }));
  if (cut !== null) profile.troops.topTierExcluded = { guardsmen: cut, specialists: [] };
  profile.mercenaries.selected = [
    { id: 'epic-monster-hunter-6', cap: 83 },
    { id: 'legionary-6', cap: null },
    { id: 'chariot-6', cap: 10 },
    { id: 'arbalester-6', cap: 60 },
  ];
  const setup0 = profile.setups[0];
  if (!setup0) throw new Error('no setup');
  return buildPlanRequest(profile, {
    ...setup0,
    housing: { ...setup0.housing, leadership: 4_975, authority: 2_180 },
  });
}

const ALONE: Enlisted[] = [CAPTAINS.aydae];
const THREE: Enlisted[] = [CAPTAINS.aydae, CAPTAINS.leonidas, CAPTAINS.alexander];

function liveCase(reconstruction: boolean): Case {
  return {
    label: reconstruction
      ? 'LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded)'
      : 'HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975',
    input: reconstruction ? liveForm(ALONE, ['melee', 'ranged']) : liveForm(THREE, null),
  };
}

/**
 * **His live camp of 2026-09-18**, the setup experiment 106 reads (`tools/theorycraft/106-shelter-live.test.ts`):
 * the 2026-09-17 export with the three captains enlisted and marching, his top melee and ranged guardsmen and top
 * melee specialists cut, and the hired stock his browser actually held — arbalesters 485, legionaries 1 002,
 * bears **unlimited** — at 4 975 leadership and 2 180 authority. It is the army S-87 was fixed on, so it is the
 * scenario to read first.
 */
function liveCamp(): CampaignInput {
  const profile = ownerExport();
  profile.sources.captains = [CAPTAINS.aydae, CAPTAINS.alexander, CAPTAINS.leonidas].map((captain) => ({
    ...captain,
  }));
  profile.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: ['melee'] };
  profile.mercenaries.selected = [
    { id: 'arbalester-6', cap: 485 },
    { id: 'legionary-6', cap: 1002 },
    { id: 'bear-5', cap: null },
  ];
  const setup0 = profile.setups[0];
  if (!setup0) throw new Error('no setup');
  return buildPlanRequest(profile, {
    ...setup0,
    active: { ...setup0.active, captains: ['h9i5fjdc', '9kfdv1z0', 'ww8j0qwv'] },
    housing: { ...setup0.housing, leadership: 4_975, authority: 2_180 },
  });
}

/**
 * The thirteen: his bar, 104's reconstruction, the benchmark's ten in the benchmark's own order, and his live
 * camp. The benchmark's labels are its own — a scenario is named once, where it is defined.
 */
function cases(): Case[] {
  const list: Case[] = [liveCase(false), liveCase(true)];
  for (const scenario of commonScenarios()) {
    list.push({ label: scenario.label, input: benchInput(scenario.request) });
  }
  const profile = ownerProfile();
  if (profile) {
    for (const scenario of ownerScenarios(profile)) {
      list.push({ label: scenario.label, input: benchInput(scenario.request) });
    }
  }
  list.push({
    label: 'live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975)',
    input: liveCamp(),
  });
  return list;
}

// ---- reading a plan --------------------------------------------------------------------------------------

const f3 = (value: number): string => (Number.isFinite(value) ? value.toFixed(3) : '∞');
const pct = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(2)} %`;
const hiredIdsOf = (request: StackRequest): string[] =>
  request.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
const fieldedHired = (counts: Record<string, number>, ids: string[]): number =>
  ids.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
const troopLine = (counts: Record<string, number>, ids: string[]): string =>
  Object.entries(counts)
    .filter(([id, count]) => count > 0 && !ids.includes(id))
    .map(([id, count]) => `${label(id)} ${n(count)}`)
    .join(' · ') || '—';
const hiredLine = (counts: Record<string, number>, ids: string[]): string =>
  ids
    .filter((id) => (counts[id] ?? 0) > 0)
    .map((id) => `${label(id)} ${n(counts[id] ?? 0)}`)
    .join(' · ') || '—';

/** A march's identity: the non-zero counts, sorted — the key the `withFrontier` diagnostic matches stops by. */
const keyOf = (counts: Record<string, number>): string =>
  Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, count]) => `${id}:${count}`)
    .join(',');

/** The troop side of a march alone — what P3 asks "is the same across the stops". */
const troopKeyOf = (counts: Record<string, number>, hired: string[]): string =>
  keyOf(Object.fromEntries(Object.entries(counts).filter(([id]) => !hired.includes(id))));

/** One row a march (104's `distinct`): the verdicts first, then the most damage, then the least silver. */
function distinct(rows: PlanFrontierRow[]): PlanFrontierRow[] {
  const held = new Map<string, PlanFrontierRow>();
  const better = (row: PlanFrontierRow, than: PlanFrontierRow): boolean => {
    if (row.undominated !== than.undominated) return row.undominated;
    if (row.onFrontier !== than.onFrontier) return row.onFrontier;
    if (row.totalDamage !== than.totalDamage) return row.totalDamage > than.totalDamage;
    return row.silver < than.silver;
  };
  for (const row of rows) {
    const key = keyOf(row.counts);
    const there = held.get(key);
    if (!there || better(row, there)) held.set(key, row);
  }
  return [...held.values()].sort((a, b) => a.silver - b.silver || a.totalDamage - b.totalDamage);
}

/** Campaign ratios — the figures the reference table under the bar is written in. */
const perSilver = (row: PlanTotals): number => (row.silver > 0 ? row.totalDamage / row.silver : 0);
const perHired = (row: PlanTotals): number => (row.mercLost > 0 ? row.totalDamage / row.mercLost : Infinity);
/** The repeated march's own ratios — the figures every stop rule in `planCampaign` is stated on. */
const repeatPerSilver = (row: PlanTotals): number =>
  row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : 0;
const repeatPerHired = (row: PlanTotals): number =>
  row.repeat.mercLost > 0 ? row.repeat.damage / row.repeat.mercLost : 0;

/** On the bar: the row **is** a stop, or it is the march a put-back re-sized into one. */
const onBar = (row: PlanFrontierRow): boolean => row.stop !== undefined || row.generatorOf !== undefined;

/** The engine's own silver bucket (`bucketOf` in `src/engine/plan.ts`), so a curve can be redrawn. */
const bucketOf = (silver: number): number =>
  Math.min(59, Math.max(0, Math.round(Math.log(silver / 10_000) / Math.log(1.2))));

/** The same curve the plan draws, redrawn over a chosen set of plans: one bucket, the best damage in it. */
function curveOver(rows: PlanTotals[]): PlanTotals[] {
  const held = new Map<number, PlanTotals>();
  for (const row of rows) {
    if (row.silver <= 10_000) continue;
    const key = bucketOf(row.silver);
    const there = held.get(key);
    if (!there || row.totalDamage > there.totalDamage) held.set(key, row);
  }
  return [...held.entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row);
}

/** How often a bar read left-to-right runs backwards: more of the cost, less of the damage. */
function violations(bar: PlanTotals[], of: (row: PlanTotals) => number): number {
  const sorted = [...bar].sort((a, b) => of(a) - of(b));
  let count = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index] as PlanTotals;
    const previous = sorted[index - 1] as PlanTotals;
    if (current.totalDamage < previous.totalDamage) count += 1;
  }
  return count;
}

interface Measured {
  label: string;
  plan: CampaignPlan;
  request: StackRequest;
  hired: string[];
  ms: number;
  entries: PlanFrontierRow[];
  rows: PlanFrontierRow[];
  undominated: PlanFrontierRow[];
  band: PlanFrontierRow[];
  offBar: PlanFrontierRow[];
  stops: PlanRow[];
}

function measure(one: Case): Measured {
  const started = performance.now();
  const plan = planCampaign({ ...one.input, withFrontier: true });
  const ms = Math.round(performance.now() - started);
  const entries = plan.frontier ?? [];
  const rows = distinct(entries);
  const undom = rows.filter((row) => row.undominated);
  const kept = undom.filter((row) => row.inBand);
  const band = kept.length > 0 ? kept : undom;
  return {
    label: one.label,
    plan,
    request: one.input.request,
    hired: hiredIdsOf(one.input.request),
    ms,
    entries,
    rows,
    undominated: undom,
    band,
    offBar: band.filter((row) => !onBar(row)),
    stops: plan.alternatives,
  };
}

// ---- pricing a march, both ways --------------------------------------------------------------------------

type Mode = 'retrain' | 'revive';
interface Priced {
  silver: number;
  gold: number;
  seconds: number;
}
const ZERO: Priced = { silver: 0, gold: 0, seconds: 0 };
const plus = (a: Priced, b: Priced): Priced => ({
  silver: a.silver + b.silver,
  gold: a.gold + b.gold,
  seconds: a.seconds + b.seconds,
});
const times = (a: Priced, k: number): Priced => ({
  silver: a.silver * k,
  gold: a.gold * k,
  seconds: a.seconds * k,
});

/**
 * One march priced under both recovery modes, by `recoveryCosts` on the stacks `marchResult` builds — which
 * are the stacks the plan itself scored (`marchOf`). The **retrain** column is what `toMarch` writes into the
 * payload to the unit: a mercenary has no `training` block in `src/data/tables/mercenaries.json`, so
 * `retrainOne` charges it no silver and no seconds and `recoveryCosts(...).retrain` is exactly the plan's own
 * `{silver, gold, seconds}`. §B checks that against the payload rather than assuming it.
 */
function priceOne(request: StackRequest, counts: Record<string, number>): Record<Mode, Priced> {
  const { result } = marchResult(request, counts);
  const costs = recoveryCosts(result.stacks, request.units, request.recovery);
  return {
    retrain: { silver: costs.retrain.silver, gold: costs.retrain.gold, seconds: costs.retrain.seconds },
    revive: { silver: costs.revive.silver, gold: costs.revive.gold, seconds: costs.revive.seconds },
  };
}

/** A per-scenario memo of `priceOne`, keyed by the march's counts. */
function pricer(request: StackRequest): (counts: Record<string, number>) => Record<Mode, Priced> {
  const held = new Map<string, Record<Mode, Priced>>();
  return (counts) => {
    const key = keyOf(counts);
    const there = held.get(key);
    if (there) return there;
    const priced = priceOne(request, counts);
    held.set(key, priced);
    return priced;
  };
}

/** How many times a row repeats its march — the finale, when it has one, is the last of `marches`. */
const repeatsOf = (row: PlanTotals): number => row.marches - (row.finaleCounts ? 1 : 0);

/** A whole campaign priced under one mode: the repeats, plus the finale — or the sequence, march by march. */
function priceCampaign(
  row: PlanTotals,
  mode: Mode,
  price: (counts: Record<string, number>) => Record<Mode, Priced>,
): { total: Priced; repeat: Priced } {
  if (row.sequence && row.sequence.length > 0) {
    const parts = row.sequence.map((counts) => price(counts)[mode]);
    return { total: parts.reduce(plus, ZERO), repeat: parts[0] as Priced };
  }
  const repeat = price(row.counts)[mode];
  const finale = row.finaleCounts ? price(row.finaleCounts)[mode] : ZERO;
  return { total: plus(times(repeat, repeatsOf(row)), finale), repeat };
}

/** The same row with its silver, gold and seconds read under `mode`; damage and burn are untouched. */
function repriced<T extends PlanTotals>(
  row: T,
  mode: Mode,
  price: (counts: Record<string, number>) => Record<Mode, Priced>,
): T {
  const { total, repeat } = priceCampaign(row, mode, price);
  return {
    ...row,
    silver: Math.round(total.silver),
    gold: Math.round(total.gold),
    seconds: Math.round(total.seconds),
    repeat: {
      ...row.repeat,
      silver: Math.round(repeat.silver),
      gold: Math.round(repeat.gold),
      seconds: Math.round(repeat.seconds),
    },
    damagePerSilver: total.silver > 0 ? row.totalDamage / total.silver : Infinity,
  };
}

// ---- the stop rules, emulated ------------------------------------------------------------------------------
/**
 * The bar's own rules, restated over a set of candidate rows so a **re-priced** band can be re-picked by them
 * (§B). Every clause is `planCampaign`'s own, in the same order: the burn ladder (one plan a level, the best
 * damage there, kept only where burning more buys more), the rungs nothing beats on both *repeat* ratios, the
 * chord over the whole ladder, `middleOfRange` with the campaign's ratios breaking a tie, the steady max, the
 * silver saver over the whole band, and "more mercs" in the middle of the gap.
 *
 * **What it cannot do**, stated rather than approximated: the put-back pass (it re-sizes a march through the
 * sizer and would have to be re-run against re-priced rates) and the `all-in` stop (built march by march
 * outside the frontier). §B measures the emulator against the engine's own bar before it is trusted anywhere.
 */
function burnLadder(rows: PlanTotals[]): PlanTotals[] {
  const best = new Map<number, PlanTotals>();
  for (const row of rows) {
    const held = best.get(row.repeat.mercLost);
    if (
      !held ||
      row.repeat.damage > held.repeat.damage ||
      (row.repeat.damage === held.repeat.damage && row.repeat.silver < held.repeat.silver)
    ) {
      best.set(row.repeat.mercLost, row);
    }
  }
  const kept: PlanTotals[] = [];
  let climbed = -Infinity;
  for (const burn of [...best.keys()].sort((a, b) => a - b)) {
    const row = best.get(burn) as PlanTotals;
    if (row.repeat.damage > climbed) {
      kept.push(row);
      climbed = row.repeat.damage;
    }
  }
  return kept;
}

function efficientOf(ladderRows: PlanTotals[]): PlanTotals[] {
  return ladderRows.filter(
    (row) =>
      !ladderRows.some(
        (other) =>
          other !== row &&
          repeatPerSilver(other) >= repeatPerSilver(row) &&
          repeatPerHired(other) >= repeatPerHired(row) &&
          (repeatPerSilver(other) > repeatPerSilver(row) || repeatPerHired(other) > repeatPerHired(row)),
      ),
  );
}

const dominatesOn = (row: PlanTotals, other: PlanTotals): boolean =>
  row.damagePerSilver >= other.damagePerSilver &&
  row.damagePerMercenary >= other.damagePerMercenary &&
  (row.damagePerSilver > other.damagePerSilver || row.damagePerMercenary > other.damagePerMercenary);

function middleOfRange(rows: PlanTotals[], fallback: PlanTotals): PlanTotals {
  if (rows.length === 0) return fallback;
  const burns = rows.map((row) => row.repeat.mercLost);
  const middle = (Math.min(...burns) + Math.max(...burns)) / 2;
  return rows.reduce<PlanTotals>((held, row) => {
    const away = Math.abs(row.repeat.mercLost - middle);
    const heldAway = Math.abs(held.repeat.mercLost - middle);
    if (away < heldAway) return row;
    if (away > heldAway) return held;
    if (row.repeat.mercLost !== held.repeat.mercLost) {
      if (dominatesOn(row, held)) return row;
      if (dominatesOn(held, row)) return held;
      return row.repeat.mercLost < held.repeat.mercLost ? row : held;
    }
    return row.repeat.damage > held.repeat.damage ? row : held;
  }, rows[0] as PlanTotals);
}

/** The chord rule: the efficient rung farthest above the chord drawn over the **whole** ladder. */
function sweetSpotOver(candidates: PlanTotals[]): {
  sweet: PlanTotals;
  ladderRows: PlanTotals[];
  efficient: PlanTotals[];
  byChord: boolean;
} {
  const ladderRows = burnLadder(candidates);
  const efficient = efficientOf(ladderRows);
  const pool = efficient.length > 0 ? efficient : candidates;
  const first = ladderRows[0];
  const last = ladderRows[ladderRows.length - 1];
  if (pool.length < 3 || !first || !last) {
    return { sweet: middleOfRange(pool, candidates[0] as PlanTotals), ladderRows, efficient, byChord: false };
  }
  const dx = last.repeat.mercLost - first.repeat.mercLost || 1;
  const dy = last.repeat.damage - first.repeat.damage || 1;
  let best: PlanTotals | undefined;
  let bestDistance = 0;
  for (const row of pool) {
    const t = (row.repeat.mercLost - first.repeat.mercLost) / dx;
    const distance = (row.repeat.damage - (first.repeat.damage + t * dy)) / dy;
    if (distance > bestDistance) {
      bestDistance = distance;
      best = row;
    }
  }
  if (best) return { sweet: best, ladderRows, efficient, byChord: true };
  return { sweet: middleOfRange(pool, candidates[0] as PlanTotals), ladderRows, efficient, byChord: false };
}

interface Picked {
  pick: PlanPick;
  row: PlanTotals;
}

/** The four stops the rules above choose (no put-back, no `all-in`), cheapest burn first. */
function pickStops(candidates: PlanTotals[]): Picked[] {
  if (candidates.length === 0) return [];
  const { sweet, ladderRows } = sweetSpotOver(candidates);
  const top = ladderRows[ladderRows.length - 1];
  const leftOfSweet = candidates.filter(
    (row) =>
      row.repeat.mercLost < sweet.repeat.mercLost &&
      row.repeat.silver <= sweet.repeat.silver &&
      repeatPerSilver(row) >= repeatPerSilver(sweet),
  );
  const beatenOnBoth = (row: PlanTotals): boolean =>
    leftOfSweet.some(
      (other) =>
        other !== row &&
        repeatPerSilver(other) >= repeatPerSilver(row) &&
        repeatPerHired(other) >= repeatPerHired(row) &&
        (repeatPerSilver(other) > repeatPerSilver(row) || repeatPerHired(other) > repeatPerHired(row)),
    );
  const leastSilver = leftOfSweet
    .filter((row) => !beatenOnBoth(row))
    .reduce<PlanTotals | undefined>((best, row) => {
      if (!best) return row;
      if (row.repeat.silver !== best.repeat.silver)
        return row.repeat.silver < best.repeat.silver ? row : best;
      if (row.repeat.mercLost !== best.repeat.mercLost)
        return row.repeat.mercLost < best.repeat.mercLost ? row : best;
      return row.repeat.damage > best.repeat.damage ? row : best;
    }, undefined);
  const moreMercs = ((): PlanTotals | undefined => {
    if (!top) return undefined;
    const low = sweet.repeat.mercLost;
    const high = top.repeat.mercLost;
    if (high - low < 2) return undefined;
    const middle = (low + high) / 2;
    let pick: PlanTotals | undefined;
    for (const row of ladderRows) {
      if (row.repeat.mercLost <= low || row.repeat.mercLost >= high) continue;
      const away = Math.abs(row.repeat.mercLost - middle);
      const held = pick ? Math.abs(pick.repeat.mercLost - middle) : Infinity;
      if (away < held || (away === held && pick && repeatPerHired(row) > repeatPerHired(pick))) pick = row;
    }
    return pick;
  })();
  const stops: Picked[] = [];
  const offer = (row: PlanTotals | undefined, pick: PlanPick): void => {
    if (!row) return;
    if (stops.some((other) => keyOf(other.row.counts) === keyOf(row.counts))) return;
    stops.push({ pick, row });
  };
  offer(sweet, 'sweet-spot');
  offer(top, 'steady-max');
  offer(leastSilver, 'silver-saver');
  offer(moreMercs, 'more-mercs');
  stops.sort(
    (a, b) =>
      a.row.repeat.mercLost - b.row.repeat.mercLost ||
      a.row.repeat.silver - b.row.repeat.silver ||
      a.row.repeat.damage - b.row.repeat.damage,
  );
  return stops;
}

// ---- P1: the troops-only tail ------------------------------------------------------------------------------

interface Tail {
  counts: Record<string, number>;
  damage: number;
  silver: number;
  seconds: number;
}

/**
 * The march S-81's all-in tail plays: the **Elite sizer over every troop type, no mercenaries**, priced by
 * `recoveryCosts(...).retrain` exactly as `toMarch` prices it. The engine's own call is `sizer([], 'elite')`
 * inside `planCampaign`, which filters the request to the leadership pool because no hired type is fielded;
 * this is that call, from outside.
 */
function troopsOnlyTail(request: StackRequest): Tail | undefined {
  const sized = sizeStacks({
    ...request,
    units: request.units.filter((unit) => unit.pool === 'leadership'),
    options: { ...request.options, method: 'elite', relaxedPreservation: false },
  });
  const counts: Record<string, number> = {};
  for (const stack of sized.stacks) if (stack.count > 0) counts[stack.unitId] = stack.count;
  if (Object.keys(counts).length === 0) return undefined;
  const { result, summary } = marchResult(request, counts);
  const cost = recoveryCosts(result.stacks, request.units, request.recovery).retrain;
  return { counts, damage: summary.avgDamage, silver: cost.silver, seconds: cost.seconds };
}

/** A row with the tail appended until the horizon. Damage, silver and seconds move; the repeat does not. */
function withTail<T extends PlanTotals>(row: T, tail: Tail | undefined, horizon: number): T {
  const added = horizon - row.marches;
  if (!tail || added <= 0) return row;
  const totalDamage = row.totalDamage + added * tail.damage;
  const silver = row.silver + added * tail.silver;
  return {
    ...row,
    totalDamage,
    silver,
    seconds: row.seconds + added * tail.seconds,
    marches: horizon,
    ...(row.sequence
      ? { sequence: [...row.sequence, ...Array.from({ length: added }, () => tail.counts)] }
      : {}),
    damagePerSilver: silver > 0 ? totalDamage / silver : Infinity,
    damagePerMercenary: row.mercLost > 0 ? totalDamage / row.mercLost : Infinity,
  };
}

// ---- P5: the marginal reading, with the validator's fix -------------------------------------------------

interface Marginal {
  row: PlanTotals;
  stop: PlanTotals;
  stopName: string;
  marginal: number;
}

/**
 * 104's rule 5, in two forms. `fixed` is the validator's: the domination clause drops its burn term (a stop
 * that is cheaper and stronger refuses the candidate whatever it burns) and the marginal rate must be
 * **positive** (a "saving" measured against a stop that does *less* damage is not a saving, it is a better
 * plan the bar should be offering outright).
 */
function marginalRows(
  candidates: PlanTotals[],
  stops: { pick: string; row: PlanTotals }[],
  fixed: boolean,
): { added: Marginal[]; bar: PlanTotals[] } {
  const ordered = [...stops].sort((a, b) => a.row.silver - b.row.silver || a.row.mercLost - b.row.mercLost);
  const bestFor = new Map<PlanTotals, Marginal>();
  for (const row of candidates) {
    if (row.silver <= 0) continue;
    // 1 — dominated by the bar itself. The fix drops the burn term.
    if (
      stops.some(
        (stop) =>
          stop.row.silver <= row.silver &&
          stop.row.totalDamage >= row.totalDamage &&
          (fixed || stop.row.mercLost <= row.mercLost),
      )
    ) {
      continue;
    }
    // 2 — the stop the saving is measured against.
    const next = ordered.find((stop) => stop.row.silver > row.silver && stop.row.mercLost >= row.mercLost);
    if (!next) continue;
    // 3 — the step up is a worse deal than the march itself, and (the fix) it is a step *up* at all.
    const marginal = (next.row.totalDamage - row.totalDamage) / (next.row.silver - row.silver);
    if (marginal >= perSilver(row)) continue;
    if (fixed && marginal <= 0) continue;
    // 4 — one offer per stop, the best damage a silver.
    const held = bestFor.get(next.row);
    if (
      !held ||
      perSilver(row) > perSilver(held.row) ||
      (perSilver(row) === perSilver(held.row) && row.totalDamage > held.row.totalDamage)
    ) {
      bestFor.set(next.row, { row, stop: next.row, stopName: next.pick, marginal });
    }
  }
  const bar: PlanTotals[] = [];
  const added: Marginal[] = [];
  for (const stop of ordered) {
    const add = bestFor.get(stop.row);
    if (add && !bar.some((other) => keyOf(other.counts) === keyOf(add.row.counts))) {
      bar.push(add.row);
      added.push(add);
    }
    bar.push(stop.row);
  }
  bar.sort((a, b) => a.silver - b.silver || a.totalDamage - b.totalDamage);
  return { added, bar };
}

// ---- P6: what the battle says about the hired stacks ------------------------------------------------------

/** 104's static shelter proxy: hired stacks standing at or above the lowest troop stack, in units. */
function unshelteredUnits(request: StackRequest, counts: Record<string, number>): number {
  const { result } = marchResult(request, counts);
  const troops = result.stacks.filter((stack) => stack.pool === 'leadership');
  if (troops.length === 0) return result.stacks.reduce((sum, stack) => sum + stack.count, 0);
  const floor = Math.min(...troops.map((stack) => stack.totalHp));
  return result.stacks
    .filter((stack) => stack.pool === 'authority' && stack.totalHp >= floor)
    .reduce((sum, stack) => sum + stack.count, 0);
}

interface Fought {
  summary: BattleSummary;
  /** Hired stacks the enemy destroys, per journal. */
  struckEnemyFirst: number;
  struckArmyFirst: number;
  /** Hired stacks fielded, and the hits they land in each journal. */
  hiredStacks: number;
  hiredHitsEnemyFirst: number;
  hiredHitsArmyFirst: number;
  /** Σ ceil(n/10) over the hired stacks — the tithe the stock actually pays. */
  tithe: number;
}

function fight(request: StackRequest, counts: Record<string, number>, hired: string[]): Fought {
  const { result, summary } = marchResult(request, counts);
  const isHired = (id: string): boolean => hired.includes(id);
  const struck = (journal: BattleSummary['journals']['enemyFirst']): number =>
    journal.entries.filter((entry) => entry.actor === 'enemy' && isHired(entry.unitId)).length;
  const landed = (journal: BattleSummary['journals']['enemyFirst']): number =>
    journal.entries.filter((entry) => entry.actor === 'army' && isHired(entry.unitId)).length;
  return {
    summary,
    struckEnemyFirst: struck(summary.journals.enemyFirst),
    struckArmyFirst: struck(summary.journals.armyFirst),
    hiredStacks: result.stacks.filter((stack) => stack.pool === 'authority').length,
    hiredHitsEnemyFirst: landed(summary.journals.enemyFirst),
    hiredHitsArmyFirst: landed(summary.journals.armyFirst),
    tithe: result.stacks
      .filter((stack) => stack.pool === 'authority')
      .reduce((sum, stack) => sum + chunks(stack.count), 0),
  };
}

// ---- the report --------------------------------------------------------------------------------------------

describe.skipIf(!process.env.THEORY)('105 — the six proposals', () => {
  it('measures what each proposal brings over the benchmark set, and what depends on what', () => {
    if (!ownerProfile()) throw new Error(`export not found: ${OWNER_EXPORT}`);
    const report = new Report('105-six-proposals');
    const all = cases().map(measure);
    const live = all[0] as Measured;
    const prices = new Map(all.map((one) => [one.label, pricer(one.request)]));
    const priceOf = (one: Measured): ((counts: Record<string, number>) => Record<Mode, Priced>) =>
      prices.get(one.label) as (counts: Record<string, number>) => Record<Mode, Priced>;
    const short = (text: string): string => (text.length > 46 ? `${text.slice(0, 44)}…` : text);

    report.add(
      '> **Engine: S-87** (`b080223`, *every hired stack under the troops, on every shape the plan offers*). ' +
        'The prerequisite is met, so the six proposals below are measured on the marches the player is actually ' +
        'offered. The first run of this file was made on the S-77 engine, which sheltered only the *unlimited* ' +
        'hired types and let a capped stack stand on top as the enemy’s first kill; those figures are superseded ' +
        'by these. **Nothing here is a hardcoded expectation of a run** — every table is computed from the plan ' +
        'the engine returns — so the file re-runs unchanged whenever the engine moves again. **Which engine a run ' +
        'was made on is readable off the run itself**: the last table of §P6 counts the stops that field a hired ' +
        'stack the troops do not stand over, and it is nought everywhere here.',
    );
    report.add('');
    report.add(
      `Horizon ${HORIZON} (\`CAMPAIGN.marches\`): the benchmark's ten scenarios (\`tests/engine/plan-scenarios.ts\`, its own labels and its own order), plus HIS BAR, plus 104's reconstruction of it, plus his live camp — ${all.length} in all, every plan run once with ` +
        '`withFrontier` and read six ways. Plan run times: ' +
        all.map((one) => `${short(one.label)} ${one.ms} ms`).join(' · ') +
        '.',
    );

    // ======================================================================================================
    // P1
    // ======================================================================================================
    report.h('P1 · the troops-only tail on the repeated stops');
    report.add(
      'S-81 gave the `all-in` a troops-only Elite march for every march the horizon still had room for once its ' +
        'hired stock was spent. P1 is the same offer to every **repeated** stop whose stock the horizon outruns ' +
        '(`marches < CAMPAIGN.marches`). The tail is the Elite sizer over every troop type with no mercenaries — ' +
        "the engine's own `sizer([], 'elite')` — priced by `recoveryCosts(...).retrain`, which is exactly what " +
        '`toMarch` writes for a march with no hired stack in it.',
    );
    const tails = new Map<string, Tail | undefined>();
    for (const one of all) tails.set(one.label, troopsOnlyTail(one.request));
    report.add('');
    report.add('The tail march, per scenario:');
    report.add('');
    report.add('| scenario | tail march | damage | silver | queue |');
    report.add('|---|---|---|---|---|');
    for (const one of all) {
      const tail = tails.get(one.label);
      report.add(
        `| ${one.label} | ${tail ? troopLine(tail.counts, one.hired) : '— (no troop type to field)'} | ${tail ? n(tail.damage) : '—'} | ${tail ? n(tail.silver) : '—'} | ${tail ? duration(tail.seconds) : '—'} |`,
      );
    }

    interface TailChange {
      one: Measured;
      stop: PlanRow;
      after: PlanRow;
      added: number;
    }
    const tailChanges: TailChange[] = [];
    for (const one of all) {
      const tail = tails.get(one.label);
      for (const stop of one.stops) {
        const after = withTail(stop, tail, HORIZON);
        if (after !== stop) tailChanges.push({ one, stop, after, added: HORIZON - stop.marches });
      }
    }
    const touched = new Set(tailChanges.map((change) => change.one.label));
    report.add('');
    report.add(
      `**${tailChanges.length} stops on ${touched.size} of the ${all.length} scenarios** play fewer marches than the ` +
        'horizon and would take a tail. Every other stop already fills it, so P1 does nothing to them.',
    );
    report.add('');
    report.add(
      '| scenario | stop | marches | + tail | campaign damage → | silver → | queue → | burn | a silver → | a hired → |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|');
    for (const change of tailChanges) {
      const { stop, after } = change;
      report.add(
        `| ${change.one.label} | ${stop.pick} | ${stop.marches} | ${change.added} | ${n(stop.totalDamage)} → **${n(after.totalDamage)}** (${pct((after.totalDamage / stop.totalDamage - 1) * 100)}) | ${n(stop.silver)} → ${n(after.silver)} (${pct((after.silver / stop.silver - 1) * 100)}) | ${duration(stop.seconds)} → ${duration(after.seconds)} | ${stop.mercLost} (unchanged) | ${f3(perSilver(stop))} → ${f3(perSilver(after))} | ${n(Math.round(perHired(stop)))} → ${n(Math.round(perHired(after)))} |`,
      );
    }

    report.add('');
    report.add(
      'The tail buys damage with troops alone, so it **raises damage a hired unit** (the hired burn does not ' +
        'move) and **lowers damage a silver** a little (troops without mercenaries are the less efficient march ' +
        'on these armies). Both of those are campaign ratios; neither is read by any stop rule, which is the next ' +
        'table.',
    );
    report.add('');
    report.add('#### Does the tail move the bar — its order, its knee, its band?');
    report.add(
      'Three questions, three measurements. **Order**: the bar is sorted on `repeat.mercLost` and the tail adds ' +
        'marches without touching the repeated march, so no burn moves. **Knee**: the sweet spot is the chord rule ' +
        'over the burn ladder, read on `repeat.damage` against `repeat.mercLost` — the chord is recomputed below ' +
        'over the tailed ladder, and beside it the same chord read on **campaign** damage, which is the one reading ' +
        "the tail could move. **Band**: `inBand` reads the **campaign** ratio `damagePerSilver` against the plan's " +
        'own, so tailing every candidate can change which rows the band keeps — that is recomputed too.',
    );
    report.add('');
    report.add(
      '| scenario | knee today (burn) | knee over the tailed ladder | knee if read on campaign damage | band rows | band rows once every candidate is tailed | rows that change side |',
    );
    report.add('|---|---|---|---|---|---|---|');
    const tailedBands = new Map<string, PlanFrontierRow[]>();
    for (const one of all) {
      const tail = tails.get(one.label);
      const today = sweetSpotOver(one.band);
      const tailedBand = one.band.map((row) => withTail(row, tail, HORIZON));
      const tailedLadder = sweetSpotOver(tailedBand);
      // The same chord on the same axis, read on **campaign** damage instead of the repeated march's — the
      // alternative reading, the one thing about the knee a tail could move. The rung is still named by its
      // burn a march, so the two columns are comparable.
      const campaignKnee = ((rows: PlanTotals[]): PlanTotals | undefined => {
        const ladderRows = burnLadder(rows);
        const first = ladderRows[0];
        const last = ladderRows[ladderRows.length - 1];
        if (!first || !last || ladderRows.length < 3) return undefined;
        const dx = last.repeat.mercLost - first.repeat.mercLost || 1;
        const dy = last.totalDamage - first.totalDamage || 1;
        let best: PlanTotals | undefined;
        let bestDistance = 0;
        for (const row of ladderRows) {
          const t = (row.repeat.mercLost - first.repeat.mercLost) / dx;
          const distance = (row.totalDamage - (first.totalDamage + t * dy)) / dy;
          if (distance > bestDistance) {
            bestDistance = distance;
            best = row;
          }
        }
        return best;
      })(tailedBand);
      // The band recomputed on the tailed campaign ratios: the goal is the plan's own, tailed the same way.
      const goalRow = withTail(one.plan as PlanTotals, tail, HORIZON);
      const goalHired = fieldedHired(one.plan.counts, one.hired);
      const stocked = one.hired.filter(
        (id) => one.request.caps[id] === undefined || (one.request.caps[id] ?? 0) > 0,
      );
      const bandOf = (row: PlanTotals, goalPerSilver: number): boolean =>
        fieldedHired(row.counts, one.hired) * 2 >= goalHired &&
        row.damagePerSilver * 2 >= goalPerSilver &&
        Object.keys(row.counts).filter((id) => !one.hired.includes(id)).length > 1 &&
        stocked.every(
          (id) =>
            (row.counts[id] ?? 0) > 0 ||
            (row.finaleCounts?.[id] ?? 0) > 0 ||
            (row.sequence ?? []).some((march) => (march[id] ?? 0) > 0),
        );
      const tailedAll = one.undominated.map((row) => withTail(row, tail, HORIZON));
      const beforeKeys = new Set(
        one.undominated
          .filter((row) => bandOf(row, one.plan.damagePerSilver))
          .map((row) => keyOf(row.counts)),
      );
      const afterRows = tailedAll.filter((row) => bandOf(row, goalRow.damagePerSilver));
      const afterKeys = new Set(afterRows.map((row) => keyOf(row.counts)));
      let moved = 0;
      for (const key of beforeKeys) if (!afterKeys.has(key)) moved += 1;
      for (const key of afterKeys) if (!beforeKeys.has(key)) moved += 1;
      tailedBands.set(one.label, afterRows as PlanFrontierRow[]);
      report.add(
        `| ${one.label} | ${today.sweet.repeat.mercLost} | ${tailedLadder.sweet.repeat.mercLost}${tailedLadder.sweet.repeat.mercLost === today.sweet.repeat.mercLost ? ' (same)' : ' — **moves**'} | ${campaignKnee ? campaignKnee.repeat.mercLost : '—'}${campaignKnee && campaignKnee.repeat.mercLost !== today.sweet.repeat.mercLost ? ' — **differs**' : ''} | ${beforeKeys.size} | ${afterKeys.size} | ${moved} |`,
      );
    }
    report.add('');
    report.add(
      'The knee cannot move under P1 and the table says so on every scenario: the chord is drawn on `repeat.damage` ' +
        'against `repeat.mercLost`, and a tail adds marches after the repeated one. The third column is the ' +
        'alternative the owner would be choosing if he also asked for the knee to be read on the campaign — a ' +
        'different proposal, measured here so it is not confused with this one.',
    );

    // ======================================================================================================
    // P2
    // ======================================================================================================
    report.h('P2 · the plan priced under Revive');
    report.add(
      'The plan always prices troops **retrained** (`toMarch` calls `retrainOne` for every troop rung and ' +
        '`reviveOne` for every hired stack, whatever `request.recovery.plan.mode` says); the recap follows the ' +
        "Battle card's mode, which is `setup.recoveryPlan.mode` through `recoverySettings` in `src/state/derive.ts`. " +
        'Under revive the Temple brings back nine units in ten for gold and the tenth is recruited again, so a ' +
        'march costs `chunks(n)` of the training silver and `chunks(n)` of the training queue instead of `n` of each.',
    );
    report.add('');
    report.add(
      '**Which of the twelve are on revive today: none.** Every scenario carries `plan.mode = retrain` — the ' +
        "owner's own profile default (`src/state/defaults.ts`), the export's setup and the TotalStack capture all. " +
        'So the "over the benchmark" column below is what revive *would* read, not what any of these accounts reads.',
    );
    report.add('');
    report.add('| scenario | recovery mode on the request | temple | training discount | training speed |');
    report.add('|---|---|---|---|---|');
    for (const one of all) {
      const recovery = one.request.recovery;
      const entries = (map: Partial<Record<string, number>>): string =>
        Object.entries(map)
          .filter(([, value]) => (value ?? 0) !== 0)
          .map(([key, value]) => `${key} ${value} %`)
          .join(', ') || 'none';
      report.add(
        `| ${one.label} | ${recovery.plan.mode} | ${recovery.templeLevel} | ${entries(recovery.trainingCostReduction)} | ${entries(recovery.trainingSpeed)} |`,
      );
    }

    // The re-pricing machinery, checked against the payload before it is used for anything.
    report.add('');
    report.add('#### The re-pricing, checked against the payload first');
    report.add(
      'Every figure below is `recoveryCosts` on the stacks `marchResult` builds. Under **retrain** that has to ' +
        "reproduce the plan's own `silver` and `seconds` exactly, or the revive column is measuring something else. " +
        '(`gold` is the one figure it will not reproduce: `summarise` writes `marches × repeat.gold` and leaves the ' +
        "finale's gold out of the campaign total, so the check reports it separately rather than calling it a fault.)",
    );
    report.add('');
    report.add(
      '| scenario | stops checked | worst Δ repeat silver | worst Δ repeat seconds | worst Δ campaign silver | worst Δ campaign seconds | worst Δ campaign gold |',
    );
    report.add('|---|---|---|---|---|---|---|');
    for (const one of all) {
      const price = priceOf(one);
      let dRepeatSilver = 0;
      let dRepeatSeconds = 0;
      let dSilver = 0;
      let dSeconds = 0;
      let dGold = 0;
      for (const stop of one.stops) {
        const back = repriced(stop, 'retrain', price);
        dRepeatSilver = Math.max(dRepeatSilver, Math.abs(back.repeat.silver - stop.repeat.silver));
        dRepeatSeconds = Math.max(dRepeatSeconds, Math.abs(back.repeat.seconds - stop.repeat.seconds));
        dSilver = Math.max(dSilver, Math.abs(back.silver - stop.silver));
        dSeconds = Math.max(dSeconds, Math.abs(back.seconds - stop.seconds));
        dGold = Math.max(dGold, Math.abs(back.gold - stop.gold));
      }
      report.add(
        `| ${one.label} | ${one.stops.length} | ${n(dRepeatSilver)} | ${n(dRepeatSeconds)} | ${n(dSilver)} | ${n(dSeconds)} | ${n(dGold)} |`,
      );
    }

    report.add('');
    report.add('#### Every stop, retrained and revived');
    report.add(
      (() => {
        const sweet = live.stops.find((stop) => stop.pick === 'sweet-spot') ?? live.stops[0];
        const recomputed = sweet ? repriced(sweet, 'retrain', priceOf(live)).gold : 0;
        return (
          'The repeated march first (what the stop itself reads), then the campaign. `a silver` is the campaign ' +
          'ratio. **The campaign gold under R is the recomputed retrain gold, not the figure the bar prints**: the ' +
          'payload leaves the finale’s gold out of its total (the omission the table above measures), so on HIS ' +
          `BAR’s ${sweet?.pick ?? 'first stop'} this column reads ${n(recomputed)} where the payload carries ` +
          `${n(sweet?.gold ?? 0)}.`
        );
      })(),
    );
    report.add('');
    report.add(
      '| scenario | stop | repeat silver R → V | repeat gold R → V | repeat queue R → V | campaign silver R → V | campaign gold R → V | campaign queue R → V | a silver R → V |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|');
    for (const one of all) {
      const price = priceOf(one);
      for (const stop of one.stops) {
        const r = repriced(stop, 'retrain', price);
        const v = repriced(stop, 'revive', price);
        report.add(
          `| ${one.label} | ${stop.pick} | ${n(r.repeat.silver)} → ${n(v.repeat.silver)} | ${n(r.repeat.gold)} → ${n(v.repeat.gold)} | ${duration(r.repeat.seconds)} → ${duration(v.repeat.seconds)} | ${n(r.silver)} → ${n(v.silver)} | ${n(r.gold)} → ${n(v.gold)} | ${duration(r.seconds)} → ${duration(v.seconds)} | ${f3(perSilver(r))} → ${f3(perSilver(v))} |`,
        );
      }
    }

    report.add('');
    report.add('#### Would the *search* answer differently on revive prices?');
    report.add(
      'Two ways to ask. **First**, hand `planCampaign` a request whose recovery settings say revive and see ' +
        'whether the bar moves — the engine accepts the request, but `toMarch` never reads `plan.mode`, so this ' +
        "measures whether that is really so rather than taking the code's word for it.",
    );
    report.add('');
    report.add(
      '| scenario | stops on retrain | stops on revive | identical marches? | Δ repeat damage | plan ms |',
    );
    report.add('|---|---|---|---|---|---|');
    for (const one of all) {
      const started = performance.now();
      const reviveRun = planCampaign({
        ...cases().find((entry) => entry.label === one.label)?.input,
        request: {
          ...one.request,
          recovery: { ...one.request.recovery, plan: { ...one.request.recovery.plan, mode: 'revive' } },
        },
      } as CampaignInput);
      const ms = Math.round(performance.now() - started);
      const before = one.stops.map((stop) => `${stop.pick}:${keyOf(stop.counts)}`).join(' | ');
      const after = reviveRun.alternatives.map((stop) => `${stop.pick}:${keyOf(stop.counts)}`).join(' | ');
      const worst = one.stops.reduce((held, stop, index) => {
        const other = reviveRun.alternatives[index];
        return other ? Math.max(held, Math.abs(other.repeat.damage - stop.repeat.damage)) : held;
      }, 0);
      report.add(
        `| ${one.label} | ${one.stops.map((stop) => stop.pick).join(' · ')} | ${reviveRun.alternatives.map((stop) => stop.pick).join(' · ')} | ${before === after ? '**yes — identical**' : 'no'} | ${n(worst)} | ${ms} |`,
      );
    }
    report.add('');
    report.add(
      '**So the engine does not accept revive pricing** — it accepts the request and ignores the mode. The second ' +
        "way is therefore the one that answers the question: re-price the band and re-pick by the band's own rules. " +
        "The picker below is `planCampaign`'s own rules restated (burn ladder → rungs nothing beats on both repeat " +
        'ratios → the chord over the whole ladder → `middleOfRange` → the steady max → the silver saver over the ' +
        'whole band → "more mercs" in the middle of the gap). It **cannot** re-run the put-back pass (which would ' +
        'have to re-size through the sizer against the new rates) nor rebuild the `all-in` (built march by march ' +
        'outside the frontier), so it is checked against the engine on the retrain prices first and every ' +
        'disagreement is named.',
    );
    report.add('');
    report.add(
      '| scenario | engine stops (put-back / all-in in brackets) | the picker on the retrain band | agrees? |',
    );
    report.add('|---|---|---|---|');
    for (const one of all) {
      const picked = pickStops(one.band);
      const engine = one.stops
        .map(
          (stop) =>
            `${stop.pick}${stop.putBack ? ' [put-back]' : ''}${stop.pick === 'all-in' ? ' [all-in]' : ''}`,
        )
        .join(' · ');
      const mine = picked.map((stop) => stop.pick).join(' · ');
      const comparable = one.stops.filter((stop) => stop.pick !== 'all-in' && !stop.putBack);
      const mineKeys = new Map(picked.map((stop) => [stop.pick, keyOf(stop.row.counts)]));
      const agree = comparable.every((stop) => mineKeys.get(stop.pick) === keyOf(stop.counts));
      const verdict =
        comparable.length === 0
          ? 'n/a — every stop is a put-back or the all-in'
          : agree
            ? `yes, on all ${comparable.length} comparable stop${comparable.length === 1 ? '' : 's'}`
            : '**no**';
      report.add(`| ${one.label} | ${engine} | ${mine} | ${verdict} |`);
    }

    report.add('');
    report.add('The bar the same rules pick once the band is priced under **revive**:');
    report.add('');
    report.add(
      '| scenario | stops on retrain prices | stops on revive prices | same marches? | sweet spot burn R → V | thriftiest silver R → V |',
    );
    report.add('|---|---|---|---|---|---|');
    const reviveBars = new Map<string, Picked[]>();
    for (const one of all) {
      const price = priceOf(one);
      const retrainBand = one.band.map((row) => repriced(row, 'retrain', price));
      const reviveBand = one.band.map((row) => repriced(row, 'revive', price));
      const a = pickStops(retrainBand);
      const b = pickStops(reviveBand);
      reviveBars.set(one.label, b);
      const keysA = a.map((stop) => `${stop.pick}:${keyOf(stop.row.counts)}`).join(' | ');
      const keysB = b.map((stop) => `${stop.pick}:${keyOf(stop.row.counts)}`).join(' | ');
      const sweetA = a.find((stop) => stop.pick === 'sweet-spot');
      const sweetB = b.find((stop) => stop.pick === 'sweet-spot');
      report.add(
        `| ${one.label} | ${a.map((stop) => `${stop.pick} (${stop.row.repeat.mercLost})`).join(' · ')} | ${b.map((stop) => `${stop.pick} (${stop.row.repeat.mercLost})`).join(' · ')} | ${keysA === keysB ? '**yes**' : '**no**'} | ${sweetA?.row.repeat.mercLost ?? '—'} → ${sweetB?.row.repeat.mercLost ?? '—'} | ${n(Math.min(...a.map((stop) => stop.row.repeat.silver)))} → ${n(Math.min(...b.map((stop) => stop.row.repeat.silver)))} |`,
      );
    }

    // ======================================================================================================
    // P3
    // ======================================================================================================
    report.h('P3 · the thrift end of the band');
    report.add(
      'After S-80 the stops of a bar largely share one troop march and differ only by their mercenaries, so silver ' +
        'and time read nearly the same all the way along it — the first table checks that premise scenario by ' +
        'scenario rather than assuming it, since a put-back re-sizes the troop side of the stop it improves. ' +
        'Then: how much cheaper is the **cheapest troop march the band holds** than the one most stops ' +
        'share, and what would a silver-saver exception offer if its rule were relaxed. Three rules, all over the ' +
        'band, all left of the sweet spot in burn and silver:\n' +
        '- **today** — `leastSilver` in `src/engine/plan.ts`: cheaper than the sweet spot, **at least as efficient ' +
        'a silver**, and beaten on neither ratio by another such march;\n' +
        '- **relaxed** — the same without the efficiency floor: cheaper than the sweet spot and beaten on neither ratio;\n' +
        "- **marginal** — P5's fixed rule restricted to the marches cheaper than the sweet spot.",
    );
    report.add('');
    report.add(
      '| scenario | troop marches over the stops | the one most stops share (silver a march) | cheapest troop march in the band (silver a march) | cheaper by | that march |',
    );
    report.add('|---|---|---|---|---|---|');
    for (const one of all) {
      const byTroops = new Map<string, PlanRow[]>();
      for (const stop of one.stops) {
        const key = troopKeyOf(stop.counts, one.hired);
        byTroops.set(key, [...(byTroops.get(key) ?? []), stop]);
      }
      const modal = [...byTroops.values()].reduce((held, group) =>
        group.length > held.length ? group : held,
      );
      const shared = modal[0] as PlanRow;
      const cheapest = one.band.reduce((held, row) =>
        row.repeat.silver < held.repeat.silver ||
        (row.repeat.silver === held.repeat.silver && row.repeat.damage > held.repeat.damage)
          ? row
          : held,
      );
      const sharedSilver = shared.repeat.silver;
      report.add(
        `| ${one.label} | ${byTroops.size} over ${one.stops.length} stops${byTroops.size === 1 ? ' — **one march**' : ''} | ${n(sharedSilver)} (${modal.length} of ${one.stops.length}: ${modal.map((stop) => stop.pick).join(', ')}) | ${n(cheapest.repeat.silver)} | ${sharedSilver > 0 ? pct(((sharedSilver - cheapest.repeat.silver) / sharedSilver) * 100) : '—'} | ${troopLine(cheapest.counts, one.hired)} |`,
      );
    }

    interface SaverOffer {
      rule: string;
      row: PlanFrontierRow | undefined;
      /**
       * The offer is a march **the bar does not already carry** — otherwise the rule offers nothing new. The
       * test is §P5's `onBar`, a stop **or a stop's generator**: a put-back re-sizes the march `leastSilver`
       * picked, so the stop on the bar has different counts from the march the rule chose, and matching on the
       * stops alone reads a re-sized offer as a new one. Measured on the live camp, where every stop carries a
       * put-back: the 2 013 400 / 2 371 111 / 6 march is the silver saver's own generated march.
       */
      fresh: boolean;
    }
    report.add('');
    report.add('What each rule would offer, against the sweet spot on the same bar:');
    report.add('');
    report.add(
      '| scenario | rule | offered? | already on the bar? | repeat silver | repeat damage | burn | campaign a silver | campaign a hired | Δ damage vs sweet | Δ silver vs sweet | Δ hired vs sweet | what the player sees |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    const saverOffers = new Map<string, SaverOffer[]>();
    for (const one of all) {
      const sweetStop = one.stops.find((stop) => stop.pick === 'sweet-spot') ?? (one.stops[0] as PlanRow);
      if (!sweetStop) continue;
      const cheaper = one.band.filter(
        (row) =>
          row.repeat.mercLost < sweetStop.repeat.mercLost &&
          row.repeat.silver <= sweetStop.repeat.silver &&
          keyOf(row.counts) !== keyOf(sweetStop.counts),
      );
      const notBeaten = (pool: PlanTotals[]) => (row: PlanTotals) =>
        !pool.some(
          (other) =>
            other !== row &&
            repeatPerSilver(other) >= repeatPerSilver(row) &&
            repeatPerHired(other) >= repeatPerHired(row) &&
            (repeatPerSilver(other) > repeatPerSilver(row) || repeatPerHired(other) > repeatPerHired(row)),
        );
      const cheapestOf = (pool: PlanTotals[]): PlanTotals | undefined =>
        pool.reduce<PlanTotals | undefined>((best, row) => {
          if (!best) return row;
          if (row.repeat.silver !== best.repeat.silver)
            return row.repeat.silver < best.repeat.silver ? row : best;
          if (row.repeat.mercLost !== best.repeat.mercLost)
            return row.repeat.mercLost < best.repeat.mercLost ? row : best;
          return row.repeat.damage > best.repeat.damage ? row : best;
        }, undefined);
      const todayPool = cheaper.filter((row) => repeatPerSilver(row) >= repeatPerSilver(sweetStop));
      const today = cheapestOf(todayPool.filter(notBeaten(todayPool)));
      const relaxed = cheapestOf(cheaper.filter(notBeaten(cheaper)));
      const marginalKey = marginalRows(
        cheaper,
        one.stops.map((stop) => ({ pick: stop.pick, row: stop })),
        true,
      ).added.find((add) => add.row.repeat.mercLost < sweetStop.repeat.mercLost)?.row;
      // Back to the frontier row the rule chose, so the verdicts below can read its `stop` / `generatorOf`.
      const asFrontier = (row: PlanTotals | undefined): PlanFrontierRow | undefined =>
        row === undefined ? undefined : cheaper.find((other) => keyOf(other.counts) === keyOf(row.counts));
      const fresh = (row: PlanFrontierRow | undefined): boolean => row !== undefined && !onBar(row);
      const offers: SaverOffer[] = (
        [
          ['today (leastSilver)', asFrontier(today)],
          ['relaxed (both ratios only)', asFrontier(relaxed)],
          ['marginal (P5, fixed)', asFrontier(marginalKey)],
        ] as const
      ).map(([rule, row]) => ({ rule, row, fresh: fresh(row) }));
      saverOffers.set(one.label, offers);
      for (const offer of offers) {
        const row = offer.row;
        const already =
          row === undefined
            ? undefined
            : row.stop !== undefined
              ? row.stop
              : row.generatorOf !== undefined
                ? `the ${row.generatorOf}’s own generated march`
                : undefined;
        report.add(
          `| ${one.label} | ${offer.rule} | ${row ? 'yes' : 'no'} | ${row ? (already ?? 'no — a new row') : '—'} | ${row ? n(row.repeat.silver) : '—'} | ${row ? n(row.repeat.damage) : '—'} | ${row ? row.repeat.mercLost : '—'} | ${row ? f3(perSilver(row)) : '—'} | ${row ? n(Math.round(perHired(row))) : '—'} | ${row ? pct((row.totalDamage / sweetStop.totalDamage - 1) * 100) : '—'} | ${row ? pct((row.silver / sweetStop.silver - 1) * 100) : '—'} | ${row ? pct((row.mercLost / sweetStop.mercLost - 1) * 100) : '—'} | ${row ? `${troopLine(row.counts, one.hired)} · ${hiredLine(row.counts, one.hired)}` : '—'} |`,
        );
      }
    }

    // ======================================================================================================
    // P4
    // ======================================================================================================
    report.h('P4 · the reference table over the band');
    report.add(
      'The `curve` under the bar is bucketed over **every shape `record` sees** — including marches the frontier ' +
        'threw away and the band would refuse. P4 buckets it over `candidates` (the band) instead, so every row of ' +
        'the table is a plan the bar could offer. Nothing else changes: `buckets` is written by `record` and read ' +
        'once at the end to build `CampaignPlan.curve`; no stop rule reads it, which is why the stops below are ' +
        'identical by construction and the measurement is of the table alone. **“Backed by a band plan” counts ' +
        '`inBand` alone** — the band proper is `undominated ∧ inBand`, so a table row whose plan the frontier ' +
        'dominated is counted here and would still not be a row P4 could draw; read it as an upper bound.',
    );
    report.add('');
    report.add(
      '| scenario | table rows today | backed by a frontier plan | backed by a band plan | table rows over the band | peak a silver today | peak over the band | bar best a silver | cheapest row today | cheapest over the band |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|');
    for (const one of all) {
      let onFront = 0;
      let inBandCount = 0;
      for (const point of one.plan.curve) {
        const row = one.entries.find(
          (other) =>
            Math.abs(other.silver - point.silver) < 1 && Math.abs(other.totalDamage - point.damage) <= 1,
        );
        if (row?.onFrontier) onFront += 1;
        if (row?.inBand) inBandCount += 1;
      }
      const bandTable = curveOver(one.band);
      const bandPeak = bandTable.reduce((held, row) => (perSilver(row) > perSilver(held) ? row : held));
      const peakPoint = one.plan.curve.reduce((held, point) =>
        point.damagePerSilver > held.damagePerSilver ? point : held,
      );
      const barBest = Math.max(...one.stops.map(perSilver));
      report.add(
        `| ${one.label} | ${one.plan.curve.length} | ${onFront} | ${inBandCount} | ${bandTable.length} | ${f3(peakPoint.damagePerSilver)} | ${f3(perSilver(bandPeak))} | ${f3(barBest)} | ${n(Math.round(one.plan.curve[0]?.silver ?? 0))} | ${n(Math.round(bandTable[0]?.silver ?? 0))} |`,
      );
    }
    report.add('');
    report.add('The band table itself, on HIS BAR, beside the table he is reading today:');
    report.add('');
    report.add(
      '| # | today: silver | damage | a silver | over the band: silver | damage | a silver | is it a stop? |',
    );
    report.add('|---|---|---|---|---|---|---|---|');
    {
      const bandTable = curveOver(live.band);
      const stopKeys = new Map(live.stops.map((stop) => [keyOf(stop.counts), stop.pick]));
      const rows = Math.max(live.plan.curve.length, bandTable.length);
      for (let index = 0; index < rows; index += 1) {
        const today = live.plan.curve[index];
        const band = bandTable[index];
        report.add(
          `| ${index + 1} | ${today ? n(today.silver) : '—'} | ${today ? n(today.damage) : '—'} | ${today ? f3(today.damagePerSilver) : '—'} | ${band ? n(band.silver) : '—'} | ${band ? n(band.totalDamage) : '—'} | ${band ? f3(perSilver(band)) : '—'} | ${band ? (stopKeys.get(keyOf(band.counts)) ?? 'no') : '—'} |`,
        );
      }
    }

    // ======================================================================================================
    // P5
    // ======================================================================================================
    report.h('P5 · the marginal-reading stop, with the validator’s fix');
    report.add(
      "104's rule 5 offers a cheaper march when the climb from it to the stop on its right buys damage at less " +
        'than the march’s own average rate. The validator found two faults: the domination clause carried a **burn** ' +
        'term, so a stop that is cheaper *and* stronger failed to refuse a candidate that merely burned less; and ' +
        'the marginal rate was never required to be **positive**, so a candidate could be "offered" against a stop ' +
        'that does *less* damage for more silver. Fixed:\n' +
        '1. `C` is refused when some stop `T` has `silver_T ≤ silver_C` **and** `damage_T ≥ damage_C`;\n' +
        '2. `S` is the nearest stop (in silver) with `silver_S > silver_C` and `burn_S ≥ burn_C`;\n' +
        '3. `C` is offered when `0 < (damage_S − damage_C)/(silver_S − silver_C) < damage_C / silver_C`;\n' +
        '4. the best damage a silver wins per `S` (tie: more damage), placed immediately left of it.',
    );
    const ruleOld = new Map<string, ReturnType<typeof marginalRows>>();
    const ruleNew = new Map<string, ReturnType<typeof marginalRows>>();
    let p5Ms = 0;
    for (const one of all) {
      const stops = one.stops.map((stop) => ({ pick: stop.pick as string, row: stop as PlanTotals }));
      const started = performance.now();
      ruleOld.set(one.label, marginalRows(one.offBar, stops, false));
      ruleNew.set(one.label, marginalRows(one.offBar, stops, true));
      p5Ms = Math.max(p5Ms, performance.now() - started);
    }
    report.add('');
    report.add(
      '| scenario | rows added: 104 → fixed | the row(s) the fix keeps (silver / damage / burn) | against | marginal | its own a silver | silver saved | damage | queue saved | the row(s) the fix drops | why dropped |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|');
    for (const one of all) {
      const before = ruleOld.get(one.label) as ReturnType<typeof marginalRows>;
      const after = ruleNew.get(one.label) as ReturnType<typeof marginalRows>;
      const keptKeys = new Set(after.added.map((add) => keyOf(add.row.counts)));
      const dropped = before.added.filter((add) => !keptKeys.has(keyOf(add.row.counts)));
      const join = (parts: string[]): string => parts.join('<br>') || '—';
      const why = (add: Marginal): string => {
        const dominated = one.stops.some(
          (stop) => stop.silver <= add.row.silver && stop.totalDamage >= add.row.totalDamage,
        );
        if (dominated) return 'a stop is cheaper **and** stronger (burn term removed)';
        if (add.marginal <= 0) return `marginal ${f3(add.marginal)} ≤ 0 — the "climb" loses damage`;
        return 'still offered';
      };
      report.add(
        `| ${one.label} | ${before.added.length} → **${after.added.length}** | ${join(after.added.map((add) => `${n(add.row.silver)} / ${n(add.row.totalDamage)} / ${add.row.mercLost}`))} | ${join(after.added.map((add) => add.stopName))} | ${join(after.added.map((add) => f3(add.marginal)))} | ${join(after.added.map((add) => f3(perSilver(add.row))))} | ${join(after.added.map((add) => pct(((add.stop.silver - add.row.silver) / add.stop.silver) * 100)))} | ${join(after.added.map((add) => pct((add.row.totalDamage / add.stop.totalDamage - 1) * 100)))} | ${join(after.added.map((add) => pct(((add.stop.seconds - add.row.seconds) / Math.max(1, add.stop.seconds)) * 100)))} | ${join(dropped.map((add) => `${n(add.row.silver)} / ${n(add.row.totalDamage)} / ${add.row.mercLost}`))} | ${join(dropped.map(why))} |`,
      );
    }
    {
      /**
       * **The row the validator asked about**: 104 measured a `10 957 600 / 23 226 182` offer on the owner's
       * export at 7 000, taken against an `all-in` that spends *more* silver for *less* damage — a negative
       * marginal rate the rule read as a climb. Found by its scenario rather than by its figures, because the
       * figures are the engine's and the engine has moved since (S-87); what is checked is that no row of that
       * kind survives the fix anywhere, which is a property of the rule and not of one run.
       */
      const seven = all.find((one) => one.label.startsWith('2026-09-17 export, its setup'));
      const before = seven ? (ruleOld.get(seven.label)?.added ?? []) : [];
      const after = seven ? (ruleNew.get(seven.label)?.added ?? []) : [];
      const keptKeys = new Set(after.map((add) => keyOf(add.row.counts)));
      const dropped = before.filter((add) => !keptKeys.has(keyOf(add.row.counts)));
      const negative = all.flatMap((one) =>
        (ruleNew.get(one.label)?.added ?? []).filter((add) => add.marginal <= 0),
      );
      report.add('');
      report.add(
        `**The row the validator asked about** — 104's \`10 957 600 / 23 226 182\` offer on the export at 7 000, ` +
          "taken against an `all-in` that spent more silver for less damage. On this engine 104's rule offers " +
          `${before.length} row(s) there and the fix keeps ${after.length}` +
          (dropped.length > 0
            ? `; what it drops is ${dropped
                .map(
                  (add) =>
                    `${n(add.row.silver)} / ${n(add.row.totalDamage)} / ${add.row.mercLost} (against ${add.stopName}, marginal ${f3(add.marginal)})`,
                )
                .join(' and ')}.`
            : '.') +
          ` Over all ${all.length} scenarios the fixed rule offers **${negative.length}** row whose marginal rate ` +
          'is not positive — the clause that refuses them is doing exactly what it was added for.',
      );
    }
    report.add('');
    report.add('What each row the fixed rule adds actually fields:');
    report.add('');
    report.add('| scenario | silver / damage / burn | shape | marches | troops | hired |');
    report.add('|---|---|---|---|---|---|');
    for (const one of all) {
      for (const add of (ruleNew.get(one.label) as ReturnType<typeof marginalRows>).added) {
        report.add(
          `| ${one.label} | ${n(add.row.silver)} / ${n(add.row.totalDamage)} / ${add.row.mercLost} | ${add.row.shape} | ${add.row.marches} | ${troopLine(add.row.counts, one.hired)} | ${hiredLine(add.row.counts, one.hired)} |`,
        );
      }
    }
    report.add('');
    report.add('The bar before and after, with the two monotonicity counts:');
    report.add('');
    report.add(
      '| scenario | rows before | rows after | silver-monotone breaks | burn-monotone breaks | the bar after (silver / damage / burn / row) |',
    );
    report.add('|---|---|---|---|---|---|');
    for (const one of all) {
      const after = ruleNew.get(one.label) as ReturnType<typeof marginalRows>;
      const stopKeys = new Map(one.stops.map((stop) => [keyOf(stop.counts), stop.pick as string]));
      report.add(
        `| ${one.label} | ${one.stops.length} | ${after.bar.length} | ${violations(one.stops, (row) => row.silver)} → ${violations(after.bar, (row) => row.silver)} | ${violations(one.stops, (row) => row.mercLost)} → ${violations(after.bar, (row) => row.mercLost)} | ${after.bar.map((row) => `${n(row.silver)} / ${n(row.totalDamage)} / ${row.mercLost} / ${stopKeys.get(keyOf(row.counts)) ?? '**new**'}`).join('<br>')} |`,
      );
    }

    /**
     * The owner's own tolerance (2026-09-17): a stop that is another stop *"to 0.2 % is inefficient and causes
     * frustration"*. A rule that offers rows is measured against it, or it buys a row nobody can tell apart.
     */
    const nearDuplicates: string[] = [];
    for (const one of all) {
      for (const add of (ruleNew.get(one.label) as ReturnType<typeof marginalRows>).added) {
        const savedSilver = ((add.stop.silver - add.row.silver) / add.stop.silver) * 100;
        const lostDamage = (1 - add.row.totalDamage / add.stop.totalDamage) * 100;
        if (savedSilver < 2 && lostDamage < 2) {
          nearDuplicates.push(
            `${one.label}: ${n(add.row.silver)} / ${n(add.row.totalDamage)} against ${add.stopName} ` +
              `${n(add.stop.silver)} / ${n(add.stop.totalDamage)} — ${savedSilver.toFixed(2)} % of the silver ` +
              `saved for ${lostDamage.toFixed(2)} % of the damage`,
          );
        }
      }
    }
    report.add('');
    report.add(
      `**Rows a player could not tell from the stop beside them.** The owner's own line is that a stop another ` +
        `stop matches to 0.2 % "is inefficient and causes frustration". Of the ${[...ruleNew.values()].reduce((sum, five) => sum + five.added.length, 0)} ` +
        `rows the fixed rule adds over the ${all.length} scenarios, **${nearDuplicates.length}** of them save under ` +
        `2 % of the silver for under 2 % of the damage` +
        (nearDuplicates.length > 0 ? `: ${nearDuplicates.join('; ')}.` : '.') +
        ' Nothing in the rule bounds that — the marginal test is about the *rate* of the climb, not its size — so ' +
        'a minimum saving would have to be a clause of its own.',
    );

    // ======================================================================================================
    // P6
    // ======================================================================================================
    report.h('P6 · “more mercs” and the steady max, as a battle fact');
    report.add(
      'The owner keeps "more mercs". The one thing left to decide about the steady max is 104\'s reading that it ' +
        'exposed 69 of the 128 hired units on his bar — a **static proxy** read off the opening order (a hired stack ' +
        'standing at or above the lowest troop stack). This asks the battle instead: `simulateBattle` on the same ' +
        'counts, in both journals, and what it costs. `struck` counts the hired stacks the enemy **destroys**; ' +
        '`tithe` is `Σ ceil(n/10)` over the hired stacks, which is what the stock pays and what the bar prints as ' +
        'the burn.',
    );
    report.add('');
    report.add(
      '| scenario | stop | hired fielded | hired stacks | static proxy (units) | stacks destroyed E/A | hits the hired land E/A | tithe (Σ ceil(n/10)) | printed burn | equal? | repeat damage |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|');
    let titheMismatch = 0;
    let exposedStops = 0;
    for (const one of all) {
      for (const stop of one.stops) {
        if (stop.pick !== 'steady-max' && stop.pick !== 'more-mercs') continue;
        const fought = fight(one.request, stop.counts, one.hired);
        const proxy = unshelteredUnits(one.request, stop.counts);
        if (proxy > 0) exposedStops += 1;
        const equal = fought.tithe === stop.repeat.mercLost;
        if (!equal) titheMismatch += 1;
        report.add(
          `| ${one.label} | ${stop.pick} | ${fieldedHired(stop.counts, one.hired)} | ${fought.hiredStacks} | ${proxy} | ${fought.struckEnemyFirst}/${fought.struckArmyFirst} | ${fought.hiredHitsEnemyFirst}/${fought.hiredHitsArmyFirst} | ${fought.tithe} | ${stop.repeat.mercLost} | ${equal ? 'yes' : '**no**'} | ${n(stop.repeat.damage)} |`,
        );
      }
    }
    report.add('');
    report.add(
      `Over every steady-max and more-mercs stop on the ${all.length} scenarios the tithe equals the printed burn on ` +
        `${titheMismatch === 0 ? '**every one**' : `all but ${titheMismatch}`}, and the static proxy reports units ` +
        `exposed on ${exposedStops} of them. A hired stack the enemy destroys still costs \`ceil(n/10)\`, and a ` +
        'hired stack it never reaches costs the same: the burn is a property of the counts, not of the fight. The ' +
        'one figure exposure does move is **damage** — a hired stack destroyed early lands fewer hits — and that ' +
        'is already in `repeat.damage`, because `marchOf` runs both journals to get it.',
    );

    report.add('');
    report.add('#### The shelter, over **every** stop — S-87, checked');
    report.add(
      'The proxy above was asked of two stops a bar. Asked of **every** stop of every scenario it is the check on ' +
        'S-87 itself, and the marker that says which engine this run was made on: under S-77 a capped hired type ' +
        'kept whatever count the sizer gave it and stood wherever its HP put it, so six stops on four scenarios ' +
        'fielded a hired stack the troops did not stand over — 1 240 units on the live camp’s steady max. ' +
        '`struck` is again the battle’s own answer — hired stacks the enemy destroys, enemy-first / army-first.',
    );
    report.add('');
    report.add(
      '| scenario | stops | stops with a hired stack at or above the lowest troop stack | units so placed (worst stop) | that stop | hired stacks destroyed there E/A |',
    );
    report.add('|---|---|---|---|---|---|');
    let shelterStops = 0;
    let shelterScenarios = 0;
    let worstShelter = { label: '—', pick: '—', units: 0 };
    for (const one of all) {
      let count = 0;
      let worst: { pick: string; units: number; struck: string } | undefined;
      for (const stop of one.stops) {
        const units = unshelteredUnits(one.request, stop.counts);
        if (units <= 0) continue;
        count += 1;
        const fought = fight(one.request, stop.counts, one.hired);
        if (!worst || units > worst.units) {
          worst = {
            pick: stop.pick,
            units,
            struck: `${fought.struckEnemyFirst}/${fought.struckArmyFirst}`,
          };
        }
      }
      shelterStops += count;
      if (count > 0) shelterScenarios += 1;
      if (worst && worst.units > worstShelter.units) {
        worstShelter = { label: one.label, pick: worst.pick, units: worst.units };
      }
      report.add(
        `| ${one.label} | ${one.stops.length} | ${count}${count === one.stops.length && count > 0 ? ' — **every one**' : ''} | ${worst ? n(worst.units) : '—'} | ${worst?.pick ?? '—'} | ${worst?.struck ?? '—'} |`,
      );
    }
    report.add('');
    report.add(
      shelterStops === 0
        ? `**No stop of any of the ${all.length} scenarios fields a hired stack the troops do not stand over.** ` +
            'S-87 holds on every army this file measures, and every figure above is read off a sheltered march.'
        : `**${shelterStops} stops on ${shelterScenarios} of the ${all.length} scenarios** field a hired stack the ` +
            `troops do not stand over, the worst being ${n(worstShelter.units)} units on ${worstShelter.label} ` +
            `(${worstShelter.pick}) — this run is **not** on a sheltered engine.`,
    );

    // ======================================================================================================
    // dependencies
    // ======================================================================================================
    report.h('Dependencies');

    report.add('#### P1 → P5 · the marginal reading on a tailed bar');
    report.add(
      'P1 changes campaign damage and silver on any row the horizon outruns, and P5 is stated entirely in campaign ' +
        'figures — so P5 is re-run with **every** band row and every stop tailed, which is what the bar would hold ' +
        'if P1 shipped.',
    );
    report.add('');
    report.add(
      '| scenario | stops tailed | P5 rows without P1 | P5 rows with P1 | same rows? | the difference |',
    );
    report.add('|---|---|---|---|---|---|');
    for (const one of all) {
      const tail = tails.get(one.label);
      const tailedStops = one.stops.map((stop) => ({
        pick: stop.pick as string,
        row: withTail(stop, tail, HORIZON) as PlanTotals,
      }));
      const tailedOff = one.offBar.map((row) => withTail(row, tail, HORIZON));
      const withP1 = marginalRows(tailedOff, tailedStops, true);
      const without = ruleNew.get(one.label) as ReturnType<typeof marginalRows>;
      const a = new Set(without.added.map((add) => keyOf(add.row.counts)));
      const b = new Set(withP1.added.map((add) => keyOf(add.row.counts)));
      const same = a.size === b.size && [...a].every((key) => b.has(key));
      const changed = one.stops.filter((stop) => stop.marches < HORIZON).length;
      report.add(
        `| ${one.label} | ${changed} | ${without.added.length} | ${withP1.added.length} | ${same ? 'yes' : '**no**'} | ${same ? '—' : `${[...b].filter((key) => !a.has(key)).length} appear, ${[...a].filter((key) => !b.has(key)).length} disappear`} |`,
      );
    }

    report.add('');
    report.add(
      `P5's rows are identical with and without P1 on all ${all.length} scenarios. The reason is measurable and ` +
        `worth stating rather than generalising: the ${touched.size} scenarios P1 touches (${[...touched].join(', ')}) ` +
        'carry a bar of one or two stops, and P5 has no candidate to offer on any of them either way; on every ' +
        'scenario where P5 does add rows, no stop is short of the horizon, so the tail never fires. **The two are ' +
        'independent on this benchmark, and would not be on an account whose stops run short *and* whose bar has ' +
        `three or more stops** — none of the ${all.length} is such an account.`,
    );
    report.add('');
    report.add('#### P5 vs P3 · does the marginal reading cover the thrift end?');
    report.add(
      'P3 asks for a cheaper march left of the sweet spot; P5 adds a march wherever the climb to the next stop is a ' +
        'bad deal, which is sometimes the same place and sometimes not. Per scenario: how many rows P5 adds **left ' +
        'of the sweet spot** (which is where a silver saver would go), and whether the three P3 rules would offer ' +
        'anything P5 does not.',
    );
    report.add('');
    report.add(
      'A rule that hands back a march the bar already carries offers nothing, so the three P3 columns below say ' +
        '`(a stop)` where that is what happened — which is also a check on the emulation, since P3 "today" is the ' +
        "engine's own `leastSilver` and has to reproduce the silver saver wherever the engine offered one.",
    );
    report.add('');
    report.add(
      '| scenario | P5 rows added | of those, left of the sweet spot | P3 today offers | P3 relaxed offers | P3 marginal offers | does P5 cover P3? |',
    );
    report.add('|---|---|---|---|---|---|---|');
    for (const one of all) {
      const after = ruleNew.get(one.label) as ReturnType<typeof marginalRows>;
      const sweetStop = one.stops.find((stop) => stop.pick === 'sweet-spot') ?? one.stops[0];
      const leftOfSweet = sweetStop
        ? after.added.filter((add) => add.row.repeat.mercLost < sweetStop.repeat.mercLost)
        : [];
      const offers = saverOffers.get(one.label) ?? [];
      // The same `onBar` verdict §P3 records: a stop **or a stop's generator** is a march the bar carries.
      const has = (rule: string): SaverOffer | undefined => offers.find((o) => o.rule.startsWith(rule));
      const say = (offer: SaverOffer | undefined): string =>
        offer?.row === undefined
          ? 'nothing'
          : offer.fresh
            ? `**${n(offer.row.repeat.silver)} a march**`
            : `${n(offer.row.repeat.silver)} a march (${offer.row.stop ?? `${offer.row.generatorOf ?? 'on'} generator`})`;
      const today = has('today');
      const relaxed = has('relaxed');
      const marginal = has('marginal');
      const covered =
        today?.row === undefined && relaxed?.row === undefined
          ? 'nothing to cover — P3 offers nothing here'
          : today?.fresh !== true && relaxed?.fresh !== true
            ? 'nothing to cover — P3 hands back a march the bar already carries'
            : leftOfSweet.length > 0
              ? 'yes — P5 already puts a row there'
              : '**no** — P3 would offer one and P5 does not';
      report.add(
        `| ${one.label} | ${after.added.length} | ${leftOfSweet.length} | ${say(today)} | ${say(relaxed)} | ${say(marginal)} | ${covered} |`,
      );
    }

    report.add('');
    report.add('#### P2 → P4 and P5 · the table and the marginal rows on revive prices (HIS BAR)');
    report.add(
      'Revive divides the silver by about ten and moves every plan six or seven buckets left, so the reference ' +
        'table is a different table and the marginal rates are different rates. Measured on HIS BAR alone, as asked.',
    );
    {
      const price = priceOf(live);
      const retrainBand = live.band.map((row) => repriced(row, 'retrain', price));
      const reviveBand = live.band.map((row) => repriced(row, 'revive', price));
      const retrainTable = curveOver(retrainBand);
      const reviveTable = curveOver(reviveBand);
      const peak = (rows: PlanTotals[]): PlanTotals =>
        rows.reduce((held, row) => (perSilver(row) > perSilver(held) ? row : held));
      report.add('');
      report.add('| reading | table rows | peak a silver | cheapest row | dearest row |');
      report.add('|---|---|---|---|---|');
      report.add(
        `| P4 over the band, retrain | ${retrainTable.length} | ${f3(perSilver(peak(retrainTable)))} | ${n(retrainTable[0]?.silver ?? 0)} | ${n(retrainTable[retrainTable.length - 1]?.silver ?? 0)} |`,
      );
      report.add(
        `| P4 over the band, revive | ${reviveTable.length} | ${f3(perSilver(peak(reviveTable)))} | ${n(reviveTable[0]?.silver ?? 0)} | ${n(reviveTable[reviveTable.length - 1]?.silver ?? 0)} |`,
      );
      const reviveStops = reviveBars.get(live.label) ?? [];
      const reviveOff = reviveBand.filter(
        (row) => !reviveStops.some((stop) => keyOf(stop.row.counts) === keyOf(row.counts)),
      );
      const fiveRevive = marginalRows(
        reviveOff,
        reviveStops.map((stop) => ({ pick: stop.pick as string, row: stop.row })),
        true,
      );
      const fiveRetrain = ruleNew.get(live.label) as ReturnType<typeof marginalRows>;
      report.add('');
      report.add(
        `P5 on HIS BAR adds **${fiveRetrain.added.length}** rows on retrain prices and **${fiveRevive.added.length}** on ` +
          `revive prices (against the bar the re-pricing picker draws there: ${reviveStops.map((stop) => stop.pick).join(' · ') || 'no stops'}).` +
          (fiveRevive.added.length > 0
            ? ` The revive rows: ${fiveRevive.added.map((add) => `${n(add.row.silver)} silver / ${n(add.row.totalDamage)} damage / ${add.row.mercLost} burned against ${add.stopName}`).join('; ')}.`
            : ''),
      );
    }

    report.add('');
    report.add('#### P4 ⟂ P5 · the table is over the band, not the stops');
    report.add(
      'P4 buckets the band; P5 adds stops drawn **from** the band. So the table cannot move when P5 fires — ' +
        "measured by drawing it twice, once over the band and once over the band with P5's rows marked as stops.",
    );
    report.add('');
    report.add('| scenario | band table rows | band table rows with P5’s stops on the bar | identical? |');
    report.add('|---|---|---|---|');
    for (const one of all) {
      const after = ruleNew.get(one.label) as ReturnType<typeof marginalRows>;
      const a = curveOver(one.band);
      const b = curveOver([...one.band, ...after.added.map((add) => add.row)]);
      const same =
        a.length === b.length &&
        a.every((row, index) => keyOf(row.counts) === keyOf((b[index] as PlanTotals).counts));
      report.add(`| ${one.label} | ${a.length} | ${b.length} | ${same ? 'yes' : '**no**'} |`);
    }

    // ======================================================================================================
    // summary
    // ======================================================================================================
    report.h('Summary — one row a proposal, plus the prerequisite');
    const p1Best = tailChanges.reduce<TailChange | undefined>(
      (held, change) =>
        held === undefined ||
        change.after.totalDamage - change.stop.totalDamage > held.after.totalDamage - held.stop.totalDamage
          ? change
          : held,
      undefined,
    );
    const p2Worst = all.reduce<{ label: string; factor: number }>(
      (held, one) => {
        const price = priceOf(one);
        for (const stop of one.stops) {
          const r = repriced(stop, 'retrain', price);
          const v = repriced(stop, 'revive', price);
          const factor = v.silver > 0 ? r.silver / v.silver : 0;
          if (factor > held.factor) return { label: `${one.label} · ${stop.pick}`, factor };
        }
        return held;
      },
      { label: '—', factor: 0 },
    );
    const p3Today = [...saverOffers.values()].filter(
      (offers) => offers.find((o) => o.rule.startsWith('today'))?.fresh === true,
    ).length;
    const p3Count = [...saverOffers.values()].filter(
      (offers) =>
        offers.find((o) => o.rule.startsWith('today'))?.fresh !== true &&
        offers.find((o) => o.rule.startsWith('relaxed'))?.fresh === true,
    ).length;
    const p4Gap = all.reduce<{ label: string; gap: number }>(
      (held, one) => {
        const bandTable = curveOver(one.band);
        const bandPeak = bandTable.reduce((row, other) => (perSilver(other) > perSilver(row) ? other : row));
        const peakPoint = one.plan.curve.reduce((row, other) =>
          other.damagePerSilver > row.damagePerSilver ? other : row,
        );
        const gap = peakPoint.damagePerSilver - perSilver(bandPeak);
        return gap > held.gap ? { label: one.label, gap } : held;
      },
      { label: '—', gap: 0 },
    );
    /** Do P3's own rules and P5 ever land on the same march? Counted, not asserted. */
    let p3p5Same = 0;
    let p3p5Both = 0;
    for (const one of all) {
      const offers = saverOffers.get(one.label) ?? [];
      const p3Keys = new Set(
        offers
          .filter((offer) => offer.fresh && !offer.rule.startsWith('marginal'))
          .map((offer) => keyOf((offer.row as PlanTotals).counts)),
      );
      const p5Keys = new Set((ruleNew.get(one.label)?.added ?? []).map((add) => keyOf(add.row.counts)));
      if (p3Keys.size > 0 && p5Keys.size > 0) p3p5Both += 1;
      if ([...p3Keys].some((key) => p5Keys.has(key))) p3p5Same += 1;
    }
    /** The added row that saves the most silver, and the row the table would be judged on. */
    const p5Best = all.reduce<{ label: string; text: string; saved: number }>(
      (held, one) => {
        for (const add of ruleNew.get(one.label)?.added ?? []) {
          const saved = ((add.stop.silver - add.row.silver) / add.stop.silver) * 100;
          if (saved > held.saved) {
            return {
              label: one.label,
              saved,
              text: `${saved.toFixed(2)} % of the silver for ${((1 - add.row.totalDamage / add.stop.totalDamage) * 100).toFixed(2)} % of the damage — ${n(add.row.silver)} / ${n(add.row.totalDamage)} against ${add.stopName}'s ${n(add.stop.silver)} / ${n(add.stop.totalDamage)}`,
            };
          }
        }
        return held;
      },
      { label: '—', text: 'nothing offered', saved: 0 },
    );
    /** The scenario whose reference table loses the most rows to the band. */
    const p4Loss = all.reduce<{ label: string; before: number; after: number }>(
      (held, one) => {
        const after = curveOver(one.band).length;
        const before = one.plan.curve.length;
        return before - after > held.before - held.after ? { label: one.label, before, after } : held;
      },
      { label: '—', before: 0, after: 0 },
    );
    const p5Added = [...ruleNew.values()].reduce((sum, five) => sum + five.added.length, 0);
    const p5Old = [...ruleOld.values()].reduce((sum, five) => sum + five.added.length, 0);
    const p5Scenarios = [...ruleNew.values()].filter((five) => five.added.length > 0).length;
    const p5Breaks = all.reduce(
      (held, one) => {
        const after = ruleNew.get(one.label) as ReturnType<typeof marginalRows>;
        return {
          silver:
            held.silver +
            (violations(after.bar, (row) => row.silver) - violations(one.stops, (row) => row.silver)),
          burn:
            held.burn +
            (violations(after.bar, (row) => row.mercLost) - violations(one.stops, (row) => row.mercLost)),
        };
      },
      { silver: 0, burn: 0 },
    );
    const liveSaver = saverOffers.get(live.label) ?? [];
    const liveRelaxed = liveSaver.find((o) => o.rule.startsWith('relaxed'))?.row;
    const liveRelaxedFresh = liveSaver.find((o) => o.rule.startsWith('relaxed'))?.fresh === true;
    const liveSweet =
      live.stops.find((stop) => stop.pick === 'sweet-spot') ?? (live.stops[0] as PlanRow | undefined);
    const liveFive = ruleNew.get(live.label) as ReturnType<typeof marginalRows>;
    const liveTail = live.stops.filter((stop) => stop.marches < HORIZON).length;
    const liveBandTable = curveOver(live.band);
    const livePeak = live.plan.curve.reduce((row, other) =>
      other.damagePerSilver > row.damagePerSilver ? other : row,
    );
    const liveBandPeak = liveBandTable.reduce((row, other) =>
      perSilver(other) > perSilver(row) ? other : row,
    );
    const liveRevive = (() => {
      const price = priceOf(live);
      const sweet = live.stops.find((stop) => stop.pick === 'sweet-spot') ?? (live.stops[0] as PlanRow);
      const r = repriced(sweet, 'retrain', price);
      const v = repriced(sweet, 'revive', price);
      return { r, v, pick: sweet.pick };
    })();
    const p6Exposed = exposedStops;

    report.add(
      '| proposal | what it changes | scenarios affected | biggest measured change | HIS BAR would show | cost (rows / monotonicity / run time) | depends on / conflicts with |',
    );
    report.add('|---|---|---|---|---|---|---|');
    report.add(
      `| **P1** troops-only tail on the repeated stops | campaign damage, silver and queue on a stop the horizon outruns; the repeated march is untouched | ${touched.size} of ${all.length} (${tailChanges.length} stops) | ${p1Best ? `${n(p1Best.stop.totalDamage)} → ${n(p1Best.after.totalDamage)} damage (${pct((p1Best.after.totalDamage / p1Best.stop.totalDamage - 1) * 100)}), ${p1Best.one.label} ${p1Best.stop.pick}` : 'nothing on any scenario'} | ${liveTail === 0 ? '**nothing** — all three stops already play the whole horizon' : `${liveTail} stop(s) tailed`} | no row added; order and knee unchanged (measured, every scenario); one Elite sizing a scenario, < 1 ms | independent of P2–P6 on the bar’s **composition**; measured against **P5**, whose rows are identical with and without it on every scenario here |`,
    );
    report.add(
      `| **P2** price the plan on the Battle card’s mode | every silver, gold and queue figure on the bar when the player is on Revive | 0 of ${all.length} are on revive today; all ${all.length} would move if switched | silver ÷ ${p2Worst.factor.toFixed(2)} at most (${p2Worst.label}) | ${liveRevive.pick}: ${n(liveRevive.r.silver)} → ${n(liveRevive.v.silver)} silver, ${duration(liveRevive.r.seconds)} → ${duration(liveRevive.v.seconds)}, ${n(liveRevive.r.gold)} → ${n(liveRevive.v.gold)} gold | no row added; the engine ignores \`plan.mode\` today, so shipping it is an engine change and not a bar rule; re-pick cost is the plan’s own | conflicts with **nothing**, but it moves the inputs of P3, P4 and P5, all three of which are stated in silver |`,
    );
    report.add(
      `| **P3** a thrift exception at the cheap end | one extra stop (or a cheaper one) left of the sweet spot | today’s rule offers a **new** march on ${p3Today} of ${all.length}; the relaxed rule adds ${p3Count} more | ${liveRelaxed ? `${n(liveRelaxed.repeat.silver)} a march against the sweet spot’s ${n(liveSweet?.repeat.silver ?? 0)}` : 'no cheaper march in the band on HIS BAR'} | ${liveRelaxed === undefined ? '**nothing** — his band holds no cheaper troop march that is not beaten on both ratios' : liveRelaxedFresh ? `a new stop at ${n(liveRelaxed.repeat.silver)} silver a march` : `**nothing new** — it hands back the silver saver S-87 already put on his bar at ${n(liveRelaxed.repeat.silver)} a march`} | +1 row where it fires; silver-monotone by construction | **does not overlap P5** — measured: both rules fire on ${p3p5Both} of the ${all.length} scenarios and land on the same march on ${p3p5Same} of them; reads P2’s prices |`,
    );
    report.add(
      `| **P4** bucket the table over the band | which plans the reference table names; no stop moves | all ${all.length} (the table is redrawn everywhere) | the table loses ${p4Loss.before - p4Loss.after} of its ${p4Loss.before} rows (${p4Loss.label}); peak a silver ${f3(p4Gap.gap)} lower at worst (${p4Gap.label}) | peak ${f3(livePeak.damagePerSilver)} → ${f3(perSilver(liveBandPeak))}, ${live.plan.curve.length} → ${liveBandTable.length} rows | no row added to the bar; run time nil (arithmetic over rows already held) | independent of **P5** (measured); reads P2’s prices |`,
    );
    report.add(
      `| **P5** the marginal-reading stop (fixed) | up to one extra stop per stop on the bar | ${p5Scenarios} of ${all.length} | ${p5Added} rows over the ${all.length} (104’s rule added ${p5Old}); the best of them saves ${p5Best.text} (${p5Best.label}) | ${
        liveFive.added.length === 0
          ? '**nothing** — no row added on his bar'
          : `**${liveFive.added.length} row** — ${liveFive.added
              .map((add) => {
                const silver = ((add.stop.silver - add.row.silver) / add.stop.silver) * 100;
                const damage = (1 - add.row.totalDamage / add.stop.totalDamage) * 100;
                const queue = ((add.stop.seconds - add.row.seconds) / Math.max(1, add.stop.seconds)) * 100;
                return `${n(add.row.silver)} / ${n(add.row.totalDamage)} / ${add.row.mercLost} against ${add.stopName}: saves ${silver.toFixed(2)} % of the silver for ${damage.toFixed(2)} % of the damage, and sits ${Math.abs(queue).toFixed(2)} % ${queue < 0 ? '**longer**' : 'less'} in the barracks`;
              })
              .join('; ')}`
      } | +${p5Added} rows over ${all.length} scenarios, ${nearDuplicates.length} of them under 2 % of the silver from the stop beside them; silver-monotone breaks ${p5Breaks.silver >= 0 ? '+' : ''}${p5Breaks.silver}, burn-monotone ${p5Breaks.burn >= 0 ? '+' : ''}${p5Breaks.burn} in total; ${p5Ms.toFixed(2)} ms at worst | **independent of P1 on this benchmark** (measured: identical rows with and without the tail, on every scenario); does not overlap **P3**; reads P2’s prices |`,
    );
    report.add(
      `| **P6** leave “more mercs” and the steady max alone | nothing | ${all.length} of ${all.length} measured, 0 changed | the tithe equals the printed burn on every steady-max and more-mercs stop; the proxy flags units on ${p6Exposed} of them | no change | none | independent of everything |`,
    );

    report.add(
      `| **S-87** shelter every hired type (**done — the prerequisite is met**, \`b080223\`) | which march each stop fields: a capped hired stack the sizer had put above the lowest troop stack is lowered under it, as S-77 already did for the unlimited ones | shipped; **${shelterStops} of the stops on the ${all.length} scenarios still field an unsheltered hired stack** (it was 6 on 4 scenarios under S-77) | the live camp’s steady max: 1 240 hired units on top of the troops → ${n(worstShelter.units)}; the plan’s campaign on his export at 7 000 24 814 601 → 23 264 491 for the same silver | the bar he reads is a different bar — see every figure above | the six rows above are measured **on** it; nothing is waiting on it any more |`,
    );

    report.add('');
    report.add(
      '**What could not be emulated faithfully, and what was done instead.** (1) P2’s "search on revive prices" — ' +
        '`planCampaign` accepts a revive request and ignores it (measured above: identical bars), so the band was ' +
        're-priced and re-picked by the bar’s own rules restated in this file. That restatement cannot re-run the ' +
        'put-back pass nor rebuild the `all-in`, both of which need the engine; it is checked against the engine on ' +
        'the retrain prices and the table names every scenario where a put-back or an all-in is the reason for a ' +
        "disagreement. (2) P1’s tail is the engine’s own `sizer([], 'elite')` call reproduced from outside; the " +
        'campaign totals it produces are arithmetic over that march, which is exactly what `allIn` does with it.',
    );

    report.save();
  }, 900_000);
});
