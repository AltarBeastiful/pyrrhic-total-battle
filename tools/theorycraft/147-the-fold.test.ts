/**
 * 147 — **the fold: which three stops to keep** (W10 §9.5, 2026-09-23; the owner: *"we should try to fold
 * uninteresting stops … as long as we spend all the time possible to find the best solutions, they can be
 * filtered in the end to retain the three best ones"*).
 *
 * The pool is every stop the engine can offer — the bar with the hired saver offered everywhere
 * (`burnSaver: 'silver'`), before any fold. Every set of three of them is then scored, army by army, on:
 *
 *  - the **seven readings** of the plan's §1 (damage, damage a silver / merc / gold / coin, least silver,
 *    least burn), the set's best on each against the whole pool's best — a set "loses" a marker when its best
 *    is under the pool's;
 *  - **matched spend** against every captured TotalStack row: rows dominated and rows no stop fits;
 *  - **S-61** on the set as it would be drawn — sorted on the burn, every stop burns more and hits harder than
 *    the one to its left (`all-in` exempt, as in the criteria);
 *  - whether it keeps the **sweet spot**, the bar's recommendation.
 *
 * And each stop is read **alone**: what it holds that no other stop of the pool does — the markers it is the
 * only best on, the TotalStack rows only it dominates or fits inside. A stop that holds nothing alone is the
 * "uninteresting" one: folding it costs nothing.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/147-the-fold.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { PlanRow, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

const MARKERS = [
  'damage',
  'damage a silver',
  'damage a merc',
  'damage a gold',
  'damage a coin',
  'least silver',
  'least burn',
] as const;
type Marker = (typeof MARKERS)[number];

const reading = (c: Campaign, m: Marker): number => {
  switch (m) {
    case 'damage':
      return c.damage;
    case 'damage a silver':
      return c.silver > 0 ? c.damage / c.silver : 0;
    case 'damage a merc':
      return c.hiredDamage / Math.max(1, c.burned);
    case 'damage a gold':
      return c.gold > 0 ? c.damage / c.gold : 0;
    case 'damage a coin':
      return c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0;
    case 'least silver':
      return -c.silver;
    case 'least burn':
      return -c.burned;
  }
};
const best = (set: Campaign[], m: Marker): number => Math.max(...set.map((c) => reading(c, m)));

const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};

/** Every k-subset of `items`, in order. */
function subsets<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [head, ...rest] = items as [T, ...T[]];
  return [...subsets(rest, k - 1).map((s) => [head, ...s]), ...subsets(rest, k)];
}

/** S-61 on the set as drawn: sorted on the burn, each non-`all-in` stop burns more and hits harder. */
const orderHolds = (rows: PlanRow[]): boolean => {
  const sorted = [...rows].sort(
    (a, b) => a.repeat.mercLost - b.repeat.mercLost || a.repeat.silver - b.repeat.silver,
  );
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1] as PlanRow;
    const cur = sorted[i] as PlanRow;
    if (cur.pick === 'all-in') continue;
    if (cur.repeat.mercLost <= prev.repeat.mercLost || cur.repeat.damage <= prev.repeat.damage) return false;
  }
  return true;
};

describe.skipIf(!process.env.THEORY)('the fold', () => {
  it('scores every set of three stops on every army', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('147-the-fold');
    report.add('# 147 — the fold: which three stops to keep\n');
    report.add(
      'Pool: every stop the engine offers with the hired saver on everywhere (`burnSaver: \'silver\'`). ' +
        'Codes: **HS** hired saver · **SS** silver saver · **SW** sweet spot · **MM** more mercs · **MX** ' +
        'steady max · **AI** all in. Damage, silver, burned, gold and coins are the **campaign’s** (four ' +
        'marches, worst opening), at the app’s default recovery.\n',
    );
    const summary: string[] = [
      '| army | pool | stops that hold something alone | best three | markers lost | dominated (pool → three) | no fit (pool → three) | S-61 | keeps SW |',
      '|---|---|---|---|---|---|---|---|---|',
    ];
    const details: string[] = [];
    let armiesOverThree = 0;
    let armiesLossless = 0;
    let armiesLosslessOrdered = 0;
    let armiesLosslessOrderedSweet = 0;
    const totals = { poolBeat: 0, poolOut: 0, threeBeat: 0, threeOut: 0 };

    for (const scenario of scenarios) {
      let plan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          burnSaver: 'silver',
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        continue;
      }
      const stops = plan.alternatives;
      if (stops.length === 0) continue;
      const held = new Set(scenario.request.units.map((unit) => unit.id));
      const theirs: Campaign[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        theirs.push(asCaptured(widenedFor(scenario.request, external.counts), external.name, external.counts));
      }
      const priced = new Map<PlanRow, Campaign>(
        stops.map((stop) => [stop, campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals))]),
      );
      const campaigns = (rows: PlanRow[]): Campaign[] => rows.map((row) => priced.get(row) as Campaign);
      const verdict = (rows: PlanRow[]): { beat: number; out: number; beaten: Set<string>; fitted: Set<string> } => {
        if (theirs.length === 0) return { beat: 0, out: 0, beaten: new Set(), fitted: new Set() };
        const v = matchedSpend(campaigns(rows) as Contender[], theirs as Contender[]);
        return {
          beat: v.rowsBeaten,
          out: v.unfitted,
          beaten: new Set(v.rows.filter((r) => r.beaten).map((r) => r.theirs.name)),
          fitted: new Set(v.rows.filter((r) => r.ours !== null).map((r) => r.theirs.name)),
        };
      };
      const pool = verdict(stops);
      const poolBest = Object.fromEntries(MARKERS.map((m) => [m, best(campaigns(stops), m)])) as Record<Marker, number>;

      // Each stop alone: what the pool loses without it.
      const alone = stops.map((stop) => {
        const rest = stops.filter((other) => other !== stop);
        const lost = rest.length === 0 ? [...MARKERS] : MARKERS.filter((m) => best(campaigns(rest), m) < poolBest[m] - 1e-9);
        const v = verdict(rest);
        const onlyBeats = [...pool.beaten].filter((name) => !v.beaten.has(name));
        const onlyFits = [...pool.fitted].filter((name) => !v.fitted.has(name));
        return { stop, lost, onlyBeats, onlyFits };
      });
      const interesting = alone.filter((a) => a.lost.length + a.onlyBeats.length + a.onlyFits.length > 0);

      // The detail table: the pool, stop by stop.
      details.push(`\n### ${scenario.label}\n`);
      details.push(
        '| stop | damage | silver | burned | gold | coins | damage a silver | damage a merc | what it holds alone |\n' +
          '|---|---:|---:|---:|---:|---:|---:|---:|---|',
      );
      for (const a of alone) {
        const c = priced.get(a.stop) as Campaign;
        const holds = [
          ...a.lost.map((m) => `best ${m}`),
          ...(a.onlyBeats.length > 0 ? [`only stop dominating ${String(a.onlyBeats.length)} TS row(s)`] : []),
          ...(a.onlyFits.length > 0 ? [`only stop fitting ${String(a.onlyFits.length)} TS row(s)`] : []),
        ];
        details.push(
          `| ${SHORT[a.stop.pick] ?? a.stop.pick} | ${n(c.damage)} | ${n(c.silver)} | ${String(c.burned)} | ` +
            `${n(c.gold)} | ${n(c.dragonCoins)} | ${n(reading(c, 'damage a silver'))} | ` +
            `${n(reading(c, 'damage a merc'))} | ${holds.length > 0 ? holds.join('; ') : '**nothing — foldable**'} |`,
        );
      }

      const code = (rows: PlanRow[]): string =>
        [...rows]
          .sort((a, b) => a.repeat.mercLost - b.repeat.mercLost || a.repeat.silver - b.repeat.silver)
          .map((r) => SHORT[r.pick] ?? r.pick)
          .join('·');
      const interestingCode = interesting.map((a) => SHORT[a.stop.pick] ?? a.stop.pick).join(' ');
      totals.poolBeat += pool.beat;
      totals.poolOut += pool.out;
      if (stops.length <= 3) {
        summary.push(
          `| ${scenario.label.slice(0, 40)} | ${code(stops)} | ${interestingCode || '—'} | (already ≤ 3) | — | ` +
            `${String(pool.beat)} | ${String(pool.out)} | ${orderHolds(stops) ? '✓' : '✗'} | ${stops.some((s) => s.pick === 'sweet-spot') ? '✓' : '✗'} |`,
        );
        totals.threeBeat += pool.beat;
        totals.threeOut += pool.out;
        armiesLossless += 1;
        if (orderHolds(stops)) armiesLosslessOrdered += 1;
        if (orderHolds(stops) && stops.some((s) => s.pick === 'sweet-spot')) armiesLosslessOrderedSweet += 1;
        continue;
      }
      armiesOverThree += 1;
      // Score every set of three: fewest markers lost, then most dominated, then fewest no-fit, then S-61
      // holding, then keeping the sweet spot.
      const scored = subsets(stops, 3).map((set) => {
        const lost = MARKERS.filter((m) => best(campaigns(set), m) < poolBest[m] - 1e-9);
        const v = verdict(set);
        return {
          set,
          lost,
          beat: v.beat,
          out: v.out,
          order: orderHolds(set),
          sweet: set.some((s) => s.pick === 'sweet-spot'),
        };
      });
      scored.sort(
        (a, b) =>
          a.lost.length - b.lost.length ||
          b.beat - a.beat ||
          a.out - b.out ||
          Number(b.order) - Number(a.order) ||
          Number(b.sweet) - Number(a.sweet),
      );
      const top = scored[0];
      if (!top) continue;
      totals.threeBeat += top.beat;
      totals.threeOut += top.out;
      const lossless = scored.filter((s) => s.lost.length === 0 && s.beat === pool.beat && s.out === pool.out);
      if (lossless.length > 0) armiesLossless += 1;
      if (lossless.some((s) => s.order)) armiesLosslessOrdered += 1;
      if (lossless.some((s) => s.order && s.sweet)) armiesLosslessOrderedSweet += 1;
      summary.push(
        `| ${scenario.label.slice(0, 40)} | ${code(stops)} | ${interestingCode || '—'} | ${code(top.set)} | ` +
          `${top.lost.length > 0 ? top.lost.join(', ') : 'none'} | ${String(pool.beat)} → ${String(top.beat)} | ` +
          `${String(pool.out)} → ${String(top.out)} | ${top.order ? '✓' : '✗'} | ${top.sweet ? '✓' : '✗'} |`,
      );
      details.push(
        `\nAll ${String(scored.length)} sets of three, best first:\n\n| set | markers lost | dominated | no fit | S-61 | keeps SW |\n|---|---|---:|---:|---|---|\n` +
          scored
            .map(
              (s) =>
                `| ${code(s.set)} | ${s.lost.length > 0 ? s.lost.join(', ') : 'none'} | ${String(s.beat)} | ${String(s.out)} | ${s.order ? '✓' : '✗'} | ${s.sweet ? '✓' : '✗'} |`,
            )
            .join('\n'),
      );
    }
    report.add('## Summary\n');
    report.add(summary.join('\n'));
    report.add(
      `\n\n**Armies with more than three stops in the pool:** ${String(armiesOverThree)}. ` +
        `**Armies where some set of three loses nothing** (no marker, no dominated row, no fitted row): ` +
        `${String(armiesLossless)} of ${String(summary.length - 2)}; of those, with S-61 holding: ` +
        `${String(armiesLosslessOrdered)}; and keeping the sweet spot as well: ${String(armiesLosslessOrderedSweet)}.\n\n` +
        `**Totals** — the pool: ${String(totals.poolBeat)} dominated, ${String(totals.poolOut)} no fit; ` +
        `the best three on each army: ${String(totals.threeBeat)} dominated, ${String(totals.threeOut)} no fit.\n`,
    );
    report.add('\n## Army by army\n');
    report.add(details.join('\n'));
    report.save();
  }, 3_600_000);
});
