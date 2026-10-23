/// <reference types="node" />
import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { CAMPAIGN, STOPS, accountInput, admissible, archetypes2, fullKernel, planCampaign, proxyKernel, rate, tight, useFull } from './290-common';
describe.skipIf(!process.env.THEORY)('294 gate debug', () => {
  it('prints', () => {
    useFull();
    const out: string[] = [];
    const star = Number(process.env.STAR ?? 2);
    const input = accountInput(star);
    for (const stop of planCampaign(input).alternatives) {
      if (stop.pick !== (process.env.PICK ?? 'burn-saver')) continue;
      const sh = tight(fullKernel, input.request, stop.counts).bill;
      out.push(`shipped ${JSON.stringify(sh)}`);
      const rows = archetypes2(input.request, stop.counts).map((a) => { const p = tight(proxyKernel, input.request, a.counts); return { a, p, r0: rate(sh, p.bill, CAMPAIGN.markerRates) }; }).sort((x, y) => y.r0 - x.r0).slice(0, 8);
      for (const r of rows) {
        const f = tight(fullKernel, input.request, r.a.counts);
        out.push(`${r.a.label.padEnd(22)} r0 ${r.r0.toFixed(2)} adm0 ${String(admissible(stop.pick, sh, r.p.bill))} proxy ${JSON.stringify(r.p.bill)} | full rf ${rate(sh, f.bill, CAMPAIGN.markerRates).toFixed(2)} adm ${String(admissible(stop.pick, sh, f.bill))} ${JSON.stringify(f.bill)}`);
      }
    }
    writeFileSync(process.env.OUTF!, out.join('\n') + '\n');
  }, 600000);
});
