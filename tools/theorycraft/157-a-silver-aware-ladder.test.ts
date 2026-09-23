/**
 * 157 — **a silver-aware ladder, rated on every benchmark use case** (2026-09-23; the owner: *"ok try the
 * silver-aware ladder as an experiment … and rate it against all benchmark use cases to check if it improves all
 * criteria"*).
 *
 * Complete optimization sizes the troops of a march as a set of stacks, and it chooses **which troop type
 * stands in which stack** on damage alone (`rankTroops`, the rung-order climb, the sizer). 156 measured that a
 * stack's silver is its HP times its type's silver a point of HP, and that the stacks the enemy kills before
 * they strike cost their whole retraining for nothing. So the lever is the **choice of types**, not only their
 * order.
 *
 * The silver-aware ladder, applied to every march of every stop the bar offers (as shipped):
 *
 *  - the march's hired stacks are kept exactly; its troop stacks are **slots**, each with its HP;
 *  - every assignment of distinct troop types the account holds to those slots is tried (exhaustively up to
 *    5 000 assignments, else a best-improvement climb of swaps and replacements from the march as it is), each
 *    type sized to **at least its slot's HP** — so the kill order's HP levels and the shelter hold;
 *  - an assignment is admissible when the leadership fits, the march deals **at least the damage it did**
 *    (worst opening) and its training queue is **no longer**; among those the **least silver** is kept. (The
 *    first run held damage alone, and the queue read up to 0.5 % worse on 12 use cases — the rounding up of each
 *    re-typed stack to its slot's HP.)
 *
 * Then every use case is rated, the bar as shipped against the bar with every stop re-typed: the ten criteria
 * (the bar's best on each), TotalStack at matched spend, and the bar's own criteria (order, no stop beaten by
 * another, every hired stack sheltered).
 *
 * `THEORY=1 npx vitest run tools/theorycraft/157-a-silver-aware-ladder.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planMarch } from '../../src/engine';
import type { PlanRow, PlanTotals } from '../../src/engine/plan';
import { effectiveTable, planCampaign } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
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
const gain = (after: number, before: number, r: Reading): number =>
  before === after
    ? 0
    : before === 0
      ? r.high
        ? 100
        : -100
      : ((r.high ? after - before : before - after) / Math.abs(before)) * 100;
const show = (r: Reading, v: number): string => {
  if (r.head === 'shortest queue') return `${n(Math.round(v / 3600))} h`;
  if (r.head === 'dmg a silver') return v.toFixed(3);
  if (r.head === 'dmg a coin' && v === 0) return '—';
  return n(Math.round(v));
};
const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const EXHAUSTIVE = 5_000;
/** `QUEUE=free` runs the first reading: damage held, the training queue left free. Its own report. */
const HOLD_QUEUE = process.env.QUEUE !== 'free';

/** One march priced the battle's way: its worst-opening damage and the silver its recovery plan costs. */
const score = (
  request: StackRequest,
  counts: Record<string, number>,
): { damage: number; silver: number; seconds: number } => {
  const { summary } = planMarch(request, counts);
  return { damage: summary.minDamage, silver: summary.recovery.silver, seconds: summary.recovery.seconds };
};

/**
 * The silver-aware re-typing of one march: the least-silver assignment of troop types to its troop slots that
 * deals at least the march's damage and fits the leadership. `null` when nothing beats the march as it is.
 */
const retype = (
  request: StackRequest,
  counts: Record<string, number>,
): { counts: Record<string, number>; tried: number; exhaustive: boolean } | null => {
  const table = effectiveTable(request).filter((e) => e.pool === 'leadership');
  const { result } = planMarch(request, counts);
  const slots = result.stacks.filter((s) => s.pool === 'leadership').map((s) => s.totalHp);
  if (slots.length === 0) return null;
  const hired: Record<string, number> = {};
  for (const s of result.stacks) if (s.pool !== 'leadership') hired[s.unitId] = s.count;
  const base = score(request, counts);
  const build = (types: number[]): Record<string, number> | null => {
    const next: Record<string, number> = { ...hired };
    let lead = 0;
    types.forEach((ti, slot) => {
      const t = table[ti];
      if (!t) return;
      const count = Math.ceil((slots[slot] ?? 0) / t.hp);
      next[t.id] = count;
      lead += count * t.cost;
    });
    return lead <= request.housing.leadership ? next : null;
  };
  let best: { counts: Record<string, number>; silver: number } | null = null;
  let tried = 0;
  const consider = (types: number[]): number => {
    const c = build(types);
    if (!c) return Infinity;
    tried += 1;
    const s = score(request, c);
    if (s.damage < base.damage - 1e-6) return Infinity;
    // No longer a training queue either (owner: "check if it improves all criteria"; the first run lost up to
    // 0.5 % of queue on 12 use cases to the rounding up of each re-typed stack).
    if (HOLD_QUEUE && s.seconds > base.seconds + 1e-6) return Infinity;
    if (s.silver < base.silver - 1e-6 && (!best || s.silver < best.silver))
      best = { counts: c, silver: s.silver };
    return s.silver;
  };
  const k = slots.length;
  const m = table.length;
  let perms = 1;
  for (let i = 0; i < k; i += 1) perms *= m - i;
  const exhaustive = perms <= EXHAUSTIVE;
  if (exhaustive) {
    const walk = (acc: number[], used: Set<number>): void => {
      if (acc.length === k) {
        consider(acc);
        return;
      }
      for (let i = 0; i < m; i += 1) {
        if (used.has(i)) continue;
        used.add(i);
        acc.push(i);
        walk(acc, used);
        acc.pop();
        used.delete(i);
      }
    };
    walk([], new Set());
  } else {
    // A best-improvement climb from the march as it stands: swap two slots, or put an unused type in a slot.
    const start = result.stacks
      .filter((s) => s.pool === 'leadership')
      .map((s) => table.findIndex((t) => t.id === s.unitId));
    let current = start;
    let currentSilver = base.silver;
    for (let step = 0; step < 60; step += 1) {
      let moved: { types: number[]; silver: number } | null = null;
      const neighbours: number[][] = [];
      for (let a = 0; a < k; a += 1) {
        for (let b = a + 1; b < k; b += 1) {
          const next = [...current];
          [next[a], next[b]] = [next[b] as number, next[a] as number];
          neighbours.push(next);
        }
        for (let t = 0; t < m; t += 1) {
          if (current.includes(t)) continue;
          const next = [...current];
          next[a] = t;
          neighbours.push(next);
        }
      }
      for (const next of neighbours) {
        const s = consider(next);
        if (s < currentSilver - 1e-6 && (!moved || s < moved.silver)) moved = { types: next, silver: s };
      }
      if (!moved) break;
      current = moved.types;
      currentSilver = moved.silver;
    }
  }
  const found = best as { counts: Record<string, number>; silver: number } | null;
  return found ? { counts: found.counts, tried, exhaustive } : null;
};

const sheltered = (request: StackRequest, counts: Record<string, number>): boolean => {
  const { result } = planMarch(request, counts);
  const troops = result.stacks.filter((s) => s.pool === 'leadership');
  if (troops.length === 0) return true;
  const floor = Math.min(...troops.map((s) => s.totalHp));
  return result.stacks.filter((s) => s.pool !== 'leadership').every((s) => s.totalHp < floor);
};

describe.skipIf(!process.env.THEORY)('a silver-aware ladder', () => {
  it('re-types every stop and rates every use case on every criterion', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report(`157-a-silver-aware-ladder${HOLD_QUEUE ? '' : '-queue-free'}`);
    report.add('# 157 — a silver-aware ladder, rated on every benchmark use case\n');
    report.add(
      'Every march of every stop on the bar as shipped (hired saver, fold to five, troop wall), its troop types ' +
        're-chosen for the least silver at no loss of damage (worst opening), each type at least its slot’s HP. ' +
        'Four-march campaigns, default recovery; the queue is one training queue’s total over the four marches, ' +
        'speed bonuses on, no speed-up items. **+** better, **−** worse.\n',
    );
    const summary: string[] = [
      '| use case | stops re-typed | ' +
        READINGS.map((r) => r.head).join(' | ') +
        ' | TS beaten | TS no fit | bar criteria |\n|---|---|' +
        '---|'.repeat(READINGS.length) +
        '---|---|---|',
    ];
    const stopRows: string[] = [];
    const better: Record<string, number> = {};
    const worse: Record<string, number> = {};
    const totals = {
      stops: 0,
      retyped: 0,
      beforeBeat: 0,
      beforeOut: 0,
      afterBeat: 0,
      afterOut: 0,
      broken: 0,
      cases: 0,
      allCriteriaNoWorse: 0,
    };

    for (const scenario of scenarios) {
      let plan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        continue;
      }
      if (plan.alternatives.length === 0) continue;
      totals.cases += 1;
      const before: Campaign[] = [];
      const after: Campaign[] = [];
      const afterRows: {
        pick: string;
        repeatDamage: number;
        repeatBurn: number;
        c: Campaign;
        marches: Record<string, number>[];
      }[] = [];
      let retyped = 0;
      for (const stop of plan.alternatives) {
        totals.stops += 1;
        const marches = marchesOf(stop as PlanTotals);
        const cache = new Map<string, Record<string, number>>();
        const next = marches.map((m) => {
          const key = JSON.stringify(Object.entries(m).sort());
          const hit = cache.get(key);
          if (hit) return hit;
          const r = retype(scenario.request, m);
          const out = r ? r.counts : m;
          cache.set(key, out);
          return out;
        });
        const changed = next.some((m, i) => m !== marches[i]);
        const a = campaignOf(scenario.request, stop.pick, 'plan', marches);
        const b = campaignOf(scenario.request, stop.pick, 'plan', next);
        before.push(a);
        after.push(b);
        const first = next[0] ?? {};
        afterRows.push({
          pick: stop.pick,
          repeatDamage: score(scenario.request, first).damage,
          repeatBurn: (stop as PlanRow).repeat.mercLost,
          c: b,
          marches: next,
        });
        if (changed) {
          retyped += 1;
          totals.retyped += 1;
          const troopsOf = (m: Record<string, number>): string =>
            Object.entries(m)
              .filter(
                ([id, c]) => c > 0 && scenario.request.units.find((u) => u.id === id)?.pool === 'leadership',
              )
              .map(([id, c]) => `${id} ${n(c)}`)
              .join(', ');
          stopRows.push(
            `| ${scenario.label.slice(0, 34)} | ${SHORT[stop.pick] ?? stop.pick} | ${troopsOf(marches[0] ?? {})} | ${troopsOf(first)} | ` +
              `${n(Math.round(a.damage))} → ${n(Math.round(b.damage))} | ${n(Math.round(a.silver))} → ${n(Math.round(b.silver))} | ` +
              `${(a.damage / a.silver).toFixed(3)} → ${(b.damage / b.silver).toFixed(3)} | ${n(Math.round(a.seconds / 3600))} h → ${n(Math.round(b.seconds / 3600))} h |`,
          );
        }
      }
      // The ten criteria, the bar's best on each.
      const changes = READINGS.map((r) => gain(barBest(after, r), barBest(before, r), r));
      READINGS.forEach((r, i) => {
        const c = changes[i] ?? 0;
        if (c > 1e-9) better[r.head] = (better[r.head] ?? 0) + 1;
        if (c < -1e-9) worse[r.head] = (worse[r.head] ?? 0) + 1;
      });
      if (changes.every((c) => c >= -1e-9)) totals.allCriteriaNoWorse += 1;
      // TotalStack at matched spend.
      const held = new Set(scenario.request.units.map((unit) => unit.id));
      const theirs: Campaign[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (!external.name.startsWith('TotalStack')) continue;
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const row = asCaptured(widenedFor(scenario.request, external.counts), external.name, external.counts);
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
      totals.beforeBeat += va.rowsBeaten;
      totals.beforeOut += va.unfitted;
      totals.afterBeat += vb.rowsBeaten;
      totals.afterOut += vb.unfitted;
      // The bar's own criteria on the re-typed bar.
      const broken: string[] = [];
      const rungs = afterRows.filter((r) => r.pick !== 'all-in');
      for (let i = 1; i < rungs.length; i += 1) {
        const p = rungs[i - 1];
        const q = rungs[i];
        if (p && q && (q.repeatBurn <= p.repeatBurn || q.repeatDamage <= p.repeatDamage))
          broken.push(`order at ${SHORT[q.pick] ?? q.pick}`);
      }
      for (const x of afterRows) {
        for (const y of afterRows) {
          if (x === y || x.pick === 'all-in' || y.pick === 'all-in') continue;
          const dom =
            x.c.damage >= y.c.damage &&
            x.c.silver <= y.c.silver &&
            x.c.burned <= y.c.burned &&
            x.c.gold <= y.c.gold &&
            (x.c.damage > y.c.damage ||
              x.c.silver < y.c.silver ||
              x.c.burned < y.c.burned ||
              x.c.gold < y.c.gold);
          if (dom) broken.push(`${SHORT[x.pick] ?? x.pick} beats ${SHORT[y.pick] ?? y.pick}`);
        }
        if (!x.marches.every((m) => sheltered(scenario.request, m)))
          broken.push(`${SHORT[x.pick] ?? x.pick} unsheltered`);
      }
      if (broken.length > 0) totals.broken += 1;
      summary.push(
        `| ${scenario.label.slice(0, 40)} | ${String(retyped)} of ${String(plan.alternatives.length)} | ` +
          READINGS.map((r, i) => {
            const c = changes[i] ?? 0;
            const v = show(r, barBest(after, r));
            return Math.abs(c) > 1e-9 ? `**${v} (${c > 0 ? '+' : '−'}${Math.abs(c).toFixed(1)} %)**` : v;
          }).join(' | ') +
          ` | ${String(va.rowsBeaten)} → ${String(vb.rowsBeaten)} | ${String(va.unfitted)} → ${String(vb.unfitted)} | ${broken.join('; ') || '✓'} |`,
      );
    }

    report.add('## Every use case — the bar re-typed against the bar as shipped\n');
    report.add(summary.join('\n'));
    report.add(
      `\n\n**${String(totals.retyped)} of ${String(totals.stops)}** stops re-typed. **${String(totals.allCriteriaNoWorse)} of ${String(totals.cases)}** ` +
        `use cases read no worse on any of the ten criteria. TotalStack at matched spend: ${String(totals.beforeBeat)} / ${String(totals.beforeOut)} → ` +
        `${String(totals.afterBeat)} / ${String(totals.afterOut)} (dominated / no stop fits). Use cases where a bar criterion breaks: ${String(totals.broken)}.\n\n` +
        '| criterion | use cases better | use cases worse |\n|---|---:|---:|\n' +
        READINGS.map(
          (r) => `| ${r.head} | ${String(better[r.head] ?? 0)} | ${String(worse[r.head] ?? 0)} |`,
        ).join('\n') +
        '\n',
    );
    report.add(
      '\n## Every re-typed stop\n\n| use case | stop | troops before (first march) | troops after | damage | silver | dmg a silver | queue |\n|---|---|---|---|---|---|---|---|\n' +
        stopRows.join('\n') +
        '\n',
    );
    report.save();
  }, 7_200_000);
});
