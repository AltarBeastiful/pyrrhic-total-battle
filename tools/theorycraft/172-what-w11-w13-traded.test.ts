/**
 * 172 — **what W11–W13 traded** (an independent check, 2026-09-24).
 *
 * Every benchmark army (the set of 160), planned at **dbe8d8f** (before W11: its own engine, its own
 * `CAMPAIGN.planFixes` and `CAMPAIGN.putBack`, loaded from a git worktree of that commit) and at **HEAD**, both with
 * `budgetMs` off. Both bars are priced the same way (HEAD's `campaignOf`, four-march campaigns, worst opening; the
 * battle model did not change between the two commits). Stops are paired by pick. For every pair, the campaign bill
 * before → after and `rate(before, after, CAMPAIGN.markerRates)` (HEAD's rating), with a verdict: **win** (rating
 * > 0, no marker worse), **trade** (rating > 0, some marker worse), **equal**, **loss** (rating < 0). Per army: the
 * ten readings of the bar (157's READINGS), TotalStack at matched spend, and the TotalStack rows no stop beats on
 * damage or rating (162's rule).
 *
 * `WT172=<worktree of dbe8d8f with node_modules linked> THEORY=1 npx vitest run tools/theorycraft/172-what-w11-w13-traded.test.ts`
 */
/// <reference types="node" />
import { writeFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import type { StackRequest } from '../../src/engine/types';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

const WT =
  process.env.WT172 ??
  '/tmp/claude-1000/-home-remi-projects-pyrrhic-totalbattle/c483a563-ebd7-4335-848c-c63c59ca2333/scratchpad/wt172';

const READINGS = [
  { head: 'most damage', of: (c: Campaign) => c.damage, high: true },
  { head: 'least silver', of: (c: Campaign) => c.silver, high: false },
  { head: 'fewest hired lost', of: (c: Campaign) => c.burned, high: false },
  { head: 'least gold', of: (c: Campaign) => c.gold, high: false },
  { head: 'fewest coins', of: (c: Campaign) => c.dragonCoins, high: false },
  { head: 'shortest queue', of: (c: Campaign) => c.seconds, high: false },
  { head: 'dmg a silver', of: (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0), high: true },
  { head: 'dmg a merc', of: (c: Campaign) => c.hiredDamage / Math.max(1, c.burned), high: true },
  { head: 'dmg a gold', of: (c: Campaign) => (c.gold > 0 ? c.damage / c.gold : 0), high: true },
  { head: 'dmg a coin', of: (c: Campaign) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0), high: true },
] as const;
type Reading = (typeof READINGS)[number];
const barBest = (set: Campaign[], r: Reading): number =>
  r.high ? Math.max(...set.map((c) => r.of(c))) : Math.min(...set.map((c) => r.of(c)));
const gain = (after: number, before: number, high: boolean): number =>
  before === after
    ? 0
    : before === 0
      ? high
        ? 100
        : -100
      : ((high ? after - before : before - after) / Math.abs(before)) * 100;
const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const billOf = (c: Campaign): Bill => ({
  damage: c.damage,
  silver: c.silver,
  gold: c.gold,
  hired: c.burned,
  dragonCoins: c.dragonCoins,
  seconds: c.seconds,
});
const MARKERS = [
  { key: 'damage', high: true },
  { key: 'silver', high: false },
  { key: 'gold', high: false },
  { key: 'hired', high: false },
  { key: 'dragonCoins', high: false },
  { key: 'seconds', high: false },
] as const;
const pct = (v: number): string => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)} %`;

type Planner = (input: Record<string, unknown>) => CampaignPlan;

describe.skipIf(!process.env.THEORY)('what W11–W13 traded', () => {
  it('rates every stop of every army, dbe8d8f against HEAD', async () => {
    const old = (await import(`${WT}/src/engine/plan.ts`)) as { planCampaign: Planner };
    const oldConfig = (await import(`${WT}/src/config.ts`)) as { CAMPAIGN: Record<string, unknown> };
    const OLD = oldConfig.CAMPAIGN as { planFixes: Record<string, unknown>; putBack: unknown };

    const planAt = (request: StackRequest, at: 'before' | 'after'): CampaignPlan | undefined => {
      try {
        return at === 'before'
          ? old.planCampaign({ request, marchTarget: HORIZON, ...OLD.planFixes, putBack: OLD.putBack })
          : planCampaign({ request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack });
      } catch {
        return undefined;
      }
    };

    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('172-what-w11-w13-traded');
    report.add('# 172 — what W11–W13 traded (dbe8d8f → HEAD)\n');
    report.add(
      'Every benchmark army planned at dbe8d8f (its own engine and config, from a worktree) and at HEAD, `budgetMs` ' +
        'off. Four-march campaigns priced by HEAD’s `campaignOf` (worst opening). Stops paired by pick; rating = ' +
        '`rate(before, after, markerRates)` (silver 5, gold 5, hired 5, coins 8, queue 40). Verdict: **win** rating > 0 ' +
        'and no marker worse; **trade** rating > 0 with a marker worse; **equal**; **loss** rating < 0.\n',
    );
    const stopRows: string[] = [];
    const armyRows: string[] = [];
    const tsRows: string[] = [];
    const unmatched: string[] = [];
    const dump: unknown[] = [];
    const tally = { win: 0, trade: 0, equal: 0, loss: 0 };
    const ts = { beatA: 0, outA: 0, beatB: 0, outB: 0, keptA: 0, keptB: 0, rows: 0 };
    const readingWorse: string[] = [];

    for (const scenario of scenarios) {
      const request = scenario.request;
      const label = scenario.label.slice(0, 44);
      const a = planAt(request, 'before');
      const b = planAt(request, 'after');
      if (!a || !b || a.alternatives.length === 0 || b.alternatives.length === 0) {
        armyRows.push(`| ${label} | ${a ? 'planned' : 'refused'} → ${b ? 'planned' : 'refused'} |`);
        continue;
      }
      const priced = (row: PlanRow): Campaign =>
        campaignOf(request, row.pick, 'plan', marchesOf(row as PlanTotals));
      const before = a.alternatives.map(priced);
      const after = b.alternatives.map(priced);
      const armyDump: Record<string, unknown> = {
        label: scenario.label,
        before: a.alternatives.map((r, i) => ({ pick: r.pick, bill: billOf(before[i] as Campaign) })),
        after: b.alternatives.map((r, i) => ({ pick: r.pick, bill: billOf(after[i] as Campaign) })),
      };

      b.alternatives.forEach((row, i) => {
        const j = a.alternatives.findIndex((o) => o.pick === row.pick);
        if (j < 0) {
          unmatched.push(`${label}: ${SHORT[row.pick] ?? row.pick} appears`);
          return;
        }
        const x = billOf(before[j] as Campaign);
        const y = billOf(after[i] as Campaign);
        const r = rate(x, y, CAMPAIGN.markerRates);
        const moves = MARKERS.map((m) => {
          const bx = x[m.key] ?? 0;
          const by = y[m.key] ?? 0;
          const change = bx === 0 ? (by === 0 ? 0 : 100) : ((by - bx) / bx) * 100;
          const worse = m.high ? by < bx * (1 - 1e-12) : by > bx * (1 + 1e-12);
          return { key: m.key, bx, by, change, worse };
        });
        const worse = moves.filter((m) => m.worse);
        const same = moves.every((m) => m.bx === m.by);
        const verdict =
          same || Math.abs(r) < 1e-9 ? 'equal' : r < 0 ? 'loss' : worse.length > 0 ? 'trade' : 'win';
        tally[verdict] += 1;
        const cell = (m: (typeof moves)[number]): string =>
          m.key === 'seconds'
            ? `${n(Math.round(m.bx / 3600))} h → ${n(Math.round(m.by / 3600))} h (${pct(m.change)})`
            : `${n(Math.round(m.bx))} → ${n(Math.round(m.by))} (${pct(m.change)})`;
        stopRows.push(
          `| ${label} | ${SHORT[row.pick] ?? row.pick} | **${verdict}** | ${r.toFixed(3)} | ` +
            moves.map(cell).join(' | ') +
            ` | ${worse.map((m) => `${m.key} ${pct(m.change)}`).join(', ') || '—'} |`,
        );
      });
      for (const row of a.alternatives)
        if (!b.alternatives.some((o) => o.pick === row.pick))
          unmatched.push(`${label}: ${SHORT[row.pick] ?? row.pick} disappears`);

      // The ten readings.
      const readCells = READINGS.map((r) => {
        const va = barBest(before, r);
        const vb = barBest(after, r);
        const g = gain(vb, va, r.high);
        if (g < -1e-9) readingWorse.push(`${label}: ${r.head} ${g.toFixed(3)} %`);
        const fmt = (v: number): string =>
          r.head === 'shortest queue'
            ? `${n(Math.round(v / 3600))} h`
            : r.head === 'dmg a silver'
              ? v.toFixed(3)
              : n(Math.round(v));
        return Math.abs(g) > 1e-9
          ? `${fmt(va)} → ${fmt(vb)} (${g > 0 ? '+' : '−'}${Math.abs(g).toFixed(2)} %)`
          : fmt(vb);
      });
      armyDump.readings = READINGS.map((r) => ({
        head: r.head,
        before: barBest(before, r),
        after: barBest(after, r),
        gain: gain(barBest(after, r), barBest(before, r), r.high),
      }));

      // TotalStack at matched spend, and 162's kept rows.
      const held = new Set(request.units.map((unit) => unit.id));
      const theirs: Campaign[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (!external.name.startsWith('TotalStack')) continue;
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const row = asCaptured(widenedFor(request, external.counts), external.name, external.counts);
        if (row.damage > 0) theirs.push(row);
      }
      const va =
        theirs.length > 0
          ? matchedSpend(before as Contender[], theirs as Contender[])
          : { rowsBeaten: 0, unfitted: 0 };
      const vb =
        theirs.length > 0
          ? matchedSpend(after as Contender[], theirs as Contender[])
          : { rowsBeaten: 0, unfitted: 0 };
      const keptBy = (stops: Campaign[]): number =>
        theirs.filter(
          (t) =>
            !stops.some((s) => s.damage >= t.damage || rate(billOf(t), billOf(s), CAMPAIGN.markerRates) > 0),
        ).length;
      const ka = keptBy(before);
      const kb = keptBy(after);
      ts.rows += theirs.length;
      ts.beatA += va.rowsBeaten;
      ts.outA += va.unfitted;
      ts.beatB += vb.rowsBeaten;
      ts.outB += vb.unfitted;
      ts.keptA += ka;
      ts.keptB += kb;
      armyDump.ts = { rows: theirs.length, before: va, after: vb, keptBefore: ka, keptAfter: kb };
      dump.push(armyDump);

      armyRows.push(
        `| ${label} | ${String(before.length)} → ${String(after.length)} | ${readCells.join(' | ')} |`,
      );
      tsRows.push(
        `| ${label} | ${String(theirs.length)} | ${String(va.rowsBeaten)} / ${String(va.unfitted)} → ${String(vb.rowsBeaten)} / ${String(vb.unfitted)} | ${String(ka)} → ${String(kb)} |`,
      );
    }

    report.add(
      `\n**Stops paired**: ${String(tally.win)} win, ${String(tally.trade)} trade, ${String(tally.equal)} equal, ${String(tally.loss)} loss. ` +
        `**TotalStack at matched spend** (dominated / no stop fits): ${String(ts.beatA)} / ${String(ts.outA)} → ${String(ts.beatB)} / ${String(ts.outB)} of ${String(ts.rows)} rows. ` +
        `**Rows no stop beats on damage or rating** (162): ${String(ts.keptA)} → ${String(ts.keptB)}.\n`,
    );
    report.add(
      '\n## Every stop\n\n| army | stop | verdict | rating | damage | silver | gold | hired | coins | queue | worse |\n|---|---|---|---:|---|---|---|---|---|---|---|\n' +
        stopRows.join('\n') +
        '\n',
    );
    if (unmatched.length > 0) report.add(`\n**Stops on one bar only**:\n\n- ${unmatched.join('\n- ')}\n`);
    report.add(
      '\n## The ten readings, before → after\n\n| army | stops | ' +
        READINGS.map((r) => r.head).join(' | ') +
        ' |\n|---|---|' +
        '---|'.repeat(READINGS.length) +
        '\n' +
        armyRows.join('\n') +
        '\n',
    );
    report.add(`\n**Readings worse**:\n\n- ${readingWorse.join('\n- ') || 'none'}\n`);
    report.add(
      '\n## TotalStack\n\n| army | rows | matched spend (dominated / no fit) | kept by 162’s rule |\n|---|---:|---|---|\n' +
        tsRows.join('\n') +
        '\n',
    );
    report.save();
    writeFileSync(`${WT}/../172-dump.json`, JSON.stringify(dump, null, 1));
  }, 14_400_000);
});
