/**
 * 153 — **TotalStack, matched on damage** (2026-09-23; the owner: *"for TotalStack we should probably compare
 * criterias at least gold/dmg, silver/dmg and hired lost. And maybe we select our "best" but we should also do
 * a comparison with a comparable row in terms of damage"*).
 *
 * 150 read our best against their best on each reading alone, which can pair our cheapest stop with their
 * hardest-hitting row. Matched spend (the benchmark's own) fixes their costs and asks for our damage. This is
 * the third reading, the other way round: **fix the damage, compare what it costs.** Each captured TotalStack
 * row is paired with the stop of our bar (as shipped) whose campaign damage is **closest** to theirs, and the
 * pair is read on every criterion — damage a gold, damage a silver and hired lost first, as the owner asked,
 * then the rest. A pair more than 10 % apart on damage is marked, because at that distance a cost comparison
 * is a comparison of two different marches; the ratios stay fair at any distance, the absolute costs do not.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/153-matched-on-damage.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

/** The criteria, the owner's three first. `high` = more is better. */
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
const standing = (us: number, them: number, c: Criterion): Standing => {
  if (us === them) return 'tie';
  return (c.high ? us > them : us < them) ? 'win' : 'lose';
};
const MARK: Record<Standing, string> = { win: '✓', tie: '=', lose: '✗' };
const show = (c: Criterion, v: number): string => {
  if (!Number.isFinite(v)) return '—';
  if (c.head === 'training queue') return `${n(Math.round(v / 3600))} h`;
  if (c.head === 'dmg a silver') return v.toFixed(3);
  return n(Math.round(v));
};
const pct = (us: number, them: number, c: Criterion): string => {
  if (!Number.isFinite(us) || !Number.isFinite(them) || us === them) return '';
  if (them === 0) return c.high ? ' (+∞)' : ' (over 0)';
  const x = ((c.high ? us - them : them - us) / Math.abs(them)) * 100;
  return ` (${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(0)} %)`;
};
const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const CLOSE = 0.1;

describe.skipIf(!process.env.THEORY)('TotalStack matched on damage', () => {
  it('pairs every TotalStack row with our stop nearest in damage and reads every criterion', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('153-matched-on-damage');
    report.add('# 153 — TotalStack, matched on damage\n');
    report.add(
      'Each captured TotalStack row beside the stop of our bar (as shipped) whose campaign damage is closest ' +
        'to it. ✓ ours is better · = level · ✗ theirs is better; the percentage is our margin in the player’s ' +
        'direction. **Close** pairs are within 10 % on damage; the cost columns are only a like-for-like reading ' +
        'there. Four-march campaigns, worst opening, default recovery; the queue is one training queue’s total ' +
        'over the four marches, speed bonuses on, no speed-up items.\n',
    );
    const tally = {
      all: Object.fromEntries(CRITERIA.map((c) => [c.head, { win: 0, tie: 0, lose: 0 }])),
      close: Object.fromEntries(CRITERIA.map((c) => [c.head, { win: 0, tie: 0, lose: 0 }])),
    } as Record<'all' | 'close', Record<string, Record<Standing, number>>>;
    let pairs = 0;
    let closePairs = 0;
    const details: string[] = [];

    for (const scenario of scenarios) {
      const held = new Set(scenario.request.units.map((unit) => unit.id));
      const theirs: Campaign[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (!external.name.startsWith('TotalStack')) continue;
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const row = asCaptured(widenedFor(scenario.request, external.counts), external.name, external.counts);
        if (row.damage > 0) theirs.push(row);
      }
      if (theirs.length === 0) continue;
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
      const ours = plan.alternatives.map((stop) => ({
        pick: SHORT[stop.pick] ?? stop.pick,
        c: campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
      }));
      if (ours.length === 0) continue;
      const rows: string[] = [];
      for (const them of theirs) {
        const near = ours.reduce((b, o) =>
          Math.abs(Math.log(o.c.damage / them.damage)) < Math.abs(Math.log(b.c.damage / them.damage)) ? o : b,
        );
        const gap = near.c.damage / them.damage - 1;
        const close = Math.abs(gap) <= CLOSE;
        pairs += 1;
        if (close) closePairs += 1;
        const cells = CRITERIA.map((c) => {
          const u = c.of(near.c);
          const t = c.of(them);
          const s = standing(u, t, c);
          (tally.all[c.head] as Record<Standing, number>)[s] += 1;
          if (close) (tally.close[c.head] as Record<Standing, number>)[s] += 1;
          return `${MARK[s]} ${show(c, u)} vs ${show(c, t)}${pct(u, t, c)}`;
        });
        rows.push(
          `| ${them.name.replace('TotalStack · ', '')} | ${near.pick} | ${close ? 'close' : `**${gap >= 0 ? '+' : '−'}${Math.abs(gap * 100).toFixed(0)} % apart**`} | ${cells.join(' | ')} |`,
        );
      }
      details.push(
        `\n## ${scenario.label}\n\n| their row | our stop | damage gap | ${CRITERIA.map((c) => c.head).join(' | ')} |\n|---|---|---|${'---|'.repeat(CRITERIA.length)}\n` +
          rows.join('\n'),
      );
    }
    const table = (which: 'all' | 'close'): string =>
      '| criterion | ours better | level | theirs better |\n|---|---:|---:|---:|\n' +
      CRITERIA.map((c) => {
        const t = tally[which][c.head] as Record<Standing, number>;
        return `| ${c.head} | ${String(t.win)} | ${String(t.tie)} | ${String(t.lose)} |`;
      }).join('\n');
    report.add(`## Every pair (${String(pairs)} TotalStack rows)\n\n${table('all')}\n`);
    report.add(
      `\n## Close pairs only — within 10 % on damage (${String(closePairs)} of ${String(pairs)})\n\n${table('close')}\n`,
    );
    report.add(details.join('\n'));
    report.save();
  }, 3_600_000);
});
