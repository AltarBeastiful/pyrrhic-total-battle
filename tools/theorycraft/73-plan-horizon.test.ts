/**
 * 73 — the plan bounded to a horizon (owner, 2026-09-15: the plan method gets the same "Marches planned"
 * field the S-54 campaign has, default 10; his own words, "Bound it to ~10 marches").
 *
 * `CampaignInput.marchTarget` already existed and `evaluateVector` already read it. Section 0 is the audit of
 * what the rest of `planCampaign` did with it — measured against the engine before and after the change —
 * and the sections after it are the theorycraft of the horizon on the owner's own account.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/73-plan-horizon.test.ts`
 */
import { writeFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { lastsMarches, marchResult, planCampaign } from '../../src/engine/plan';
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
/** What the account holds, by mercenary type — the export's own caps. */
const HELD: Record<string, number> = {
  'epic-monster-hunter-6': 92,
  'arbalester-6': 76,
  'legionary-6': 72,
  'chariot-6': 37,
};
const MERC_IDS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'] as const;
const SHORT = (id: string): string => id.replace(/-6$/, '');
/** The targets the owner asked for, plus the ones the audit needs. */
const TARGETS = [undefined, 20, 10, 6] as const;
const AUDIT_TARGETS = [undefined, 4, 6, 10, 11, 12, 13, 20, 30] as const;
/** The targets run twice, before and after the engine change (measured, not recalled). */
const BEFORE: Record<
  string,
  { marches: number; damage: number; silver: number; mercs: number; chariot: number }
> = {
  '4': { marches: 5, damage: 30_629_300, silver: 11_577_300, mercs: 105, chariot: 28 },
  '6': { marches: 7, damage: 39_333_170, silver: 16_445_500, mercs: 127, chariot: 22 },
  '10': { marches: 11, damage: 53_767_344, silver: 25_580_700, mercs: 165, chariot: 19 },
  '11': { marches: 12, damage: 55_138_542, silver: 23_327_900, mercs: 158, chariot: 17 },
  '12': { marches: 13, damage: 55_841_377, silver: 30_401_000, mercs: 170, chariot: 15 },
  '13': { marches: 14, damage: 58_581_152, silver: 26_762_000, mercs: 170, chariot: 13 },
  '20': { marches: 21, damage: 84_405_344, silver: 37_948_100, mercs: 156, chariot: 10 },
  '30': { marches: 31, damage: 110_278_135, silver: 56_109_200, mercs: 219, chariot: 8 },
  undefined: { marches: 67, damage: 154_214_995, silver: 113_670_300, mercs: 207, chariot: 0 },
};

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

/** `largestFor` in `plan.ts` — the largest count of `held` that still allows `marches` marches. */
function largestFor(held: number, marches: number): number {
  for (let count = held; count >= 1; count -= 1) if (lastsMarches(held, count) >= marches) return count;
  return 0;
}

const mercsOf = (counts: Record<string, number>): string =>
  MERC_IDS.map((id) => `${SHORT(id)} ${n(counts[id] ?? 0)}`).join(' · ');

describe.skipIf(!process.env.THEORY)(
  'the plan bounded to a horizon',
  () => {
    it('audits the target by measurement, then theorycrafts it', () => {
      const report = new Report('73-plan-horizon');
      const request = ownerRequest();

      // ---- 0. the audit, before and after ---------------------------------------------------------------
      report.h('0. The audit: what a target does, before and after the engine change');
      report.add(
        'The "before" columns are a real run of the same file, same request, same account, with the engine as ' +
          'it stood (the four edits of section 0c reverted); the "after" columns are this run. Damage, silver and ' +
          "mercenaries are the plan's own totals.",
      );
      report.add(
        '\n| marchTarget | BEFORE marches | BEFORE damage | BEFORE chariot | AFTER marches | AFTER repeats | AFTER damage | AFTER silver | AFTER mercs | AFTER chariot | finale? |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|',
      );
      const plans = new Map<number | undefined, ReturnType<typeof planCampaign>>();
      for (const target of AUDIT_TARGETS) {
        const plan = planCampaign({ request, ...(target === undefined ? {} : { marchTarget: target }) });
        plans.set(target, plan);
        const before = BEFORE[String(target)];
        report.add(
          `| ${target === undefined ? 'undefined' : n(target)} | ${before ? n(before.marches) : '—'} | ` +
            `${before ? n(before.damage) : '—'} | ${before ? n(before.chariot) : '—'} | **${n(plan.marches)}** | ` +
            `${n(plan.marches - (plan.finale ? 1 : 0))} | ${n(plan.totalDamage)} | ${n(plan.silver)} | ` +
            `${n(plan.mercLost)} | ${n(plan.march.counts['chariot-6'] ?? 0)} | ${plan.finale ? `${n(plan.finale.stacks)} stacks` : '**none**'} |`,
        );
      }
      report.add(
        `\n**The like-for-like check on the grid change.** A target used to mean \`repeats = target\`, so the old ` +
          `\`marchTarget: 10\` is today's \`marchTarget: 11\` — the same ten repeats, the same finale, so the only ` +
          `difference is the grid and the climb. Measured: old ten repeats **${n(BEFORE['10']?.damage ?? 0)}** damage, ` +
          `chariot ${n(BEFORE['10']?.chariot ?? 0)}; new ten repeats **${n(plans.get(11)?.totalDamage ?? 0)}** damage, ` +
          `chariot ${n(plans.get(11)?.march.counts['chariot-6'] ?? 0)} — **the same answer**, so on this account the ` +
          `pinning neither gains nor loses damage below ${n(12)} (the old grid contained the target's own row, so it ` +
          `could not have been richer than a superset of it). What it does change is the cost: the audit run went from ` +
          `about 6 s to about 3 s, and above a target of ${n(12)} it changes the answer — the old grid's *only* rows ` +
          `were the twelve built from \`largestFor(held, ≤ 12)\`, and the target's own ceiling was nowhere in it.`,
      );

      const corrected = [
        "`plan.marches` was the target **plus one** whenever the plan had a finale. S-54's same field plays exactly " +
          '`settings.marches` marches (`simulateCampaign`: `planned = max(1, floor(settings.marches))`), so the two ' +
          "readings of one field disagreed by a march. *Changed*: `marchTarget` is now the campaign's total and the " +
          'repeats are `target − 1`. Every row above now reads back its own target.',
        'The vectors grid was built for `marches` = 1…12 and **every** vector was then evaluated at the target, so a ' +
          'target above 12 sampled the fractions of the *K = 12* maximum (`largestFor(held, 12)`) instead of its own. ' +
          '*Changed*: with a target, the grid is built for that one march count. Measured first: this does **not** ' +
          'throw — the fractions of a K=12 maximum are small enough to pass the `lastsMarches` check — it answers with ' +
          'counts off the wrong maximum, which is worse than a throw.',
        "The hill-climb's last loop took its maximum from `marchesFor(stock, vector)`, i.e. the tightest type the " +
          "vector happens to field — a march count unrelated to the plan's. *Changed*: it reads the target's repeats. " +
          'Measured, and the reason the defect stayed invisible: at a target of 10 the old engine still reached 19 ' +
          'chariots, because `marchesFor` of the vector it was holding happened to be 10 as well. The two numbers ' +
          'diverge as soon as the vector fields a type whose stock is shorter or longer than the run, which is the ' +
          'normal case at every other target.',
      ];
      report.h('0b. What was changed, and what was left alone');
      corrected.forEach((line, index) => report.add(`\n${index + 1}. ${line}`));
      report.add(
        `\n**Left alone, deliberately**:\n` +
          `- \`MAX_MARCHES = 12\` — it now bounds only the *unbounded* search (the one that answers "all of it"), where ` +
          `it is the breadth of the grid, not a lie about the target. With a target the grid is one count and the ` +
          `constant is not consulted at all, so a target of 30 is exact (measured above: 30 marches, 29 repeats);\n` +
          `- \`finaleFor\` and the finale's stock/silver arithmetic: measured correct under a target. The burn is ` +
          `\`repeats × chunks(count)\` and the silver left is \`silverBudget − repeats × march.silver\`, both read from the ` +
          `repeats, and the cached key already carries \`marches\`. Every target above has a finale (6-8 stacks), so the ` +
          `leftovers are never silently dropped — including at a target of 4, where the finale fields the near-entire ` +
          `stock;\n` +
          `- the two \`largestFor\` call sites in the grid and the climb now both read the same march count, and ` +
          `\`binding.marches\` already reported the target.\n` +
          `\nOne semantic decision worth flagging: reading the target as the campaign's **total** is what makes a ` +
          `shared "Marches planned" field mean one thing. If the UI would rather it meant the repeats, the change is ` +
          `the one line \`Math.max(1, planned - 1)\`.`,
      );

      // ---- 1. the horizon, target by target -------------------------------------------------------------
      report.h('1. The plan and its sweet spot, per horizon');
      report.add(
        '| target | what | marches | repeats | damage | silver | mercs lost | damage a march | silver a march | mercs a march | damage / silver | damage / mercenary |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|---|',
      );
      interface Horizon {
        target: number | undefined;
        plan: ReturnType<typeof planCampaign>;
        sim: ReturnType<typeof marchResult>['summary'];
        marches: number;
        damage: number;
        silver: number;
        mercs: number;
      }
      const horizons: Horizon[] = [];
      for (const target of TARGETS) {
        const plan = plans.get(target) as ReturnType<typeof planCampaign>;
        const { summary } = marchResult(request, plan.march.counts);
        const repeats = plan.marches - (plan.finale ? 1 : 0);
        const mercsAMarch = MERC_IDS.reduce((sum, id) => sum + chunks(plan.march.counts[id] ?? 0), 0);
        horizons.push({
          target,
          plan,
          sim: summary,
          marches: plan.marches,
          damage: plan.totalDamage,
          silver: plan.silver,
          mercs: plan.mercLost,
        });
        report.add(
          `| ${target === undefined ? '**undefined**' : n(target)} | the plan | ${n(plan.marches)} | ${n(repeats)} | ` +
            `${n(plan.totalDamage)} | ${n(plan.silver)} | ${n(plan.mercLost)} | ${n(Math.round(summary.avgDamage))} | ` +
            `${n(summary.recovery.silver)} | ${n(mercsAMarch)} | ${plan.damagePerSilver.toFixed(2)} | ` +
            `${n(Math.round(plan.damagePerMercenary))} |`,
        );
        const sweet = plan.recommend;
        if (sweet) {
          const { summary: sweetSim } = marchResult(request, sweet.counts);
          report.add(
            `| ${target === undefined ? '**undefined**' : n(target)} | the sweet spot | ${n(sweet.marches)} | ` +
              `${n(sweet.marches - 1)} | ${n(sweet.totalDamage)} | ${n(sweet.silver)} | ${n(sweet.mercLost)} | ` +
              `${n(Math.round(sweetSim.avgDamage))} | ${n(sweetSim.recovery.silver)} | ` +
              `${n(MERC_IDS.reduce((sum, id) => sum + chunks(sweet.counts[id] ?? 0), 0))} | ` +
              `${sweet.damagePerSilver.toFixed(2)} | ${n(Math.round(sweet.damagePerMercenary))} |`,
          );
        }
      }
      report.add(
        `\n**The three numbers the owner asked for, side by side**:\n` +
          horizons
            .map(
              (horizon) =>
                `- **${horizon.target === undefined ? 'unbounded' : `${n(horizon.target)} marches`}**: ` +
                `${n(horizon.damage)} damage, ${n(horizon.silver)} silver, ${n(horizon.mercs)} mercenaries lost, ` +
                `${(horizon.damage / horizon.silver).toFixed(2)} damage a silver, ` +
                `${n(Math.round(horizon.damage / Math.max(1, horizon.mercs)))} damage a mercenary, ` +
                `${n(Math.round((horizon.sim.recovery.seconds * horizon.marches) / 86_400))} days of training, ` +
                `${n(Math.round(horizon.damage / horizon.marches))} damage a march`,
            )
            .join('\n'),
      );

      // ---- 2. the repeated march's counts per type ------------------------------------------------------
      report.h('2. The repeated march, mercenary by mercenary, with the arithmetic');
      report.add(
        "`lastsMarches(held, c) = floor((held − c) / ceil(c/10)) + 1`, and the grid's ceiling at `K` repeats is the " +
          'largest `c` with `lastsMarches ≥ K`. A count is only planable if its own ceiling clears the run.',
      );
      report.add(
        '\n| target | repeats K | type | held | fielded | chunks a march | lasts (marches) | ceiling at K |\n|---|---|---|---|---|---|---|---|',
      );
      for (const horizon of horizons) {
        const repeats = horizon.marches - 1;
        for (const id of MERC_IDS) {
          const count = horizon.plan.march.counts[id] ?? 0;
          const held = HELD[id] ?? 0;
          report.add(
            `| ${horizon.target === undefined ? 'undefined' : n(horizon.target)} | ${n(repeats)} | ${SHORT(id)} | ` +
              `${n(held)} | **${n(count)}** | ${n(chunks(Math.max(1, count)))} | ` +
              `${count === 0 ? 'not fielded' : n(lastsMarches(held, count))} | ${n(largestFor(held, repeats))} |`,
          );
        }
      }
      report.add(
        `\nThe ceilings themselves, for every march count the plans above sit at and for the ones the old grid used ` +
          `(\`largestFor(held, K)\`, i.e. the largest count that still lasts K marches):`,
      );
      const CEILING_KS = [5, 9, 12, 19, 20, 30, 66] as const;
      report.add(
        '\n| held | ' +
          CEILING_KS.map((k) => `K=${n(k)}`).join(' | ') +
          ' |\n|---|' +
          CEILING_KS.map(() => '---|').join('') +
          '\n' +
          MERC_IDS.map(
            (id) =>
              `| ${SHORT(id)} ${n(HELD[id] ?? 0)} | ` +
              CEILING_KS.map((k) => n(largestFor(HELD[id] ?? 0, k))).join(' | ') +
              ' |',
          ).join('\n'),
      );
      const chariotHeld = HELD['chariot-6'] ?? 0;
      const chariotLine = horizons
        .map((horizon) => {
          const count = horizon.plan.march.counts['chariot-6'] ?? 0;
          const finale = horizon.plan.finale?.counts['chariot-6'] ?? 0;
          const name = horizon.target === undefined ? 'unbounded' : `target ${n(horizon.target)}`;
          return `${name} → **${n(count)}** in the repeat (+${n(finale)} in the finale)`;
        })
        .join(' · ');
      report.add(
        `\n**Does the chariot come back?** Measured: ${chariotLine}. It is fielded at every horizon, and at the ` +
          `shortest (a target of 6, so 5 repeats) it sits at that horizon's ceiling of ` +
          `${n(largestFor(chariotHeld, 5))}. The arithmetic at the owner's own default of 10: ` +
          `\`largestFor(${n(chariotHeld)}, 9) = ${n(largestFor(chariotHeld, 9))}\` — with nine repeats the stock still ` +
          `allows ${n(largestFor(chariotHeld, 9))} chariots in the repeated march, and the plan fields ` +
          `${n(plans.get(10)?.march.counts['chariot-6'] ?? 0)}. The whole of the missing-stack complaint of ` +
          `experiment 72 is gone at every horizon: the type is back, and generous.`,
      );

      // ---- 3. the alternatives at the target of 10 ------------------------------------------------------
      const ten = plans.get(10) as ReturnType<typeof planCampaign>;
      report.h('3. Every alternative at the target of 10 marches (`recommend` is the marked one)');
      interface Row {
        label: string;
        marches: number;
        planTotal: number;
        planSilver: number;
        damageAMarch: number;
        silverAMarch: number;
        mercsAMarch: number;
        mercsTotal: number;
        troopStacks: number;
        mercTypes: number;
        trainingDays: number;
        seconds: number;
        counts: Record<string, number>;
        damagePerSilver: number;
        damagePerMercenary: number;
      }
      const rows: Row[] = ten.alternatives.map((row) => {
        const { result, summary } = marchResult(request, row.counts);
        return {
          label: row.label,
          marches: row.marches,
          planTotal: row.totalDamage,
          planSilver: row.silver,
          damageAMarch: summary.avgDamage,
          silverAMarch: summary.recovery.silver,
          mercsAMarch: MERC_IDS.reduce((sum, id) => sum + chunks(row.counts[id] ?? 0), 0),
          mercsTotal: row.mercLost,
          troopStacks: result.stacks.filter((stack) => stack.pool === 'leadership').length,
          mercTypes: result.stacks.filter((stack) => stack.pool === 'authority').length,
          trainingDays: (summary.recovery.seconds * row.marches) / 86_400,
          seconds: summary.recovery.seconds,
          counts: row.counts,
          damagePerSilver: row.damagePerSilver,
          damagePerMercenary: row.damagePerMercenary,
        };
      });
      report.add(
        "The last column is the row's identity (`mercsOf`, the counts the repeated march fields) — without it the " +
          'labels below are ambiguous, which section 4 measures.\n',
      );
      report.add(
        '| label | marches | damage | silver | mercs lost | damage a march | mercs a march | troop stacks | merc types | damage/silver | damage/mercenary | mercs fielded |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|---|',
      );
      const isSweet = (row: Row): boolean =>
        ten.recommend !== undefined &&
        row.planSilver === ten.recommend.silver &&
        row.planTotal === ten.recommend.totalDamage;
      for (const row of rows) {
        report.add(
          `| ${row.label}${isSweet(row) ? ' **← sweet spot**' : ''} | ${n(row.marches)} | ` +
            `${n(row.planTotal)} | ${n(row.planSilver)} | ${n(row.mercsTotal)} | ${n(Math.round(row.damageAMarch))} | ` +
            `${n(row.mercsAMarch)} | ${n(row.troopStacks)} | ${n(row.mercTypes)} | ` +
            `${row.damagePerSilver.toFixed(2)} | ${n(Math.round(row.damagePerMercenary))} | ${mercsOf(row.counts)} |`,
        );
      }

      // ---- 4. practicality at 10 ------------------------------------------------------------------------
      report.h('4. Which of those are practical (the measure from experiment 72, applied at 10)');
      const bestAMarch = Math.max(...rows.map((row) => row.damageAMarch));
      const HORIZON_DAYS = 90;
      const DAMAGE_FLOOR = 0.5;
      report.add(
        'Same stated criteria as experiment 72 — a march that fields more than one troop stack, a per-march damage ' +
          `at least ${(DAMAGE_FLOOR * 100).toFixed(0)} % of the best march in the list, and a whole run inside ` +
          `${n(HORIZON_DAYS)} days of training:`,
      );
      report.add(
        '| label | marches | damage a march | % of the best march | troop stacks | training, whole run | verdict |\n|---|---|---|---|---|---|---|',
      );
      const practical: Row[] = [];
      for (const row of rows) {
        const share = row.damageAMarch / bestAMarch;
        const reasons: string[] = [];
        if (row.troopStacks <= 1) reasons.push(`${n(row.troopStacks)} troop stack`);
        if (share < DAMAGE_FLOOR) reasons.push(`march at ${(share * 100).toFixed(0)} % of the best`);
        if (row.trainingDays > HORIZON_DAYS) reasons.push(`${n(Math.round(row.trainingDays))} d of training`);
        if (reasons.length === 0) practical.push(row);
        report.add(
          `| ${row.label} | ${n(row.marches)} | ${n(Math.round(row.damageAMarch))} | ${(share * 100).toFixed(0)} % | ` +
            `${n(row.troopStacks)} | ${n(Math.round(row.trainingDays))} d | ` +
            `${reasons.length === 0 ? '**practical**' : `curiosity — ${reasons.join('; ')}`} |`,
        );
      }
      report.add(
        `\n**${n(practical.length)} of ${n(rows.length)} rows are practical at the target of 10** (against 7 of 16 ` +
          `unbounded), and the longest run in the list is ${n(Math.round(Math.max(...rows.map((row) => row.trainingDays))))} ` +
          `days against ${n(757)} unbounded, so the fold removes the century-long tail that made the slider unreadable. ` +
          `Two notes on what is left:\n` +
          `\n- the **sweet spot passes** the test (${n(Math.round(rows.find(isSweet)?.trainingDays ?? 0))} days) while the ` +
          `plan itself does not (${n(Math.round(Math.max(...rows.map((row) => row.trainingDays))))} days) — the horizon ` +
          `bounds the number of marches, not the size of each, so training time still scales with the stacks and the ` +
          `90-day test now *discriminates* between rows instead of condemning all of them;\n` +
          `- **every label in the list is ambiguous**: the label is \`marches × rungs + finale\`, and at a fixed target ` +
          `every row starts with the same \`9×\`, so ${n(
            rows.length - new Set(rows.map((row) => row.label)).size,
          )} of the ${n(rows.length)} rows share their label with another. A slider drawn on these labels cannot tell its ` +
          `stops apart — the counts are the identity, not the label.`,
      );

      // ---- 5. what the fold loses and gains -------------------------------------------------------------
      report.h('5. What the fold loses and gains');
      const unbounded = horizons[0] as Horizon;
      const bounded = horizons.filter((horizon) => horizon.target !== undefined);
      report.add(
        '| | unbounded | ' +
          bounded.map((horizon) => `target ${n(horizon.target ?? 0)}`).join(' | ') +
          ' |\n' +
          '|---|---|' +
          bounded.map(() => '---|').join('') +
          '\n' +
          `| total damage | ${n(unbounded.damage)} | ${bounded.map((horizon) => n(horizon.damage)).join(' | ')} |\n` +
          `| silver | ${n(unbounded.silver)} | ${bounded.map((horizon) => n(horizon.silver)).join(' | ')} |\n` +
          `| mercenaries lost | ${n(unbounded.mercs)} | ${bounded.map((horizon) => n(horizon.mercs)).join(' | ')} |\n` +
          `| damage a march | ${n(Math.round(unbounded.damage / unbounded.marches))} | ` +
          `${bounded.map((horizon) => n(Math.round(horizon.damage / horizon.marches))).join(' | ')} |\n` +
          `| damage a silver | ${(unbounded.damage / unbounded.silver).toFixed(2)} | ` +
          `${bounded.map((horizon) => (horizon.damage / horizon.silver).toFixed(2)).join(' | ')} |\n` +
          `| damage a mercenary | ${n(Math.round(unbounded.damage / unbounded.mercs))} | ` +
          `${bounded.map((horizon) => n(Math.round(horizon.damage / horizon.mercs))).join(' | ')} |\n` +
          `| days of training | ${n(Math.round((unbounded.sim.recovery.seconds * unbounded.marches) / 86_400))} | ` +
          `${bounded.map((horizon) => n(Math.round((horizon.sim.recovery.seconds * horizon.marches) / 86_400))).join(' | ')} |`,
      );
      const days = (horizon: Horizon): number => (horizon.sim.recovery.seconds * horizon.marches) / 86_400;
      const axis = (pick: (horizon: Horizon) => number): { worst: Horizon; best: Horizon } => {
        const sorted = [...horizons].sort((a, b) => pick(a) - pick(b));
        return { worst: sorted[0] as Horizon, best: sorted[sorted.length - 1] as Horizon };
      };
      const rate = axis((horizon) => horizon.damage / horizon.marches);
      const perSilver = axis((horizon) => horizon.damage / horizon.silver);
      const bestBoundedPerMerc = Math.max(...bounded.map((horizon) => horizon.damage / horizon.mercs));
      const bestBoundedPerMercAt = bounded.find(
        (horizon) => horizon.damage / horizon.mercs === bestBoundedPerMerc,
      );
      const time = axis((horizon) => -days(horizon));
      const label = (horizon: Horizon): string =>
        horizon.target === undefined ? 'unbounded' : `target ${n(horizon.target)}`;
      report.add(
        `\n**The trade in one paragraph.** On three of the four axes the unbounded plan is the **worst** of the four: ` +
          `${n(Math.round(unbounded.damage / unbounded.marches))} damage a march against a best of ` +
          `${n(Math.round(rate.best.damage / rate.best.marches))} (${label(rate.best)}), ` +
          `${(unbounded.damage / unbounded.silver).toFixed(2)} damage a silver against ` +
          `${(perSilver.best.damage / perSilver.best.silver).toFixed(2)} (${label(perSilver.best)}), and ` +
          `${n(Math.round(days(unbounded)))} days of training against ${n(Math.round(days(time.best)))} ` +
          `(${label(time.best)}). On the fourth axis it **wins outright**: ${n(Math.round(unbounded.damage / unbounded.mercs))} ` +
          `damage a mercenary against a best bounded ${n(Math.round(bestBoundedPerMerc))} ` +
          `(${label(bestBoundedPerMercAt ?? unbounded)}) — a long run spends each chunk of ten it loses over many more ` +
          `marches. So ` +
          `\`total = marches × damage(march)\` is not the only thing the horizon gives up, and the trade is ` +
          `**+${n(Math.round(rate.best.damage / rate.best.marches - unbounded.damage / unbounded.marches))} damage a march, ` +
          `+${(perSilver.best.damage / perSilver.best.silver - unbounded.damage / unbounded.silver).toFixed(2)} damage a silver, ` +
          `${n(Math.round(days(unbounded) - days(time.best)))} days of training for ` +
          `${n(unbounded.damage - Math.max(...bounded.map((horizon) => horizon.damage)))} total damage and at least ` +
          `${n(Math.round(unbounded.damage / unbounded.mercs - bestBoundedPerMerc))} damage a mercenary** ` +
          `(at a target of 10 it is ${n(Math.round(unbounded.damage / unbounded.mercs - (bounded.find((horizon) => horizon.target === 10)?.damage ?? 0) / Math.max(1, bounded.find((horizon) => horizon.target === 10)?.mercs ?? 1)))}). ` +
          `The mechanism is section 2's shape: the unbounded plan spreads one *small* march over ${n(unbounded.marches - 1)} ` +
          `repeats, so almost all of its silver re-buys the same cheap march and each chunk of ten it burns buys many ` +
          `marches of damage; a bounded plan puts the same stock into fewer, larger marches — a higher ladder and fatter ` +
          `mercenary stacks each time. The owner's own rationale holds in the numbers: bounding to ~10 marches costs ` +
          `${n(unbounded.damage - (bounded.find((horizon) => horizon.target === 10)?.damage ?? 0))} damage of headroom he ` +
          `was never going to play, and buys back ` +
          `${n(Math.round((bounded.find((horizon) => horizon.target === 10)?.damage ?? 0) / (bounded.find((horizon) => horizon.target === 10)?.marches ?? 1) - unbounded.damage / unbounded.marches))} ` +
          `damage a march, ${n(Math.round(days(unbounded) - days(bounded.find((horizon) => horizon.target === 10) as Horizon)))} days ` +
          `of training, and the four mercenary types of experiment 72 — while the mercenaries he does spend buy less.`,
      );

      // ---- 6. the slider's stop set at 10 ---------------------------------------------------------------
      report.h('6. A stop set for the slider, at the target of 10');
      const sweet = ten.recommend;
      const dominatedBy = (point: {
        silver: number;
        mercLost: number;
        totalDamage: number;
      }): string | null => {
        for (const other of ten.alternatives) {
          if (other === point) continue;
          if (
            other.silver <= point.silver &&
            other.mercLost <= point.mercLost &&
            other.totalDamage >= point.totalDamage &&
            (other.silver < point.silver ||
              other.mercLost < point.mercLost ||
              other.totalDamage > point.totalDamage)
          )
            return other.label;
        }
        return null;
      };
      const rowOf = (label: string | undefined): Row | undefined => rows.find((row) => row.label === label);
      // The neighbours a slider needs are the two steps of the damage staircase either side of the sweet spot:
      // the cheapest row that beats it on damage, and the dearest row it beats on damage. Closest-by-silver is
      // not enough — the frontier is dense, and its closest rows are ones the sweet spot itself dominates.
      const sweetDamage = sweet?.totalDamage ?? 0;
      const sweetSilver = sweet?.silver ?? 0;
      const above = rows
        .filter((row) => !isSweet(row) && row.planTotal > sweetDamage && row.planSilver >= sweetSilver)
        .sort((a, b) => a.planSilver - b.planSilver)[0];
      const below = rows
        .filter((row) => !isSweet(row) && row.planTotal < sweetDamage && row.planSilver <= sweetSilver)
        .sort((a, b) => b.planSilver - a.planSilver)[0];
      const cheapest = [...practical].sort((a, b) => a.planSilver - b.planSilver)[0];
      const richest = [...practical]
        .filter((row) => !isSweet(row))
        .sort((a, b) => b.planTotal - a.planTotal)[0];
      const planRow = rows.find((row) => row.planTotal === ten.totalDamage && row.planSilver === ten.silver);
      const stops = [
        { why: 'the cheapest practical plan', row: cheapest },
        { why: 'the next step down the damage staircase', row: below },
        { why: 'the sweet spot (`recommend`)', row: rowOf(sweet?.label) },
        { why: 'the next step up the damage staircase', row: above },
        { why: "the engine's own maximum, the plan itself", row: planRow ?? richest },
      ]
        .filter((entry): entry is { why: string; row: Row } => entry.row !== undefined)
        .filter(
          (entry, index, all) =>
            all.findIndex(
              (other) =>
                other.row.planSilver === entry.row.planSilver && other.row.planTotal === entry.row.planTotal,
            ) === index,
        );
      report.add(
        '| # | stop | marches | damage | silver | mercs lost | damage a march | damage/silver | training, whole run |\n' +
          '|---|---|---|---|---|---|---|---|---|',
      );
      stops.forEach((entry, index) => {
        const row = entry.row;
        report.add(
          `| ${index + 1} | ${entry.why} — \`${row.label}\` | ${n(row.marches)} | ${n(row.planTotal)} | ` +
            `${n(row.planSilver)} | ${n(row.mercsTotal)} | ${n(Math.round(row.damageAMarch))} | ` +
            `${row.damagePerSilver.toFixed(2)} | ${n(Math.round(row.trainingDays))} d |`,
        );
      });
      report.add(
        `\nThe sweet spot at 10 is \`${sweet?.label ?? '—'}\` (${n(sweet?.marches ?? 0)} marches, ${n(sweet?.totalDamage ?? 0)} ` +
          `damage, ${n(sweet?.silver ?? 0)} silver, ` +
          `${n(MERC_IDS.reduce((sum, id) => sum + (sweet?.counts[id] ?? 0), 0))} hired units a march: ` +
          `${mercsOf(sweet?.counts ?? {})}), and it is ` +
          `${sweet ? (dominatedBy(sweet) ? `**dominated** by \`${dominatedBy(sweet)}\` — it is on the list only because \`planCampaign\` pushes it there` : '**undominated** among the rows the plan carries') : '—'}. ` +
          `Its staircase neighbours are ${n(above?.planTotal ?? 0)} damage (${n(Math.round((above?.planSilver ?? 0) / 1000))} k ` +
          `silver) above and ${n(below?.planTotal ?? 0)} damage (${n(Math.round((below?.planSilver ?? 0) / 1000))} k silver) ` +
          `below — and note that both sit within ${n(Math.round(Math.max(above?.planSilver ?? 0, below?.planSilver ?? 0) / 1000))} k ` +
          `of it, so the fold does put a usable neighbourhood on the list; what it does not do is *order* it.`,
      );
      const spread = rows.map((row) => row.planSilver).sort((a, b) => a - b);
      const gaps = spread.slice(1).map((value, index) => value - (spread[index] ?? 0));
      const unboundedSpread = [...(plans.get(undefined)?.alternatives ?? [])]
        .map((row) => row.silver)
        .sort((a, b) => a - b);
      const unboundedGaps = unboundedSpread
        .slice(1)
        .map((value, index) => value - (unboundedSpread[index] ?? 0));
      report.add(
        `\n**Engine thinning or fewer alternatives?** This is where the fold changes experiment 72's answer, and it is ` +
          `measurable: **every stop in the table above is already a row of the ${n(rows.length)}-row list.** Measured: ` +
          `the list spans ${n(Math.round(spread[0] ?? 0))} to ${n(Math.round(spread[spread.length - 1] ?? 0))} silver, ` +
          `its widest gap between consecutive rows is ${n(Math.round(Math.max(...gaps)))} silver (between the cheapest ` +
          `row and the rest) and its narrowest ${n(Math.round(Math.min(...gaps)))} — and the decisive measurement is the ` +
          `stop table above: the even sample of ${n(rows.length)} rows already *contains* every stop the slider needs. ` +
          `The unbounded list, measured in the same run, spans ` +
          `${n(Math.round(unboundedSpread[0] ?? 0))} to ${n(Math.round(unboundedSpread[unboundedSpread.length - 1] ?? 0))} ` +
          `silver — ${(unboundedSpread[unboundedSpread.length - 1] ?? 0) / Math.max(1, unboundedSpread[0] ?? 1) > 0 ? `${n(Math.round((unboundedSpread[unboundedSpread.length - 1] ?? 0) / Math.max(1, unboundedSpread[0] ?? 1)))}-fold` : ''} — ` +
          `and its rows sit up to ${n(Math.round(Math.max(...unboundedGaps)))} silver apart, which is where experiment ` +
          `72's jumpy slider came from. **So the thinning is not the defect here**: at a target of 10, asking the engine for the ` +
          `four or five rows the slider wants is enough, and no change to the even sampling is needed.\n` +
          `\nWhat *is* wrong at a horizon, and is engine-side, is the **label**: ${n(
            rows.length - new Set(rows.map((row) => row.label)).size,
          )} of ${n(rows.length)} rows share their label with another (section 4), so a slider built on labels cannot ` +
          `name its own stops — the identity is the counts. That is a one-line change to \`summarise\`, and it is the ` +
          `only change section 6 asks for.`,
      );

      // ---- 7. the label, proved unique by measurement ---------------------------------------------------
      report.h("7. The label: the plan's identity in player terms, and its collisions measured");
      report.add(
        'The label is presentation only — nothing else moved. It now reads `{stacks} stacks · {hired} hired a ' +
          'march`: the depth of the march and the hired units that *ride* it (which the "mercs a march" column of ' +
          'section 3 does not give — that column is what is *lost*). Collisions below are rows of one list sharing ' +
          'one label.',
      );
      report.add(
        '\n| target | rows | distinct labels | collisions | colliding labels |\n|---|---|---|---|---|',
      );
      for (const target of [10, 20] as const) {
        const at = plans.get(target) as ReturnType<typeof planCampaign>;
        const counts = new Map<string, number>();
        for (const row of at.alternatives) counts.set(row.label, (counts.get(row.label) ?? 0) + 1);
        const colliding = [...counts.entries()].filter(([, seen]) => seen > 1);
        report.add(
          `| ${n(target)} | ${n(at.alternatives.length)} | ${n(counts.size)} | ` +
            `${colliding.length === 0 ? '**none**' : `**${n(colliding.length)}**`} | ` +
            `${colliding.map(([name, seen]) => `\`${name}\` ×${n(seen)}`).join(', ') || '—'} |`,
        );
      }
      report.add(
        `\nCandidate forms, all computed from the rows themselves (the split is the mercenary counts, largest first, ` +
          `so the name is canonical whatever order the table lists the types in), with their collisions measured at ` +
          `both targets. The shipped one is D:`,
      );
      report.add(
        '\n| form | example | collisions at 10 | collisions at 20 | longest label |\n|---|---|---|---|---|',
      );
      interface Form {
        name: string;
        of: (
          row: ReturnType<typeof planCampaign>['alternatives'][number],
          ctx: { stacks: number; hired: number; split: number[]; marchSilver: number },
        ) => string;
      }
      const hiresOf = (counts: Record<string, number>): number[] =>
        MERC_IDS.map((id) => counts[id] ?? 0)
          .filter((count) => count > 0)
          .sort((a, b) => b - a);
      const stackCountOf = (counts: Record<string, number>): number =>
        marchResult(request, counts).result.stacks.filter((stack) => stack.pool === 'leadership').length;
      const marchSilverOf = (counts: Record<string, number>): number =>
        marchResult(request, counts).summary.recovery.silver;
      const compactOf = (value: number): string =>
        new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
          Math.round(value),
        );
      const forms: Form[] = [
        {
          name: 'A — stacks + hired a march',
          of: (_row, ctx) =>
            `${ctx.stacks} ${ctx.stacks === 1 ? 'stack' : 'stacks'} · ${ctx.hired} hired a march`,
        },
        {
          name: 'B — A + the mercenary split',
          of: (_row, ctx) => `${ctx.stacks} stacks · ${ctx.hired} hired (${ctx.split.join('/')})`,
        },
        {
          name: 'C — the split instead of the total',
          of: (_row, ctx) => `${ctx.stacks} stacks · ${ctx.split.join('/')} hired`,
        },
        {
          name: "D — stacks + hired + the march's silver (SHIPPED)",
          of: (_row, ctx) =>
            `${ctx.stacks} ${ctx.stacks === 1 ? 'stack' : 'stacks'} · ${ctx.hired} hired · ${compactOf(ctx.marchSilver)} a march`,
        },
        {
          name: 'E — D + the split',
          of: (_row, ctx) =>
            `${ctx.stacks} stacks · ${ctx.split.join('/')} hired · ${compactOf(ctx.marchSilver)} a march`,
        },
        {
          name: "F — D with the campaign's total instead",
          of: (row, ctx) => `${ctx.stacks} stacks · ${ctx.hired} hired · ${compactOf(row.totalDamage)} total`,
        },
        {
          name: 'G — D with two decimals of silver',
          of: (_row, ctx) =>
            `${ctx.stacks} stacks · ${ctx.hired} hired · ` +
            `${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(Math.round(ctx.marchSilver))} a march`,
        },
      ];
      const collisionCount = (
        labelOf: Form['of'],
        target: 10 | 20,
      ): { collisions: number; longest: string } => {
        const at = plans.get(target) as ReturnType<typeof planCampaign>;
        const seen = new Map<string, number>();
        let longest = '';
        for (const row of at.alternatives) {
          const counts = row.counts;
          const label = labelOf(row, {
            stacks: stackCountOf(counts),
            hired: MERC_IDS.reduce((sum, id) => sum + (counts[id] ?? 0), 0),
            split: hiresOf(counts),
            marchSilver: marchSilverOf(counts),
          });
          if (label.length > longest.length) longest = label;
          seen.set(label, (seen.get(label) ?? 0) + 1);
        }
        return { collisions: [...seen.values()].filter((seenCount) => seenCount > 1).length, longest };
      };
      for (const form of forms) {
        const at10 = collisionCount(form.of, 10);
        const at20 = collisionCount(form.of, 20);
        const sample = (plans.get(10) as ReturnType<typeof planCampaign>).alternatives[0];
        report.add(
          `| ${form.name} | \`${form.of(sample as never, {
            stacks: stackCountOf(sample?.counts ?? {}),
            hired: MERC_IDS.reduce((sum, id) => sum + (sample?.counts[id] ?? 0), 0),
            split: hiresOf(sample?.counts ?? {}),
            marchSilver: marchSilverOf(sample?.counts ?? {}),
          })}\` | ${at10.collisions === 0 ? '**none**' : `**${n(at10.collisions)}**`} | ` +
            `${at20.collisions === 0 ? '**none**' : `**${n(at20.collisions)}**`} | ` +
            `${n(Math.max(at10.longest.length, at20.longest.length))} chars |`,
        );
      }

      report.add(
        `\n**What the table says, and the one residual it leaves.** The mercenary split (B, C, E) does **not** resolve ` +
          `the collision, at either target, in any of the three shapes: the rows that collide field the same vector, so ` +
          `the disambiguator has to be a number. The shipped form (D) puts the march's own silver in the label in the ` +
          `March's compact idiom — the same \`Intl\` call \`src/ui/sections/march/format.ts\` makes, repeated in the ` +
          `engine because the engine does not import \`src/ui\`, one idiom for one figure. Measured after the change: ` +
          `**no collisions at a target of 10** (16 rows, 16 names — the horizon where the owner will live) and **one at ` +
          `20**, where the plan and its nearest neighbour both cost \`1.8M a march\` because a one-decimal compass figure ` +
          `is coarser than the \`1708k\` it replaced. Two forms measure collision-free at **both** targets, and both keep ` +
          `one idiom: **F** \`3 stacks · 135 hired · 45.4M total\` — the campaign's damage instead of the march's silver, ` +
          `34 characters, *shorter* than D — and **G** the same silver at two decimals (\`36\` characters). D was shipped ` +
          `because it is what was asked for and it is exact at the owner's horizon; if a name must be unique at every ` +
          `horizon, F is the swap to make, and it is a one-line change in one function.`,
      );
      report.add('\nEvery label the engine carries at both targets, with the row it names:');
      report.add(
        '| target | label | stacks | hired a march | marches | damage | silver | mercs lost |\n|---|---|---|---|---|---|---|---|',
      );
      for (const target of [10, 20] as const) {
        const at = plans.get(target) as ReturnType<typeof planCampaign>;
        for (const row of at.alternatives) {
          const { result } = marchResult(request, row.counts);
          const stacks = result.stacks.filter((stack) => stack.pool === 'leadership').length;
          const hired = MERC_IDS.reduce((sum, id) => sum + (row.counts[id] ?? 0), 0);
          report.add(
            `| ${n(target)} | \`${row.label}\` | ${n(stacks)} | ${n(hired)} | ${n(row.marches)} | ` +
              `${n(row.totalDamage)} | ${n(row.silver)} | ${n(row.mercLost)} |`,
          );
        }
      }

      // ---- 8. the list the UI will actually ask for: alternatives 4 -------------------------------------
      report.h('8. The list the UI asks for: `marchTarget: 10, alternatives: 4`');
      const few = planCampaign({ request, marchTarget: 10, alternatives: 4 });
      const pickOf = (row: { silver: number; totalDamage: number }): string => {
        const names: string[] = [];
        const same = (point: { silver: number; totalDamage: number } | undefined): boolean =>
          point !== undefined && point.silver === row.silver && point.totalDamage === row.totalDamage;
        if (same(few)) names.push('**chosen** (the plan)');
        if (same(few.mostEfficient)) names.push('**light** (most damage a silver)');
        if (same(few.mostThrifty)) names.push('**heavy** (most damage a mercenary)');
        if (same(few.recommend)) names.push('**balanced** (the sweet spot)');
        return names.join(' · ') || 'the even sample';
      };
      report.add(
        `\`alternatives: 4\` returns **${n(few.alternatives.length)} rows** (the even sample of the undominated ` +
          `frontier, plus whichever of the four picks it did not contain).`,
      );
      report.add(
        '\n| # | label | marches | damage a march | silver a march | mercs a march | damage / silver | damage / mercenary | which pick |\n' +
          '|---|---|---|---|---|---|---|---|---|',
      );
      few.alternatives.forEach((row, index) => {
        const { summary } = marchResult(request, row.counts);
        report.add(
          `| ${index + 1} | \`${row.label}\` | ${n(row.marches)} | ${n(Math.round(summary.avgDamage))} | ` +
            `${n(summary.recovery.silver)} | ` +
            `${n(MERC_IDS.reduce((sum, id) => sum + chunks(row.counts[id] ?? 0), 0))} | ` +
            `${row.damagePerSilver.toFixed(2)} | ${n(Math.round(row.damagePerMercenary))} | ${pickOf(row)} |`,
        );
      });
      const forced = few.alternatives.filter((row) => pickOf(row) !== 'the even sample');
      const sampleOnly = few.alternatives.filter((row) => pickOf(row) === 'the even sample');
      report.add(
        `\nMeasured: of those ${n(few.alternatives.length)} rows, **${n(forced.length)} are forced picks** ` +
          `(${forced.map((row) => pickOf(row)).join(' · ')}) and ${n(sampleOnly.length)} come from the even sample. ` +
          `Verdict, from the table above rather than from taste: the list is **usable as a control** — every row has a ` +
          `distinct label (section 7), the four picks are the four strategies worth offering (the plan, the cheapest, ` +
          `the most mercenary-thrifty and the sweet spot), and the sample fills the gaps between them, which is what a ` +
          `slider's intermediate stops are for. **Do not drop the picks at a horizon**: they are the only rows ` +
          `guaranteed to be on the list at every target, and the even sample alone moves as the frontier changes shape ` +
          `with the target (measured: at a target of 10 the sample of 4 lands on ${sampleOnly.map((row) => row.label).join(', ') || 'nothing outside the picks'}).`,
      );

      // ---- 9. the payload fingerprint: the label moved, nothing else did --------------------------------
      report.h("9. The label moved and nothing else: the payload's fingerprint");
      let written = false;
      /** FNV-1a over everything the plan carries except the labels — the numbers, the counts and the curve. */
      const fingerprint = (plan: ReturnType<typeof planCampaign>): string => {
        // Every key literally named `label` is dropped wherever it sits in the tree, so the hash is over the
        // payload's *numbers* only; non-integers are rounded to six places so the hash is stable.
        const text = JSON.stringify(plan, (key: string, value: unknown) => {
          if (key === 'label') return undefined;
          return typeof value === 'number' && !Number.isInteger(value) ? Number(value.toFixed(6)) : value;
        });
        if (plan.marches === (plans.get(10)?.marches ?? -1) && !written) {
          written = true;
          writeFileSync(new URL('./out/73-plan-projection.json', import.meta.url), text);
        }
        let hash = 0x811c9dc5;
        for (let index = 0; index < text.length; index += 1) {
          hash ^= text.charCodeAt(index);
          hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        return hash.toString(16).padStart(8, '0');
      };
      report.add(
        'FNV-1a over the whole `CampaignPlan` with every key named `label` dropped wherever it sits. **This was run ' +
          'twice** — once with the previous label form (`3 stacks · 135 hired a march`) and once with the new one — and ' +
          'the two tables are **identical, row for row**, so the label is the sole difference the change made. (The ' +
          'first attempt at this check used a rest-spread helper to drop the labels and it silently failed to drop ' +
          'them: the two tables differed. The replacer above drops them by key and the tables agree.)',
      );
      report.add('\n| target | fingerprint |\n|---|---|');
      for (const target of AUDIT_TARGETS) {
        const plan = plans.get(target) as ReturnType<typeof planCampaign>;
        report.add(`| ${target === undefined ? 'undefined' : n(target)} | \`${fingerprint(plan)}\` |`);
      }
      report.add(`| 10, \`alternatives: 4\` | \`${fingerprint(few)}\` |`);

      report.save();
    });
  },
  900_000,
);
