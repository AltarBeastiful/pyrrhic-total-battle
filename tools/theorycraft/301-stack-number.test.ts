/**
 * 301 — **the stack number** (Part B of the 300 study). For every stop 300 read (the account at Leonidas ★0-★2, the
 * benchmark armies), the winning march (the best of shipped / 300's descent / the 259-style frontier read, by the
 * owner's rating on full Tight) is described next to the request's quantities: leadership, authority, dominance,
 * leadership troop types available (m), hired burn, the stop's silver and queue, the hired stacks' HP against the
 * troop slots' HP, and what a flat all-types lay would cost (silver, queue) against the stop's own bill.
 *
 * `THEORY=1 ACCT=<file> IN=<300 jsonl, comma-separated> OUTF=<jsonl> pnpm vitest run tools/theorycraft/301-stack-number.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { effectiveTable, rankTroops } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { CAMPAIGN, accountInput, marchBill, planCampaign, planMarch } from './290-common';

const EPS = 0.005;

function flatAll(request: StackRequest, hired: Record<string, number>): Record<string, number> {
  const t = rankTroops(effectiveTable(request));
  const L = request.housing.leadership;
  const build = (H: number): { c: Record<string, number>; lead: number } => {
    const c: Record<string, number> = { ...hired };
    let lead = 0;
    t.forEach((e, j) => { const n = Math.ceil((H * (1 - 0.0019 * j)) / e.hp); c[e.id] = n; lead += n * e.cost; });
    return { c, lead };
  };
  let lo = 0, hi = 1e9;
  for (let i = 0; i < 70; i += 1) { const mid = (lo + hi) / 2; if (build(mid).lead <= L) lo = mid; else hi = mid; }
  return build(lo).c;
}

describe.skipIf(!process.env.THEORY)('301 — the stack number', () => {
  it('tabulates', () => {
    const rows = process.env.IN!.split(',').flatMap((f) => readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as Record<string, any>)).filter((r) => r.pick !== undefined);
    const scen = criteriaScenarios();
    const out: string[] = [];
    const plans = new Map<string, ReturnType<typeof planCampaign>>();
    for (const r of rows) {
      const isAcct = r.star !== undefined;
      const request: StackRequest = isAcct ? accountInput(r.star).request : scen[r.idx].request;
      const pk = isAcct ? `a${String(r.star)}` : `b${String(r.idx)}`;
      if (!plans.has(pk)) plans.set(pk, planCampaign(isAcct ? accountInput(r.star) : { request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack }));
      const stop = plans.get(pk)!.alternatives.find((s) => s.pick === r.pick && s.sequence === undefined)!;
      const D = r.descent, F = r.frontier;
      let win = 'S', counts: Record<string, number> = stop.counts, rf = 0;
      if (D.rf > EPS && D.counts) { win = 'D'; counts = D.counts; rf = D.rf; }
      if (F && F.rf > rf + EPS && F.counts) { win = 'F'; counts = F.counts; rf = F.rf; }
      const res = planMarch(request, counts).result;
      const troop = res.stacks.filter((s) => s.pool === 'leadership' && s.count > 0).sort((a, b) => b.totalHp - a.totalHp);
      const hiredSt = res.stacks.filter((s) => s.pool !== 'leadership' && s.count > 0);
      const ship = planMarch(request, stop.counts).result;
      const shipHired: Record<string, number> = {};
      for (const s of ship.stacks) if (s.pool !== 'leadership') shipHired[s.unitId] = s.count;
      const fl = marchBill(request, flatAll(request, shipHired));
      const sb = marchBill(request, stop.counts);
      const t = effectiveTable(request).filter((e) => e.pool === 'leadership');
      const tMax = troop[0]?.totalHp ?? 0;
      out.push(JSON.stringify({
        case: isAcct ? `acct★${String(r.star)}` : `b${String(r.idx)}`, label: r.label, pick: r.pick, burn: stop.repeat.mercLost, win, rf,
        m: t.length, L: request.housing.leadership, A: request.housing.authority, Dm: request.housing.dominance,
        kShip: ship.stacks.filter((s) => s.pool === 'leadership' && s.count > 0).length, kWin: troop.length,
        typesOut: t.filter((e) => !troop.some((s) => s.unitId === e.id)).map((e) => `${e.id}(t${String(e.unit.tier)})`),
        slotMax: Math.round(tMax), slotMin: Math.round(troop[troop.length - 1]?.totalHp ?? 0),
        hiredStacks: hiredSt.length, hiredAboveSlot: hiredSt.filter((s) => s.totalHp > tMax).length,
        hiredHpShare: hiredSt.reduce((a, s) => a + s.totalHp, 0) / Math.max(1, res.stacks.reduce((a, s) => a + s.totalHp, 0)),
        leadUsed: res.pools.leadership.used / res.pools.leadership.capacity,
        flatSilverOverStop: (fl.silver ?? 0) / Math.max(1, sb.silver ?? 0), flatQueueOverStop: (fl.seconds ?? 0) / Math.max(1, sb.seconds ?? 0),
      }));
      writeFileSync(process.env.OUTF!, out.join('\n') + '\n');
    }
  }, 86_400_000);
});
