/**
 * E8 — the frontier: damage per march, silver per march, mercenaries lost per march — for every troop
 * subset (255) × spend level × method, full leadership, scenario B. Answers "which march gives the most
 * damage per silver *above a damage floor*", the owner's question of 2026-09-14 (a march that is too
 * small may not kill enough of the monster). `THEORY=1 pnpm vitest run tools/theorycraft/08-frontier.test.ts`
 */
import { describe, it } from 'vitest';

import { Report, evaluate, label, loadOwner, n, scenarioB, withCaps, withMethod, withUnits } from './harness';

const MERCS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'];
const TROOPS = [
  'swordsman-1',
  'archer-1',
  'spearman-1',
  'rider-1',
  'archer-2',
  'spearman-2',
  'rider-2',
  'rider-3',
];
const SPENDS: Record<string, number[]> = {
  '92/76/72/37': [92, 76, 72, 37],
  '70/60/60/30': [70, 60, 60, 30],
  '50/40/40/20': [50, 40, 40, 20],
  '30/20/20/10': [30, 20, 20, 10],
  '20/20/10/10': [20, 20, 10, 10],
  '10/10/10/10': [10, 10, 10, 10],
};

interface Row {
  troops: string;
  spend: string;
  method: string;
  avg: number;
  silver: number;
  lost: number;
  perSilver: number;
  perLost: number;
  march: string;
}

describe.skipIf(!process.env.THEORY)('E8 frontier', () => {
  it('builds the frontier', () => {
    const report = new Report('08-frontier');
    const owner = loadOwner();
    const b = scenarioB(owner.twelve);
    const rows: Row[] = [];
    for (let bits = 1; bits < 1 << TROOPS.length; bits += 1) {
      const troops = TROOPS.filter((_id, i) => (bits & (1 << i)) !== 0);
      for (const [spendName, spend] of Object.entries(SPENDS)) {
        const caps = Object.fromEntries(MERCS.map((id, i) => [id, spend[i] ?? 0]));
        for (const method of ['ms', 'elite'] as const) {
          const ev = evaluate(withMethod(withCaps(withUnits(b, [...troops, ...MERCS]), caps), method));
          const lost = ev.result.stacks
            .filter((s) => s.pool === 'authority')
            .reduce((sum, s) => sum + Math.ceil(s.count / 10), 0);
          const s = ev.summary;
          rows.push({
            troops: troops.map(label).join(' '),
            spend: spendName,
            method,
            avg: s.avgDamage,
            silver: s.recovery.silver,
            lost,
            perSilver: s.avgDamage / s.recovery.silver,
            perLost: s.avgDamage / Math.max(1, lost),
            march: ev.result.stacks.map((st) => `${label(st.unitId)} ${n(st.count)}`).join(' · '),
          });
        }
      }
    }
    report.add(
      `${n(rows.length)} marches evaluated (255 troop subsets × ${Object.keys(SPENDS).length} spend levels × 2 methods), scenario B, full leadership 4,343.`,
    );

    const line = (r: Row): string =>
      `| ${r.troops} | ${r.spend} | ${r.method} | ${n(r.avg)} | ${n(r.silver)} | ${r.lost} | ${r.perSilver.toFixed(2)} | ${n(Math.round(r.perLost))} | ${r.march} |`;
    const head =
      '| troop types | mercs fielded | method | avg damage | silver | mercs lost | dmg / silver | dmg / merc lost | march |\n|---|---|---|---|---|---|---|---|---|';

    report.h('Best damage per silver, by damage floor (any spend)');
    for (const floor of [0, 2e6, 3e6, 4e6, 5e6, 6e6, 7e6, 7.5e6, 8e6]) {
      const eligible = rows
        .filter((r) => r.avg >= floor)
        .sort((a, b) => b.perSilver - a.perSilver)
        .slice(0, 3);
      report.add(`\n**floor ≥ ${n(floor)}**\n${head}\n${eligible.map(line).join('\n')}`);
    }

    report.h('Best damage per mercenary lost, by damage floor');
    for (const floor of [0, 2e6, 3e6, 4e6, 5e6, 6e6, 7e6]) {
      const eligible = rows
        .filter((r) => r.avg >= floor)
        .sort((a, b) => b.perLost - a.perLost)
        .slice(0, 3);
      report.add(`\n**floor ≥ ${n(floor)}**\n${head}\n${eligible.map(line).join('\n')}`);
    }

    report.h('Best damage per silver at full stock (92/76/72/37), top 10');
    report.add(
      `${head}\n${rows
        .filter((r) => r.spend === '92/76/72/37')
        .sort((a, b) => b.perSilver - a.perSilver)
        .slice(0, 10)
        .map(line)
        .join('\n')}`,
    );

    report.h('Pareto frontier: no other march has ≥ damage, ≤ silver and ≤ mercenaries lost');
    const pareto = rows.filter(
      (r) =>
        !rows.some(
          (o) =>
            o !== r &&
            o.avg >= r.avg &&
            o.silver <= r.silver &&
            o.lost <= r.lost &&
            (o.avg > r.avg || o.silver < r.silver || o.lost < r.lost),
        ),
    );
    report.add(
      `${pareto.length} marches on the frontier, damage descending:\n${head}\n${pareto
        .sort((a, b) => b.avg - a.avg)
        .map(line)
        .join('\n')}`,
    );
    report.save();
  });
});
