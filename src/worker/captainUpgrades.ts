/**
 * **The upgrade pass** (W17 C5b, `docs/plans/progression-advisor.md` §4 C5): where the next star, or the next
 * level, of a captain goes. Each upgrade is read as C3 reads a probe, against the plan of the *lead lineup* (the
 * lineup the captain advice found best, `leadLineup`), so a row is the upgrade's own worth and never the swap of lineup
 * it might also bring.
 *
 * Which lineups an upgrade is tried in is the main thread's (`src/state/captainUpgrades.ts`, with the engine's
 * membership logic in `src/engine/captainUpgrades.ts`). This pass takes them as keys and totals:
 *
 *  1. **Screen** — an upgrade with more lineups than `confirm` (a captain on the bench: every lineup that fields it)
 *     has them screened against the lead lineup, each ask one pool job (`client.captains`), and the first
 *     `confirm` of the re-priced ranking kept. An upgrade with `confirm` lineups or fewer (a captain in the lead
 *     lineup: the lead lineup alone) skips the screen.
 *  2. **Plan** — each kept lineup planned in full as one pool job and read against the lead lineup's bar.
 *
 * An upgrade's row takes, stop by stop, the best of its lineups (the first on a tie), so it is never below 0 and
 * never reads as a loss. Results are merged by position, never by arrival, and no job carries a clock, so one
 * worker and six give one answer; the pass has the one clock the pool gives it.
 */
import { CAMPAIGN } from '@/config';
import { probeInfo, type AdvisorRow, type ShownStop } from '@/engine/advisor';
import { inferLevelGain, type WorthKind } from '@/engine/captainUpgrades';
import { shortlistLineups, type LineupScreen, type ScreenLineup } from '@/engine/captains';
import type { CampaignInput } from '@/engine/plan';
import type { ProbeCost } from '@/engine/probes';
import type { MarkerRates } from '@/engine/rating';
import type { BonusTotals } from '@/engine/types';

import type { CalcPool, PoolJob, PoolOutcome } from './pool';
import type { CaptainScreenAnswer, ProbeAnswer } from './protocol';

/** The lineup every upgrade is read against: its key, its totals as the march carries them, and its bar. */
export interface UpgradeLead {
  key: string;
  totals: BonusTotals;
  /** The lead lineup's plan as shown (`CaptainAdviceResult.plans`). */
  stops: ShownStop[];
}

/** One upgrade to ask about. */
export interface UpgradeAsk {
  /** The probe id of the row: `captain:<captainId>:<kind>`. */
  id: string;
  label: string;
  /** What it costs in the game, when the player typed it: the ranking then reads gain per cost. */
  cost?: ProbeCost | undefined;
  /** The lineups it is tried in, with the upgrade applied; the lead lineup alone for a captain in the lead lineup. */
  lineups: ScreenLineup[];
}

export interface CaptainUpgradeOptions {
  /** Aborting it rejects the pass with an `AbortError` and stops every job. */
  signal?: AbortSignal | undefined;
  /** Called as each job settles, with how many are done out of the most the pass can run. */
  onProgress?: ((done: number, total: number) => void) | undefined;
  /** The pass's clock; `CAMPAIGN.budgets.extra` by default. */
  budgetMs?: number | undefined;
  /** The owner's rating; `CAMPAIGN.markerRates` by default. */
  rates?: MarkerRates | undefined;
  /** Lineups planned in full per upgrade; `CAMPAIGN.captainUpgradeConfirm` by default. */
  confirm?: number | undefined;
}

/** One upgrade, read on every stop of the lead lineup's bar. */
export interface UpgradeRow extends AdvisorRow {
  /** Key of the lineup that gives each stop's gain, parallel to `stops`: the lead lineup's own for a captain in it. */
  lineups: string[];
  /** The lineups planned in full for this upgrade, in the order they were tried. */
  planned: string[];
}

export interface CaptainUpgradeFailure {
  id: string;
  message: string;
}

export interface CaptainUpgradeResult {
  lead: string;
  /** One row per upgrade with at least one finished plan, in the order the asks came in. */
  rows: UpgradeRow[];
  /** The upgrades the clock (or a cancel inside a worker) stopped before every plan finished. */
  cut: string[];
  failed: CaptainUpgradeFailure[];
}

/** The settings every job plans under: the input's own, with no clock and nothing a worker can't take. */
function settingsOf(input: CampaignInput): CampaignInput {
  const settings = { ...input };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

/** Stop by stop, the best of several rows of one upgrade (the first on a tie): a row that cannot be below 0. */
function mergeRows(ask: UpgradeAsk, keys: readonly string[], rows: readonly AdvisorRow[]): UpgradeRow {
  const first = rows[0];
  if (first === undefined) throw new Error(`The upgrade ${ask.id} has no row to merge.`);
  const stops = first.stops.map((stop, index) => {
    let best = { advice: stop, key: keys[0] ?? '' };
    rows.forEach((row, at) => {
      const advice = row.stops[index];
      if (advice !== undefined && advice.gain > best.advice.gain) best = { advice, key: keys[at] ?? '' };
    });
    return best;
  });
  return {
    ...probeInfo({
      id: ask.id,
      family: 'captains',
      label: ask.label,
      ...(ask.cost === undefined ? {} : { cost: ask.cost }),
    }),
    stops: stops.map((stop) => stop.advice),
    lineups: stops.map((stop) => stop.key),
    planned: [...keys],
  };
}

/**
 * Run the upgrade pass: `asks` read against `lead`, on the pool. Rejects when `signal` aborts; a screen or a plan
 * that throws is reported in `failed` and the others carry on.
 */
export async function runCaptainUpgrades(
  input: CampaignInput,
  lead: UpgradeLead,
  asks: readonly UpgradeAsk[],
  pool: CalcPool,
  options: CaptainUpgradeOptions = {},
): Promise<CaptainUpgradeResult> {
  const { signal, onProgress } = options;
  const budgetMs = options.budgetMs ?? CAMPAIGN.budgets.extra;
  const rates = options.rates ?? CAMPAIGN.markerRates;
  const confirm = Math.max(0, options.confirm ?? CAMPAIGN.captainUpgradeConfirm);
  const settings = settingsOf(input);
  const screened = asks.map((ask) => ask.lineups.length > confirm);
  const total =
    screened.filter(Boolean).length +
    asks.reduce((sum, ask) => sum + Math.min(confirm, ask.lineups.length), 0);
  let done = 0;
  const onSettled = (): void => {
    done += 1;
    onProgress?.(done, total);
  };
  const began = performance.now();
  const leadLineup: ScreenLineup = { key: lead.key, totals: lead.totals };

  // 1. Screen the asks with more lineups than will be planned.
  const screenJobs: PoolJob<CaptainScreenAnswer>[] = [];
  const screenOf: number[] = [];
  asks.forEach((ask, index) => {
    if (!screened[index]) return;
    screenOf.push(index);
    screenJobs.push((client, jobSignal) =>
      client.captains(
        {
          request: settings.request,
          lineups: [leadLineup, ...ask.lineups],
          currentKey: lead.key,
          stops: lead.stops.map((stop) => ({ pick: stop.pick, counts: stop.counts })),
          rates,
        },
        jobSignal,
      ),
    );
  });
  const screenOutcomes =
    screenJobs.length > 0 ? await pool.map(screenJobs, { budgetMs, signal, onSettled }) : [];

  // The keys each ask plans, in the order they are tried; an ask whose screen did not finish plans none.
  const keysOf: string[][] = asks.map((ask, index) =>
    screened[index] ? [] : ask.lineups.slice(0, confirm).map((lineup) => lineup.key),
  );
  const cut = new Set<string>();
  const failed: CaptainUpgradeFailure[] = [];
  screenOutcomes.forEach((outcome, at) => {
    const index = screenOf[at];
    const ask = index === undefined ? undefined : asks[index];
    if (index === undefined || ask === undefined) return;
    if (outcome.kind === 'error') {
      failed.push({ id: ask.id, message: outcome.message });
      return;
    }
    // A screen cancelled inside its worker answers part of the lineups: not a ranking to take a shortlist from.
    if (outcome.kind === 'cut' || outcome.value.screens.length < ask.lineups.length + 1) {
      cut.add(ask.id);
      return;
    }
    keysOf[index] = shortlistLineups(outcome.value.screens, lead.key, confirm, 'repriced');
  });

  // 2. Plan the kept lineups in full, each read against the lead lineup's bar.
  const planJobs: PoolJob<ProbeAnswer>[] = [];
  const planOf: { index: number; key: string }[] = [];
  asks.forEach((ask, index) => {
    for (const key of keysOf[index] ?? []) {
      const lineup = ask.lineups.find((candidate) => candidate.key === key);
      if (lineup === undefined)
        throw new Error(`The kept lineup ${key} is not among the lineups of ${ask.id}.`);
      planOf.push({ index, key });
      planJobs.push((client, jobSignal) =>
        client.probe(
          {
            plan: { ...settings, request: { ...settings.request, totals: lineup.totals } },
            against: {
              probe: probeInfo({
                id: ask.id,
                family: 'captains',
                label: ask.label,
                ...(ask.cost === undefined ? {} : { cost: ask.cost }),
              }),
              baseline: lead.stops,
              rates,
            },
          },
          jobSignal,
        ),
      );
    }
  });
  const left = budgetMs - (performance.now() - began);
  const planOutcomes: PoolOutcome<ProbeAnswer>[] =
    left > 0 && planJobs.length > 0
      ? await pool.map(planJobs, { budgetMs: left, signal, onSettled })
      : planJobs.map(() => ({ kind: 'cut' }));

  const finished: { keys: string[]; rows: AdvisorRow[] }[] = asks.map(() => ({ keys: [], rows: [] }));
  planOutcomes.forEach((outcome, at) => {
    const planned = planOf[at];
    const ask = planned === undefined ? undefined : asks[planned.index];
    if (planned === undefined || ask === undefined) return;
    if (outcome.kind === 'error') failed.push({ id: ask.id, message: outcome.message });
    // A job cancelled inside its worker answers with no row: it did not finish, which is what a cut is.
    else if (outcome.kind === 'cut' || outcome.value.row === null) cut.add(ask.id);
    else {
      finished[planned.index]?.keys.push(planned.key);
      finished[planned.index]?.rows.push(outcome.value.row);
    }
  });

  const rows: UpgradeRow[] = [];
  asks.forEach((ask, index) => {
    const got = finished[index];
    if (got !== undefined && got.rows.length > 0) rows.push(mergeRows(ask, got.keys, got.rows));
  });
  return { lead: lead.key, rows, cut: asks.map((ask) => ask.id).filter((id) => cut.has(id)), failed };
}

// ---- The worth list ---------------------------------------------------------------------------------
// `docs/plans/captain-upgrade-worth.md`: one ranked list of upgrades, each read on every stop of the lead lineup's
// bar, in two tiers. Tier 1 re-prices the current march's counts under the upgraded totals (one screen job per
// upgrade, a benched captain in every lineup that fields it and the best swap taken, stop by stop). Tier 2
// regenerates the bar in full for the best `top` upgrades of tier 1 (`planWorth` below).

/** One probe of the worth list to ask about. */
export interface WorthAsk {
  /** `captain:<captainId>:<kind>+<size>`. */
  id: string;
  label: string;
  captainId: string;
  kind: WorthKind;
  /** Stars or levels added. */
  size: number;
  /** The bonus points one level adds (all lines): the inference between level probes scales by it. */
  perLevel: number;
  /** Probed at its exact level: no gain is inferred from it. */
  exact?: boolean | undefined;
  cost?: ProbeCost | undefined;
  /** The lineups it is tried in with the upgrade applied: the lead lineup alone for a captain in it. */
  lineups: ScreenLineup[];
}

export interface WorthOptions extends Omit<CaptainUpgradeOptions, 'confirm'> {
  /** How many upgrades are regenerated in full (tier 2); `CAMPAIGN.captainWorthTop` by default. */
  top?: number | undefined;
  /** Lineups planned in full per regenerated upgrade; `CAMPAIGN.captainUpgradeConfirm` by default. */
  confirm?: number | undefined;
}

/** The gain of a tier on each stop of the bar (never below 0) and their average. */
export interface WorthTier {
  stops: number[];
  gain: number;
  /** Key of the lineup that gives each stop's gain. */
  lineups: string[];
}

export interface WorthRow {
  id: string;
  label: string;
  captainId: string;
  kind: WorthKind;
  size: number;
  cost?: ProbeCost;
  tier1: WorthTier;
  /** Absent when the upgrade was not regenerated (or its plans did not finish). */
  tier2?: WorthTier & { planned: string[] };
  /** What the row is ranked on: tier 2's gain where there is one, tier 1's otherwise. */
  worth: number;
  /** Level steps only: `worth / size`, so captains with different steps compare fairly. */
  gainPerLevel?: number;
}

/** A level step nobody probed, read off the nearest probe of the same captain (never ranked). */
export interface InferredLevel {
  captainId: string;
  size: number;
  tier1Gain: number;
  gainPerLevel: number;
}

export interface WorthResult {
  lead: string;
  /** Ranked: costed rows by gain per cost (a group per unit), then the rest by worth; the asks' order on a tie. */
  rows: WorthRow[];
  inferred: InferredLevel[];
  /** The upgrades the clock (or a cancel inside a worker) stopped before every job finished. */
  cut: string[];
  failed: CaptainUpgradeFailure[];
}

/** The mean of a list; 0 when empty. */
const mean = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

/** Order the rows as `rankAdvice` does, on worth: costed rows by gain per cost in unit groups, then the rest. */
function rankWorth(rows: readonly WorthRow[]): WorthRow[] {
  const units: string[] = [];
  for (const row of rows)
    if (row.cost !== undefined && !units.includes(row.cost.unit)) units.push(row.cost.unit);
  const unitOf = (row: WorthRow): number =>
    row.cost === undefined ? units.length : units.indexOf(row.cost.unit);
  const score = (row: WorthRow): number => (row.cost === undefined ? row.worth : row.worth / row.cost.amount);
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => unitOf(a.row) - unitOf(b.row) || score(b.row) - score(a.row) || a.index - b.index)
    .map((entry) => entry.row);
}

/** Where the lead lineup's own upgraded totals stand in a screen: a key no lineup of the account has. */
const UPGRADED_LEAD = '\u0000upgraded';

/**
 * Run the worth pass: `asks` read against `lead`, on the pool. Rejects when `signal` aborts; a job that throws is
 * reported in `failed` and the others carry on.
 */
export async function runUpgradeWorth(
  input: CampaignInput,
  lead: UpgradeLead,
  asks: readonly WorthAsk[],
  pool: CalcPool,
  options: WorthOptions = {},
): Promise<WorthResult> {
  const { signal, onProgress } = options;
  const budgetMs = options.budgetMs ?? CAMPAIGN.budgets.extra;
  const rates = options.rates ?? CAMPAIGN.markerRates;
  const top = Math.max(0, options.top ?? CAMPAIGN.captainWorthTop);
  const confirm = Math.max(0, options.confirm ?? CAMPAIGN.captainUpgradeConfirm);
  const settings = settingsOf(input);
  const stopsOf = lead.stops.map((stop) => ({ pick: stop.pick, counts: stop.counts }));
  const began = performance.now();
  let done = 0;
  // Tier 2 is not known until tier 1 is read: the total grows by its jobs then.
  let total = asks.length;
  const onSettled = (): void => {
    done += 1;
    onProgress?.(done, total);
  };
  const leadLineup: ScreenLineup = { key: lead.key, totals: lead.totals };
  // The lead lineup's own upgraded totals share its key: the screen tells them apart by a key of their own.
  const lineupsOf = asks.map((ask) =>
    ask.lineups.map((lineup) => (lineup.key === lead.key ? { ...lineup, key: UPGRADED_LEAD } : lineup)),
  );
  const keyOf = (key: string): string => (key === UPGRADED_LEAD ? lead.key : key);

  // ---- Tier 1: re-price the current march's counts under each upgrade.
  const screenJobs: PoolJob<CaptainScreenAnswer>[] = asks.map(
    (_, index) => (client, jobSignal) =>
      client.captains(
        {
          request: settings.request,
          lineups: [leadLineup, ...(lineupsOf[index] ?? [])],
          currentKey: lead.key,
          stops: stopsOf,
          rates,
        },
        jobSignal,
      ),
  );
  const screenOutcomes =
    screenJobs.length > 0 ? await pool.map(screenJobs, { budgetMs, signal, onSettled }) : [];

  const cut = new Set<string>();
  const failed: CaptainUpgradeFailure[] = [];
  const read: { ask: WorthAsk; index: number; tier1: WorthTier; screens: LineupScreen[] }[] = [];
  screenOutcomes.forEach((outcome, index) => {
    const ask = asks[index];
    if (ask === undefined) return;
    if (outcome.kind === 'error') {
      failed.push({ id: ask.id, message: outcome.message });
      return;
    }
    const lineups = lineupsOf[index] ?? [];
    // A screen cancelled inside its worker answers part of the lineups: not a reading to rank on.
    if (outcome.kind === 'cut' || outcome.value.screens.length < lineups.length + 1) {
      cut.add(ask.id);
      return;
    }
    const stops = lead.stops.map((_, at) => {
      let best = { gain: 0, key: lead.key };
      for (const screen of outcome.value.screens) {
        const gain = screen.key === lead.key ? 0 : (screen.repriced[at] ?? 0);
        if (gain > best.gain) best = { gain, key: keyOf(screen.key) };
      }
      return best;
    });
    read.push({
      ask,
      index,
      screens: outcome.value.screens,
      tier1: {
        stops: stops.map((stop) => stop.gain),
        gain: mean(stops.map((stop) => stop.gain)),
        lineups: stops.map((stop) => stop.key),
      },
    });
  });

  // ---- Tier 2: regenerate the bar for the best `top` of tier 1 (a tie keeps the asks' order).
  const chosen = read
    .map((entry, at) => ({ entry, at }))
    .sort((a, b) => b.entry.tier1.gain - a.entry.tier1.gain || a.at - b.at)
    .slice(0, top)
    .map(({ entry }) => entry);
  const planJobs: PoolJob<ProbeAnswer>[] = [];
  const planOf: { entry: (typeof read)[number]; key: string }[] = [];
  for (const entry of chosen) {
    const keys = shortlistLineups(entry.screens, lead.key, confirm, 'repriced');
    for (const key of keys) {
      const lineup = (lineupsOf[entry.index] ?? []).find((candidate) => candidate.key === key);
      if (lineup === undefined)
        throw new Error(`The kept lineup ${key} is not among the lineups of ${entry.ask.id}.`);
      planOf.push({ entry, key });
      planJobs.push((client, jobSignal) =>
        client.probe(
          {
            plan: { ...settings, request: { ...settings.request, totals: lineup.totals } },
            against: {
              probe: probeInfo({
                id: entry.ask.id,
                family: 'captains',
                label: entry.ask.label,
                ...(entry.ask.cost === undefined ? {} : { cost: entry.ask.cost }),
              }),
              baseline: lead.stops,
              rates,
            },
          },
          jobSignal,
        ),
      );
    }
  }
  total += planJobs.length;
  const left = budgetMs - (performance.now() - began);
  const planOutcomes: PoolOutcome<ProbeAnswer>[] =
    left > 0 && planJobs.length > 0
      ? await pool.map(planJobs, { budgetMs: left, signal, onSettled })
      : planJobs.map(() => ({ kind: 'cut' }));
  const finished = new Map<string, { keys: string[]; rows: AdvisorRow[] }>();
  planOutcomes.forEach((outcome, at) => {
    const planned = planOf[at];
    if (planned === undefined) return;
    const id = planned.entry.ask.id;
    if (outcome.kind === 'error') failed.push({ id, message: outcome.message });
    // A job cancelled inside its worker answers with no row: it did not finish, which is what a cut is.
    else if (outcome.kind === 'cut' || outcome.value.row === null) cut.add(id);
    else {
      const got = finished.get(id) ?? { keys: [], rows: [] };
      got.keys.push(keyOf(planned.key));
      got.rows.push(outcome.value.row);
      finished.set(id, got);
    }
  });

  const rows: WorthRow[] = read.map(({ ask, tier1 }): WorthRow => {
    const got = finished.get(ask.id);
    let tier2: WorthRow['tier2'];
    // Tier 2 only counts when every plan of the upgrade finished: a part reading would favour the lucky lineup.
    if (got !== undefined && !cut.has(ask.id) && !failed.some((failure) => failure.id === ask.id)) {
      const merged = mergeRows(ask, got.keys, got.rows);
      const stops = merged.stops.map((stop) => stop.gain);
      tier2 = { stops, gain: mean(stops), lineups: merged.lineups, planned: merged.planned };
    }
    const worth = tier2?.gain ?? tier1.gain;
    return {
      id: ask.id,
      label: ask.label,
      captainId: ask.captainId,
      kind: ask.kind,
      size: ask.size,
      ...(ask.cost === undefined ? {} : { cost: ask.cost }),
      tier1,
      ...(tier2 === undefined ? {} : { tier2 }),
      worth,
      ...(ask.kind === 'level' ? { gainPerLevel: worth / ask.size } : {}),
    };
  });

  // ---- The levels between the probes, off the nearest probe's tier 1 gain scaled by the bonus ratio.
  const inferred: InferredLevel[] = [];
  const captains = [
    ...new Set(read.filter(({ ask }) => ask.kind === 'level').map(({ ask }) => ask.captainId)),
  ];
  for (const captainId of captains) {
    const levels = read.filter(({ ask }) => ask.kind === 'level' && ask.captainId === captainId);
    if (levels.some(({ ask }) => ask.exact === true)) continue;
    const probes = levels.map(({ ask, tier1 }) => ({
      levels: ask.size,
      bonus: ask.perLevel * ask.size,
      gain: tier1.gain,
    }));
    const widest = Math.max(...probes.map((probe) => probe.levels));
    const perLevel = levels[0]?.ask.perLevel ?? 0;
    for (let size = 1; size < widest; size += 1) {
      if (probes.some((probe) => probe.levels === size)) continue;
      const gain = inferLevelGain(probes, { levels: size, bonus: perLevel * size });
      inferred.push({ captainId, size, tier1Gain: gain, gainPerLevel: gain / size });
    }
  }

  return {
    lead: lead.key,
    rows: rankWorth(rows),
    inferred,
    cut: asks.map((ask) => ask.id).filter((id) => cut.has(id)),
    failed,
  };
}
