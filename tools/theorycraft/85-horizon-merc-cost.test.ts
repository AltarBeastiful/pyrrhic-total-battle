/**
 * 85 — **what each horizon costs in mercenaries** (owner, 2026-09-15: *"would I spend less merc if I change to
 * 4?"*).
 *
 * The horizon buys endurance with damage: a fielded stack loses `ceil(n/10)` **for good**, so the longer the
 * plan must last, the less of each type it can field — which is fewer hired units on the field *and* fewer
 * burned per march. Experiment 84 measured the two ends (227 hired a march at horizon 3, 135 at horizon 10);
 * this walks every horizon from 1 to 10 and reports what each costs and pays, per march and over its own run.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/85-horizon-merc-cost.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import { MERC_IDS, Report, evaluateCounts, loadOwner, n, scenarioC, withHousing } from './harness';

const MERC_COST = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'] as const;

describe.skipIf(!process.env.THEORY)('the mercenary cost of a horizon', () => {
  it('walks horizons 1 to 10 and reports hired fielded, burned and bought', () => {
    const report = new Report('85-horizon-merc-cost');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));
    const held = MERC_COST.reduce((sum, id) => sum + (base.caps[id] ?? 0), 0);

    /** Play the plan's own march for its own horizon, with the game's decay. */
    const play = (
      counts: Record<string, number>,
      horizon: number,
    ): {
      marches: number;
      damage: number;
      silver: number;
      lost: number;
    } => {
      const stock: Record<string, number> = { ...base.caps };
      let damage = 0;
      let silver = 0;
      let lost = 0;
      let marches = 0;
      for (let march = 1; march <= horizon; march += 1) {
        const fielded: Record<string, number> = { ...counts };
        for (const id of MERC_IDS) fielded[id] = Math.min(counts[id] ?? 0, stock[id] ?? 0);
        if (MERC_IDS.every((id) => (fielded[id] ?? 0) === 0)) break;
        const { summary } = evaluateCounts(base, fielded);
        marches += 1;
        damage += summary.avgDamage;
        silver += summary.recovery.silver;
        for (const id of MERC_IDS) {
          const chunk = chunks(fielded[id] ?? 0);
          lost += chunk;
          stock[id] = Math.max(0, (stock[id] ?? 0) - chunk);
        }
      }
      return { marches, damage, silver, lost };
    };

    report.h('The account');
    report.add(
      `Owner's export, scenario C, housing 4 343 leadership / ${n(base.housing.authority)} authority. Held: ` +
        `${n(held)} hired units in four types. Every figure is \`simulateBattle\` on the counts actually ` +
        `fielded, with the game's own decay between marches.`,
    );

    report.h('Every horizon, and what it costs in mercenaries');
    report.add(
      '\n| horizon | hired a march | **hired burned a march** | damage a march | silver a march | damage a silver | over its own run: damage | silver | hired burned |\n' +
        '|---|---|---|---|---|---|---|---|---|\n',
    );
    const rows = Array.from({ length: 10 }, (_unused, index) => index + 1).map((horizon) => {
      const plan = planCampaign({ request: base, marchTarget: horizon });
      const chosen = plan.recommend ?? plan;
      const { result, summary } = evaluateCounts(base, chosen.counts);
      const hired = MERC_COST.reduce((sum, id) => sum + (chosen.counts[id] ?? 0), 0);
      const burned = MERC_COST.reduce((sum, id) => sum + chunks(chosen.counts[id] ?? 0), 0);
      const played = play(chosen.counts, horizon);
      void result;
      return { horizon, hired, burned, summary, played };
    });
    for (const row of rows) {
      report.add(
        `| **${n(row.horizon)}** | ${n(row.hired)} | **${n(row.burned)}** | ${n(row.summary.avgDamage)} | ` +
          `${n(row.summary.recovery.silver)} | ${(row.summary.avgDamage / Math.max(1, row.summary.recovery.silver)).toFixed(2)} | ` +
          `${n(row.played.damage)} | ${n(row.played.silver)} | ${n(row.played.lost)} |`,
      );
    }

    const fewest = rows.reduce((a, b) => (b.burned < a.burned ? b : a));
    const best = rows.reduce((a, b) => (b.summary.avgDamage > a.summary.avgDamage ? b : a));
    report.add(
      `\n- **The fewest mercenaries burned a march** is at horizon **${n(fewest.horizon)}** — ` +
        `${n(fewest.burned)} units a march, against ${n(rows[0]?.burned ?? 0)} at horizon 1 and ` +
        `${n(rows[rows.length - 1]?.burned ?? 0)} at horizon 10.`,
    );
    report.add(
      `- **The most damage a march** is at horizon **${n(best.horizon)}** — ${n(best.summary.avgDamage)} — and it ` +
        `burns ${n(best.burned)} a march. The stock lasts ${n(Math.floor(held / Math.max(1, best.burned)))} ` +
        `marches at that rate, and ${n(Math.floor(held / Math.max(1, fewest.burned)))} at the thriftiest one.`,
    );
    report.add(
      `\nThe trade in one line: **each step of horizon buys the stock more marches and pays for it with damage** — ` +
        `the plan can field less of every type, and it is the fielded count that both deals the damage and pays ` +
        `the chunks.`,
    );

    report.save();
  }, 1_800_000);
});
