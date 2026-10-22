/**
 * 260 — **the hero champion** (`docs/plans/the-hero-champion.md`, experiment gate). Before any UI: every hero rated on
 * one absolute grid (stars 0..6 × level steps), the champion and challenger under the average-lead score, the valleys
 * and packages on each star curve, the heroes another hero beats everywhere (Replaced), and where the score
 * disagrees with the simple "rating at the highest star" ranking.
 *
 * A grid point's rating is the hero alone (solo lineup) on the lead march's bar, mercs included: tier 1, the lead
 * stops' counts re-priced (`client.captains`). Tier 1 cries wolf on dips, so `FULL=1` also plans in full the curves of
 * the top `FULL_HEROES` heroes (default 2) at the level `FULL_LEVEL` (default the middle step), and prints both.
 * Cost: the screen of the whole grid and each full plan are timed.
 *
 * `THEORY=1 [FULL=1] [ACCOUNT=file] [LEVELS=10,20,30,40,50] pnpm vitest run tools/theorycraft/260-the-hero-champion.test.ts`
 * Writes `tools/theorycraft/out/260-the-hero-champion.md`.
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { captains as captainTable } from '../../src/data';
import { probeInfo } from '../../src/engine/advisor';
import { leadLineup } from '../../src/engine/captainUpgrades';
import { distinctCaptains } from '../../src/engine/captains';
import { parseImport } from '../../src/share/exportImport';
import { captainLineups, lineupTotals } from '../../src/state/captainLineups';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { CAMPAIGN } from '../../src/config';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { createInlineClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import type { PoolJob } from '../../src/worker/pool';
import type { ProbeAnswer } from '../../src/worker/protocol';

const OUT = 'tools/theorycraft/out/260-the-hero-champion.md';
const NO_CLOCK = 1_000_000_000;
const FILE = process.env.ACCOUNT ?? 'pyrrhic-my-account-2026-10-11.json';
const STEP = Number(process.env.STEP ?? 5);
const MAX_LEVEL = CAMPAIGN.captainMaxLevel;
/** From the level the hero is at (owner, 2026-10-23) up to the top level, every STEP levels. */
const levelsFrom = (level: number): number[] => {
  const out = [level];
  for (let l = (Math.floor(level / STEP) + 1) * STEP; l < MAX_LEVEL; l += STEP) out.push(l);
  if (level < MAX_LEVEL) out.push(MAX_LEVEL);
  return out;
};
const STARS = [0, 1, 2, 3, 4, 5, 6];
const f = (value: number, digits = 2): string => value.toFixed(digits);

interface Point {
  star: number;
  level: number;
}
const at = (p: Point): string => `${String(p.star)}/${String(p.level)}`;

describe.skipIf(!process.env.THEORY)('260 — the hero champion', () => {
  it('grid curves, champion, valleys, replaced, disagreements', async () => {
    const parsed = parseImport(readFileSync(FILE, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const profile = structuredClone(parsed.payload) as Profile;
    const setup = profile.setups[0]!;
    const pool = createCalcPool({ size: 1, createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }) });
    const lines = ['# 260 — the hero champion', '', `Account ${FILE}, setup ${setup.name}, each hero from its own level to ${String(MAX_LEVEL)} every ${String(STEP)}.`, ''];
    try {
      const input = buildPlanRequest(profile, setup);
      const { currentKey, lineups } = captainLineups(profile, setup);
      const advice = await runCaptainAdvice(input, lineups.map(({ key, totals }) => ({ key, totals })), currentKey, pool, {
        budgetMs: NO_CLOCK,
      });
      const lead = leadLineup(advice.best, currentKey);
      const allStops = advice.plans[lead]!;
      // Trimmed bar (owner, 2026-10-23): the silver saver, the sweet spot and the stop below the all-in.
      const allInAt = allStops.findIndex((row) => row.pick === 'all-in');
      const below = allStops[(allInAt === -1 ? allStops.length : allInAt) - 1];
      const stops = allStops.filter((row) => row.pick === 'silver-saver' || row.pick === 'sweet-spot' || row === below);
      const settings = { ...input };
      delete settings.budgetMs;
      delete settings.shouldStop;

      // The heroes with a fighting line, as the roster has them; each rated alone at every grid point.
      const owned = distinctCaptains(profile.sources.captains).filter((entry) => {
        const r = captainTable.find((c) => c.id === entry.captainId);
        return r?.health !== undefined || r?.strength !== undefined || r?.special !== undefined;
      });
      const levelsOf = (e: (typeof owned)[number]): number[] => levelsFrom(Math.max(1, e.level));
      const pointsOf = (e: (typeof owned)[number]): Point[] => STARS.flatMap((star) => levelsOf(e).map((level) => ({ star, level })));
      const key = (id: string, p: Point): string => `${id}@${at(p)}`;
      const lineupOf = (entry: (typeof owned)[number], p: Point) => {
        const raised: Profile = {
          ...profile,
          sources: {
            ...profile.sources,
            captains: profile.sources.captains.map((c) => (c.id === entry.id ? { ...c, level: p.level, star: p.star } : c)),
          },
        };
        return { key: key(entry.captainId, p), totals: lineupTotals(raised, setup, [entry.id]) };
      };
      const none = { key: '', totals: lineupTotals(profile, setup, []) };
      const screenLineups = [none, ...owned.flatMap((e) => pointsOf(e).map((p) => lineupOf(e, p)))];

      // 1. The screen of the whole grid, timed.
      const began = performance.now();
      const outcome = await pool.map(
        [
          (client, signal) =>
            client.captains(
              {
                request: settings.request,
                lineups: screenLineups,
                currentKey: '',
                stops: stops.map((s) => ({ pick: s.pick, counts: s.counts })),
                rates: CAMPAIGN.markerRates,
              },
              signal,
            ),
        ],
        { budgetMs: NO_CLOCK },
      );
      const screenSeconds = (performance.now() - began) / 1000;
      const answer = outcome[0];
      if (answer?.kind !== 'done') throw new Error('screen failed');
      const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
      const rating = new Map(answer.value.screens.map((s) => [s.key, mean(s.repriced)]));
      lines.push(
        `Bar of the lead march: ${allStops.map((r) => r.pick).join(' · ')}; kept ${stops.map((r) => r.pick).join(' · ')}.`, `${String(owned.length)} heroes, ${String(owned.flatMap(pointsOf).length)} lineups, ${String(stops.length)} stops: screen ${f(screenSeconds, 1)} s.`,
        '',
      );

      const name = (id: string): string => captainTable.find((c) => c.id === id)?.name ?? id;
      let source = rating;
      const rate = (id: string, p: Point): number => source.get(key(id, p)) ?? Number.NaN;
      const reaches = (id: string, p: Point): boolean => source.has(key(id, p));
      const entryOf = (id: string) => owned.find((o) => o.captainId === id)!;
      const mine = (id: string): Point[] => pointsOf(entryOf(id));
      // A hero that counts on one kind of march only (Amanitore: group; Hercules: epic) is no solo-march champion:
      // it is listed apart, as the report rates it on its own.
      const situational = owned.filter((e) => captainTable.find((c) => c.id === e.captainId)?.onlyOn !== undefined).map((e) => e.captainId);
      const ids = owned.map((e) => e.captainId).filter((id) => !situational.includes(id));

      const present = (title: string): void => {
        lines.push(`# ${title}`, '', situational.length === 0 ? '' : `Left out of the race (they count on one kind of march only): ${situational.map(name).join(', ')}.`, '');
        // 2. Champion: average lead over the best other hero, every point weighted equally.
        const lead1 = (id: string, rate1: (id: string, p: Point) => number): { avg: number; wins: number; n: number } => {
          let sum = 0;
          let wins = 0;
          let n = 0;
          for (const p of mine(id)) {
            const rivals = ids.filter((o) => o !== id && reaches(o, p)).map((o) => rate1(o, p));
            if (rivals.length === 0) continue;
            const d = rate1(id, p) - Math.max(...rivals);
            sum += d;
            n += 1;
            if (d > 0) wins += 1;
          }
          return { avg: n === 0 ? 0 : sum / n, wins, n };
        };
        const board = ids
          .map((id) => ({ id, ...lead1(id, rate), top: rate(id, { star: 6, level: MAX_LEVEL }) }))
          .sort((a, b) => b.avg - a.avg);
        lines.push('## Champion (average lead over the best other hero)', '', '| # | hero | avg lead | leads at | rating ★6 top level | now |', '|---|---|---|---|---|---|');
        board.forEach((b, i) => {
          const e = owned.find((o) => o.captainId === b.id)!;
          lines.push(`| ${String(i + 1)} | ${name(b.id)} | ${f(b.avg)} | ${String(b.wins)}/${String(b.n)} | ${f(b.top)} | L${String(e.level)} ★${String(e.star)} |`);
        });
        const champion = board[0]!;
        const challenger = board[1];
        lines.push('', `Champion **${name(champion.id)}**, challenger **${challenger ? name(challenger.id) : '—'}**.`);
        if (challenger) {
          const shared = mine(champion.id).filter((p) => reaches(challenger.id, p));
          const flips = shared.filter((p) => rate(challenger.id, p) > rate(champion.id, p));
          lines.push(`Challenger overtakes at ${String(flips.length)}/${String(shared.length)} shared points: ${flips.map(at).join(' ') || '—'} (star/level). Margin ${f(champion.avg - challenger.avg)} → ${Math.abs(champion.avg - challenger.avg) < 0.5 ? 'NO CLEAR MARGIN' : 'clear'}.`);
        }

        // 3. Disagreement with the rating at the highest star (top level).
        const topAt = { star: 6, level: MAX_LEVEL };
        const byTop = [...ids].sort((a, b) => rate(b, topAt) - rate(a, topAt));
        lines.push('', '## Score against "rating at the highest star"', '', `By top rating: ${byTop.map((id, i) => `${String(i + 1)}. ${name(id)} ${f(rate(id, topAt))}`).join(' · ')}`);
        const disagree = board.map((b, i) => ({ id: b.id, avg: i + 1, top: byTop.indexOf(b.id) + 1 })).filter((d) => d.avg !== d.top);
        lines.push('', disagree.length === 0 ? 'The two rankings agree.' : `Rank by avg lead → by top rating: ${disagree.map((d) => `${name(d.id)} ${String(d.avg)}→${String(d.top)}`).join(', ')}.`);

        // 4. Curves (star curve at each level), valleys and packages.
        lines.push('', '## Curves, valleys, packages (tier 1)', '');
        const valleys = (curve: number[]): string[] => {
          const out: string[] = [];
          for (let s = 1; s < curve.length; s += 1) {
            if (curve[s]! >= curve[s - 1]! - 1e-9) continue;
            const before = curve[s - 1]!;
            const rec = curve.findIndex((v, i) => i > s && v > before);
            out.push(
              rec === -1
                ? `★${String(s - 1)}→★${String(s)} loses ${f(before - curve[s]!)}: DEAD END (never recovers)`
                : `★${String(s)} loses ${f(before - curve[s]!)}, ★${String(rec)} recovers and gains ${f(curve[rec]! - before)} over ★${String(s - 1)} (package ★${String(s - 1)}→★${String(rec)} ${f(curve[rec]! - before, 2)})`,
            );
          }
          return out;
        };
        for (const id of ids) {
          const e = owned.find((o) => o.captainId === id)!;
          lines.push(`### ${name(id)} (now L${String(e.level)} ★${String(e.star)})`, '', `| level | ${STARS.map((s) => `★${String(s)}`).join(' | ')} |`, `|---|${STARS.map(() => '---').join('|')}|`);
          for (const level of levelsOf(e)) lines.push(`| ${String(level)} | ${STARS.map((star) => f(rate(id, { star, level }))).join(' | ')} |`);
          const v = levelsOf(e).flatMap((level) => valleys(STARS.map((star) => rate(id, { star, level }))).map((t) => `L${String(level)}: ${t}`));
          lines.push('', v.length === 0 ? 'No valley.' : v.join('\n\n'), '');
        }

        // 5. Replaced: another hero beats it at every grid point.
        const beats = (o: string, id: string): boolean => {
          const shared = mine(id).filter((p) => reaches(o, p));
          return shared.length > 0 && shared.every((p) => rate(o, p) > rate(id, p));
        };
        const replaced = ids.filter((id) => ids.some((o) => o !== id && beats(o, id)));
        lines.push('## Replaced (beaten by one hero at every point both reach)', '', replaced.length === 0 ? 'None.' : replaced.map((id) => `${name(id)} (by ${name(ids.find((o) => o !== id && beats(o, id))!)})`).join(', '), '');
      };

      present('Tier 1 (the lead stops re-priced)');

      // 6. Every grid point planned in full, timed; the same views again on those readings.
      if (process.env.FULL) {
        const planOf = (totals: typeof none.totals) => ({ ...settings, request: { ...settings.request, totals } });
        const t0 = performance.now();
        const noneOut = await pool.map([(c, s) => c.probe({ plan: planOf(none.totals) }, s)], { budgetMs: NO_CLOCK });
        if (noneOut[0]?.kind !== 'done') throw new Error('baseline');
        const whole = (noneOut[0].value as ProbeAnswer).stops;
        // The march with no hero has its own bar (it lacks the silver saver and the steady max): the all-in goes, the rest is read.
        const baseline = whole.filter((row) => row.pick !== 'all-in');
        lines.push(`Baseline bar (no hero): ${whole.map((r) => r.pick).join(' · ')}; read ${baseline.map((r) => r.pick).join(' · ')}.`, '');
        const planned = new Map<string, number>();
        const jobs = owned.flatMap((e) => pointsOf(e).map((p) => lineupOf(e, p)));
        const outs = await pool.map(
          jobs.map(
            (l): PoolJob<ProbeAnswer> =>
              (c, s) =>
                c.probe(
                  { plan: planOf(l.totals), against: { probe: probeInfo({ id: l.key, family: 'captains', label: l.key }), baseline, rates: CAMPAIGN.markerRates } },
                  s,
                ),
          ),
          { budgetMs: NO_CLOCK },
        );
        jobs.forEach((l, i) => {
          const r = outs[i];
          planned.set(l.key, r?.kind === 'done' && r.value.row ? mean(r.value.row.stops.map((x) => x.gain)) : Number.NaN);
        });
        const secs = (performance.now() - t0) / 1000;
        lines.push(`## Full plans\n\n${String(jobs.length)} plans (+ baseline) in ${f(secs, 0)} s on one worker (${f(secs / jobs.length, 2)} s each); ${String(baseline.length)} stops each.`, '');
        const tier1 = rating;
        source = planned;
        present('Full plans');
        // Where tier 1 and the full plan name a different champion curve.
        const agree = [...planned].filter(([k, v]) => Math.abs(v - (tier1.get(k) ?? 0)) > 2).length;
        lines.push(`Tier 1 and full differ by more than 2 points on ${String(agree)} of ${String(jobs.length)} grid readings.`, '');
      }

    } finally {
      pool.dispose();
    }
    writeFileSync(OUT, lines.join('\n') + '\n');
    expect(lines.length).toBeGreaterThan(5);
  }, 6_000_000);
});
