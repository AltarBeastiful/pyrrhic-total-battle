/**
 * 169 — **tier order as a candidate of the re-typing** (W13 §2 step 1, `docs/plans/every-ordering.md`).
 *
 * `retypeMarch` (`src/engine/retype.ts`) with `tierCandidate`: the march's own types in S-22's kill order over
 * its own slots (the first to die on the biggest slot, each type at least its slot's HP, not re-scaled) is
 * always tried, and the non-exhaustive climb is seeded from three starts — the march as it is, that tier
 * order, and the ranking's order (`rankTroops`, the weakest per HP on the biggest slot). The best positive
 * rating over all of them is kept; every guard downstream in `plan.ts` is untouched. Flag:
 * `CAMPAIGN.planFixes.tierCandidate`.
 *
 * Every army of the benchmark set (160–168), planned twice with `budgetMs` **off** (so the deadline cannot make
 * a result depend on the machine): `off` (the flag off — the engine at HEAD) and `on`. Reported:
 *
 *  - **A.** per army, the re-typing's calls: exhaustive vs climb, and which start the kept assignment was
 *    found from (as-is / tier / ranking, or the exhaustive walk), read by wrapping `retypeMarch`;
 *  - **B.** the gate (§2): every stop rated against HEAD (`rate(off, on)`), paired by pick, a stop the bar
 *    re-chose rated against the stop it replaced; the ten readings; TotalStack at matched spend; the criteria;
 *  - **C.** the time the pass adds (`CampaignPlan.retype.ms`), against `RETYPE_SHARE` of the app's budget;
 *  - **D.** the owner's permanent test (§3): for every march on the bar, `rate(march, twin) ≤ 0.01`, the twin
 *    being the march's own types in kill order over its own slots, each at least its slot's HP, not re-scaled;
 *    twins the engine's rules make inadmissible (less damage, a silver saver's silver rise, over the
 *    leadership) listed, not asserted. Before (off) and after (on).
 *
 * `THEORY=1 npx vitest run tools/theorycraft/169-tier-order-as-a-candidate.test.ts`
 */
/// <reference types="node" />
import { writeFileSync } from 'node:fs';

import { describe, it, vi } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { buildKillOrder } from '../../src/engine/killOrder';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { effectiveTable, marchResult, planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import { chunks } from '../../src/engine/recovery';
import { marchBill } from '../../src/engine/retype';
import type * as RetypeModuleNs from '../../src/engine/retype';
import type { StackRequest } from '../../src/engine/types';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

type RetypeModule = typeof RetypeModuleNs;
/** Every call of `retypeMarch` the plan makes, recorded while `log169.on`. */
const log169 = vi.hoisted(() => ({
  on: false,
  calls: [] as { exhaustive: boolean; seed: string }[],
  /** Set once the test module has loaded: the mock factory cannot import `plan.ts` (a cycle). */
  troopSlots: null as null | ((request: StackRequest, counts: Record<string, number>) => [number, number]),
}));
vi.mock('../../src/engine/retype', async (importOriginal) => {
  const real = await importOriginal<RetypeModule>();
  return {
    ...real,
    retypeMarch: (...args: Parameters<typeof real.retypeMarch>) => {
      const found = real.retypeMarch(...args);
      if (log169.on) {
        const [request, counts] = args;
        const [k, m] = log169.troopSlots ? log169.troopSlots(request, counts) : [0, 0];
        let perms = 1;
        for (let i = 0; i < k; i += 1) perms *= m - i;
        log169.calls.push({
          exhaustive: k > 0 && perms <= real.EXHAUSTIVE,
          seed: found ? (found.seed ?? (found.exhaustive ? 'exhaustive' : 'as-is')) : 'none',
        });
      }
      return found;
    },
  };
});

log169.troopSlots = (request, counts) => [
  marchResult(request, counts).result.stacks.filter((s) => s.pool === 'leadership').length,
  effectiveTable(request).filter((e) => e.pool === 'leadership').length,
];

const RATES = CAMPAIGN.markerRates;
const TWIN_TOL = 0.01;
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
      tierCandidate: mode === 'on',
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

/** §3's twin: the march's own troop types in kill order over its own slots, biggest first; not re-scaled. */
const twinOf = (request: StackRequest, counts: Record<string, number>): Record<string, number> => {
  const table = new Map(effectiveTable(request).map((e) => [e.id, e]));
  const rank = new Map(buildKillOrder(request.units, request.options).map((id, i) => [id, i]));
  const { result } = marchResult(request, counts);
  const troops = result.stacks.filter((s) => s.pool === 'leadership' && s.count > 0);
  const slots = troops.map((s) => s.totalHp).sort((a, b) => b - a);
  const types = troops.map((s) => s.unitId).sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));
  const next: Record<string, number> = {};
  for (const s of result.stacks) if (s.pool !== 'leadership') next[s.unitId] = s.count;
  types.forEach((id, i) => (next[id] = Math.ceil((slots[i] ?? 0) / (table.get(id)?.hp ?? 1))));
  return next;
};
const leadershipOf = (request: StackRequest, counts: Record<string, number>): number => {
  let used = 0;
  for (const e of effectiveTable(request)) if (e.pool === 'leadership') used += (counts[e.id] ?? 0) * e.cost;
  return used;
};
interface TwinTally {
  marches: number;
  pass: number;
  fail: string[];
  inadmissible: string[];
}
const twinTest = (request: StackRequest, label: string, rows: PlanRow[]): TwinTally => {
  const tally: TwinTally = { marches: 0, pass: 0, fail: [], inadmissible: [] };
  const seen = new Set<string>();
  for (const row of rows) {
    for (const march of marchesOf(row as PlanTotals)) {
      const key = `${row.pick}|${JSON.stringify(Object.entries(march).sort())}`;
      if (seen.has(key)) continue;
      seen.add(key);
      tally.marches += 1;
      const twin = twinOf(request, march);
      const a = marchBill(request, march);
      const b = marchBill(request, twin);
      const why =
        leadershipOf(request, twin) > request.housing.leadership
          ? 'over the leadership'
          : b.damage < a.damage - 1e-6
            ? `less damage (${sgn(((b.damage - a.damage) / a.damage) * 100)} %)`
            : row.pick === 'silver-saver' && (b.silver ?? 0) > (a.silver ?? 0) + 1e-6
              ? 'silver saver’s silver rises'
              : '';
      const r = rate(a, b, RATES);
      if (why) {
        tally.inadmissible.push(`${label} ${short(row.pick)}: ${why}, rate ${sgn(r)}`);
        continue;
      }
      if (r <= TWIN_TOL) tally.pass += 1;
      else tally.fail.push(`${label} ${short(row.pick)} ${sgn(r)} (${marchText(request, march)})`);
    }
  }
  return tally;
};

describe.skipIf(!process.env.THEORY)('tier order as a candidate', () => {
  it('rates the tier candidate and three seeds against HEAD on every army', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('169-tier-order-as-a-candidate');
    report.add('# 169 — tier order as a candidate of the re-typing\n');
    report.add(
      'W13 §2 step 1 (`docs/plans/every-ordering.md`). `retypeMarch` with `CAMPAIGN.planFixes.tierCandidate`: the ' +
        'march’s own types in S-22’s kill order over its own slots (first to die on the biggest slot, each type at ' +
        'least its slot’s HP) always tried, and the climb seeded from the march as it is, that tier order and the ' +
        'ranking’s order (`rankTroops`). Every guard downstream untouched. Each army planned twice, `budgetMs` off: ' +
        '**off** (the engine at HEAD) and **on**. Four-march campaigns, worst opening (`campaignOf`); `rate(off, on, ' +
        'markerRates)`, **+** better, **−** worse. Training bonuses are not applied (W11 §6.1).\n',
    );

    const seedRows: string[] = [
      '| army | re-typings | exhaustive / climb | kept: exhaustive | kept: as-is | kept: tier | kept: ranking | none positive | off: kept / none |',
      '|---|---:|---|---:|---:|---:|---:|---:|---|',
    ];
    const gateRows: string[] = [
      '| army | stops off → on | better / equal / worse | worst | per stop | ' +
        READINGS.map((r) => r.head).join(' | ') +
        ' | TS matched off → on | criteria on |',
      '|---|---|---|---:|---|' + '---|'.repeat(READINGS.length) + '---|---|',
    ];
    const timeRows: string[] = [
      `| army | re-typing ms off | on | added | plan ms off | on | share of the ${n(CAMPAIGN.budgets.plan * 0.05)} ms deadline (on) |`,
      '|---|---:|---:|---:|---:|---:|---:|',
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
    const seedTot = { calls: 0, ex: 0, climb: 0, exhaustive: 0, 'as-is': 0, tier: 0, ranking: 0, none: 0 };
    const readWorse: Record<string, number> = {};
    const readBetter: Record<string, number> = {};
    const twins: Record<Mode, TwinTally> = {
      off: { marches: 0, pass: 0, fail: [], inadmissible: [] },
      on: { marches: 0, pass: 0, fail: [], inadmissible: [] },
    };
    let maxAdded = 0;
    let maxOn = 0;
    const dump: Record<string, unknown> = {};

    for (const scenario of scenarios) {
      const request = scenario.request;
      const label = scenario.label.slice(0, 44);
      log169.calls = [];
      log169.on = true;
      const off = plan(request, 'off');
      const offCalls = log169.calls;
      log169.calls = [];
      const on = plan(request, 'on');
      const onCalls = log169.calls;
      log169.on = false;
      dump[scenario.label] = off.plan?.alternatives ?? null;
      if (!off.plan || !on.plan || off.plan.alternatives.length === 0) {
        gateRows.push(`| ${label} | refused |`);
        continue;
      }
      // A. seeds
      const count = (s: string): number => onCalls.filter((c) => c.seed === s).length;
      const ex = onCalls.filter((c) => c.exhaustive).length;
      seedTot.calls += onCalls.length;
      seedTot.ex += ex;
      seedTot.climb += onCalls.length - ex;
      for (const s of ['exhaustive', 'as-is', 'tier', 'ranking', 'none'] as const) seedTot[s] += count(s);
      seedRows.push(
        `| ${label} | ${String(onCalls.length)} | ${String(ex)} / ${String(onCalls.length - ex)} | ${String(count('exhaustive'))} | ` +
          `${String(count('as-is'))} | ${String(count('tier'))} | ${String(count('ranking'))} | ${String(count('none'))} | ` +
          `${String(offCalls.filter((c) => c.seed !== 'none').length)} / ${String(offCalls.filter((c) => c.seed === 'none').length)} |`,
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

      // C. time
      const rOff = off.plan.retype?.ms ?? 0;
      const rOn = on.plan.retype?.ms ?? 0;
      maxAdded = Math.max(maxAdded, rOn - rOff);
      maxOn = Math.max(maxOn, rOn);
      timeRows.push(
        `| ${label} | ${n(rOff)} | ${n(rOn)} | ${n(rOn - rOff)} | ${n(off.ms)} | ${n(on.ms)} | ${((rOn / (CAMPAIGN.budgets.plan * 0.05)) * 100).toFixed(0)} % |`,
      );

      // D. twins
      for (const [mode, p] of [
        ['off', off.plan],
        ['on', on.plan],
      ] as const) {
        const t = twinTest(request, label, p.alternatives);
        twins[mode].marches += t.marches;
        twins[mode].pass += t.pass;
        twins[mode].fail.push(...t.fail);
        twins[mode].inadmissible.push(...t.inadmissible);
      }
    }
    if (process.env.DUMP169) writeFileSync(process.env.DUMP169, JSON.stringify(dump));

    report.add('\n## A. The re-typing’s calls, and which start the kept assignment came from (on)\n\n');
    report.add(seedRows.join('\n'));
    report.add(
      `\n\n**Totals:** ${String(seedTot.calls)} re-typings, ${String(seedTot.ex)} exhaustive / ${String(seedTot.climb)} climb; ` +
        `kept from the exhaustive walk ${String(seedTot.exhaustive)}, as-is ${String(seedTot['as-is'])}, tier ${String(seedTot.tier)}, ` +
        `ranking ${String(seedTot.ranking)}; none positive ${String(seedTot.none)}. A start is credited with an assignment it battled ` +
        'first (the three climbs share one memo, as-is climbed before tier, tier before ranking); “tier” includes the tier ' +
        'candidate itself, tried before any search.\n',
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
    report.add('\n## C. The time the pass adds (`CampaignPlan.retype.ms`, budget off)\n\n');
    report.add(timeRows.join('\n'));
    report.add(
      `\n\nWorst re-typing time on: ${n(maxOn)} ms; most added: ${n(maxAdded)} ms; the deadline in the app is ` +
        `RETYPE_SHARE 0.05 × ${n(CAMPAIGN.budgets.plan)} ms = ${n(CAMPAIGN.budgets.plan * 0.05)} ms.\n`,
    );
    report.add(
      '\n## D. The permanent test (§3): no march on the bar beaten by its own tier order by more than 0.01\n\n',
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
    for (const m of ['off', 'on'] as const) {
      report.add(`\n**Failures (${m}):**\n\n${twins[m].fail.map((f) => `- ${f}`).join('\n') || '- none'}\n`);
      report.add(
        `\n**Inadmissible twins (${m}):**\n\n${twins[m].inadmissible.map((f) => `- ${f}`).join('\n') || '- none'}\n`,
      );
    }
    report.add(
      '\n## E. Recorded (2026-09-24)\n\n' +
        '- **Without the own-slots twin** (the search alone, three seeds and the tier candidate): 6 better / 55 equal / ' +
        '0 worse, TotalStack 70/13, no reading worse, no criterion broken; the tier seed kept nothing (as-is 77, ranking ' +
        '9) and the permanent test stayed 19 pass / 3 fail. The three failures (message camp: MX’s repeat, the all-in’s ' +
        'last two marches) are re-typings of `archer-2 2 246, rider-2 914, rider-3 513` into `spearman-2 1 787, rider-3 ' +
        '514, rider-2 913`: rated on the slots of the march handed in, the kept march then stands on slots of its own ' +
        '(whole units), where its own tier order (rider-2 915 over rider-3 514) rates +0.03 above it. Hence the ' +
        'own-slots twin, offered to the kept march while it rates above it (this run): 8 / 53 / 0, 22 / 0.\n' +
        '- **Suite with the flag on**: 35 red / 1 161 (34 / 1 162 at HEAD); the one new red is a pin — ' +
        '`plan.test.ts` › the owner’s account at 7 000 leadership › the all-in is the campaign it was: 24,936,555 → ' +
        '24,945,884 damage for 12,715,900 → 12,717,200 silver (rated +0.03). Without the own-slots twin the same stop ' +
        'moved to 24,944,758 for 12,714,600 (better on both). Workers do not re-base pins, so the flag ships **off** ' +
        'until the owner registers it.\n',
    );
    const file = report.save();
    // eslint-disable-next-line no-console
    console.log(`written ${file}`);
  }, 7_200_000);
});
