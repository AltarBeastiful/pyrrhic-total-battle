/// <reference types="node" />
import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { CAMPAIGN, admissible, archetypes2, fullKernel, planCampaign, planMarch, proxyKernel, rate, structOf, tight, useFull } from './290-common';
describe.skipIf(!process.env.THEORY)('296 case debug', () => {
  it('prints', () => {
    useFull();
    const sc = criteriaScenarios()[Number(process.env.CASE)]!;
    const plan = planCampaign({ request: sc.request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack });
    const out: string[] = [sc.label, `housing ${JSON.stringify(sc.request.housing)}`];
    for (const stop of plan.alternatives) {
      if (stop.pick !== process.env.PICK) continue;
      const sh = tight(fullKernel, sc.request, stop.counts);
      const { result } = planMarch(sc.request, stop.counts);
      out.push(`shipped ${JSON.stringify(sh.bill)} pools ${JSON.stringify(result.pools)}`);
      out.push(' stacks ' + result.stacks.map((s) => `${s.unitId}:${s.count}:${Math.round(s.totalHp)}`).join(' '));
      const rows = archetypes2(sc.request, stop.counts).map((a) => { const p = tight(proxyKernel, sc.request, a.counts); return { a, p, r0: rate(sh.bill, p.bill, CAMPAIGN.markerRates) }; }).sort((x, y) => y.r0 - x.r0).slice(0, 3);
      for (const r of rows) {
        const f = tight(fullKernel, sc.request, r.a.counts);
        const m = planMarch(sc.request, r.a.counts).result;
        out.push(`${r.a.label} rf ${rate(sh.bill, f.bill, CAMPAIGN.markerRates).toFixed(2)} adm ${String(admissible(stop.pick, sh.bill, f.bill))} ${JSON.stringify(f.bill)} pools ${JSON.stringify(m.pools)}`);
        out.push(' stacks ' + m.stacks.map((s) => `${s.unitId}:${s.count}:${Math.round(s.totalHp)}`).join(' '));
        const s2 = structOf(sc.request, f.counts); out.push(' after tight ' + s2.troops.join(',') + ' ' + JSON.stringify(s2.hired));
      }
    }
    writeFileSync(process.env.OUTF!, out.join('\n') + '\n');
  }, 600000);
});
