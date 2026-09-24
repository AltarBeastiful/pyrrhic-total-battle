/**
 * **The engine's one door to a faster arithmetic** (AssemblyScript roadmap, step 2).
 *
 * The engine does not depend on the kernel: it asks `planKernel()` and, when nothing is set (the default —
 * vitest in jsdom, SSR, a Node script, a browser where the wasm did not load), it runs its own TypeScript,
 * which stays the reference. A host that has the kernel compiled (`src/worker/calc.worker.ts`) calls
 * `setKernel(createPlanKernel(module))` once (`src/kernel/plan.ts`).
 *
 * Every method answers **exactly** what the TypeScript it stands in for answers (`Object.is` on every figure;
 * `tests/kernel/plan-kernel.test.ts` and `tests/kernel/plan-equivalence.test.ts` hold it), or `null` when it
 * cannot — then the caller runs its TypeScript. Only figures cross: anything the UI draws (`Stack[]`,
 * journals) is still built by the engine.
 */
import type { Effective } from './plan';
import type { Bill } from './rating';
import type { UnitDef } from '../data/types';
import type { Housing, RecoveryCost, RecoverySettings, StackRequest, StackingOptions } from './types';

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
   * the request cannot be packed. The request is packed once and known by identity after.
   */
  marchBill(request: StackRequest, counts: Record<string, number>): Bill | null;
  /**
   * `sizePool`'s whole arithmetic after its early return: writes every slot's `count` and answers the
   * housing used, or `null` to let the engine do it.
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
   * order of `request.units`); a custom kill order, or a request the kernel cannot pack, answers `null`.
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

let current: PlanKernel | null = null;

/** Set (or, with `null`, clear) the kernel the engine's hot path may use. */
export function setKernel(kernel: PlanKernel | null): void {
  current = kernel;
}

/** The kernel set by the host, or `null`: the engine then runs its TypeScript. */
export function planKernel(): PlanKernel | null {
  return current;
}
