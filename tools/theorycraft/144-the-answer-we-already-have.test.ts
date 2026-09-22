/**
 * 144 — **the plan already holds answers it never offers** (S-138, 2026-09-23).
 *
 * Experiment 143 measured *which* marker refuses the bar on every captured row it fails to dominate, and the
 * shape of the answer was narrow: `gold` and `burned` refuse us **15 times each**, silver only 4 and coins 2,
 * and **10 of the refusals are within 20 %** of the budget. On the 12 000-leadership export — the worst of
 * §3's G0, six of nine rows with no stop inside their budget — the misses are **three chunks of burn**
 * (45 against the 42 they allow) and **27 gold** (2 984 against 2 956.8). That is a coverage defect, not a
 * reach defect.
 *
 * Then the frontier said something sharper. The bar offers stops at **45 · 67 · 82** chunks on that army,
 * and the frontier it chose them from holds **476 rows at 44 chunks or fewer** — the best of them burning
 * **42** for **26 135 439**, more damage than the silver saver's 20 864 973 at *less* burn, marked
 * `undominated` **and** `inBand`, and offered as nothing. The stop rules pick the thrift end by **silver**,
 * so a plan that spends more silver for far less burn is never a pick however well it would fit.
 *
 * **So the question this asks is not "can the engine reach it" but "has it already reached it".** For every
 * captured row no *stop* of ours fits inside, it tests every **undominated frontier row** — priced on the
 * same arithmetic, over the same horizon, as a stop — and reports whether one fits. Where one does, the
 * defect is **which plans the bar offers**, and the fix is a stop rule rather than a wider search. Where
 * none does, the plan genuinely cannot answer that march and W4's reach work is what is needed.
 *
 * The two need opposite work, and until now nothing separated them.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/144-the-answer-we-already-have.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { PlanFrontierRow, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Contender } from '../../tests/engine/matched-spend';
import { TOLERANCE, fitsInside, matchedSpend, overspentOn } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

/**
 * **How many frontier rows are priced per army.** The frontier runs to 3 818 rows on one of these armies and
 * each row costs four battles to price over the horizon, so the set is narrowed twice before pricing: to the
 * **undominated** rows — a dominated plan cannot fit a budget an undominated one misses, since something on
 * the frontier beats it on every axis — and then to the **thriftiest in the hired burn**, which 143 measured
 * as the marker that refuses us most often together with gold. The cap is stated in the report; where it
 * binds, the answer below is a **lower bound** on what the plan already holds.
 */
const PRICE_AT_MOST = 300;

describe.skipIf(!process.env.THEORY)('the answer we already have', () => {
  it('asks whether an unoffered plan fits where no stop does', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('144-the-answer-we-already-have');
    report.add('# 144 — the plan already holds answers it never offers\n');
    report.add(
      'For every captured row **no stop of ours fits inside**, this tests every undominated row of the ' +
        'frontier the stops were chosen from — priced over the same horizon, on the same arithmetic. A row ' +
        'that fits means the plan **found** the answer and the bar did not **offer** it, which is a stop ' +
        'rule to fix rather than a search to widen.\n',
    );
    const rows: string[] = [
      '| army | their row | no stop fits, refused on | a frontier plan fits? | its burn / gold / silver | its damage vs their row |',
      '|---|---|---|---|---|---:|',
    ];
    let noFit = 0;
    let rescued = 0;
    let rescuedBeats = 0;
    const capped: string[] = [];
    for (const scenario of scenarios) {
      let plan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
          withFrontier: true,
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
      const missed = verdict.rows.filter((row) => row.ours === null);
      if (missed.length === 0) continue;

      // Price the frontier once per army, narrowed as the constant above explains.
      const frontier: PlanFrontierRow[] = plan.frontier ?? [];
      const undominated = frontier.filter((row) => row.undominated);
      const ordered = [...undominated].sort((a, b) => a.mercLost - b.mercLost);
      if (ordered.length > PRICE_AT_MOST) {
        capped.push(
          `**${scenario.label.slice(0, 40)}** — ${String(undominated.length)} undominated rows, ` +
            `${String(PRICE_AT_MOST)} priced`,
        );
      }
      const priced: Campaign[] = [];
      const seen = new Set<string>();
      for (const row of ordered.slice(0, PRICE_AT_MOST)) {
        const marches = marchesOf(row as PlanTotals);
        const key = JSON.stringify(marches);
        if (seen.has(key)) continue;
        seen.add(key);
        priced.push(campaignOf(scenario.request, `frontier@${String(row.mercLost)}`, 'plan', marches));
      }
      let first = true;
      for (const row of missed) {
        noFit += 1;
        const fitting = priced.filter((one) => fitsInside(one, row.theirs, TOLERANCE));
        const best = fitting.reduce<Campaign | null>(
          (top, one) => (!top || one.damage > top.damage ? one : top),
          null,
        );
        if (best) {
          rescued += 1;
          if (best.damage > row.theirs.damage) rescuedBeats += 1;
        }
        rows.push(
          `| ${first ? scenario.label.slice(0, 32) : ''} | ${row.theirs.name.slice(0, 26)} | ` +
            `${row.over.join(', ') || overspentOn(stops[0] as Campaign, row.theirs).join(', ')} | ` +
            `${best ? '**yes**' : 'no'} | ${best ? `${String(best.burned)} / ${n(best.gold)} / ${n(best.silver)}` : '—'} | ` +
            `${best ? `${((best.damage / row.theirs.damage - 1) * 100).toFixed(1)} %` : '—'} |`,
        );
        first = false;
      }
    }
    report.add(rows.join('\n'));
    report.add(
      '\n## What this separates\n\n' +
        `- **${String(noFit)}** captured rows have no stop of ours inside their budget.\n` +
        `- **${String(rescued)}** of them have an **undominated frontier plan that does fit** — the plan ` +
        'found the answer and the bar never offered it. Those are a **stop rule**, not a search.\n' +
        `- **${String(rescuedBeats)}** of those fit *and* out-damage the row, which turns a "no stop fits" ` +
        'into a **beat** with no new search at all.\n' +
        `- **${String(noFit - rescued)}** have nothing on the frontier that fits, and those are the ones ` +
        "W4's reach work is actually for.\n" +
        (capped.length > 0
          ? `\nThe frontier was capped at ${String(PRICE_AT_MOST)} rows on ${String(capped.length)} armies, ` +
            `so the counts above are a **lower bound**:\n\n- ${capped.join('\n- ')}\n`
          : ''),
    );
    report.save();
  }, 3_600_000);
});
