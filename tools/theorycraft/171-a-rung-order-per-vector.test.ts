/**
 * 171 — **a rung order per vector** (W13 §2 step 3, `docs/plans/every-ordering.md`).
 *
 * `makeScorer`'s `orderFor` (`src/engine/plan.ts`) learns the rung order once per depth, on the first ladder
 * that fits, and reuses it for every mercenary vector and scale. This experiment keys it by (depth, vector,
 * scale) through a worktree-only flag `CampaignInput.perVector` (not in the engine at HEAD; the patch lived in
 * the experiment's worktree): `full` climbs from the ranking and from the cached order and keeps the best by
 * damage (never below the cached order on its own ladder); `warm` climbs only from the cached order; `warmNoScale`
 * keys by (depth, vector) only; `finale` relearns only for the final marches' ladders.
 *
 * Every benchmark army planned with `budgetMs` off, the app's fixes and put-back otherwise, once per mode, and
 * rated against `off` (HEAD). Also `full` against `off` with the re-typing turned off, to see whether the gain is
 * absorbed by it.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/171-a-rung-order-per-vector.test.ts`
 */
/// <reference types="node" />
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
/** The worktree engine's per-key counts, on top of HEAD's `RungOrderLog`. */
type KeyLog = RungOrderLog & {
  keys?: number;
  differs?: number;
  improved?: number;
  gainSum?: number;
  gainMax?: number;
  keyBattles?: number;
};
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

type Mode = 'off' | 'full' | 'warm' | 'warmNoScale' | 'finale' | 'offNoRetype' | 'fullNoRetype';
const plan = (request: StackRequest, mode: Mode): { plan?: CampaignPlan; ms: number } => {
  const began = Date.now();
  const perVector =
    mode === 'off' || mode === 'offNoRetype' ? undefined : mode === 'fullNoRetype' ? 'full' : mode;
  const noRetype = mode === 'offNoRetype' || mode === 'fullNoRetype';
  try {
    const p = planCampaign({
      request,
      marchTarget: HORIZON,
      ...CAMPAIGN.planFixes,
      ...(noRetype ? { retype: undefined } : {}),
      ...(perVector ? { perVector } : {}),
      putBack: CAMPAIGN.putBack,
    } as Parameters<typeof planCampaign>[0]);
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

type Gate = {
  b: number;
  e: number;
  w: number;
  worst: number;
  worstAt: string;
  broken: number;
  ts0: number;
  ts1: number;
  tsBase0: number;
  tsBase1: number;
  readBetter: Record<string, number>;
  readWorse: Record<string, number>;
  moved: string[];
  rows: string[];
};
const emptyGate = (): Gate => ({
  b: 0,
  e: 0,
  w: 0,
  worst: Infinity,
  worstAt: '',
  broken: 0,
  ts0: 0,
  ts1: 0,
  tsBase0: 0,
  tsBase1: 0,
  readBetter: {},
  readWorse: {},
  moved: [],
  rows: [],
});

const VARIANTS: Mode[] = (process.env.MODES171?.split(',') as Mode[] | undefined) ?? [
  'full',
  'warm',
  'warmNoScale',
  'finale',
];

describe.skipIf(!process.env.THEORY)('a rung order per vector', () => {
  it('rates a per-vector rung order against HEAD on every army', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('171-a-rung-order-per-vector');
    report.add('# 171 — a rung order per vector\n');
    report.add(
      'W13 §2 step 3 (`docs/plans/every-ordering.md`). `orderFor` learns the rung order once per depth and reuses it ' +
        'for every mercenary vector and scale. Here, behind a worktree-only flag, it is relearned per key: **full** ' +
        '(key depth · scale · vector; a climb from the ranking and one from the cached order, the best by damage, never ' +
        'below the cached order on that ladder), **warm** (same key, one climb from the cached order), **warmNoScale** ' +
        '(key depth · vector, climbed from the cached order), **finale** (warm, but only on the final marches’ ladders). ' +
        'Every army planned with `budgetMs` off, the app’s fixes and put-back otherwise; `rate(off, variant, markerRates)`, ' +
        '**+** better. Four-march campaigns, worst opening (`campaignOf`). Training bonuses are not applied (W11 §6.1).\n',
    );

    const orderRows: Record<string, string[]> = {};
    const orderTot: Record<
      string,
      {
        keys: number;
        differs: number;
        improved: number;
        gainSum: number;
        gainMax: number;
        battles: number;
        ms: number;
      }
    > = {};
    const gates: Record<string, Gate> = {};
    const twins: Record<string, TwinTally> = { off: emptyTally() };
    const allModes: Mode[] = [
      ...VARIANTS,
      ...(process.env.NORETYPE171 === '0' ? [] : (['fullNoRetype'] as Mode[])),
    ];
    for (const m of allModes) {
      orderRows[m] = [];
      orderTot[m] = { keys: 0, differs: 0, improved: 0, gainSum: 0, gainMax: 0, battles: 0, ms: 0 };
      gates[m] = emptyGate();
      twins[m] = emptyTally();
    }
    let msOff = 0;

    const tsOf = (scenario: (typeof scenarios)[number], request: StackRequest): Campaign[] => {
      const held = new Set(request.units.map((u) => u.id));
      const ts: Campaign[] = [];
      for (const x of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (!x.name.startsWith('TotalStack')) continue;
        if (Object.entries(x.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const row = asCaptured(widenedFor(request, x.counts), x.name, x.counts);
        if (row.damage > 0) ts.push(row);
      }
      return ts;
    };

    const gateOne = (
      g: Gate,
      label: string,
      request: StackRequest,
      ts: Campaign[],
      offRows: PlanRow[],
      onRows: PlanRow[],
    ): void => {
      const price = (rows: PlanRow[]): Campaign[] =>
        rows.map((row) => campaignOf(request, row.pick, 'plan', marchesOf(row as PlanTotals)));
      const pOff = price(offRows);
      const pOn = price(onRows);
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
        if (r < g.worst) {
          g.worst = r;
          g.worstAt = `${label} ${short(row.pick)}`;
        }
        const re =
          (offRows[j] as PlanRow).pick !== row.pick
            ? `(re-chose ${short((offRows[j] as PlanRow).pick)}) `
            : '';
        per.push(`${short(row.pick)} ${re}${sgn(r)}`);
        if (Math.abs(r) > 1e-9) {
          const bm = marchesOf(offRows[j] as PlanTotals);
          const am = marchesOf(row as PlanTotals);
          g.moved.push(
            `| ${label} | ${short((offRows[j] as PlanRow).pick)} → ${short(row.pick)} | ${marchText(request, bm[0] ?? {})} → ${marchText(request, am[0] ?? {})} | ` +
              `${n(Math.round(before.damage))} → ${n(Math.round(after.damage))} | ${n(Math.round(before.silver))} → ${n(Math.round(after.silver))} | ` +
              `${n(before.burned)} → ${n(after.burned)} | ${n(Math.round(before.gold))} → ${n(Math.round(after.gold))} | ` +
              `${n(Math.round(before.seconds / 3600))} → ${n(Math.round(after.seconds / 3600))} | ${sgn(r)} |`,
          );
        }
      });
      for (let j = 0; j < offRows.length; j += 1)
        if (![...pairOf.values()].includes(j)) per.push(`${short((offRows[j] as PlanRow).pick)} dropped`);
      g.b += b;
      g.e += e;
      g.w += w;
      const changes = READINGS.map((r) => gain(barBest(pOn, r), barBest(pOff, r), r));
      READINGS.forEach((r, i) => {
        const c = changes[i] ?? 0;
        if (c > 1e-9) g.readBetter[r.head] = (g.readBetter[r.head] ?? 0) + 1;
        if (c < -1e-9) g.readWorse[r.head] = (g.readWorse[r.head] ?? 0) + 1;
      });
      const msOf = (set: Campaign[]): { rowsBeaten: number; unfitted: number } =>
        ts.length > 0 ? matchedSpend(set as Contender[], ts as Contender[]) : { rowsBeaten: 0, unfitted: 0 };
      const mOff = msOf(pOff);
      const mOn = msOf(pOn);
      g.tsBase0 += mOff.rowsBeaten;
      g.tsBase1 += mOff.unfitted;
      g.ts0 += mOn.rowsBeaten;
      g.ts1 += mOn.unfitted;
      const broken = criteria(request, onRows, pOn);
      if (broken.length > 0) g.broken += 1;
      g.rows.push(
        `| ${label} | ${String(offRows.length)} → ${String(onRows.length)} | ${String(b)} / ${String(e)} / ${String(w)} | ` +
          `${Number.isFinite(worst) ? sgn(worst) : '—'} | ${per.join(', ')} | ` +
          READINGS.map((_, i) => {
            const c = changes[i] ?? 0;
            return Math.abs(c) > 1e-9 ? `**${c > 0 ? '+' : '−'}${Math.abs(c).toFixed(2)} %**` : '0';
          }).join(' | ') +
          ` | ${String(mOff.rowsBeaten)}/${String(mOff.unfitted)} → ${String(mOn.rowsBeaten)}/${String(mOn.unfitted)} of ${String(ts.length)} | ` +
          `${broken.join('; ') || '✓'} |`,
      );
    };

    for (const scenario of scenarios) {
      const request = scenario.request;
      const label = scenario.label.slice(0, 44);
      const ts = tsOf(scenario, request);
      const off = plan(request, 'off');
      msOff += off.ms;
      if (!off.plan || off.plan.alternatives.length === 0) continue;
      const offNoRetype = allModes.includes('fullNoRetype') ? plan(request, 'offNoRetype') : undefined;
      const t0 = twinTest(request, label, off.plan.alternatives, RATES);
      twins.off!.marches += t0.marches;
      twins.off!.pass += t0.pass;
      twins.off!.fail.push(...t0.fail);
      twins.off!.inadmissible.push(...t0.inadmissible);
      for (const m of allModes) {
        const on = plan(request, m);
        const tot = orderTot[m]!;
        tot.ms += on.ms;
        if (!on.plan) {
          gates[m]!.rows.push(`| ${label} | refused |`);
          continue;
        }
        const log = on.plan.rungOrder as KeyLog | undefined;
        const keys = log?.keys ?? 0;
        tot.keys += keys;
        tot.differs += log?.differs ?? 0;
        tot.improved += log?.improved ?? 0;
        tot.gainSum += log?.gainSum ?? 0;
        tot.gainMax = Math.max(tot.gainMax, log?.gainMax ?? 0);
        tot.battles += log?.keyBattles ?? 0;
        const baseMs = m === 'fullNoRetype' ? (offNoRetype?.ms ?? 0) : off.ms;
        orderRows[m]!.push(
          `| ${label} | ${String(log?.learned ?? 0)} | ${n(keys)} | ${n(log?.differs ?? 0)} | ${n(log?.improved ?? 0)} | ` +
            `${(log?.improved ?? 0) > 0 ? ((log?.gainSum ?? 0) / (log?.improved ?? 1)).toFixed(3) : '—'} | ${(log?.gainMax ?? 0).toFixed(3)} | ` +
            `${n(log?.rankingBattles ?? 0)} | ${n(log?.keyBattles ?? 0)} | ${n(baseMs)} | ${n(on.ms)} |`,
        );
        const baseRows = m === 'fullNoRetype' ? offNoRetype?.plan?.alternatives : off.plan.alternatives;
        if (baseRows) gateOne(gates[m]!, label, request, ts, baseRows, on.plan.alternatives);
        if (m !== 'fullNoRetype') {
          const t = twinTest(request, label, on.plan.alternatives, RATES);
          twins[m]!.marches += t.marches;
          twins[m]!.pass += t.pass;
          twins[m]!.fail.push(...t.fail);
          twins[m]!.inadmissible.push(...t.inadmissible);
        }
      }
      // eslint-disable-next-line no-console
      console.log(`done ${label}`);
    }

    report.add(
      `\nHEAD (off): plan time ${n(msOff)} ms over every army. The depth orders and their climbs are HEAD's own in every variant (columns “depth orders” and “battles: cached”).\n`,
    );
    report.add('\n## A. Does the learned order change? (per variant)\n');
    report.add(
      '\n`keys` — distinct (depth, vector, scale) ladders the plan asked for (for **finale**, only the final marches’); ' +
        '`differs` — the relearned order is not the cached one; `better` — it battles strictly more damage on that very ' +
        'ladder; mean / max — its damage gain on that ladder, %. `battles` — ladders battled to learn (cached order’s own ' +
        'climbs | the per-key relearning).\n',
    );
    for (const m of allModes) {
      const t = orderTot[m]!;
      report.add(`\n### ${m}\n\n`);
      report.add(
        '| army | depth orders | keys | differs | better | mean gain % | max gain % | battles: cached | per key | plan ms base | variant |\n' +
          '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n' +
          orderRows[m]!.join('\n'),
      );
      report.add(
        `\n\n**Totals (${m}):** ${n(t.keys)} keys; the order differs on **${n(t.differs)}** ` +
          `(${((t.differs / Math.max(1, t.keys)) * 100).toFixed(1)} %), a strictly better ladder on **${n(t.improved)}**, ` +
          `mean gain ${t.improved > 0 ? (t.gainSum / t.improved).toFixed(3) : '—'} %, max ${t.gainMax.toFixed(3)} %. ` +
          `${n(t.battles)} extra ladders battled; plan time ${n(t.ms)} ms against ${n(msOff)} ms ` +
          `(${sgn(((t.ms - msOff) / Math.max(1, msOff)) * 100)} %).\n`,
      );
    }
    report.add('\n## B. The gate: every stop against HEAD\n');
    report.add(
      '\n| variant | better / equal / worse | worst | TS matched base → variant | armies breaking a criterion | readings better | readings worse |\n|---|---|---:|---|---:|---|---|\n' +
        allModes
          .map((m) => {
            const g = gates[m]!;
            const rb = READINGS.filter((r) => (g.readBetter[r.head] ?? 0) > 0).map(
              (r) => `${r.head} ${String(g.readBetter[r.head])}`,
            );
            const rw = READINGS.filter((r) => (g.readWorse[r.head] ?? 0) > 0).map(
              (r) => `${r.head} ${String(g.readWorse[r.head])}`,
            );
            return (
              `| ${m}${m === 'fullNoRetype' ? ' (against off, both without the re-typing)' : ''} | ${String(g.b)} / ${String(g.e)} / ${String(g.w)} | ` +
              `${Number.isFinite(g.worst) ? `${sgn(g.worst)} (${g.worstAt})` : '—'} | ${String(g.tsBase0)}/${String(g.tsBase1)} → ${String(g.ts0)}/${String(g.ts1)} | ` +
              `${String(g.broken)} | ${rb.join(', ') || '—'} | ${rw.join(', ') || '—'} |`
            );
          })
          .join('\n') +
        '\n',
    );
    for (const m of allModes) {
      const g = gates[m]!;
      report.add(`\n### ${m}\n\n`);
      report.add(
        '| army | stops | better / equal / worse | worst | per stop | ' +
          READINGS.map((r) => r.head).join(' | ') +
          ' | TS matched | criteria |\n|---|---|---|---:|---|' +
          '---|'.repeat(READINGS.length) +
          '---|---|\n' +
          g.rows.join('\n') +
          '\n',
      );
      report.add(
        '\n**Every stop that moved**\n\n| army | stop | first march base → variant | dmg | silver | hired | gold | queue h | rating |\n|---|---|---|---|---|---|---|---|---:|\n' +
          (g.moved.join('\n') || '| — |') +
          '\n',
      );
    }
    report.add(
      '\n## C. The permanent test (§3)\n\n| engine | marches | pass | fail | inadmissible twins |\n|---|---:|---:|---:|---:|\n' +
        Object.entries(twins)
          .filter(([m]) => m !== 'fullNoRetype')
          .map(
            ([m, t]) =>
              `| ${m} | ${String(t.marches)} | ${String(t.pass)} | ${String(t.fail.length)} | ${String(t.inadmissible.length)} |`,
          )
          .join('\n') +
        '\n',
    );
    for (const [m, t] of Object.entries(twins))
      if (t.fail.length > 0)
        report.add(`\n**Failures (${m}):**\n\n${t.fail.map((f) => `- ${f}`).join('\n')}\n`);
    const file = report.save();
    // eslint-disable-next-line no-console
    console.log(`written ${file}`);
  }, 14_400_000);
});
