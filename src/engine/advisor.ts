/**
 * **The advisor's reading** (W17 C3, `docs/plans/progression-advisor.md` §4): what one probe is worth on each
 * stop of the bar, as one figure that search noise can never turn into a loss.
 *
 * **Every march here is read as the March shows it**: raised by Tight, the position the March opens on (owner,
 * 2026-10-07: the baseline is *Tight, as shown*). Tight is applied after the plan, by the positions step of the
 * worker, so this module stays pure engine and never prices a raise itself: it is handed the marches already
 * raised and battled (`ShownMarch`, built by the probe job in `src/worker/jobs.ts`) and only reads them.
 *
 * For each stop of the baseline bar, three readings of one probe:
 *
 *  - **current** — the stop as the baseline plan has it. The baseline is planned again inside the advisor's
 *    pass under the probes' own settings (no `budgetMs`, W17 A0), never taken from the main plan;
 *  - **re-priced** — the same stop's counts battled again under the upgraded request, with no plan search (the
 *    raise still runs: it is how the March would show those counts after the upgrade). **Not a floor**: the
 *    enemy wipes the highest-HP stack first, so a health probe can lift a hired stack over the troop floor and
 *    reorder the deaths, strength reorders the attacks, and HP rounding can turn +1 % into nothing;
 *  - **re-planned** — the upgraded request planned in full, and the stop of the same kind taken from its bar.
 *
 * **Gain** = max(re-priced, re-planned, current) − current on the owner's rating (`rate()` with the rates the
 * caller hands over, `CAMPAIGN.markerRates`), the yardstick the bar and Tight already use. `rate(current,
 * current)` is 0, so no probe is ever reported as a loss — the search is not monotone (`climbRounds ≥ 256` is
 * worse), and a re-planned +1 % can come out lower by noise alone. A probe whose two readings both rate below
 * current gains 0 by the clamp and says so (`clamped`); it is "no gain", never dropped.
 *
 * **What the gain costs the march** (Phase 04b, owner 2026-10-08: damage alone is not enough) is read off the
 * same reading the gain is, in the bill's own units (`costChange`, `outstandingSeconds`). It is display only:
 * the gain already weighs those costs through `rate()`, and no rating or ranking reads the change.
 */
import { CAMPAIGN } from '../config';
import type { PlanPick } from './plan';
import type { Probe } from './probes';
import { rate } from './rating';
import type { MarkerRates } from './rating';

/**
 * What the owner's rating reads off one march: the worst opening and the five costs the recap prints, every one
 * of them given, so `rate()` weighs them all. `hired` is the authority chunks the march loses for good.
 */
export interface ShownBill {
  damage: number;
  silver: number;
  gold: number;
  hired: number;
  dragonCoins: number;
  seconds: number;
}

/** One march as the March shows it: the counts after the raise, battled. */
export interface ShownMarch {
  /** The count of every type the march fields after the raise, by unit id. */
  counts: Record<string, number>;
  bill: ShownBill;
  /** Unit ids in the order the enemy kills the stacks (total HP, highest first: `battle.ts`), fielded only. */
  deaths: string[];
}

/** One stop of a bar: which answer it is, the counts the plan sized, and the march the March shows for it. */
export interface ShownStop {
  pick: PlanPick;
  /** `PlanRow.counts`, before the raise: what a re-price battles again under the upgraded request. */
  counts: Record<string, number>;
  march: ShownMarch;
}

/** A probe as a reading carries it: without `apply`, because a row crosses `postMessage`. */
export type ProbeInfo = Pick<Probe, 'id' | 'family' | 'label' | 'cost'>;

export function probeInfo(probe: ProbeInfo): ProbeInfo {
  return {
    id: probe.id,
    family: probe.family,
    label: probe.label,
    ...(probe.cost === undefined ? {} : { cost: { amount: probe.cost.amount, unit: probe.cost.unit } }),
  };
}

/** One probe, read on one stop of the bar. */
export interface StopAdvice {
  pick: PlanPick;
  current: ShownMarch;
  repriced: ShownMarch;
  /** The upgraded plan's stop of the same kind, as shown; `null` when its bar has no such stop. */
  replanned: ShownMarch | null;
  /** `rate(current, re-priced)`. */
  repricedRating: number;
  /** `rate(current, re-planned)`; `null` with no re-planned stop. */
  replannedRating: number | null;
  /** max(re-priced, re-planned, current) − current on the rating: never below 0. */
  gain: number;
  /**
   * The reading the gain is — the re-planned stop where it rates at least as high as the re-priced one, since it
   * is what a Generate after the upgrade would show — or `null` where neither rates above current (no gain).
   */
  from: 'repriced' | 'replanned' | null;
  /** Both readings rate below current, so the gain is 0 by the clamp: shown as "no gain", never dropped. */
  clamped: boolean;
  /** The damage of the reading the gain is, as a change in % of the current damage; 0 with no gain. */
  damagePercent: number;
  /** The re-planned stop rates below the re-priced one: the search found less than the same counts give. */
  noise: boolean;
  /** The re-priced march, as shown, dies in another order than the current one. */
  reorder: boolean;
  /**
   * The re-planned stop rates below the current one (owner, 2026-10-07): the ranking still reads "no gain" for
   * it, and the row carries the re-planned figure (`replanned`) so the search regression can be reported.
   */
  worse: boolean;
}

/** One probe, read on every stop of the baseline bar, in the bar's order. */
export interface AdvisorRow extends ProbeInfo {
  stops: StopAdvice[];
}

function sameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/** One probe on one stop: the three readings, the gain and the flags. */
export function readStop(
  current: ShownStop,
  repriced: ShownMarch,
  replanned: ShownMarch | null,
  rates: MarkerRates,
): StopAdvice {
  const repricedRating = rate(current.march.bill, repriced.bill, rates);
  const replannedRating = replanned === null ? null : rate(current.march.bill, replanned.bill, rates);
  const best = Math.max(repricedRating, replannedRating ?? Number.NEGATIVE_INFINITY);
  const from =
    best <= 0
      ? null
      : replannedRating !== null && replannedRating >= repricedRating
        ? 'replanned'
        : 'repriced';
  const chosen = from === 'replanned' ? replanned : from === 'repriced' ? repriced : null;
  const before = current.march.bill.damage;
  return {
    pick: current.pick,
    current: current.march,
    repriced,
    replanned,
    repricedRating,
    replannedRating,
    gain: Math.max(0, best),
    from,
    clamped: best < 0,
    damagePercent: chosen === null || before <= 0 ? 0 : ((chosen.bill.damage - before) / before) * 100,
    noise: replannedRating !== null && replannedRating < repricedRating,
    reorder: !sameOrder(repriced.deaths, current.march.deaths),
    worse: replannedRating !== null && replannedRating < 0,
  };
}

/**
 * **One probe on every stop of the baseline bar.** `upgraded` is the probe's own bar as shown — the upgraded
 * request planned and raised — and a stop's re-planned reading is the stop of the same kind on it; `reprice`
 * answers a baseline stop's counts under the upgraded request.
 */
export function readProbe(
  probe: ProbeInfo,
  baseline: readonly ShownStop[],
  upgraded: readonly ShownStop[],
  reprice: (stop: ShownStop) => ShownMarch,
  rates: MarkerRates,
): AdvisorRow {
  return {
    ...probeInfo(probe),
    stops: baseline.map((current) =>
      readStop(
        current,
        reprice(current),
        upgraded.find((stop) => stop.pick === current.pick)?.march ?? null,
        rates,
      ),
    ),
  };
}

/**
 * **The stop a row is headlined on** (owner, 2026-10-07): the stop selected on the bar, the sweet spot by
 * default — that kind of stop on the baseline bar, else its sweet spot, else its first stop.
 */
export function headlineOf(row: AdvisorRow, pick: PlanPick = 'sweet-spot'): StopAdvice | undefined {
  return (
    row.stops.find((stop) => stop.pick === pick) ??
    row.stops.find((stop) => stop.pick === 'sweet-spot') ??
    row.stops[0]
  );
}

/** A costed row's headline gain per unit of its cost; `null` for a row with no cost. */
export function gainPerCost(row: AdvisorRow, pick?: PlanPick): number | null {
  if (row.cost === undefined) return null;
  return (headlineOf(row, pick)?.gain ?? 0) / row.cost.amount;
}

/**
 * **Rows ranked on the headline stop** (`docs/plans/progression-advisor.md` §4 C2): by gain, or by gain per cost
 * when a cost is typed. A gain per talent point and a gain per day cannot be compared, so the rows with a cost
 * come first, one group per unit in the order its first row was given, each ranked by gain per cost; the rows
 * with no cost follow, ranked by gain. Ties keep the order the probes were given in. `rankingOrder` says the
 * ordering the card must state.
 */
export function rankAdvice(rows: readonly AdvisorRow[], pick?: PlanPick): AdvisorRow[] {
  const gainOf = (row: AdvisorRow): number => headlineOf(row, pick)?.gain ?? 0;
  const units = rankingOrder(rows);
  const unitOf = (row: AdvisorRow): number =>
    row.cost === undefined ? units.length : units.indexOf(row.cost.unit);
  return [...rows].sort(
    (a, b) =>
      unitOf(a) - unitOf(b) ||
      (a.cost === undefined
        ? gainOf(b) - gainOf(a)
        : (gainPerCost(b, pick) ?? 0) - (gainPerCost(a, pick) ?? 0)),
  );
}

/** The cost units the ranking groups by, in the order `rankAdvice` lists them; empty when it is by gain alone. */
export function rankingOrder(rows: readonly AdvisorRow[]): string[] {
  const units: string[] = [];
  for (const row of rows)
    if (row.cost !== undefined && !units.includes(row.cost.unit)) units.push(row.cost.unit);
  return units;
}

/**
 * **The march the gain is read from**: the re-planned stop where it is the gain, the re-priced one otherwise,
 * `null` with no gain. What a row says beside its gain (the damage it reaches, what it costs the march) comes
 * off this march, so the figures and the gain are always one reading.
 */
export function gainReading(stop: StopAdvice): ShownMarch | null {
  return stop.from === 'replanned' ? stop.replanned : stop.from === 'repriced' ? stop.repriced : null;
}

/** What an upgrade changes in one march's bill: raw amounts, per march; a cost that falls is negative. */
export interface CostChange {
  silver: number;
  gold: number;
  seconds: number;
}

/**
 * **What the upgrade costs the march**: the bill of the reading the gain is (`gainReading`) minus the current
 * march's, in silver, gold and training seconds. `null` on a row with no gain, which prints no cost.
 */
export function costChange(stop: StopAdvice): CostChange | null {
  const reading = gainReading(stop);
  if (reading === null) return null;
  const before = stop.current.bill;
  return {
    silver: reading.bill.silver - before.silver,
    gold: reading.bill.gold - before.gold,
    seconds: reading.bill.seconds - before.seconds,
  };
}

/** When a training-time change is worth printing: a share of the current queue, and a floor in seconds. */
export interface TrainingBound {
  share: number;
  seconds: number;
}

/**
 * **The training-time change worth printing**: `change.seconds` when it is larger than `bound.share` of the
 * current march's queue and larger than `bound.seconds`, whichever way it goes (a saving counts as much as a
 * rise); `null` otherwise, and the card prints no time (design rule 15). The bound is the owner's
 * (`CAMPAIGN.outstandingTraining`); an experiment may hand over another.
 */
export function outstandingSeconds(
  current: Pick<ShownBill, 'seconds'>,
  change: Pick<CostChange, 'seconds'>,
  bound: TrainingBound = CAMPAIGN.outstandingTraining,
): number | null {
  const size = Math.abs(change.seconds);
  return size > bound.share * current.seconds && size > bound.seconds ? change.seconds : null;
}
