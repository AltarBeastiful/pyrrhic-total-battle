/**
 * 150 — **the bar against TotalStack, on every marker** (W10, 2026-09-23; the owner, after the fold shipped:
 * *"and what about TotalStack comparison across all markers"*).
 *
 * For every benchmark army with captured TotalStack rows, three things are set side by side on the **ten
 * readings** the fold is judged on — the most damage; the least silver, hired burned, gold, dragon coins and
 * training queue; damage a silver, a hired unit, a gold and a dragon coin:
 *
 *  - **TotalStack** — its best on each reading over every comparable captured row (rows fielding a unit the
 *    army does not hold are left out, as the benchmark does; rows that deal nothing are left out, as
 *    `markerFloors` does);
 *  - **before** — our bar before W10 (no hired saver, no fold);
 *  - **now** — our bar as shipped (`burnSaver: 'silver', foldTo: 5`).
 *
 * Each reading is "best against best on that reading alone" — `markerFloors`' reading, widened from six markers
 * to ten — and scored win / tie / lose exactly as it scores them. Matched spend (rows dominated, rows no stop
 * fits, the hardest row's margin) is printed beside it, because "best against best" alone can pair our cheapest
 * stop with their hardest-hitting one.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/150-against-totalstack.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanTotals } from '../../src/engine/plan';
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
type Standing = 'win' | 'tie' | 'lose';

const best = (set: Campaign[], r: Reading): number =>
  r.high ? Math.max(...set.map((c) => r.of(c))) : Math.min(...set.map((c) => r.of(c)));
const standing = (us: number, them: number, r: Reading): Standing => {
  const better = r.high ? us > them : us < them;
  const worse = r.high ? us < them : us > them;
  return better ? 'win' : worse ? 'lose' : 'tie';
};
/** How far ahead (+) or behind (−) we are, in percent of theirs, in the player's direction. */
const margin = (us: number, them: number, r: Reading): string => {
  if (us === them) return '=';
  if (them === 0) return r.high ? '+∞' : 'over their 0';
  const x = ((r.high ? us - them : them - us) / Math.abs(them)) * 100;
  return `${x > 0 ? '+' : '−'}${Math.abs(x).toFixed(1)} %`;
};
const show = (r: Reading, value: number): string => {
  if (r.head === 'shortest queue') return `${n(Math.round(value / 3600))} h`;
  if (r.head === 'dmg a silver') return value.toFixed(3);
  if (r.head === 'dmg a coin' && value === 0) return '—';
  return n(Math.round(value));
};
const MARK: Record<Standing, string> = { win: '✓', tie: '=', lose: '✗' };

const planFor = (request: StackRequest, shipped: boolean): CampaignPlan | undefined => {
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      ...(shipped ? {} : { burnSaver: undefined, foldTo: undefined }),
      putBack: CAMPAIGN.putBack,
    });
  } catch {
    return undefined;
  }
};

describe.skipIf(!process.env.THEORY)('against TotalStack', () => {
  it('sets the bar before and after W10 against TotalStack on every marker', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('150-against-totalstack');
    report.add('# 150 — the bar against TotalStack, on every marker\n');
    report.add(
      'Each reading is our bar’s best against TotalStack’s best over its comparable captured rows, on that ' +
        'reading alone. **Before** is the bar before W10; **now** is the bar as shipped (hired saver + fold to ' +
        'five). ✓ we are ahead · = level · ✗ behind. Figures are four-march campaigns, worst opening, default ' +
        'recovery; the queue is one training queue’s total over the four marches, speed bonuses on, no speed-up ' +
        'items.\n',
    );
    const tally = {
      before: Object.fromEntries(READINGS.map((r) => [r.head, { win: 0, tie: 0, lose: 0 }])),
      now: Object.fromEntries(READINGS.map((r) => [r.head, { win: 0, tie: 0, lose: 0 }])),
    } as Record<'before' | 'now', Record<string, Record<Standing, number>>>;
    const spend = { before: { beat: 0, out: 0, rows: 0 }, now: { beat: 0, out: 0, rows: 0 } };
    const moved: string[] = [];
    const details: string[] = [];
    let armies = 0;

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
      const before = planFor(scenario.request, false);
      const now = planFor(scenario.request, true);
      if (!before || !now || now.alternatives.length === 0) continue;
      armies += 1;
      const priced = (plan: CampaignPlan): Campaign[] =>
        plan.alternatives.map((stop) =>
          campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
        );
      const a = priced(before);
      const b = priced(now);
      const va = matchedSpend(a as Contender[], theirs as Contender[]);
      const vb = matchedSpend(b as Contender[], theirs as Contender[]);
      spend.before.beat += va.rowsBeaten;
      spend.before.out += va.unfitted;
      spend.before.rows += va.rows.length;
      spend.now.beat += vb.rowsBeaten;
      spend.now.out += vb.unfitted;
      spend.now.rows += vb.rows.length;

      const lines: string[] = [];
      for (const r of READINGS) {
        const them = best(theirs, r);
        const was = best(a, r);
        const is = best(b, r);
        const sa = standing(was, them, r);
        const sb = standing(is, them, r);
        (tally.before[r.head] as Record<Standing, number>)[sa] += 1;
        (tally.now[r.head] as Record<Standing, number>)[sb] += 1;
        if (sa !== sb || was !== is) {
          moved.push(
            `**${scenario.label.slice(0, 50)}** — ${r.head}: ${MARK[sa]} ${show(r, was)} (${margin(was, them, r)}) → ` +
              `${MARK[sb]} ${show(r, is)} (${margin(is, them, r)}) against TotalStack’s ${show(r, them)}`,
          );
        }
        lines.push(
          `| ${r.head} | ${show(r, them)} | ${MARK[sa]} ${show(r, was)} (${margin(was, them, r)}) | ` +
            `${MARK[sb]} ${show(r, is)} (${margin(is, them, r)}) |`,
        );
      }
      const hardest = (v: typeof va): string =>
        v.hardest?.ours
          ? `${v.hardest.theirs.name.replace('TotalStack · ', '')}: ${v.hardest.delta >= 0 ? '+' : '−'}${Math.abs(v.hardest.delta * 100).toFixed(1)} %`
          : v.hardest
            ? `${v.hardest.theirs.name.replace('TotalStack · ', '')}: no stop fits`
            : '—';
      details.push(
        `\n## ${scenario.label}\n\n${String(theirs.length)} TotalStack rows. Stops: before ${String(before.alternatives.length)}, ` +
          `now ${String(now.alternatives.length)}.\n\n| reading | TotalStack’s best | before | now |\n|---|---:|---:|---:|\n` +
          lines.join('\n') +
          `\n| **rows dominated at matched spend** | of ${String(va.rows.length)} | ${String(va.rowsBeaten)} | ${String(vb.rowsBeaten)} |` +
          `\n| **rows no stop fits** | | ${String(va.unfitted)} | ${String(vb.unfitted)} |` +
          `\n| **their hardest row, our best stop inside its budget** | | ${hardest(va)} | ${hardest(vb)} |`,
      );
    }

    report.add(`## Across the ${String(armies)} armies with TotalStack rows\n`);
    report.add(
      '| reading | before: ahead / level / behind | now: ahead / level / behind |\n|---|---:|---:|\n' +
        READINGS.map((r) => {
          const x = tally.before[r.head] as Record<Standing, number>;
          const y = tally.now[r.head] as Record<Standing, number>;
          return `| ${r.head} | ${String(x.win)} / ${String(x.tie)} / ${String(x.lose)} | ${String(y.win)} / ${String(y.tie)} / ${String(y.lose)} |`;
        }).join('\n') +
        `\n\n**Matched spend** over ${String(spend.now.rows)} TotalStack rows: before ${String(spend.before.beat)} dominated, ` +
        `${String(spend.before.out)} no stop fits; now ${String(spend.now.beat)} dominated, ${String(spend.now.out)} no stop fits.\n`,
    );
    report.add(
      '\n## What moved\n\n' +
        (moved.length > 0 ? `- ${moved.join('\n- ')}` : 'Nothing, on any reading of any army.') +
        '\n',
    );
    report.add(details.join('\n'));
    report.save();
  }, 3_600_000);
});
