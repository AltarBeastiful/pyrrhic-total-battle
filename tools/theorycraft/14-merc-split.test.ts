/**
 * A5 — exhaustive mercenary split, and how many mercenaries a march can field.
 *
 * At authority 2,000 the pool never binds: the four caps (EMH6 92, ABT6 76, LGN6 72, CHR6 37 — 314
 * authority in all) do, and so does the kill order. A mercenary stack bigger than the smallest troop stack
 * climbs above the troops and dies early, which is the real budget. This file enumerates **every** count
 * vector (e, a, l, c) inside the caps, scores each one with `evaluateCounts`, and reports:
 *
 *   §1 how the troop floor moves when a march fields fewer troop types, and what fits under it;
 *   §2 the exhaustive top 10 inside the caps (no ordering constraint);
 *   §3 the exhaustive top 10 with every mercenary stack strictly below the smallest troop stack;
 *   §4 the best vector with every count a multiple of ten (the Temple revives 90 %: a fielded count n loses
 *      ceil(n/10) units for good, so 41 loses as many as 50);
 *   §5 dropping LGN6 (three stacks) and dropping two types;
 *   §6 the comparison with what the sizer itself answers.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/14-merc-split.test.ts`
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
  loadOwner,
  march,
  n,
  scenarioB,
  sizeStacks,
  withMethod,
  withUnits,
} from './harness';

const EMH = 'epic-monster-hunter-6';
const ABT = 'arbalester-6';
const LGN = 'legionary-6';
const CHR = 'chariot-6';
const MERCS = [EMH, ABT, LGN, CHR];
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

interface Best {
  counts: Record<string, number>;
  avg: number;
  min: number;
  max: number;
  line: string;
}

function keep(list: Best[], entry: Best, size: number): void {
  if (list.length >= size && entry.avg <= (list.at(-1)?.avg ?? 0)) return;
  list.push(entry);
  list.sort((a, b) => b.avg - a.avg);
  if (list.length > size) list.length = size;
}

function nonZero(...values: number[]): number {
  let count = 0;
  for (const value of values) if (value > 0) count += 1;
  return count;
}

function hpOf(request: StackRequest, id: string): number {
  const unit = request.units.find((candidate) => candidate.id === id);
  if (!unit) return 0;
  return effectiveUnit(unit, request.totals, request.enemy, request.activeEvents).hpPerUnit;
}

/** Leadership counts the sizer produces for `ids` at full leadership, and the resulting floor. */
function troopBlock(request: StackRequest, ids: string[]): { counts: Record<string, number>; floor: number } {
  const sized = sizeStacks(withMethod(withUnits(request, ids), 'ms'));
  const counts: Record<string, number> = {};
  let floor = Number.MAX_SAFE_INTEGER;
  for (const stack of sized.stacks) {
    if (stack.pool !== 'leadership') continue;
    counts[stack.unitId] = stack.count;
    floor = Math.min(floor, stack.totalHp);
  }
  return { counts, floor };
}

function rows(list: Best[], header: string): string {
  const out = [`| # | ${header} | authority | min | avg | max |`, '|---|---|---|---|---|---|'];
  list.forEach((entry, index) => {
    out.push(
      `| ${index + 1} | ${entry.line} | ${entry.counts[EMH]! + entry.counts[ABT]! + entry.counts[LGN]! + 2 * entry.counts[CHR]!} | ${n(entry.min)} | ${n(entry.avg)} | ${n(entry.max)} |`,
    );
  });
  return out.join('\n');
}

describe.skipIf(!process.env.THEORY)('A5 mercenary split', () => {
  it('enumerates every mercenary vector inside the caps', () => {
    const report = new Report('14-merc-split');
    const owner = loadOwner();
    report.add('# A5 — exhaustive mercenary split');
    report.add('');
    report.add(
      'Authority is 2,000, so the pool never binds: the caps do (EMH6 92, ABT6 76, LGN6 72, CHR6 37 = 314 ' +
        'authority at full stock) and so does the kill order — a mercenary stack heavier than the smallest ' +
        'troop stack climbs above the troops and is wiped early. Every vector below is an explicit count ' +
        'vector scored with `evaluateCounts` on the repo engine; the troop stacks are frozen at what ' +
        "`sizeStacks` gives them at full leadership under M's Preservation. Enumeration is exhaustive over " +
        '`0 ≤ e ≤ 92, 0 ≤ a ≤ 76, 0 ≤ l ≤ 72, 0 ≤ c ≤ 37` — 19,868,214 vectors per scenario and base.',
    );

    // ---- §1 the troop floor knob -------------------------------------------------------------------
    report.h('1. How many mercenaries fall after the troops — the troop floor');
    report.add(
      'For a subset of troop types the sizer spends the whole 4,343 leadership on a flat ladder; the smallest ' +
        'stack of that ladder is the floor every mercenary stack must stay under to die last. Fewer types = ' +
        'a higher floor = bigger mercenary stacks, but also fewer stacks in front of them (their kill ' +
        "positions move up, which costs hits). The table takes every non-empty subset of the account's eight " +
        'troop types, keeps the mercenaries at `min(cap, floor(floor−1 / hp))`, and sorts by average damage.',
    );
    for (const [scenario, make] of [
      ['A', (r: StackRequest) => r],
      ['B', scenarioB],
    ] as const) {
      const base = make(owner.twelve);
      const scored: {
        ids: string[];
        floor: number;
        avg: number;
        line: string;
        authority: number;
        stacks: number;
      }[] = [];
      for (let mask = 1; mask < 1 << ALL_TROOPS.length; mask += 1) {
        const ids = ALL_TROOPS.filter((_id, index) => (mask & (1 << index)) !== 0);
        const request = withMethod(withUnits(base, [...ids, ...MERCS]), 'ms');
        const block = troopBlock(request, ids);
        const counts = { ...block.counts };
        let authority = 0;
        for (const id of MERCS) {
          const hp = hpOf(request, id);
          const count = Math.max(0, Math.min(request.caps[id] ?? 0, Math.floor((block.floor - 1) / hp)));
          counts[id] = count;
          authority += count * (id === CHR ? 2 : 1);
        }
        if (!feasible(request, counts)) continue;
        const evaluation = evaluateCounts(request, counts);
        scored.push({
          ids,
          floor: block.floor,
          avg: evaluation.summary.avgDamage,
          line: march(evaluation.result),
          authority,
          stacks: evaluation.result.stacks.length,
        });
      }
      scored.sort((a, b) => b.avg - a.avg);
      report.add('');
      report.add(`**Scenario ${scenario}** — 255 troop subsets, best 15 and the reference rows:`);
      const table = [
        '| # | troop types | stacks | floor | merc authority | avg | march |',
        '|---|---|---|---|---|---|---|',
      ];
      const show = (entry: (typeof scored)[number], index: number | string): void => {
        table.push(
          `| ${index} | ${entry.ids.map(label).join(' ')} | ${entry.stacks} | ${n(entry.floor)} | ${entry.authority} | ${n(entry.avg)} | ${entry.line} |`,
        );
      };
      scored.slice(0, 15).forEach((entry, index) => show(entry, index + 1));
      for (const reference of [
        ['swordsman-1', 'spearman-2', 'rider-2', 'rider-3'],
        ['archer-2', 'rider-2', 'rider-3'],
        ['archer-2', 'spearman-2', 'rider-2', 'rider-3'],
        ALL_TROOPS,
      ]) {
        const entry = scored.find((candidate) => candidate.ids.join() === reference.join());
        if (entry) show(entry, scored.indexOf(entry) + 1);
      }
      report.add(table.join('\n'));
    }

    // ---- §2..§6 per base ----------------------------------------------------------------------------
    const summary = [
      '| scenario | base | sizer ms | sizer msRelaxed | best under caps | best with mercs last | best × 10 | 3 stacks (no LGN6) | 2 stacks |',
      '|---|---|---|---|---|---|---|---|---|',
    ];

    for (const [scenario, make] of [
      ['A', (r: StackRequest) => r],
      ['B', scenarioB],
    ] as const) {
      for (const baseSpec of BASES) {
        const request = make(withMethod(withUnits(owner.twelve, [...baseSpec.troops, ...MERCS]), 'ms'));
        const relaxed = evaluate(
          make(withMethod(withUnits(owner.twelve, [...baseSpec.troops, ...MERCS]), 'msRelaxed')),
        );
        const sizer = evaluate(request);
        const block = troopBlock(request, baseSpec.troops);
        const counts: Record<string, number> = { ...block.counts, [EMH]: 0, [ABT]: 0, [LGN]: 0, [CHR]: 0 };
        const hp = {
          e: hpOf(request, EMH),
          a: hpOf(request, ABT),
          l: hpOf(request, LGN),
          c: hpOf(request, CHR),
        };
        const ceiling = block.floor - 1;

        report.h(
          `${scenario} · ${baseSpec.key} — troops ${Object.entries(block.counts)
            .map(([id, count]) => `${label(id)} ${n(count)}`)
            .join(' · ')}, floor ${n(block.floor)}`,
        );
        report.add(
          `mercenary stacks stay under the troops while EMH6 ≤ ${Math.floor(ceiling / hp.e)}, ABT6 ≤ ${Math.floor(ceiling / hp.a)}, ` +
            `LGN6 ≤ ${Math.floor(ceiling / hp.l)}, CHR6 ≤ ${Math.floor(ceiling / hp.c)} ` +
            `(HP per unit ${n(hp.e)} / ${n(hp.a)} / ${n(hp.l)} / ${n(hp.c)}); caps are 92 / 76 / 72 / 37.`,
        );

        const free: Best[] = [];
        const last: Best[] = [];
        const tens: Best[] = [];
        const three: Best[] = [];
        const two: Best[] = [];
        const started = Date.now();
        let evaluated = 0;
        for (let e = 0; e <= 92; e += 1) {
          counts[EMH] = e;
          for (let a = 0; a <= 76; a += 1) {
            counts[ABT] = a;
            for (let l = 0; l <= 72; l += 1) {
              counts[LGN] = l;
              for (let c = 0; c <= 37; c += 1) {
                counts[CHR] = c;
                const evaluation = evaluateCounts(request, counts);
                evaluated += 1;
                const avg = evaluation.summary.avgDamage;
                // Only build the (allocating) record when a list would actually take it.
                const wanted =
                  free.length < 10 ||
                  avg > (free.at(-1)?.avg ?? 0) ||
                  (e * hp.e <= ceiling &&
                    a * hp.a <= ceiling &&
                    l * hp.l <= ceiling &&
                    c * hp.c <= ceiling &&
                    (last.length < 10 || avg > (last.at(-1)?.avg ?? 0))) ||
                  (e % 10 === 0 &&
                    a % 10 === 0 &&
                    l % 10 === 0 &&
                    c % 10 === 0 &&
                    (tens.length < 5 || avg > (tens.at(-1)?.avg ?? 0))) ||
                  (l === 0 &&
                    e > 0 &&
                    a > 0 &&
                    c > 0 &&
                    (three.length < 5 || avg > (three.at(-1)?.avg ?? 0))) ||
                  (nonZero(e, a, l, c) === 2 && (two.length < 5 || avg > (two.at(-1)?.avg ?? 0)));
                if (!wanted) continue;
                const entry: Best = {
                  counts: { ...counts },
                  avg,
                  min: evaluation.summary.minDamage,
                  max: evaluation.summary.maxDamage,
                  line: `EMH6 ${e} · ABT6 ${a} · LGN6 ${l} · CHR6 ${c} → ${march(evaluation.result)}`,
                };
                keep(free, entry, 10);
                if (e * hp.e <= ceiling && a * hp.a <= ceiling && l * hp.l <= ceiling && c * hp.c <= ceiling)
                  keep(last, entry, 10);
                if (e % 10 === 0 && a % 10 === 0 && l % 10 === 0 && c % 10 === 0) keep(tens, entry, 5);
                if (l === 0 && e > 0 && a > 0 && c > 0) keep(three, entry, 5);
                if (nonZero(e, a, l, c) === 2) keep(two, entry, 5);
              }
            }
          }
        }
        report.add('');
        report.add(`${n(evaluated)} vectors simulated in ${((Date.now() - started) / 1000).toFixed(1)} s.`);
        report.add('');
        report.add('**Top 10 inside the caps, no ordering constraint**');
        report.add(rows(free, 'vector → march in kill order'));
        report.add('');
        report.add('**Top 10 with every mercenary stack strictly below the smallest troop stack**');
        report.add(rows(last, 'vector → march in kill order'));
        report.add('');
        report.add(
          '**Best vectors with every count a multiple of ten** (the Temple loses ceil(n/10) units for good, so 41 costs what 50 costs)',
        );
        report.add(rows(tens, 'vector → march in kill order'));
        report.add('');
        report.add('**Three stacks: LGN6 dropped**');
        report.add(rows(three, 'vector → march in kill order'));
        report.add('');
        report.add('**Two stacks: two types dropped**');
        report.add(rows(two, 'vector → march in kill order'));
        report.add('');
        report.add(
          `sizer for comparison — ms ${n(sizer.summary.avgDamage)} (${march(sizer.result)}); ` +
            `msRelaxed ${n(relaxed.summary.avgDamage)} (${march(relaxed.result)})`,
        );
        summary.push(
          `| ${scenario} | ${baseSpec.key} | ${n(sizer.summary.avgDamage)} | ${n(relaxed.summary.avgDamage)} | ${n(free[0]?.avg ?? 0)} | ${n(last[0]?.avg ?? 0)} | ${n(tens[0]?.avg ?? 0)} | ${n(three[0]?.avg ?? 0)} | ${n(two[0]?.avg ?? 0)} |`,
        );
      }
    }

    report.h('Summary');
    report.add(summary.join('\n'));
    report.save();
  }, 7_200_000);
});
