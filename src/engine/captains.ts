/**
 * **Which three captains to march with** (W17 C5a, `docs/plans/progression-advisor.md` §4): every trio the
 * account can field, and the screen that ranks them before any is planned in full.
 *
 * Pure engine, like `advisor.ts`: it reads no table and no profile. The caller (the derive layer on the main
 * thread, `src/state/captainTrios.ts`) enumerates the trios with `allowedTrios` and builds each one's totals;
 * the worker prices them through the `Pricer` it is handed (`runCaptainScreen`, `src/worker/jobs.ts`), so this
 * module never imports the march pane's `hiredLost` or the kernel.
 *
 * Two screens, both cheap enough to be one job (a bill is 0.05–0.14 ms on the kernel):
 *
 *  - **sized** — the trio's own march sized from scratch (`sizeStacks`), against the current trio's;
 *  - **repriced** — each stop of the current trio's plan, its counts kept and battled again under the trio's
 *    totals, against the same counts under the current trio's. Not a floor: a trio that favours another army
 *    would have the plan resize it (the confirm step plans the best ones in full).
 *
 * Both rate with the owner's `rate()`, so a trio that is better on damage but dearer to field still reads at its
 * worth. The current trio is always in the set and rates 0 against itself, so nothing can read as a loss.
 */
import type { Bill, MarkerRates } from './rating';
import { rate } from './rating';
import type { BonusTotals } from './types';

/** Captains a march fields at most. */
export const TRIO_SIZE = 3;

/** The part of a stored captain entry the enumeration reads. */
export interface RosterCaptain {
  captainId: string;
  level: number;
  star: number;
}

/** A set of captains as an identity: ids sorted, so `a,b,c` and `c,a,b` are one trio. */
export function trioKey(captainIds: readonly string[]): string {
  return [...captainIds].sort().join(',');
}

/**
 * The owned captains with one entry per `captainId` — the strongest (level, then star), the first on a tie — in
 * the order each captain first appears. The same captain can be entered twice (`derive.ts` id factory); a trio
 * never fields one twice.
 */
export function distinctCaptains<T extends RosterCaptain>(owned: readonly T[]): T[] {
  const best = new Map<string, T>();
  for (const entry of owned) {
    const held = best.get(entry.captainId);
    if (
      held === undefined ||
      entry.level > held.level ||
      (entry.level === held.level && entry.star > held.star)
    )
      best.set(entry.captainId, entry);
  }
  return [...best.values()];
}

/**
 * **Every allowed trio** of the owned captains: those `allowed` admits (the march type's conditions, applied by
 * the caller), distinct by `captainId`, in index order. With fewer than three, the one set of them all (more
 * captains never cost a bonus, which only adds); with none, no trio.
 */
export function allowedTrios<T extends RosterCaptain>(
  owned: readonly T[],
  allowed: (captainId: string) => boolean,
  size: number = TRIO_SIZE,
): T[][] {
  const pool = distinctCaptains(owned).filter((entry) => allowed(entry.captainId));
  if (pool.length === 0) return [];
  if (pool.length <= size) return [pool];
  const out: T[][] = [];
  const pick: T[] = [];
  const walk = (from: number): void => {
    if (pick.length === size) {
      out.push([...pick]);
      return;
    }
    for (let at = from; at <= pool.length - (size - pick.length); at += 1) {
      pick.push(pool[at]!);
      walk(at + 1);
      pick.pop();
    }
  };
  walk(0);
  return out;
}

// ---- The screen -------------------------------------------------------------------------------------
/** One trio as the screen takes it: its identity and the totals the main thread built for it. */
export interface ScreenTrio {
  key: string;
  totals: BonusTotals;
}

/** A stop of the current trio's plan, as the screen re-prices it. */
export interface ScreenStop {
  /** Which answer of the bar it is (`PlanPick`), carried through so a caller can name it. */
  pick: string;
  counts: Record<string, number>;
}

/**
 * What a trio's bill is: its own sizing when `counts` is `null`, the counts given battled under its totals
 * otherwise. The worker's implementation is `trioPricer` in `src/worker/jobs.ts`.
 */
export type Pricer = (totals: BonusTotals, counts: Record<string, number> | null) => Bill;

/** One trio, screened: the rating of each reading against the current trio's (`rate()`), 0 for the current trio. */
export interface TrioScreen {
  key: string;
  /** The trio's own sizing against the current trio's. */
  sized: number;
  /** Each stop's counts re-priced, in `stops` order. */
  repriced: number[];
}

export interface ScreenOptions {
  /** Polled between trios; when true the screen stops and returns what it has priced so far. */
  shouldStop?: () => boolean;
}

/**
 * **Screen every trio** against the current one. The current trio is priced once per reading and all others
 * against it; the result is in the order `trios` came in, and `trios` must contain `currentKey`.
 */
export function screenTrios(
  trios: readonly ScreenTrio[],
  currentKey: string,
  stops: readonly ScreenStop[],
  price: Pricer,
  rates: MarkerRates,
  options: ScreenOptions = {},
): TrioScreen[] {
  const current = trios.find((trio) => trio.key === currentKey);
  if (current === undefined)
    throw new Error(`The current trio (${currentKey}) is not among the trios screened.`);
  const sizedNow = price(current.totals, null);
  const stopsNow = stops.map((stop) => price(current.totals, stop.counts));
  const out: TrioScreen[] = [];
  for (const trio of trios) {
    if (options.shouldStop?.() === true) break;
    if (trio.key === currentKey) {
      out.push({ key: trio.key, sized: 0, repriced: stops.map(() => 0) });
      continue;
    }
    out.push({
      key: trio.key,
      sized: rate(sizedNow, price(trio.totals, null), rates),
      repriced: stops.map((stop, index) => rate(stopsNow[index]!, price(trio.totals, stop.counts), rates)),
    });
  }
  return out;
}

/** Which reading orders the trios. */
export type ScreenKind = 'sized' | 'repriced';

/**
 * A trio's score in one screen: its sized rating, or the best of its re-priced stops — a trio that is the best
 * one for any stop of the bar is worth planning in full (0 with no stops).
 */
export function screenScore(screen: TrioScreen, kind: ScreenKind): number {
  if (kind === 'sized') return screen.sized;
  return screen.repriced.length === 0 ? 0 : Math.max(...screen.repriced);
}

/**
 * The trios ordered best first on one screen; ties keep the order they were screened in, so the same input gives
 * the same list whatever ran it.
 */
export function rankTrios(screens: readonly TrioScreen[], kind: ScreenKind): TrioScreen[] {
  return screens
    .map((screen, index) => ({ screen, index, score: screenScore(screen, kind) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.screen);
}

// ---- The shortlist ----------------------------------------------------------------------------------
/** Which ranking the shortlist is taken from: one screen, or both of them taken in turn. */
export type ShortlistFrom = ScreenKind | 'both';

/**
 * **The trios worth planning in full**: the first `count` of the screen's ranking, never the current trio (it is
 * planned anyway, as the baseline). With `both`, the two rankings are taken in turn, the sized one first, a trio
 * both rank high counted once, so a trio only one screen likes still gets its plan. The current trio is the one
 * whose key is `currentKey`; ties keep the screened order, so the list is the same whatever ran the screen.
 */
export function shortlistTrios(
  screens: readonly TrioScreen[],
  currentKey: string,
  count: number,
  from: ShortlistFrom = 'both',
): string[] {
  const lists = (from === 'both' ? (['sized', 'repriced'] as const) : ([from] as const)).map((kind) =>
    rankTrios(screens, kind)
      .map((screen) => screen.key)
      .filter((key) => key !== currentKey),
  );
  const out: string[] = [];
  for (let at = 0; out.length < count && lists.some((list) => at < list.length); at += 1)
    for (const list of lists) {
      const key = list[at];
      if (key !== undefined && out.length < count && !out.includes(key)) out.push(key);
    }
  return out;
}
