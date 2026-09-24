/**
 * **The battle kernel's loader** (AssemblyScript roadmap, step 1): instantiates `kernel/build/kernel.wasm`
 * (built by `pnpm kernel:build` from `kernel/assembly/`) over one packed request and exposes it typed.
 *
 * Platform-neutral on purpose — it takes the compiled `WebAssembly.Module`, so vitest in node reads the bytes
 * off disk (`tests/kernel/load.ts`) and a browser worker can `compileStreaming` a fetched URL. The app does not
 * call it yet. The TypeScript engine is the reference; `tests/kernel/parity.test.ts` holds every output of
 * the kernel `===` to it.
 */
import type { MarkerRates } from '../engine/rating';
import type { StackRequest } from '../engine/types';

import { ALL_COSTS, HEADER_SIZE, R, RECORD_SIZE, T, TYPE_STRIDE, H } from './layout';
import { countsVector, packRequest } from './pack';

export { ALL_COSTS, H, HEADER_SIZE, R, RECORD_SIZE, T, TYPE_STRIDE } from './layout';
export { countsVector, packRequest } from './pack';
export type { PackedRequest } from './pack';

interface KernelExports {
  memory: WebAssembly.Memory;
  alloc(bytes: number): number;
  setTable(ptr: number): void;
  battle(countsPtr: number, outPtr: number): void;
  battleMany(n: number, countsPtr: number, outPtr: number): void;
  rate(beforePtr: number, afterPtr: number, mask: number): number;
  rateMany(n: number, basePtr: number, recordsPtr: number, outPtr: number): void;
  enumerate(
    nSlots: number,
    slotsPtr: number,
    nCand: number,
    candPtr: number,
    requiredPtr: number,
    fixedPtr: number,
    capsPtr: number,
    pools: number,
    basePtr: number,
    maxBattles: number,
    outPtr: number,
    assignPtr: number,
  ): void;
}

/** `enumerate`'s output slots, as `kernel/assembly/index.ts` writes them. */
export const ENUMERATION = {
  battles: 0,
  complete: 1,
  bestRating: 2,
  bestGuarded: 3,
  bestDamage: 4,
  admissible: 5,
  positive: 6,
  size: 8,
} as const;

/** Pools `enumerate` holds within housing: bit 0 leadership, 1 authority, 2 dominance. */
export const POOL_BITS = { leadership: 1, authority: 2, dominance: 4 } as const;

/**
 * **Every injective assignment of candidate types to slots** (experiment 175): the space `retypeMarch` walks
 * when it is at most `EXHAUSTIVE`, walked whole whatever its size, inside the kernel.
 */
export interface EnumerationSpec {
  /** Each slot's total HP; a type on a slot is sized `ceil(slotHp / hp)`, as `retypeMarch` sizes it. */
  slots: readonly number[];
  /** Candidate types, as row indices (`Kernel.ids`). */
  candidates: readonly number[];
  /** Candidates that must be placed (default none). */
  required?: readonly boolean[];
  /** Counts the assignment is laid on top of (row order); the candidates must be 0 here. */
  fixed: ArrayLike<number>;
  /** Most units of each type (row order); default none. */
  caps?: ArrayLike<number>;
  /** `POOL_BITS` held within housing. */
  pools: number;
  /** The record every assignment is rated against (`rate(base, assignment)`, every cost). */
  base: ArrayLike<number>;
  /** Stop after this many battles (default unbounded). */
  maxBattles?: number;
}

export interface Enumeration {
  battles: number;
  /** Every assignment was walked (`maxBattles` not reached). */
  complete: boolean;
  /** Assignments holding the base's damage, and those of them rating above 1e-9. */
  admissible: number;
  positive: number;
  /** Best rating with the damage held; candidate index per slot (−1 when none). */
  best: { rating: number; assignment: number[] };
  /** The same, silver not rising either. */
  guarded: { rating: number; assignment: number[] };
  /** Most worst-opening damage, any cost. */
  damage: { damage: number; assignment: number[] };
}

/** One kernel instance bound to one request. Reuse it: a battle allocates nothing. */
export interface Kernel {
  readonly ids: readonly string[];
  readonly types: number;
  /** One battle; the record's slots are named by `R`. */
  battle(counts: Record<string, number> | ArrayLike<number>): Float64Array;
  /** `counts` holds `n × types` counts, row order; returns `n × RECORD_SIZE` record slots. */
  battleMany(counts: Float64Array): Float64Array;
  /** `rate(before, after, rates)` on two records (or bills in record order); `mask` = costs on both bills. */
  rate(before: ArrayLike<number>, after: ArrayLike<number>, mask?: number): number;
  /** Every assignment of `spec.candidates` to `spec.slots`, battled and rated in the kernel. */
  enumerate(spec: EnumerationSpec): Enumeration;
  /** The layout constants the wasm was built with, to check against `./layout.ts`. */
  layout(): Record<string, number>;
}

const isVector = (counts: Record<string, number> | ArrayLike<number>): counts is ArrayLike<number> =>
  ArrayBuffer.isView(counts) || Array.isArray(counts);

/** Compile the kernel's bytes once; instantiate it per request with `createKernel`. */
export function compileKernel(bytes: BufferSource): WebAssembly.Module {
  return new WebAssembly.Module(bytes);
}

export function createKernel(module: WebAssembly.Module, request: StackRequest, rates: MarkerRates): Kernel {
  const instance = new WebAssembly.Instance(module, {});
  const raw = instance.exports as unknown as KernelExports;
  const exports = instance.exports as unknown as Record<string, unknown>;
  const { table, ids } = packRequest(request, rates);
  const types = ids.length;

  const tablePtr = raw.alloc(table.byteLength);
  new Float64Array(raw.memory.buffer, tablePtr, table.length).set(table);
  raw.setTable(tablePtr);
  // Two single-battle slots and one rate pair, then a batch region grown on demand.
  const onePtr = raw.alloc(Math.max(1, types) * 8);
  const oneOut = raw.alloc(RECORD_SIZE * 8);
  const billA = raw.alloc(RECORD_SIZE * 8);
  const billB = raw.alloc(RECORD_SIZE * 8);
  let batch = 0;
  let batchCounts = 0;
  let batchOut = 0;
  let enumBytes = 0;
  let enumPtr = 0;

  const f64 = (ptr: number, length: number): Float64Array => new Float64Array(raw.memory.buffer, ptr, length);

  return {
    ids,
    types,
    battle(counts) {
      const vector = isVector(counts) ? counts : countsVector(ids, counts);
      const into = f64(onePtr, types);
      for (let i = 0; i < types; i += 1) into[i] = vector[i] ?? 0;
      raw.battle(onePtr, oneOut);
      return f64(oneOut, RECORD_SIZE).slice();
    },
    battleMany(counts) {
      const n = types > 0 ? Math.floor(counts.length / types) : 0;
      if (n > batch) {
        batch = n;
        batchCounts = raw.alloc(Math.max(1, n * types) * 8);
        batchOut = raw.alloc(n * RECORD_SIZE * 8);
      }
      f64(batchCounts, n * types).set(counts.subarray(0, n * types));
      raw.battleMany(n, batchCounts, batchOut);
      return f64(batchOut, n * RECORD_SIZE).slice();
    },
    rate(before, after, mask = ALL_COSTS) {
      const a = f64(billA, RECORD_SIZE);
      const b = f64(billB, RECORD_SIZE);
      for (let i = 0; i < 6; i += 1) {
        a[i] = before[i] ?? 0;
        b[i] = after[i] ?? 0;
      }
      return raw.rate(billA, billB, mask);
    },
    enumerate(spec) {
      const k = spec.slots.length;
      const m = spec.candidates.length;
      const bytes =
        8 * (k + types + types + RECORD_SIZE + ENUMERATION.size) + 4 * (m + 3 * Math.max(1, k)) + m + 16;
      if (bytes > enumBytes) {
        enumBytes = bytes;
        enumPtr = raw.alloc(bytes);
      }
      let at = enumPtr;
      const take = (size: number): number => {
        const ptr = at;
        at += size;
        return ptr;
      };
      const slotsPtr = take(8 * Math.max(1, k));
      const fixedPtr = take(8 * Math.max(1, types));
      const capsPtr = take(8 * Math.max(1, types));
      const basePtr = take(8 * RECORD_SIZE);
      const outPtr = take(8 * ENUMERATION.size);
      const candPtr = take(4 * Math.max(1, m));
      const assignPtr = take(4 * 3 * Math.max(1, k));
      const requiredPtr = take(Math.max(1, m));
      f64(slotsPtr, k).set(spec.slots);
      const fixed = f64(fixedPtr, types);
      const caps = f64(capsPtr, types);
      for (let t = 0; t < types; t += 1) {
        fixed[t] = spec.fixed[t] ?? 0;
        caps[t] = spec.caps?.[t] ?? Infinity;
      }
      const base = f64(basePtr, RECORD_SIZE);
      for (let i = 0; i < RECORD_SIZE; i += 1) base[i] = spec.base[i] ?? 0;
      new Int32Array(raw.memory.buffer, candPtr, m).set(spec.candidates);
      const required = new Uint8Array(raw.memory.buffer, requiredPtr, m);
      for (let c = 0; c < m; c += 1) required[c] = spec.required?.[c] === true ? 1 : 0;
      raw.enumerate(
        k,
        slotsPtr,
        m,
        candPtr,
        requiredPtr,
        fixedPtr,
        capsPtr,
        spec.pools,
        basePtr,
        spec.maxBattles ?? Infinity,
        outPtr,
        assignPtr,
      );
      const out = f64(outPtr, ENUMERATION.size).slice();
      const assign = new Int32Array(raw.memory.buffer, assignPtr, 3 * k).slice();
      const nth = (i: number): number[] => Array.from(assign.subarray(i * k, (i + 1) * k));
      return {
        battles: out[ENUMERATION.battles] as number,
        complete: out[ENUMERATION.complete] === 1,
        admissible: out[ENUMERATION.admissible] as number,
        positive: out[ENUMERATION.positive] as number,
        best: { rating: out[ENUMERATION.bestRating] as number, assignment: nth(0) },
        guarded: { rating: out[ENUMERATION.bestGuarded] as number, assignment: nth(1) },
        damage: { damage: out[ENUMERATION.bestDamage] as number, assignment: nth(2) },
      };
    },
    layout() {
      const out: Record<string, number> = {};
      for (const [name, value] of Object.entries(exports)) {
        if (value instanceof WebAssembly.Global) out[name] = value.value as number;
      }
      return out;
    },
  };
}

/** The TS layout, named the way the wasm exports it, for the parity test's layout check. */
export function expectedLayout(): Record<string, number> {
  const snake = (name: string): string => name.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase();
  const out: Record<string, number> = { HEADER_SIZE, TYPE_STRIDE, RECORD_SIZE };
  for (const [name, slot] of Object.entries(H)) out[`H_${snake(name)}`] = slot;
  for (const [name, slot] of Object.entries(T)) out[`T_${snake(name)}`] = slot;
  for (const [name, slot] of Object.entries(R)) out[`R_${snake(name)}`] = slot;
  return out;
}
