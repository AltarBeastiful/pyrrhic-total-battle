/**
 * A3 — the order among the mercenaries.
 *
 * Under M's Preservation every mercenary stack sits below the lowest troop stack, so the four of them fill
 * the bottom of the kill order. With N = 4 and T troop stacks the mercenary at kill position p ≡ 1 (mod 4)
 * loses a hit, and the mercenary at the very bottom gets the most hits. Which mercenary takes which slot is
 * decided by total HP, i.e. by the counts — so it is ours to choose.
 *
 * Method. The troop block is the sizer's own M's-Preservation ladder (`evaluate`, method `ms`), held fixed.
 * For each of the 24 orders of (EMH6, ABT6, LGN6, CHR6) the mercenary block is the **maximum strictly
 * descending ladder** for that order: `count = min(cap, floor(limit / hp))`, `limit` starting at the lowest
 * troop stack − 1 and dropping to that stack's own total HP − 1 for the next one. Each vector is checked
 * with `feasible` and scored with `evaluateCounts`; the best is then refined by a ±12-unit hill climb on the
 * mercenary counts alone.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/12-merc-order.test.ts`
 */
import { describe, it } from 'vitest';

import { effectiveUnit } from '../../src/engine/units';
import type { StackRequest } from '../../src/engine/types';
import {
  Report,
  countsOf,
  evaluate,
  evaluateCounts,
  feasible,
  label,
  loadOwner,
  march,
  n,
  scenarioB,
  withMethod,
  withUnits,
} from './harness';

const EMH = 'epic-monster-hunter-6';
const ABT = 'arbalester-6';
const LGN = 'legionary-6';
const CHR = 'chariot-6';
const MERCS = [EMH, ABT, LGN, CHR];
const BASES = [
  { key: 'E8', troops: ['swordsman-1', 'spearman-2', 'rider-2', 'rider-3'] },
  { key: 'K7', troops: ['archer-2', 'rider-2', 'rider-3'] },
  { key: 'K8', troops: ['archer-2', 'spearman-2', 'rider-2', 'rider-3'] },
];

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  items.forEach((item, index) => {
    const rest = [...items.slice(0, index), ...items.slice(index + 1)];
    for (const tail of permutations(rest)) out.push([item, ...tail]);
  });
  return out;
}

function hpOf(request: StackRequest, id: string): number {
  const unit = request.units.find((candidate) => candidate.id === id);
  if (!unit) return 0;
  return effectiveUnit(unit, request.totals, request.enemy, request.activeEvents).hpPerUnit;
}

/** Maximum strictly descending mercenary ladder for `order` (first to die first). */
function mercLadder(request: StackRequest, order: string[], ceiling: number): Record<string, number> {
  const counts: Record<string, number> = {};
  let limit = ceiling;
  for (const id of order) {
    const hp = hpOf(request, id);
    const count = Math.max(0, Math.min(request.caps[id] ?? Number.MAX_SAFE_INTEGER, Math.floor(limit / hp)));
    counts[id] = count;
    limit = Math.min(limit, count * hp - 1);
  }
  return counts;
}

/** Hill climb on the mercenary counts only, ±`span` units at a time. */
function refine(
  request: StackRequest,
  start: Record<string, number>,
  span = 12,
): { counts: Record<string, number>; gain: number } {
  let counts = { ...start };
  let best = evaluateCounts(request, counts).summary.avgDamage;
  const base = best;
  for (let round = 0; round < 25; round += 1) {
    let chosen: Record<string, number> | undefined;
    for (const id of MERCS) {
      for (let delta = -span; delta <= span; delta += 1) {
        if (delta === 0) continue;
        const next = (counts[id] ?? 0) + delta;
        if (next < 0) continue;
        const candidate = { ...counts, [id]: next };
        if (!feasible(request, candidate)) continue;
        const avg = evaluateCounts(request, candidate).summary.avgDamage;
        if (avg > best + 0.5) {
          best = avg;
          chosen = candidate;
        }
      }
    }
    if (!chosen) break;
    counts = chosen;
  }
  return { counts, gain: best - base };
}

describe.skipIf(!process.env.THEORY)('A3 mercenary order', () => {
  it('permutes the mercenary block', () => {
    const report = new Report('12-merc-order');
    const owner = loadOwner();
    report.add('# A3 — the order among the mercenaries');
    report.add('');
    report.add(
      "The four mercenary stacks share the bottom of the kill order under M's Preservation. The one with the " +
        'highest HP among them dies first, and if its kill position is ≡ 1 (mod 4) it loses a hit. Per-hit ' +
        'damage differs by a factor of two between them, so the order is worth money. Method: troops fixed at ' +
        "the sizer's `ms` ladder; for each of the 24 mercenary orders the maximum strictly descending ladder " +
        '(`count = min(cap, floor(limit / hp))`, `limit` cascading); every vector checked with `feasible`, ' +
        'scored with `evaluateCounts`; the best refined by a ±12-unit hill climb on the mercenary counts.',
    );

    report.h('0. What one mercenary unit is worth');
    const sheet = [
      '| scenario | merc | cost | HP/unit | damage/unit | damage per authority | cap | cap HP |',
      '|---|---|---|---|---|---|---|---|',
    ];
    for (const [scenario, make] of [
      ['A', (r: StackRequest) => r],
      ['B', scenarioB],
    ] as const) {
      const request = make(withUnits(owner.twelve, MERCS));
      for (const unit of request.units) {
        const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
        const perUnit = evaluateCounts(request, { [unit.id]: 1 }).result.stacks[0]?.damagePerHit ?? 0;
        const cap = request.caps[unit.id] ?? 0;
        sheet.push(
          `| ${scenario} | ${unit.label} | ${unit.cost} | ${n(effective.hpPerUnit)} | ${n(perUnit)} | ${n(Math.round(perUnit / unit.cost))} | ${cap} | ${n(cap * effective.hpPerUnit)} |`,
        );
      }
    }
    report.add(sheet.join('\n'));
    report.add('');
    report.add(
      'Per-hit ranking is EMH6 > ABT6 > CHR6 > LGN6 in both scenarios, and the weakest per unit is always LGN6.',
    );

    const summary = [
      '| scenario | base | ms baseline avg | best merc order (first to die first) | best avg | gain | after refine | total gain |',
      '|---|---|---|---|---|---|---|---|',
    ];

    for (const [scenario, make] of [
      ['A', (r: StackRequest) => r],
      ['B', scenarioB],
    ] as const) {
      for (const base of BASES) {
        const request = make(withMethod(withUnits(owner.twelve, [...base.troops, ...MERCS]), 'ms'));
        const baseline = evaluate(request);
        const troops: Record<string, number> = {};
        for (const stack of baseline.result.stacks)
          if (stack.pool === 'leadership') troops[stack.unitId] = stack.count;
        const ceiling =
          Math.min(
            ...baseline.result.stacks
              .filter((stack) => stack.pool === 'leadership')
              .map((stack) => stack.totalHp),
          ) - 1;

        report.h(
          `${scenario} · ${base.key} · 24 mercenary orders (troops fixed: ${Object.entries(troops)
            .map(([id, count]) => `${label(id)} ${n(count)}`)
            .join(' · ')}, floor ${n(ceiling + 1)})`,
        );
        report.add(
          `M's Preservation baseline: ${march(baseline.result)} — avg ${n(baseline.summary.avgDamage)}`,
        );
        report.add('');
        const rows = [
          '| order | counts (kill order) | positions of EMH6/ABT6 | hits of the four | min | avg | max | Δ avg |',
          '|---|---|---|---|---|---|---|---|',
        ];
        const scored: { order: string[]; avg: number; counts: Record<string, number> }[] = [];
        for (const order of permutations(MERCS)) {
          const counts = { ...troops, ...mercLadder(request, order, ceiling) };
          if (!feasible(request, counts)) continue;
          const evaluation = evaluateCounts(request, counts);
          scored.push({ order, avg: evaluation.summary.avgDamage, counts });
          const stacks = evaluation.result.stacks;
          const positionOf = (id: string): number => stacks.findIndex((stack) => stack.unitId === id) + 1;
          const hits = stacks
            .map((stack, index) => ({ stack, index }))
            .filter((entry) => entry.stack.pool === 'authority')
            .map(
              (entry) =>
                `${label(entry.stack.unitId)} ${evaluation.summary.journals.enemyFirst.entries.filter((line) => line.actor === 'army' && line.unitId === entry.stack.unitId).length}`,
            )
            .join(' ');
          rows.push(
            `| ${order.map(label).join(' → ')} | ${march(evaluation.result)} | ${positionOf('epic-monster-hunter-6')}/${positionOf('arbalester-6')} | ${hits} | ${n(evaluation.summary.minDamage)} | ${n(evaluation.summary.avgDamage)} | ${n(evaluation.summary.maxDamage)} | ${n(evaluation.summary.avgDamage - baseline.summary.avgDamage)} |`,
          );
        }
        scored.sort((a, b) => b.avg - a.avg);
        report.add(rows.join('\n'));
        report.add('');
        const best = scored[0];
        const worst = scored.at(-1);
        const refined = best ? refine(request, best.counts) : { counts: {}, gain: 0 };
        const after = evaluateCounts(request, refined.counts);
        report.add(
          `best order **${best?.order.map(label).join(' → ') ?? '—'}** at avg ${n(best?.avg ?? 0)} ` +
            `(Δ ${n((best?.avg ?? 0) - baseline.summary.avgDamage)} against the sizer); worst ${worst?.order.map(label).join(' → ') ?? '—'} at ${n(worst?.avg ?? 0)}; spread ${n((best?.avg ?? 0) - (worst?.avg ?? 0))}`,
        );
        report.add('');
        report.add(
          `after the ±12 refine: ${march(after.result)} — avg ${n(after.summary.avgDamage)} (+${n(refined.gain)} on the ladder, Δ ${n(after.summary.avgDamage - baseline.summary.avgDamage)} against the sizer)`,
        );
        // The hand estimate to verify: LGN6 at its cap on top of the block, then ABT6, then EMH6 lowest.
        const hand = scored.find((entry) => entry.order.join() === [LGN, ABT, EMH, CHR].join());
        if (hand) {
          const evaluation = evaluateCounts(request, hand.counts);
          report.add('');
          report.add(
            `hand estimate "LGN6 on top at its cap, EMH6 and ABT6 lowest": ${march(evaluation.result)} — ` +
              `avg ${n(evaluation.summary.avgDamage)}, Δ ${n(evaluation.summary.avgDamage - baseline.summary.avgDamage)} against the sizer ` +
              `(the best order, ${best?.order.map(label).join(' → ') ?? '—'}, beats it by ${n((best?.avg ?? 0) - hand.avg)}; ` +
              `at their caps the four stacks weigh EMH6 ${n((request.caps[EMH] ?? 0) * hpOf(request, EMH))}, ABT6 ${n((request.caps[ABT] ?? 0) * hpOf(request, ABT))}, ` +
              `CHR6 ${n((request.caps[CHR] ?? 0) * hpOf(request, CHR))}, LGN6 ${n((request.caps[LGN] ?? 0) * hpOf(request, LGN))} HP, which is what decides how far each one can be pushed down).`,
          );
        }
        summary.push(
          `| ${scenario} | ${base.key} | ${n(baseline.summary.avgDamage)} | ${best?.order.map(label).join(' → ') ?? '—'} | ${n(best?.avg ?? 0)} | ${n((best?.avg ?? 0) - baseline.summary.avgDamage)} | ${n(after.summary.avgDamage)} | ${n(after.summary.avgDamage - baseline.summary.avgDamage)} |`,
        );
        void countsOf;
      }
    }

    report.h('Summary');
    report.add(summary.join('\n'));
    report.save();
  }, 1_800_000);
});
