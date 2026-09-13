/**
 * A6 — a sacrificial front stack.
 *
 * The stack at kill position 1 is wiped by the very first enemy attack and (enemy first) never strikes. If
 * we put a stack there on purpose, every other stack moves one position later, and each of them crosses a
 * `p ≡ 1 (mod 4)` boundary at most once — worth one extra hit to whoever crosses it. The question is
 * whether the leadership or the mercenary stock the sacrifice consumes is worth those hits.
 *
 * Method.
 *   - **Troop sacrifice.** The remaining troops are re-sized by the repo sizer over `4,343 − cost(X)`
 *     leadership (`sizeStacks` with a reduced `housing.leadership`); the sacrificial type X is then given
 *     just enough units to top the ladder. The mercenaries are re-sized under the new, lower troop floor
 *     (`count = min(cap, floor((floor − 1) / hp))`, the M's-Preservation rule at authority 2,000).
 *   - **Mercenary sacrifice.** One mercenary type is grown until its stack tops the troop ladder; the other
 *     three stay under the floor. Authority is free at 2,000, so this costs only that mercenary's own hits.
 * Every vector is checked with `feasible` and scored with `evaluateCounts`.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/15-sacrificial-front.test.ts`
 */
import { describe, it } from 'vitest';

import { effectiveUnit } from '../../src/engine/units';
import type { StackRequest } from '../../src/engine/types';
import {
  Report,
  evaluate,
  evaluateCounts,
  feasible,
  label,
  lines,
  loadOwner,
  march,
  n,
  scenarioB,
  sizeStacks,
  withHousing,
  withMethod,
  withUnits,
} from './harness';

const MERCS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'];
const ALL_TROOPS = [
  'swordsman-1',
  'archer-1',
  'spearman-1',
  'rider-1',
  'archer-2',
  'spearman-2',
  'rider-2',
  'rider-3',
];
const BASES = [
  { key: 'E8', troops: ['swordsman-1', 'spearman-2', 'rider-2', 'rider-3'] },
  { key: 'K7', troops: ['archer-2', 'rider-2', 'rider-3'] },
  { key: 'K8', troops: ['archer-2', 'spearman-2', 'rider-2', 'rider-3'] },
];

function hpOf(request: StackRequest, id: string): number {
  const unit = request.units.find((candidate) => candidate.id === id);
  if (!unit) return 0;
  return effectiveUnit(unit, request.totals, request.enemy, request.activeEvents).hpPerUnit;
}

function costOf(request: StackRequest, id: string): number {
  return request.units.find((candidate) => candidate.id === id)?.cost ?? 1;
}

/** Mercenary block under a troop floor: every stack as big as the cap and the floor allow. */
function mercsUnder(request: StackRequest, floor: number): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of MERCS) {
    counts[id] = Math.max(0, Math.min(request.caps[id] ?? 0, Math.floor((floor - 1) / hpOf(request, id))));
  }
  return counts;
}

describe.skipIf(!process.env.THEORY)('A6 sacrificial front stack', () => {
  it('prices the first victim', () => {
    const report = new Report('15-sacrificial-front');
    const owner = loadOwner();
    report.add('# A6 — does a sacrificial front stack pay for itself?');
    report.add('');
    report.add(
      'Position 1 never strikes when the enemy goes first, and position p ≡ 1 (mod 4) always loses one hit. ' +
        'Inserting a stack at the top shifts every other stack from p to p + 1, so a stack gains a hit ' +
        'exactly when p + 1 is not ≡ 1 (mod 4) while p was — i.e. when it was sitting on an opener. With ' +
        '4 enemy squads and 7–9 stacks there are two openers (p = 1 and p = 5), so at most two stacks gain ' +
        'a hit, and the sacrifice itself loses everything it would have done.',
    );

    const summary = [
      '| scenario | base | sacrifice | pool | units | sacrifice HP | stacks | troop floor after | merc authority | avg | Δ vs baseline |',
      '|---|---|---|---|---|---|---|---|---|---|---|',
    ];

    for (const [scenario, make] of [
      ['A', (r: StackRequest) => r],
      ['B', scenarioB],
    ] as const) {
      for (const baseSpec of BASES) {
        const baseRequest = make(withMethod(withUnits(owner.twelve, [...baseSpec.troops, ...MERCS]), 'ms'));
        const baseline = evaluate(baseRequest);
        const topHp = baseline.result.stacks[0]?.totalHp ?? 0;
        const floorBefore = Math.min(
          ...baseline.result.stacks
            .filter((stack) => stack.pool === 'leadership')
            .map((stack) => stack.totalHp),
        );
        report.h(`${scenario} · ${baseSpec.key}`);
        report.add(
          `baseline (M's Preservation): ${march(baseline.result)} — avg ${n(baseline.summary.avgDamage)}; top stack ${n(topHp)} HP, troop floor ${n(floorBefore)}`,
        );
        report.add('');
        summary.push(
          `| ${scenario} | ${baseSpec.key} | — (baseline) | — | — | — | ${baseline.result.stacks.length} | ${n(floorBefore)} | ${baseline.result.pools.authority.used} | ${n(baseline.summary.avgDamage)} | 0 |`,
        );

        const table = [
          '| sacrifice | pool | units | HP | leadership left for the other troops | troop floor | merc authority | still on an opener | min | avg | max | Δ |',
          '|---|---|---|---|---|---|---|---|---|---|---|---|',
        ];

        // ---- troop sacrifice ------------------------------------------------------------------------
        for (const extra of ALL_TROOPS.filter((id) => !baseSpec.troops.includes(id))) {
          const request = make(
            withMethod(withUnits(owner.twelve, [...baseSpec.troops, extra, ...MERCS]), 'ms'),
          );
          const hp = hpOf(request, extra);
          const cost = costOf(request, extra);
          let best: { units: number; avg: number; counts: Record<string, number> } | undefined;
          // Sweep the size of the sacrifice: it must top the ladder, so its own HP and the leadership it
          // leaves to the others both move. The sizer re-solves the rest at the reduced budget.
          for (let units = 1; units * cost <= owner.twelve.housing.leadership; units += 1) {
            const spend = units * cost;
            const rest = sizeStacks(
              withHousing(make(withMethod(withUnits(owner.twelve, baseSpec.troops), 'ms')), {
                leadership: owner.twelve.housing.leadership - spend,
              }),
            );
            const restTop = Math.max(...rest.stacks.map((stack) => stack.totalHp), 0);
            if (units * hp <= restTop) continue; // not yet the first victim
            const counts: Record<string, number> = { [extra]: units };
            let floor = Number.MAX_SAFE_INTEGER;
            for (const stack of rest.stacks) {
              counts[stack.unitId] = stack.count;
              floor = Math.min(floor, stack.totalHp);
            }
            Object.assign(counts, mercsUnder(request, floor));
            if (!feasible(request, counts)) continue;
            const evaluation = evaluateCounts(request, counts);
            if (!best || evaluation.summary.avgDamage > best.avg)
              best = { units, avg: evaluation.summary.avgDamage, counts };
            // Once the sacrifice tops the ladder, growing it only costs; a short overshoot is enough.
            if (units * hp > restTop * 1.6) break;
          }
          if (!best) continue;
          const evaluation = evaluateCounts(request, best.counts);
          const gained = lines(evaluation)
            .filter((row) => row.position > 1)
            .filter((row) => (row.position - 1) % 4 === 0)
            .map((row) => `${row.label}@${row.position}`)
            .join(' ');
          const floorAfter = Math.min(
            ...evaluation.result.stacks
              .filter((stack) => stack.pool === 'leadership' && stack.unitId !== extra)
              .map((stack) => stack.totalHp),
          );
          table.push(
            `| ${label(extra)} | leadership | ${n(best.units)} | ${n(best.units * hp)} | ${n(owner.twelve.housing.leadership - best.units * cost)} | ${n(floorAfter)} | ${evaluation.result.pools.authority.used} | ${gained} | ${n(evaluation.summary.minDamage)} | ${n(evaluation.summary.avgDamage)} | ${n(evaluation.summary.maxDamage)} | ${n(evaluation.summary.avgDamage - baseline.summary.avgDamage)} |`,
          );
          summary.push(
            `| ${scenario} | ${baseSpec.key} | ${label(extra)} | leadership | ${n(best.units)} | ${n(best.units * hp)} | ${evaluation.result.stacks.length} | ${n(floorAfter)} | ${evaluation.result.pools.authority.used} | ${n(evaluation.summary.avgDamage)} | ${n(evaluation.summary.avgDamage - baseline.summary.avgDamage)} |`,
          );
        }

        // ---- mercenary sacrifice ---------------------------------------------------------------------
        for (const sacrifice of MERCS) {
          const request = baseRequest;
          const hp = hpOf(request, sacrifice);
          const cap = request.caps[sacrifice] ?? 0;
          const needed = Math.floor(topHp / hp) + 1;
          if (needed > cap) {
            table.push(
              `| ${label(sacrifice)} | authority | — | — | — | — | — | needs ${n(needed)} units but the cap is ${cap} | — | — | — | — |`,
            );
            continue;
          }
          let best: { units: number; avg: number; counts: Record<string, number> } | undefined;
          for (let units = needed; units <= cap; units += 1) {
            const counts: Record<string, number> = {};
            for (const stack of baseline.result.stacks)
              if (stack.pool === 'leadership') counts[stack.unitId] = stack.count;
            Object.assign(counts, mercsUnder(request, floorBefore));
            counts[sacrifice] = units;
            if (!feasible(request, counts)) continue;
            const evaluation = evaluateCounts(request, counts);
            if (!best || evaluation.summary.avgDamage > best.avg)
              best = { units, avg: evaluation.summary.avgDamage, counts };
          }
          if (!best) continue;
          const evaluation = evaluateCounts(request, best.counts);
          const gained = lines(evaluation)
            .filter((row) => row.position > 1 && (row.position - 1) % 4 === 0)
            .map((row) => `${row.label}@${row.position}`)
            .join(' ');
          table.push(
            `| ${label(sacrifice)} | authority | ${n(best.units)} | ${n(best.units * hp)} | ${n(owner.twelve.housing.leadership)} | ${n(floorBefore)} | ${evaluation.result.pools.authority.used} | ${gained} | ${n(evaluation.summary.minDamage)} | ${n(evaluation.summary.avgDamage)} | ${n(evaluation.summary.maxDamage)} | ${n(evaluation.summary.avgDamage - baseline.summary.avgDamage)} |`,
          );
          summary.push(
            `| ${scenario} | ${baseSpec.key} | ${label(sacrifice)} | authority | ${n(best.units)} | ${n(best.units * hp)} | ${evaluation.result.stacks.length} | ${n(floorBefore)} | ${evaluation.result.pools.authority.used} | ${n(evaluation.summary.avgDamage)} | ${n(evaluation.summary.avgDamage - baseline.summary.avgDamage)} |`,
          );
        }
        report.add(table.join('\n'));
      }
    }

    report.h('Summary');
    report.add(summary.join('\n'));
    report.add('');
    report.add(
      'The "still on an opener" column lists the stacks that sit at p ≡ 1 (mod 4) *after* the shift — those ' +
        'are the ones the sacrifice did **not** save. A sacrifice pays only when the stacks it moves off the ' +
        'openers are worth more per hit than everything the sacrifice itself gives up.',
    );
    report.save();
  }, 3_600_000);
});
