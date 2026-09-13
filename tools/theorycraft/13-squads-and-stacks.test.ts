/**
 * A4 — the number of enemy squads and the number of stacks.
 *
 * The whole hit schedule is arithmetic mod N (N = number of enemy squads). A stack at kill position p
 * lives `r = ceil(p / N)` rounds and strikes `r` times, minus one when `p ≡ 1 (mod N)` — it is then the
 * victim of its round's opening attack and dies before its turn. Army-first adds one action at p = 1.
 * So every stack we own is worth `hits(p) × damagePerHit`, and both factors are ours to move: `p` by the
 * HP ladder, `hits` by N (the enemy) and by how many stacks stand in front.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/13-squads-and-stacks.test.ts`
 */
import { describe, it } from 'vitest';

import { expectedHits } from '../../src/engine/battle';
import { effectiveUnit } from '../../src/engine/units';
import type { StackRequest } from '../../src/engine/types';
import {
  Report,
  countsOf,
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
  withEnemy,
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

const FORMATIONS = [
  {
    key: 'N=3',
    enemy: { melee: 1, ranged: 1, mounted: 1 },
    note: 'no flying squad — ARC2/ABT6 retarget to melee, so per-hit damage moves too',
  },
  { key: 'N=4', enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 }, note: "the export's own formation" },
  {
    key: 'N=8',
    enemy: { melee: 2, ranged: 2, mounted: 2, flying: 2 },
    note: "Arachne's-size formation, same categories as N=4 so per-hit damage is identical",
  },
];

function hpOf(request: StackRequest, id: string): number {
  const unit = request.units.find((candidate) => candidate.id === id);
  if (!unit) return 0;
  return effectiveUnit(unit, request.totals, request.enemy, request.activeEvents).hpPerUnit;
}

describe.skipIf(!process.env.THEORY)('A4 squads and stacks', () => {
  it('measures N and the stack count', () => {
    const report = new Report('13-squads-and-stacks');
    const owner = loadOwner();
    report.add('# A4 — enemy squads (N) and total stack count');
    report.add('');
    report.add(
      'Closed form (`src/engine/battle.ts`, `expectedHits`): a stack at kill position p with N enemy squads ' +
        'lives `r = ceil(p / N)` rounds; its rank inside its own round is `slot = p − (r − 1)·N`; it strikes ' +
        '`r` times, or `r − 1` when `slot = 1` (p ≡ 1 mod N), plus one more at p = 1 when the army strikes ' +
        'first. Everything below is that arithmetic, checked against the simulated journals.',
    );

    report.h('0. The arithmetic, explicitly');
    const grid = ['| p | p mod 4 | N=3 | N=4 | N=8 |', '|---|---|---|---|---|'];
    for (let p = 1; p <= 16; p += 1) {
      grid.push(
        `| ${p} | ${p % 4} | ${expectedHits(p, 3, false)}/${expectedHits(p, 3, true)} | ${expectedHits(p, 4, false)}/${expectedHits(p, 4, true)} | ${expectedHits(p, 8, false)}/${expectedHits(p, 8, true)} |`,
      );
    }
    report.add(grid.join('\n'));
    report.add('');
    const totals = [
      '| stacks S | Σ hits N=3 | Σ hits N=4 | Σ hits N=8 | Δ from S−1 (N=4) |',
      '|---|---|---|---|---|',
    ];
    const sum = (S: number, N: number): number => {
      let total = 0;
      for (let p = 1; p <= S; p += 1) total += expectedHits(p, N, false);
      return total;
    };
    for (let S = 1; S <= 14; S += 1) {
      totals.push(`| ${S} | ${sum(S, 3)} | ${sum(S, 4)} | ${sum(S, 8)} | +${sum(S, 4) - sum(S - 1, 4)} |`);
    }
    report.add(totals.join('\n'));
    report.add('');
    report.add(
      'Reading of the N = 4 column: **every added stack is worth `ceil(S/4)` hits if `S ≢ 1 (mod 4)` and ' +
        '`ceil(S/4) − 1` if it is** — i.e. a new 9th stack behind everything else brings 2 hits, a 10th 3, an ' +
        '11th 3, a 12th 3, a 13th 3 again (13 ≡ 1). Adding a stack **in front** of the mercenaries instead ' +
        'pushes each of them one position later, which is worth one extra hit to every mercenary that crosses ' +
        'a `p ≡ 1 (mod 4)` boundary.',
    );

    // ---- 1. the actual marches under N = 3, 4, 8 ----------------------------------------------------
    report.h("1. The account's marches under N = 3, 4 and 8");
    const nSummary = [
      '| scenario | base | method | N=3 min/avg/max | N=4 min/avg/max | N=8 min/avg/max | N=8 ÷ N=4 |',
      '|---|---|---|---|---|---|---|',
    ];
    for (const [scenario, make] of [
      ['A', (r: StackRequest) => r],
      ['B', scenarioB],
    ] as const) {
      for (const baseSpec of BASES) {
        for (const method of ['ms', 'msRelaxed', 'elite'] as const) {
          const cells: string[] = [];
          let atFour = 0;
          let atEight = 0;
          for (const formation of FORMATIONS) {
            const request = withEnemy(
              make(withMethod(withUnits(owner.twelve, [...baseSpec.troops, ...MERCS]), method)),
              formation.enemy,
            );
            const evaluation = evaluate(request);
            if (formation.key === 'N=4') atFour = evaluation.summary.avgDamage;
            if (formation.key === 'N=8') atEight = evaluation.summary.avgDamage;
            cells.push(
              `${n(evaluation.summary.minDamage)} / ${n(evaluation.summary.avgDamage)} / ${n(evaluation.summary.maxDamage)}`,
            );
            if (method === 'ms' && baseSpec.key === 'E8') {
              report.add('');
              report.add(
                `**${scenario} · ${baseSpec.key} · ${method} · ${formation.key}** (${formation.note}) — ${march(evaluation.result)}`,
              );
              const table = [
                '| # | stack | per hit | hits sim | hits form | damage |',
                '|---|---|---|---|---|---|',
              ];
              const N = Object.values(formation.enemy).reduce((total, value) => total + value, 0);
              for (const row of lines(evaluation)) {
                table.push(
                  `| ${row.position} | ${row.label} | ${n(row.damagePerHit)} | ${row.hitsEnemyFirst}/${row.hitsArmyFirst} | ${expectedHits(row.position, N, false)}/${expectedHits(row.position, N, true)} | ${n(row.damageEnemyFirst)} |`,
                );
              }
              report.add(table.join('\n'));
            }
          }
          nSummary.push(
            `| ${scenario} | ${baseSpec.key} | ${method} | ${cells[0]} | ${cells[1]} | ${cells[2]} | ${(atEight / atFour).toFixed(3)} |`,
          );
        }
      }
    }
    report.add('');
    report.add(nSummary.join('\n'));

    // ---- 2. one more stack at the end ---------------------------------------------------------------
    report.h('2. One more stack at the end (behind the mercenaries)');
    report.add(
      "A stack whose total HP is below every mercenary stack sits last and changes nobody else's position: it " +
        "is pure addition, `hits(S+1) × damagePerHit`, paid for out of leadership taken from the march's " +
        'biggest troop stack (position 1, the one that never strikes). The tail type is one the march leaves ' +
        'out; its size is scanned from one unit up to the largest that still stays under the smallest ' +
        'mercenary stack, and the best size is reported. Note the ceiling: at a troop floor of 275,931 a tail ' +
        'stack just under it already eats 1,740 of the 4,343 leadership, so the interesting sizes are small.',
    );
    const tail = [
      '| scenario | base | tail type | best units | tail HP | leadership moved | position | hits | avg | Δ total | Δ from the shrink alone | Δ from the tail itself | Δ at 1 unit |',
      '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
    ];
    for (const [scenario, make] of [
      ['A', (r: StackRequest) => r],
      ['B', scenarioB],
    ] as const) {
      for (const baseSpec of BASES) {
        const spare = ALL_TROOPS.filter((id) => !baseSpec.troops.includes(id));
        const baseRequest = make(withMethod(withUnits(owner.twelve, [...baseSpec.troops, ...MERCS]), 'ms'));
        const baseline = evaluate(baseRequest);
        const counts = countsOf(baseline.result);
        const smallestMerc = Math.min(
          ...baseline.result.stacks
            .filter((stack) => stack.pool === 'authority')
            .map((stack) => stack.totalHp),
        );
        const biggest = baseline.result.stacks[0];
        if (!biggest) continue;
        for (const extra of spare) {
          const request = make(
            withMethod(withUnits(owner.twelve, [...baseSpec.troops, extra, ...MERCS]), 'ms'),
          );
          const hp = hpOf(request, extra);
          const unit = request.units.find((candidate) => candidate.id === extra);
          const biggestUnit = request.units.find((candidate) => candidate.id === biggest.unitId);
          const maxUnits = Math.max(1, Math.ceil(smallestMerc / hp) - 1);
          let best: { units: number; avg: number; evaluation: ReturnType<typeof evaluateCounts> } | undefined;
          let atOne = 0;
          let atMax = 0;
          for (const units of [
            ...new Set([
              1,
              2,
              3,
              5,
              8,
              12,
              20,
              30,
              50,
              75,
              100,
              150,
              200,
              300,
              400,
              600,
              800,
              1200,
              1700,
              maxUnits,
            ]),
          ]) {
            if (units > maxUnits || units < 1) continue;
            const moved = units * (unit?.cost ?? 1);
            const shrink = Math.ceil(moved / (biggestUnit?.cost ?? 1));
            const next = {
              ...counts,
              [extra]: units,
              [biggest.unitId]: (counts[biggest.unitId] ?? 0) - shrink,
            };
            if (next[biggest.unitId]! < 0 || !feasible(request, next)) continue;
            const evaluation = evaluateCounts(request, next);
            const delta = evaluation.summary.avgDamage - baseline.summary.avgDamage;
            if (units === 1) atOne = delta;
            if (units === maxUnits) atMax = delta;
            if (!best || evaluation.summary.avgDamage > best.avg)
              best = { units, avg: evaluation.summary.avgDamage, evaluation };
          }
          if (!best) continue;
          const row = lines(best.evaluation).find((line) => line.unitId === extra);
          // Control: spend the same leadership on nothing, so the tail's own contribution is isolated.
          const shrinkOnly = Math.ceil((best.units * (unit?.cost ?? 1)) / (biggestUnit?.cost ?? 1));
          const control = evaluateCounts(request, {
            ...counts,
            [extra]: 0,
            [biggest.unitId]: (counts[biggest.unitId] ?? 0) - shrinkOnly,
          }).summary.avgDamage;
          tail.push(
            `| ${scenario} | ${baseSpec.key} | ${label(extra)} | ${n(best.units)} | ${n(best.units * hp)} | ${best.units * (unit?.cost ?? 1)} | ${row?.position ?? '?'} | ${row?.hitsEnemyFirst ?? 0}/${row?.hitsArmyFirst ?? 0} | ${n(best.avg)} | ${n(best.avg - baseline.summary.avgDamage)} | ${n(control - baseline.summary.avgDamage)} | ${n(best.avg - control)} | ${n(atOne)} |`,
          );
          void atMax;
        }
      }
    }
    report.add(tail.join('\n'));

    // ---- 3. one more troop stack in front of the mercenaries ---------------------------------------
    report.h('3. One more troop stack in front of the mercenaries');
    report.add(
      'Here the sizer re-solves the whole leadership ladder over one extra type, so the troop floor drops and ' +
        'with it the mercenary ceiling — the trade is "one more hit for every mercenary that crosses a ' +
        'p ≡ 1 (mod 4) boundary" against "smaller mercenary stacks".',
    );
    const front = [
      '| scenario | base | added type | stacks | troop floor before → after | merc authority before → after | avg before | avg after | Δ |',
      '|---|---|---|---|---|---|---|---|---|',
    ];
    for (const [scenario, make] of [
      ['A', (r: StackRequest) => r],
      ['B', scenarioB],
    ] as const) {
      for (const baseSpec of BASES) {
        const baseRequest = make(withMethod(withUnits(owner.twelve, [...baseSpec.troops, ...MERCS]), 'ms'));
        const baseline = evaluate(baseRequest);
        const floorBefore = Math.min(
          ...baseline.result.stacks
            .filter((stack) => stack.pool === 'leadership')
            .map((stack) => stack.totalHp),
        );
        const authorityBefore = baseline.result.pools.authority.used;
        for (const extra of ALL_TROOPS.filter((id) => !baseSpec.troops.includes(id))) {
          const request = make(
            withMethod(withUnits(owner.twelve, [...baseSpec.troops, extra, ...MERCS]), 'ms'),
          );
          const evaluation = evaluate(request);
          const floorAfter = Math.min(
            ...evaluation.result.stacks
              .filter((stack) => stack.pool === 'leadership')
              .map((stack) => stack.totalHp),
          );
          front.push(
            `| ${scenario} | ${baseSpec.key} | ${label(extra)} | ${baseline.result.stacks.length} → ${evaluation.result.stacks.length} | ${n(floorBefore)} → ${n(floorAfter)} | ${authorityBefore} → ${evaluation.result.pools.authority.used} | ${n(baseline.summary.avgDamage)} | ${n(evaluation.summary.avgDamage)} | ${n(evaluation.summary.avgDamage - baseline.summary.avgDamage)} |`,
          );
        }
      }
    }
    report.add(front.join('\n'));
    void sizeStacks;
    report.save();
  }, 1_800_000);
});
