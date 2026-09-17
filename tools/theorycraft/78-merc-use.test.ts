/**
 * 78 — why the plan leaves hired units at home, and whether the arithmetic is wrong (owner, 2026-09-15:
 * *"I still see some mercs not used when generating marches with complete opt… we surely want all mercs,
 * it gets better damage… Assess the formulas and try to fix them."*)
 *
 * The plan rations the hired stock: fielding n loses `chunks(n) = ceil(n/10)` **for good**, so a constant n
 * lasts `floor((held − n) / chunks(n)) + 1` marches (`lastsMarches`, `engine/plan.ts`). This file asks three
 * things of the owner's own account, at the horizon the app uses (10 marches):
 *
 *   1. what the plan fields against what the account holds, and what each pool allows;
 *   2. what the *real* battle (`marchResult` → `simulateBattle`) pays for fielding more — so the answer is
 *      the engine's own, not the analytic scorer's;
 *   3. which rule is binding: `lastsMarches`, the authority pool, or the kill order.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/78-merc-use.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign, marchResult } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import { Report, loadOwner, n, scenarioC, withHousing } from './harness';

const MERC_IDS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'] as const;

describe.skipIf(!process.env.THEORY)('the hired stock the plan fields', () => {
  it('says what the plan leaves at home, and what each rule allows', () => {
    const report = new Report('78-merc-use');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));

    const plan = planCampaign({ request: base, marchTarget: 10 });
    const chosen = plan.recommend ?? plan;

    const held = (id: string): number => base.caps[id] ?? 0;
    const cost = (id: string): number => base.units.find((unit) => unit.id === id)?.cost ?? 0;
    const authorityOf = (counts: Record<string, number>): number =>
      MERC_IDS.reduce((sum, id) => sum + (counts[id] ?? 0) * cost(id), 0);

    report.h('1. What the plan decided');
    report.add(
      `| | ${MERC_IDS.join(' | ')} |\n|${'---|'.repeat(MERC_IDS.length + 1)}\n` +
        `| held | ${MERC_IDS.map((id) => n(held(id))).join(' | ')} |\n` +
        `| authority a unit costs | ${MERC_IDS.map((id) => n(cost(id))).join(' | ')} |\n` +
        `| **the plan's repeated march** | ${MERC_IDS.map((id) => `**${n(chosen.counts[id] ?? 0)}**`).join(' | ')} |\n` +
        `| its final march | ${MERC_IDS.map((id) => n(chosen.finaleCounts?.[id] ?? 0)).join(' | ')} |\n` +
        `| authority the march spends | ${n(authorityOf(chosen.counts))} of ${n(base.housing.authority)} |\n` +
        `| marches | ${n(chosen.marches)} |\n` +
        `| damage a march (the plan's own arithmetic) | ${n(chosen.repeat.damage)} |\n` +
        `| campaign total | ${n(chosen.totalDamage)} |`,
    );

    report.h('2. What each rule allows a *repeated* march to field');
    const repeats = chosen.marches - 1;
    const lasts = (id: string, count: number): number =>
      count <= 0 ? Number.POSITIVE_INFINITY : Math.floor((held(id) - count) / chunks(count)) + 1;
    const largestFor = (id: string, marches: number): number => {
      for (let count = held(id); count >= 1; count -= 1) {
        if (Math.floor((held(id) - count) / chunks(count)) + 1 >= marches) return count;
      }
      return 0;
    };
    report.add(
      `A march is repeated ${n(repeats)} times, so a count has to last that long: \`lastsMarches\` is ` +
        `\`floor((held − n) / ceil(n/10)) + 1\`.\n\n` +
        `| type | held | the plan fields | what lasts ${n(repeats)} marches | what lasts 1 march |\n` +
        `|---|---|---|---|---|\n` +
        MERC_IDS.map(
          (id) =>
            `| ${id} | ${n(held(id))} | ${n(chosen.counts[id] ?? 0)} | ${n(largestFor(id, repeats))} | ${n(held(id))} |`,
        ).join('\n') +
        `\n\n**Authority the whole stock would cost: ${n(
          MERC_IDS.reduce((sum, id) => sum + held(id) * cost(id), 0),
        )}, against the ${n(base.housing.authority)} the march may spend.**`,
    );

    report.h('3. What the real battle pays for fielding more (the engine’s own `simulateBattle`)');
    report.add(
      'Each row takes the plan’s own march and raises **one** type, leaving the rest as the plan set them. ' +
        '`marchResult` builds the stacks and runs the real battle, so this is what the game would do.',
    );
    report.add(
      '\n| type | count | authority spent | damage (real battle) | vs the plan | strikes |\n' +
        '|---|---|---|---|---|---|\n',
    );
    const base3 = marchResult(base, chosen.counts);
    for (const id of MERC_IDS) {
      const start = chosen.counts[id] ?? 0;
      const steps = [start, Math.round((start + held(id)) / 2), largestFor(id, repeats), held(id)].filter(
        (count, index, all) => count > 0 && all.indexOf(count) === index,
      );
      for (const count of steps.slice(-3)) {
        const counts = { ...chosen.counts, [id]: count };
        const { summary } = marchResult(base, counts);
        report.add(
          `| ${id} | ${n(count)} | ${n(authorityOf(counts))} | **${n(summary.avgDamage)}** | ` +
            `${n(summary.avgDamage - base3.summary.avgDamage)} | ${n(summary.journals.enemyFirst.friendlyHits)} |`,
        );
      }
    }

    report.h('4. Every plan on the frontier, type by type — where a hired type goes to zero');
    report.add(
      'The slider walks the frontier, and each stop is its own count vector. A type at **0** is a type that ' +
        'plan decided not to hire at all — which is what "some mercs not used" looks like on screen, and why ' +
        'putting one back and then moving the bar moves it out again.',
    );
    report.add(
      `\n| # | label | ${MERC_IDS.join(' | ')} | marches | damage a march | silver a march |\n` +
        `|${'---|'.repeat(MERC_IDS.length + 5)}`,
    );
    const points = plan.alternatives;
    points.forEach((point, index) => {
      const zeros = MERC_IDS.filter((id) => (point.counts[id] ?? 0) === 0);
      report.add(
        `| ${n(index + 1)} | ${point.label}${zeros.length > 0 ? ` **(${n(zeros.length)} at 0)**` : ''} | ` +
          `${MERC_IDS.map((id) => {
            const count = point.counts[id] ?? 0;
            return count === 0 ? '**0**' : n(count);
          }).join(' | ')} | ${n(point.marches)} | ${n(point.repeat.damage)} | ${n(point.repeat.silver)} |`,
      );
    });
    const withZero = points.filter((point) => MERC_IDS.some((id) => (point.counts[id] ?? 0) === 0));
    report.add(
      `\n${n(withZero.length)} of ${n(points.length)} plans on the frontier field none of at least one hired ` +
        `type. The recommended plan is ${MERC_IDS.some((id) => (chosen.counts[id] ?? 0) === 0) ? '**one of them**' : 'not one of them'}` +
        `; \`leftOut\` = ${n(plan.leftOut)}, \`binding\` = ${JSON.stringify(plan.binding)}.`,
    );

    report.h('4b. How often a plan drops a whole type, as the frontier widens');
    report.add(
      'The app asks for four rows (`CAMPAIGN.planAlternatives`); the engine also carries its own picks. ' +
        'A wider request shows how common the hole is.',
    );
    report.add(
      '\n| rows asked | plans on the frontier | of them, plans dropping a whole hired type |\n|---|---|---|',
    );
    for (const asked of [4, 8, 12, 24]) {
      const wide = planCampaign({ request: base, marchTarget: 10 });
      const rows = wide.alternatives;
      const holes = rows.filter((point) => MERC_IDS.some((id) => (point.counts[id] ?? 0) === 0));
      report.add(`| ${n(asked)} | ${n(rows.length)} | ${n(holes.length)} |`);
    }

    /** Every plan on a 24-row frontier that drops exactly one hired type. */
    const holesOf = (): (typeof plan.alternatives)[number][] =>
      planCampaign({ request: base, marchTarget: 10 }).alternatives.filter(
        (point) => MERC_IDS.filter((id) => (point.counts[id] ?? 0) === 0).length === 1,
      );

    report.h('5. The owner’s own proposal: a little of every type instead of none of one');
    report.add(
      'Owner, 2026-09-15: *"We’re often leaving out one merc as a whole and it would be better to have a ' +
        'little of all of them… then also the march is more repeatable."* Tested on each frontier point that ' +
        'drops a type: the missing type is given a token count — 1, 5, 10, and the most that lasts the ' +
        'horizon — with **everything else left as the plan set it**, and the real battle is replayed.',
    );
    for (const point of holesOf()) {
      const missing = MERC_IDS.filter((id) => (point.counts[id] ?? 0) === 0);
      if (missing.length !== 1) continue;
      const id = missing[0] as string;
      report.add(
        `\n**${point.label}** — fields none of ${id}. Real battle, everything else unchanged:\n\n` +
          `| ${id} fielded | damage | vs the plan | strikes | lasts marches |\n|---|---|---|---|---|`,
      );
      const asPlanned = marchResult(base, point.counts).summary.avgDamage;
      for (const count of [1, 5, 10, 20, Math.max(1, largestFor(id, repeats))]) {
        const counts = { ...point.counts, [id]: count };
        const { summary } = marchResult(base, counts);
        report.add(
          `| ${n(count)} | **${n(summary.avgDamage)}** | ${summary.avgDamage >= asPlanned ? '+' : ''}${n(
            summary.avgDamage - asPlanned,
          )} | ${n(summary.journals.enemyFirst.friendlyHits)} | ` +
            `${Number.isFinite(lasts(id, count)) ? n(lasts(id, count)) : '∞'} |`,
        );
      }
      report.add(`\n(None of ${id}: ${n(asPlanned)} damage.)`);
    }

    report.save();
  });
});
