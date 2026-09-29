/**
 * **The raise positions on the kernel** (S-147): `raise.ts`'s `raisedCounts` and the March's `exactRaise`,
 * in the wasm, behind `RaiseKernel` (`src/engine/fast.ts`).
 *
 * The `RaiseKernel` the worker sets, one instance over one `WebAssembly.Module`:
 *
 *  - every request **and its base march** is packed once (`packRequest`, with the raise's own tie-break
 *    column — `T.order`, the type's place in `base.stacks`), into a wasm instance of its own, because one
 *    `raise` over the widest box walks nearly a million vectors and nothing may allocate inside it;
 *  - the counts come back as a vector over the table's rows, which this file turns into the record the March
 *    reads (`counts`, by unit id) plus how the search found it (`how`, `space`, `scored`).
 *
 * It answers exactly what the March's TypeScript answers, on every army and every position
 * (`tests/engine/raise-kernel.test.ts`, one test over both paths) — the tie-break included, which is the one
 * place the app's two replays disagree (`docs/plans/best-v2.md` §5).
 */
import { EXACT_DEFAULTS } from '../engine/exact';
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
}

const STATS = 4;

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

export function createRaiseKernel(module: WebAssembly.Module): RaiseKernel {
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

  return {
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
        EXACT_DEFAULTS.walkCap,
        EXACT_DEFAULTS.restarts,
        EXACT_DEFAULTS.maxSweeps,
        EXACT_DEFAULTS.seed,
      );
      if (answered !== 1) return null;
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
