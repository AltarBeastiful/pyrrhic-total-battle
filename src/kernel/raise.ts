/**
 * **The raise positions on the kernel** (S-147): `raise.ts`'s `raisedCounts` and the March's exhaustive
 * search, in the wasm, behind `RaiseKernel` (`src/engine/fast.ts`) — the only raise search the app runs since
 * W16 E3 S5b retired the TypeScript one.
 *
 * The `RaiseKernel` the worker sets, one instance over one `WebAssembly.Module`:
 *
 *  - every request **and its base march** is packed once (`packRequest`, with the raise's own tie-break
 *    column — `T.order`, the type's place in `base.stacks`), into a wasm instance of its own, because one
 *    `raise` over the widest box walks nearly a million vectors and nothing may allocate inside it — and
 *    because the instance keeps the march's **score memo** (W16 B): `Best v2`, `Safe` and `Tight` asked of
 *    the same march search the same box, and the second and third read the battles the first one fought;
 *  - the counts come back as a vector over the table's rows, which this file turns into the record the March
 *    reads (`counts`, by unit id) plus how the search found it (`how`, `space`, `scored`).
 *
 * It answers exactly what the March's TypeScript answered, on every army and every position — the tie-break
 * included, which is the one place the app's two replays disagree (`docs/plans/best-v2.md` §5) — held to that
 * TypeScript's testimony by `tests/golden/raise.json` and `tests/golden/raise-kernel.json`.
 */
import type { RaiseAnswer, RaiseInput, RaiseKernel } from '../engine/fast';
import type { StackRequest, StackResult } from '../engine/types';

import { packRequest } from './pack';

/** `raise`'s own signature (`kernel/assembly/index.ts`); the stats block is `[how, space, scored, answered]`. */
interface RaiseExports {
  memory: WebAssembly.Memory;
  alloc(bytes: number): number;
  setTable(ptr: number): void;
  raise(
    authMode: number,
    domMode: number,
    basePtr: number,
    capsPtr: number,
    outPtr: number,
    statsPtr: number,
    walkCap: number,
    restarts: number,
    maxSweeps: number,
    rngSeed: number,
  ): number;
  /** Test only (W16 E2a): the slots-only point against the whole-roster one, on random vectors of the box. */
  raiseProbe(samples: number, seed: number): number;
  raiseFastPath(): number;
  raiseForceWhole(on: number): void;
}

/**
 * **Test only** (`tests/kernel/raise-point.test.ts`): the kernel's own `RaiseKernel` and, over the instance a
 * march is bound to, the hooks that hold the slots-only point (W16 E2a) to the whole-roster one.
 */
export interface RaiseKernelProbe extends RaiseKernel {
  /** After a `position` of this march: how many of `samples` random box vectors scored differently (−1: no box). */
  probe(request: StackRequest, base: StackResult, samples: number, seed: number): number;
  /** Whether the last `position` of this march took the slots-only point. */
  fastPath(request: StackRequest, base: StackResult): boolean;
  /** Make every box of this march take the whole-roster point. */
  forceWhole(request: StackRequest, base: StackResult, on: boolean): void;
}

const STATS = 4;

/**
 * **The box search's defaults** (S-143b): a box of at most `walkCap` vectors is walked whole (the optimum);
 * a wider one is searched from `restarts` seeded starts, each sweep bounded by `maxSweeps`, the restart
 * generator seeded by `seed` — an unseeded search is not a result. Handed to the wasm rather than repeated
 * there; they lived in `src/engine/exact.ts` until the TypeScript search was retired (W16 E3 S5b), and the
 * research copy in `tools/theorycraft/exact-search.ts` reads them from here.
 */
export const EXACT_DEFAULTS = {
  walkCap: 300_000,
  restarts: 64,
  maxSweeps: 24,
  seed: 20_260_929,
} as const;

/** The box search's four numbers (`EXACT_DEFAULTS`' shape), for an experiment that raises them (W16 E5). */
export interface ExactSearch {
  readonly walkCap: number;
  readonly restarts: number;
  readonly maxSweeps: number;
  readonly seed: number;
}

/** `march`/`bill` never read the rates (only `rate` does); the header wants numbers all the same. */
const NO_RATES = { silver: 1, gold: 1, hired: 1, dragonCoins: 1, seconds: 1 };

/** `Number.MAX_SAFE_INTEGER`: the cap of a type the account may hire without limit (`?? MAX_SAFE_INTEGER`). */
const MAX_SAFE = Number.MAX_SAFE_INTEGER;

/** One request **and one base march** packed into a wasm instance of its own. */
interface Bound {
  request: StackRequest;
  base: StackResult;
  raw: RaiseExports;
  ids: readonly string[];
  types: number;
  basePtr: number;
  capsPtr: number;
  outPtr: number;
  statsPtr: number;
  buffer: ArrayBuffer | null;
  baseView: Float64Array;
  capsView: Float64Array;
  outView: Float64Array;
  statsView: Float64Array;
}

/** The views over one instance, rebuilt when the memory grew out from under them. */
function views(bound: Bound): void {
  const buffer = bound.raw.memory.buffer;
  if (bound.buffer === buffer) return;
  bound.buffer = buffer;
  bound.baseView = new Float64Array(buffer, bound.basePtr, bound.types);
  bound.capsView = new Float64Array(buffer, bound.capsPtr, bound.types);
  bound.outView = new Float64Array(buffer, bound.outPtr, bound.types);
  bound.statsView = new Float64Array(buffer, bound.statsPtr, STATS);
}

/** @param search The box search's limits; the app passes none and searches under `EXACT_DEFAULTS`. */
export function createRaiseKernel(
  module: WebAssembly.Module,
  search: ExactSearch = EXACT_DEFAULTS,
): RaiseKernel {
  const { position } = createRaiseKernelProbe(module, search);
  return { position };
}

export function createRaiseKernelProbe(
  module: WebAssembly.Module,
  search: ExactSearch = EXACT_DEFAULTS,
): RaiseKernelProbe {
  /**
   * One instance per base march. A `StackResult` is written once and never edited, so its identity *is* the
   * march (`raiseSearch.ts` files its answers the same way); a bound instance is kept while its request is
   * the one being asked about, and re-bound when a second request hands over the same result object.
   */
  const byBase = new WeakMap<StackResult, Bound>();

  const bind = (request: StackRequest, base: StackResult): Bound | null => {
    const held = byBase.get(base);
    if (held !== undefined && held.request === request) return held;
    let packed;
    try {
      packed = packRequest(
        request,
        NO_RATES,
        undefined,
        // The raise's tie-break: the type's place in the base march's own stack order.
        orderByRow(request, base),
      );
    } catch {
      return null;
    }
    const raw = new WebAssembly.Instance(module, {}).exports as unknown as RaiseExports;
    const types = packed.ids.length;
    const tablePtr = raw.alloc(packed.table.byteLength);
    new Float64Array(raw.memory.buffer, tablePtr, packed.table.length).set(packed.table);
    raw.setTable(tablePtr);
    const n = Math.max(1, types);
    const bound: Bound = {
      request,
      base,
      raw,
      ids: packed.ids,
      types,
      basePtr: raw.alloc(8 * n),
      capsPtr: raw.alloc(8 * n),
      outPtr: raw.alloc(8 * n),
      statsPtr: raw.alloc(8 * STATS),
      buffer: null,
      baseView: new Float64Array(0),
      capsView: new Float64Array(0),
      outView: new Float64Array(0),
      statsView: new Float64Array(0),
    };
    views(bound);
    byBase.set(base, bound);
    return bound;
  };

  /** The instance a march is bound to, for the test hooks: it must have been asked a position already. */
  const bound = (request: StackRequest, base: StackResult): RaiseExports => {
    const held = byBase.get(base);
    if (held === undefined || held.request !== request) throw new Error('no position asked of this march');
    return held.raw;
  };

  return {
    probe: (request, base, samples, seed) => bound(request, base).raiseProbe(samples, seed),
    fastPath: (request, base) => bound(request, base).raiseFastPath() === 1,
    forceWhole: (request, base, on) => {
      bound(request, base).raiseForceWhole(on ? 1 : 0);
    },
    position({ request, base, modes }: RaiseInput): RaiseAnswer | null {
      const bound = bind(request, base);
      if (bound === null) return null;
      views(bound);
      /** The plan's own counts, as the table's own rows: what the raise is measured against. */
      const own = new Map(base.stacks.map((stack) => [stack.unitId, stack.count]));
      for (let row = 0; row < bound.types; row += 1) {
        const id = bound.ids[row] as string;
        bound.baseView[row] = own.get(id) ?? 0;
        bound.capsView[row] = request.caps[id] ?? MAX_SAFE;
      }
      const answered = bound.raw.raise(
        modes.authority,
        modes.dominance,
        bound.basePtr,
        bound.capsPtr,
        bound.outPtr,
        bound.statsPtr,
        search.walkCap,
        search.restarts,
        search.maxSweeps,
        search.seed,
      );
      if (answered !== 1) return null;
      // **The memory may have grown under the views**: the first search over a wide box reserves its score
      // memo (W16 B), and a grown memory is a new buffer.
      views(bound);
      const how = bound.statsView[0] as number;
      const counts: Record<string, number> = {};
      for (let row = 0; row < bound.types; row += 1) {
        counts[bound.ids[row] as string] = bound.outView[row] as number;
      }
      return {
        counts,
        how: how === 1 ? 'walked' : how === 2 ? 'searched' : null,
        space: how === 0 ? 0 : (bound.statsView[1] as number),
        scored: how === 0 ? 0 : (bound.statsView[2] as number),
      };
    },
  };
}

/**
 * Each row's place in the base march's own stack order (`StackResult.stacks` is kill order, first to fall
 * first), which is the order `applyCounts` breaks a total-HP tie by. `-1` for a type the base does not field.
 */
function orderByRow(request: StackRequest, base: StackResult): Int32Array {
  const order = new Map(base.stacks.map((stack, index) => [stack.unitId, index]));
  return Int32Array.from(request.units, (unit) => order.get(unit.id) ?? -1);
}
