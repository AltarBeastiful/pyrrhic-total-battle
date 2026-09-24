/**
 * 170 — **a tier seed for the rung order** (W13 §2 step 2, `docs/plans/every-ordering.md`).
 *
 * `makeScorer`'s `orderFor` (`src/engine/plan.ts`) learns which troop type takes which rung once a depth, by a
 * pairwise-swap climb from the ranking's order, on damage. With `CAMPAIGN.planFixes.tierSeed` it climbs a
 * second time from S-22's tier order (the same types, the first to die on the biggest rung) and keeps the
 * better of the two climbs by damage (the ranking's on a tie). The rating stays with the re-typing.
 *
 * Every army of the benchmark set, planned twice with `budgetMs` **off** (so the deadline cannot make a result
 * depend on the machine), everything else as the app ships (`CAMPAIGN.planFixes`, the put-back): `off` (the
 * engine at HEAD — the bar is byte-identical, checked with `DUMP170`) and `on`. Reported:
 *
 *  - **A.** per army, the rung orders learned, how often the tier seed's climb ends strictly above the
 *    ranking's (`CampaignPlan.rungOrder`), the extra ladders battled and the plan's wall-clock time;
 *  - **B.** the gate (§2): every stop rated against HEAD (`rate(off, on)`), paired by pick, a stop the bar
 *    re-chose rated against the stop it replaced; the ten readings; TotalStack at matched spend; the criteria;
 *  - **C.** the owner's permanent test (§3, `tests/engine/tier-twin.ts`), off and on.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/170-a-tier-seed-for-the-rung-order.test.ts`
 */
/// <reference types="node" />
import { writeFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanRow, PlanTotals, RungOrderLog } from '../../src/engine/plan';
import { marchResult, planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import { chunks } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import type { TwinTally } from '../../tests/engine/tier-twin';
import { emptyTally, twinTest } from '../../tests/engine/tier-twin';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

const RATES = CAMPAIGN.markerRates;
const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const short = (pick: string): string => SHORT[pick] ?? pick;
const billOf = (c: Campaign): Bill => ({
  damage: c.damage,
  silver: c.silver,
  gold: c.gold,
  hired: c.burned,
  dragonCoins: c.dragonCoins,
  seconds: c.seconds,
});
const READINGS = [
  { head: 'most damage', of: (c: Campaign) => c.damage, high: true },
  { head: 'least silver', of: (c: Campaign) => c.silver, high: false },
  { head: 'fewest hired', of: (c: Campaign) => c.burned, high: false },
  { head: 'least gold', of: (c: Campaign) => c.gold, high: false },
  { head: 'fewest coins', of: (c: Campaign) => c.dragonCoins, high: false },
  { head: 'shortest queue', of: (c: Campaign) => c.seconds, high: false },
  { head: 'dmg/silver', of: (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0), high: true },
  { head: 'dmg/hired', of: (c: Campaign) => c.hiredDamage / Math.max(1, c.burned), high: true },
  { head: 'dmg/gold', of: (c: Campaign) => (c.gold > 0 ? c.damage / c.gold : 0), high: true },
  { head: 'dmg/coin', of: (c: Campaign) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0), high: true },
] as const;
type Reading = (typeof READINGS)[number];
const barBest = (set: Campaign[], r: Reading): number =>
  r.high ? Math.max(...set.map((c) => r.of(c))) : Math.min(...set.map((c) => r.of(c)));
const gain = (after: number, before: number, r: Reading): number =>
  before === after
    ? 0
    : before === 0
      ? r.high
        ? 100
        : -100
      : ((r.high ? after - before : before - after) / Math.abs(before)) * 100;
const sgn = (v: number): string =>
  Math.abs(v) < 1e-9 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;
const marchText = (request: StackRequest, counts: Record<string, number>): string => {
  const pools = new Map(request.units.map((u) => [u.id, u.pool]));
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => (pools.get(a[0]) === 'leadership' ? 0 : 1) - (pools.get(b[0]) === 'leadership' ? 0 : 1))
    .map(([id, c]) => `${id} ${n(c)}${pools.get(id) === 'leadership' ? '' : '*'}`)
    .join(', ');
};

type Mode = 'off' | 'on';
const plan = (request: StackRequest, mode: Mode): { plan?: CampaignPlan; ms: number } => {
  const began = Date.now();
  try {
    const p = planCampaign({
      request,
      marchTarget: HORIZON,
      ...CAMPAIGN.planFixes,
      tierSeed: mode === 'on',
      putBack: CAMPAIGN.putBack,
    });
    return { plan: p, ms: Date.now() - began };
  } catch {
    return { ms: Date.now() - began };
  }
};

const sheltered = (request: StackRequest, counts: Record<string, number>): boolean => {
  const { result } = marchResult(request, counts);
  const troops = result.stacks.filter((s) => s.pool === 'leadership');
  if (troops.length === 0) return true;
  const floor = Math.min(...troops.map((s) => s.totalHp));
  return result.stacks.filter((s) => s.pool !== 'leadership').every((s) => s.totalHp < floor);
};
const sustained = (request: StackRequest, marches: Record<string, number>[]): boolean => {
  const left: Record<string, number> = {};
  for (const unit of request.units) {
    if (unit.pool !== 'authority') continue;
    const cap = request.caps[unit.id];
    if (cap !== undefined) left[unit.id] = cap;
  }
  for (const march of marches) {
    for (const [id, cap] of Object.entries(left)) {
      const count = march[id] ?? 0;
      if (count > cap) return false;
      left[id] = cap - chunks(count);
    }
  }
  return true;
};
const criteria = (request: StackRequest, rows: PlanRow[], priced: Campaign[]): string[] => {
  const broken: string[] = [];
  if (rows.length > 5) broken.push('more than five stops');
  if (!rows.some((row) => row.pick === 'sweet-spot')) broken.push('no sweet spot');
  const rungs = rows.filter((row) => row.pick !== 'all-in');
  for (let i = 1; i < rungs.length; i += 1) {
    const p = rungs[i - 1] as PlanRow;
    const q = rungs[i] as PlanRow;
    if (q.repeat.mercLost <= p.repeat.mercLost || q.repeat.damage <= p.repeat.damage)
      broken.push(`order at ${short(q.pick)}`);
  }
  rows.forEach((x, i) => {
    const cx = priced[i] as Campaign;
    rows.forEach((y, k) => {
      if (x === y || x.pick === 'all-in' || y.pick === 'all-in') return;
      const cy = priced[k] as Campaign;
      const dom =
        cx.damage >= cy.damage &&
        cx.silver <= cy.silver &&
        cx.burned <= cy.burned &&
        cx.gold <= cy.gold &&
        (cx.damage > cy.damage || cx.silver < cy.silver || cx.burned < cy.burned || cx.gold < cy.gold);
      if (dom) broken.push(`${short(x.pick)} beats ${short(y.pick)}`);
    });
    const marches = marchesOf(x as PlanTotals);
    if (!marches.every((m) => sheltered(request, m))) broken.push(`${short(x.pick)} unsheltered`);
    if (!sustained(request, marches)) broken.push(`${short(x.pick)} unsustained`);
  });
  return broken;
};

describe.skipIf(!process.env.THEORY)('a tier seed for the rung order', () => {
  it('rates the tier seed against HEAD on every army', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('170-a-tier-seed-for-the-rung-order');
    report.add('# 170 — a tier seed for the rung order\n');
    report.add(
      'W13 §2 step 2 (`docs/plans/every-ordering.md`). `orderFor` (`makeScorer`, `plan.ts`) with ' +
        '`CAMPAIGN.planFixes.tierSeed`: the swap climb that learns which type takes which rung climbs a second time ' +
        'from S-22’s tier order (the same types, the first to die on the biggest rung), and the better climb by ' +
        'damage is kept (the ranking’s on a tie). Each army planned twice, `budgetMs` off, the app’s fixes and ' +
        'put-back otherwise: **off** (the engine at HEAD) and **on**. Four-march campaigns, worst opening ' +
        '(`campaignOf`); `rate(off, on, markerRates)`, **+** better, **−** worse. Training bonuses are not applied ' +
        '(W11 §6.1).\n',
    );

    const seedRows: string[] = [
      '| army | rung orders learned | tier = ranking | tier climb wins | ties | ladders battled: ranking | tier (extra) | plan ms off | on | added |',
      '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ];
    const gateRows: string[] = [
      '| army | stops off → on | better / equal / worse | worst | per stop | ' +
        READINGS.map((r) => r.head).join(' | ') +
        ' | TS matched off → on | criteria on |',
      '|---|---|---|---:|---|' + '---|'.repeat(READINGS.length) + '---|---|',
    ];
    const moved: string[] = [];
    const tot = {
      b: 0,
      e: 0,
      w: 0,
      worst: Infinity,
      worstAt: '',
      broken: 0,
      tsOff0: 0,
      tsOff1: 0,
      tsOn0: 0,
      tsOn1: 0,
    };
    const seedTot: RungOrderLog & { msOff: number; msOn: number } = {
      learned: 0,
      tierWon: 0,
      tierTied: 0,
      tierSame: 0,
      rankingBattles: 0,
      tierBattles: 0,
      msOff: 0,
      msOn: 0,
    };
    const readWorse: Record<string, number> = {};
    const readBetter: Record<string, number> = {};
    const twins: Record<Mode, TwinTally> = { off: emptyTally(), on: emptyTally() };
    const dump: Record<string, unknown> = {};

    for (const scenario of scenarios) {
      const request = scenario.request;
      const label = scenario.label.slice(0, 44);
      const off = plan(request, 'off');
      const on = plan(request, 'on');
      dump[scenario.label] = off.plan?.alternatives ?? null;
      if (!off.plan || !on.plan || off.plan.alternatives.length === 0) {
        gateRows.push(`| ${label} | refused |`);
        continue;
      }
      // A. seeds
      const log = on.plan.rungOrder;
      if (log) {
        seedTot.learned += log.learned;
        seedTot.tierWon += log.tierWon;
        seedTot.tierTied += log.tierTied;
        seedTot.tierSame += log.tierSame;
        seedTot.rankingBattles += log.rankingBattles;
        seedTot.tierBattles += log.tierBattles;
      }
      seedTot.msOff += off.ms;
      seedTot.msOn += on.ms;
      seedRows.push(
        `| ${label} | ${String(log?.learned ?? 0)} | ${String(log?.tierSame ?? 0)} | ${String(log?.tierWon ?? 0)} | ${String(log?.tierTied ?? 0)} | ` +
          `${n(log?.rankingBattles ?? 0)} | ${n(log?.tierBattles ?? 0)} | ${n(off.ms)} | ${n(on.ms)} | ${n(on.ms - off.ms)} |`,
      );

      // B. gate
      const price = (p: CampaignPlan): Campaign[] =>
        p.alternatives.map((row) => campaignOf(request, row.pick, 'plan', marchesOf(row as PlanTotals)));
      const pOff = price(off.plan);
      const pOn = price(on.plan);
      const offRows = off.plan.alternatives;
      const onRows = on.plan.alternatives;
      const pairOf = new Map<number, number>();
      const usedOff = new Set<number>();
      onRows.forEach((row, i) => {
        const j = offRows.findIndex((o, jj) => o.pick === row.pick && !usedOff.has(jj));
        if (j >= 0) {
          pairOf.set(i, j);
          usedOff.add(j);
        }
      });
      const freeOff = offRows.map((_, j) => j).filter((j) => !usedOff.has(j));
      onRows.forEach((_, i) => {
        if (!pairOf.has(i) && freeOff.length > 0) pairOf.set(i, freeOff.shift() as number);
      });
      let b = 0;
      let e = 0;
      let w = 0;
      let worst = Infinity;
      const per: string[] = [];
      onRows.forEach((row, i) => {
        const j = pairOf.get(i);
        if (j === undefined) {
          per.push(`${short(row.pick)} new`);
          return;
        }
        const before = pOff[j] as Campaign;
        const after = pOn[i] as Campaign;
        const r = rate(billOf(before), billOf(after), RATES);
        if (r > 1e-9) b += 1;
        else if (r < -1e-9) w += 1;
        else e += 1;
        worst = Math.min(worst, r);
        if (r < tot.worst) {
          tot.worst = r;
          tot.worstAt = `${label} ${short(row.pick)}`;
        }
        const re =
          (offRows[j] as PlanRow).pick !== row.pick
            ? `(re-chose ${short((offRows[j] as PlanRow).pick)}) `
            : '';
        per.push(`${short(row.pick)} ${re}${sgn(r)}`);
        if (Math.abs(r) > 1e-9) {
          const bm = marchesOf(offRows[j] as PlanTotals);
          const am = marchesOf(row as PlanTotals);
          moved.push(
            `| ${label} | ${short((offRows[j] as PlanRow).pick)} → ${short(row.pick)} | ${marchText(request, bm[0] ?? {})} → ${marchText(request, am[0] ?? {})} | ` +
              `${n(Math.round(before.damage))} → ${n(Math.round(after.damage))} | ${n(Math.round(before.silver))} → ${n(Math.round(after.silver))} | ` +
              `${n(before.burned)} → ${n(after.burned)} | ${n(Math.round(before.gold))} → ${n(Math.round(after.gold))} | ` +
              `${n(Math.round(before.seconds / 3600))} → ${n(Math.round(after.seconds / 3600))} | ${sgn(r)} |`,
          );
        }
      });
      for (let j = 0; j < offRows.length; j += 1)
        if (![...pairOf.values()].includes(j)) per.push(`${short((offRows[j] as PlanRow).pick)} dropped`);
      tot.b += b;
      tot.e += e;
      tot.w += w;
      const changes = READINGS.map((r) => gain(barBest(pOn, r), barBest(pOff, r), r));
      READINGS.forEach((r, i) => {
        const c = changes[i] ?? 0;
        if (c > 1e-9) readBetter[r.head] = (readBetter[r.head] ?? 0) + 1;
        if (c < -1e-9) readWorse[r.head] = (readWorse[r.head] ?? 0) + 1;
      });
      const held = new Set(request.units.map((u) => u.id));
      const ts: Campaign[] = [];
      for (const x of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (!x.name.startsWith('TotalStack')) continue;
        if (Object.entries(x.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const row = asCaptured(widenedFor(request, x.counts), x.name, x.counts);
        if (row.damage > 0) ts.push(row);
      }
      const msOf = (set: Campaign[]): { rowsBeaten: number; unfitted: number } =>
        ts.length > 0 ? matchedSpend(set as Contender[], ts as Contender[]) : { rowsBeaten: 0, unfitted: 0 };
      const mOff = msOf(pOff);
      const mOn = msOf(pOn);
      tot.tsOff0 += mOff.rowsBeaten;
      tot.tsOff1 += mOff.unfitted;
      tot.tsOn0 += mOn.rowsBeaten;
      tot.tsOn1 += mOn.unfitted;
      const broken = criteria(request, onRows, pOn);
      const brokenOff = criteria(request, offRows, pOff);
      if (broken.length > 0) tot.broken += 1;
      gateRows.push(
        `| ${label} | ${String(offRows.length)} → ${String(onRows.length)} | ${String(b)} / ${String(e)} / ${String(w)} | ` +
          `${Number.isFinite(worst) ? sgn(worst) : '—'} | ${per.join(', ')} | ` +
          READINGS.map((_, i) => {
            const c = changes[i] ?? 0;
            return Math.abs(c) > 1e-9 ? `**${c > 0 ? '+' : '−'}${Math.abs(c).toFixed(2)} %**` : '0';
          }).join(' | ') +
          ` | ${String(mOff.rowsBeaten)}/${String(mOff.unfitted)} → ${String(mOn.rowsBeaten)}/${String(mOn.unfitted)} of ${String(ts.length)} | ` +
          `${broken.join('; ') || '✓'}${brokenOff.join('; ') !== broken.join('; ') ? ` (off: ${brokenOff.join('; ') || '✓'})` : ''} |`,
      );

      // C. twins
      for (const [mode, p] of [
        ['off', off.plan],
        ['on', on.plan],
      ] as const) {
        const t = twinTest(request, label, p.alternatives, RATES);
        twins[mode].marches += t.marches;
        twins[mode].pass += t.pass;
        twins[mode].fail.push(...t.fail);
        twins[mode].inadmissible.push(...t.inadmissible);
      }
    }
    if (process.env.DUMP170) writeFileSync(process.env.DUMP170, JSON.stringify(dump));

    report.add('\n## A. The rung orders learned, and where the tier seed’s climb won (on)\n\n');
    report.add(seedRows.join('\n'));
    report.add(
      `\n\n**Totals:** ${n(seedTot.learned)} rung orders learned; the tier order was the ranking’s already on ` +
        `${n(seedTot.tierSame)}; the tier seed’s climb ended strictly above the ranking’s on **${n(seedTot.tierWon)}**, on the same damage on ${n(seedTot.tierTied)}, below it on ` +
        `${n(seedTot.learned - seedTot.tierSame - seedTot.tierWon - seedTot.tierTied)}. ` +
        `Ladders battled: ${n(seedTot.rankingBattles)} by the ranking’s climb, **${n(seedTot.tierBattles)} extra** by the ` +
        `tier seed’s. Plan time over every army, budget off: ${n(seedTot.msOff)} ms off, ${n(seedTot.msOn)} ms on ` +
        `(${sgn(((seedTot.msOn - seedTot.msOff) / Math.max(1, seedTot.msOff)) * 100)} %).\n`,
    );
    report.add('\n## B. The gate: every stop against HEAD\n\n');
    report.add(gateRows.join('\n'));
    report.add(
      `\n\n**Totals.** Stops better / equal / worse: **${String(tot.b)} / ${String(tot.e)} / ${String(tot.w)}**; worst ` +
        `${Number.isFinite(tot.worst) ? `${sgn(tot.worst)} (${tot.worstAt})` : '—'}. TotalStack at matched spend ` +
        `(dominated / no fit): ${String(tot.tsOff0)}/${String(tot.tsOff1)} → **${String(tot.tsOn0)}/${String(tot.tsOn1)}**. ` +
        `Armies breaking a criterion (on): ${String(tot.broken)}.\n\n` +
        '| reading | armies better | armies worse |\n|---|---:|---:|\n' +
        READINGS.map(
          (r) => `| ${r.head} | ${String(readBetter[r.head] ?? 0)} | ${String(readWorse[r.head] ?? 0)} |`,
        ).join('\n') +
        '\n',
    );
    report.add(
      '\n### Every stop that moved\n\n| army | stop off → on | first march off → on | dmg | silver | hired | gold | queue h | rating |\n|---|---|---|---|---|---|---|---|---:|\n' +
        (moved.join('\n') || '| — |') +
        '\n',
    );
    report.add(
      '\n## C. The permanent test (§3): no march on the bar beaten by its own tier order by more than 0.01\n\n',
    );
    report.add(
      '| engine | marches | pass | fail | inadmissible twins |\n|---|---:|---:|---:|---:|\n' +
        (['off', 'on'] as const)
          .map(
            (m) =>
              `| ${m} | ${String(twins[m].marches)} | ${String(twins[m].pass)} | ${String(twins[m].fail.length)} | ${String(twins[m].inadmissible.length)} |`,
          )
          .join('\n') +
        '\n',
    );
    for (const m of ['off', 'on'] as const)
      report.add(`\n**Failures (${m}):**\n\n${twins[m].fail.map((f) => `- ${f}`).join('\n') || '- none'}\n`);
    const file = report.save();
    // eslint-disable-next-line no-console
    console.log(`written ${file}`);
  }, 7_200_000);
});
