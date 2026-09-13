/**
 * E6 — the "cheap march" of §6: three troop sponges sized just above four small mercenary stacks
 * (20/20/10/10), leadership 1,162 of 4,343. `THEORY=1 pnpm vitest run tools/theorycraft/06-cheap-march.test.ts`
 */
import { describe, it } from 'vitest';

import {
  Report,
  evaluateCounts,
  feasible,
  loadOwner,
  march,
  n,
  scenarioB,
  table,
  withUnits,
} from './harness';

const TYPES = [
  'archer-2',
  'rider-2',
  'rider-3',
  'epic-monster-hunter-6',
  'arbalester-6',
  'legionary-6',
  'chariot-6',
];

describe.skipIf(!process.env.THEORY)('E6 cheap march', () => {
  it('prices the cheap march and the full one', () => {
    const report = new Report('06-cheap-march');
    const owner = loadOwner();
    const b = withUnits(scenarioB(owner.twelve), TYPES);
    const marches: Record<string, Record<string, number>> = {
      'cheap: 20/20/10/10 mercs, troops just above them (L 1,162)': {
        'archer-2': 454,
        'rider-2': 227,
        'rider-3': 127,
        'epic-monster-hunter-6': 20,
        'arbalester-6': 20,
        'legionary-6': 10,
        'chariot-6': 10,
      },
      'half: 50/40/40/20 mercs, troops just above them': {
        'archer-2': 1_128,
        'rider-2': 565,
        'rider-3': 318,
        'epic-monster-hunter-6': 50,
        'arbalester-6': 40,
        'legionary-6': 40,
        'chariot-6': 20,
      },
      'full: sizer winner (msRelaxed)': {
        'archer-2': 1_697,
        'rider-2': 848,
        'rider-3': 475,
        'epic-monster-hunter-6': 75,
        'arbalester-6': 76,
        'legionary-6': 72,
        'chariot-6': 37,
      },
      'full: exhaustive best merc vector (A5)': {
        'archer-2': 1_697,
        'rider-2': 848,
        'rider-3': 475,
        'epic-monster-hunter-6': 67,
        'arbalester-6': 76,
        'legionary-6': 72,
        'chariot-6': 36,
      },
    };
    const rows = [
      '| march | avg | silver | gold (temple 15) | mercs lost | avg / silver | avg / merc lost | L |',
      '|---|---|---|---|---|---|---|---|',
    ];
    for (const [name, counts] of Object.entries(marches)) {
      const ev = evaluateCounts(b, counts);
      report.h(name);
      report.add(`feasible ${String(feasible(b, counts))} · ${march(ev.result)}`);
      report.add(table(ev));
      const lost = ev.result.stacks
        .filter((s) => s.pool === 'authority')
        .reduce((sum, s) => sum + Math.ceil(s.count / 10), 0);
      const s = ev.summary;
      rows.push(
        `| ${name} | ${n(s.avgDamage)} | ${n(s.recovery.silver)} | ${n(s.recovery.gold)} | ${lost} | ${n(Math.round((s.avgDamage / s.recovery.silver) * 100) / 100)} | ${n(Math.round(s.avgDamage / lost))} | ${n(ev.result.pools.leadership.used)} |`,
      );
    }
    report.h('summary');
    report.add(rows.join('\n'));
    report.save();
  });
});
