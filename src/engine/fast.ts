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
import type { RecoveryCost, RecoverySettings, StackRequest, StackingOptions } from './types';

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
