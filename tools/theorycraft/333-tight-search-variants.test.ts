/**
 * 333 — **search variants for Tight's wide boxes, A/B against the shipped multistart** on 330's corpus.
 *
 * Only searched boxes are replayed (walked boxes are answered by the walk in every arm and cost ~2 % of the
 * Tight wall, 330). Each arm is `algo:P1:P2` on the scratch kernel (see the variants at the end of the scratch
 * `kernel/assembly/index.ts`, patch `docs/research/patches/333-tight-search-variants.patch`); `0:0:0` is the
 * shipped search. With `REF=1` the shipped search is re-run in the same process, alternating order, else
 * 332's figures are read. Per arm: Σ wall, Σ scored, Σ battles, calls worse / better / identical counts, Σ and
 * worst rating delta, by source.
 *
 * `THEORY=1 KX=<wasm> ARMS=10:0:0,11:16:0 [SRC=live,shape] [EVERY=1] [REF=1] OUTF=<file> pnpm vitest run tools/theorycraft/333-tight-search-variants.test.ts`
 */
/// <reference types="node" />
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { compileKernel } from '../../src/kernel';
import { loadKernelModule } from '../../tests/kernel/load';

import { Bound, loadCorpus, sameCounts, SCRATCH } from './331-tight-replay';

const kx = compileKernel(readFileSync(process.env.KX ?? `${SCRATCH}/kx1.wasm`));
/** `REFKX=repo`: the shipped reference runs on the repo's own release kernel instead of the scratch build at algo 0. */
const refMod = process.env.REFKX === 'repo' ? loadKernelModule() : kx;

interface Base { i: number; src: string; how: number; space: number; best: number; msKx: number; scored: number; battles: number }
interface Agg { n: number; ms: number; msRef: number; scored: number; scoredRef: number; battles: number; battlesRef: number; worse: number; better: number; same: number; dSum: number; dWorst: number; worseSum: number }
const agg = (): Agg => ({ n: 0, ms: 0, msRef: 0, scored: 0, scoredRef: 0, battles: 0, battlesRef: 0, worse: 0, better: 0, same: 0, dSum: 0, dWorst: 0, worseSum: 0 });

describe.skipIf(!process.env.THEORY)('333 — Tight search variants', () => {
  it('A/B', () => {
    const out: string[] = [];
    const flush = () => writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
    const corpus = loadCorpus();
    const base = readFileSync(`${SCRATCH}/332-base.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Base);
    const srcs = (process.env.SRC ?? 'live,stop,shape,bench').split(',');
    const every = Number(process.env.EVERY ?? 1);
    const ref = process.env.REF === '1';
    const arms = (process.env.ARMS ?? '10:0:0').split(',').map((a) => a.split(':').map(Number) as [number, number, number, number?, number?]);
    const jsonl = process.env.JSONL ?? `${SCRATCH}/333.jsonl`;
    writeFileSync(jsonl, '');
    const picked = base.filter((r) => r.how === 2 && srcs.includes(r.src)).filter((_, k) => k % every === 0);
    const tot = new Map<string, Map<string, Agg>>();
    for (const [k, r] of picked.entries()) {
      const call = corpus.calls[r.i]!;
      const request = corpus.requests[call.req]!;
      let refBest = r.best, refMs = r.msKx, refScored = r.scored, refBattles = r.battles;
      let refCounts: Float64Array | null = null;
      const runRef = () => {
        const a = new Bound(refMod, request, call.input.base).run(call.input, 0);
        refBest = Number.isNaN(a.best) ? r.best : a.best; refMs = a.ms; refScored = a.scored; refBattles = Number.isNaN(a.battles) ? r.battles : a.battles; refCounts = a.counts;
      };
      if (ref && k % 2 === 0) runRef();
      // algo -1: the oracle — walk the whole box (walkCap 1e12), only where space <= P1 (else the shipped answer).
      const answers = arms.map(([algo, p1, p2, st, rm]) =>
        algo === -1
          ? r.space <= p1
            ? new Bound(kx, request, call.input.base).run(call.input, 0, 0, 0, { walkCap: 1e12, restarts: 64, maxSweeps: 24, seed: 20_260_929 })
            : new Bound(kx, request, call.input.base).run(call.input, 0)
          : (() => {
              const b = new Bound(kx, request, call.input.base);
              (b.raw as unknown as { xSetStructured?: (n: number) => void }).xSetStructured?.(st ?? 0);
              (b.raw as unknown as { xSetRateMemo?: (n: number) => void }).xSetRateMemo?.(rm ?? 0);
              return b.run(call.input, algo, p1, p2);
            })());
      if (ref && k % 2 === 1) runRef();
      arms.forEach((arm, ai) => {
        const a = answers[ai]!;
        const name = arm.join(':');
        const bySrc = tot.get(name) ?? new Map<string, Agg>();
        tot.set(name, bySrc);
        for (const key of [r.src, 'ALL']) {
          const g = bySrc.get(key) ?? agg();
          bySrc.set(key, g);
          const d = a.best - refBest;
          g.n += 1; g.ms += a.ms; g.msRef += refMs; g.scored += a.scored; g.scoredRef += refScored; g.battles += a.battles; g.battlesRef += refBattles;
          if (d < -1e-9) { g.worse += 1; g.worseSum += d; }
          else if (d > 1e-9) g.better += 1;
          if (ref && refCounts !== null && sameCounts(a.counts, refCounts)) g.same += 1;
          g.dSum += d; g.dWorst = Math.min(g.dWorst, d);
        }
        appendFileSync(jsonl, JSON.stringify({ i: r.i, src: r.src, label: call.label, arm: name, space: r.space, ms: a.ms, refMs, scored: a.scored, refScored, best: a.best, refBest, attempts: a.attempts, lastImprove: a.lastImprove }) + '\n');
      });
      if (k % 25 === 0 || k === picked.length - 1) {
        out.length = 0;
        out.push(`${k + 1}/${picked.length} searched calls (src ${srcs.join(',')}, every ${every}, ref ${ref ? 'inline' : '332'})`);
        out.push('| arm | src | n | ms | ref ms | × | scored | ref scored | battles | ref battles | worse | better | same counts | Σ Δrating | worst Δ | Σ worse Δ |');
        out.push('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
        for (const [name, bySrc] of tot)
          for (const [src, g] of [...bySrc].sort())
            out.push(`| ${name} | ${src} | ${g.n} | ${g.ms.toFixed(0)} | ${g.msRef.toFixed(0)} | ${(g.msRef / Math.max(1e-9, g.ms)).toFixed(2)} | ${g.scored.toExponential(3)} | ${g.scoredRef.toExponential(3)} | ${g.battles.toExponential(3)} | ${g.battlesRef.toExponential(3)} | ${g.worse} | ${g.better} | ${ref ? g.same : '—'} | ${g.dSum.toFixed(3)} | ${g.dWorst.toFixed(3)} | ${g.worseSum.toFixed(3)} |`);
        flush();
      }
    }
    flush();
  }, 14_400_000);
});
