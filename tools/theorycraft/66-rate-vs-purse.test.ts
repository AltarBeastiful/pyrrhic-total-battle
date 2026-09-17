/**
 * 66 — purse or rate? (owner, 2026-09-14: "it is too much silver for me, but might not be for others. how to
 * tackle this correctly?"). Measures what each input buys on his army, so the choice is made on numbers.
 * `THEORY=1 pnpm vitest run tools/theorycraft/66-rate-vs-purse.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { planCampaign } from '../../src/engine/plan';
import type { ResolvedSource } from '../../src/engine/types';
import { Report, loadOwner, n, withCaps, withHousing } from './harness';

const PROFILE: ResolvedSource = {
  id: 'account-2026-09-14',
  label: 'the account',
  kind: 'custom',
  health: { guardsmen: 157, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
  strength: { guardsmen: 187, melee: 1, mounted: 1, flying: 1, ranged: 2 },
  special: { doubleDamageChance: 3 },
};
const HELD: Record<string, number> = {
  'epic-monster-hunter-6': 14,
  'legionary-6': 16,
  'arbalester-6': 15,
  'chariot-6': 7,
};
/** The irreplaceable three: they never come back, so their burn is the long-run cost. */
const ADVANCED = ['arbalester-6', 'legionary-6', 'chariot-6'];

describe.skipIf(!process.env.THEORY)(
  'purse against rate',
  () => {
    it('measures what a weekly silver rate buys, and what each plan costs the stock', () => {
      const report = new Report('66-rate-vs-purse');
      const owner = loadOwner();
      const base = withCaps(
        withHousing(
          { ...owner.twelve, totals: aggregateBonuses([PROFILE]) },
          { leadership: 4_400, authority: 2_180 },
        ),
        HELD,
      );

      report.add(
        `his rates, from his own report of 2026-09-14: silver ~5,000,000 a week, EMH VI ~95 a week (the only ` +
          `mercenary that renews), and ${ADVANCED.length} irreplaceable types — ABT VI 15, LGN VI 16, CHR VI 7 in stock.`,
      );

      report.h('What a silver *purse* buys (the box as it reads today)');
      report.add(
        '| purse | marches | total damage | silver | mercs lost | of which irreplaceable | damage / silver | damage / irreplaceable |\n|---|---|---|---|---|---|---|---|',
      );
      for (const purse of [2_000_000, 3_000_000, 5_000_000, 8_000_000, 12_000_000, 20_000_000]) {
        const plan = planCampaign({ request: base, silverBudget: purse });
        const advancedLost = ADVANCED.reduce(
          (sum, id) =>
            sum +
            (plan.march.mercFielded[id]
              ? Math.ceil((plan.march.mercFielded[id] ?? 0) / 10) * (plan.marches - (plan.finale ? 1 : 0))
              : 0) +
            (plan.finale?.mercFielded[id] ? Math.ceil((plan.finale.mercFielded[id] ?? 0) / 10) : 0),
          0,
        );
        report.add(
          `| ${n(purse)} | ${plan.marches} | **${n(plan.totalDamage)}** | ${n(plan.silver)} | ${n(plan.mercLost)} | ${n(advancedLost)} | ` +
            `${plan.damagePerSilver.toFixed(2)} | ${n(Math.round(plan.totalDamage / Math.max(1, advancedLost)))} |`,
        );
      }

      report.h('The two rate inputs his economy actually has');
      report.add(
        'The silver renews every week and the irreplaceable stock never does, so a *purse* is the wrong unit for ' +
          'the second one: what a plan costs the long run is the irreplaceable units it burns, and what bounds a ' +
          'week is the silver the week brings in.',
      );
      const weekly = 5_000_000;
      const plan = planCampaign({ request: base, silverBudget: weekly });
      const advancedLost = ADVANCED.reduce((sum, id) => {
        const repeated = plan.marches - (plan.finale ? 1 : 0);
        const per = plan.march.mercFielded[id] ? Math.ceil((plan.march.mercFielded[id] ?? 0) / 10) : 0;
        const fin = plan.finale?.mercFielded[id] ? Math.ceil((plan.finale.mercFielded[id] ?? 0) / 10) : 0;
        return sum + repeated * per + fin;
      }, 0);
      report.add(
        `\nAt his own ${n(weekly)} a week the plan is **${n(plan.marches)} marches, ${n(plan.totalDamage)} damage, ${n(plan.silver)} silver**, ` +
          `burning ${n(advancedLost)} irreplaceable mercenaries — a stock of 38 lasts ${(38 / Math.max(1, advancedLost)).toFixed(1)} weeks at that pace.`,
      );
      report.add(
        `\nAnd the same plan, week after week with the EMH VI he earns back (95 a week against the ${n(plan.marches * Math.ceil((plan.march.mercFielded['epic-monster-hunter-6'] ?? 0) / 10))} the week burns), ` +
          `is repeatable: the silver is the only thing it depends on, and that renews.`,
      );
      report.h('The three picks the app toggles between (measured over every candidate)');
      report.add(
        '| pick | marches | damage | silver | mercs | per silver | per mercenary |\n|---|---|---|---|---|---|---|',
      );
      const free = planCampaign({ request: base });
      for (const [name, point] of [
        ['silver-light', free.mostEfficient],
        ['balanced', free.recommend],
        ['mercenary-heavy', free.mostThrifty],
      ] as const) {
        if (!point) continue;
        report.add(
          `| **${name}** | ${point.marches} | ${n(point.totalDamage)} | ${n(point.silver)} | ${n(point.mercLost)} | ` +
            `${point.damagePerSilver.toFixed(2)} | ${n(Math.round(point.damagePerMercenary))} |`,
        );
      }

      report.h('The two curves, and where they cross');
      report.add(
        'Each row is a non-dominated plan, cheapest first: the silver it spends, what a silver buys, and what a ' +
          "mercenary buys. One falls and the other rises, so they cross somewhere — this is the owner's model, " +
          'measured.',
      );
      report.add(
        '| plan | marches | silver | damage | per silver | per merc | per irreplaceable |\n|---|---|---|---|---|---|---|',
      );
      const frontier = plan.alternatives;
      for (const point of frontier) {
        report.add(
          `| ${point.label} | ${point.marches} | ${n(point.silver)} | ${n(point.totalDamage)} | ${point.damagePerSilver.toFixed(2)} | ` +
            `${n(Math.round(point.damagePerMercenary))} | — |`,
        );
      }
      // The crossing: the cheapest plan whose per-silver has fallen to the per-mercenary of the dearest, and
      // the dearest whose per-mercenary has risen to the per-silver of the cheapest. The two curves are on
      // different units, so the crossing is defined on the shared axis: silver.
      const cheap = frontier[0];
      const dear = frontier[frontier.length - 1];
      if (cheap && dear) {
        report.add(
          `\nthe curve of damage a silver runs from ${cheap.damagePerSilver.toFixed(2)} (at ${n(cheap.silver)} silver) down to ` +
            `${dear.damagePerSilver.toFixed(2)} (at ${n(dear.silver)}); the curve of damage a mercenary runs from ` +
            `${n(Math.round(cheap.damagePerMercenary))} up to ${n(Math.round(dear.damagePerMercenary))}. Both are in different units, ` +
            `so "where they meet" has to be settled on the axis they share — the silver spent.`,
        );
      }
      report.save();
    });
  },
  900_000,
);
