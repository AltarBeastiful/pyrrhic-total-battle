/**
 * 133 — **does the reliable-damage reading condemn an unshielded march?** (W4, S-126, 2026-09-22; the owner,
 * answering the shelter question: *"1. but check first that damage reading will keep us from proposing this
 * in the complete optimization"*.)
 *
 * The shelter (`shelterUnder`, S-87) lowers every hired stack under the lowest troop rung, so the enemy —
 * which always destroys the **highest-HP living stack** — reaches the troops first and the hired stacks
 * strike for longer. Take it away and the hired stacks stand on top, which means they are killed **first**;
 * and on the worst opening a stack at kill position 1 strikes **zero** times (`battle.ts`, `expectedHits`).
 *
 * So the owner's question is the right one and it is not rhetorical: a march that fields fourteen times the
 * hired stock might still be *worse* on the reading the plan is actually ranked on (S-94, the enemy-first
 * journal), because the stock it fields is exactly the stock that dies before it swings. **If the worst
 * opening condemns it, it must not be offered**, however good its average looks.
 *
 * Measured on the owner's live camp of 2026-09-18 — the −77.9 % army, and the one where the gap between what
 * the sizer fields (103 chunks a march, the whole 2 180 authority) and what the bar offers (25) is widest.
 * Every march below is built through the benchmark's own scenario and priced by `simulateBattle`, so the
 * damage column is the same arithmetic the bar is ranked on.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/133-the-unshielded-march.test.ts`
 */
import { describe, it } from 'vitest';

import { simulateBattle } from '../../src/engine/battle';
import { buildKillOrder } from '../../src/engine/killOrder';
import { chunks } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import type { Stack, StackRequest, StackResult } from '../../src/engine/types';
import { effectiveUnit, hitDamage } from '../../src/engine/units';
import { ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

/** A march from explicit counts, in the kill order the game uses, priced as the recap prices it. */
function marchOf(request: StackRequest, counts: Record<string, number>): StackResult {
  const rank = new Map(buildKillOrder(request.units, request.options).map((id, index) => [id, index]));
  const stacks: Stack[] = [];
  for (const unit of request.units) {
    const count = Math.floor(counts[unit.id] ?? 0);
    if (count <= 0) continue;
    const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
    const { damage, features } = hitDamage(effective, count);
    stacks.push({
      unitId: unit.id,
      pool: unit.pool,
      count,
      hpPerUnit: effective.hpPerUnit,
      totalHp: count * effective.hpPerUnit,
      strengthPerUnit: effective.strengthPerUnit,
      target: effective.target,
      damagePerHit: damage,
      featuresDamage: features,
      doubleDamageChance: effective.doubleDamageChance,
      strikeTwoSquadsChance: effective.strikeTwoSquadsChance,
    });
  }
  stacks.sort((a, b) => b.totalHp - a.totalHp || (rank.get(a.unitId) ?? 0) - (rank.get(b.unitId) ?? 0));
  return {
    stacks,
    pools: {
      leadership: { used: 0, capacity: request.housing.leadership },
      authority: { used: 0, capacity: request.housing.authority },
      dominance: { used: 0, capacity: request.housing.dominance },
    },
    dropped: [],
    warnings: [],
  };
}

/** The shelter, restated here exactly as `plan.ts` applies it, so the two marches differ by it alone. */
function sheltered(request: StackRequest, counts: Record<string, number>): Record<string, number> {
  const hp = new Map(
    request.units.map((unit) => [
      unit.id,
      effectiveUnit(unit, request.totals, request.enemy, request.activeEvents).hpPerUnit,
    ]),
  );
  const troopHp = request.units
    .filter((unit) => unit.pool === 'leadership' && (counts[unit.id] ?? 0) > 0)
    .map((unit) => (counts[unit.id] ?? 0) * (hp.get(unit.id) ?? 0));
  if (troopHp.length === 0) return counts;
  const floor = Math.min(...troopHp);
  const out = { ...counts };
  for (const unit of request.units) {
    if (unit.pool === 'leadership') continue;
    const count = out[unit.id] ?? 0;
    const each = hp.get(unit.id) ?? 0;
    if (count <= 0 || each <= 0 || count * each < floor) continue;
    out[unit.id] = Math.max(0, Math.ceil(floor / each) - 1);
  }
  return out;
}

describe.skipIf(!process.env.THEORY)('the unshielded march on the live camp', () => {
  it('prices it on the reading the bar is ranked on', () => {
    const profile = ownerProfile();
    if (!profile) throw new Error('no owner export');
    const scenario = ownerScenarios(profile).find((one) => one.label.includes('live camp of 2026-09-18'));
    if (!scenario) throw new Error('no live camp');
    const request = scenario.request;
    const report = new Report('133-the-unshielded-march');
    report.add('# 133 — does the worst opening condemn an unshielded march?\n');
    report.add(
      'The owner, 2026-09-22, agreeing to an unshielded stop *"but check first that damage reading will ' +
        'keep us from proposing this"*. The plan is ranked on the **worst opening** since S-94 — the ' +
        'enemy-first journal, where the enemy destroys the highest-HP living stack each attack. An ' +
        'unshielded march stands its hired stacks on **top**, so they are the ones destroyed first, and a ' +
        'stack killed at position 1 strikes **zero** times. This asks whether the stock it fields survives ' +
        'long enough to pay for itself on that reading.\n',
    );

    /** The sizer's own march under Tier ladder: what the app answers today, unshielded. */
    const sizerCounts = Object.fromEntries(
      sizeStacks({ ...request, options: { ...request.options, method: 'elite' } }).stacks.map((s) => [
        s.unitId,
        s.count,
      ]),
    );
    const shelteredCounts = sheltered(request, sizerCounts);
    const rows: string[] = [
      '| march | troop types | hired chunks | **worst opening** | expected | best | silver | gold |',
      '|---|---|---|---|---|---|---|---|',
    ];
    const hiredIds = request.units.filter((u) => u.pool !== 'leadership').map((u) => u.id);
    const price = (name: string, counts: Record<string, number>): void => {
      const result = marchOf(request, counts);
      const summary = simulateBattle(result, request);
      const burn = hiredIds.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0);
      const troops = request.units.filter((u) => u.pool === 'leadership' && (counts[u.id] ?? 0) > 0).length;
      rows.push(
        `| ${name} | ${String(troops)} | ${String(burn)} | **${n(summary.minDamage)}** | ` +
          `${n(summary.avgDamage)} | ${n(summary.maxDamage)} | ${n(summary.recovery.silver)} | ` +
          `${n(summary.recovery.gold)} |`,
      );
    };
    price('**unshielded** — the sizer’s own march (`elite`)', sizerCounts);
    price('the same vector **sheltered**, as the plan would lower it', shelteredCounts);
    report.add('\n' + rows.join('\n'));

    // And the thing the owner is actually asking about: do the hired stacks on top ever swing?
    const result = marchOf(request, sizerCounts);
    const summary = simulateBattle(result, request);
    const struck = new Map<string, number>();
    for (const entry of summary.journals.enemyFirst.entries) {
      if (entry.actor !== 'army') continue;
      struck.set(entry.unitId, (struck.get(entry.unitId) ?? 0) + entry.damage);
    }
    const order: string[] = [
      '',
      '## The kill order of the unshielded march, and who actually swings',
      '',
      'Kill position 1 is destroyed by the enemy’s first attack. The **worst opening** column above is the ' +
        'sum of the `dealt` column here.',
      '',
      '| kill position | stack | count | total HP | strikes (enemy first) | dealt |',
      '|---|---|---|---|---|---|',
    ];
    result.stacks.forEach((stack, index) => {
      const hits = summary.journals.enemyFirst.entries.find(
        (e) => e.actor === 'army' && e.unitId === stack.unitId,
      );
      order.push(
        `| ${String(index + 1)} | ${stack.unitId}${stack.pool === 'leadership' ? '' : ' **(hired)**'} | ` +
          `${n(stack.count)} | ${n(stack.totalHp)} | ${String(hits?.hits ?? 0)} | ` +
          `${n(struck.get(stack.unitId) ?? 0)} |`,
      );
    });
    report.add(order.join('\n'));

    /**
     * **B — the sizer's unshielded march wastes more than half the pool.** The bear stack is the tallest
     * thing on the field, so the enemy destroys it first and it strikes **zero** times on the worst opening
     * — 58 bears at 21 authority each is **1 218 of the 2 180** pool spent on a stack that deals nothing.
     * That was the hypothesis, and **the sweep below refutes it.** The bear is not waste, it is the
     * **sponge**: it is tall enough to be destroyed first *instead of* the legionaries, which is what lets
     * the two stacks that do the hitting survive to hit. Drop it and `legionary-6` inherits the top of the
     * kill order and dies for nothing — 13,209,210 falls to 7,898,932. One bear is not enough either
     * (8,065,252): at 94,380 HP it sits under the troop floor and never takes the first kill. The sizer
     * sized the stack at 58 bears — 5,474,040 HP against the legionaries' 5,464,989 — which is the smallest
     * stack that out-HPs them. It already solves this, and the unshielded stop should field **the sizer's
     * own march**, not a hand-built one. (Experiment 101 §A found the same thing on a different army: a
     * hired stack on top is the best sponge.)
     */
    const cost = new Map(request.units.map((unit) => [unit.id, unit.cost]));
    const troopOnly = Object.fromEntries(
      Object.entries(sizerCounts).filter(
        ([id]) => request.units.find((unit) => unit.id === id)?.pool === 'leadership',
      ),
    );
    const spend = (hired: Record<string, number>): number =>
      Object.entries(hired).reduce((sum, [id, count]) => sum + count * (cost.get(id) ?? 0), 0);
    const variants: [string, Record<string, number>][] = [
      [
        'the sizer’s own (bear 58 · legionary 477 · arbalester 485)',
        { 'bear-5': 58, 'legionary-6': 477, 'arbalester-6': 485 },
      ],
      ['**no bear** — legionary 1 002 · arbalester 485', { 'legionary-6': 1002, 'arbalester-6': 485 }],
      ['no bear, legionary 693 · arbalester 485', { 'legionary-6': 693, 'arbalester-6': 485 }],
      ['legionary alone, 1 002', { 'legionary-6': 1002 }],
      ['arbalester alone, 485', { 'arbalester-6': 485 }],
      [
        'one bear as the sponge — bear 1 · legionary 1 002 · arbalester 485',
        { 'bear-5': 1, 'legionary-6': 1002, 'arbalester-6': 485 },
      ],
    ];
    const bRows: string[] = [
      '',
      '## B — which unshielded vector the stop should actually field',
      '',
      'Every row keeps the sizer’s own seven troop stacks and changes only the hired side. `authority` is of ' +
        `**${n(request.housing.authority)}**. The kill order puts the tallest stack first, so a row that ` +
        'spends the pool on one enormous stack is spending it on the stack that dies before it swings.',
      '',
      '| hired vector | authority | chunks | **worst opening** | silver | gold | dies first, for nothing |',
      '|---|---|---|---|---|---|---|',
    ];
    for (const [name, hired] of variants) {
      const counts = { ...troopOnly, ...hired };
      const result2 = marchOf(request, counts);
      const summary2 = simulateBattle(result2, request);
      const burn = hiredIds.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0);
      const first = result2.stacks[0];
      const firstHits =
        summary2.journals.enemyFirst.entries.find((e) => e.actor === 'army' && e.unitId === first?.unitId)
          ?.hits ?? 0;
      const wasted =
        first && firstHits === 0
          ? `${first.unitId} (${n(first.count * (cost.get(first.unitId) ?? 0))} authority)`
          : '—';
      bRows.push(
        `| ${name} | ${n(spend(hired))} | ${String(burn)} | **${n(summary2.minDamage)}** | ` +
          `${n(summary2.recovery.silver)} | ${n(summary2.recovery.gold)} | ${wasted} |`,
      );
    }
    report.add(bRows.join('\n'));
    report.add(
      `\n*(For scale: \`TotalStack · Total Optimization\` on this army is **49,229,801** over four marches ` +
        `for 7,794,000 silver and 374 chunks, and the bar's best stop today is **15,306,859** for 9,849,200 ` +
        `and 52. The rows above are **one** march.)*\n`,
    );
    report.save();
  }, 600_000);
});
