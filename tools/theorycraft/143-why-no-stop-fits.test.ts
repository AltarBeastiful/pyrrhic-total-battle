/**
 * 143 — **which marker refuses us, row by row** (S-137, 2026-09-23).
 *
 * §2's standing is **5 beats, 9 short, 3 with no stop inside their budget** at the app's own recovery
 * default. The three that fit nowhere are worse than any deficit — on those marches the bar is not losing
 * the comparison, it is not in it — and §3 groups them as G0 without saying, per row, *what* closes the
 * door. Experiment 138 §D asked that of the three armies whose verdict moves with the recovery setting;
 * this asks it of every army and every captured row we do not dominate.
 *
 * For each row of theirs the bar fails to beat, this reports **which of the four costs every stop of ours
 * overspends on** and **by how much the cheapest stop misses** — because a miss of 6 % is a coverage defect
 * a wider grid closes, and a miss of 400 % is a different march entirely. Those two need opposite work, and
 * the plan has been treating them as one bucket.
 *
 * It also separates the two reasons a marker can refuse us, which §2's docstring flags as its sharpest
 * edge: a rival that spends **nothing** of a marker can only be matched by a stop that spends none either,
 * so `0 × 1.05` is still `0`. A row refused on a zero is not near-missing anything.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/143-why-no-stop-fits.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Contender } from '../../tests/engine/matched-spend';
import { COSTS, TOLERANCE, matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

describe.skipIf(!process.env.THEORY)('why no stop fits', () => {
  it('names the marker and the margin on every row we do not beat', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('143-why-no-stop-fits');
    report.add('# 143 — which marker refuses us, row by row\n');
    report.add(
      'For every captured row the bar does not dominate: the cost every stop of ours overspends on, what ' +
        'the row allows at the 5 % tolerance, what our cheapest stop pays, and the margin. A **zero** in ' +
        '*their* column is a hard gate — `0 × 1.05` is still `0` — and a row refused on one is not near ' +
        'missing anything.\n',
    );
    const rows: string[] = [
      '| army | their row | refused on | they allow | our cheapest | over by |',
      '|---|---|---|---:|---:|---:|',
    ];
    /** Every (army, row, cost) refusal, so the tail can be counted by size rather than described. */
    const margins: { over: number; zero: boolean; cost: string; army: string }[] = [];
    let noFitRows = 0;
    let shortRows = 0;
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
      const stops = plan.alternatives.map((stop) =>
        campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
      );
      if (stops.length === 0) continue;
      const held = new Set(scenario.request.units.map((unit) => unit.id));
      const theirs: Campaign[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        theirs.push(
          asCaptured(widenedFor(scenario.request, external.counts), external.name, external.counts),
        );
      }
      if (theirs.length === 0) continue;
      const verdict = matchedSpend(stops as Contender[], theirs as Contender[]);
      let first = true;
      for (const row of verdict.rows) {
        if (row.beaten) continue;
        if (row.ours === null) noFitRows += 1;
        else {
          shortRows += 1;
          continue; // a "short" row fits; its problem is damage, not a marker
        }
        for (const cost of row.over) {
          const allow = row.theirs[cost] * (1 + TOLERANCE);
          const cheapest = Math.min(...stops.map((stop) => stop[cost]));
          const over = allow > 0 ? cheapest / allow - 1 : Number.POSITIVE_INFINITY;
          margins.push({ over, zero: row.theirs[cost] === 0, cost, army: scenario.label });
          rows.push(
            `| ${first ? scenario.label.slice(0, 34) : ''} | ${first ? row.theirs.name.slice(0, 30) : ''} | ` +
              `**${cost}** | ${row.theirs[cost] === 0 ? '**0 — hard gate**' : n(allow)} | ${n(cheapest)} | ` +
              `${Number.isFinite(over) ? `${(over * 100).toFixed(1)} %` : '∞'} |`,
          );
          first = false;
        }
      }
    }
    report.add(rows.join('\n'));
    const finite = margins.filter((m) => Number.isFinite(m.over)).sort((a, b) => a.over - b.over);
    const zeros = margins.filter((m) => m.zero);
    const near = finite.filter((m) => m.over <= 0.2);
    report.add(
      '\n## What the refusals are made of\n\n' +
        `- **${String(noFitRows)}** captured rows have no stop of ours inside their budget; ` +
        `**${String(shortRows)}** rows we do fit inside and simply hit less hard.\n` +
        `- **${String(zeros.length)}** of the refusals are on a marker the rival spends **nothing** of, ` +
        'where no tolerance can help: matching a zero needs a stop that pays none either.\n' +
        `- **${String(near.length)}** are within **20 %** of the budget — coverage a wider grid could ` +
        `close${near.length > 0 ? `: ${near.map((m) => `${m.cost} +${(m.over * 100).toFixed(1)} %`).join(', ')}` : ''}.\n` +
        `- the rest are wide misses, the worst **${
          finite.length > 0 ? `${((finite[finite.length - 1]?.over ?? 0) * 100).toFixed(0)} %` : '—'
        }** over.\n\n` +
        '**Which cost refuses us most often:** ' +
        COSTS.map((cost) => `${cost} ${String(margins.filter((m) => m.cost === cost).length)}`).join(' · ') +
        '.\n',
    );
    report.save();
  }, 3_600_000);
});
