/**
 * E5 — captains, netted against Aydae. Scenario B's +143 / +187 guardsmen bonus is the total the game
 * applied in the 2026-09-13 fight, and the captain (Aydae, level 37) marched in that fight, so B already
 * contains Aydae's guardsmen +52 health / +82 strength (captainValue: level × 1 + star table [15, 45]).
 * Worker C's ranking added captains *on top of* B; this script removes Aydae first, so the deltas are
 * "swap Aydae for X at the same level and star", which is the decision the owner can actually take.
 * `THEORY=1 pnpm vitest run tools/theorycraft/05-captain-swap.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import type { ResolvedSource } from '../../src/engine/types';
import { Report, evaluate, loadOwner, march, n, scenarioB, withMethod, withUnits } from './harness';

const WINNER = [
  'archer-2',
  'rider-2',
  'rider-3',
  'epic-monster-hunter-6',
  'arbalester-6',
  'legionary-6',
  'chariot-6',
];

/** Captain contributions at level 37 ★3 as `captains.json` + `captainValue` resolve them (worker C, out/31). */
const CAPTAINS: Record<string, Omit<ResolvedSource, 'id' | 'label' | 'kind'>> = {
  'Aydae (as today)': { health: { guardsmen: 52 }, strength: { guardsmen: 82 } },
  'no captain': {},
  Hercules: { special: { armyStrengthAgainstEpicMonsters: 254 } },
  Heimdall: { strength: { army: 385.5 } },
  Beowulf: { health: { army: 247 }, strength: { army: 247 } },
  Skadi: { health: { guardsmen: 494 }, strength: { guardsmen: 494 } },
  Leonidas: { health: { melee: 77 }, strength: { melee: 194 } },
  Cleopatra: { strength: { army: 97 } },
  'Ramses II': { health: { army: 97 } },
};

describe.skipIf(!process.env.THEORY)('E5 captain swap', () => {
  it('nets each captain against Aydae', () => {
    const report = new Report('05-captain-swap');
    const owner = loadOwner();
    const b = scenarioB(owner.twelve);
    // B without Aydae: the fight's totals minus what the captain brought.
    const base: ResolvedSource = {
      id: 'b-minus-aydae',
      label: 'report bonuses minus Aydae 37★3',
      kind: 'custom',
      health: { guardsmen: 143 - 52, ranged: 0.5, specialist: 51 },
      strength: { guardsmen: 187 - 82, ranged: 1, specialist: 71 },
      special: { doubleDamageChance: 3 },
    };
    report.add(
      'Scenario B already contains Aydae (the captain marched in the 2026-09-13 report). Baseline below = B; each row = B with Aydae replaced by the named captain at level 37 ★3.',
    );
    for (const [name, ids] of [
      ['winner 7 types', WINNER],
      ['owner 8 types', owner.eight.units.map((u) => u.id)],
    ] as const) {
      report.h(`${name} · msRelaxed`);
      const rows: string[] = ['| captain (37 ★3) | avg damage | Δ vs Aydae | march |', '|---|---|---|---|'];
      let aydae = 0;
      for (const [captain, bonus] of Object.entries(CAPTAINS)) {
        const totals = aggregateBonuses([base, { id: captain, label: captain, kind: 'captain', ...bonus }]);
        const ev = evaluate(withMethod(withUnits({ ...b, totals }, ids), 'msRelaxed'));
        if (captain.startsWith('Aydae')) aydae = ev.summary.avgDamage;
        rows.push(
          `| ${captain} | ${n(ev.summary.avgDamage)} | ${n(ev.summary.avgDamage - aydae)} | ${march(ev.result)} |`,
        );
      }
      report.add(rows.join('\n'));
    }
    report.save();
  });
});
