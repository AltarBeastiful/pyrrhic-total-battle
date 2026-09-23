/**
 * 166 — **the message camp's gap from SW** (W12 §2c, `docs/plans/the-remaining-gaps.md`).
 *
 * 165 §B: on his camp of 2026-09-19 as his message reads it (5 100 / 2 200, hunters 120), SW's troops with the
 * hired at the four-march sustain, sheltered, marched four times, rate **+10.22** against SW and **+20.69**
 * against the top stop — and the plan does not offer it. This experiment traces SW through `planCampaign`, as 165
 * did for the live camp, and finds the step that loses it.
 *
 *  §A the trace: SW's campaign at each step of the plan (the search's burn-ladder rung, the tighter shape
 *     S-93, the put-back, the rated re-typing W11), each priced as the benchmark prices a stop (`campaignOf`,
 *     worst opening), with the same repeat played a fourth time in place of the finale, rated with `rate()`.
 *     The marches of the intermediate steps are the ones an instrumented worktree of 0a688ac logged; the last
 *     step is checked against the bar `planCampaign` returns.
 *  §B the prototype fix, measured on every benchmark army: **the repeat played once more in place of the
 *     finale** when the stock sustains it one more time and `rate(finale, repeat, markerRates) > 0` on the
 *     plan's own march prices. It runs where the re-typing runs (`retypeRow` in `planCampaign`), so
 *     `keepReadings`, the collision hand-back, S-94 and the fold all read it. The toggle is the environment
 *     variable `P166_ROW` read by the worktree patch; on an engine without the patch both bars are the same and
 *     §B reads all-equal. Every stop is rated (`rate(before, after)`), and every marker is reported: the ten
 *     readings, TotalStack at matched spend and the bar's criteria.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/166-the-message-camps-gap.test.ts`
 */
/// <reference types="node" />
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planMarch } from '../../src/engine';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { lastsMarches, planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import type { StackRequest } from '../../src/engine/types';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, hiredIds, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
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
const pct = (v: number): string => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)} %`;
const HEAD =
  '| dmg | silver | hired | gold | coins | queue h | dmg/silver | dmg/hired | dmg/gold | dmg/coin |';
const cells = (c: Campaign): string =>
  `${n(Math.round(c.damage))} | ${n(Math.round(c.silver))} | ${n(c.burned)} | ${n(Math.round(c.gold))} | ` +
  `${n(Math.round(c.dragonCoins))} | ${n(Math.round(c.seconds / 3600))} | ` +
  `${(c.silver > 0 ? c.damage / c.silver : 0).toFixed(3)} | ${n(Math.round(c.hiredDamage / Math.max(1, c.burned)))} | ` +
  `${c.gold > 0 ? n(Math.round(c.damage / c.gold)) : '—'} | ${c.dragonCoins > 0 ? n(Math.round(c.damage / c.dragonCoins)) : '—'} |`;
const marchText = (request: StackRequest, counts: Record<string, number>): string => {
  const pools = new Map(request.units.map((u) => [u.id, u.pool]));
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => (pools.get(a[0]) === 'leadership' ? 0 : 1) - (pools.get(b[0]) === 'leadership' ? 0 : 1))
    .map(([id, c]) => `${id} ${n(c)}${pools.get(id) === 'leadership' ? '' : '*'}`)
    .join(', ');
};

const sheltered = (request: StackRequest, counts: Record<string, number>): boolean => {
  const { result } = planMarch(request, counts);
  const troops = result.stacks.filter((s) => s.pool === 'leadership');
  if (troops.length === 0) return true;
  const floor = Math.min(...troops.map((s) => s.totalHp));
  return result.stacks.filter((s) => s.pool !== 'leadership').every((s) => s.totalHp < floor);
};

interface Read {
  plan: CampaignPlan;
  stops: { row: PlanRow; c: Campaign; marches: Record<string, number>[] }[];
}
function readPlan(request: StackRequest): Read | null {
  let plan: CampaignPlan;
  try {
    plan = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    });
  } catch {
    return null;
  }
  const stops = plan.alternatives.map((row) => {
    const marches = marchesOf(row as PlanTotals);
    return { row, c: campaignOf(request, row.pick, 'plan', marches), marches };
  });
  return { plan, stops };
}
/** The bar's criteria as 161 reads them: order, no stop beaten by another, sheltered, at most five stops. */
function criteria(request: StackRequest, read: Read): string[] {
  const broken: string[] = [];
  const rows = read.stops;
  const rungs = rows.filter((r) => r.row.pick !== 'all-in');
  for (let i = 1; i < rungs.length; i += 1) {
    const p = rungs[i - 1];
    const q = rungs[i];
    if (
      p &&
      q &&
      (q.row.repeat.mercLost <= p.row.repeat.mercLost || q.row.repeat.damage <= p.row.repeat.damage)
    )
      broken.push(`order at ${short(q.row.pick)}`);
  }
  for (const x of rows) {
    for (const y of rows) {
      if (x === y || x.row.pick === 'all-in' || y.row.pick === 'all-in') continue;
      const dom =
        x.c.damage >= y.c.damage &&
        x.c.silver <= y.c.silver &&
        x.c.burned <= y.c.burned &&
        x.c.gold <= y.c.gold &&
        (x.c.damage > y.c.damage ||
          x.c.silver < y.c.silver ||
          x.c.burned < y.c.burned ||
          x.c.gold < y.c.gold);
      if (dom) broken.push(`${short(x.row.pick)} beats ${short(y.row.pick)}`);
    }
    if (!x.marches.every((m) => sheltered(request, m))) broken.push(`${short(x.row.pick)} unsheltered`);
  }
  if (rows.length > 5) broken.push(`${String(rows.length)} stops`);
  return broken;
}

const VARIANTS = [
  {
    mode: '1',
    title: 'B. The prototype: the repeat played once more in place of the finale, gated by `rate()`',
  },
  {
    mode: 'guard',
    title:
      'B2. The same, guarded: a fold that leaves a stop beaten by another stop (or beaten itself) is handed back',
  },
  {
    mode: 'drop',
    title:
      'B3. The same, and a rung a folded stop beats on damage, silver, burn and gold is dropped from the bar',
  },
] as const;

/** SW's marches at each step, as the instrumented worktree of 0a688ac logged them (message camp). */
const HUNTER = 'epic-monster-hunter-6';
const STEPS: { step: string; how: string; repeat: Record<string, number>; finale: Record<string, number> }[] =
  [
    {
      step: '1. the search’s burn-ladder rung (7 chunks a march)',
      how: 'the winner’s rungs with 70 hunters (`WINNER_RUNGS_DEPTH`); its finale is `finaleFor` on the 99 hunters three repeats leave',
      repeat: { 'rider-2': 1640, 'rider-3': 904, [HUNTER]: 70 },
      finale: { 'rider-2': 1434, 'rider-3': 790, [HUNTER]: 99 },
    },
    {
      step: '2. the tighter shape (S-93, `tighterShape`)',
      how: 'the sizer over a prefix of five troop types, Elite, the 70 hunters as caps: fields 50 (5 chunks); **the finale is not re-sized**',
      repeat: {
        'rider-1': 828,
        'archer-2': 1125,
        'spearman-2': 893,
        'rider-2': 457,
        'rider-3': 256,
        [HUNTER]: 50,
      },
      finale: { 'rider-2': 1434, 'rider-3': 790, [HUNTER]: 99 },
    },
    {
      step: '3. the put-back (`putBackOn`) and the tighter shape again',
      how: 'no put-back taken, nothing tightened: the row of step 2',
      repeat: {
        'rider-1': 828,
        'archer-2': 1125,
        'spearman-2': 893,
        'rider-2': 457,
        'rider-3': 256,
        [HUNTER]: 50,
      },
      finale: { 'rider-2': 1434, 'rider-3': 790, [HUNTER]: 99 },
    },
    {
      step: '4. the rated re-typing (W11, `retypeRow`) — the bar’s SW',
      how: 'each march re-typed in place, hired kept to the unit: the repeat +11.9 % damage, the finale spearman-2 for rider-2 (same damage, cheaper)',
      repeat: {
        [HUNTER]: 50,
        'spearman-2': 897,
        'rider-2': 460,
        'rider-3': 258,
        'rider-1': 823,
        'archer-2': 1116,
      },
      finale: { [HUNTER]: 99, 'spearman-2': 2795, 'rider-3': 790 },
    },
  ];

describe.skipIf(!process.env.THEORY)('the message camp’s gap from SW', () => {
  it('traces SW through the plan and measures the fold of the finale on every army', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('166-the-message-camps-gap');
    report.add('# 166 — the message camp’s gap from SW\n');
    report.add(
      'W12 §2c. The plan as shipped at 0a688ac (`CAMPAIGN.planFixes`, `CAMPAIGN.putBack`), four-march campaigns ' +
        'priced as the benchmark prices stops (`campaignOf`, worst opening = enemy-first journal), ranked with ' +
        '`rate(before, after, markerRates)` (silver 5, gold 5, hired 5, coins 8, queue 40). Hired stacks are ' +
        'starred. Training bonuses are not applied (W11 §6.1).\n',
    );

    // ------------------------------------------------------------------ §A the trace
    const message = scenarios.find((s) => s.label.includes('as his message reads'));
    if (message) {
      const request = message.request;
      const held = request.caps[HUNTER] ?? 0;
      const read = process.env.P166_ROW ? null : readPlan(request);
      report.h(
        'A. SW through `planCampaign`, step by step (his camp of 2026-09-19, as his message reads it)',
      );
      if (read) {
        const top = read.stops.reduce((a, b) => (b.c.damage > a.c.damage ? b : a));
        const bar = [
          `| stop | first march · last march | ${HEAD.slice(2)} rating vs ${short(top.row.pick)} |`,
        ];
        bar.push(`|---|---|${'---:|'.repeat(11)}`);
        for (const s of read.stops)
          bar.push(
            `| ${short(s.row.pick)} | ${marchText(request, s.marches[0] ?? {})} · ${marchText(request, s.marches[s.marches.length - 1] ?? {})} | ${cells(s.c)} ${rate(billOf(top.c), billOf(s.c), RATES).toFixed(2)} |`,
          );
        report.add(`**The bar at 0a688ac.** Top = ${short(top.row.pick)}.\n`);
        report.add(bar.join('\n'));
        const sw = read.stops.find((s) => s.row.pick === 'sweet-spot');
        const last = STEPS[STEPS.length - 1];
        const same =
          sw &&
          last &&
          JSON.stringify(Object.entries(sw.marches[0] ?? {}).sort()) ===
            JSON.stringify(Object.entries(last.repeat).sort()) &&
          JSON.stringify(Object.entries(sw.marches[sw.marches.length - 1] ?? {}).sort()) ===
            JSON.stringify(Object.entries(last.finale).sort());
        report.add(
          `\nThe bar’s SW is step 4 below to the unit: **${same ? 'yes' : 'NO — the trace is stale'}** ` +
            `(re-typed: ${sw?.row.retyped ? `yes, rating ${sw.row.retyped.rating.toFixed(2)}` : 'no'}).\n`,
        );
        const lines = [
          '| step | how | repeat (× 3) · finale | campaign | ' +
            HEAD.slice(2) +
            ' finale → repeat, one march (rate) | repeat sustained a 4th time | rating of 4 × repeat vs 3 + finale | vs SW | vs top |',
          `|---|---|---|---|${'---:|'.repeat(10)}---:|---|---:|---:|---:|`,
        ];
        for (const s of STEPS) {
          const three = campaignOf(request, s.step, 'plan', [s.repeat, s.repeat, s.repeat, s.finale]);
          const four = campaignOf(request, s.step, 'plan', [s.repeat, s.repeat, s.repeat, s.repeat]);
          const one = (counts: Record<string, number>) => campaignOf(request, 'one', 'plan', [counts]);
          const r1 = rate(billOf(one(s.finale)), billOf(one(s.repeat)), RATES);
          const lasts = lastsMarches(held, s.repeat[HUNTER] ?? 0);
          const text = `${marchText(request, s.repeat)} · ${marchText(request, s.finale)}`;
          lines.push(
            `| ${s.step} | ${s.how} | ${text} | 3 + finale | ${cells(three)} ${r1.toFixed(2)} | ${lasts >= HORIZON ? `yes (lasts ${String(lasts)})` : `no (lasts ${String(lasts)})`} | | ${sw ? rate(billOf(sw.c), billOf(three), RATES).toFixed(2) : '—'} | ${rate(billOf(top.c), billOf(three), RATES).toFixed(2)} |`,
          );
          lines.push(
            `| | | | 4 × repeat | ${cells(four)} | | | **${rate(billOf(three), billOf(four), RATES).toFixed(2)}** | ${sw ? rate(billOf(sw.c), billOf(four), RATES).toFixed(2) : '—'} | ${rate(billOf(top.c), billOf(four), RATES).toFixed(2)} |`,
          );
        }
        report.add(
          '\n**The trace.** Each step’s campaign as the plan builds it (three repeats + the finale), and the same ' +
            'repeat played a fourth time instead of the finale. “finale → repeat” rates the repeat march against the ' +
            'finale march alone. 165 §B’s *filled* march is exactly step 4’s repeat: SW already fields the ' +
            'four-march sustain (50 hunters, `largestSustained(120, 4)`), so the whole +10.22 is the finale.\n',
        );
        report.add(lines.join('\n'));
        report.add(
          '\n**Where it is lost.** At step 1 the rung’s repeat burns 7 chunks, and the finale spending the 99 ' +
            'hunters left is worth more than a fourth repeat. Step 2 lowers the repeat to 50 hunters (5 chunks) and ' +
            'leaves the finale sized for the 7-chunk repeat — `tighterShape` says so itself (*“the finale is not ' +
            're-sized … what it does not do is spend the stock the tightening freed”*). From that step on, the ' +
            'repeat is sustained a fourth time and beats the finale on every reading; nothing in the plan asks. ' +
            '`finaleFor` could not have offered it: every finale it scores fields **all** the leftovers (lowered only ' +
            'by the shelter), never a subset such as the repeat itself. Step 4 widens the gap (the re-typed repeat ' +
            'gains 11.9 %, the finale 0 %).\n',
        );
      }
    }

    // ------------------------------------------------------------------ §B the fix on every army
    const beforeOf = new Map<string, Read | null>();
    for (const variant of VARIANTS) {
      report.h(variant.title);
      if (variant.mode === '1')
        report.add(
          'Patch (worktree of 0a688ac, not shipped): in `planCampaign`, after each row’s re-typing (`retypeRow`), a row ' +
            'with a finale whose repeat the stock sustains one march more (`lastsMarches ≥ repeats + 1` on every hired ' +
            'type) plays that repeat in place of the finale when `rate(finale, repeat, markerRates) > 0` on the plan’s ' +
            'own march prices (`toMarch`), and S-58 B still holds. The row keeps its march count; its totals move by ' +
            '(repeat − finale). `keepReadings` and everything after the re-typing read the folded row. Each stop is ' +
            'rated `rate(before, after)` on the benchmark’s campaign bill, stops matched by pick.\n',
        );
      const summary: string[] = [
        '| army | stops better / equal / worse (worst) | ' +
          READINGS.map((r) => r.head).join(' | ') +
          ' | TS dominated | TS no fit | criteria before | criteria after |\n|---|---|' +
          '---|'.repeat(READINGS.length) +
          '---|---|---|---|',
      ];
      const moved: string[] = [];
      const better: Record<string, number> = {};
      const worse: Record<string, number> = {};
      const totals = {
        up: 0,
        same: 0,
        down: 0,
        only: 0,
        tsA: 0,
        tsOutA: 0,
        tsB: 0,
        tsOutB: 0,
        brA: 0,
        brB: 0,
      };
      let worst: { r: number; where: string } | null = null;
      const hadRow = process.env.P166_ROW;
      for (const scenario of scenarios) {
        const label = scenario.label.slice(0, 44);
        delete process.env.P166_ROW;
        if (!beforeOf.has(scenario.label)) beforeOf.set(scenario.label, readPlan(scenario.request));
        const a = beforeOf.get(scenario.label) ?? null;
        process.env.P166_ROW = variant.mode;
        const b = readPlan(scenario.request);
        delete process.env.P166_ROW;
        if (!a || !b || a.stops.length === 0 || b.stops.length === 0) {
          summary.push(`| ${label} | refused |`);
          continue;
        }
        let up = 0;
        let same = 0;
        let down = 0;
        let low: number | null = null;
        const picks = [...new Set([...a.stops, ...b.stops].map((s) => s.row.pick))];
        for (const pick of picks) {
          const sa = a.stops.find((s) => s.row.pick === pick);
          const sb = b.stops.find((s) => s.row.pick === pick);
          if (!sa || !sb) {
            totals.only += 1;
            moved.push(`| ${label} | ${short(pick)} | only ${sa ? 'before' : 'after'} | | | | | | | | |`);
            continue;
          }
          const r = rate(billOf(sa.c), billOf(sb.c), RATES);
          if (Math.abs(r) < 1e-9) same += 1;
          else if (r > 0) up += 1;
          else down += 1;
          low = low === null ? r : Math.min(low, r);
          if (!worst || r < worst.r) worst = { r, where: `${label} · ${short(pick)}` };
          if (JSON.stringify(sa.marches) !== JSON.stringify(sb.marches))
            moved.push(
              `| ${label} | ${short(pick)} | ${marchText(scenario.request, sa.marches[sa.marches.length - 1] ?? {})} | ${marchText(scenario.request, sb.marches[sb.marches.length - 1] ?? {})} | ` +
                `${n(Math.round(sa.c.damage))} → ${n(Math.round(sb.c.damage))} | ${n(Math.round(sa.c.silver))} → ${n(Math.round(sb.c.silver))} | ` +
                `${n(sa.c.burned)} → ${n(sb.c.burned)} | ${n(Math.round(sa.c.gold))} → ${n(Math.round(sb.c.gold))} | ` +
                `${n(Math.round(sa.c.dragonCoins))} → ${n(Math.round(sb.c.dragonCoins))} | ${n(Math.round(sa.c.seconds / 3600))} → ${n(Math.round(sb.c.seconds / 3600))} | **${r.toFixed(2)}** |`,
            );
        }
        totals.up += up;
        totals.same += same;
        totals.down += down;
        const ca = a.stops.map((s) => s.c);
        const cb = b.stops.map((s) => s.c);
        const changes = READINGS.map((r) => gain(barBest(cb, r), barBest(ca, r), r));
        READINGS.forEach((r, i) => {
          const c = changes[i] ?? 0;
          if (c > 1e-9) better[r.head] = (better[r.head] ?? 0) + 1;
          if (c < -1e-9) worse[r.head] = (worse[r.head] ?? 0) + 1;
        });
        const heldIds = new Set(scenario.request.units.map((unit) => unit.id));
        const theirs: Campaign[] = [];
        for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
          if (!external.name.startsWith('TotalStack')) continue;
          if (Object.entries(external.counts).some(([id, c]) => c > 0 && !heldIds.has(id))) continue;
          const row = asCaptured(
            widenedFor(scenario.request, external.counts),
            external.name,
            external.counts,
          );
          if (row.damage > 0) theirs.push(row);
        }
        const va = theirs.length > 0 ? matchedSpend(ca as Contender[], theirs as Contender[]) : null;
        const vb = theirs.length > 0 ? matchedSpend(cb as Contender[], theirs as Contender[]) : null;
        totals.tsA += va?.rowsBeaten ?? 0;
        totals.tsOutA += va?.unfitted ?? 0;
        totals.tsB += vb?.rowsBeaten ?? 0;
        totals.tsOutB += vb?.unfitted ?? 0;
        const ka = criteria(scenario.request, a);
        const kb = criteria(scenario.request, b);
        if (ka.length > 0) totals.brA += 1;
        if (kb.length > 0) totals.brB += 1;
        summary.push(
          `| ${label} | ${String(up)} / ${String(same)} / ${String(down)} (${low === null ? '—' : low.toFixed(2)}) | ` +
            READINGS.map((_, i) => {
              const c = changes[i] ?? 0;
              return Math.abs(c) > 1e-9 ? `**${pct(c)}**` : '=';
            }).join(' | ') +
            ` | ${va ? `${String(va.rowsBeaten)} → ${String(vb?.rowsBeaten ?? 0)}` : '—'} | ` +
            `${va ? `${String(va.unfitted)} → ${String(vb?.unfitted ?? 0)}` : '—'} | ${ka.join('; ') || '✓'} | ${kb.join('; ') || '✓'} |`,
        );
      }
      if (hadRow) process.env.P166_ROW = hadRow;
      report.add(summary.join('\n'));
      report.add(
        `\n\nStops rated (after against before): **${String(totals.up)} better / ${String(totals.same)} equal / ` +
          `${String(totals.down)} worse**` +
          (worst && worst.r < -1e-9
            ? `; the worst ${worst.r.toFixed(2)} at ${worst.where}`
            : '; no stop rated worse') +
          `; ${String(totals.only)} stops on one bar only. TotalStack at matched spend (dominated / no stop fits): ` +
          `${String(totals.tsA)} / ${String(totals.tsOutA)} → ${String(totals.tsB)} / ${String(totals.tsOutB)}. ` +
          `Armies with a bar criterion broken: ${String(totals.brA)} → ${String(totals.brB)}.\n\n` +
          '| reading | armies better | armies worse |\n|---|---:|---:|\n' +
          READINGS.map(
            (r) => `| ${r.head} | ${String(better[r.head] ?? 0)} | ${String(worse[r.head] ?? 0)} |`,
          ).join('\n') +
          '\n',
      );
      report.add(
        '\n### Every stop that moved (last march before → after)\n\n' +
          '| army | stop | last march before | last march after | damage | silver | hired lost | gold | coins | queue h | rating |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|\n' +
          (moved.join('\n') || '| — | | | | | | | | | | |') +
          '\n',
      );
    }

    report.h('C. Verdict (as measured on the worktree patch, 2026-09-23)');
    report.add(
      '- **The losing step is the tighter shape (S-93)**, not the search, the shelter or the sustain: it lowers ' +
        'the repeat from 7 chunks to 5 and keeps the finale the 7-chunk repeat left, and no later step asks whether ' +
        'the repeat, now sustained a fourth time, beats that finale. The re-typing widens the gap from +7.52 to +10.22.\n' +
        '- **B (plain):** the message camp’s SW becomes the filled march (+10.22) and its SS folds too (+12.65, ' +
        'though −11.3 % damage); two SW elsewhere +0.42 and +1.26, usual setup SW +1.29. No stop rated worse, no ' +
        'reading worse, TotalStack unchanged — but two bars now carry a stop beaten by another (SW beats MX on the ' +
        'message camp and on his usual setup).\n' +
        '- **B2 (guarded):** no criterion broken, no stop worse, TotalStack unchanged, but the message camp’s SW ' +
        'fold is handed back: the gap §2c asks about stays open (only SS moves there).\n' +
        '- **B3 (drop the beaten rung):** captures +10.22 with no criterion broken, but drops MX on two bars and ' +
        'TotalStack at matched spend falls 70 → 67 dominated (his usual setup 5 → 2): a marker worse.\n' +
        '- **No overlap with 6a7d00c**, which scores S-97 ladder maxima on their own ladder inside the search; this ' +
        'acts on rows after the search, on the finale the tighter shape leaves. It is the row-level sibling of §2d ' +
        '(the finale sized by the march’s own shape).\n',
    );
    void hiredIds;
    const file = report.save();
    // eslint-disable-next-line no-console
    console.log(`written ${file}`);
  }, 7_200_000);
});
