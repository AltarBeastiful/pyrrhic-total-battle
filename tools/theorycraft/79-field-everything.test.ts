/**
 * 79 — the plan's shape against the way a player actually marches (owner, 2026-09-15).
 *
 * Experiment 78 showed the plan fields 35 of 92 epic monster hunters (and rations the rest) while authority
 * is nowhere near binding — 155 of 2,000 — and that the **real battle pays more for every mercenary added**.
 * So the rationing is `lastsMarches`: the plan's shape is *one march repeated*, and a constant count has to
 * survive the whole horizon.
 *
 * The game's rule is that a fielded stack loses `ceil(n/10)` **for good**. A constant count therefore decays
 * fast, but **fielding everything you hold** decays gently — 92 → 82 → 73 → 65 … — and nobody marches the
 * same stack ten times: the player re-generates each march with what is left.
 *
 * So this file plays both strategies with the **real** `simulateBattle` on the owner's own account:
 *
 *   A. **the plan's shape** — 9 repeats of its constant march, then its finale;
 *   B. **field everything, re-planned each march** — the player's own loop: plan on the stock you hold,
 *      march it, lose the chunks, repeat.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/79-field-everything.test.ts`
 */
import { describe, it } from 'vitest';

import { marchResult, planCampaign } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import { Report, loadOwner, n, scenarioC, withHousing } from './harness';

const MERC_IDS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'] as const;
const HORIZON = 10;

describe.skipIf(!process.env.THEORY)('the plan against fielding everything', () => {
  it('plays both strategies with the real battle', () => {
    const report = new Report('79-field-everything');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));

    const plan = planCampaign({ request: base, marchTarget: HORIZON, alternatives: 4 });
    const chosen = plan.recommend ?? plan;

    const line = (counts: Record<string, number>, label: string): string => {
      const { summary } = marchResult(base, counts);
      return (
        `| ${label} | ${MERC_IDS.map((id) => n(counts[id] ?? 0)).join(' | ')} | ` +
        `**${n(summary.avgDamage)}** | ${n(summary.journals.enemyFirst.friendlyHits)} |`
      );
    };

    // ---- A: the plan's own shape, played for real --------------------------------------------------
    report.h('A. The plan’s shape, played with the real battle');
    report.add(
      `The plan is **${n(chosen.marches)} marches**: ${n(chosen.marches - 1)} repeats of one march and a ` +
        `finale. Both are replayed below through \`simulateBattle\`, so this is what the game would pay.\n\n` +
        `| march | ${MERC_IDS.join(' | ')} | damage | strikes |\n|${'---|'.repeat(MERC_IDS.length + 2)}`,
    );
    let totalA = 0;
    const repeatCounts = chosen.counts;
    const finaleCounts = chosen.finaleCounts ?? chosen.counts;
    // The stock the repeats burn, so the finale is played on what the game would have left.
    const left = { ...base.caps };
    for (let march = 1; march <= chosen.marches; march += 1) {
      const counts = march === chosen.marches ? finaleCounts : repeatCounts;
      const { summary } = marchResult(base, counts);
      totalA += summary.avgDamage;
      if (march <= 2 || march === chosen.marches) report.add(line(counts, `#${n(march)}`));
      for (const id of MERC_IDS) {
        const fielded = counts[id] ?? 0;
        left[id] = Math.max(0, (left[id] ?? 0) - chunks(fielded));
      }
    }
    report.add(`| **total** | | **${n(totalA)}** | |`);

    // ---- B: field everything each march, re-planned on what is left ---------------------------------
    report.h('B. Fielding everything you hold, re-planned each march');
    report.add(
      'The player’s own loop: Generate on the stock you have, march it, lose the chunks, Generate again. ' +
        'Each march is a `planCampaign` at `marchTarget: 1`, which has no horizon to ration for, so it ' +
        'fields the whole stock; the stack is then decayed by the game’s own rule and the next march ' +
        'planned on what is left. Played through the real battle as well.',
    );
    report.add(
      `\n| march | ${MERC_IDS.join(' | ')} | damage | strikes |\n|${'---|'.repeat(MERC_IDS.length + 2)}`,
    );
    let totalB = 0;
    const stock: Record<string, number> = { ...base.caps };
    for (let march = 1; march <= HORIZON; march += 1) {
      const request: StackRequest = { ...base, caps: { ...stock } };
      const step = planCampaign({ request, marchTarget: 1 });
      const counts = (step.recommend ?? step).counts;
      const { summary } = marchResult(base, counts);
      totalB += summary.avgDamage;
      if (march <= 2 || march === HORIZON) report.add(line(counts, `#${n(march)}`));
      for (const id of MERC_IDS) {
        const fielded = counts[id] ?? 0;
        stock[id] = Math.max(0, (stock[id] ?? 0) - chunks(fielded));
      }
    }
    report.add(`| **total** | | **${n(totalB)}** | |`);

    // ---- C: one march, every mercenary pushed to the stock ------------------------------------------
    report.h('C. One march: what pushing every mercenary to the full stock pays');
    report.add(
      'The owner’s own claim is *"we surely want all mercs, it gets better damage"*. Tested on the **first ' +
        'march of B**, which is the best single march the engine can build on this stock, by raising one ' +
        'hired type at a time to everything the account holds and replaying the real battle.',
    );
    report.add(
      `\n| variant | ${MERC_IDS.join(' | ')} | damage | vs B#1 | strikes |\n|${'---|'.repeat(MERC_IDS.length + 3)}`,
    );
    const first = (() => {
      const step = planCampaign({ request: { ...base, caps: { ...base.caps } }, marchTarget: 1 });
      return (step.recommend ?? step).counts;
    })();
    const firstDamage = marchResult(base, first).summary.avgDamage;
    report.add(line(first, 'B#1 as planned'));
    for (const id of MERC_IDS) {
      const counts = { ...first, [id]: base.caps[id] ?? 0 };
      report.add(line(counts, `B#1 + every ${id.replace('-6', '')}`));
    }
    report.add(
      line(
        { ...first, ...Object.fromEntries(MERC_IDS.map((id) => [id, base.caps[id] ?? 0])) },
        'B#1 + every mercenary',
      ),
    );
    report.add(`\n(B#1 as planned is ${n(firstDamage)} damage.)`);

    report.h('The comparison');
    report.add(
      `| strategy | ${n(HORIZON)}-march total | vs A |\n|---|---|---|\n` +
        `| **A — the plan’s constant march** | ${n(totalA)} | — |\n` +
        `| **B — field everything, re-planned each march** | ${n(totalB)} | ` +
        `${totalB >= totalA ? '+' : ''}${n(totalB - totalA)} (${(((totalB - totalA) / Math.max(1, totalA)) * 100).toFixed(1)} %) |`,
    );
    report.add(
      `\nWhat the gap is: A fields ${n((chosen.counts['epic-monster-hunter-6'] ?? 0) * (chosen.marches - 1))} ` +
        `epic monster hunters over its ${n(chosen.marches - 1)} repeats, because a constant count has to ` +
        `survive all of them; B fields ${n(
          MERC_IDS.reduce((sum, id) => sum + (chosen.counts[id] ?? 0), 0),
        )} in its first march alone and then whatever is left, because its horizon is the next march.`,
    );

    report.save();
  });
});
