/**
 * 89 — **what the trade offers between its two ends.**
 *
 * The owner, 2026-09-16, on the bar S-59 draws:
 *
 * > *"the sweet spot seems to have same merc spent as silver save. its not that different. Could ther be more
 * > a middle ground between saving the stock and silver save ?"*
 *
 * The four answers are the *named* plans. On this account three of them are within a few per cent of each
 * other in silver, and the fourth (spare-the-stock) sits far below them in damage, so the bar looks like two
 * plans and a stray. The question is what lies between them, and whether the app could offer it.
 *
 * The frontier itself is not part of the payload (`alternatives` is the four picks), so this walks the trade
 * the way a player can: **one ceiling at a time**. `planCampaign({ silverBudget })` answers with the best plan
 * that fits, so sweeping the ceiling traces what each further slice of silver buys — with the hired stock it
 * burns to buy it. The spend is the axis because it is the one the owner can choose.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/89-the-middle.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { MERC_IDS, Report, loadOwner, n, scenarioC, withHousing } from './harness';

describe.skipIf(!process.env.THEORY)('the middle of the trade', () => {
  it('sweeps the ceiling and reads the burn at each step', () => {
    const report = new Report('89-the-middle');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));

    report.h('The trade along a sweep of ceilings');
    report.add(
      `Owner's export, scenario C, 4 343 leadership / 2 000 authority, the app's horizon (4). Each row is the\n` +
        `**best plan that fits the ceiling**, as the engine answers it — so the damage column is a floor on what\n` +
        `that much silver buys, and the two ratio columns are what the plan spends to get there. Every figure is\n` +
        `a march's, not the campaign's.\n\n` +
        `| ceiling, a campaign | silver a march | damage a march | hired burned | damage a silver | damage a hired | marches |\n` +
        `|---|---|---|---|---|---|---|`,
    );
    for (const ceiling of [
      3_000_000, 5_000_000, 7_000_000, 8_000_000, 9_000_000, 10_000_000, 12_000_000, 16_000_000, 24_000_000,
    ]) {
      const plan = planCampaign({ request: base, marchTarget: 4, silverBudget: ceiling });
      const each = plan.repeat;
      report.add(
        `| ${n(ceiling)} | ${n(each.silver)} | **${n(each.damage)}** | ${n(each.mercLost)} | ` +
          `${(each.damage / Math.max(1, each.silver)).toFixed(2)} | ` +
          `${n(each.damage / Math.max(1, each.mercLost))} | ${n(plan.marches)} |`,
      );
    }

    report.add(
      `A ceiling buys the **best plan inside it**, and the plan that fits it is not the plan that spends it: the\n` +
        `engine answers with the most damage the ceiling allows, so a column that barely moves while the ceiling\n` +
        `doubles is silver the plan declined to spend — and a column that moves while the burn does not is\n` +
        `silver buying damage without touching the stock.`,
    );

    report.h('What the app draws, for comparison');
    const plan = planCampaign({ request: base, marchTarget: 4 });
    report.add(
      `| pick | damage a march | silver a march | hired burned |\n|---|---|---|---|\n` +
        plan.alternatives
          .map(
            (row) =>
              `| \`${row.pick}\` | **${n(row.repeat.damage)}** | ${n(row.repeat.silver)} | ${n(row.repeat.mercLost)} |`,
          )
          .join('\n') +
        `\n\n\`leftOut\` = ${n(plan.leftOut)} plans on the frontier are not offered by the bar.\n` +
        `The hired soldiers of the account (${MERC_IDS.length} types) are counted inside \`mercLost\` along with\n` +
        `every monster the account fields, which is why it is larger than the shipped column's own count.`,
    );

    report.save();
  }, 900_000);
});
