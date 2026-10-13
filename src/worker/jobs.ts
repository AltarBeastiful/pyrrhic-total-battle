/**
 * The job bodies, shared by the worker and by the main-thread fallback so both compute exactly the
 * same thing. Everything here is pure: the transport lives in `calc.worker.ts` / `client.ts`.
 */
import {
  planCampaign,
  planMarch,
  resizeMarchOver,
  searchPriority,
  simulateBattle,
  sizeStacks,
  withMethod,
} from '@/engine';
import { readProbe } from '@/engine/advisor';
import type { ShownBill, ShownMarch } from '@/engine/advisor';
import { screenLineups } from '@/engine/captains';
import type { Pricer } from '@/engine/captains';
import type { CampaignInput, CampaignPlan, ResizedMarch } from '@/engine/plan';
import type {
  BattleSummary,
  BonusTotals,
  SearchProgress,
  SearchRequest,
  SearchResult,
  StackRequest,
  StackResult,
} from '@/engine/types';
import { exhaustivePools } from '@/ui/sections/march/exact';
import type { ExactRaiseAnswer, ExactRaiseInput } from '@/ui/sections/march/exact';
import { hiredLost } from '@/ui/sections/march/hired';
import { applyCounts } from '@/ui/sections/march/manual';
import { liftedCounts, OFFERED_POSITIONS, positionTrades } from '@/ui/sections/march/positions';
import type { PositionTrades } from '@/ui/sections/march/positions';
import { countsOf, troopFloor } from '@/ui/sections/march/raise';

import { CENSUS, countShows } from './census';
import type {
  CaptainScreenAnswer,
  CaptainScreenInput,
  PositionsInput,
  ProbeAnswer,
  ProbeInput,
  ProbeReading,
  ResizeInput,
  StackOutcome,
} from './protocol';

/** Message shown when a search is asked for before S-40 wires the search engine in. */

export interface JobContext {
  /** Report intermediate progress; the client forwards it to `onProgress`. */
  onProgress: (progress: SearchProgress) => void;
  /** Polled at every checkpoint; when it turns true the job should return early. */
  cancelled: () => boolean;
}

export function runStack(request: StackRequest): StackOutcome {
  const result = sizeStacks(request);
  return { result, summary: simulateBattle(result, request) };
}

/** Priority search (S-40/S-41): time-boxed, cancellable, progress forwarded to the client. */
export function runSearch(request: SearchRequest, context: JobContext): SearchResult {
  return searchPriority(request, context.onProgress, context.cancelled);
}

/**
 * Complete optimization v2 (S-55): the campaign planned from the army alone. Not time-boxed — it reports no
 * progress, because every candidate is scored whole and the answer is one plan rather than a ranked list —
 * but it is cancellable at a candidate boundary, which is what the Cancel button needs.
 */
export function runPlan(request: CampaignInput, context: JobContext): CampaignPlan {
  return planCampaign({ ...request, shouldStop: context.cancelled });
}

/**
 * **A March edit on a plan** (S-104): one stop re-sized over the troop types that are in, inside the plan's
 * own rules — sheltered, the stop's hired counts as caps, nothing else pushed out. Not cancellable and not
 * time-boxed: it prices a dozen shapes and comes back in a few milliseconds, where a plan walks thousands.
 */
export function runResize(input: ResizeInput): ResizedMarch | null {
  return resizeMarchOver(input.request, input.within);
}

/**
 * **The exhaustive raise** (S-143b): `Best` with the sampling taken out, on the kernel (W16 E3 S5b — the
 * same `liftedCounts` the positions block prices with, so a March edit and a row of the block are one
 * answer). Not cancellable and not time-boxed, and deliberately so — the owner's call is that there is no
 * cost limit on this one (*"no cost limit as it's experimental for now"*), and the way it is kept out of the
 * way is `raiseSearch.ts` giving it a worker of its own rather than by cutting the search short.
 *
 * `null` when the position was **not asked** — no pool stands on an exhaustive position, no troop shelters a
 * hired stack, or a march the kernel cannot pack — which the March reads as "the climb is the answer".
 *
 * **A box with nothing left in it to search is an answer and not a `null`** (2026-10-12, investigation 0026).
 * It used to be handed back as `null` as well, which the March reads as "no search ran, keep the climb"; that
 * was fair while a box was the whole shelter range, because a box with no movable stack was then a march where
 * the *climb* had nothing to move either. The raise's own box now carries **only what the bounds accept** —
 * the pool's spare housing, and for `Tight` the mercenary stack's chunk top — so "no movable stack" is a
 * common and *successful* reading, and it is exactly where the climb of an uncapped position may sit **above**
 * what the position promises: `Tight`'s climb is bounded by neither the burn nor the plan's counts. Handing
 * that back as `null` would leave the March drawing a march `Tight` would not field; the pool's own units
 * answer (for `Tight`, the plan's own counts) is the answer, and it is the one the kernel merges.
 */
export function runRaise(input: ExactRaiseInput): ExactRaiseAnswer | null {
  if (exhaustivePools(input.modes).length === 0) return null;
  // No troop to shelter under is the rule that keeps the position off a march with nothing to hide behind
  // (`troopFloor`, the condition the control is drawn on) — a pre-condition, and not a reading of the box.
  if (troopFloor(input.base) === null) return null;
  const lifted = liftedCounts(input.request, input.base, input.modes);
  if (lifted === null) return null;
  return { counts: lifted.counts, how: lifted.how, space: lifted.space, scored: lifted.scored };
}

/**
 * **Every raise position, priced at once** (S-147), on one stop of a plan. Five questions where a press of
 * the control used to be one, each answered by the kernel (`liftedCounts`) — and still a job rather than a
 * render, because the widest box is a million vectors even there.
 *
 * The stop's march is `planMarch`, the engine's own reading of those counts — the very result the pane draws
 * for that stop — so the block prices the march a player would be looking at rather than one built twice.
 */
export function runPositions(input: PositionsInput): PositionTrades {
  return positionTrades(input.request, planMarch(input.request, input.counts).result, OFFERED_POSITIONS);
}

/**
 * **The position the advisor reads every march at** (owner, 2026-10-07: the advisor's baseline is *Tight, as
 * shown*) — the one the March opens on (`DEFAULT_RAISE`), priced by the positions step's own `positionTrades`.
 * Alone, because `OFFERED_POSITIONS` also prices `tightOld`, the comparison segment no reading here looks at,
 * and a Tight row is the same priced alone or beside it (the kernel's memo shares battles, not answers).
 */
const SHOWN = ['tight'] as const;

/**
 * **A stop's counts, as the March shows them**: raised by Tight where the march has troops to shelter a hired
 * stack by — the March offers no raise otherwise (`troopFloor`, the condition `runGenerate` primes the opening
 * stop on) — and battled through the March's own replay (`applyCounts`, which `positionTrades` reads its rows
 * with), so every figure is the one the pane would print. `request` is the March's: `withMethod(…, 'elite')`.
 */
function shownMarch(
  request: StackRequest,
  counts: Record<string, number>,
  reading: ProbeReading = 'tight',
): ShownMarch {
  const base = planMarch(request, counts).result;
  const raised =
    reading === 'as-is' || troopFloor(base) === null
      ? countsOf(base)
      : (positionTrades(request, base, SHOWN).rows[0]?.counts ?? countsOf(base));
  const { result, summary } = applyCounts(request, base, raised);
  return {
    counts: raised,
    bill: billOf(result, summary),
    deaths: result.stacks.map((stack) => stack.unitId),
  };
}

/** What the owner's rating reads off a battled march: the worst opening and the five costs the recap prints. */
function billOf(result: StackResult, summary: BattleSummary): ShownBill {
  return {
    damage: summary.minDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    hired: hiredLost(result.stacks),
    dragonCoins: summary.recovery.dragonCoins,
    seconds: summary.recovery.seconds,
  };
}

/** A march's identity within one job: its fielded counts, sorted by id (`planCampaign`'s own `countsKey`). */
export function countsKey(counts: Record<string, number>): string {
  return Object.keys(counts)
    .filter((id) => (counts[id] ?? 0) > 0)
    .sort()
    .map((id) => `${id}:${String(counts[id])}`)
    .join(',');
}

/**
 * **One job of the progression advisor** (W17 C3, `docs/plans/progression-advisor.md` §4), in one round trip:
 * the campaign planned in full — with no `budgetMs` in `input.plan`, so its answer is the same on every device
 * (W17 A0) — and every stop of its bar read as the March shows it (`shownMarch`). Given the baseline's bar, the
 * job also reads its probe against it, stop by stop (`readProbe`): the re-planned stop is the stop of the same
 * kind on this bar, the re-priced one the baseline stop's counts under this request. The baseline is the same
 * job with nothing to read against.
 *
 * **A march is read once a job**: a re-priced stop whose counts the re-plan lands on again is the same march
 * under the same request, and one Tight pricing costs seconds on a wide box (12.7 s a stop on the
 * 20 000-dominance camp, 2026-10-08).
 *
 * **In two calls when the baseline is not known yet** (W18 P1.2): the probe plans and shows its bar with nothing
 * to read against, and a second call, given that bar as `shown`, only reads it against the baseline — on a memo
 * seeded with the bar's marches, so it prices exactly what the one-call job would.
 */
export function runProbe(input: ProbeInput, context: JobContext): ProbeAnswer {
  // A job cancelled while it waited or while it planned is not read: the worker answers `cancelled` whatever
  // comes back, and a plan stopped before its first candidate has nothing to read (it throws).
  if (context.cancelled()) return { stops: [], row: null };
  const plan =
    input.shown === undefined ? planCampaign({ ...input.plan, shouldStop: context.cancelled }) : null;
  if (context.cancelled()) return { stops: [], row: null };
  const request = withMethod(input.plan.request, 'elite');
  const reading = input.reading ?? 'tight';
  // A bar shown by this probe's first call carries its marches over: the memo is the one that call ended with.
  const read = new Map<string, ShownMarch>(
    input.reread === true ? [] : input.shown?.map((stop) => [countsKey(stop.counts), stop.march]),
  );
  const showOnce = (counts: Record<string, number>): ShownMarch => {
    const key = countsKey(counts);
    const known = read.get(key);
    if (known !== undefined) return known;
    const march = shownMarch(request, counts, reading);
    read.set(key, march);
    return march;
  };
  // Counted in a profiling build only (`census.ts`); a production build folds this to `showOnce`.
  const show = CENSUS ? countShows(request, countsKey, (key) => read.has(key), showOnce) : showOnce;
  const stops =
    (input.reread === true
      ? input.shown?.map((stop) => ({ ...stop, march: show(stop.counts) }))
      : input.shown) ??
    (plan?.alternatives ?? []).map((row) => ({
      pick: row.pick,
      counts: row.counts,
      march: show(row.counts),
    }));
  const { against } = input;
  if (against === undefined) return { stops, row: null };
  const row = readProbe(against.probe, against.baseline, stops, (stop) => show(stop.counts), against.rates);
  return { stops, row };
}

/**
 * **A lineup's bill, priced two ways** (W17 C5a): its own sizing (`sizeStacks`), or counts given battled under its
 * totals (`planMarch`) — both on the kernel, both without the Tight raise, which is the confirm step's. A lineup's
 * request is built once and shared by every reading of it, since the kernel keys its tables on the request — and
 * only the lineup being priced is kept: the screen reads one lineup at a time, and a request held is a wasm instance
 * held, so a cache by totals kept every lineup's alive until the browser had no wasm memory left.
 */
export function lineupPricer(request: StackRequest, method: CaptainScreenInput['method'] = 'elite'): Pricer {
  const base = withMethod(request, method);
  let last: StackRequest | null = null;
  const requestFor = (totals: BonusTotals): StackRequest => {
    if (last?.totals !== totals) last = { ...base, totals };
    return last;
  };
  return (totals, counts) => {
    const priced = requestFor(totals);
    if (counts === null) {
      const result = sizeStacks(priced);
      return billOf(result, simulateBattle(result, priced));
    }
    const { result, summary } = planMarch(priced, counts);
    return billOf(result, summary);
  };
}

/**
 * **The captain screen** (W17 C5a): every lineup's two ratings against the current lineup's, as ONE job — a bill
 * costs 0.05–0.14 ms on the kernel, so chunking the 1 140 lineups of a 20-captain account buys nothing. Cancellable
 * between lineups; a cancelled job answers nothing the worker would send.
 */
export function runCaptainScreen(input: CaptainScreenInput, context: JobContext): CaptainScreenAnswer {
  return {
    screens: screenLineups(
      input.lineups,
      input.currentKey,
      input.stops,
      lineupPricer(input.request, input.method),
      input.rates,
      { shouldStop: context.cancelled },
    ),
  };
}
