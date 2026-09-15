/**
 * 74 — the row figures, and the band the bar is cut to (owner's instructions, 2026-09-15).
 *
 *  A. The trade's rows spread a plan over **all** its marches including the finale, so the sweet spot's row
 *     read 3,153,194 damage a march while the March section — the very march the row puts on screen — read
 *     3,117,228. `PlanTotals.repeat` now carries the repeated march's own figures; section 1 reconciles them
 *     against the real battle (`marchResult`, the same call the March section makes), to the unit.
 *  B. "well just don't show the extremes, if we use a certain % of mercs or waay too much silver we're too
 *     far off from our goal of everything optimized." Section 2 measures the wider undominated frontier with
 *     its shares and tries candidate rules on it; section 3 is the shipped band and what it keeps.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/74-row-figures.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { marchResult, planCampaign } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import type { ResolvedSource, StackRequest } from '../../src/engine/types';
import { Report, loadOwner, n, withCaps, withHousing } from './harness';

/** Scenario C — the bonuses the account's current fights are under (harness.kaiReportTotals). */
const PROFILE: ResolvedSource = {
  id: 'account-2026-09-14',
  label: 'the account',
  kind: 'custom',
  health: { guardsmen: 159, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
  strength: { guardsmen: 189, melee: 1, mounted: 1, flying: 1, ranged: 2 },
  special: { doubleDamageChance: 3 },
};
const HELD: Record<string, number> = {
  'epic-monster-hunter-6': 92,
  'arbalester-6': 76,
  'legionary-6': 72,
  'chariot-6': 37,
};
const MERC_IDS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'] as const;
/** Every mercenary the account holds — the denominator of "a certain % of mercs". */
const STOCK = MERC_IDS.reduce((sum, id) => sum + (HELD[id] ?? 0), 0);
const TARGETS = [10, 20] as const;
/** Ask for more rows than the frontier holds: the thinning then keeps the frontier itself. */
const ALL = 100_000;

function ownerRequest(): StackRequest {
  const owner = loadOwner();
  return withCaps(
    withHousing(
      { ...owner.twelve, totals: aggregateBonuses([PROFILE]) },
      { leadership: 4_343, authority: 2_000 },
    ),
    HELD,
  );
}

type Point = ReturnType<typeof planCampaign>['alternatives'][number];

const hiredOf = (point: { counts: Record<string, number> }): number =>
  MERC_IDS.reduce((sum, id) => sum + (point.counts[id] ?? 0), 0);

describe.skipIf(!process.env.THEORY)(
  'the row figures and the band',
  () => {
    it('reconciles `repeat` against the battle, then measures the frontier and its band', () => {
      const report = new Report('74-row-figures');
      const request = ownerRequest();
      const plans = new Map<number, ReturnType<typeof planCampaign>>();
      for (const target of TARGETS)
        plans.set(target, planCampaign({ request, marchTarget: target, alternatives: ALL }));

      // ---- 1. the reconciliation ------------------------------------------------------------------------
      report.h('1. `PlanTotals.repeat` against the real battle, to the unit');
      report.add(
        "For every carried plan of every target, `repeat.damage` (the plan's own pricing of its repeated march) " +
          'beside `marchResult(request, point.counts).summary.avgDamage` (the real `simulateBattle` on that very ' +
          'march — the call the March section makes), and the same for silver and the mercenaries one march loses.',
      );
      report.add(
        '\n| target | plan | marches | `repeat.damage` | battle `avgDamage` | Δ | `repeat.silver` | battle silver | Δ | `repeat.mercLost` | battle mercs | Δ | label |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
      );
      let worst = 0;
      let rows = 0;
      const check = (target: number, point: Point, name: string): void => {
        const { summary } = marchResult(request, point.counts);
        const battleMercs = MERC_IDS.reduce((sum, id) => sum + chunks(point.counts[id] ?? 0), 0);
        worst = Math.max(worst, Math.abs(point.repeat.damage - summary.avgDamage));
        rows += 1;
        report.add(
          `| ${n(target)} | ${name} | ${n(point.marches)} | ${n(point.repeat.damage)} | ${n(Math.round(summary.avgDamage))} | ` +
            `${point.repeat.damage === summary.avgDamage ? '**0**' : `**${n(point.repeat.damage - summary.avgDamage)}**`} | ` +
            `${n(point.repeat.silver)} | ${n(summary.recovery.silver)} | ` +
            `${point.repeat.silver === summary.recovery.silver ? '0' : n(point.repeat.silver - summary.recovery.silver)} | ` +
            `${n(point.repeat.mercLost)} | ${n(battleMercs)} | ` +
            `${point.repeat.mercLost === battleMercs ? '0' : `**${n(point.repeat.mercLost - battleMercs)}**`} | ` +
            `\`${point.label}\` |`,
        );
      };
      for (const target of TARGETS) {
        const plan = plans.get(target) as ReturnType<typeof planCampaign>;
        check(target, plan as unknown as Point, '**the plan**');
        for (const [name, point] of [
          ['recommend', plan.recommend],
          ['knee', plan.knee],
          ['mostEfficient', plan.mostEfficient],
          ['mostThrifty', plan.mostThrifty],
        ] as const) {
          if (point) check(target, point, name);
        }
        for (const row of plan.alternatives) check(target, row, `row: ${row.label}`);
      }
      report.add(
        `\n**${n(rows)} rows checked. The largest disagreement between \`repeat.damage\` and what the battle reports ` +
          `for the same march is ${n(worst)}.** ` +
          `The figure the owner saw was the row's \`totalDamage / marches\` — the plan spread over the finale too — ` +
          `which is a different quantity by construction; \`repeat\` is the one that agrees with the March.`,
      );

      // ---- 2. the frontier, with shares ------------------------------------------------------------------
      report.h('2. The wider undominated frontier, with the shares the owner judges by');
      report.add(
        'Asked for `alternatives: 100 000`, so the thinning keeps the whole frontier: a caller who asks for at least ' +
          'as many rows as the frontier holds is asking for the frontier, and gets it whole — which is what makes this ' +
          "table reproducible after the band ships. Section 3 is the UI's own call (4 rows), where the band applies.",
      );
      for (const target of TARGETS) {
        const plan = plans.get(target) as ReturnType<typeof planCampaign>;
        const goal = plan;
        const bestAMarch = Math.max(...plan.alternatives.map((row) => row.repeat.damage));
        report.add(
          `\n**target ${n(target)}** — the plan's own march fields ${n(hiredOf(goal))} hired (${((hiredOf(goal) / STOCK) * 100).toFixed(0)} % of the ` +
            `${n(STOCK)} held) at ${goal.repeat.damage} damage and ${goal.damagePerSilver.toFixed(2)} damage a silver:`,
        );
        report.add(
          '\n| label | marches | hired a march | % of stock | silver a march | damage a march | % of best march | damage / silver | hired vs plan | silver vs plan |\n' +
            '|---|---|---|---|---|---|---|---|---|---|',
        );
        for (const row of [...plan.alternatives].sort((a, b) => a.silver - b.silver)) {
          const hired = hiredOf(row);
          report.add(
            `| ${row.label}${row.silver === goal.silver && row.totalDamage === goal.totalDamage ? ' **← the plan**' : ''}` +
              `${plan.recommend && row.silver === plan.recommend.silver && row.totalDamage === plan.recommend.totalDamage ? ' **← sweet spot**' : ''} | ` +
              `${n(row.marches)} | ${n(hired)} | ${((hired / STOCK) * 100).toFixed(1)} % | ${n(row.repeat.silver)} | ` +
              `${n(row.repeat.damage)} | ${((row.repeat.damage / bestAMarch) * 100).toFixed(0)} % | ` +
              `${row.damagePerSilver.toFixed(2)} | ` +
              `${((hired / Math.max(1, hiredOf(goal))) * 100).toFixed(0)} % | ` +
              `${((row.damagePerSilver / goal.damagePerSilver) * 100).toFixed(0)} % |`,
          );
        }
      }

      // ---- 2b. candidate rules on that frontier ---------------------------------------------------------
      report.h('2b. Candidate rules, and what each keeps and drops');
      report.add(
        'Every rule is anchored on the plan itself (`chosen`), so the plan always passes and no threshold is a ' +
          'free-standing number. "mercs" is the hired units the row\'s march fields against what the plan\'s own ' +
          'march fields; "silver" is the row\'s damage a silver against the plan\'s; "march" is the row\'s damage a ' +
          'march against the best march in the list; "stack" is the experiment-72 criterion that a march fields more ' +
          'than one troop stack.',
      );
      const ruleRows: {
        name: string;
        of: (row: Point, goal: { hired: number; perSilver: number }, best: number, stacks: number) => boolean;
      }[] = [
        { name: 'R1 mercs ≥ 25 % of the stock', of: (row) => (hiredOf(row) / STOCK) * 100 >= 25 },
        { name: "R2 mercs ≥ 50 % of the plan's mercs", of: (row, goal) => hiredOf(row) * 2 >= goal.hired },
        {
          name: "R3 silver ≥ 50 % of the plan's damage a silver",
          of: (row, goal) => row.damagePerSilver * 2 >= goal.perSilver,
        },
        {
          name: 'R4 march ≥ 50 % of the best march (experiment 72)',
          of: (row, _goal, best) => row.repeat.damage * 2 >= best,
        },
        { name: 'R5 more than one troop stack', of: (_row, _goal, _best, stacks) => stacks > 1 },
        {
          name: 'R2 ∧ R3',
          of: (row, goal) => hiredOf(row) * 2 >= goal.hired && row.damagePerSilver * 2 >= goal.perSilver,
        },
        {
          name: 'R2 ∧ R4',
          of: (row, goal, best) => hiredOf(row) * 2 >= goal.hired && row.repeat.damage * 2 >= best,
        },
        {
          name: 'R2 ∧ R3 ∧ R4 ∧ R5 (the 72 rule, re-anchored)',
          of: (row, goal, best, stacks) =>
            hiredOf(row) * 2 >= goal.hired &&
            row.damagePerSilver * 2 >= goal.perSilver &&
            row.repeat.damage * 2 >= best &&
            stacks > 1,
        },
      ];
      for (const target of TARGETS) {
        const plan = plans.get(target) as ReturnType<typeof planCampaign>;
        const goal = { hired: hiredOf(plan), perSilver: plan.damagePerSilver };
        const best = Math.max(...plan.alternatives.map((row) => row.repeat.damage));
        const stacksOf = (point: Point): number =>
          Object.keys(point.counts).filter((id) => !(MERC_IDS as readonly string[]).includes(id)).length;
        const sweet = plan.recommend;
        const isPlan = (row: Point): boolean =>
          row.silver === plan.silver && row.totalDamage === plan.totalDamage;
        const isSweet = (row: Point): boolean =>
          sweet !== undefined && row.silver === sweet.silver && row.totalDamage === sweet.totalDamage;
        report.add(
          `\n**target ${n(target)}** — ${n(plan.alternatives.length)} frontier rows; the plan fields ${n(goal.hired)} hired ` +
            `(${((goal.hired / STOCK) * 100).toFixed(0)} % of stock), the best march is ${n(best)}, the plan's return is ` +
            `${goal.perSilver.toFixed(2)} damage a silver:`,
        );
        report.add(
          '\n| rule | keeps | drops | plan kept | sweet spot kept | mercs a march, kept range | damage a silver, kept range | the rows it drops that field ≥ 25 % of the stock |\n' +
            '|---|---|---|---|---|---|---|---|',
        );
        for (const rule of ruleRows) {
          const kept = plan.alternatives.filter((row) => rule.of(row, goal, best, stacksOf(row)));
          const dropped = plan.alternatives.filter((row) => !kept.includes(row));
          const share = (row: Point): number => (hiredOf(row) / STOCK) * 100;
          const keptShares = kept.map(share);
          const keptSilver = kept.map((row) => row.damagePerSilver);
          const rich = dropped.filter((row) => share(row) >= 25);
          report.add(
            `| ${rule.name} | ${n(kept.length)}/${n(plan.alternatives.length)} | ${n(dropped.length)} | ` +
              `${plan.alternatives.some((row) => isPlan(row) && rule.of(row, goal, best, stacksOf(row))) ? 'yes' : '**NO**'} | ` +
              `${sweet ? (plan.alternatives.some((row) => isSweet(row) && rule.of(row, goal, best, stacksOf(row))) ? 'yes' : '**NO**') : '—'} | ` +
              `${n(Math.round(Math.min(...keptShares)))}–${n(Math.round(Math.max(...keptShares)))} % | ` +
              `${Math.min(...keptSilver).toFixed(2)}–${Math.max(...keptSilver).toFixed(2)} | ` +
              `${rich.map((row) => `${n(hiredOf(row))} hired, ${row.damagePerSilver.toFixed(2)}/silver`).join('; ') || '—'} |`,
          );
        }
      }

      // ---- 3. the shipped band, on the UI's own call ------------------------------------------------------
      report.h('3. The band the UI is handed (`alternatives: 4` — the call the bar makes)');
      const RULE =
        "A plan is carried when its march fields at least **half the hired troops the plan's own march fields**, " +
        "returns at least **half the plan's own damage a silver**, and stands on **more than one troop stack**.";
      report.add(
        `${RULE} Every part is measured against the plan itself, so the plan can never be banded out; the balanced ` +
          'sweet spot is anchored on the same two ratios, and is force-kept with it.',
      );
      for (const target of TARGETS) {
        const frontier = plans.get(target) as ReturnType<typeof planCampaign>;
        const ui = planCampaign({ request, marchTarget: target, alternatives: 4 });
        const goal = { hired: hiredOf(ui), perSilver: ui.damagePerSilver };
        const stacksOf = (point: { counts: Record<string, number> }): number =>
          Object.keys(point.counts).filter((id) => !(MERC_IDS as readonly string[]).includes(id)).length;
        // The rows the band refuses, taken from the frontier by the rule itself — not by diffing against the
        // bar's list, which is thinned to four rows and would count the thinning as a refusal.
        const refused = frontier.alternatives.filter(
          (row) =>
            !(
              hiredOf(row) * 2 >= goal.hired &&
              row.damagePerSilver * 2 >= goal.perSilver &&
              stacksOf(row) > 1
            ),
        );
        report.add(
          `\n**target ${n(target)}** — the frontier holds **${n(frontier.alternatives.length)}** plans, the bar is ` +
            `handed **${n(ui.alternatives.length)}** and \`leftOut\` reads **${n(ui.leftOut)}**; the plan's own march ` +
            `fields ${n(hiredOf(ui))} hired at ${ui.damagePerSilver.toFixed(2)} damage a silver.`,
        );
        report.add(
          '| # | label | marches | hired a march | % of stock | hired vs plan | silver a march | damage a march | damage / silver | damage/silver vs plan | pick | in the band |\n' +
            '|---|---|---|---|---|---|---|---|---|---|---|---|',
        );
        ui.alternatives.forEach((row, index) => {
          const hired = hiredOf(row);
          const reasons: string[] = [];
          if (hired * 2 < goal.hired) reasons.push('too few mercenaries');
          if (row.damagePerSilver * 2 < goal.perSilver) reasons.push('too little damage a silver');
          if (stacksOf(row) <= 1) reasons.push('a single troop stack');
          const pick =
            row.silver === ui.silver && row.totalDamage === ui.totalDamage
              ? 'the plan'
              : ui.recommend &&
                  row.silver === ui.recommend.silver &&
                  row.totalDamage === ui.recommend.totalDamage
                ? 'balanced'
                : ui.mostEfficient &&
                    row.silver === ui.mostEfficient.silver &&
                    row.totalDamage === ui.mostEfficient.totalDamage
                  ? 'light'
                  : ui.mostThrifty &&
                      row.silver === ui.mostThrifty.silver &&
                      row.totalDamage === ui.mostThrifty.totalDamage
                    ? 'heavy'
                    : 'the sample';
          report.add(
            `| ${index + 1} | \`${row.label}\` | ${n(row.marches)} | ${n(hired)} | ${((hired / STOCK) * 100).toFixed(1)} % | ` +
              `${((hired / Math.max(1, goal.hired)) * 100).toFixed(0)} % | ${n(row.repeat.silver)} | ${n(row.repeat.damage)} | ` +
              `${row.damagePerSilver.toFixed(2)} | ${((row.damagePerSilver / goal.perSilver) * 100).toFixed(0)} % | ${pick} | ` +
              `${reasons.length === 0 ? 'yes' : `**no — ${reasons.join('; ')}**`} |`,
          );
        });
        report.add(
          `\n**What the band refused at ${n(target)}** — every frontier row the bar no longer carries, and the part of ` +
            `the rule it fails:`,
        );
        report.add(
          '\n| label | hired a march | % of stock | damage a march | damage / silver | troop stacks | fails |\n|---|---|---|---|---|---|---|',
        );
        for (const row of refused) {
          const hired = hiredOf(row);
          const reasons: string[] = [];
          if (hired * 2 < goal.hired) reasons.push("fewer than half the plan's mercenaries");
          if (row.damagePerSilver * 2 < goal.perSilver)
            reasons.push("less than half the plan's damage a silver");
          if (stacksOf(row) <= 1) reasons.push('a single troop stack');
          report.add(
            `| \`${row.label}\` | ` +
              `${n(hired)} | ${((hired / STOCK) * 100).toFixed(1)} % | ${n(row.repeat.damage)} | ` +
              `${row.damagePerSilver.toFixed(2)} | ${n(stacksOf(row))} | ${reasons.join('; ')} |`,
          );
        }
        const picks = [
          ['light (most damage a silver)', ui.mostEfficient],
          ['heavy (most damage a mercenary)', ui.mostThrifty],
        ] as const;
        report.add(
          `\nThe two ratio picks at ${n(target)}: ` +
            picks
              .map(([name, point]) => {
                if (!point) return `${name} — absent`;
                const carried = ui.alternatives.some(
                  (row) => row.silver === point.silver && row.totalDamage === point.totalDamage,
                );
                return (
                  `**${name}** ${n(hiredOf(point))} hired (${((hiredOf(point) / STOCK) * 100).toFixed(1)} % of stock), ` +
                  `${point.damagePerSilver.toFixed(2)} damage a silver, ${stacksOf(point)} troop stacks — ` +
                  `${carried ? 'carried on the bar' : '**banded out of the bar** (its field still names it)'}`
                );
              })
              .join('; ') +
            `. Measured, the band refuses both: the *light* pick is the cheapest plan the frontier has and stands on a ` +
            `single troop stack — the owner's own "the least silver plan would never be chosen … is not a strategy" — ` +
            `and the *heavy* pick is the one his words describe exactly, a march of a few mercenaries that spends its ` +
            `silver for almost nothing.`,
        );
      }
      report.add(
        `\n**Can the band empty the list?** No: the band is applied to the frontier and the **unbanded** frontier is ` +
          `handed back whenever the band would leave nothing, with \`leftOut\` reading 0 in that case. Measured here, ` +
          `the band keeps ${TARGETS.map((target) => {
            const frontier = plans.get(target) as ReturnType<typeof planCampaign>;
            const ui = planCampaign({ request, marchTarget: target, alternatives: 4 });
            return `${n(frontier.alternatives.length - ui.leftOut)} of ${n(frontier.alternatives.length)} at a target of ${n(target)}`;
          }).join(
            ', and ',
          )} — a strangled list would have been the reading of a rule applied to the wrong set.`,
      );

      report.save();
    });
  },
  900_000,
);
