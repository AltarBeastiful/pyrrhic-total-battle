/**
 * **The engine's one door to its arithmetic**: the AssemblyScript kernel (`src/kernel/`), the only engine
 * since W16 E3 (owner, 2026-10-01: "retire the ts version").
 *
 * The kernel is **mandatory**. `src/kernel/boot.ts` compiles it and calls `setKernel`/`setRaiseKernel` before
 * the app renders and before the worker answers a job; a platform without WebAssembly gets `WasmRequired`,
 * never a TypeScript fallback. The engine reads it through `requiredPlanKernel()`, which throws a
 * `KernelUnavailableError` when nothing is set — a boot failure or a test that cleared it, not a case the
 * engine answers by itself.
 *
 * Every method answers **exactly** what the TypeScript it replaced answered (`Object.is` on every figure;
 * `tests/kernel/plan-kernel.test.ts`, `tests/golden/`). Some may still **decline** (`null`, or
 * `LADDER_ENGINE`) on a call they were not built for — an entry not bound to the kernel's table, a march with
 * no stacks, units out of the request's order, a bill under another recovery, a rung order still being
 * learned — and the caller then runs a TypeScript path named `…Declined` for it (`./plan.ts`). The census
 * (`docs/plans/refactor-speed.md` §4, E3 S1) found none of them taken over the benchmark. Only figures cross:
 * anything the UI draws (`Stack[]`, journals, warnings) is still built by the TypeScript engine (`battle.ts`,
 * `marchOfTs`, `recoveryCosts`, `sizeStacks`).
 */
import type { Effective } from './plan';
import type { Bill } from './rating';
import type { UnitDef } from '../data/types';
import type {
  Housing,
  RecoveryCost,
  RecoverySettings,
  StackRequest,
  StackResult,
  StackingOptions,
} from './types';

/** `marchOf`'s figures (`src/engine/plan.ts`), without its `Stack[]`. */
export interface MarchFigures {
  damage: number;
  hiredDamage: number;
  silver: number;
  gold: number;
  mercLost: number;
  strikes: number;
}

/** What `sizePool` (`src/engine/stacker.ts`) reads and writes of a slot. */
export interface PoolSlot {
  hp: number;
  cost: number;
  cap: number;
  count: number;
}

/** `LadderKernel.shape`'s answers. */
export const LADDER_NONE = 0;
export const LADDER_SHAPE = 1;
export const LADDER_ENGINE = 2;

/**
 * **The scorer's ladders on the kernel** (step 4): one scorer's troops and hired types (`makeScorer`), bound to
 * one packed request. The caller writes the hired vector and what sustains it (`vector`, `held`, the hired
 * types' order), then asks; the answers are read off `rungs`, `sheltered` and `out` before the next call.
 */
export interface LadderKernel {
  /** In: the hired vector, each count already `max(0, floor(counts[id] ?? 0))`, `mercTypes` order. */
  readonly vector: Float64Array;
  /** In: what sustains each hired type (`sustain[id] ?? 0`); read only where the vector is above 0. */
  readonly held: Float64Array;
  /** Out: each rung's count, in the order's order. */
  rungs: Float64Array;
  /** Out: the hired vector sheltered under the lowest rung (`shelterUnder`), `mercTypes` order. */
  sheltered: Float64Array;
  /**
   * Out: `marchOf`'s damage, hired damage, silver, gold, mercLost, strikes, then (after `shape`) the rounded
   * silver of `recoveryCosts(...).plan` under `recovery` over the fielded stacks, rungs first.
   */
  out: Float64Array;
  /** The recovery settings the bill in `out[6]` is priced under (the bound request's own). */
  readonly recovery: RecoverySettings;
  /**
   * One ladder shape of the scorer at `depth` (an integer of 1 or more) and `scale`: `order` the depth's
   * learned rung order, or `undefined` for the ranking's (`troops.slice(-depth)`). `LADDER_NONE` where the
   * scorer answers `null`; `LADDER_ENGINE` where it would learn a rung order (or the order cannot be read);
   * `LADDER_SHAPE` with the answers written.
   */
  shape(
    marches: number,
    depth: number,
    scale: number,
    order: readonly Effective[] | undefined,
    gap: number,
    leadership: number,
    housing: Housing | undefined,
    budgetPerMarch: number | undefined,
  ): number;
  /**
   * The final march's ladder grid (`finaleFor`): the leftovers are `vector`'s counts above 0; `orders[j]` is
   * the learned order of the `j`-th depth the kernel was made with, or `undefined`. Answers the index
   * `j × growths + g` of the best march (answers written), −1 when none, `null` when the engine must run it.
   */
  finale(
    orders: readonly (readonly Effective[] | undefined)[],
    gap: number,
    leadership: number,
    housing: Housing | undefined,
    budget: number,
  ): number | null;
  /**
   * Every ladder shape of the vector in `vector`/`held` at once: `shape` at each depth the kernel was made
   * with (`orders` as for `finale`) × each growth, shape `j × growths + g`. −1 when an order cannot be read
   * (the caller then asks shape by shape); else the grid's serial, and the answers are read with `gridView()`
   * for as long as its `serial` is that one (a later grid over the same instance overwrites them).
   */
  grid(
    marches: number,
    orders: readonly (readonly Effective[] | undefined)[],
    gap: number,
    leadership: number,
    housing: Housing | undefined,
    budgetPerMarch: number | undefined,
  ): number;
  /**
   * The last `grid`'s answers, through views fresh at the call: `status[s]`, and from `s × stride` the rungs
   * and the sheltered vector, from `s × 8` the six figures and the bill's silver.
   */
  gridView(): {
    status: Int32Array;
    rungs: Float64Array;
    sheltered: Float64Array;
    out: Float64Array;
    stride: number;
    serial: number;
  };
}

export interface PlanKernel {
  /** `effectiveTable(request)` built `table`: pack the request once, and know its entries by identity. */
  bindTable(request: StackRequest, table: readonly Effective[]): void;
  /**
   * `marchOf(stacks, enemyStacks)`'s figures under `recovery` (the engine's `SEARCH_RECOVERY`), or `null` when
   * an entry was not built by a bound `effectiveTable` (or the stacks come from two of them).
   */
  march(
    stacks: readonly { entry: Effective; count: number }[],
    enemyStacks: number,
    recovery: RecoverySettings,
  ): MarchFigures | null;
  /**
   * `recoveryCosts(stacks, units, recovery).plan` over `stacks` in that order (the rounded bill), or `null`
   * unless every entry is bound to one request and `recovery` is that request's own.
   */
  bill(
    stacks: readonly { entry: Effective; count: number }[],
    recovery: RecoverySettings,
  ): RecoveryCost | null;
  /**
   * `marchBill(request, counts)` (`./retype.ts`) — the step-1 battle and bill of `marchResult` — or `null` when
   * the request cannot be packed. The request is packed once and known by identity after; the caller has no
   * TypeScript of its own to fall back to any more (W16 E3 S5a) and throws instead.
   */
  marchBill(request: StackRequest, counts: Record<string, number>): Bill | null;
  /**
   * `sizePool`'s whole arithmetic after its early return: writes every slot's `count` and answers the
   * housing used. `null` only where the kernel itself cannot (step 5's own guards); the caller has no
   * TypeScript of its own to fall back to any more (W16 E3 S5a) and throws instead.
   */
  sizePool(
    slots: readonly PoolSlot[],
    capacity: number,
    ceiling: number | undefined,
    spread: number,
  ): number | null;
  /**
   * **What `sizeStacks` fields, and nothing it writes for a reader** (step 3): the unit and the count of every
   * stack of `sizeStacks({ ...request, units, caps, options }).stacks`, in that order, or `null` to let the
   * engine size it. `units` must be `request.units` filtered in order (the kernel ranks them by the Elite
   * order of `request.units`, or by `buildKillOrder(units, options)` under a custom kill order); a request the
   * kernel cannot pack answers `null`.
   * The pools, the drop reasons and the warnings are the engine's alone: a caller that reads them sizes with
   * `sizeStacks`.
   */
  sizeStacks(
    request: StackRequest,
    units: readonly UnitDef[],
    caps: Record<string, number>,
    options: StackingOptions,
  ): { unitId: string; count: number }[] | null;
  /**
   * The scorer's ladders (step 4) over `troops` (the ranking, weakest first) and `mercTypes`, marched against
   * `enemyStacks` under `recovery` (the engine's `SEARCH_RECOVERY`), with `powers[k]` the engine's
   * `rungPower(k)` and the finale's `depths` × `growths`; `null` unless every entry is bound to one request.
   */
  ladders(
    troops: readonly Effective[],
    mercTypes: readonly Effective[],
    enemyStacks: number,
    recovery: RecoverySettings,
    powers: readonly number[],
    depths: readonly number[],
    growths: readonly number[],
  ): LadderKernel | null;
}

/** The five raise positions, as the kernel numbers them (`RAISE_*` in `kernel/assembly/index.ts`). */
export const RAISE_OFF = 0;
export const RAISE_TENS = 1;
export const RAISE_MOST = 2;
export const RAISE_V2 = 3;
export const RAISE_SAFE = 4;
export const RAISE_TIGHT = 5;
/** `Tight (old)`: Tight ranked on damage alone, as it shipped before experiment 188 (owner, 2026-10-07). */
export const RAISE_TIGHT_DAMAGE = 6;

/** What one raise position stands the hired stacks at, over both pools at once (S-147). */
export interface RaiseAnswer {
  /**
   * A count for every type the answer fields, by unit id (0 for one it does not): the plan's own counts with
   * the raise applied — `{...raisedCounts, ...the search}`, the merge the March itself draws.
   */
  counts: Record<string, number>;
  /** How an exhaustive position found its answer; `null` when no search ran. */
  how: 'walked' | 'searched' | null;
  /** The vectors in the box, `0` when no search ran. */
  space: number;
  /** How many vectors the search's scorer was asked about, `0` when no search ran. */
  scored: number;
}

/** What a raise position is asked over: the march on screen, in full (`ExactRaiseInput`'s own two fields). */
export interface RaiseInput {
  request: StackRequest;
  base: StackResult;
  /** The position each hired pool stands on, as `RAISE_*` (`raise.ts`'s `RaiseModes`, as numbers). */
  modes: { authority: number; dominance: number };
}

/**
 * **The raise's own door to a faster arithmetic** (S-147), the way `PlanKernel` is the plan's.
 *
 * The raise is the one search in the app whose box is measured in hundreds of thousands of vectors, so it is
 * the one that cannot be priced on the main thread: the kernel answers it in a worker, and this is the whole
 * of what the March has to know about that. **There is no other path** since W16 E3 S5b retired the March's
 * TypeScript search: a host that has no kernel (`raiseKernel()` answers `null`) is refused by `liftedCounts`
 * (`src/ui/sections/march/positions.ts`) rather than answered, and the kernel is loaded before the app and
 * the worker run (`src/kernel/boot.ts`).
 */
export interface RaiseKernel {
  /**
   * The counts one position stands every hired stack at, over both pools at once, or `null` when the kernel
   * cannot answer (a request it cannot pack) and the caller answers with the climb alone.
   */
  position(input: RaiseInput): RaiseAnswer | null;
}

/**
 * The kernel is not loaded: no WebAssembly on this platform, the module could not be had, or nothing set it.
 * Lives here, beside the doors, so the engine can throw it without importing `src/kernel/boot.ts` (which
 * loads `src/kernel/plan.ts`, which loads the engine back); `boot.ts` re-exports it.
 */
export class KernelUnavailableError extends Error {
  constructor(message = 'WebAssembly is not available here.', options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'KernelUnavailableError';
  }
}

let current: PlanKernel | null = null;
let currentRaise: RaiseKernel | null = null;

/** Set (or, with `null`, clear) the kernel the engine's hot path may use. */
export function setKernel(kernel: PlanKernel | null): void {
  current = kernel;
}

/** The kernel set by the host, or `null` when none is (a boot that failed, or a test that cleared it). */
export function planKernel(): PlanKernel | null {
  return current;
}

/** The kernel the engine runs on; a `KernelUnavailableError` when none is set — there is no other engine. */
export function requiredPlanKernel(): PlanKernel {
  if (current === null) throw new KernelUnavailableError('The calculation kernel is not loaded.');
  return current;
}

/** Set (or, with `null`, clear) the kernel the raise positions are answered by. */
export function setRaiseKernel(kernel: RaiseKernel | null): void {
  currentRaise = kernel;
}

/** The raise kernel set by the host, or `null` — a host the raise refuses (`liftedCounts`). */
export function raiseKernel(): RaiseKernel | null {
  return currentRaise;
}
