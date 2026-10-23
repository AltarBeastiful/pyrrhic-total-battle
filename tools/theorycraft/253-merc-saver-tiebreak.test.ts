/**
 * 253 — **the merc saver's tie-break** (follows 252): the fewest-burn stop takes the least silver among the candidates
 * at that burn, and a few thousand silver decides between marches that differ by 20 % in damage. Prices the bar's
 * merc saver (as is and Tight) under `burnSaver: 'silver'` (shipped) and `'damage'`, for Leonidas at each level × star
 * on the account named by `ACCT`.
 *
 * `THEORY=1 ACCT=<file> OUTF=<file> pnpm vitest run tools/theorycraft/253-merc-saver-tiebreak.test.ts`
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

const FILE = process.env.ACCT ?? '';

describe.skipIf(!process.env.THEORY)('253 — merc saver tie-break', () => {
  it('prices the merc saver per rule, level and star', () => {
    const parsed = parseImport(readFileSync(FILE, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const out: string[] = ['level star | rule: asIs / tight / silver / burn'];
    for (const [level, star] of [[45, 0], [45, 1], [45, 2], [46, 0], [48, 0], [50, 0], [50, 1], [52, 0]] as const) {
      const profile = structuredClone(parsed.payload) as Profile;
      const entry = profile.sources.captains.find((c) => c.captainId === 'leonidas')!;
      entry.level = level;
      entry.star = star;
      const cells: string[] = [];
      for (const rule of ['silver', 'damage'] as const) {
        const input = { ...buildPlanRequest(profile, profile.setups[0]!), burnSaver: rule };
        const plan = planCampaign(input);
        const stop = plan.alternatives.find((a) => a.pick === 'burn-saver');
        if (!stop) {
          cells.push(`${rule}: none`);
          continue;
        }
        const base = planMarch(input.request, stop.counts).result;
        const own = countsOf(base);
        const tight = positionTrades(input.request, base, ['tight']).rows[0];
        const t = tight ? applyCounts(input.request, base, { ...own, ...tight.counts }).summary.minDamage : 0;
        cells.push(`${rule}: ${String(stop.repeat.damage)} / ${String(t)} / ${String(Math.round(stop.repeat.silver))} / ${String(stop.repeat.mercLost)}`);
      }
      out.push(`${String(level)} ★${String(star)} | ${cells.join(' | ')}`);
    }
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 900_000);
});
