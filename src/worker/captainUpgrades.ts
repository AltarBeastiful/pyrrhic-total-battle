/**
 * **The upgrade pass** (W17 C5b, `docs/plans/progression-advisor.md` §4 C5): where the next star, or the next
 * level, of a captain goes. Each upgrade is read as C3 reads a probe, against the plan of the *lead trio* (the
 * trio the captain advice found best, `leadTrio`), so a row is the upgrade's own worth and never the swap of trio
 * it might also bring.
 *
 * Which trios an upgrade is tried in is the main thread's (`src/state/captainUpgrades.ts`, with the engine's
 * membership logic in `src/engine/captainUpgrades.ts`). This pass takes them as keys and totals:
 *
 *  1. **Screen** — an upgrade with more trios than `confirm` (a captain on the bench: every trio that fields it)
 *     has them screened against the lead trio, each ask one pool job (`client.captains`), and the first
 *     `confirm` of the re-priced ranking kept. An upgrade with `confirm` trios or fewer (a captain in the lead
 *     trio: the lead trio alone) skips the screen.
 *  2. **Plan** — each kept trio planned in full as one pool job and read against the lead trio's bar.
 *
 * An upgrade's row takes, stop by stop, the best of its trios (the first on a tie), so it is never below 0 and
 * never reads as a loss. Results are merged by position, never by arrival, and no job carries a clock, so one
 * worker and six give one answer; the pass has the one clock the pool gives it.
 */
import { CAMPAIGN } from '@/config';
import { probeInfo, type AdvisorRow, type ShownStop } from '@/engine/advisor';
import { shortlistTrios, type ScreenTrio } from '@/engine/captains';
import type { CampaignInput } from '@/engine/plan';
import type { ProbeCost } from '@/engine/probes';
import type { MarkerRates } from '@/engine/rating';
import type { BonusTotals } from '@/engine/types';

import type { CalcPool, PoolJob, PoolOutcome } from './pool';
import type { CaptainScreenAnswer, ProbeAnswer } from './protocol';

/** The trio every upgrade is read against: its key, its totals as the march carries them, and its bar. */
export interface UpgradeLead {
  key: string;
  totals: BonusTotals;
  /** The lead trio's plan as shown (`CaptainAdviceResult.plans`). */
  stops: ShownStop[];
}

/** One upgrade to ask about. */
export interface UpgradeAsk {
  /** The probe id of the row: `captain:<captainId>:<kind>`. */
  id: string;
  label: string;
  /** What it costs in the game, when the player typed it: the ranking then reads gain per cost. */
  cost?: ProbeCost | undefined;
  /** The trios it is tried in, with the upgrade applied; the lead trio alone for a captain in the lead trio. */
  trios: ScreenTrio[];
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
  /** Trios planned in full per upgrade; `CAMPAIGN.captainUpgradeConfirm` by default. */
  confirm?: number | undefined;
}

/** One upgrade, read on every stop of the lead trio's bar. */
export interface UpgradeRow extends AdvisorRow {
  /** Key of the trio that gives each stop's gain, parallel to `stops`: the lead trio's own for a captain in it. */
  trios: string[];
  /** The trios planned in full for this upgrade, in the order they were tried. */
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
    trios: stops.map((stop) => stop.key),
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
  const screened = asks.map((ask) => ask.trios.length > confirm);
  const total =
    screened.filter(Boolean).length + asks.reduce((sum, ask) => sum + Math.min(confirm, ask.trios.length), 0);
  let done = 0;
  const onSettled = (): void => {
    done += 1;
    onProgress?.(done, total);
  };
  const began = performance.now();
  const leadTrio: ScreenTrio = { key: lead.key, totals: lead.totals };

  // 1. Screen the asks with more trios than will be planned.
  const screenJobs: PoolJob<CaptainScreenAnswer>[] = [];
  const screenOf: number[] = [];
  asks.forEach((ask, index) => {
    if (!screened[index]) return;
    screenOf.push(index);
    screenJobs.push((client, jobSignal) =>
      client.captains(
        {
          request: settings.request,
          trios: [leadTrio, ...ask.trios],
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
    screened[index] ? [] : ask.trios.slice(0, confirm).map((trio) => trio.key),
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
    // A screen cancelled inside its worker answers part of the trios: not a ranking to take a shortlist from.
    if (outcome.kind === 'cut' || outcome.value.screens.length < ask.trios.length + 1) {
      cut.add(ask.id);
      return;
    }
    keysOf[index] = shortlistTrios(outcome.value.screens, lead.key, confirm, 'repriced');
  });

  // 2. Plan the kept trios in full, each read against the lead trio's bar.
  const planJobs: PoolJob<ProbeAnswer>[] = [];
  const planOf: { index: number; key: string }[] = [];
  asks.forEach((ask, index) => {
    for (const key of keysOf[index] ?? []) {
      const trio = ask.trios.find((candidate) => candidate.key === key);
      if (trio === undefined) throw new Error(`The kept trio ${key} is not among the trios of ${ask.id}.`);
      planOf.push({ index, key });
      planJobs.push((client, jobSignal) =>
        client.probe(
          {
            plan: { ...settings, request: { ...settings.request, totals: trio.totals } },
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
