/**
 * 336 — **can a branch and bound prune Tight's box?** The cheapest valid upper bound on a vector's damage that
 * knows the kill order exactly is Σ damage × (⌊p/E⌋ + 1) (a stack at kill index p strikes ⌊p/E⌋ or ⌊p/E⌋ + 1
 * times). Its slack **at a leaf** — one fully known vector, the shipped answer — is a floor on the slack of any
 * bound over a sub-box. Compared with what the whole search is worth (the shipped answer's rating, the as-is
 * march rating 0) and with the spread of ratings in the box (random vectors), it says whether a node could ever
 * be cut against the incumbent.
 *
 * `THEORY=1 KX=<kx3 wasm> [SRC=live] OUTF=<file> pnpm vitest run tools/theorycraft/336-tight-bound-slack.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { compileKernel } from '../../src/kernel';

import { Bound, loadCorpus, SCRATCH } from './331-tight-replay';

const kx = compileKernel(readFileSync(process.env.KX ?? `${SCRATCH}/kx3.wasm`));
const q = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))] ?? NaN;

describe.skipIf(!process.env.THEORY)('336 — bound slack', () => {
  it('measures', () => {
    const corpus = loadCorpus();
    const base = readFileSync(`${SCRATCH}/332-base.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { i: number; src: string; how: number });
    const srcs = (process.env.SRC ?? 'live').split(',');
    const gaps: number[] = [], bests: number[] = [], spreads: number[] = [], squads: number[] = [];
    let state = 99;
    const rnd = () => ((state = (state * 1664525 + 1013904223) % 4294967296), state / 4294967296);
    let cuttable = 0, boxes = 0;
    for (const r of base.filter((x) => x.how === 2 && srcs.includes(x.src))) {
      const call = corpus.calls[r.i]!;
      const b = new Bound(kx, corpus.requests[call.req]!, call.input.base);
      const shipped = b.run(call.input, 0);
      const found = Array.from({ length: b.raw.xN!() }, (_, s) => b.raw.xFound!(s));
      b.run(call.input, 99);
      const x = b.raw as unknown as { xSet(s: number, n: number): void; xGapAt(): number; xScore(): number; xN(): number; xFrom(s: number): number; xTo(s: number): number; xEnemySquads(): number };
      const n = x.xN();
      found.forEach((c, s) => x.xSet(s, c));
      const gap = x.xGapAt();
      gaps.push(gap);
      bests.push(shipped.best);
      squads.push(x.xEnemySquads());
      // Spread: ratings of 200 random vectors of the box, and how many sit within `gap` of the best (could not be cut
      // even by a bound exact up to its leaf slack).
      const ys: number[] = [];
      for (let k = 0; k < 200; k += 1) {
        for (let s = 0; s < n; s += 1) x.xSet(s, x.xFrom(s) + Math.floor(rnd() * (x.xTo(s) - x.xFrom(s) + 1)));
        ys.push(x.xScore());
      }
      spreads.push(shipped.best - q(ys, 0.5));
      boxes += 1;
      cuttable += ys.filter((y) => y + gap < shipped.best).length / ys.length;
    }
    const out = [
      `boxes ${boxes}, enemy squads ${JSON.stringify([...new Set(squads)])}`,
      `leaf slack of the strike bound (rating units): p10 ${q(gaps, 0.1).toFixed(2)} median ${q(gaps, 0.5).toFixed(2)} p90 ${q(gaps, 0.9).toFixed(2)}`,
      `shipped answer's rating over as-is: p10 ${q(bests, 0.1).toFixed(2)} median ${q(bests, 0.5).toFixed(2)} p90 ${q(bests, 0.9).toFixed(2)}`,
      `best minus the median random vector: p10 ${q(spreads, 0.1).toFixed(2)} median ${q(spreads, 0.5).toFixed(2)} p90 ${q(spreads, 0.9).toFixed(2)}`,
      `share of random leaves a bound with this slack could cut (best leaf-level case): ${((cuttable / boxes) * 100).toFixed(1)} %`,
    ];
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 3_600_000);
});
