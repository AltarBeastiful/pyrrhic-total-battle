/**
 * E7 — Kai's shape: many troop sponges in front of *small* mercenary stacks. When the stock fielded per
 * march is small (a campaign at 20–50 % spend), the troop floor no longer binds and every extra troop
 * type in front pushes the mercenaries into later, better positions. Question: at which spend does a
 * 7- or 8-type troop ladder beat the 3-sponge set, per march, per silver and per mercenary lost?
 * `THEORY=1 pnpm vitest run tools/theorycraft/07-deep-ladder.test.ts`
 */
import { describe, it } from 'vitest';

import { Report, evaluate, label, loadOwner, n, scenarioB, withCaps, withMethod, withUnits } from './harness';

const MERCS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'];
const SETS: Record<string, string[]> = {
  '3 sponges (ARC2 RD2 RD3)': ['archer-2', 'rider-2', 'rider-3'],
  '4 sponges (+SP2)': ['archer-2', 'spearman-2', 'rider-2', 'rider-3'],
  "7 sponges (Kai's: ARC1 SP1 RD1 ARC2 SP2 RD2 RD3)": [
    'archer-1',
    'spearman-1',
    'rider-1',
    'archer-2',
    'spearman-2',
    'rider-2',
    'rider-3',
  ],
  '8 sponges (+SW1)': [
    'swordsman-1',
    'archer-1',
    'spearman-1',
    'rider-1',
    'archer-2',
    'spearman-2',
    'rider-2',
    'rider-3',
  ],
};
/** Stock fielded per march: EMH6 / ABT6 / LGN6 / CHR6. */
const SPENDS: Record<string, number[]> = {
  'full stock 92/76/72/37': [92, 76, 72, 37],
  '50/40/40/20': [50, 40, 40, 20],
  '30/20/20/10': [30, 20, 20, 10],
  '20/20/10/10': [20, 20, 10, 10],
  '10/10/10/10': [10, 10, 10, 10],
};

describe.skipIf(!process.env.THEORY)('E7 deep ladder', () => {
  it('prices sponge count × spend', () => {
    const report = new Report('07-deep-ladder');
    const owner = loadOwner();
    const b = scenarioB(owner.twelve);
    report.add(
      'Scenario B, full leadership 4,343, sizer `ms` (mercenaries under the smallest troop stack) and `elite` (mercenaries on top). Mercenary caps = the stock fielded this march. "per merc lost" = avg ÷ Σ ceil(n/10).',
    );
    for (const method of ['ms', 'elite'] as const) {
      report.h(`method ${method}`);
      const rows = [
        '| spend | sponges | avg | silver | mercs lost | avg / silver | avg / merc lost | merc positions (hits E) | march |',
        '|---|---|---|---|---|---|---|---|---|',
      ];
      for (const [spendName, spend] of Object.entries(SPENDS)) {
        const caps = Object.fromEntries(MERCS.map((id, i) => [id, spend[i] ?? 0]));
        for (const [setName, troops] of Object.entries(SETS)) {
          const req = withMethod(withCaps(withUnits(b, [...troops, ...MERCS]), caps), method);
          const ev = evaluate(req);
          const s = ev.summary;
          const mercStacks = ev.result.stacks
            .map((stack, i) => ({ stack, position: i + 1 }))
            .filter(({ stack }) => stack.pool === 'authority');
          const lost = mercStacks.reduce((sum, { stack }) => sum + Math.ceil(stack.count / 10), 0);
          const ef = new Map<string, number>();
          for (const e of s.journals.enemyFirst.entries) {
            if (e.actor === 'army') ef.set(e.unitId, (ef.get(e.unitId) ?? 0) + 1);
          }
          const positions = mercStacks
            .map(({ stack, position }) => `${label(stack.unitId)}@${position}(${ef.get(stack.unitId) ?? 0})`)
            .join(' ');
          const marchText = ev.result.stacks.map((st) => `${label(st.unitId)} ${n(st.count)}`).join(' · ');
          rows.push(
            `| ${spendName} | ${setName} | ${n(s.avgDamage)} | ${n(s.recovery.silver)} | ${lost} | ${(s.avgDamage / s.recovery.silver).toFixed(2)} | ${n(Math.round(s.avgDamage / Math.max(1, lost)))} | ${positions} | ${marchText} |`,
          );
        }
      }
      report.add(rows.join('\n'));
    }
    report.save();
  });
});
