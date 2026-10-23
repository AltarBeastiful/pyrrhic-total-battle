/// <reference types="node" />
import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { STOPS, accountInput, fullKernel, planCampaign, structOf, tight, useFull } from './290-common';
describe.skipIf(!process.env.THEORY)('293 shipped structures', () => {
  it('prints', () => {
    useFull();
    const out: string[] = [];
    for (const star of [0, 1, 2]) {
      const input = accountInput(star);
      for (const stop of planCampaign(input).alternatives) {
        if (!STOPS.includes(stop.pick) || stop.sequence !== undefined) continue;
        const s = structOf(input.request, stop.counts);
        const t = tight(fullKernel, input.request, stop.counts);
        const s2 = structOf(input.request, t.counts);
        out.push(`★${String(star)} ${stop.pick} k ${String(s.troops.length)} ${s.troops.join(' ')} hp ${s.hp.map((h) => Math.round(h / 1e3)).join(',')} hired ${JSON.stringify(s.hired)} | after Tight: hp ${s2.hp.map((h) => Math.round(h / 1e3)).join(',')} hired ${JSON.stringify(s2.hired)} q ${String(Math.round(t.bill.seconds ?? 0))}`);
      }
    }
    writeFileSync(process.env.OUTF!, out.join('\n') + '\n');
  }, 600000);
});
