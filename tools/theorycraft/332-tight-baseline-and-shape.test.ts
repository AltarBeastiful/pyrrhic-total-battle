/**
 * 332 — **the shipped Tight on 330's corpus, and the shape of its objective** (measure, do not assume).
 *
 * Part A (`PART=base`): every captured call replayed on the repo kernel and on the scratch kernel at algo 0
 * (the shipped search, with counters): identical counts to the capture (the corpus is faithful) and to each
 * other (the hooks change nothing); per call wall, scored, battles, attempts, the attempt that last improved.
 * Written as JSONL to `${SCRATCH}/332-base.jsonl`.
 *
 * Part B (`PART=shape`): through the scratch kernel's hooks (algo 99: the box is set up, nothing searched), on
 * every searched box and a sample of walked ones: each slot's 1-D line through the shipped optimum and through
 * `LINES` seeded random points — is the rating along it non-decreasing, unimodal (one peak, plateaus allowed),
 * or multi-peaked; is the optimum maximal (no slot can rise by one and stay feasible, i.e. on the housing
 * boundary or at its ceiling); and whether the line's best is its feasible top.
 *
 * `THEORY=1 KX=<scratch wasm> PART=base|shape OUTF=<file> pnpm vitest run tools/theorycraft/332-tight-baseline-and-shape.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { compileKernel } from '../../src/kernel';
import { loadKernelModule } from '../../tests/kernel/load';

import { Bound, loadCorpus, sameCounts, SCRATCH } from './331-tight-replay';

const repo = loadKernelModule();
const kx = compileKernel(readFileSync(process.env.KX ?? `${SCRATCH}/kx0.wasm`));

describe.skipIf(!process.env.THEORY)('332 — shipped Tight baseline and objective shape', () => {
  it('measures', () => {
    const out: string[] = [];
    const flush = () => writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
    const corpus = loadCorpus();
    const part = process.env.PART ?? 'base';
    if (part === 'base') {
      const jsonl = `${SCRATCH}/332-base.jsonl`;
      writeFileSync(jsonl, '');
      let faithful = 0, unfaithful = 0, hookSame = 0, hookDiff = 0;
      corpus.calls.forEach((call, i) => {
        const request = corpus.requests[call.req]!;
        const a = new Bound(repo, request, call.input.base);
        const b = new Bound(kx, request, call.input.base);
        const ra = a.run(call.input);
        const rb = b.run(call.input, 0);
        const cap = call.counts === null ? null : Float64Array.from(a.ids, (id) => call.counts![id] ?? 0);
        // The capture's counts are the merge (`out`); a null capture is an unanswerable call.
        if (cap === null || sameCounts(cap, ra.counts)) faithful += 1;
        else unfaithful += 1;
        if (sameCounts(ra.counts, rb.counts) && ra.scored === rb.scored) hookSame += 1;
        else hookDiff += 1;
        appendFileSync(jsonl, JSON.stringify({ i, src: call.src, label: call.label, how: ra.how, space: ra.space, scored: ra.scored, msRepo: ra.ms, msKx: rb.ms, battles: rb.battles, best: rb.best, attempts: rb.attempts, lastImprove: rb.lastImprove, n: b.raw.xStat!(6) }) + '\n');
      });
      out.push(`calls ${corpus.calls.length}: faithful ${faithful}, unfaithful ${unfaithful}; hooks identical ${hookSame}, differ ${hookDiff}`);
      flush();
      return;
    }
    // ---- Part B: the objective's shape --------------------------------------------------------------------
    const base = readFileSync(`${SCRATCH}/332-base.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { i: number; how: number; space: number; src: string });
    const LINES = Number(process.env.LINES ?? 4);
    let state = 12345;
    const rnd = () => ((state = (state * 1664525 + 1013904223) % 4294967296), state / 4294967296);
    const tally = { lines: 0, flat: 0, nondec: 0, unimodal: 0, multi: 0, bestAtTop: 0, optLines: 0, optNondec: 0, optUni: 0, optMulti: 0, optAtTop: 0, boxes: 0, maximal: 0, notMaximal: 0, multiDrop: 0 };
    const seen = new Set<string>();
    const walkedSample = base.filter((r) => r.how === 1);
    const pick = [...base.filter((r) => r.how === 2), ...walkedSample.filter((_, k) => k % 5 === 0)];
    for (const r of pick) {
      const call = corpus.calls[r.i]!;
      const sig = JSON.stringify([call.req, call.input.base.stacks.map((s) => [s.unitId, s.count])]);
      if (seen.has(sig)) continue;
      seen.add(sig);
      const request = corpus.requests[call.req]!;
      const b = new Bound(kx, request, call.input.base);
      const shipped = b.run(call.input, 0);
      const opt = Array.from({ length: b.raw.xN!() }, (_, s) => b.raw.xFound!(s));
      b.run(call.input, 99);
      const x = b.raw;
      const n = x.xN!();
      if (n === 0) continue;
      tally.boxes += 1;
      const from = Array.from({ length: n }, (_, s) => x.xFrom!(s));
      const to = Array.from({ length: n }, (_, s) => x.xTo!(s));
      const setAll = (v: number[]) => { v.forEach((c, s) => x.xSet!(s, c)); };
      // Maximal? one more unit of any slot below its ceiling is infeasible.
      setAll(opt);
      const optScore = x.xScore!();
      let maximal = true;
      for (let s = 0; s < n; s += 1) {
        if (opt[s]! >= to[s]!) continue;
        x.xSet!(s, opt[s]! + 1);
        if (x.xScore!() > -Infinity) maximal = false;
        x.xSet!(s, opt[s]!);
      }
      if (maximal) tally.maximal += 1; else tally.notMaximal += 1;
      void optScore;
      const points: { p: number[]; opt: boolean }[] = [{ p: opt, opt: true }];
      for (let l = 0; l < LINES; l += 1) points.push({ p: from.map((f, s) => f + Math.floor(rnd() * (to[s]! - f + 1))), opt: false });
      for (const { p, opt: isOpt } of points) {
        for (let s = 0; s < n; s += 1) {
          setAll(p);
          const span = to[s]! - from[s]!;
          const stride = Math.max(1, Math.ceil(span / 400));
          const ys: number[] = [];
          for (let c = from[s]!; c <= to[s]!; c += stride) {
            x.xSet!(s, c);
            const y = x.xScore!();
            if (y > -Infinity) ys.push(y);
          }
          if (ys.length < 2) continue;
          // Classify: count strict direction changes up→down→up.
          let peaks = 0, goingDown = false, flat = true, nondec = true;
          let maxDrop = 0;
          for (let k = 1; k < ys.length; k += 1) {
            const d = ys[k]! - ys[k - 1]!;
            if (d !== 0) flat = false;
            if (d < 0) { nondec = false; goingDown = true; maxDrop = Math.max(maxDrop, -d); }
            if (d > 0 && goingDown) { peaks += 1; goingDown = false; }
          }
          const bestAtTop = Math.max(...ys) === ys[ys.length - 1];
          tally.lines += 1;
          if (flat) tally.flat += 1;
          else if (nondec) tally.nondec += 1;
          else if (peaks === 0) tally.unimodal += 1;
          else { tally.multi += 1; tally.multiDrop = Math.max(tally.multiDrop, maxDrop); }
          if (bestAtTop) tally.bestAtTop += 1;
          if (isOpt) {
            tally.optLines += 1;
            if (nondec) tally.optNondec += 1;
            else if (peaks === 0) tally.optUni += 1;
            else tally.optMulti += 1;
            if (bestAtTop) tally.optAtTop += 1;
          }
        }
      }
      void shipped;
    }
    out.push(JSON.stringify(tally));
    flush();
  }, 7_200_000);
});
