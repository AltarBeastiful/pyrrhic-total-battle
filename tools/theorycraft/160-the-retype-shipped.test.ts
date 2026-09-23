/**
 * 160 — **the rated re-typing, shipped in the engine** (W11 §5 step 6; 2026-09-23).
 *
 * 157 re-typed the bar **after the fact**: the stops as shipped, each march handed to the silver-aware search
 * and the campaign re-priced outside the engine. 159 moved the search into the engine (`retypeMarch`) and
 * reproduced 157-rated to the unit. This is the pass itself (`CampaignInput.retype: 'rated'`, W11 §3.2–3.5):
 * inside `planCampaign`, after the put-back and its guard and **before S-94 and the fold**, so the rules that
 * still choose stops read re-typed campaigns — and the bar they build may differ from "the old bar, re-typed".
 *
 * On every benchmark army, the bar with the pass off against the bar with it on:
 *
 *  1. **157's table on the engine's own bar**: the owner's rating (`rate(off, on, CAMPAIGN.markerRates)` on the
 *     campaign bill — damage, silver, gold, hired burned, coins, queue) stop by stop, matched by name; the ten
 *     readings (the bar's best on each); TotalStack at matched spend; the bar's criteria on the new bar.
 *  2. **158's speed-up bill** (`speed-ups.ts`, 158's own code): queue, speed-ups consumed, waste, campaigns the
 *     owner's stock pays for, summed over every stop.
 *  3. **The time the pass adds**, as the engine clocks it (`CampaignPlan.retype.ms`), and whether its deadline
 *     (`RETYPE_SHARE` of the budget) ever cut it.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/160-the-retype-shipped.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planMarch } from '../../src/engine';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import { chunks } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';
import { bill as speedUpBill, ordersOf } from './speed-ups';

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
const billOf = (c: Campaign): Bill => ({
  damage: c.damage,
  silver: c.silver,
  gold: c.gold,
  hired: c.burned,
  dragonCoins: c.dragonCoins,
  seconds: c.seconds,
});

const sheltered = (request: StackRequest, counts: Record<string, number>): boolean => {
  const { result } = planMarch(request, counts);
  const troops = result.stacks.filter((s) => s.pool === 'leadership');
  if (troops.length === 0) return true;
  const floor = Math.min(...troops.map((s) => s.totalHp));
  return result.stacks.filter((s) => s.pool !== 'leadership').every((s) => s.totalHp < floor);
};
/** Every march fields no more of a capped hired type than the stock has left after the marches before it. */
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

const plan = (request: StackRequest, on: boolean): CampaignPlan | undefined => {
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      ...(on ? {} : { retype: undefined }),
      putBack: CAMPAIGN.putBack,
    });
  } catch {
    return undefined;
  }
};

describe.skipIf(!process.env.THEORY)('the retype shipped', () => {
  it('rates the engine’s re-typed bar against the bar without it, on every army', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report(`160-the-retype-shipped${process.env.SUFFIX ? `-${process.env.SUFFIX}` : ''}`);
    report.add('# 160 — the rated re-typing, shipped in the engine\n');
    report.add(
      "The bar with `retype: 'rated'` (the pass inside `planCampaign`, before S-94 and the fold) against the bar " +
        'without it. Four-march campaigns, the rest of `CAMPAIGN.planFixes` and `CAMPAIGN.putBack` as shipped. ' +
        'Stops are matched by name; **+** better, **−** worse. Rating = `rate(off, on, CAMPAIGN.markerRates)` on ' +
        'the campaign bill (damage-percent equivalents).\n',
    );
    const summary: string[] = [
      '| use case | stops off → on | re-typed | rated better / equal / worse | worst | ' +
        READINGS.map((r) => r.head).join(' | ') +
        ' | TS beaten | TS no fit | criteria on the new bar | pass time |\n|---|---|---|---|---:|' +
        '---|'.repeat(READINGS.length) +
        '---|---|---|---:|',
    ];
    const stopRows: string[] = [];
    const better: Record<string, number> = {};
    const worse: Record<string, number> = {};
    const t = {
      cases: 0,
      stopsOff: 0,
      stopsOn: 0,
      matched: 0,
      better: 0,
      equal: 0,
      worse: 0,
      worst: Infinity,
      worstAt: '',
      retyped: 0,
      damageDown: 0,
      beatA: 0,
      outA: 0,
      beatB: 0,
      outB: 0,
      broken: 0,
      allNoWorse: 0,
      slowest: { label: '', ms: 0 },
      cut: 0,
      queueA: 0,
      queueB: 0,
      consumedA: 0,
      consumedB: 0,
      campaignsA: 0,
      campaignsB: 0,
      fewerCampaigns: [] as string[],
      unmatched: [] as string[],
    };

    for (const scenario of scenarios) {
      const request = scenario.request;
      const off = plan(request, false);
      const on = plan(request, true);
      if (!off || !on || off.alternatives.length === 0) continue;
      t.cases += 1;
      const priced = (row: PlanRow): Campaign =>
        campaignOf(request, row.pick, 'plan', marchesOf(row as PlanTotals));
      const before = off.alternatives.map(priced);
      const after = on.alternatives.map(priced);
      t.stopsOff += before.length;
      t.stopsOn += after.length;
      const ms = on.retype?.ms ?? 0;
      if (ms > t.slowest.ms) t.slowest = { label: scenario.label, ms };
      if (on.retype?.cut) t.cut += 1;

      // The rating, stop by stop, matched by name.
      let b = 0;
      let e = 0;
      let w = 0;
      let worst = Infinity;
      let retyped = 0;
      on.alternatives.forEach((row, i) => {
        if (row.retyped) retyped += 1;
        const j = off.alternatives.findIndex((o) => o.pick === row.pick);
        const a = before[j];
        const c = after[i];
        if (j < 0 || !a || !c) {
          t.unmatched.push(
            `${scenario.label.slice(0, 40)}: ${SHORT[row.pick] ?? row.pick} only with the pass`,
          );
          return;
        }
        t.matched += 1;
        const r = rate(billOf(a), billOf(c), CAMPAIGN.markerRates);
        if (r > 1e-9) b += 1;
        else if (r < -1e-9) w += 1;
        else e += 1;
        worst = Math.min(worst, r);
        if (r < t.worst) {
          t.worst = r;
          t.worstAt = `${scenario.label.slice(0, 40)} ${SHORT[row.pick] ?? row.pick}`;
        }
        if (c.damage < a.damage) t.damageDown += 1;
        const offRow = off.alternatives[j] as PlanRow;
        if (JSON.stringify(marchesOf(offRow)) !== JSON.stringify(marchesOf(row))) {
          const troopsOf = (m: Record<string, number>): string =>
            Object.entries(m)
              .filter(([id, k]) => k > 0 && request.units.find((u) => u.id === id)?.pool === 'leadership')
              .map(([id, k]) => `${id} ${n(k)}`)
              .join(', ');
          stopRows.push(
            `| ${scenario.label.slice(0, 34)} | ${SHORT[row.pick] ?? row.pick} | ${troopsOf(offRow.counts)} | ${troopsOf(row.counts)} | ` +
              `${n(Math.round(a.damage))} → ${n(Math.round(c.damage))} | ${n(Math.round(a.silver))} → ${n(Math.round(c.silver))} | ` +
              `${(a.damage / a.silver).toFixed(3)} → ${(c.damage / c.silver).toFixed(3)} | ${n(Math.round(a.seconds / 3600))} h → ${n(Math.round(c.seconds / 3600))} h | ${r.toFixed(2)} |`,
          );
        }
      });
      for (const row of off.alternatives)
        if (!on.alternatives.some((o) => o.pick === row.pick))
          t.unmatched.push(
            `${scenario.label.slice(0, 40)}: ${SHORT[row.pick] ?? row.pick} only without the pass`,
          );
      t.better += b;
      t.equal += e;
      t.worse += w;
      t.retyped += retyped;

      // The ten readings.
      const changes = READINGS.map((r) => gain(barBest(after, r), barBest(before, r), r));
      READINGS.forEach((r, i) => {
        const c = changes[i] ?? 0;
        if (c > 1e-9) better[r.head] = (better[r.head] ?? 0) + 1;
        if (c < -1e-9) worse[r.head] = (worse[r.head] ?? 0) + 1;
      });
      if (changes.every((c) => c >= -1e-9)) t.allNoWorse += 1;

      // TotalStack at matched spend.
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
      t.beatA += va.rowsBeaten;
      t.outA += va.unfitted;
      t.beatB += vb.rowsBeaten;
      t.outB += vb.unfitted;

      // The bar's criteria on the new bar.
      const broken: string[] = [];
      const rows = on.alternatives;
      if (rows.length > 5) broken.push('more than five stops');
      if (!rows.some((row) => row.pick === 'sweet-spot')) broken.push('no sweet spot');
      const rungs = rows.filter((row) => row.pick !== 'all-in');
      for (let i = 1; i < rungs.length; i += 1) {
        const p = rungs[i - 1] as PlanRow;
        const q = rungs[i] as PlanRow;
        if (q.repeat.mercLost <= p.repeat.mercLost || q.repeat.damage <= p.repeat.damage)
          broken.push(`order at ${SHORT[q.pick] ?? q.pick}`);
      }
      rows.forEach((x, i) => {
        const cx = after[i] as Campaign;
        rows.forEach((y, k) => {
          if (x === y || x.pick === 'all-in' || y.pick === 'all-in') return;
          const cy = after[k] as Campaign;
          const dom =
            cx.damage >= cy.damage &&
            cx.silver <= cy.silver &&
            cx.burned <= cy.burned &&
            cx.gold <= cy.gold &&
            (cx.damage > cy.damage || cx.silver < cy.silver || cx.burned < cy.burned || cx.gold < cy.gold);
          if (dom) broken.push(`${SHORT[x.pick] ?? x.pick} beats ${SHORT[y.pick] ?? y.pick}`);
        });
        const marches = marchesOf(x as PlanTotals);
        if (!marches.every((m) => sheltered(request, m)))
          broken.push(`${SHORT[x.pick] ?? x.pick} unsheltered`);
        if (!sustained(request, marches)) broken.push(`${SHORT[x.pick] ?? x.pick} unsustained`);
        // S-58 B through the pass: the same stop fields every hired type it fielded without it.
        const o = off.alternatives.find((row) => row.pick === x.pick);
        if (o && x.retyped) {
          const hiredOf = (row: PlanRow): string[] =>
            Object.keys(row.counts)
              .filter(
                (id) =>
                  (row.counts[id] ?? 0) > 0 && request.units.find((u) => u.id === id)?.pool !== 'leadership',
              )
              .sort();
          if (
            JSON.stringify(hiredOf(o)) !== JSON.stringify(hiredOf(x)) &&
            JSON.stringify(o.counts) !== JSON.stringify(x.counts)
          ) {
            // Only a break when the pass changed what a march fields of hired stock.
            const offKept = off.alternatives.some(
              (row) => JSON.stringify(hiredOf(row)) === JSON.stringify(hiredOf(x)),
            );
            if (!offKept) broken.push(`${SHORT[x.pick] ?? x.pick} hired types moved`);
          }
        }
      });
      if (broken.length > 0) t.broken += 1;

      // 158's speed-up bill, every stop off and on.
      const billed = (set: PlanRow[]): ReturnType<typeof speedUpBill>[] =>
        set.map((row) => speedUpBill(marchesOf(row as PlanTotals).map((m) => ordersOf(request, m))));
      const sa = billed(off.alternatives);
      const sb = billed(on.alternatives);
      for (const x of sa) {
        t.queueA += x.queue;
        t.consumedA += x.firstConsumed;
        t.campaignsA += x.campaigns;
      }
      for (const x of sb) {
        t.queueB += x.queue;
        t.consumedB += x.firstConsumed;
        t.campaignsB += x.campaigns;
      }
      on.alternatives.forEach((row, i) => {
        const j = off.alternatives.findIndex((o) => o.pick === row.pick);
        const a = sa[j];
        const c = sb[i];
        if (a && c && c.campaigns < a.campaigns)
          t.fewerCampaigns.push(
            `${scenario.label.slice(0, 46)} ${SHORT[row.pick] ?? row.pick}: ${String(a.campaigns)} → ${String(c.campaigns)}`,
          );
      });

      summary.push(
        `| ${scenario.label.slice(0, 40)} | ${String(before.length)} → ${String(after.length)} | ${String(retyped)} | ` +
          `${String(b)} / ${String(e)} / ${String(w)} | ${Number.isFinite(worst) ? worst.toFixed(2) : '—'} | ` +
          READINGS.map((r, i) => {
            const c = changes[i] ?? 0;
            const v = show(r, barBest(after, r));
            return Math.abs(c) > 1e-9 ? `**${v} (${c > 0 ? '+' : '−'}${Math.abs(c).toFixed(1)} %)**` : v;
          }).join(' | ') +
          ` | ${String(va.rowsBeaten)} → ${String(vb.rowsBeaten)} | ${String(va.unfitted)} → ${String(vb.unfitted)} | ` +
          `${broken.join('; ') || '✓'} | ${String(ms)} ms${on.retype?.cut ? ' (cut)' : ''} |`,
      );
    }

    report.add('## Every use case\n');
    report.add(summary.join('\n'));
    report.add(
      `\n\n**Stops**: ${String(t.stopsOff)} without the pass, ${String(t.stopsOn)} with it; ${String(t.retyped)} carry a re-typing. ` +
        `**The owner’s rating, stop by stop** (${String(t.matched)} matched by name): **${String(t.better)} better, ${String(t.equal)} equal, ` +
        `${String(t.worse)} worse**; the worst ${t.worst.toFixed(2)} (${t.worstAt}). Stops whose campaign damage fell: ${String(t.damageDown)}. ` +
        `**${String(t.allNoWorse)} of ${String(t.cases)}** use cases read no worse on any of the ten readings. ` +
        `**TotalStack at matched spend**: ${String(t.beatA)} / ${String(t.outA)} → ${String(t.beatB)} / ${String(t.outB)} (dominated / no stop fits). ` +
        `Use cases where a bar criterion breaks with the pass: ${String(t.broken)}.\n\n` +
        '| reading | use cases better | use cases worse |\n|---|---:|---:|\n' +
        READINGS.map(
          (r) => `| ${r.head} | ${String(better[r.head] ?? 0)} | ${String(worse[r.head] ?? 0)} |`,
        ).join('\n') +
        '\n',
    );
    if (t.unmatched.length > 0) report.add(`\n**Stops on one bar only**:\n\n- ${t.unmatched.join('\n- ')}\n`);
    report.add(
      `\n## 158’s speed-up bill, on the engine’s bar\n\nEvery stop of both bars, one campaign each (the stop counts differ when ` +
        'the fold chose differently):\n\n| | without the pass | with it | change |\n|---|---:|---:|---:|\n' +
        `| queue, summed | ${n(Math.round(t.queueA))} h | ${n(Math.round(t.queueB))} h | ${((t.queueB / t.queueA - 1) * 100).toFixed(2)} % |\n` +
        `| speed-ups consumed, first campaign, summed | ${n(Math.round(t.consumedA))} h | ${n(Math.round(t.consumedB))} h | ${((t.consumedB / t.consumedA - 1) * 100).toFixed(2)} % |\n` +
        `| waste in that | ${((t.consumedA / t.queueA - 1) * 100).toFixed(2)} % | ${((t.consumedB / t.queueB - 1) * 100).toFixed(2)} % | |\n` +
        `| campaigns the stock pays, summed over stops | ${n(t.campaignsA)} | ${n(t.campaignsB)} | ${((t.campaignsB / t.campaignsA - 1) * 100).toFixed(2)} % |\n\n` +
        `Matched stops the stock pays fewer whole campaigns of: **${String(t.fewerCampaigns.length)}**${t.fewerCampaigns.length > 0 ? `:\n\n- ${t.fewerCampaigns.join('\n- ')}` : '.'}\n`,
    );
    report.add(
      `\n## Time\n\nThe pass as the engine clocks it (\`CampaignPlan.retype.ms\`): slowest **${String(t.slowest.ms)} ms** (${t.slowest.label}). ` +
        `Runs its deadline cut: ${String(t.cut)}.\n`,
    );
    report.add(
      '\n## Against 157 and 158\n\n' +
        '157-rated re-typed the shipped bar after the fact: **57 of 61 stops better, 0 worse**, TotalStack **47 → 70** ' +
        'dominated (13 no fit), and — its own table — least silver worse on **9** use cases and the shortest queue on ' +
        '**11**. 158 billed it: queue **−0.67 %**, campaigns 692 → 704. Here the pass is inside the engine, which ' +
        'differs from 157 in two ways. (1) **The readings are guarded** (`keepReadings` in `planCampaign`): a stop ' +
        'whose re-typing costs the bar a reading it held — almost always the thrift end giving up a little silver or ' +
        'queue for damage — keeps its generated march; that is why fewer stops carry a re-typing and why TotalStack ' +
        'dominates fewer rows than 157’s 70. The unguarded run is kept as ' +
        '`160-the-retype-shipped-unguarded.md`. (2) **The fold chooses on re-typed campaigns**, so on some armies ' +
        'the bar holds a different set of stops (listed above); the speed-up bill is summed over each bar’s own ' +
        'stops, which is why its queue change is not 158’s. On the 7 000 export and the evening account the re-typed ' +
        'steady max beats the `all-in` outright (more damage, less silver, less burn), so S-94 drops it and the fold ' +
        'keeps “more mercs” instead; a variant that handed the steady max its generated march back to save the ' +
        '`all-in` made the fold drop the steady max instead (TotalStack 62 / 13, the same number of pins moved) and ' +
        'was not kept. (3) **A silver saver is never re-typed to more silver**, campaign or march (plan-criteria’s ' +
        'silver-saver rule; the live account of 2026-09-18 moved +3 400 a march otherwise).\n',
    );
    report.add(
      '\n## Every stop the pass changed\n\n| use case | stop | troops off (first march) | troops on | damage | silver | dmg a silver | queue | rating |\n|---|---|---|---|---|---|---|---|---:|\n' +
        stopRows.join('\n') +
        '\n',
    );
    report.save();
  }, 7_200_000);
});
