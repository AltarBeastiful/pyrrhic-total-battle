/**
 * 362 — **the hero report on fewer stops.** The report re-prices every stop of the lead march's bar for every solo
 * hero, every trio and the top trios again; does a cap of 1–3 stops keep the same view?
 *
 * Subsets of the lead bar (by pick): the full bar (reference), sweet only, the two ends (saver + all-in), three
 * spread (saver · sweet · all-in), sweet + steady max. Agreement with the reference, per situation (default, more
 * monsters, more mercs, other mercs): same best trio, same top-10 solo heroes (as a set), same top-1 solo hero.
 * Pass bar: best trio and top-10 on at least 95 % of situations, top-1 on all. Score drift is reported, not gated.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/362-hero-report-stop-cap.test.ts`
 * Writes `tools/theorycraft/out/362-hero-report-stop-cap.md`.
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { describe, expect, it } from 'vitest';

import { leadLineup } from '../../src/engine/captainUpgrades';
import type { HeroReport } from '../../src/engine/heroReport';
import type { PlanPick } from '../../src/engine/plan';
import { parseImport } from '../../src/share/exportImport';
import { captainLineups } from '../../src/state/captainLineups';
import { buildPlanRequest } from '../../src/state/derive';
import { heroRoster } from '../../src/state/heroRoster';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { createInlineClient } from '../../src/worker/client';
import { runHeroReport } from '../../src/worker/heroReport';
import { createCalcPool } from '../../src/worker/pool';

const OUT = 'tools/theorycraft/out/362-hero-report-stop-cap.md';
const NO_CLOCK = 1_000_000_000;
const FILES = [
  `${homedir()}/Downloads/pyrrhic-my-account-2026-10-22.json`,
  'pyrrhic-my-account-2026-10-11.json',
  'pyrrhic-my-account-2026-10-07.json',
];

const SUBSETS: { label: string; picks: PlanPick[][] }[] = [
  { label: 'full bar', picks: [] },
  // Each entry is a list of alternatives: the first pick present in the bar is used.
  { label: 'sweet only', picks: [['sweet-spot']] },
  { label: 'ends (saver + all-in)', picks: [['silver-saver', 'burn-saver'], ['all-in']] },
  { label: 'three (saver · sweet · all-in)', picks: [['silver-saver', 'burn-saver'], ['sweet-spot'], ['all-in']] },
  { label: 'sweet + steady max', picks: [['sweet-spot'], ['steady-max']] },
];

function load(file: string): { profile: Profile; setup: BattleSetup } | null {
  if (!existsSync(file)) return null;
  const parsed = parseImport(readFileSync(file, 'utf8'));
  if (parsed.kind !== 'profile') return null;
  const profile = structuredClone(parsed.payload) as Profile;
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
  return setup === undefined ? null : { profile, setup };
}

const topSolo = (report: HeroReport, n: number): string[] =>
  [...report.tiles].sort((a, b) => b.solo - a.solo).slice(0, n).map((tile) => tile.captainId);
const trioKey = (ids: readonly string[] | null | undefined): string => (ids === null || ids === undefined ? '—' : [...ids].sort().join('+'));
const f = (value: number, digits = 2): string => value.toFixed(digits);

describe.skipIf(!process.env.THEORY)('362 — hero report stop cap', () => {
  it('subsets against the full bar on the owner accounts', async () => {
    const lines: string[] = ['# 362 — the hero report on fewer stops', ''];
    const total: Record<string, { n: number; trio: number; top10: number; top1: number; seconds: number }> = {};
    for (const file of FILES) {
      const one = load(file);
      if (one === null) {
        lines.push(`## ${file}`, '', 'not found.', '');
        continue;
      }
      const pool = createCalcPool({ size: 1, createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }) });
      try {
        const input = buildPlanRequest(one.profile, one.setup);
        const { currentKey, lineups } = captainLineups(one.profile, one.setup);
        const advice = await runCaptainAdvice(input, lineups.map(({ key, totals }) => ({ key, totals })), currentKey, pool, { budgetMs: NO_CLOCK });
        const lead = leadLineup(advice.best, currentKey);
        const candidate = lineups.find((trio) => trio.key === lead);
        const bar = advice.plans[lead];
        if (candidate === undefined || bar === undefined) throw new Error('no lead lineup');
        lines.push(`## ${file}`, '', `Bar: ${bar.map((stop) => stop.pick).join(' · ')}.`, '');
        lines.push('| subset | stops | seconds | best trio same | top-10 same | top-1 same | trio gain (full → subset) |', '|---|---|---|---|---|---|---|');
        let reference: HeroReport | null = null;
        for (const subset of SUBSETS) {
          const stops =
            subset.picks.length === 0
              ? bar
              : subset.picks.flatMap((alts) => {
                  const hit = bar.find((stop) => alts.includes(stop.pick));
                  return hit === undefined ? [] : [hit];
                });
          const began = performance.now();
          const report = await runHeroReport(input, { key: lead, totals: candidate.totals, stops }, heroRoster(one.profile, one.setup), pool, { budgetMs: NO_CLOCK });
          const seconds = (performance.now() - began) / 1000;
          if (reference === null) reference = report;
          const rows = reference.situations.map((ref) => {
            const sit = report.situations.find((s) => s.id === ref.id);
            const top = (row: typeof ref | undefined): string[] =>
              Object.entries(row?.solo ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);
            const a = top(ref);
            const b = top(sit);
            return {
              trio: trioKey(ref.bestTrio) === trioKey(sit?.bestTrio),
              top10: a.length === b.length && a.every((id) => b.includes(id)),
              top1: ref.bestSolo === (sit?.bestSolo ?? null),
            };
          });
          // The default situation is the report itself.
          rows.push({
            trio: trioKey(reference.bestTrio?.captainIds) === trioKey(report.bestTrio?.captainIds),
            top10: topSolo(reference, 10).every((id) => topSolo(report, 10).includes(id)),
            top1: topSolo(reference, 1)[0] === topSolo(report, 1)[0],
          });
          const count = (key: 'trio' | 'top10' | 'top1'): number => rows.filter((row) => row[key]).length;
          lines.push(
            `| ${subset.label} | ${String(stops.length)} | ${f(seconds, 1)} | ${String(count('trio'))}/${String(rows.length)} | ${String(count('top10'))}/${String(rows.length)} | ${String(count('top1'))}/${String(rows.length)} | ${f(reference.bestTrio?.gain ?? 0)} → ${f(report.bestTrio?.gain ?? 0)} |`,
          );
          const acc = (total[subset.label] ??= { n: 0, trio: 0, top10: 0, top1: 0, seconds: 0 });
          acc.n += rows.length;
          acc.trio += count('trio');
          acc.top10 += count('top10');
          acc.top1 += count('top1');
          acc.seconds += seconds;
          // Drift of the solo score of the full-bar top five.
          const drift = topSolo(reference, 5).map((id) => {
            const a = reference?.tiles.find((tile) => tile.captainId === id)?.solo ?? 0;
            const b = report.tiles.find((tile) => tile.captainId === id)?.solo ?? 0;
            return `${id} ${f(a)}→${f(b)}`;
          });
          lines.push(`|  ↳ solo drift | | | | | | ${drift.join('; ')} |`);
        }
        lines.push('');
      } finally {
        pool.dispose();
      }
    }
    lines.push('## Totals over all accounts and situations', '', '| subset | situations | best trio | top-10 | top-1 | seconds |', '|---|---|---|---|---|---|');
    for (const [label, acc] of Object.entries(total))
      lines.push(`| ${label} | ${String(acc.n)} | ${f((100 * acc.trio) / acc.n, 0)} % | ${f((100 * acc.top10) / acc.n, 0)} % | ${f((100 * acc.top1) / acc.n, 0)} % | ${f(acc.seconds, 1)} |`);
    writeFileSync(OUT, lines.join('\n'));
    console.log(lines.join('\n'));
    expect(Object.keys(total).length).toBeGreaterThan(0);
  }, 3_600_000);
});
