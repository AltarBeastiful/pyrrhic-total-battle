/**
 * 145 — **which three stops the bar should offer** (S-139, 2026-09-23).
 *
 * 144 measured that **14 of the 22** captured rows no stop of ours fits inside have an *undominated* plan on
 * the frontier that does fit — the plan found the answer and the bar never offered it. That makes the bar's
 * pick rule the lever, and the owner set the terms (2026-09-23): *"keep three spots can mean keep the three
 * best options"*; the slider runs along the hired burn — *"silver saving (and lowering the total health and
 * burning less mercs as we can shield less)"* at the low end, *"more merc burned middle"*, *"usually all in
 * while maximizing silver/dmg"* at the top — and a player *"might be deprived of silver at the moment, so it
 * makes sense to find the best possible low silver march to have a cheap option"*.
 *
 * Three candidate rules are priced here against the bar as it stands, on the two figures §2 turns on: how
 * many captured rows the bar **dominates**, and how many it cannot get **inside** at all.
 *
 *  - **A — re-axis all three** onto the burn: cheapest burn, best damage-a-silver, max burn.
 *  - **B — keep today's stops and add the lowest-burn undominated plan.**
 *  - **C — keep today's stops and add the best damage-a-silver undominated plan.**
 *
 * The answer is not the one this experiment was written expecting, which is why it is written down: **A, the
 * rule this plan proposed, loses more than it gains.** B and C both help and they help on *different*
 * armies, so the choice between them is a product call and not an arithmetic one.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/145-which-three-stops.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { PlanFrontierRow, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

const perSilver = (row: PlanFrontierRow): number => (row.silver > 0 ? row.totalDamage / row.silver : 0);

describe.skipIf(!process.env.THEORY)('which three stops', () => {
  it('prices three pick rules against the bar as it stands', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('145-which-three-stops');
    report.add('# 145 — which three stops the bar should offer\n');
    report.add(
      'Three pick rules against the bar as it stands, on the two figures §2 turns on. **A** re-axes all ' +
        'three stops onto the burn; **B** keeps them and adds the lowest-burn undominated plan; **C** keeps ' +
        'them and adds the best damage-a-silver undominated plan.\n',
    );
    const tally: Record<string, { beaten: number; unfitted: number }> = {
      today: { beaten: 0, unfitted: 0 },
      A: { beaten: 0, unfitted: 0 },
      B: { beaten: 0, unfitted: 0 },
      C: { beaten: 0, unfitted: 0 },
      Bswap: { beaten: 0, unfitted: 0 },
    };
    /**
     * **The four ratio floors, per rule** (owner, 2026-09-23: *"you're still missing one of the mandatory
     * metric merc spent"* — and he is right, every table above this story read damage a silver and left
     * damage a **merc** out, which is one of the floors his goal is stated on).
     *
     * A rule that only **adds** a stop can never lower the bar's best on any marker; one that **swaps** a
     * stop out can, which is exactly why `Bswap` is measured beside `B` rather than assumed equal to it.
     * Each entry counts the armies on which that rule's best reading is **worse than the bar's today**.
     */
    const floors: Record<string, Record<string, number>> = {
      A: {},
      B: {},
      C: {},
      Bswap: {},
    };
    /** Which army each drop happened on, so a count of one can be read rather than trusted. */
    const dropped: string[] = [];
    const rows: string[] = [
      '| army | today | A · re-axis | B · + lowest burn | C · + best a silver | B-swap |',
      '|---|---|---|---|---|---|',
    ];
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
      const today = plan.alternatives.map((stop) =>
        campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
      );
      const frontier = (plan.frontier ?? []).filter((row) => row.undominated && row.inBand);
      if (today.length === 0 || frontier.length === 0) continue;
      const held = new Set(scenario.request.units.map((unit) => unit.id));
      const theirs: Campaign[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        theirs.push(
          asCaptured(widenedFor(scenario.request, external.counts), external.name, external.counts),
        );
      }
      if (theirs.length === 0) continue;

      const priceRow = (row: PlanFrontierRow, label: string): Campaign =>
        campaignOf(scenario.request, label, 'plan', marchesOf(row as PlanTotals));
      const bestAt = (pick: (a: PlanFrontierRow, b: PlanFrontierRow) => boolean): PlanFrontierRow =>
        frontier.reduce((best, row) => (pick(row, best) ? row : best));
      const lowest = bestAt((a, b) => a.mercLost < b.mercLost);
      const highest = bestAt((a, b) => a.mercLost > b.mercLost);
      const bestRate = bestAt((a, b) => perSilver(a) > perSilver(b));

      // **B, but at three stops**: the same added plan with `more-mercs` dropped, which is the swap the
      // owner's *"keep three spots can mean keep the three best options"* allows. It is the only rule here
      // that can take an option away, so it is the only one whose ratio floors can fall.
      const withoutMiddle = today.filter((row) => !row.name.includes('more-mercs'));
      const sets: Record<string, Campaign[]> = {
        today,
        A: [
          priceRow(lowest, `burn@${String(lowest.mercLost)}`),
          priceRow(bestRate, `rate@${String(bestRate.mercLost)}`),
          priceRow(highest, `burn@${String(highest.mercLost)}`),
        ],
        B: [...today, priceRow(lowest, `+burn@${String(lowest.mercLost)}`)],
        C: [...today, priceRow(bestRate, `+rate@${String(bestRate.mercLost)}`)],
        Bswap: [...withoutMiddle, priceRow(lowest, `+burn@${String(lowest.mercLost)}`)],
      };
      /** The bar's best reading on each marker and each ratio, over whichever stops the rule offers. */
      const readings = (set: Campaign[]): Record<string, number> => ({
        damage: Math.max(...set.map((c) => c.damage)),
        'damage a silver': Math.max(...set.map((c) => (c.silver > 0 ? c.damage / c.silver : 0))),
        'damage a merc': Math.max(...set.map((c) => c.hiredDamage / Math.max(1, c.burned))),
        'damage a gold': Math.max(...set.map((c) => (c.gold > 0 ? c.damage / c.gold : 0))),
        'damage a coin': Math.max(...set.map((c) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0))),
        'least silver': -Math.min(...set.map((c) => c.silver)),
        'least burn': -Math.min(...set.map((c) => c.burned)),
      });
      const base = readings(today);
      for (const key of ['A', 'B', 'C', 'Bswap']) {
        const mine = readings(sets[key] ?? []);
        for (const marker of Object.keys(base)) {
          if ((mine[marker] ?? 0) < (base[marker] ?? 0) - 1e-9) {
            const bucket = floors[key];
            if (bucket) bucket[marker] = (bucket[marker] ?? 0) + 1;
            if (key === 'Bswap') {
              dropped.push(
                `**${scenario.label.slice(0, 44)}** — ${marker}: ` +
                  `${n(base[marker] ?? 0)} → ${n(mine[marker] ?? 0)}`,
              );
            }
          }
        }
      }
      const said: string[] = [];
      for (const key of ['today', 'A', 'B', 'C', 'Bswap']) {
        const verdict = matchedSpend((sets[key] ?? []) as Contender[], theirs as Contender[]);
        const entry = tally[key];
        if (entry) {
          entry.beaten += verdict.rowsBeaten;
          entry.unfitted += verdict.unfitted;
        }
        said.push(`${String(verdict.rowsBeaten)} beat · ${String(verdict.unfitted)} out`);
      }
      rows.push(`| ${scenario.label.slice(0, 38)} | ${said.join(' | ')} |`);
    }
    report.add(rows.join('\n'));
    report.add(
      '\n## The totals, over every captured row on every army\n\n' +
        '| rule | rows dominated | rows no stop fits |\n|---|---:|---:|\n' +
        (['today', 'A', 'B', 'C', 'Bswap'] as const)
          .map((key) => {
            const entry = tally[key];
            const name =
              key === 'today'
                ? 'the bar as it stands'
                : key === 'A'
                  ? '**A** — re-axis all three onto burn'
                  : key === 'B'
                    ? '**B** — today + lowest-burn plan'
                    : key === 'C'
                      ? '**C** — today + best damage-a-silver plan'
                      : '**B-swap** — B at three stops, `more-mercs` dropped';
            return `| ${name} | ${n(entry?.beaten ?? 0)} | ${n(entry?.unfitted ?? 0)} |`;
          })
          .join('\n') +
        '\n\n**A is a regression and it was this plan’s own proposal.** Replacing the three stops loses ' +
        'beats the current rule wins — one army alone falls from nine dominated rows to none — because the ' +
        'bar’s present picks are already right on most armies. **B and C each cost nothing and help on ' +
        'different armies**, which is the finding: B opens rows that were refused on the **burn**, C opens ' +
        'rows refused on **silver** and turns two of them into beats. Neither subsumes the other, and 144’s ' +
        'ceiling of 14 rescued rows needs both.\n',
    );
    report.add(
      '\n## The four ratio floors, and the one rule that can lower them\n\n' +
        'The owner’s goal is stated on **damage a silver, damage a merc and damage a monster** at least ' +
        'matching the other calculator, and every table before this story left **damage a merc** out. A ' +
        'rule that only *adds* a stop cannot lower the bar’s best on any marker — the old stops are still ' +
        'there — so only **B-swap**, which drops `more-mercs`, can. Armies where each rule reads **worse ' +
        'than the bar does today**:\n\n' +
        '| rule | ' +
        [
          'damage',
          'damage a silver',
          'damage a merc',
          'damage a gold',
          'damage a coin',
          'least silver',
          'least burn',
        ].join(' | ') +
        ' |\n|---|' +
        '---:|'.repeat(7) +
        '\n' +
        (['A', 'B', 'C', 'Bswap'] as const)
          .map(
            (key) =>
              `| ${key} | ` +
              [
                'damage',
                'damage a silver',
                'damage a merc',
                'damage a gold',
                'damage a coin',
                'least silver',
                'least burn',
              ]
                .map((marker) => String(floors[key]?.[marker] ?? 0))
                .join(' | ') +
              ' |',
          )
          .join('\n') +
        '\n' +
        (dropped.length > 0
          ? `\n**Where B-swap gives something up**, which is the whole cost of holding to three stops:\n\n- ${dropped.join('\n- ')}\n`
          : ''),
    );
    report.save();
  }, 3_600_000);
});
