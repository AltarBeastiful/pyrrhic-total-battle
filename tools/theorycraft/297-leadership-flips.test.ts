/**
 * 297 — **does the leadership pool reorder the hero leaderboard?** (`docs/plans/the-hero-champion-by-leadership.md`,
 * the experiment gate). Every owned hero with a fighting line is rated on solo curves (stars 0 to 6 on the level grid
 * `levelsFrom(own, levelStep)`) at each leadership of `LEADERSHIPS`, dominance 2,000 and again at 4,000 for the live
 * leadership. Per setting: the podium by best point and by the point at the hero's own star and level, the solo
 * champion, and the rating gap that flips them. Nothing is hardcoded about a roster.
 *
 * `THEORY=1 [ACCOUNT=file] [LEADERSHIPS=7000,11815,13000,15000] pnpm vitest run tools/theorycraft/297-leadership-flips.test.ts`
 * Writes `tools/theorycraft/out/297-leadership-flips.md`.
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { probeInfo } from '../../src/engine/advisor';
import { parseImport } from '../../src/share/exportImport';
import { championRoster } from '../../src/state/heroChampionRoster';
import type { Profile } from '../../src/state/schema';
import { createInlineClient } from '../../src/worker/client';
import { levelsFrom } from '../../src/worker/heroChampion';
import { CAMPAIGN } from '../../src/config';
import type { ProbeAnswer } from '../../src/worker/protocol';

const OUT = 'tools/theorycraft/out/297-leadership-flips.md';
const FILE = process.env.ACCOUNT ?? `${process.env.HOME ?? ''}/Downloads/pyrrhic-my-account-2026-10-22.json`;
const f = (value: number, digits = 1): string => value.toFixed(digits);
const STARS = [0, 1, 2, 3, 4, 5, 6];
const mean = (v: readonly number[]): number => v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);

describe.skipIf(!process.env.THEORY)('297 — leadership and dominance against the leaderboard', () => {
  it('reads every hero at each pool', async () => {
    const parsed = parseImport(readFileSync(FILE, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const base = structuredClone(parsed.payload) as Profile;
    const live = base.setups[0]!.housing.leadership;
    const leaderships = (process.env.LEADERSHIPS ?? `7000,${String(live)},13000,15000`)
      .split(',')
      .map(Number);
    const settings = [
      ...leaderships.map((leadership) => ({ leadership, dominance: base.setups[0]!.housing.dominance })),
      { leadership: live, dominance: 4000 },
    ];
    const client = createInlineClient();
    const lines = [
      '# 297 — leadership and dominance against the leaderboard',
      '',
      `Account ${FILE}; live leadership ${String(live)}.`,
      '',
    ];
    const table: Record<
      string,
      { name: string; best: Map<string, number>; today: Map<string, number>; own: number }
    > = {};
    const wall: string[] = [];
    try {
      for (const { leadership, dominance } of settings) {
        const key = `L${String(leadership)} D${String(dominance)}`;
        const began = performance.now();
        const profile = structuredClone(base);
        profile.setups[0]!.housing = { ...profile.setups[0]!.housing, leadership, dominance };
        const setup = profile.setups[0]!;
        const roster = championRoster(profile, setup);
        const variant = roster.variant(0);
        const plan = (totals: typeof variant.none) => {
          const s = { ...variant.input };
          delete s.budgetMs;
          delete s.shouldStop;
          return { ...s, request: { ...s.request, totals } };
        };
        const none = (await client.probe({ plan: plan(variant.none) })) as ProbeAnswer;
        const baseline = none.stops.filter((stop) => stop.pick !== 'all-in');
        for (const hero of roster.heroes.filter((h) => h.onlyOn === undefined)) {
          const own = Math.max(1, hero.level);
          const best = new Map<string, number>();
          const today = new Map<string, number>();
          for (const level of levelsFrom(own, CAMPAIGN.heroChampion.levelStep))
            for (const star of STARS) {
              const answer = (await client.probe({
                plan: plan(variant.hero(hero.captainId, star, level)),
                against: {
                  probe: probeInfo({
                    id: `${key}:${hero.captainId}:${String(star)}:${String(level)}`,
                    family: 'captains',
                    label: '297',
                  }),
                  baseline,
                  rates: CAMPAIGN.markerRates,
                },
              })) as ProbeAnswer;
              const rating = answer.row === null ? Number.NaN : mean(answer.row.stops.map((s) => s.gain));
              best.set(`${String(star)}/${String(level)}`, rating);
              if (level === own && star === hero.star) today.set('now', rating);
            }
          table[`${key}|${hero.captainId}`] = { name: hero.name, best, today, own: hero.star };
        }
        wall.push(`${key}: ${f((performance.now() - began) / 1000)} s`);
        process.stderr.write(`[297] ${key} done ${f((performance.now() - began) / 1000)} s\n`);
      }
      for (const { leadership, dominance } of settings) {
        const key = `L${String(leadership)} D${String(dominance)}`;
        const rows = Object.entries(table)
          .filter(([k]) => k.startsWith(`${key}|`))
          .map(([, v]) => ({
            name: v.name,
            peak: Math.max(...[...v.best.values()].filter((x) => !Number.isNaN(x))),
            peakAt: [...v.best.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '',
            now: v.today.get('now') ?? Number.NaN,
            star5: Math.max(...[...v.best.entries()].filter(([p]) => p.startsWith('5/')).map(([, x]) => x)),
          }))
          .sort((a, b) => b.peak - a.peak);
        lines.push(
          `## ${key}`,
          '',
          '| rank | hero | best point | peak rating | today | best at ★5 |',
          '| --- | --- | --- | ---: | ---: | ---: |',
        );
        rows
          .slice(0, 8)
          .forEach((r, i) =>
            lines.push(
              `| ${String(i + 1)} | ${r.name} | ${r.peakAt} | ${f(r.peak, 2)} | ${f(r.now, 2)} | ${f(r.star5, 2)} |`,
            ),
          );
        const third = rows[2]?.peak ?? 0;
        lines.push(
          '',
          `Within 10 % of third: ${rows
            .filter((r) => r.peak >= third * 0.9)
            .map((r) => r.name)
            .join(', ')}.`,
          '',
        );
      }
      lines.push('## Wall (inline, one worker)', '', ...wall.map((w) => `- ${w}`));
      expect(Object.keys(table).length).toBeGreaterThan(0);
    } finally {
      writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
  }, 14_400_000);
});
