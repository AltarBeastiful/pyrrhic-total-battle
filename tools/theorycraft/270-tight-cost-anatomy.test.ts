/**
 * 270 — **where a Tight-raised reading of one shape spends its time** (follows 259). For every distinct frontier
 * shape at the merc saver's burn on the 2026-10-22 account (Leonidas ★0/★1/★2): the time of the rated re-typing,
 * of `planMarch` on the re-typed counts, of the kernel's Tight position and of the replay that reads it, with the
 * box's size, how it was answered and how many vectors were scored; plus how many re-typed shapes collapse onto
 * one count vector and how many Tight answers coincide.
 *
 * `THEORY=1 ACCT=<file> OUTF=<file> pnpm vitest run tools/theorycraft/270-tight-cost-anatomy.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, planMarch } from '../../src/engine';
import { retypeMarch } from '../../src/engine/retype';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { applyCounts } from '../../src/ui/sections/march/manual';
import { positionTrades } from '../../src/ui/sections/march/positions';
import { countsOf } from '../../src/ui/sections/march/raise';

const key = (c: Record<string, number>): string => JSON.stringify(Object.entries(c).filter(([, v]) => v > 0).sort());

describe.skipIf(!process.env.THEORY)('270 — tight cost anatomy', () => {
  it('times each part', () => {
    const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const out: string[] = [];
    for (const star of [0, 1, 2]) {
      const profile = structuredClone(parsed.payload) as Profile;
      profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
      const input = buildPlanRequest(profile, profile.setups[0]!);
      let t = performance.now();
      const plan0 = planCampaign(input);
      const planMs = performance.now() - t;
      t = performance.now();
      const plan = planCampaign({ ...input, withFrontier: true });
      const planFrontierMs = performance.now() - t;
      out.push(`== ★${String(star)} planCampaign ${planMs.toFixed(0)} ms, withFrontier ${planFrontierMs.toFixed(0)} ms, stops ${String(plan0.alternatives.length)}`);
      for (const stop of plan.alternatives) {
        if (stop.sequence !== undefined || !['burn-saver', 'silver-saver', 'sweet-spot'].includes(stop.pick)) continue;
        const shapes = new Map<string, Record<string, number>>();
        for (const r of plan.frontier ?? []) if (r.repeat.mercLost === stop.repeat.mercLost) shapes.set(key(r.counts), r.counts);
        let tRetype = 0, tPlan = 0, tTight = 0, tRead = 0;
        const retyped = new Set<string>();
        const answers = new Set<string>();
        const hist: Record<string, number> = {};
        let maxSpace = 0, sumScored = 0, maxTightMs = 0;
        for (const counts of shapes.values()) {
          let a = performance.now();
          const found = retypeMarch(input.request, counts, CAMPAIGN.putBack.rates, { tierCandidate: true });
          const next = found?.counts ?? counts;
          tRetype += performance.now() - a;
          retyped.add(key(next));
          a = performance.now();
          const base = planMarch(input.request, next).result;
          tPlan += performance.now() - a;
          a = performance.now();
          const row = positionTrades(input.request, base, ['tight']).rows[0];
          const dt = performance.now() - a;
          tTight += dt;
          maxTightMs = Math.max(maxTightMs, dt);
          a = performance.now();
          const own = countsOf(base);
          applyCounts(input.request, base, { ...own, ...(row?.counts ?? {}) });
          tRead += performance.now() - a;
          answers.add(key({ ...own, ...(row?.counts ?? {}) }));
          const h = `${String(row?.how)}`;
          hist[h] = (hist[h] ?? 0) + 1;
          maxSpace = Math.max(maxSpace, row?.space ?? 0);
          sumScored += row?.scored ?? 0;
        }
        out.push(
          `${stop.pick} burn ${String(stop.repeat.mercLost)}: shapes ${String(shapes.size)}, distinct after retype ${String(retyped.size)}, distinct tight answers ${String(answers.size)} | retype ${tRetype.toFixed(0)} ms, planMarch ${tPlan.toFixed(0)} ms, tight ${tTight.toFixed(0)} ms (max ${maxTightMs.toFixed(0)}), read ${tRead.toFixed(0)} ms | how ${JSON.stringify(hist)} max space ${String(maxSpace)} scored Σ ${String(sumScored)}`,
        );
        writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
      }
    }
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 3_600_000);
});
