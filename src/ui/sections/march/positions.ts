/**
 * **The five raise positions, priced at once** (S-147; owner, 2026-09-29: *"take all positions remaining and
 * implement them in assemblyscript. Goal is to offer them as precomputed with the trades they offer visible
 * to the user"*).
 *
 * The control in the battle summary asks one position at a time and only when it is pressed, because a
 * position is a promise about a march the player is choosing: `Most, in tens`, `Most`, `Best v2`, `Safe` and
 * `Tight` are five different answers to *"how high should the hired stacks stand"*, and until this module
 * existed the only way to learn what one of them was worth was to press it and read the pane.
 *
 * So this is the same five answers, priced **side by side on the march on screen**: for each of them the
 * counts (`liftedCounts` — the kernel's climb and the kernel's search over it) and the three
 * figures a player decides by — the damage the march would hit for, the mercenaries it would burn for good,
 * and the units it would field. `tools/theorycraft/180-the-positions.test.ts` measures the same ten readings
 * on every stop of every benchmark army; these are the three the block under the plan draws.
 *
 * **The base is the plan's own march and the comparison is the raise's own reading of it** — not the
 * `repeat.damage` the trade above prints. The two are the same number wherever no two stacks tie in total HP,
 * and where they differ it is the app's two replays disagreeing (`docs/plans/best-v2.md` §5): a position is
 * what the *March* would draw, so it is measured through the same replay the March draws a hand-edited count
 * with (`applyCounts`), and the baseline beside it is measured the same way.
 *
 * Nothing here computes a battle the March would not: every reading is `applyCounts` on the counts a press of
 * the control would stand the stacks at.
 *
 * **And a press takes the row rather than the calculation** (S-149; owner, 2026-09-30: *"make the positions
 * selector (as is, tight…) use the already computed assemblyscript values (should be same as engine/TS)"*).
 * `pricedRaise` is that rule — the row of the stop and the position on screen, under the conditions that make
 * it this march's answer — and `positionsSearch.ts` is where the control reads it. The kernel answers the
 * counts the March's retired TypeScript did, which `tests/golden/raise.json` holds on every stop of every
 * benchmark army (`tests/kernel/golden-capture.test.ts`, experiment 184).
 */
import {
  RAISE_MOST,
  RAISE_OFF,
  RAISE_SAFE,
  RAISE_TENS,
  RAISE_TIGHT,
  RAISE_V2,
  raiseKernel,
} from '@/engine/fast';
import type { StackRequest, StackResult } from '@/engine/types';
import { KernelUnavailableError } from '@/kernel/boot';

import { applyCounts } from './manual';
import { hiredLost } from './hired';
import { countsOf, raisedCounts, sameCounts } from './raise';
import type { RaiseMode, RaiseModes } from './raise';
import { worstDamageByPool } from './worst';

/**
 * **The five segments of the control, in its own order, as the kernel numbers them** (`RAISE_*`,
 * `src/engine/fast.ts`; the names and the help are the control's own, `MarchPills.tsx`).
 */
const CODES: readonly { mode: Exclude<RaiseMode, 'off'>; code: number }[] = [
  { mode: 'tens', code: RAISE_TENS },
  { mode: 'most', code: RAISE_MOST },
  { mode: 'v2', code: RAISE_V2 },
  { mode: 'safe', code: RAISE_SAFE },
  { mode: 'tight', code: RAISE_TIGHT },
];

/** The five positions this module prices, in the order the control carries them. */
export const POSITIONS: readonly Exclude<RaiseMode, 'off'>[] = CODES.map((entry) => entry.mode);

/** The kernel's number for a position (`RAISE_OFF` for the state that moves nothing). */
export function raiseCode(mode: RaiseMode): number {
  return CODES.find((entry) => entry.mode === mode)?.code ?? RAISE_OFF;
}

/** What a position's counts are, and how a search found them. */
export interface PositionCounts {
  /** A count for every type the answer fields, by unit id. */
  counts: Record<string, number>;
  /** `walked` · `searched` for an exhaustive position; `null` when no search ran. */
  how: 'walked' | 'searched' | null;
  /** The vectors in the box, `0` when no search ran. */
  space: number;
  /** How many vectors the search's own scorer was asked about — what the answer cost (`0` when none ran). */
  scored: number;
}

/**
 * **What a press of the control derives**, over both hired pools at once: the climb (or the units answer) and,
 * for an exhaustive position, the search's own counts merged over it — `useMarch`'s own expression
 * (`{...raised, ...exhaustiveCounts}`), which is what makes the counts here the counts a press would land on.
 *
 * **The kernel answers it, and only the kernel** (`raiseKernel()`, S-147; W16 E3 S5b) — a box of a million
 * vectors is hundreds of milliseconds there, which is the whole reason this block can afford to price five
 * positions at once. The kernel is loaded before the app renders and before the worker takes a job
 * (`src/kernel/boot.ts`), so a host without one is a broken host and this says so rather than answering on
 * a path that no longer exists. A request the kernel cannot pack — never once on the benchmark or on
 * experiment 184's corpus (`docs/plans/refactor-speed.md`, the E3 S1 census) — is answered with the climb
 * alone: a march the game would take, with no search over it.
 */
export function liftedCounts(
  request: StackRequest,
  base: StackResult,
  modes: RaiseModes,
): PositionCounts | null {
  const kernel = raiseKernel();
  if (kernel === null) throw new KernelUnavailableError('The raise kernel is not loaded.');
  const fast = kernel.position({
    request,
    base,
    modes: { authority: raiseCode(modes.authority), dominance: raiseCode(modes.dominance) },
  });
  if (fast !== null) return { counts: fast.counts, how: fast.how, space: fast.space, scored: fast.scored };
  const raised = raisedCounts(request, base, modes);
  return raised === null ? null : { counts: raised, how: null, space: 0, scored: 0 };
}

/**
 * **What one march is read on** — the figures experiment 180 prices every position by, kept whole so the
 * block and the benchmark mean the same thing by "the trade" (the shape `TradeoffFigures` has in the run
 * store). The table under the plan draws three of them: the damage, the mercenaries burnt and the units
 * fielded. The other two are what the same reading prints there, and what the parity check in
 * `tools/theorycraft/184-the-positions-on-the-kernel.test.ts` holds the two paths together on.
 */
export interface PositionReading {
  /** The march's worst opening under this position's counts — the figure the plan itself is ranked on. */
  damage: number;
  /** The mercenaries the march burns for good (`hiredLost`, the plan trade's own "Merc"). */
  mercLost: number;
  /** Every hired unit the march fields, mercenaries and monsters together. */
  units: number;
  /** The silver the march's losses cost to bring back. */
  silver: number;
  /** The Temple's gold for the same losses — what a monster costs to revive and a mercenary to retrain. */
  gold: number;
  /** What the hired stacks themselves struck for in that opening (the trade's own "Per merc" numerator). */
  hiredDamage: number;
}

/** One position, priced: what it is called, the counts it stands the stacks at, and what the march reads. */
export interface PositionTrade extends PositionReading {
  mode: Exclude<RaiseMode, 'off'>;
  counts: Record<string, number>;
  /** `walked` · `searched` for an exhaustive position; `null` when no search ran. */
  how: 'walked' | 'searched' | null;
  /** The vectors in the box, `0` when no search ran. */
  space: number;
  /** How many vectors the search scored, `0` when no search ran. */
  scored: number;
}

/** The five positions and the plan's own march, all read through the same replay (`applyCounts`). */
export interface PositionTrades {
  /** The march the bar is on, as the raise reads it: what every position is measured against. */
  own: PositionReading;
  rows: PositionTrade[];
}

/** Every figure a march is read on, off the counts it stands at. */
function read(request: StackRequest, base: StackResult, counts: Record<string, number>): PositionReading {
  const { result, summary } = applyCounts(request, base, counts);
  const live = result.stacks.filter((stack) => stack.count > 0);
  const hired = live.filter((stack) => stack.pool !== 'leadership');
  return {
    damage: summary.minDamage,
    mercLost: hiredLost(result.stacks),
    units: hired.reduce((sum, stack) => sum + stack.count, 0),
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    hiredDamage: worstDamageByPool(summary.journals.enemyFirst, result.stacks).authority,
  };
}

/**
 * **The five positions, priced on one march** — the whole of what the block under the plan draws, computed
 * once per march rather than once per press. Every pool of every position stands on the same segment (the
 * configuration the control puts both blocks into when a segment is pressed,
 * `runStore.setRaiseMode`), so a row is one answer a player can reach.
 */
export function positionTrades(request: StackRequest, base: StackResult): PositionTrades {
  const own = countsOf(base);
  const rows = CODES.map(({ mode }) => {
    const lifted = liftedCounts(request, base, { authority: mode, dominance: mode });
    // A position that moves nothing is the plan's own march: the row is drawn with its figures unchanged
    // rather than left out, because "this one changes nothing here" is an answer a player is owed.
    const counts = lifted?.counts ?? own;
    return {
      mode,
      counts,
      how: lifted?.how ?? null,
      space: lifted?.space ?? 0,
      scored: lifted?.scored ?? 0,
      ...read(request, base, counts),
    };
  });
  return { own: read(request, base, own), rows };
}

/**
 * **The counts a position stands the march on, as the plan's own table already priced them** — or `null` when
 * the table does not describe the march on screen (S-149).
 *
 * This is the rule by which the control in the battle summary reads a row instead of computing it again: the
 * press lands on a value already in hand, and every condition under which it may is spelled out here rather
 * than at the call site.
 *
 *  - **The march on screen is the plan's own stop, count for count** (`sameCounts`). A row is priced on
 *    `planMarch(request, stop.counts)` — the very result the pane draws for that stop — so its counts are the
 *    counts a press would land on. A March edit re-files a re-sized march under **the same request and stamp**
 *    (`generate.ts`, *"the same run, re-sized"*), and the row is then a raise of a march that is not on screen,
 *    over a shelter the edit may have moved.
 *  - **The tables are this army's** — the other half of that guard, and it is the key rather than a second
 *    comparison: a table is filed under the plan *and* the request it was priced with (`positionsKey`,
 *    `positionsSearch.ts`).
 *  - **One segment over both hired blocks.** That is the configuration every row is priced in, and the one the
 *    control now is (`runStore.setRaiseMode`); a mixed control is a question no row answers.
 *  - **A position at all.** `As is` moves no count, so the table does not price it: there is no row to read,
 *    and the March's own path — which is nothing at all — answers it.
 */
export function pricedRaise(
  result: StackResult,
  counts: Record<string, number>,
  trades: PositionTrades | null,
  modes: RaiseModes,
): Record<string, number> | null {
  if (trades === null || modes.authority !== modes.dominance) return null;
  if (!sameCounts(result, counts)) return null;
  return trades.rows.find((row) => row.mode === modes.authority)?.counts ?? null;
}
