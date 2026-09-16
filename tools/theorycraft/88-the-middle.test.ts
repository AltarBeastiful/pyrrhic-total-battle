/**
 * 88 — **is there a middle ground between the two ends of the trade?**
 *
 * The owner, 2026-09-16, looking at the bar after S-59:
 *
 * > *"the sweet spot seems to have same merc spent as silver save. its not that different. Could ther be
 * > more a middle ground between saving the stock and silver save ?"*
 *
 * The bar carries the four answers: best damage a silver, best damage a hired unit, the sweet spot the
 * engine weighed both resources to choose, and the most damage. On a frontier that is steep at the bottom
 * and flat at the top, three of those four can land on nearly the same plan — which is what he is looking
 * at. This file measures the shape rather than arguing about it: the picks as the app shows them, and the
 * campaign's own **curve** (`CampaignPlan.curve`, bucketed by silver, one point per level) laid out so the
 * damage available at each level of hired stock burned is visible.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/88-the-middle.md`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { MERC_IDS, Report, evaluateCounts, loadOwner, n, scenarioC, withHousing } from './harness';

describe.skipIf(!process.env.THEORY)('the middle of the trade', () => {
  it('lays the picks and the curve out side by side', () => {
    const report = new Report('88-the-middle');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));

    const plan = planCampaign({ request: base, marchTarget: 4, alternatives: 8 });

    report.h('The four answers, as the app draws them');
    report.add(
      `\`leftOut\` = ${n(plan.leftOut)} — the plans on the frontier the bar does not offer.\n\n` +
        `| pick | damage a march | silver a march | hired burned | damage a silver | damage a hired |\n` +
        `|---|---|---|---|---|---|\n` +
        plan.alternatives
          .map((row) => {
            const { summary } = evaluateCounts(base, row.counts);
            const burned = MERC_IDS.reduce((sum, id) => sum + Math.ceil((row.counts[id] ?? 0) / 10), 0);
            return (
              `| \`${row.pick}\` | **${n(summary.avgDamage)}** | ${n(summary.recovery.silver)} | ${n(burned)} | ` +
              `${(summary.avgDamage / Math.max(1, summary.recovery.silver)).toFixed(2)} | ` +
              `${(summary.avgDamage / Math.max(1, burned)).toFixed(0)} |`
            );
          })
          .join('\n'),
    );

    report.h('What the whole curve offers, level by level');
    report.add(
      '`CampaignPlan.curve`: one row per silver level the search reached, each holding the best damage found\n' +
        'at that level (`damage`) and what it burned for it (`mercLost`), plus the most damage a mercenary\n' +
        'found there (`thrifty*`).\n\n' +
        `| silver | damage | damage a silver | hired burned | damage a hired | best mercenary: damage | burned |\n` +
        `|---|---|---|---|---|---|---|\n` +
        plan.curve
          .filter((point) => point.silver > 0 && point.damage > 0)
          .map(
            (point) =>
              `| ${n(point.silver)} | ${n(point.damage)} | ${point.damagePerSilver.toFixed(2)} | ` +
              `${n(point.mercLost)} | ${(point.damage / Math.max(1, point.mercLost)).toFixed(0)} | ` +
              `${n(point.thriftyDamage)} | ${n(point.thriftyMercLost)} |`,
          )
          .join('\n'),
    );

    report.add(
      `The curve is bucketed by **silver**, and each level is the best the search reached *there*, so a level\n` +
        `whose burn is lower than the level below it is a plan that spends more silver and less stock — the two\n` +
        `resources do not move together, which is the whole reason the trade exists.`,
    );

    report.save();
  }, 300_000);
});
