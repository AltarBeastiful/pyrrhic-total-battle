/**
 * 334 — **what a searched Tight box is made of** (330's corpus, searched calls): per slot its pool, range,
 * cost and where the shipped answer sits in it (floor / interior / ceiling); per box the housing spare of each
 * pool against what the box's ceilings would take, so whether the housing binds at all.
 *
 * `THEORY=1 KX=<wasm> [SRC=live] OUTF=<file> pnpm vitest run tools/theorycraft/334-tight-box-census.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { compileKernel } from '../../src/kernel';

import { Bound, loadCorpus, SCRATCH } from './331-tight-replay';

const kx = compileKernel(readFileSync(process.env.KX ?? `${SCRATCH}/kx1.wasm`));

describe.skipIf(!process.env.THEORY)('334 — Tight box census', () => {
  it('counts', () => {
    const out: string[] = [];
    const corpus = loadCorpus();
    const base = readFileSync(`${SCRATCH}/332-base.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { i: number; src: string; how: number });
    const srcs = (process.env.SRC ?? 'live').split(',');
    const t = { boxes: 0, slots: 0, pool1: 0, pool2: 0, range: {} as Record<string, number>, at: { floor: 0, interior: 0, ceiling: 0 }, bind1: 0, bind2: 0, overshoot1: 0, overshoot2: 0 };
    const examples: string[] = [];
    for (const r of base.filter((x) => x.how === 2 && srcs.includes(x.src))) {
      const call = corpus.calls[r.i]!;
      const b = new Bound(kx, corpus.requests[call.req]!, call.input.base);
      b.run(call.input, 0);
      const found = Array.from({ length: b.raw.xN!() }, (_, s) => b.raw.xFound!(s));
      b.run(call.input, 99);
      const x = b.raw;
      const n = x.xN!();
      t.boxes += 1;
      const need = [0, 0, 0];
      const rows: string[] = [];
      for (let s = 0; s < n; s += 1) {
        const from = x.xFrom!(s), to = x.xTo!(s), pool = x.xPool!(s), cost = x.xCost!(s);
        t.slots += 1;
        if (pool === 1) t.pool1 += 1; else t.pool2 += 1;
        const w = to - from + 1;
        const bucket = w <= 2 ? '2' : w <= 5 ? '3-5' : w <= 10 ? '6-10' : w <= 30 ? '11-30' : '>30';
        t.range[bucket] = (t.range[bucket] ?? 0) + 1;
        const f = found[s]!;
        if (f === from) t.at.floor += 1; else if (f === to) t.at.ceiling += 1; else t.at.interior += 1;
        need[pool]! += (to - from) * cost;
        rows.push(`${b.ids[x.xSlotT!(s)]}:p${pool} c${cost} ${from}..${to} → ${f}`);
      }
      const sp1 = x.xSpare!(1), sp2 = x.xSpare!(2);
      if (need[1]! > sp1) t.bind1 += 1;
      if (need[2]! > sp2) t.bind2 += 1;
      if (examples.length < 12) examples.push(`${call.src} ${call.label} | spare1 ${sp1} need1 ${need[1]} | spare2 ${sp2} need2 ${need[2]} | ${rows.join(' · ')}`);
    }
    out.push(JSON.stringify(t));
    out.push(...examples);
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 3_600_000);
});
