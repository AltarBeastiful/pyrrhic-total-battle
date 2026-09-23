/**
 * 152 — **a single troop wall on the bar** (2026-09-23). Experiment 151 found the owner's live camp stopping
 * short because the band refuses every plan standing on one troop stack — among them a Rider III wall of 2 441
 * with every hired stack sheltered under it, 30 986 506 over four marches, twice the bar's steady max. This
 * runs the shipped engine with that arm relaxed (`bandTroopStacks: 1`) against the engine as shipped, on
 * every army, on the ten readings, TotalStack at matched spend, and the criteria — the file below is 149's,
 * with its two bars swapped.
 *
 * (149's own header follows, for the parts of the file that are unchanged.)
 *
 * 149 — **the fold, as the engine ships it** (W10 §9.5, 2026-09-23; the owner: *"ok allow 5 stops and lets build
 * from here"*).
 *
 * 148 found the bar by an exhaustive search that could see TotalStack's rows; the engine cannot — it has only
 * the plan's own ten readings. So this runs `planCampaign` itself with the fold on (`burnSaver: 'silver'`,
 * `foldTo: 5`) against the bar as shipped before it (`burnSaver: 'guard'`), on every benchmark army, and reads:
 *
 *  - the ten readings — the most damage, the least silver, hired burned, gold, dragon coins and training queue,
 *    and damage a silver, a hired unit, a gold and a dragon coin — each the bar's best, fold against today;
 *  - matched spend against every captured TotalStack row, and against 148's five-stop choice;
 *  - the criteria: order (S-61), no stop beaten by another on every figure (S-93), at most five stops, the
 *    sweet spot on the bar, more than one troop stack on every stop;
 *  - what the fold costs in time.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/149-the-fold-shipped.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
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
  { head: 'fewest hired burned', of: (c: Campaign) => c.burned, high: false },
  { head: 'least gold', of: (c: Campaign) => c.gold, high: false },
  { head: 'fewest coins', of: (c: Campaign) => c.dragonCoins, high: false },
  { head: 'shortest queue', of: (c: Campaign) => c.seconds, high: false },
  { head: 'dmg a silver', of: (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0), high: true },
  { head: 'dmg a merc', of: (c: Campaign) => c.hiredDamage / Math.max(1, c.burned), high: true },
  { head: 'dmg a gold', of: (c: Campaign) => (c.gold > 0 ? c.damage / c.gold : 0), high: true },
  { head: 'dmg a coin', of: (c: Campaign) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0), high: true },
] as const;
type Reading = (typeof READINGS)[number];
const best = (set: Campaign[], r: Reading): number =>
  r.high ? Math.max(...set.map((c) => r.of(c))) : Math.min(...set.map((c) => r.of(c)));
/** Signed change of `after` against `before`, in percent, positive when better for the player. */
const gain = (after: number, before: number, r: Reading): number => {
  if (before === after) return 0;
  if (before === 0) return r.high ? 100 : -100;
  return ((r.high ? after - before : before - after) / Math.abs(before)) * 100;
};
const show = (r: Reading, value: number): string => {
  if (r.head === 'shortest queue') return `${n(Math.round(value / 3600))} h`;
  if (r.head === 'dmg a silver') return value.toFixed(3);
  if (r.head === 'dmg a coin' && value === 0) return '—';
  return n(Math.round(value));
};
const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};

const planFor = (
  scenario: { request: StackRequest },
  fold: boolean,
): { plan: CampaignPlan; ms: number } | undefined => {
  const started = performance.now();
  try {
    const plan = planCampaign({
      request: scenario.request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      ...(fold ? { bandTroopStacks: 1 } : {}),
      putBack: CAMPAIGN.putBack,
    });
    return { plan, ms: performance.now() - started };
  } catch {
    return undefined;
  }
};

const beatsOnFigures = (a: PlanRow, b: PlanRow): boolean => {
  const costs = (r: PlanRow): number[] => [r.silver, r.mercLost, r.gold, r.dragonCoins];
  if (a.totalDamage < b.totalDamage) return false;
  const ca = costs(a);
  const cb = costs(b);
  if (ca.some((c, i) => c > (cb[i] ?? 0))) return false;
  return a.totalDamage > b.totalDamage || ca.some((c, i) => c < (cb[i] ?? 0));
};

describe.skipIf(!process.env.THEORY)('a troop wall', () => {
  it('runs the engine with the fold against the bar as shipped', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('152-a-troop-wall');
    report.add('# 152 — a single troop wall on the bar\n');
    report.add(
      '**Today** is the bar as shipped (180ab3d: hired saver + fold to five); **wall** is the same engine with the ' +
        'band allowing a plan on a single troop stack (`bandTroopStacks: 1`). The column headed “fold” below is ' +
        'the wall. Figures are ' +
        'the campaign’s — four marches, worst opening, default recovery; the queue is one training queue’s ' +
        'total over the four marches, speed bonuses on, no speed-up items. In the per-army tables a change is ' +
        'printed as the player reads it: **+** better, **−** worse.\n',
    );
    const summary: string[] = [
      '| army | today | fold | readings better | readings worse | TS beaten (today → fold) | TS no fit (today → fold) | criteria broken by the fold | fold ms |',
      '|---|---|---|---|---|---|---|---|---:|',
    ];
    const details: string[] = [];
    const totals = { todayBeat: 0, todayOut: 0, foldBeat: 0, foldOut: 0, worseArmies: 0, broken: 0 };
    const worseBy: Record<string, number> = {};
    const betterBy: Record<string, number> = {};
    let slowest = 0;

    for (const scenario of scenarios) {
      const today = planFor(scenario, false);
      const fold = planFor(scenario, true);
      if (!today || !fold || today.plan.alternatives.length === 0) continue;
      slowest = Math.max(slowest, fold.ms - today.ms);
      const held = new Set(scenario.request.units.map((unit) => unit.id));
      const theirs: Campaign[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        theirs.push(
          asCaptured(widenedFor(scenario.request, external.counts), external.name, external.counts),
        );
      }
      const priced = (plan: CampaignPlan): Campaign[] =>
        plan.alternatives.map((stop) =>
          campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
        );
      const a = priced(today.plan);
      const b = priced(fold.plan);
      const va =
        theirs.length > 0
          ? matchedSpend(a as Contender[], theirs as Contender[])
          : { rowsBeaten: 0, unfitted: 0 };
      const vb =
        theirs.length > 0
          ? matchedSpend(b as Contender[], theirs as Contender[])
          : { rowsBeaten: 0, unfitted: 0 };
      totals.todayBeat += va.rowsBeaten;
      totals.todayOut += va.unfitted;
      totals.foldBeat += vb.rowsBeaten;
      totals.foldOut += vb.unfitted;
      const changes = READINGS.map((r) => gain(best(b, r), best(a, r), r));
      const better = READINGS.filter((_, i) => (changes[i] ?? 0) > 1e-9).map((r) => r.head);
      const worse = READINGS.filter((_, i) => (changes[i] ?? 0) < -1e-9).map((r) => r.head);
      for (const x of better) betterBy[x] = (betterBy[x] ?? 0) + 1;
      for (const x of worse) worseBy[x] = (worseBy[x] ?? 0) + 1;
      if (worse.length > 0) totals.worseArmies += 1;

      // The criteria, on the folded bar.
      const rows = fold.plan.alternatives;
      const broken: string[] = [];
      const rungs = rows.filter((row) => row.pick !== 'all-in');
      for (let i = 1; i < rungs.length; i += 1) {
        const prev = rungs[i - 1] as PlanRow;
        const cur = rungs[i] as PlanRow;
        if (cur.repeat.mercLost <= prev.repeat.mercLost || cur.repeat.damage <= prev.repeat.damage) {
          broken.push(`order: ${cur.pick} after ${prev.pick}`);
        }
      }
      for (const x of rows) {
        for (const y of rows) {
          if (x === y || x.pick === 'all-in' || (y.pick === 'all-in' && x.mercLost >= y.mercLost)) continue;
          if (beatsOnFigures(x, y)) broken.push(`S-93: ${x.pick} beats ${y.pick}`);
        }
      }
      if (rows.length > 5) broken.push(`${String(rows.length)} stops`);
      if (!rows.some((row) => row.pick === 'sweet-spot')) broken.push('no sweet spot');
      if (new Set(rows.map((row) => row.pick)).size !== rows.length) broken.push('a name twice');
      for (const row of rows) {
        const troops = Object.keys(row.counts).filter(
          (id) => scenario.request.units.find((unit) => unit.id === id)?.pool === 'leadership',
        ).length;
        if (troops < 2) broken.push(`${row.pick} fields ${String(troops)} troop stack`);
      }
      // Today's bar is judged the same way, so a criterion the fold did not break is not charged to it.
      const todayRungs = today.plan.alternatives.filter((row) => row.pick !== 'all-in');
      const todayOrdered = todayRungs.every(
        (row, i) =>
          i === 0 ||
          (row.repeat.mercLost > (todayRungs[i - 1] as PlanRow).repeat.mercLost &&
            row.repeat.damage > (todayRungs[i - 1] as PlanRow).repeat.damage),
      );
      if (broken.length > 0) totals.broken += 1;
      const code = (plan: CampaignPlan): string =>
        plan.alternatives.map((row) => SHORT[row.pick] ?? row.pick).join(' · ');
      summary.push(
        `| ${scenario.label.slice(0, 40)} | ${code(today.plan)} | ${code(fold.plan)} | ${better.join(', ') || '—'} | ` +
          `${worse.join(', ') || '—'} | ${String(va.rowsBeaten)} → ${String(vb.rowsBeaten)} | ${String(va.unfitted)} → ${String(vb.unfitted)} | ` +
          `${broken.join('; ') || '—'}${todayOrdered ? '' : ' (today’s bar is not ordered either)'} | ${n(Math.round(fold.ms - today.ms))} |`,
      );
      const table = (plan: CampaignPlan, set: Campaign[]): string =>
        plan.alternatives
          .map(
            (row, i) =>
              `| ${SHORT[row.pick] ?? row.pick} | ${String(row.repeat.mercLost)} | ${n(Math.round(row.repeat.damage))} | ` +
              READINGS.map((r) => show(r, r.of(set[i] as Campaign))).join(' | ') +
              ' |',
          )
          .join('\n');
      const head =
        '| stop | burned a march | damage a march | ' +
        READINGS.map((r) => r.head.replace(/^(most|least|fewest|shortest) /, '')).join(' | ') +
        ' |\n|---|---:|---:|' +
        '---:|'.repeat(READINGS.length);
      details.push(
        `\n## ${scenario.label}\n\n**Today**\n\n${head}\n${table(today.plan, a)}\n\n**Fold**\n\n${head}\n${table(fold.plan, b)}\n\n` +
          '| bar | ' +
          READINGS.map((r) => r.head).join(' | ') +
          ' | TS beaten | TS no fit |\n|---|' +
          '---:|'.repeat(READINGS.length + 2) +
          `\n| today | ${READINGS.map((r) => show(r, best(a, r))).join(' | ')} | ${String(va.rowsBeaten)} | ${String(va.unfitted)} |\n` +
          `| fold | ${READINGS.map((r, i) => {
            const c = changes[i] ?? 0;
            const v = show(r, best(b, r));
            return Math.abs(c) > 1e-9 ? `**${v} (${c > 0 ? '+' : '−'}${Math.abs(c).toFixed(1)} %)**` : v;
          }).join(' | ')} | ${String(vb.rowsBeaten)} | ${String(vb.unfitted)} |`,
      );
    }
    report.add('## Summary\n');
    report.add(summary.join('\n'));
    report.add(
      `\n\n**TotalStack rows**: today ${String(totals.todayBeat)} beaten / ${String(totals.todayOut)} no stop fits; ` +
        `fold ${String(totals.foldBeat)} / ${String(totals.foldOut)}. **Armies where the fold reads worse on some reading:** ` +
        `${String(totals.worseArmies)}. **Armies where the folded bar breaks a criterion:** ${String(totals.broken)}. ` +
        `**The most the fold added to one plan:** ${n(Math.round(slowest))} ms.\n\n` +
        '| reading | armies better | armies worse |\n|---|---:|---:|\n' +
        READINGS.map(
          (r) => `| ${r.head} | ${String(betterBy[r.head] ?? 0)} | ${String(worseBy[r.head] ?? 0)} |`,
        ).join('\n') +
        '\n',
    );
    report.add(details.join('\n'));
    report.save();
  }, 3_600_000);
});
