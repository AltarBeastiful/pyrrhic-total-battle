/**
 * 142 — **what Complete optimization cannot reach, and what it costs** (S-136, 2026-09-23).
 *
 * The owner: *"continue working on improving the benchmarks against TotalStack especially with complete
 * optimization."* This is the lever experiment 139 found and did not price.
 *
 * **The family the plan searches is prefixes of one ranking.** `rankTroops` orders the troop types weakest
 * per point of HP first (`plan.ts:791`, bonus-aware), and every sizer shape the plan scores is taken over
 * `troops.slice(-depth)` — the **strongest `depth` types** (`plan.ts:2795`). So the plan can drop the bottom
 * of the ranking, and only the bottom. 139 measured that on **26 of 34** (army × sizing) cells the best
 * single type to drop is *not* the bottom one, which puts those marches outside the search by construction,
 * at any budget.
 *
 * **What this asks.** Take the bar's own stops. For each, sweep the family the plan already searches (every
 * prefix) and the family one step wider — **every prefix with one further type removed from inside it** —
 * priced on the same arithmetic the benchmark uses. Then report, on the four costs §2 gates on:
 *
 *  - **§A** — how often a non-prefix set *strictly beats* the bar's best stop: more worst-case damage for no
 *    more silver, gold, dragon coins or hired burn. That is the headroom, in the benchmark's own terms.
 *  - **§B** — whether any of it lands inside a **TotalStack** budget the bar currently misses (§3's G0, the
 *    three armies where no stop of ours fits at all). A widening that only adds damage we already had is
 *    worth less than one that enters a comparison we are not in.
 *
 * **Nothing is changed here.** The plan is untouched; this prices the shapes it does not look at, so the
 * decision to widen the family is taken against a figure instead of an argument.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/142-past-the-prefix.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { PlanTotals } from '../../src/engine/plan';
import { effectiveTable, planCampaign, rankTroops } from '../../src/engine/plan';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest } from '../../src/engine/types';
import type { Contender, Spend } from '../../tests/engine/matched-spend';
import { fitsInside, matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, countsOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

/** One shape of the family: the troop ids it fields, and how it was reached. */
interface Shape {
  label: string;
  troops: Set<string>;
  prefix: boolean;
}

/**
 * **The family the plan searches, and the family one step past it.** A prefix of the ranking is what the
 * plan already scores; a prefix with one inner type removed is the smallest widening that reaches the sets
 * 139 found, and it is `O(k²)` shapes rather than the `2^k` of a full subset search.
 */
function family(ranked: readonly string[]): Shape[] {
  const out: Shape[] = [];
  for (let depth = 1; depth <= ranked.length; depth += 1) {
    const prefix = ranked.slice(ranked.length - depth);
    out.push({ label: `prefix ${String(depth)}`, troops: new Set(prefix), prefix: true });
    // One type taken out from inside the prefix — never the bottom of it, which is just a shorter prefix.
    for (let index = 1; index < prefix.length; index += 1) {
      const dropped = prefix[index];
      if (dropped === undefined) continue;
      out.push({
        label: `prefix ${String(depth)} − ${dropped}`,
        troops: new Set(prefix.filter((id) => id !== dropped)),
        prefix: false,
      });
    }
  }
  return out;
}

const spendOf = (row: Campaign): Spend => ({
  silver: row.silver,
  gold: row.gold,
  dragonCoins: row.dragonCoins,
  burned: row.burned,
  seconds: row.seconds,
});

/** Strictly better on the benchmark's terms: more worst-case damage, and inside the other's four costs. */
const strictlyBeats = (one: Campaign, other: Campaign): boolean =>
  one.damage > other.damage && fitsInside(spendOf(one), spendOf(other), 0);

describe.skipIf(!process.env.THEORY)('past the prefix', () => {
  it('prices the shapes Complete optimization does not look at', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('142-past-the-prefix');
    report.add('# 142 — what Complete optimization cannot reach, and what it costs\n');
    report.add(
      'Every sizer shape the plan scores is taken over a **prefix** of `rankTroops` — the strongest `depth` ' +
        'types — so it can drop the bottom of the ranking and only the bottom. This prices the same shapes ' +
        'with **one further type removed from inside the prefix**, which is the smallest family that reaches ' +
        'the sets experiment 139 found, and asks what the bar gives up by not looking at them.\n',
    );
    const rows: string[] = [
      '| army | bar’s best stop | best non-prefix shape | Δ damage | inside its costs? |',
      '|---|---:|---|---:|---|',
    ];
    const g0: string[] = [];
    let beaten = 0;
    let measured = 0;
    for (const scenario of scenarios) {
      const request = scenario.request;
      let plan;
      try {
        plan = planCampaign({
          request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        continue;
      }
      const stops = plan.alternatives.map((stop) =>
        campaignOf(request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
      );
      if (stops.length === 0) continue;
      const bestStop = stops.reduce((best, row) => (row.damage > best.damage ? row : best));
      const ranked = rankTroops(effectiveTable(request)).map((entry) => entry.id);
      if (ranked.length < 3) continue;
      measured += 1;
      // The rare stock the bar's best stop fields — held fixed, so the only thing varying is the troop set.
      const rare = request.units.filter((unit) => unit.pool !== 'leadership').map((unit) => unit.id);
      let bestOther: { shape: Shape; row: Campaign } | null = null;
      for (const shape of family(ranked)) {
        if (shape.prefix) continue;
        const keep = new Set([...shape.troops, ...rare]);
        const scoped: StackRequest = { ...request, units: request.units.filter((u) => keep.has(u.id)) };
        const counts = countsOf(sizeStacks(scoped));
        if (Object.values(counts).every((count) => count <= 0)) continue;
        // Priced over the horizon exactly as a stop is: the same march repeated on its own stock.
        const marches = Array.from({ length: HORIZON }, () => counts);
        const row = campaignOf(request, shape.label, 'plan', marches);
        if (!bestOther || row.damage > bestOther.row.damage) bestOther = { shape, row };
      }
      if (!bestOther) continue;
      const wins = strictlyBeats(bestOther.row, bestStop);
      if (wins) beaten += 1;
      rows.push(
        `| ${scenario.label.slice(0, 40)} | ${bestStop.name.replace('Complete optimization · ', '')} ` +
          `${n(bestStop.damage)} | ${bestOther.shape.label} ${n(bestOther.row.damage)} | ` +
          `${((bestOther.row.damage / bestStop.damage - 1) * 100).toFixed(1)} % | ${wins ? '**yes**' : 'no'} |`,
      );
      // §B — does it enter a TotalStack budget the bar misses?
      const held = new Set(request.units.map((unit) => unit.id));
      const theirs: Campaign[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        theirs.push(asCaptured(widenedFor(request, external.counts), external.name, external.counts));
      }
      if (theirs.length === 0) continue;
      const before = matchedSpend(stops as Contender[], theirs as Contender[]);
      const after = matchedSpend([...stops, bestOther.row] as Contender[], theirs as Contender[]);
      if (after.unfitted < before.unfitted || after.rowsBeaten > before.rowsBeaten) {
        g0.push(
          `**${scenario.label.slice(0, 44)}** — rows with no stop inside their budget ` +
            `${String(before.unfitted)} → **${String(after.unfitted)}**, rows dominated ` +
            `${String(before.rowsBeaten)} → **${String(after.rowsBeaten)}** (adding \`${bestOther.shape.label}\`)`,
        );
      }
    }
    report.add('\n## §A — the headroom, on the four costs §2 gates on\n');
    report.add(rows.join('\n'));
    report.add(
      `\n**${String(beaten)}** of the **${String(measured)}** armies measured have a non-prefix shape that ` +
        'is **strictly better than the bar’s best stop** — more worst-case damage for no more silver, gold, ' +
        'dragon coins or hired burn, at zero tolerance.\n',
    );
    report.add('\n## §B — does any of it enter a TotalStack budget the bar misses?\n');
    report.add(
      g0.length === 0
        ? '_No army’s matched-spend standing improves by adding the best non-prefix shape._'
        : `**${String(g0.length)}** armies improve:\n\n- ${g0.join('\n- ')}`,
    );
    report.save();
  }, 3_600_000);
});
