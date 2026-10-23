/**
 * 295 — **archetypes on the benchmark armies** (task step 3). For every `criteriaScenarios()` army and its merc saver /
 * silver saver / sweet spot: the frontier-based best (re-typed frontier shapes at the stop's burn, top K by the 0-restart
 * Tight proxy among the admissible, full Tight) and the archetype best (`archetypes2()`, same reading), both rated against
 * the shipped stop's Tight march and held to the same gates (`admissible`: burn not above, 95 % damage, queue not rising,
 * a silver saver no more silver). One JSON line per stop to `OUTF`.
 *
 * `THEORY=1 OUTF=<jsonl> [FROM=0] [TO=99] [TOPK=6] pnpm vitest run tools/theorycraft/295-archetypes-benchmark.test.ts`
 */
/// <reference types="node" />
import { appendFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { CAMPAIGN, STOPS, admissible, archetypes2, frontierCands, fullKernel, planCampaign, proxyKernel, rate, tight, useFull } from './290-common';
import type { Cand } from './290-common';
import type { Bill } from '../../src/engine/rating';

const TOPK = Number(process.env.TOPK ?? 6);

describe.skipIf(!process.env.THEORY)('295 — archetypes, benchmark', () => {
  it('reads every stop', () => {
    useFull();
    writeFileSync(process.env.OUTF!, '');
    const from = Number(process.env.FROM ?? 0), to = Number(process.env.TO ?? 999);
    for (const [i, sc] of criteriaScenarios().entries()) {
      if (i < from || i > to) continue;
      let plan;
      try {
        plan = planCampaign({ request: sc.request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack, withFrontier: true });
      } catch (e) {
        appendFileSync(process.env.OUTF!, JSON.stringify({ label: sc.label, skipped: String(e) }) + '\n');
        continue;
      }
      const input = { request: sc.request };
      for (const stop of plan.alternatives) {
        if (!STOPS.includes(stop.pick) || stop.sequence !== undefined) continue;
        const shipped = tight(fullKernel, sc.request, stop.counts);
        const read = (cands: { counts: Record<string, number> }[]): { rf: number; bill: Bill; n: number; admissible: number; ms: number } => {
          const t0 = performance.now();
          const rows = cands.map((c) => { const p = tight(proxyKernel, sc.request, c.counts); return { c, p, r0: rate(shipped.bill, p.bill, CAMPAIGN.markerRates) }; })
            .filter((r) => admissible(stop.pick, shipped.bill, r.p.bill)).sort((a, b) => b.r0 - a.r0);
          let best = { rf: 0, bill: shipped.bill };
          for (const r of rows.slice(0, TOPK)) {
            const f = tight(fullKernel, sc.request, r.c.counts);
            if (!admissible(stop.pick, shipped.bill, f.bill)) continue;
            const rf = rate(shipped.bill, f.bill, CAMPAIGN.markerRates);
            if (rf > best.rf) best = { rf, bill: f.bill };
          }
          return { ...best, n: cands.length, admissible: rows.length, ms: performance.now() - t0 };
        };
        const tf = performance.now();
        const fr = frontierCands(input as never, plan.frontier ?? [], stop.counts, stop.repeat.mercLost);
        const frontierGenMs = performance.now() - tf;
        const F = read(fr.cands as Cand[]);
        const ta = performance.now();
        const arch = archetypes2(sc.request, stop.counts, { ball: process.env.BALL === "1" });
        const archGenMs = performance.now() - ta;
        const A = read(arch);
        appendFileSync(process.env.OUTF!, JSON.stringify({
          label: sc.label, pick: stop.pick, burn: stop.repeat.mercLost, shipped: shipped.bill,
          frontier: { rf: F.rf, bill: F.bill, n: F.n, adm: F.admissible, genMs: Math.round(frontierGenMs), ms: Math.round(F.ms) },
          arch: { rf: A.rf, bill: A.bill, n: A.n, adm: A.admissible, genMs: Math.round(archGenMs), ms: Math.round(A.ms) },
        }) + '\n');
      }
    }
  }, 86_400_000);
});
