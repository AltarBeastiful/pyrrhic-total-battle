/**
 * 136 — **what the ratio objectives actually answer, and what they leave on the field** (S-129, 2026-09-22;
 * the owner, returning the session to where it started: *"tier ladder/troops first with objective dmg/silver
 * made unplayable tradeoff, never shielding anything and just bringing out mercs because they cost no
 * silver … should we just add a small rule to those 2 algorithms like checks merc lost tradeoffs?"*).
 *
 * **The defect is in the objective, not in either sizer.** `objectiveScore` scores a march on **one
 * resource**: `damagePerSilver` is `avgDamage / recovery.silver`, and a mercenary costs **gold and stock**,
 * not silver. Troops are the only thing on the field that costs silver at all. So the ratio's true optimum
 * is *"field no troops"* — not a bug in the search, which finds it correctly, but a question whose honest
 * answer is unplayable. Measured on his own camp on 2026-09-21 (experiment 128): `searchPriority` under
 * `damagePerSilver` answered **0 troop types, 0 of 5 600 leadership**, 776 837 damage for 173 600 silver —
 * a ratio of 5.845 where the whole army manages 0.848.
 *
 * **The hypothesis this file tests**, and it needs no constant if it holds: the troopless answer is beaten
 * on *stock* by the march that keeps its troops. Troops cost leadership, and **leadership is not burn** —
 * `mercLost` counts the authority pool alone (S-102) — so adding every troop the army holds costs the player
 * **nothing in the rare resource** and adds damage. If that is true, the rule the owner asked for is already
 * written: `trades.ts`'s `stock` reading, *at least the damage for at most the burn*, applied to the
 * search's own candidates.
 *
 * Reported per army and per objective: what the search answers today, what the whole army answers, and
 * whether the second beats the first on stock alone.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/136-what-the-objectives-cost.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { simulateBattle } from '../../src/engine/battle';
import { chunks } from '../../src/engine/recovery';
import { searchPriority } from '../../src/engine/search';
import { sizeStacks } from '../../src/engine/stacker';
import type { Priced } from '../../src/engine/trades';
import { STRATEGIES, beats } from '../../src/engine/trades';
import type { Objective, StackRequest, StackResult } from '../../src/engine/types';
import { commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

const OBJECTIVES: readonly [Objective, string][] = [
  ['avgDamage', 'average damage'],
  ['minDamage', 'best worst case'],
  ['damagePerSilver', 'damage per silver'],
  ['damagePerGold', 'damage per gold'],
  ['damagePerDragonCoin', 'damage per dragon coin'],
];

function priced(request: StackRequest, result: StackResult): Priced & { troops: number } {
  const summary = simulateBattle(result, request);
  const counts = Object.fromEntries(result.stacks.map((s) => [s.unitId, s.count]));
  return {
    damage: summary.minDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    dragonCoins: summary.recovery.dragonCoins,
    hired: request.units
      .filter((unit) => unit.pool === 'authority')
      .reduce((sum, unit) => sum + chunks(counts[unit.id] ?? 0), 0),
    seconds: summary.recovery.seconds,
    troops: request.units.filter((unit) => unit.pool === 'leadership' && (counts[unit.id] ?? 0) > 0).length,
  };
}

describe.skipIf(!process.env.THEORY)('what the ratio objectives leave on the field', () => {
  it('asks every objective of every army, and whether the whole army beats it on stock', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('136-what-the-objectives-cost');
    report.add('# 136 — what the ratio objectives answer, and what the whole army would have answered\n');
    report.add(
      '`objectiveScore` scores a march on **one resource**. A mercenary costs gold and stock, never silver, ' +
        'and troops are the only thing on the field that costs silver — so *"best damage per silver"* asked ' +
        'without a floor has an honest answer of **field no troops**, and the search finds it correctly.\n',
    );
    report.add(
      '**Troops are free in the rare resource.** `mercLost` counts the authority pool alone (S-102), so ' +
        'leadership spent is not burn. The last column asks whether the whole army — every type the account ' +
        'holds, sized — beats the search’s own answer on `trades.ts`’s **stock** reading: *at least ' +
        'the damage for at most the burn*. Where it does, the answer the player is given is one another ' +
        'march beats without costing them a single extra chunk.\n',
    );
    const rows: string[] = [
      '| army | objective | troops | damage | silver | burn | whole army: troops | damage | burn | beaten on stock? |',
      '|---|---|---|---|---|---|---|---|---|---|',
    ];
    let beatenCount = 0;
    let troopless = 0;
    let total = 0;
    for (const scenario of scenarios) {
      const request = scenario.request;
      const whole = priced(request, sizeStacks(request));
      for (const [objective, words] of OBJECTIVES) {
        const found = searchPriority({
          request,
          objective,
          budgetMs: CAMPAIGN.budgets.search,
        });
        const mine = priced(request, found.result);
        const isBeaten = beats(whole, mine, STRATEGIES.stock);
        total += 1;
        if (isBeaten) beatenCount += 1;
        if (mine.troops === 0) troopless += 1;
        rows.push(
          `| ${objective === 'avgDamage' ? scenario.label.slice(0, 34) : ''} | ${words} | ` +
            `${mine.troops === 0 ? '**none**' : String(mine.troops)} | ${n(mine.damage)} | ${n(mine.silver)} | ` +
            `${n(mine.hired)} | ${String(whole.troops)} | ${n(whole.damage)} | ${n(whole.hired)} | ` +
            `${isBeaten ? '**yes**' : 'no'} |`,
        );
      }
    }
    report.add('\n' + rows.join('\n'));
    report.add(
      `\n## The standing\n\n**${n(beatenCount)} of ${n(total)}** answers the search gives are beaten by the ` +
        'whole army on stock alone — more damage, and not one extra chunk of the rare resource. ' +
        `**${n(troopless)}** of them field no troops at all.\n\nWhere the answer is beaten, the rule the ` +
        'owner asked for costs nothing to state and needs no constant: refuse a selection another selection ' +
        'beats on *at least the damage for at most the burn*. Where it is **not** beaten, the search is ' +
        'trading real stock for real damage and the player should keep the choice.\n',
    );
    report.save();
  }, 900_000);
});
