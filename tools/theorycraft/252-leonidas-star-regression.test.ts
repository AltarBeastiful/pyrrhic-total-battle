/**
 * 252 — **a captain's star makes the plan worse** (owner, 2026-10-22): on the 2026-10-22 account, Leonidas ★0 → ★1
 * moves the silver-saver march from 25.5M to 23.4M. Prints every stop of the plan at each star count.
 *
 * `THEORY=1 ACCT=<file> pnpm vitest run tools/theorycraft/252-leonidas-star-regression.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign, planMarch } from '../../src/engine';
import { applyCounts } from '../../src/ui/sections/march/manual';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { countsOf } from '../../src/ui/sections/march/raise';
import { positionTrades } from '../../src/ui/sections/march/positions';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';

const FILE = process.env.ACCT ?? '';

describe.skipIf(!process.env.THEORY)('252 — star regression', () => {
  it('prints the stops at each star', () => {
    const parsed = parseImport(readFileSync(FILE, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const out: string[] = [];
    const plans = new Map<number, { input: ReturnType<typeof buildPlanRequest>; plan: ReturnType<typeof planCampaign> }>();
    for (const star of [0, 1]) {
      const profile = structuredClone(parsed.payload) as Profile;
      const entry = profile.sources.captains.find((c) => c.captainId === 'leonidas');
      if (!entry) throw new Error('no leonidas');
      entry.star = star;
      const setup = profile.setups[0]!;
      const input = buildPlanRequest(profile, setup);
      const plan = planCampaign(input);
      plans.set(star, { input, plan });
      out.push(`totals ${JSON.stringify(input.request.totals)}`);
      out.push(`== star ${String(star)}`);
      for (const s of plan.alternatives) {
        const base = planMarch(input.request, s.counts).result;
        const own = countsOf(base);
        const asIs = applyCounts(input.request, base, own).summary.minDamage;
        const tight = positionTrades(input.request, base, ['tight']).rows[0];
        const tightDmg = tight ? applyCounts(input.request, base, { ...own, ...tight.counts }).summary.minDamage : 0;
        out.push(`   -> asIs ${String(asIs)} tight ${String(tightDmg)}`);
        out.push(
          `${s.pick.padEnd(12)} dmg ${String(s.repeat.damage).padStart(9)} silver ${String(s.repeat.silver).padStart(9)} burn ${String(s.repeat.mercLost)} total ${String(s.totalDamage)} marches ${String(s.marches)} tail ${String(s.tail?.marches)} fin ${String(Object.keys(s.finaleCounts ?? {}).length)}`,
        );
      }
    }
    // Cross-evaluation: each star's stop counts, played under the other star's request.
    for (const [from, to] of [[0, 1], [1, 0]] as const) {
      const a = plans.get(from)!;
      const b = plans.get(to)!;
      out.push(`== counts of star ${String(from)} played under star ${String(to)}`);
      for (const s of a.plan.alternatives) {
        const base = planMarch(b.input.request, s.counts).result;
        const own = countsOf(base);
        const asIs = applyCounts(b.input.request, base, own).summary.minDamage;
        const tight = positionTrades(b.input.request, base, ['tight']).rows[0];
        const tightDmg = tight ? applyCounts(b.input.request, base, { ...own, ...tight.counts }).summary.minDamage : 0;
        out.push(`${s.pick.padEnd(12)} asIs ${String(asIs)} tight ${String(tightDmg)}`);
      }
    }
    // H1/H2: the burn-9 candidates of each star's trade ladder, and the other star's burn-saver march among them.
    for (const star of [0, 1]) {
      const { input } = plans.get(star)!;
      const withTrade = planCampaign({ ...input, withTrade: true });
      const rows = (withTrade.trade ?? []).filter((r) => r.repeat.mercLost === 9);
      out.push(`== star ${String(star)}: ${String(withTrade.trade?.length)} trade rows, ${String(rows.length)} at burn 9`);
      for (const r of rows.sort((a, b) => b.repeat.damage - a.repeat.damage).slice(0, 12))
        out.push(`  burn 9 dmg ${String(r.repeat.damage)} silver ${String(r.repeat.silver)} ${r.shape ?? ''}`);
      const other = plans.get(1 - star)!.plan.alternatives.find((a) => a.pick === 'burn-saver')!;
      const base = planMarch(input.request, other.counts).result;
      const own = countsOf(base);
      const r = applyCounts(input.request, base, own);
      out.push(`  other star's saver here: dmg ${String(r.summary.minDamage)} silver ${String(r.summary.recovery.silver)} burn ${String(hiredLost(r.result.stacks))}`);
      for (const rule of ['damage', 'silver'] as const) {
        const alt = planCampaign({ ...input, burnSaver: rule }).alternatives.find((a) => a.pick === 'burn-saver');
        out.push(`  burnSaver=${rule}: dmg ${String(alt?.repeat.damage)} silver ${String(alt?.repeat.silver)} burn ${String(alt?.repeat.mercLost)}`);
      }
    }
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 600_000);
});
