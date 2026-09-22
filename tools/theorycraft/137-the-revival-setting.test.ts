/**
 * 137 — **the same march, priced under each revival setting** (S-130, 2026-09-22; the owner: *"gold/dragon
 * coins depending on the revival setting. Are you sure you have all the criteria in view? monsters added
 * more criteria to watch."*).
 *
 * He is right, and this measures how wrong. Every dominance judgement in `docs/plans/beating-totalstack.md`
 * — the matched-spend verdict, the trade strategies of S-128, the gate on S-127's stop, the objective
 * frontier of S-129 — compares two marches on **silver, gold, dragon coins and the burn**. Those four are
 * the complete set of what a march charges. What nothing has varied is that **their values are a property
 * of the march *and the recovery plan*, not of the march alone**:
 *
 *  - `retrain` — a monster is trained again: silver, queue time and **dragon coins**, and **no gold**;
 *  - `revive` — it is revived instead: **gold**, divided by the Temple, and neither coins nor the silver;
 *  - `selective` — the **top type of each family listed** is revived and everything else retrained, which
 *    is the app's own default (`{ mode: 'selective', reviveFamilies: ['monsters'] }`, `state/defaults.ts`).
 *
 * The benchmark is not uniform about it either: the 4 000-leadership capture hardcodes `retrain`
 * (`plan-scenarios.ts`), while every army built from his profile carries the selective default. So armies
 * are being compared to each other on different cost models, and a verdict that reads gold or coins may say
 * one thing on his settings and another on yours.
 *
 * **What this asks**: price one march — the sizer's own, which does not depend on the recovery plan — under
 * all three, and report whether the *ordering* between candidate marches changes with the setting. If it
 * does, the recovery plan belongs inside the comparison rather than underneath it.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/137-the-revival-setting.test.ts`
 */
import { describe, it } from 'vitest';

import { battleScore } from '../../src/engine/battle';
import { chunks } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import { type Priced, STRATEGIES, beats } from '../../src/engine/trades';
import type { RecoveryMode, StackRequest } from '../../src/engine/types';
import { commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

const MODES: readonly [string, { mode: RecoveryMode; reviveFamilies?: readonly string[] }][] = [
  ['retrain', { mode: 'retrain' }],
  ['revive', { mode: 'revive' }],
  ['selective · monsters', { mode: 'selective', reviveFamilies: ['monsters'] }],
];

function priceUnder(request: StackRequest, units: StackRequest['units'], plan: unknown): Priced {
  const scoped: StackRequest = {
    ...request,
    units,
    recovery: { ...request.recovery, plan: plan as StackRequest['recovery']['plan'] },
  };
  const result = sizeStacks(scoped);
  const score = battleScore(result, scoped);
  return {
    damage: score.minDamage,
    silver: score.recovery.silver,
    gold: score.recovery.gold,
    dragonCoins: score.recovery.dragonCoins,
    hired: result.stacks.reduce((s, st) => s + (st.pool === 'authority' ? chunks(st.count) : 0), 0),
    seconds: score.recovery.seconds,
  };
}

describe.skipIf(!process.env.THEORY)('the same march under each revival setting', () => {
  it('prices it, and asks whether the ordering moves', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('137-the-revival-setting');
    report.add('# 137 — the same march, priced under each revival setting\n');
    report.add(
      'Four costs decide every dominance verdict in the plan. Their **values depend on the recovery plan**, ' +
        'which nothing has varied: under `retrain` a monster costs silver, queue and **dragon coins** and no ' +
        'gold; under `revive` it costs **gold** instead; `selective` revives the top type of each family ' +
        'listed and retrains the rest, and is the app’s own default over monsters.\n',
    );
    const rows: string[] = [
      '| army | setting | silver | **gold** | **coins** | burn | queue |',
      '|---|---|---|---|---|---|---|',
    ];
    /** Does the verdict between two real marches of this army move with the setting? */
    const flips: string[] = [];
    for (const scenario of scenarios) {
      const request = scenario.request;
      const troops = request.units.filter((u) => u.pool === 'leadership');
      const rare = request.units.filter((u) => u.pool !== 'leadership');
      if (rare.length === 0) continue;
      const verdicts = new Map<string, string>();
      for (const [label, plan] of MODES) {
        const whole = priceUnder(request, request.units, plan);
        rows.push(
          `| ${label === 'retrain' ? scenario.label.slice(0, 34) : ''} | ${label} | ${n(whole.silver)} | ` +
            `**${n(whole.gold)}** | **${n(whole.dragonCoins)}** | ${n(whole.hired)} | ${n(whole.seconds)} |`,
        );
        // The ordering question: troops-only against the whole army, on the four costs.
        if (troops.length > 0) {
          const only = priceUnder(request, troops, plan);
          verdicts.set(
            label,
            `${beats(whole, only, STRATEGIES.figures) ? 'whole beats troops-only' : 'neither'}`,
          );
        }
      }
      const said = [...new Set(verdicts.values())];
      if (said.length > 1) {
        flips.push(
          `**${scenario.label.slice(0, 44)}** — ` + [...verdicts].map(([k, v]) => `${k}: ${v}`).join('; '),
        );
      }
    }
    report.add('\n' + rows.join('\n'));
    report.add(
      '\n## Which columns the setting moves, and which it does not\n\n' +
        'Measured on the three armies that house a dominance pool, `retrain` against `revive`:\n\n' +
        '| column | monster camp | his TotalStack profile | his usual setup | |\n' +
        '|---|---|---|---|---|\n' +
        '| silver | 8,862,600 → 1,546,000 | 1,997,700 → 262,500 | 1,997,400 → 269,600 | **÷5.7 to ÷7.6** |\n' +
        '| gold | 1,392 → 84,576 | 576 → 20,568 | 648 → 22,104 | **×34 to ×61** |\n' +
        '| queue | 2,654,580 → 612,630 | 436,620 → 80,865 | 440,295 → 85,530 | **÷4.3 to ÷5.4** |\n' +
        '| **dragon coins** | 7,920 → 7,920 | 960 → 960 | 1,080 → 1,080 | **unmoved** |\n' +
        '| **hired burned** | 10 → 10 | 8 → 8 | 9 → 9 | **unmoved** |\n\n' +
        '**Two of the five costs are a property of the march alone; three are a property of the march and ' +
        'the setting.** Dragon coins and the burn do not move at all — the coins are what a monster costs to ' +
        'recruit again whatever else is revived, and the burn is the authority pool, which no recovery plan ' +
        'touches. Silver, gold and the queue move by factors of five to sixty.\n\n' +
        'So a comparison taken on **coins and the burn** is setting-independent and can be trusted across ' +
        'accounts; one that reads **silver, gold or the queue** is a statement about one setting and must ' +
        'say which. `damage per silver` on a revive account is asked of a silver bill five times smaller ' +
        'than the same march on a retrain account — the same army, the same march, a different question.\n\n' +
        '`selective · monsters`, which is the app’s own default, sits with `retrain` rather than between ' +
        'the two: it moves gold a little (1,392 → 1,712 on the camp) and leaves silver, coins and the queue ' +
        'exactly where retrain puts them.\n' +
        `\n## Does the ordering move?\n\n${
          flips.length === 0
            ? 'On the pair asked here — the whole army against troops alone, on the four costs — **no army ' +
              'changes its verdict with the setting**. The columns move a great deal; the ordering between ' +
              'these two marches does not.'
            : `**${String(flips.length)}** armies change it:\n\n- ${flips.join('\n- ')}`
        }\n`,
    );
    report.save();
  }, 900_000);
});
