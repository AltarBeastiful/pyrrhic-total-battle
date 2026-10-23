/**
 * 254 — **what Tight makes of each candidate at the merc saver's burn** (follows 253): every distinct candidate
 * (damage, silver) at the plan's fewest burn, raised by Tight, with the raised march's damage, silver and gold, for
 * Leonidas ★0 and ★1 on the account named by `ACCT`. Says whether a candidate the `silver` tie-break passes over
 * beats the shipped merc saver once both are raised.
 *
 * `THEORY=1 ACCT=<file> OUTF=<file> pnpm vitest run tools/theorycraft/254-burn-nine-tight.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign, planMarch } from '../../src/engine';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { applyCounts } from '../../src/ui/sections/march/manual';
import { positionTrades } from '../../src/ui/sections/march/positions';
import { countsOf } from '../../src/ui/sections/march/raise';

describe.skipIf(!process.env.THEORY)('254 — burn-nine under Tight', () => {
  it('raises each distinct candidate', () => {
    const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const out: string[] = [];
    for (const star of [0, 1]) {
      const profile = structuredClone(parsed.payload) as Profile;
      profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
      const input = buildPlanRequest(profile, profile.setups[0]!);
      const plan = planCampaign({ ...input, withTrade: true });
      const shipped = plan.alternatives.find((a) => a.pick === 'burn-saver')!;
      const burn = shipped.repeat.mercLost;
      const seen = new Map<string, NonNullable<typeof plan.trade>[number]>();
      for (const r of plan.trade ?? [])
        if (r.repeat.mercLost === burn) seen.set(`${r.repeat.damage}|${Math.round(r.repeat.silver)}`, r);
      const points = [...seen.values()].sort((a, b) => a.repeat.silver - b.repeat.silver);
      out.push(`== ★${String(star)}: ${String(points.length)} distinct candidates at burn ${String(burn)}; shipped ${String(shipped.repeat.damage)} / ${String(Math.round(shipped.repeat.silver))}`);
      const rows: { d: number; s: number; td: number; ts: number; tg: number; tag: string }[] = [];
      for (const r of points) {
        const base = planMarch(input.request, r.counts).result;
        const own = countsOf(base);
        const tight = positionTrades(input.request, base, ['tight']).rows[0];
        const res = applyCounts(input.request, base, tight ? { ...own, ...tight.counts } : own);
        rows.push({
          d: r.repeat.damage, s: Math.round(r.repeat.silver),
          td: res.summary.minDamage, ts: Math.round(res.summary.recovery.silver), tg: res.summary.recovery.gold,
          tag: r.counts === shipped.counts ? 'SHIPPED' : '',
        });
      }
      for (const r of rows.sort((a, b) => b.td - a.td).slice(0, 14))
        out.push(`  as-is ${String(r.d)} / ${String(r.s)}  ->  tight ${String(r.td)} / silver ${String(r.ts)} / gold ${String(r.tg)} ${r.tag}`);
      const sh = rows.find((r) => r.tag === 'SHIPPED');
      if (sh) out.push(`  shipped: as-is ${String(sh.d)} / ${String(sh.s)} -> tight ${String(sh.td)} / silver ${String(sh.ts)} / gold ${String(sh.tg)}; rank by tight damage ${String(rows.indexOf(sh) + 1)} of ${String(rows.length)}`);
    }
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 1_800_000);
});
