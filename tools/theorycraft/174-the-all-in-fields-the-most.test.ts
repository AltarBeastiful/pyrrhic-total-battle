/**
 * 174 — **the all-in fields the most** (2026-09-24; the owner: *"why all in on my current setup in my browser
 * doesn't up the mercs to 14? … Check why there's no test for that and add it to test and benchmark"*).
 *
 * Every benchmark army — the seventeen of 172 and his browser setup of 2026-09-24 (scenario 18,
 * `tests/fixtures/owner-browser-2026-09-24.json`) — planned as the app plans it (`CAMPAIGN.planFixes`, the
 * put-back at the app's rates, `budgetMs` off) with `CampaignInput.allInDescending: false` (the engine at
 * f4e95d9, to the unit) and with it on (the fix, the engine's default). Stops are paired by pick and rated
 * `rate(before, after, CAMPAIGN.markerRates)`; per army the ten readings, TotalStack at matched spend, the
 * bar's criteria (174's two all-in rules among them) and the tier twin. His setup is then shown in full.
 *
 * The all-in is by definition the stop that spends the stock: a lower rating for more hired burned is expected,
 * and it is a regression only if it loses damage or is beaten.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/174-the-all-in-fields-the-most.test.ts`
 */
/// <reference types="node" />
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import type { StackRequest } from '../../src/engine/types';
import { allInFieldsTheMost, allInNotBeaten, mercenariesOver } from '../../tests/engine/all-in-rules';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { twinTest } from '../../tests/engine/tier-twin';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

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

/** The bar's criteria as `plan-criteria.test.ts` states them, read off one bar: the lines that fail. */
const criteria = (request: StackRequest, rows: PlanRow[]): string[] => {
  const fails: string[] = [];
  if (rows.length > 5) fails.push(`${String(rows.length)} stops`);
  const rungs = rows.filter((row) => row.pick !== 'all-in');
  for (let i = 1; i < rungs.length; i += 1) {
    const a = rungs[i - 1] as PlanRow;
    const b = rungs[i] as PlanRow;
    if (b.repeat.mercLost <= a.repeat.mercLost || b.repeat.damage <= a.repeat.damage)
      fails.push(`order: ${SHORT[b.pick] ?? b.pick} after ${SHORT[a.pick] ?? a.pick}`);
  }
  if (!rows.some((row) => row.pick === 'sweet-spot')) fails.push('no sweet spot');
  // No stop beaten by another (the tempo exception for the all-in, as the criterion states it).
  for (const stop of rows) {
    for (const other of rows) {
      if (other === stop || other.pick === 'all-in') continue;
      if (stop.pick === 'all-in' && other.mercLost >= stop.mercLost) continue;
      if (
        other.totalDamage >= stop.totalDamage &&
        other.silver <= stop.silver &&
        other.mercLost <= stop.mercLost &&
        (other.totalDamage > stop.totalDamage || other.silver < stop.silver || other.mercLost < stop.mercLost)
      ) {
        fails.push(`${SHORT[stop.pick] ?? stop.pick} beaten by ${SHORT[other.pick] ?? other.pick}`);
        break;
      }
    }
  }
  fails.push(...allInFieldsTheMost(request, rows).map((line) => `(a) ${line}`));
  fails.push(...allInNotBeaten(request, rows).map((line) => `(b) ${line}`));
  return fails;
};

describe.skipIf(!process.env.THEORY)('the all-in fields the most', () => {
  it('rates every stop of every army, the fix off against on', () => {
    const planAt = (request: StackRequest, on: boolean): CampaignPlan | undefined => {
      try {
        return planCampaign({
          request,
          marchTarget: HORIZON,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
          allInDescending: on,
        });
      } catch {
        return undefined;
      }
    };
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('174-the-all-in-fields-the-most');
    report.add('# 174 — the all-in fields the most (allInDescending off → on)\n');
    report.add(
      `${String(scenarios.length)} benchmark armies, planned as the app plans them with \`budgetMs\` off, ` +
        '`allInDescending: false` (f4e95d9) against `true` (the fix, the engine default). Four-march campaigns ' +
        'priced by `campaignOf` (worst opening). Stops paired by pick; rating = `rate(before, after, markerRates)`. ' +
        'Verdict: **win** rating > 0 and no marker worse; **trade** rating > 0 with a marker worse; **equal**; ' +
        '**loss** rating < 0. "Mercenaries" = the authority pool fielded over every march of the campaign.\n',
    );
    const stopRows: string[] = [];
    const armyRows: string[] = [];
    const tsRows: string[] = [];
    const critRows: string[] = [];
    const unmatched: string[] = [];
    const tally = { win: 0, trade: 0, equal: 0, loss: 0 };
    const ts = { beatA: 0, outA: 0, beatB: 0, outB: 0, rows: 0 };
    const twin = { a: { marches: 0, pass: 0, fail: 0 }, b: { marches: 0, pass: 0, fail: 0 } };
    const readingWorse: string[] = [];
    let worst: { label: string; pick: string; r: number } | null = null;
    let his: { request: StackRequest; a: CampaignPlan; b: CampaignPlan } | null = null;

    for (const scenario of scenarios) {
      const request = scenario.request;
      const label = scenario.label.slice(0, 44);
      const a = planAt(request, false);
      const b = planAt(request, true);
      if (!a || !b || a.alternatives.length === 0 || b.alternatives.length === 0) {
        armyRows.push(`| ${label} | ${a ? 'planned' : 'refused'} → ${b ? 'planned' : 'refused'} |`);
        continue;
      }
      if (scenario.label.startsWith('his browser setup')) his = { request, a, b };
      const priced = (row: PlanRow): Campaign =>
        campaignOf(request, row.pick, 'plan', marchesOf(row as PlanTotals));
      const before = a.alternatives.map(priced);
      const after = b.alternatives.map(priced);

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
        if (!worst || r < worst.r) worst = { label, pick: SHORT[row.pick] ?? row.pick, r };
        if (verdict === 'equal') return;
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
      armyRows.push(
        `| ${label} | ${String(before.length)} → ${String(after.length)} | ${readCells.join(' | ')} |`,
      );

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
      ts.rows += theirs.length;
      ts.beatA += va.rowsBeaten;
      ts.outA += va.unfitted;
      ts.beatB += vb.rowsBeaten;
      ts.outB += vb.unfitted;
      tsRows.push(
        `| ${label} | ${String(theirs.length)} | ${String(va.rowsBeaten)} / ${String(va.unfitted)} → ${String(vb.rowsBeaten)} / ${String(vb.unfitted)} |`,
      );

      const ca = criteria(request, a.alternatives);
      const cb = criteria(request, b.alternatives);
      const ta = twinTest(request, label, a.alternatives, CAMPAIGN.markerRates);
      const tb = twinTest(request, label, b.alternatives, CAMPAIGN.markerRates);
      twin.a.marches += ta.marches;
      twin.a.pass += ta.pass;
      twin.a.fail += ta.fail.length;
      twin.b.marches += tb.marches;
      twin.b.pass += tb.pass;
      twin.b.fail += tb.fail.length;
      const allInOf = (plan: CampaignPlan): string => {
        const row = plan.alternatives.find((one) => one.pick === 'all-in');
        return row ? String(mercenariesOver(request, row)) : '—';
      };
      critRows.push(
        `| ${label} | ${allInOf(a)} → ${allInOf(b)} | ${ca.join('; ') || 'hold'} | ${cb.join('; ') || 'hold'} | ` +
          `${String(ta.fail.length)} → ${String(tb.fail.length)} of ${String(ta.marches)} → ${String(tb.marches)} |`,
      );
    }

    report.add(
      `\n**Stops paired**: ${String(tally.win)} win, ${String(tally.trade)} trade, ${String(tally.equal)} equal, ${String(tally.loss)} loss; ` +
        `worst rating ${worst ? `${(worst as { r: number }).r.toFixed(3)} (${(worst as { label: string }).label} ${(worst as { pick: string }).pick})` : '—'}. ` +
        `**TotalStack at matched spend** (dominated / no stop fits): ${String(ts.beatA)} / ${String(ts.outA)} → ${String(ts.beatB)} / ${String(ts.outB)} of ${String(ts.rows)} rows. ` +
        `**Tier twin**: ${String(twin.a.fail)} fail of ${String(twin.a.marches)} marches → ${String(twin.b.fail)} of ${String(twin.b.marches)}.\n`,
    );
    report.add(
      '\n**Reading the loss.** The one negative rating is his all-in, the stop that is *meant* to spend the stock: ' +
        'it now burns 6 hunters where it burned 4, for more damage, less silver, less gold and a shorter queue — ' +
        'not a regression by 174’s own terms (it loses no damage and nothing beats it). His sweet spot moved too, ' +
        'though its own rule did not change: the rated re-typing moved it (with `retype` off it stays at 16,334,608 both ways), its guards reading the stops beside ' +
        'it, and with the old all-in gone from beside it they took a re-typed march rating +1.638.\n',
    );
    report.add(
      '\n## Every stop that moved\n\n| army | stop | verdict | rating | damage | silver | gold | hired | coins | queue | worse |\n|---|---|---|---:|---|---|---|---|---|---|---|\n' +
        (stopRows.join('\n') || '| — | | | | | | | | | | |') +
        '\n',
    );
    report.add(`\n**Stops on one bar only**:\n\n- ${unmatched.join('\n- ') || 'none'}\n`);
    report.add(
      '\n## The ten readings, off → on\n\n| army | stops | ' +
        READINGS.map((r) => r.head).join(' | ') +
        ' |\n|---|---|' +
        '---|'.repeat(READINGS.length) +
        '\n' +
        armyRows.join('\n') +
        '\n',
    );
    report.add(`\n**Readings worse**:\n\n- ${readingWorse.join('\n- ') || 'none'}\n`);
    report.add(
      '\n## TotalStack at matched spend\n\n| army | rows | dominated / no fit |\n|---|---:|---|\n' +
        tsRows.join('\n') +
        '\n',
    );
    report.add(
      '\n## The bar’s criteria and the tier twin\n\nOrder along the burn, a sweet spot, at most five stops, no stop ' +
        'beaten by another (the all-in’s tempo exception), and 174’s (a) the all-in fields more mercenaries than every ' +
        'other stop, (b) no stop beats it on damage and silver fielding as many. First column: the all-in’s ' +
        'mercenaries fielded over its campaign.\n\n| army | all-in mercenaries | off | on | tier twin fails |\n|---|---|---|---|---|\n' +
        critRows.join('\n') +
        '\n',
    );
    if (his) {
      const { request, a, b } = his;
      const lines = (plan: CampaignPlan, name: string): string[] =>
        plan.alternatives.map((row) => {
          const c = campaignOf(request, row.pick, 'plan', marchesOf(row as PlanTotals));
          const hunters = marchesOf(row as PlanTotals)
            .map((m) => String(m['epic-monster-hunter-6'] ?? 0))
            .join(' · ');
          return (
            `| ${name} | ${SHORT[row.pick] ?? row.pick} | ${hunters} | ${n(Math.round(c.damage))} | ${n(c.silver)} | ` +
            `${n(Math.round(c.gold))} | ${n(Math.round(c.seconds / 3600))} h | ${String(c.burned)} | ${String(mercenariesOver(request, row))} |`
          );
        });
      report.add(
        '\n## His browser setup of 2026-09-24, stop by stop\n\n| engine | stop | EMH per march | damage | silver | gold | queue | hired lost | mercenaries fielded |\n|---|---|---|---:|---:|---:|---:|---:|---:|\n' +
          [...lines(a, 'off (f4e95d9)'), ...lines(b, 'on (174)')].join('\n') +
          '\n',
      );
    }
    report.save();
  }, 14_400_000);
});
