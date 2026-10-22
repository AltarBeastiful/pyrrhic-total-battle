/**
 * 262 — **the valley noise floor** (`docs/plans/the-hero-champion.md`, Valleys). A full plan swings by several rating
 * points on the re-plan alone. The same grid points are planned under five tiny changes of the leadership housing
 * (−2 %, −1 %, 0, +1 %, +2 %: a different budget, the same hero), each against the march with no hero planned under the
 * same housing. The spread of a point over the five is its noise.
 *
 * Reported: the noise per hero and overall (median, 90th percentile of max − min); the valleys of a single plan (the
 * 0 % one) against the valleys that survive in the mean of the five; and, for thresholds of 1, 2 and 3 noise floors,
 * how many single-plan valleys are kept and what share of those the mean curve confirms.
 *
 * `THEORY=1 ACCOUNT=file pnpm vitest run tools/theorycraft/262-valley-noise.test.ts`
 * Writes `tools/theorycraft/out/262-valley-noise.md`.
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

const OUT = 'tools/theorycraft/out/262-valley-noise.md';
const NO_CLOCK = 1_000_000_000;
const FILE = process.env.ACCOUNT ?? 'pyrrhic-my-account-2026-10-11.json';
const JITTERS = [-0.02, -0.01, 0, 0.01, 0.02];
const STARS = [0, 1, 2, 3, 4, 5, 6];
const f = (value: number, digits = 2): string => value.toFixed(digits);
const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
const quantile = (xs: number[], q: number): number => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
};

/** The star curve's dips: index and depth of every rung lower than the one before. */
const dips = (curve: readonly number[]): { at: number; depth: number }[] =>
  curve.flatMap((v, at) => (at > 0 && v < curve[at - 1]! - 1e-9 ? [{ at, depth: curve[at - 1]! - v }] : []));

describe.skipIf(!process.env.THEORY)('262 — valley noise', () => {
  it('spread under housing jitter, valleys that survive', async () => {
    const parsed = parseImport(readFileSync(FILE, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const profile = structuredClone(parsed.payload) as Profile;
    const setup = profile.setups[0]!;
    const pool = createCalcPool({ size: 1, createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }) });
    const lines = ['# 262 — the valley noise floor', '', `Account ${FILE}; housing leadership ${String(setup.housing.leadership)} jittered ${JITTERS.map((j) => `${String(j * 100)} %`).join(', ')}.`, ''];
    try {
      const record = (id: string) => captainTable.find((c) => c.id === id);
      const name = (id: string): string => record(id)?.name ?? id;
      const heroes = distinctCaptains(profile.sources.captains).filter((e) => {
        const r = record(e.captainId);
        return r?.onlyOn === undefined && (r?.health !== undefined || r?.strength !== undefined || r?.special !== undefined);
      });
      // Curves: stars 0..6 at the hero's own level and at the top level.
      const levelsOf = (level: number): number[] => [...new Set([Math.max(1, level), CAMPAIGN.captainMaxLevel])];
      // rating[hero][level][jitter][star]
      const rating = new Map<string, number[][]>();
      for (const [ji, jitter] of JITTERS.entries()) {
        const jittered = { ...setup, housing: { ...setup.housing, leadership: Math.round(setup.housing.leadership * (1 + jitter)) } };
        const input = buildPlanRequest(profile, jittered);
        const settings = { ...input };
        delete settings.budgetMs;
        delete settings.shouldStop;
        const planOf = (totals: ReturnType<typeof lineupTotals>) => ({ ...settings, request: { ...settings.request, totals } });
        const noneOut = await pool.map([(c, s) => c.probe({ plan: planOf(lineupTotals(profile, jittered, [])) }, s)], { budgetMs: NO_CLOCK });
        if (noneOut[0]?.kind !== 'done') throw new Error('baseline');
        const baseline = (noneOut[0].value as ProbeAnswer).stops.filter((row) => row.pick !== 'all-in');
        for (const hero of heroes) {
          for (const level of levelsOf(hero.level)) {
            const items = STARS.map((star) => {
              const raised: Profile = {
                ...profile,
                sources: { ...profile.sources, captains: profile.sources.captains.map((c) => (c.id === hero.id ? { ...c, level, star } : c)) },
              };
              return { key: `${hero.captainId}L${String(level)}★${String(star)}`, totals: lineupTotals(raised, jittered, [hero.id]) };
            });
            const outs = await pool.map(
              items.map(
                (item): PoolJob<ProbeAnswer> =>
                  (c, s) =>
                    c.probe({ plan: planOf(item.totals), against: { probe: probeInfo({ id: item.key, family: 'captains', label: item.key }), baseline, rates: CAMPAIGN.markerRates } }, s),
              ),
              { budgetMs: NO_CLOCK },
            );
            const curve = outs.map((r) => (r?.kind === 'done' && r.value.row ? mean(r.value.row.stops.map((x) => x.gain)) : Number.NaN));
            const key = `${hero.captainId}|${String(level)}`;
            const cell = rating.get(key) ?? JITTERS.map(() => []);
            cell[ji] = curve;
            rating.set(key, cell);
          }
        }
        lines.push(`Jitter ${String(jitter * 100)} %: done.`);
        writeFileSync(OUT, lines.join('\n') + '\n');
      }

      // Noise: per point the spread over the five housings.
      const spreads: { hero: string; level: number; star: number; spread: number }[] = [];
      for (const [key, cell] of rating) {
        const [hero, level] = key.split('|') as [string, string];
        STARS.forEach((star) => {
          const values = cell.map((curve) => curve[star]!);
          spreads.push({ hero, level: Number(level), star, spread: Math.max(...values) - Math.min(...values) });
        });
      }
      const all = spreads.map((s) => s.spread);
      lines.push('', `## Noise (max − min of a point over the five housings)`, '', `All ${String(all.length)} points: median ${f(quantile(all, 0.5))}, 75th ${f(quantile(all, 0.75))}, 90th ${f(quantile(all, 0.9))}, max ${f(Math.max(...all))}.`, '', '| hero | median | 90th |', '|---|---|---|');
      for (const hero of new Set(spreads.map((s) => s.hero))) {
        const own = spreads.filter((s) => s.hero === hero).map((s) => s.spread);
        lines.push(`| ${name(hero)} | ${f(quantile(own, 0.5))} | ${f(quantile(own, 0.9))} |`);
      }

      // Valleys of the 0 % plan against the mean of the five.
      const floor = quantile(all, 0.5);
      lines.push('', `## Valleys: one plan against the mean of five (noise floor = median spread ${f(floor)})`, '');
      const tally = [1, 2, 3].map((k) => ({ k, kept: 0, confirmed: 0 }));
      let single = 0;
      let singleConfirmed = 0;
      for (const [key, cell] of rating) {
        const [hero, level] = key.split('|') as [string, string];
        const one = cell[JITTERS.indexOf(0)]!;
        const avg = STARS.map((star) => mean(cell.map((curve) => curve[star]!)));
        const meanDips = new Set(dips(avg).map((d) => d.at));
        for (const d of dips(one)) {
          single += 1;
          const confirmed = meanDips.has(d.at);
          if (confirmed) singleConfirmed += 1;
          for (const row of tally) if (d.depth > row.k * floor) { row.kept += 1; if (confirmed) row.confirmed += 1; }
          if (d.depth > 2 * floor)
            lines.push(`- ${name(hero)} L${level}: ★${String(d.at - 1)}→★${String(d.at)} loses ${f(d.depth)} — ${confirmed ? 'also in the mean' : 'gone in the mean'}.`);
        }
      }
      lines.push('', `Single-plan valleys: ${String(single)}, confirmed by the mean of five: ${String(singleConfirmed)} (${f((100 * singleConfirmed) / Math.max(1, single), 0)} %).`, '', '| threshold | kept | confirmed by the mean |', '|---|---|---|');
      for (const row of tally) lines.push(`| ${String(row.k)} × floor (${f(row.k * floor)}) | ${String(row.kept)} | ${String(row.confirmed)} (${f((100 * row.confirmed) / Math.max(1, row.kept), 0)} %) |`);
    } finally {
      pool.dispose();
    }
    writeFileSync(OUT, lines.join('\n') + '\n');
    expect(lines.length).toBeGreaterThan(5);
  }, 6_000_000);
});
