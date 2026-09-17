/**
 * 71 — five marches of the plan's own stack, march by march (owner, 2026-09-15: "check the result of the
 * computed stack over 5 marches of the generated stack: damage, silver, training days, gold, merc spent and
 * usual metrics, damage/silver, damage/merc … for each march and total").
 *
 * The plan is one march repeated, so this is less about five different marches than about what repeating
 * *costs*: the damage and the silver are the same every time, the training time and the gold add up, and the
 * mercenary stock is the one thing that runs down — one chunk of ten lost per march, for good. So the table
 * carries both the per-march figures and the running totals, and the last column is the stock left.
 *
 * Two independent paths in the engine produce the per-march cost and both are printed, because a ledger a
 * reader cannot check against a second route is worth less than one they can: the plan's own arithmetic
 * (`toMarch`, which prices the ladder) and the battle's summary (`simulateBattle` → `recovery`).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/71-five-marches.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { planCampaign, marchResult } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import type { ResolvedSource, StackRequest } from '../../src/engine/types';
import { Report, duration, loadOwner, n, withCaps, withHousing } from './harness';

/** The bonuses the account's current fights are under (scenario C, `harness.kaiReportTotals`). */
const PROFILE: ResolvedSource = {
  id: 'account-2026-09-14',
  label: 'the account',
  kind: 'custom',
  health: { guardsmen: 157, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
  strength: { guardsmen: 187, melee: 1, mounted: 1, flying: 1, ranged: 2 },
  special: { doubleDamageChance: 3 },
};
/** What the account holds, by mercenary type — the export's own caps. */
const HELD: Record<string, number> = {
  'epic-monster-hunter-6': 92,
  'arbalester-6': 76,
  'legionary-6': 72,
  'chariot-6': 37,
};
const MARCHES = 5;

describe.skipIf(!process.env.THEORY)(
  'five marches of the planned stack',
  () => {
    it('ledgers what each march costs and what the five add up to', () => {
      const report = new Report('71-five-marches');
      const owner = loadOwner();
      const request: StackRequest = withCaps(
        withHousing(
          { ...owner.twelve, totals: aggregateBonuses([PROFILE]) },
          { leadership: 4_343, authority: 2_000 },
        ),
        HELD,
      );
      const plan = planCampaign({ request });
      const counts = plan.march.counts;
      report.h('The stack the plan marches, and the plan it belongs to');
      report.add(
        `**${plan.marches} marches** in total (the last one spends what the stock has left), ` +
          `**${n(plan.totalDamage)}** damage for **${n(plan.silver)}** silver; the repeated march is:`,
      );
      report.add(
        Object.entries(counts)
          .map(([id, count]) => `${id} ${n(count)}`)
          .join(' · '),
      );

      // The battle's own figures for that march, and the plan's own pricing of it, side by side.
      const { summary } = marchResult(request, counts);
      const recovery = summary.recovery;
      const mercFielded = Object.entries(plan.march.mercFielded);
      /** What a march costs the stock: one chunk of ten per type fielded, for good. */
      const chunksLost = mercFielded.reduce((sum, [, count]) => sum + chunks(count), 0);
      report.add(
        `\nthe battle's summary for it: expected **${n(summary.avgDamage)}** damage ` +
          `(worst ${n(summary.minDamage)} · best ${n(summary.maxDamage)}), ` +
          `silver **${n(recovery.silver)}**, gold **${n(recovery.gold)}**, ` +
          `training **${duration(recovery.seconds)}**, ${n(summary.journals.enemyFirst.friendlyHits)} hits.`,
      );
      report.add(
        `the plan's own pricing of the same march: damage ${n(plan.march.damage)}, silver ${n(plan.march.silver)}, ` +
          `gold ${n(plan.march.gold)}, ${n(plan.march.mercLost)} mercenaries lost, ${n(plan.march.strikes)} strikes, ` +
          `${n(plan.march.stacks)} stacks.`,
      );
      report.add(
        `hired units fielded: ${mercFielded.map(([id, count]) => `${id} ${n(count)} (${n(chunks(count))} lost a march)`).join(' · ')} — ` +
          `**${n(chunksLost)}** of the stock gone per march, for good (the plan counts ${n(plan.march.mercLost)}).`,
      );

      report.h(`The same march, ${MARCHES} times`);
      report.add(
        '| march | damage | silver | training | gold | mercs lost | mercs left | damage / silver | damage / mercenary |\n' +
          '|---|---|---|---|---|---|---|---|---|',
      );
      const held: Record<string, number> = { ...HELD };
      const fielded: Record<string, number> = {};
      for (const [id, count] of mercFielded) fielded[id] = count;
      let damage = 0;
      let silver = 0;
      let gold = 0;
      let seconds = 0;
      let mercsLost = 0;
      for (let march = 1; march <= MARCHES; march += 1) {
        let left = 0;
        for (const [id, count] of Object.entries(fielded)) {
          held[id] = Math.max(0, (held[id] ?? 0) - chunks(count));
          left += held[id] ?? 0;
        }
        damage += plan.march.damage;
        silver += plan.march.silver;
        gold += plan.march.gold;
        seconds += recovery.seconds;
        mercsLost += plan.march.mercLost;
        report.add(
          `| ${march} | ${n(plan.march.damage)} | ${n(plan.march.silver)} | ${duration(recovery.seconds)} | ` +
            `${n(plan.march.gold)} | ${n(plan.march.mercLost)} | ${n(left)} | ` +
            `${(plan.march.damage / Math.max(1, plan.march.silver)).toFixed(2)} | ` +
            `${n(Math.round(plan.march.damage / Math.max(1, plan.march.mercLost)))} |`,
        );
      }
      report.add(
        `| **${MARCHES} total** | **${n(damage)}** | **${n(silver)}** | **${duration(seconds)}** | **${n(gold)}** | ` +
          `**${n(mercsLost)}** | — | **${(damage / Math.max(1, silver)).toFixed(2)}** | ` +
          `**${n(Math.round(damage / Math.max(1, mercsLost)))}** |`,
      );
      report.add(
        `and with the plan's final march, which spends what the stock has left: ` +
          `**${n(plan.totalDamage)}** damage, **${n(plan.silver)}** silver, ` +
          `**${n(plan.mercLost)}** mercenaries, ` +
          `${(plan.totalDamage / Math.max(1, plan.silver)).toFixed(2)} a silver, ` +
          `${n(Math.round(plan.totalDamage / Math.max(1, plan.mercLost)))} a mercenary.`,
      );

      report.h('Where the stock runs out, if it does');
      for (const [id, count] of Object.entries(fielded)) {
        const per = chunks(count);
        const held0 = HELD[id] ?? 0;
        const marchesUntilGone = Math.floor((held0 - count) / per) + 1;
        report.add(
          `- ${id}: ${n(count)} fielded, ${n(per)} lost a march, ${n(held0)} held — ` +
            `**${n(marchesUntilGone)} marches** before it cannot be fielded again` +
            `${marchesUntilGone < MARCHES ? ' (the five above are not all possible)' : ''}.`,
        );
      }
      report.add(
        `\nThe plan's own count is ${n(plan.marches)}: **${n(plan.marches - (plan.finale ? 1 : 0))} repeats**, ` +
          `which is exactly the tightest of those ceilings, **plus the final march** that spends what is left. ` +
          `It fields the largest count each type can be fielded for the whole run, so the run ends when the ` +
          `tightest of them does.`,
      );
      report.save();
    });
  },
  300_000,
);
