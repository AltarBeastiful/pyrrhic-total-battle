/**
 * 261 — **the trio ladders** (`docs/plans/the-hero-champion.md`, after experiment 260). Every trio of the heroes that
 * count on any march, as the account has them, planned in full; then for the best `TOP` trios the ladder of each
 * member alone (stars 0..6 at the level it has, levels to 100 at the star it has, every 10), the other two held
 * as they are. Same reading as 260: the mean gain over the stops of the march with no hero planned the same way
 * (its all-in left out).
 *
 * `THEORY=1 ACCOUNT=file [TOP=5] pnpm vitest run tools/theorycraft/261-the-trio-ladders.test.ts`
 * Writes `tools/theorycraft/out/261-the-trio-ladders.md`.
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { captains as captainTable } from '../../src/data';
import { probeInfo } from '../../src/engine/advisor';
import { distinctCaptains } from '../../src/engine/captains';
import { parseImport } from '../../src/share/exportImport';
import { lineupTotals } from '../../src/state/captainLineups';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { createInlineClient } from '../../src/worker/client';
import { createCalcPool, type PoolJob } from '../../src/worker/pool';
import type { ProbeAnswer } from '../../src/worker/protocol';

const OUT = 'tools/theorycraft/out/261-the-trio-ladders.md';
const NO_CLOCK = 1_000_000_000;
const FILE = process.env.ACCOUNT ?? 'pyrrhic-my-account-2026-10-11.json';
const TOP = Number(process.env.TOP ?? 5);
const STARS = [0, 1, 2, 3, 4, 5, 6];
const f = (value: number, digits = 2): string => value.toFixed(digits);

describe.skipIf(!process.env.THEORY)('261 — the trio ladders', () => {
  it('trios as they stand, then the ladders of the best', async () => {
    const parsed = parseImport(readFileSync(FILE, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const profile = structuredClone(parsed.payload) as Profile;
    const setup = profile.setups[0]!;
    const pool = createCalcPool({ size: 1, createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }) });
    const lines = ['# 261 — the trio ladders', '', `Account ${FILE}.`, ''];
    try {
      const input = buildPlanRequest(profile, setup);
      const settings = { ...input };
      delete settings.budgetMs;
      delete settings.shouldStop;
      const record = (id: string) => captainTable.find((c) => c.id === id);
      const name = (id: string): string => record(id)?.name ?? id;
      const general = distinctCaptains(profile.sources.captains).filter((e) => {
        const r = record(e.captainId);
        return r?.onlyOn === undefined && (r?.health !== undefined || r?.strength !== undefined || r?.special !== undefined);
      });
      type Entry = (typeof general)[number];
      const raisedProfile = (changes: Record<string, { level: number; star: number }>): Profile => ({
        ...profile,
        sources: {
          ...profile.sources,
          captains: profile.sources.captains.map((c) => (changes[c.id] ? { ...c, ...changes[c.id]! } : c)),
        },
      });
      const totalsOf = (trio: Entry[], changes: Record<string, { level: number; star: number }> = {}) =>
        lineupTotals(raisedProfile(changes), setup, trio.map((e) => e.id));
      const planOf = (totals: ReturnType<typeof totalsOf>) => ({ ...settings, request: { ...settings.request, totals } });
      const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);

      const noneOut = await pool.map([(c, s) => c.probe({ plan: planOf(lineupTotals(profile, setup, [])) }, s)], { budgetMs: NO_CLOCK });
      if (noneOut[0]?.kind !== 'done') throw new Error('baseline');
      const baseline = (noneOut[0].value as ProbeAnswer).stops.filter((row) => row.pick !== 'all-in');
      const rateAll = async (items: { key: string; totals: ReturnType<typeof totalsOf> }[]): Promise<number[]> => {
        const outs = await pool.map(
          items.map(
            (item): PoolJob<ProbeAnswer> =>
              (c, s) =>
                c.probe(
                  { plan: planOf(item.totals), against: { probe: probeInfo({ id: item.key, family: 'captains', label: item.key }), baseline, rates: CAMPAIGN.markerRates } },
                  s,
                ),
          ),
          { budgetMs: NO_CLOCK },
        );
        return outs.map((r) => (r?.kind === 'done' && r.value.row ? mean(r.value.row.stops.map((x) => x.gain)) : Number.NaN));
      };

      // 1. Every trio as it stands.
      const trios: Entry[][] = [];
      for (let i = 0; i < general.length; i += 1)
        for (let j = i + 1; j < general.length; j += 1)
          for (let k = j + 1; k < general.length; k += 1) trios.push([general[i]!, general[j]!, general[k]!]);
      const t0 = performance.now();
      const now = await rateAll(trios.map((t) => ({ key: t.map((e) => e.captainId).join('+'), totals: totalsOf(t) })));
      const ranked = trios.map((t, i) => ({ t, v: now[i]! })).sort((a, b) => b.v - a.v);
      lines.push(`${String(trios.length)} trios planned in ${f((performance.now() - t0) / 1000, 0)} s.`, '', '## Trios as they stand', '', '| # | trio | rating |', '|---|---|---|');
      ranked.slice(0, 12).forEach((r, i) => lines.push(`| ${String(i + 1)} | ${r.t.map((e) => name(e.captainId)).join(' + ')} | ${f(r.v)} |`));
      lines.push('');
      const march = (ids: string[]) => ids.map(name).join(' + ');
      writeFileSync(OUT, lines.join('\n') + '\n');

      // 2. The ladders of each member of the best trios.
      for (const { t, v } of ranked.slice(0, TOP)) {
        lines.push(`## ${march(t.map((e) => e.captainId))} — ${f(v)} now`, '');
        for (const e of t) {
          const stars = await rateAll(STARS.map((star) => ({ key: `${e.captainId}★${String(star)}`, totals: totalsOf(t, { [e.id]: { level: e.level, star } }) })));
          const levels: number[] = [];
          for (let l = Math.ceil((e.level + 1) / 10) * 10; l < 100; l += 10) levels.push(l);
          if (e.level < 100) levels.push(100);
          const lv = await rateAll(levels.map((level) => ({ key: `${e.captainId}L${String(level)}`, totals: totalsOf(t, { [e.id]: { level, star: e.star } }) })));
          lines.push(
            `### ${name(e.captainId)} (L${String(e.level)} ★${String(e.star)})`,
            '',
            `| star at L${String(e.level)} | ${STARS.map((s) => `★${String(s)}`).join(' | ')} |`,
            `|---|${STARS.map(() => '---').join('|')}|`,
            `| trio rating | ${stars.map((x) => f(x)).join(' | ')} |`,
            '',
            `| level at ★${String(e.star)} | ${levels.map((l) => `L${String(l)}`).join(' | ')} |`,
            `|---|${levels.map(() => '---').join('|')}|`,
            `| trio rating | ${lv.map((x) => f(x)).join(' | ')} |`,
            '',
          );
          writeFileSync(OUT, lines.join('\n') + '\n');
        }
      }
    } finally {
      pool.dispose();
    }
    writeFileSync(OUT, lines.join('\n') + '\n');
    expect(lines.length).toBeGreaterThan(5);
  }, 6_000_000);
});
