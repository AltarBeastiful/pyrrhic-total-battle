/**
 * 292 — **archetypes as marches: type set x slot shape, re-typed** (follows 291, whose perm ball on the shipped stop's own
 * slots found nothing: the ★1 merc-saver stop is a k = 8 shape and the winners are k = 11). `archetypes2()` in 290-common.ts.
 * Same comparison as 291 against the frontier side.
 *
 * `THEORY=1 ACCT=<file> DATA=<290 jsonl> OUTF=<file> pnpm vitest run tools/theorycraft/292-archetypes-retyped.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { admissible, CAMPAIGN, STOPS, accountInput, archetypes2, fullKernel, planCampaign, proxyKernel, rate, tight, useFull } from './290-common';
import type { TB } from './290-common';

describe.skipIf(!process.env.THEORY)('292 — archetypes, re-typed', () => {
  it('compares', () => {
    useFull();
    const data = readFileSync(process.env.DATA!, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as { star: number; pick: string; counts: Record<string, number>; r0: number; b0: import('../../src/engine/rating').Bill });
    const out: string[] = [];
    const best = new Map<string, { counts: Record<string, number>; tb: TB }>();
    const requests = [0, 1, 2].map((s) => accountInput(s));
    for (const star of [0, 1, 2]) {
      const input = requests[star]!;
      const plan = planCampaign(input);
      for (const stop of plan.alternatives) {
        if (!STOPS.includes(stop.pick) || stop.sequence !== undefined) continue;
        const shipped = tight(fullKernel, input.request, stop.counts);
                const ok = (t: TB): boolean => admissible(stop.pick, shipped.bill, t.bill);
        let t0 = performance.now();
        const arch = archetypes2(input.request, stop.counts, { ball: process.env.BALL === "1" });
        const genMs = performance.now() - t0;
        t0 = performance.now();
        const rows = arch.map((a) => { const p = tight(proxyKernel, input.request, a.counts); return { a, r0: rate(shipped.bill, p.bill, CAMPAIGN.markerRates), okp: ok(p) }; });
        const proxyMs = performance.now() - t0;
        rows.sort((x, y) => y.r0 - x.r0);
        t0 = performance.now();
        const fullA = rows.filter((r) => r.okp).slice(0, Number(process.env.TOPK ?? 6)).map((r) => { const f = tight(fullKernel, input.request, r.a.counts); return { ...r, f, rf: rate(shipped.bill, f.bill, CAMPAIGN.markerRates) }; }).filter((r) => ok(r.f));
        const fullMs = performance.now() - t0;
        const bestA = fullA.reduce((m, r) => (r.rf > m.rf ? r : m), { rf: 0, f: shipped, a: { label: 'shipped', counts: stop.counts } } as (typeof fullA)[number]);
        const fr = data.filter((d) => d.star === star && d.pick === stop.pick && admissible(stop.pick, shipped.bill, d.b0)).sort((x, y) => y.r0 - x.r0).slice(0, 5).map((d) => { const f = tight(fullKernel, input.request, d.counts); return { d, f, rf: rate(shipped.bill, f.bill, CAMPAIGN.markerRates) }; }).filter((r) => ok(r.f));
        const bestF = fr.reduce((m, r) => (r.rf > m.rf ? r : m), { rf: 0, f: shipped, d: { counts: stop.counts } } as (typeof fr)[number]);
        best.set(`${String(star)}/${stop.pick}`, bestA.rf >= bestF.rf ? { counts: bestA.a.counts, tb: bestA.f } : { counts: bestF.d.counts, tb: bestF.f });
        best.set(`${String(star)}/${stop.pick}/arch`, { counts: bestA.a.counts, tb: bestA.f });
        out.push(`★${String(star)} ${stop.pick.padEnd(12)} | archetypes ${String(arch.length)} | shipped ${String(shipped.bill.damage)}/${String(Math.round(shipped.bill.silver ?? 0))} | arch best +${bestA.rf.toFixed(2)} ${String(bestA.f.bill.damage)}/${String(Math.round(bestA.f.bill.silver ?? 0))} [${bestA.a.label}] | frontier best +${bestF.rf.toFixed(2)} ${String(bestF.f.bill.damage)}/${String(Math.round(bestF.f.bill.silver ?? 0))} | proxy top ${rows.slice(0, 3).map((r) => r.r0.toFixed(2)).join('/')} | ms gen ${genMs.toFixed(0)} proxy ${proxyMs.toFixed(0)} full3 ${fullMs.toFixed(0)}`);
      }
      writeFileSync(process.env.OUTF!, out.join('\n') + '\n');
    }
    out.push('', 'monotone: star a best played under star b (Tight, full); rate(star b best vs played), >= 0 means star b best is at least as good');
    for (const pick of STOPS) for (const [a, b] of [[0, 1], [1, 2], [0, 2]] as const) for (const kind of ['', '/arch']) {
      const A = best.get(`${String(a)}/${pick}${kind}`), B = best.get(`${String(b)}/${pick}${kind}`);
      if (!A || !B) continue;
      const played = tight(fullKernel, requests[b]!.request, A.counts);
      out.push(`${pick.padEnd(12)} ★${String(a)}→★${String(b)} ${kind === '' ? 'arch∪frontier' : 'arch only    '} | ★${String(a)} best at ★${String(b)} ${String(played.bill.damage)}/${String(Math.round(played.bill.silver ?? 0))} vs ★${String(b)} best ${String(B.tb.bill.damage)}/${String(Math.round(B.tb.bill.silver ?? 0))} | ${rate(played.bill, B.tb.bill, CAMPAIGN.markerRates).toFixed(2)}`);
    }
    writeFileSync(process.env.OUTF!, out.join('\n') + '\n');
  }, 3_600_000);
});
