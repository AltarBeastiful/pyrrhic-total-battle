/**
 * 154 — **the troop wall on every use case, and the bar against TotalStack row by row** (2026-09-23; the owner:
 * *"yes allow the troop wall … first run it as an experiment against all the use cases and tell me how much of
 * the use cases switch to single stacks. Then output again a full comparison table with each use case and all
 * the criteria to compare ours vs TotalStack. Output two tables (our best row vs TotalStack) and (our most
 * close in damage vs TotalStack, adding a star if the row selected is different from the best row chosen
 * before)"*).
 *
 * **§1 — the switch.** Every benchmark army, the engine as shipped (`bandTroopStacks` 2) against the wall
 * allowed (`bandTroopStacks: 1`): the stops, which of them stand on a single troop stack, and the bar's most
 * damage and best damage a silver before and after.
 *
 * **§2 and §3 — against TotalStack, with the wall allowed.** One TotalStack row an army: its **Total
 * Optimization** (the owner's own yardstick, *"at least the same as TotalStack full opt"*), or its hardest row
 * where the capture has no Total Optimization. Against it, one stop of ours:
 *
 *  - **§2 — our best row**: the stop that is ahead of that row on the most criteria (ties to the more damage);
 *  - **§3 — our row closest in damage**: the stop whose campaign damage is nearest theirs; ★ when it is not
 *    the §2 row.
 *
 * Ten criteria, the owner's three first: damage a gold, damage a silver, hired lost; then damage, silver, gold,
 * dragon coins, training queue, damage a merc, damage a dragon coin. A cell reads *ours / theirs* and ✓ where
 * ours is better, ✗ where theirs is, = where level.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/154-the-wall-and-totalstack.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

const CRITERIA = [
  { head: 'dmg a gold', of: (c: Campaign) => (c.gold > 0 ? c.damage / c.gold : Infinity), high: true },
  { head: 'dmg a silver', of: (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0), high: true },
  { head: 'hired lost', of: (c: Campaign) => c.burned, high: false },
  { head: 'damage', of: (c: Campaign) => c.damage, high: true },
  { head: 'silver', of: (c: Campaign) => c.silver, high: false },
  { head: 'gold', of: (c: Campaign) => c.gold, high: false },
  { head: 'dragon coins', of: (c: Campaign) => c.dragonCoins, high: false },
  { head: 'training queue', of: (c: Campaign) => c.seconds, high: false },
  { head: 'dmg a merc', of: (c: Campaign) => c.hiredDamage / Math.max(1, c.burned), high: true },
  {
    head: 'dmg a coin',
    of: (c: Campaign) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : Infinity),
    high: true,
  },
] as const;
type Criterion = (typeof CRITERIA)[number];
type Standing = 'win' | 'tie' | 'lose';
const standing = (us: number, them: number, c: Criterion): Standing =>
  us === them ? 'tie' : (c.high ? us > them : us < them) ? 'win' : 'lose';
const MARK: Record<Standing, string> = { win: '✓', tie: '=', lose: '✗' };
const compactN = (v: number): string => {
  const a = Math.abs(v);
  if (a >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (a >= 1e4) return `${(v / 1e3).toFixed(0)}k`;
  return n(Math.round(v));
};
const show = (c: Criterion, v: number): string => {
  if (!Number.isFinite(v)) return '—';
  if (c.head === 'training queue') return `${n(Math.round(v / 3600))}h`;
  if (c.head === 'dmg a silver') return v.toFixed(2);
  return compactN(v);
};
const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};

const planWith = (request: StackRequest, wall: boolean): CampaignPlan | undefined => {
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      bandTroopStacks: wall ? 1 : 2,
      putBack: CAMPAIGN.putBack,
    });
  } catch {
    return undefined;
  }
};

describe.skipIf(!process.env.THEORY)('the wall and TotalStack', () => {
  it('counts the armies that switch to a single troop stack, then sets the bar against TotalStack', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('154-the-wall-and-totalstack');
    report.add('# 154 — the troop wall on every use case, and the bar against TotalStack\n');
    report.add(
      'Codes: **HS** hired saver · **SS** silver saver · **SW** sweet spot · **MM** more mercs · **MX** steady max ' +
        '· **AI** all in. Four-march campaigns, worst opening, default recovery; the queue is one training ' +
        'queue’s total over the four marches, speed bonuses on, no speed-up items.\n',
    );
    const switchRows: string[] = [
      '| use case | stops before | stops with the wall | single-stack stops | most damage | best dmg a silver |',
      '|---|---|---|---|---:|---:|',
    ];
    let switched = 0;
    let singleStops = 0;
    let totalStops = 0;
    const best: string[] = [];
    const close: string[] = [];
    const tally = {
      best: Object.fromEntries(CRITERIA.map((c) => [c.head, { win: 0, tie: 0, lose: 0 }])),
      close: Object.fromEntries(CRITERIA.map((c) => [c.head, { win: 0, tie: 0, lose: 0 }])),
    } as Record<'best' | 'close', Record<string, Record<Standing, number>>>;
    let armies = 0;
    let armiesWithTs = 0;

    for (const scenario of scenarios) {
      const before = planWith(scenario.request, false);
      const after = planWith(scenario.request, true);
      if (!before || !after || after.alternatives.length === 0) continue;
      armies += 1;
      const troopsOf = (row: PlanRow): string[] =>
        Object.entries(row.counts)
          .filter(
            ([id, c]) => c > 0 && scenario.request.units.find((u) => u.id === id)?.pool === 'leadership',
          )
          .map(([id]) => id);
      const singles = after.alternatives.filter((row) => troopsOf(row).length === 1);
      totalStops += after.alternatives.length;
      singleStops += singles.length;
      if (singles.length > 0) switched += 1;
      const priced = (plan: CampaignPlan): Campaign[] =>
        plan.alternatives.map((stop) =>
          campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
        );
      const a = priced(before);
      const b = priced(after);
      const maxOf = (set: Campaign[], f: (c: Campaign) => number): number => Math.max(...set.map(f));
      const dmg = (c: Campaign): number => c.damage;
      const perSilver = (c: Campaign): number => (c.silver > 0 ? c.damage / c.silver : 0);
      const change = (x: number, y: number, digits: number): string =>
        x === y
          ? digits === 0
            ? n(Math.round(y))
            : y.toFixed(digits)
          : `**${digits === 0 ? n(Math.round(x)) : x.toFixed(digits)} → ${digits === 0 ? n(Math.round(y)) : y.toFixed(digits)} (${y >= x ? '+' : '−'}${Math.abs((y / x - 1) * 100).toFixed(1)} %)**`;
      switchRows.push(
        `| ${scenario.label.slice(0, 48)} | ${before.alternatives.map((r) => SHORT[r.pick]).join(' · ')} | ` +
          `${after.alternatives.map((r) => SHORT[r.pick]).join(' · ')} | ` +
          `${singles.length > 0 ? singles.map((r) => `${SHORT[r.pick] ?? r.pick} (${troopsOf(r)[0] ?? ''} ${n(r.counts[troopsOf(r)[0] ?? ''] ?? 0)})`).join(', ') : '—'} | ` +
          `${change(maxOf(a, dmg), maxOf(b, dmg), 0)} | ${change(maxOf(a, perSilver), maxOf(b, perSilver), 3)} |`,
      );

      // §2 and §3 — against TotalStack, with the wall.
      const held = new Set(scenario.request.units.map((unit) => unit.id));
      const theirs: Campaign[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (!external.name.startsWith('TotalStack')) continue;
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const row = asCaptured(widenedFor(scenario.request, external.counts), external.name, external.counts);
        if (row.damage > 0) theirs.push(row);
      }
      if (theirs.length === 0) continue;
      armiesWithTs += 1;
      const them =
        theirs.find((r) => r.name === 'TotalStack · Total Optimization') ??
        theirs.reduce((x, y) => (y.damage > x.damage ? y : x));
      const ours = after.alternatives.map((stop, i) => ({
        pick: SHORT[stop.pick] ?? stop.pick,
        c: b[i] as Campaign,
      }));
      const wins = (c: Campaign): number =>
        CRITERIA.filter((k) => standing(k.of(c), k.of(them), k) === 'win').length;
      const bestRow = ours.reduce((x, y) =>
        wins(y.c) > wins(x.c) || (wins(y.c) === wins(x.c) && y.c.damage > x.c.damage) ? y : x,
      );
      const closeRow = ours.reduce((x, y) =>
        Math.abs(Math.log(y.c.damage / them.damage)) < Math.abs(Math.log(x.c.damage / them.damage)) ? y : x,
      );
      const line = (row: { pick: string; c: Campaign }, which: 'best' | 'close', star: boolean): string => {
        const cells = CRITERIA.map((k) => {
          const s = standing(k.of(row.c), k.of(them), k);
          (tally[which][k.head] as Record<Standing, number>)[s] += 1;
          return `${MARK[s]} ${show(k, k.of(row.c))} / ${show(k, k.of(them))}`;
        });
        const score = CRITERIA.filter((k) => standing(k.of(row.c), k.of(them), k) === 'win').length;
        const lost = CRITERIA.filter((k) => standing(k.of(row.c), k.of(them), k) === 'lose').length;
        return (
          `| ${scenario.label.slice(0, 40)} | ${row.pick}${star ? ' ★' : ''} | ${them.name.replace('TotalStack · ', '')} | ` +
          `${cells.join(' | ')} | ${String(score)}–${String(lost)} |`
        );
      };
      best.push(line(bestRow, 'best', false));
      close.push(line(closeRow, 'close', closeRow.pick !== bestRow.pick));
    }

    report.add(
      `## §1 — how many use cases switch to a single troop stack\n\n**${String(switched)} of ${String(armies)}** use cases ` +
        `put a single-stack stop on the bar — **${String(singleStops)} of ${String(totalStops)}** stops in all.\n\n` +
        switchRows.join('\n') +
        '\n',
    );
    const head =
      '| use case | our stop | their row | ' +
      CRITERIA.map((c) => c.head).join(' | ') +
      ' | ahead–behind |\n|---|---|---|' +
      '---|'.repeat(CRITERIA.length) +
      '---|';
    const totals = (which: 'best' | 'close'): string =>
      '\n\n| criterion | ours better | level | theirs better |\n|---|---:|---:|---:|\n' +
      CRITERIA.map((c) => {
        const t = tally[which][c.head] as Record<Standing, number>;
        return `| ${c.head} | ${String(t.win)} | ${String(t.tie)} | ${String(t.lose)} |`;
      }).join('\n');
    report.add(
      `\n## §2 — our best row against TotalStack (${String(armiesWithTs)} use cases, the wall allowed)\n\n` +
        'Each cell is **ours / theirs**. “Our best row” is the stop ahead of their row on the most criteria.\n\n' +
        head +
        '\n' +
        best.join('\n') +
        totals('best') +
        '\n',
    );
    report.add(
      `\n## §3 — our row closest in damage against TotalStack\n\n★ where it is not the §2 row.\n\n` +
        head +
        '\n' +
        close.join('\n') +
        totals('close') +
        '\n',
    );
    report.save();
  }, 3_600_000);
});
