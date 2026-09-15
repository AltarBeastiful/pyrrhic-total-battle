/**
 * 50 — the referee for the 0016 theory-craft pass.
 *
 * Five independent experiments (45 ledger/optimum, 46 ladder bottom, 47 procs/enemy, 48 few marches,
 * 49 audit) each recommend marches. Two of them disagreed on the best one, so this file scores every
 * recommended march in one place, with the same engine call, the same bonus scenarios and a feasibility
 * check on each — the numbers in the report are read from this table, not from the workers' summaries.
 *
 * Nothing here is new search work: it evaluates explicit counts only. `THEORY=1 pnpm vitest run
 * tools/theorycraft/50-referee.test.ts`.
 */
import { describe, it } from 'vitest';

import { Report, evaluateCounts, feasible, loadOwner, n, scenarioB, scenarioC, withEnemy } from './harness';
import type { Category, StackRequest } from '../../src/engine/types';

const ONE_OF_EACH: Record<Category, number> = { melee: 1, ranged: 1, mounted: 1, flying: 1 };
const THREE: Record<Category, number> = { melee: 1, ranged: 1, mounted: 1, flying: 0 };
const EIGHT: Record<Category, number> = { melee: 2, ranged: 2, mounted: 2, flying: 2 };

interface Candidate {
  id: string;
  /** Who recommended it and why it is interesting. */
  origin: string;
  scenario: 'C' | 'B';
  enemy: Record<Category, number>;
  /** The summary's number as the worker reported it, to be confirmed or refuted. */
  claimed: number;
  counts: Record<string, number>;
}

const W1_C = {
  'rider-3': 582,
  'epic-monster-hunter-6': 92,
  'archer-2': 1519,
  'rider-2': 761,
  'legionary-6': 72,
  'chariot-6': 36,
  'arbalester-6': 71,
  'spearman-2': 138,
};

const W2_C = {
  'archer-2': 1605,
  'arbalester-6': 76,
  'rider-2': 799,
  'rider-3': 447,
  'legionary-6': 72,
  'chariot-6': 36,
  'epic-monster-hunter-6': 67,
  'spearman-2': 246,
};

/** 0015's exhaustive single-march winner (its §4/§5 "7 types + 4 mercenaries"). */
const E0015_SIZER = {
  'archer-2': 1697,
  'rider-2': 848,
  'rider-3': 475,
  'epic-monster-hunter-6': 67,
  'arbalester-6': 76,
  'legionary-6': 72,
  'chariot-6': 36,
};

const CANDIDATES: Candidate[] = [
  {
    id: 'W1 optimum',
    origin: '45 — count hill-climb from 1,227 seeds (the exact-optimum worker)',
    scenario: 'C',
    enemy: ONE_OF_EACH,
    claimed: 8_338_153,
    counts: W1_C,
  },
  {
    id: 'W3 optimum',
    origin: '47 — independent search on the proc objective as surrogate (the procs worker)',
    scenario: 'C',
    enemy: ONE_OF_EACH,
    claimed: 8_338_153,
    counts: W1_C,
  },
  {
    id: 'W2 optimum',
    origin: '46 — structured ladder + tail (the ladder-bottom worker)',
    scenario: 'C',
    enemy: ONE_OF_EACH,
    claimed: 8_159_844,
    counts: W2_C,
  },
  {
    id: 'W2 no-tail',
    origin: "46 — the tail removed (0015's shape, mercenaries respected)",
    scenario: 'C',
    enemy: ONE_OF_EACH,
    claimed: 8_093_435,
    counts: E0015_SIZER,
  },
  {
    id: '0015 winner',
    origin: '0015 §5, the reference this pass must beat',
    scenario: 'B',
    enemy: ONE_OF_EACH,
    claimed: 8_061_308,
    counts: E0015_SIZER,
  },
  {
    id: 'W1 optimum',
    origin: '45 — the same shape re-climbed under the older bonuses',
    scenario: 'B',
    enemy: ONE_OF_EACH,
    claimed: 8_300_884,
    counts: { ...W1_C, 'rider-3': 584, 'archer-2': 1520, 'spearman-2': 133 },
  },
  {
    id: 'W3 N=3',
    origin: '47 — best march for a monster showing three squads',
    scenario: 'C',
    enemy: THREE,
    claimed: 9_063_829,
    counts: {
      'archer-2': 1605,
      'arbalester-6': 76,
      'rider-3': 449,
      'rider-2': 795,
      'epic-monster-hunter-6': 71,
      'chariot-6': 37,
      'legionary-6': 72,
      'spearman-2': 250,
    },
  },
  {
    id: 'W3 N=8',
    origin: "47 — best march against Arachne's eight squads",
    scenario: 'C',
    enemy: EIGHT,
    claimed: 6_315_085,
    counts: {
      'archer-2': 2773,
      'rider-3': 781,
      'epic-monster-hunter-6': 92,
      'arbalester-6': 76,
      'chariot-6': 37,
      'legionary-6': 72,
      'rider-2': 4,
    },
  },
  {
    id: 'probe: EMH6 67',
    origin: 'probe — the winner with EMH6 trimmed to the count that would put it on a 2-strike rung',
    scenario: 'C',
    enemy: ONE_OF_EACH,
    claimed: 0,
    counts: { ...W1_C, 'epic-monster-hunter-6': 67 },
  },
  {
    id: 'probe: EMH6 67 + caps',
    origin: 'probe — the same, with the freed authority spent on ABT6 and CHR6 up to their caps',
    scenario: 'C',
    enemy: ONE_OF_EACH,
    claimed: 0,
    counts: { ...W1_C, 'epic-monster-hunter-6': 67, 'arbalester-6': 76, 'chariot-6': 37 },
  },
  {
    id: 'W4 A m1',
    origin: '48 — plan A, first march: mercenaries only, no troops (zero silver)',
    scenario: 'C',
    enemy: ONE_OF_EACH,
    claimed: 0,
    counts: {
      'epic-monster-hunter-6': 90,
      'arbalester-6': 70,
      'legionary-6': 70,
      'chariot-6': 30,
    },
  },
  {
    id: 'W4 A m3',
    origin: '48 — plan A, its one paid-for sponge march',
    scenario: 'C',
    enemy: ONE_OF_EACH,
    claimed: 0,
    counts: {
      'epic-monster-hunter-6': 24,
      'arbalester-6': 26,
      'legionary-6': 20,
      'chariot-6': 10,
      'archer-2': 562,
      'spearman-2': 562,
      'rider-2': 281,
      'rider-3': 157,
    },
  },
];

function mercenariesLost(stacks: { pool: string; count: number }[]): number {
  return stacks
    .filter((stack) => stack.pool === 'authority')
    .reduce((sum, stack) => sum + Math.ceil(stack.count / 10), 0);
}

describe.skipIf(!process.env.THEORY)('referee', () => {
  it('scores every recommended march', () => {
    const report = new Report('50-referee');
    const owner = loadOwner();
    report.add(
      `Scored in one run against the engine. Bonus scenario C = the 2026-09-14 report's own bonuses, B = 0015's. ` +
        `Every count vector is checked for feasibility (pools and stock caps) before it is scored.`,
    );
    const rows = [
      '| candidate | origin | scenario | enemy | feasible | avg damage | claimed | Δ | silver | gold | mercs lost |',
      '|---|---|---|---|---|---|---|---|---|---|---|',
    ];
    const detail: string[] = [];
    let duplicates = 0;
    const seen = new Map<string, string>();

    for (const candidate of CANDIDATES) {
      const request: StackRequest =
        candidate.scenario === 'C' ? scenarioC(owner.twelve) : scenarioB(owner.twelve);
      const req = withEnemy(request, candidate.enemy);
      const key = `${candidate.scenario}|${JSON.stringify(candidate.counts)}|${JSON.stringify(candidate.enemy)}`;
      const twin = seen.get(key);
      if (twin) duplicates += 1;
      else seen.set(key, candidate.id);

      const ok = feasible(req, candidate.counts);
      const ev = evaluateCounts(req, candidate.counts);
      const s = ev.summary;
      const delta = candidate.claimed > 0 ? s.avgDamage - candidate.claimed : 0;
      rows.push(
        `| ${candidate.id}${twin ? ` (= ${twin})` : ''} | ${candidate.origin} | ${candidate.scenario} | ` +
          `N=${Object.values(candidate.enemy).reduce((a, b) => a + b, 0)} | ${ok ? 'yes' : '**NO**'} | ` +
          `**${n(s.avgDamage)}** | ${candidate.claimed > 0 ? n(candidate.claimed) : '—'} | ` +
          `${candidate.claimed > 0 ? (delta === 0 ? '0' : n(delta)) : '—'} | ${n(s.recovery.silver)} | ` +
          `${n(s.recovery.gold)} | ${mercenariesLost(ev.result.stacks)} |`,
      );
      detail.push(
        `\n**${candidate.id}** (${candidate.scenario}, N=${Object.values(candidate.enemy).reduce((a, b) => a + b, 0)})\n` +
          `kill order: ${ev.result.stacks.map((stack) => `${stack.unitId} ${n(stack.count)}`).join(' · ')}\n` +
          `min ${n(s.minDamage)} · max ${n(s.maxDamage)} · hits ${s.journals.enemyFirst.friendlyHits}/${s.journals.armyFirst.friendlyHits} · ` +
          `leadership ${n(ev.result.pools.leadership.used)}/${n(ev.result.pools.leadership.capacity)} · ` +
          `authority ${n(ev.result.pools.authority.used)}/${n(ev.result.pools.authority.capacity)} · ` +
          `warnings: ${ev.result.warnings.join(' | ') || 'none'}`,
      );
    }

    report.add(rows.join('\n'));
    report.add(`\nrepeated vectors in the table: ${duplicates} (a twin is labelled with its original)`);
    report.add(detail.join('\n'));
    report.save();
  });
});
