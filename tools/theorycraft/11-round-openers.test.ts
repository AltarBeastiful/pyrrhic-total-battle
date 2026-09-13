/**
 * A2 — which type belongs at the round-opening kill positions.
 *
 * With N = 4 enemy squads the stack at kill position p ≡ 1 (mod 4) is wiped by the *first* attack of its
 * round and never strikes in it: `expectedHits` gives it `ceil(p/4) − 1` hits instead of `ceil(p/4)`.
 * Positions 1, 5, 9, 13 therefore each cost one hit of whatever stack sits there. This file measures that
 * cost on the four bases and then permutes the troop block of the HP ladder to move the cheapest per-hit
 * stack onto those positions.
 *
 * Method. The troop ladder for a given order is produced by the repo's own sizer, `sizeStacks` with
 * `method: 'custom'` and `customOrder` = the wanted order (the flat profile with the RANK_SPREAD ladder,
 * exact leadership fill). The mercenaries are then sized by the M's-Preservation rule at authority 2,000,
 * where the caps bind and the ceiling is the lowest troop stack: `count = min(cap, floor(ceiling / hp))`
 * for every mercenary. That reimplementation is validated inside the report: for the sizer's own order the
 * identity permutation reproduces `sizeStacks`' M's-Preservation march exactly (Δ avg = 0). Every count
 * vector is checked with `feasible` and scored with `evaluateCounts`.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/11-round-openers.test.ts`
 */
import { describe, it } from 'vitest';

import { enemySquadCount, expectedHits } from '../../src/engine/battle';
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
  sizeStacks,
  withMethod,
  withUnits,
} from './harness';

const MERCS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'];
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

/** Leadership counts of the flat ladder the sizer builds for `order` (first-to-die first). */
function troopLadder(request: StackRequest, order: string[]): Record<string, number> {
  const sized = sizeStacks({
    ...request,
    options: { ...request.options, method: 'custom', relaxedPreservation: false, customOrder: order },
  });
  const counts: Record<string, number> = {};
  for (const stack of sized.stacks) if (stack.pool === 'leadership') counts[stack.unitId] = stack.count;
  return counts;
}

/**
 * The M's-Preservation mercenary block: one ceiling (lowest troop stack − 1) for every stack, each taken as
 * large as the cap and the ceiling allow. At authority 2,000 this is exactly what `sizeStacks` produces.
 */
function mercFlat(request: StackRequest, ids: string[], ceiling: number): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of ids) {
    const unit = request.units.find((candidate) => candidate.id === id);
    if (!unit) continue;
    const hp = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents).hpPerUnit;
    counts[id] = Math.max(0, Math.min(request.caps[id] ?? Number.MAX_SAFE_INTEGER, Math.floor(ceiling / hp)));
  }
  return counts;
}

function floorOf(request: StackRequest, counts: Record<string, number>): number {
  let lowest = Number.MAX_SAFE_INTEGER;
  for (const unit of request.units) {
    const count = counts[unit.id] ?? 0;
    if (unit.pool !== 'leadership' || count <= 0) continue;
    const hp = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents).hpPerUnit;
    lowest = Math.min(lowest, count * hp);
  }
  return lowest;
}

describe.skipIf(!process.env.THEORY)('A2 round openers', () => {
  it('permutes the HP ladder', () => {
    const report = new Report('11-round-openers');
    const owner = loadOwner();
    report.add('# A2 — which type sits at the round-opening kill positions');
    report.add('');
    report.add(
      'With N = 4 the closed form is `hits(p) = ceil(p/4) − (p ≡ 1 mod 4 ? 1 : 0)`, +1 at p = 1 army-first. ' +
        'So p = 1, 5, 9, 13 each lose exactly one hit of the stack that sits there, and the loss is that ' +
        "stack's whole per-hit damage. The question is which type to put there. Mercenary ladder: " +
        "`count = min(cap, floor(ceiling / hpPerUnit))`, ceiling = lowest troop stack − 1 (the M's-Preservation " +
        'rule at authority 2,000, where the caps 92/76/72/37 bind; the identity row below reproduces the ' +
        'sizer exactly, Δ avg = 0, which validates the reimplementation). ' +
        "Troop ladder: the repo sizer, `sizeStacks` with `method: 'custom'` and the wanted `customOrder`.",
    );

    report.h('0. The openers today');
    const openers = [
      '| scenario | base | method | p=1 | p=5 | p=9 | hits lost | damage lost to the openers |',
      '|---|---|---|---|---|---|---|---|',
    ];
    for (const [scenario, make] of [
      ['A', (r: StackRequest) => r],
      ['B', scenarioB],
    ] as const) {
      for (const base of BASES) {
        for (const method of ['elite', 'ms', 'msRelaxed'] as const) {
          const request = make(withMethod(withUnits(owner.twelve, [...base.troops, ...MERCS]), method));
          const evaluation = evaluate(request);
          const stacks = evaluation.result.stacks;
          const N = enemySquadCount(request.enemy);
          let lost = 0;
          let count = 0;
          const at: string[] = [];
          stacks.forEach((stack, index) => {
            const position = index + 1;
            if ((position - 1) % N !== 0) return;
            count += 1;
            lost += stack.damagePerHit;
            at.push(`${label(stack.unitId)} (${n(stack.damagePerHit)})`);
          });
          openers.push(
            `| ${scenario} | ${base.key} | ${method} | ${at[0] ?? '—'} | ${at[1] ?? '—'} | ${at[2] ?? '—'} | ${count} | ${n(lost)} |`,
          );
        }
      }
    }
    report.add(openers.join('\n'));
    report.add('');
    report.add(
      'Read it as the price list of the ladder: whatever sits at p = 1 never strikes (enemy first), and ' +
        'whatever sits at p = 5 strikes once instead of twice.',
    );

    const summary = [
      '| scenario | base | ms baseline avg | best troop order | best avg | gain | worst order | worst avg |',
      '|---|---|---|---|---|---|---|---|',
    ];

    for (const [scenario, make] of [
      ['A', (r: StackRequest) => r],
      ['B', scenarioB],
    ] as const) {
      for (const base of BASES) {
        const request = make(withMethod(withUnits(owner.twelve, [...base.troops, ...MERCS]), 'ms'));
        const baseline = evaluate(request);
        const baselineCounts = countsOf(baseline.result);
        report.h(
          `${scenario} · ${base.key} · troop-order permutations (mercenaries in the sizer's own order)`,
        );
        report.add(
          `M's Preservation baseline: ${march(baseline.result)} — avg ${n(baseline.summary.avgDamage)}`,
        );
        report.add('');
        // The mercenary order the sizer itself uses (Elite ranking), so only the troop block moves.
        const mercOrder = baseline.result.stacks
          .filter((stack) => stack.pool === 'authority')
          .map((stack) => stack.unitId);

        const rows = [
          '| troop order (first to die first) | counts | p=1 | p=5 | min | avg | max | Δ avg |',
          '|---|---|---|---|---|---|---|---|',
        ];
        const scored: { order: string[]; avg: number; counts: Record<string, number> }[] = [];
        for (const order of permutations(base.troops)) {
          const troops = troopLadder(request, [...order, ...mercOrder]);
          const ceiling = floorOf(request, troops) - 1;
          const counts = { ...troops, ...mercFlat(request, mercOrder, ceiling) };
          if (!feasible(request, counts)) continue;
          const evaluation = evaluateCounts(request, counts);
          scored.push({ order, avg: evaluation.summary.avgDamage, counts });
          const stacks = evaluation.result.stacks;
          rows.push(
            `| ${order.map(label).join(' → ')} | ${march(evaluation.result)} | ${label(stacks[0]?.unitId ?? '')} | ${label(stacks[4]?.unitId ?? '')} | ${n(evaluation.summary.minDamage)} | ${n(evaluation.summary.avgDamage)} | ${n(evaluation.summary.maxDamage)} | ${n(evaluation.summary.avgDamage - baseline.summary.avgDamage)} |`,
          );
        }
        scored.sort((a, b) => b.avg - a.avg);
        report.add(rows.join('\n'));
        report.add('');
        const best = scored[0];
        const worst = scored.at(-1);
        report.add(
          `best ${best?.order.map(label).join(' → ') ?? '—'} at ${n(best?.avg ?? 0)}; worst ${worst?.order.map(label).join(' → ') ?? '—'} at ${n(worst?.avg ?? 0)}; spread ${n((best?.avg ?? 0) - (worst?.avg ?? 0))}`,
        );
        summary.push(
          `| ${scenario} | ${base.key} | ${n(baseline.summary.avgDamage)} | ${best?.order.map(label).join(' → ') ?? '—'} | ${n(best?.avg ?? 0)} | ${n((best?.avg ?? 0) - baseline.summary.avgDamage)} | ${worst?.order.map(label).join(' → ') ?? '—'} | ${n(worst?.avg ?? 0)} |`,
        );

        // Does putting the top base-damage stack at position 1 make "your army first" worth anything?
        const openerRows = [
          '| troop order | stack at p=1 | top base damage | min | max | army-first gain |',
          '|---|---|---|---|---|---|',
        ];
        for (const entry of scored.slice(0, 6)) {
          const evaluation = evaluateCounts(request, entry.counts);
          const stacks = evaluation.result.stacks;
          const top = stacks.reduce((a, b) =>
            b.count * b.strengthPerUnit > a.count * a.strengthPerUnit ? b : a,
          );
          openerRows.push(
            `| ${entry.order.map(label).join(' → ')} | ${label(stacks[0]?.unitId ?? '')} | ${label(top.unitId)} | ${n(evaluation.summary.minDamage)} | ${n(evaluation.summary.maxDamage)} | ${n(evaluation.summary.maxDamage - evaluation.summary.minDamage)} |`,
          );
        }
        report.add('');
        report.add('Army-first opening attack (the six best orders):');
        report.add(openerRows.join('\n'));
        report.add('');
        report.add(
          'The opening attack is one extra army action inserted before the first enemy attack; it is worth a ' +
            'hit only when the stack that takes it (highest base damage) would otherwise have been wiped ' +
            'before striking, or when the shift lets one more stack act in round 1.',
        );
        void baselineCounts;
      }
    }

    report.h('Summary');
    report.add(summary.join('\n'));
    report.add('');
    report.add(
      `Closed form for reference: ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => `p${p} ${expectedHits(p, 4, false)}/${expectedHits(p, 4, true)}`).join(' · ')} (enemy-first / army-first, N = 4).`,
    );
    report.save();
  }, 1_800_000);
});
