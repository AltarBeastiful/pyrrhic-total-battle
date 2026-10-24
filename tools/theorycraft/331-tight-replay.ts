/**
 * 331 — **the Tight replay harness** (shared by 332+): loads 330's corpus and binds any kernel build to one
 * captured `position()` input the way `src/kernel/raise.ts` does (same table, same tie-break column, same
 * `EXACT_DEFAULTS`), with the scratch kernel's experiment hooks (`xSetAlgo`, `xStat`, `x*` box access) when
 * the build has them.
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { CAMPAIGN } from '../../src/config';
import type { RaiseInput } from '../../src/engine/fast';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { packRequest } from '../../src/kernel/pack';
import { EXACT_DEFAULTS } from '../../src/kernel/raise';

export const SCRATCH = '/tmp/claude-1000/-home-remi-projects-pyrrhic-totalbattle/ddd23d57-5930-4d86-868e-64846315b06c/scratchpad/tx';

export interface Call {
  src: string;
  label: string;
  req: number;
  input: Omit<RaiseInput, 'request'>;
  ms: number;
  how: string | null;
  space: number;
  scored: number;
  counts: Record<string, number> | null;
}
export interface Corpus {
  requests: StackRequest[];
  calls: Call[];
}

export function loadCorpus(path = process.env.CORPUS ?? `${SCRATCH}/corpus.json`): Corpus {
  return JSON.parse(readFileSync(path, 'utf8'), (_k, v) => (v === null ? v : v)) as Corpus;
}

export interface X {
  memory: WebAssembly.Memory;
  alloc(bytes: number): number;
  setTable(ptr: number): void;
  raise(a: number, d: number, base: number, caps: number, out: number, stats: number, walkCap: number, restarts: number, sweeps: number, seed: number, burnCap: number): number;
  xSetAlgo?(a: number, p1: number, p2: number): void;
  xStat?(i: number): number;
  xN?(): number;
  xSlotT?(s: number): number;
  xFrom?(s: number): number;
  xTo?(s: number): number;
  xCost?(s: number): number;
  xPool?(s: number): number;
  xGet?(s: number): number;
  xSet?(s: number, n: number): void;
  xScore?(): number;
  xSpare?(pool: number): number;
  xResync?(): void;
  xFound?(s: number): number;
}

export interface Answer {
  counts: Float64Array;
  how: number;
  space: number;
  scored: number;
  ms: number;
  battles: number;
  best: number;
  attempts: number;
  lastImprove: number;
}

/** One kernel instance bound to one captured call (a fresh instance: no memo carried in from elsewhere). */
export class Bound {
  raw: X;
  ids: readonly string[];
  types: number;
  basePtr: number;
  capsPtr: number;
  outPtr: number;
  statsPtr: number;
  constructor(module: WebAssembly.Module, readonly request: StackRequest, readonly base: StackResult) {
    const order = new Map(base.stacks.map((stack, index) => [stack.unitId, index]));
    const packed = packRequest(request, CAMPAIGN.markerRates, undefined, Int32Array.from(request.units, (u) => order.get(u.id) ?? -1));
    this.raw = new WebAssembly.Instance(module, {}).exports as unknown as X;
    this.ids = packed.ids;
    this.types = packed.ids.length;
    const tablePtr = this.raw.alloc(packed.table.byteLength);
    new Float64Array(this.raw.memory.buffer, tablePtr, packed.table.length).set(packed.table);
    this.raw.setTable(tablePtr);
    const n = Math.max(1, this.types);
    this.basePtr = this.raw.alloc(8 * n);
    this.capsPtr = this.raw.alloc(8 * n);
    this.outPtr = this.raw.alloc(8 * n);
    this.statsPtr = this.raw.alloc(32);
  }
  run(input: Omit<RaiseInput, 'request'>, algo = 0, p1 = 0, p2 = 0, search: { walkCap: number; restarts: number; maxSweeps: number; seed: number } = EXACT_DEFAULTS): Answer {
    const own = new Map(this.base.stacks.map((s) => [s.unitId, s.count]));
    let view = new Float64Array(this.raw.memory.buffer);
    for (let row = 0; row < this.types; row += 1) {
      const id = this.ids[row] as string;
      view[this.basePtr / 8 + row] = own.get(id) ?? 0;
      const cap = this.request.caps[id];
      view[this.capsPtr / 8 + row] = cap === undefined || cap === null ? Number.MAX_SAFE_INTEGER : cap;
    }
    this.raw.xSetAlgo?.(algo, p1, p2);
    const t = performance.now();
    this.raw.raise(input.modes.authority, input.modes.dominance, this.basePtr, this.capsPtr, this.outPtr, this.statsPtr, search.walkCap, search.restarts, search.maxSweeps, search.seed, input.burnCap ?? Number.POSITIVE_INFINITY);
    const ms = performance.now() - t;
    view = new Float64Array(this.raw.memory.buffer);
    const x = this.raw.xStat;
    return {
      counts: view.slice(this.outPtr / 8, this.outPtr / 8 + this.types),
      how: view[this.statsPtr / 8] as number,
      space: view[this.statsPtr / 8 + 1] as number,
      scored: view[this.statsPtr / 8 + 2] as number,
      ms,
      battles: x ? x(0) : Number.NaN,
      best: x ? x(1) : Number.NaN,
      attempts: x ? x(5) : Number.NaN,
      lastImprove: x ? x(4) : Number.NaN,
    };
  }
}

export const sameCounts = (a: Float64Array, b: Float64Array): boolean => a.length === b.length && a.every((v, i) => v === b[i]);
