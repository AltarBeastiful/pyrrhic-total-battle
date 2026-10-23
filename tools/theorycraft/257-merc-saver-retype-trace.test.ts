/**
 * 257 — **what the rated re-typing does to the merc saver's march** (follows 256): the plan's trace of `retypeOne`
 * for the merc saver's base march at Leonidas ★0 and ★1 — what the search found, its rating, whether a guard refused it —
 * and the other star's re-typed march rated on the same base.
 *
 * `THEORY=1 ACCT=<file> OUTF=<file> pnpm vitest run tools/theorycraft/257-merc-saver-retype-trace.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign } from '../../src/engine';
import { planTrace } from '../../src/engine/plan-trace';
import type { PlanTraceEvent } from '../../src/engine/plan-trace';
import { marchBill, retypeMarch } from '../../src/engine/retype';
import { rate } from '../../src/engine/rating';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';

const diff = (a: Record<string, number>, b: Record<string, number>): string =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter((k) => (a[k] ?? 0) !== (b[k] ?? 0))
    .map((k) => `${k} ${String(a[k] ?? 0)}→${String(b[k] ?? 0)}`)
    .join(', ');

describe.skipIf(!process.env.THEORY)('257 — merc saver retype trace', () => {
  it('traces the re-typing', () => {
    const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const out: string[] = [];
    const bases = new Map<number, { request: ReturnType<typeof buildPlanRequest>['request']; base: Record<string, number>; final: Record<string, number> }>();
    for (const star of [0, 1]) {
      const profile = structuredClone(parsed.payload) as Profile;
      profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
      const input = buildPlanRequest(profile, profile.setups[0]!);
      const events: PlanTraceEvent[] = [];
      planTrace.sink = (e) => events.push(e);
      const withRetype = planCampaign(input);
      planTrace.sink = null;
      const bare = planCampaign({ ...input, retype: undefined, putBack: undefined });
      const base = bare.alternatives.find((a) => a.pick === 'burn-saver')!.counts;
      const final = withRetype.alternatives.find((a) => a.pick === 'burn-saver')!.counts;
      bases.set(star, { request: input.request, base, final });
      const mine = events.filter((e) => e.step === 'retypeOne' && JSON.stringify(Object.entries(e.counts).sort()) === JSON.stringify(Object.entries(base).sort()));
      out.push(`== ★${String(star)}: ${String(mine.length)} retypeOne call(s) on the merc saver's base`);
      for (const e of mine)
        if (e.step === 'retypeOne')
          out.push(`  found ${e.found ? 'yes' : 'no'} rating ${e.rating.toFixed(2)} cut ${String(e.cut)} deadline ${String(e.deadline)} refused ${String(e.refused)} changed: ${e.found ? diff(e.counts, e.found) : '-'}`);
      out.push(`  base→final: ${diff(base, final)}`);
    }
    // The other star's final march, rated against this star's base, and what a fresh climb from this base finds.
    for (const star of [0, 1]) {
      const here = bases.get(star)!;
      const other = bases.get(1 - star)!;
      const baseBill = marchBill(here.request, here.base);
      const otherBill = marchBill(here.request, other.final);
      out.push(`★${String(star)} base ${JSON.stringify({ d: baseBill.damage, s: Math.round(baseBill.silver ?? 0) })}; ★${String(1 - star)}'s final here ${JSON.stringify({ d: otherBill.damage, s: Math.round(otherBill.silver ?? 0) })} rating ${rate(baseBill, otherBill, CAMPAIGN.markerRates).toFixed(2)}`);
      for (const opts of [{}]) {
        const t0 = performance.now();
        const found = retypeMarch(here.request, here.base, CAMPAIGN.putBack.rates, opts);
        out.push(`  retypeMarch ${JSON.stringify(opts)} -> ${found ? `rating ${found.rating.toFixed(2)} dmg ${String(marchBill(here.request, found.counts).damage)} tried ${String(found.tried)} exhaustive ${String(found.exhaustive)} cut ${String(found.cut)} seed ${String(found.seed)} ${(performance.now() - t0).toFixed(0)} ms` : 'none'}`);
      }
    }
    // H5: the other star's BASE (pre-retype) shape, played under this star: dominated before the retype, but not after.
    for (const star of [0, 1]) {
      const here = bases.get(star)!;
      const other = bases.get(1 - star)!;
      const pre = marchBill(here.request, other.base);
      const post = retypeMarch(here.request, other.base, CAMPAIGN.putBack.rates, {});
      const own = marchBill(here.request, here.base);
      const ownPost = retypeMarch(here.request, here.base, CAMPAIGN.putBack.rates, {});
      out.push(`H5 under ★${String(star)}: own base d ${String(own.damage)} s ${String(Math.round(own.silver ?? 0))} -> retyped ${ownPost ? String(marchBill(here.request, ownPost.counts).damage) : '-'}; ★${String(1 - star)}'s base d ${String(pre.damage)} s ${String(Math.round(pre.silver ?? 0))} dominated by own base: ${String(pre.damage <= own.damage && (pre.silver ?? 0) >= (own.silver ?? 0))} -> retyped ${post ? String(marchBill(here.request, post.counts).damage) : '-'} s ${post ? String(Math.round(marchBill(here.request, post.counts).silver ?? 0)) : '-'}`);
    }
    // H6: is the other star's base shape among this star's scored candidates, and is it flagged undominated?
    for (const star of [0, 1]) {
      const profile = structuredClone(parsed.payload) as Profile;
      profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
      const plan = planCampaign({ ...buildPlanRequest(profile, profile.setups[0]!), withFrontier: true });
      const target = JSON.stringify(Object.entries(bases.get(1 - star)!.base).filter(([, v]) => v > 0).sort());
      const hit = (plan.frontier ?? []).filter((r) => JSON.stringify(Object.entries(r.counts).filter(([, v]) => v > 0).sort()) === target);
      out.push(`H6 (whole frontier) ★${String(star)}: ★${String(1 - star)}'s base counts among ${String(plan.frontier?.length)} trade rows: ${String(hit.length)}; undominated flags ${JSON.stringify(hit.map((r) => r.undominated))}`);
      const sameBurn = (plan.frontier ?? []).filter((r) => r.repeat.mercLost === 9);
      out.push(`   rows at burn 9: ${String(sameBurn.length)}; distinct count-sets ${String(new Set(sameBurn.map((r) => JSON.stringify(Object.entries(r.counts).sort()))).size)}`);
    }
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 1_800_000);
});
