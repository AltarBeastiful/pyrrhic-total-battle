/**
 * S-32 — validation against the two real in-game battle reports of 2026-09-11 (epic "Troupe Ancienne"),
 * transcribed verbatim in `tests/fixtures/ingame-2026-09-11-epic-ancient-report.md`.
 *
 * Two deliberate tolerances, both documented in the report file and in `modelNotes`:
 *  - damage lines are compared to ±1: the game truncates the per-hit total where TotalStack rounds it, and
 *    a couple of the report's own "features" sub-totals are off by one against its own total;
 *  - the enemy's damage line (= the destroyed stack's total HP) is compared to ±0.2 %: the game multiplies
 *    count × unrounded per-unit HP (514 × 658.8 = 338,623) while TotalStack — and our contract — round the
 *    per-unit HP first (659 → 338,726).
 * The friendly attack order differs by exactly one hit in both fights: Rider I never attacked although it is
 * 3rd by HP. We keep TotalStack's HP-order rule (PLAN §3.5), so our journal has one extra Rider I hit.
 */
import { describe, expect, it } from 'vitest';

import { buildJournal } from '../../src/engine/battle';
import type { EnemyFormation, JournalEntry, Stack } from '../../src/engine/types';
import { stacksInOrder, totalsFrom } from '../helpers/request';
import { mercenarySet, troopSet } from '../helpers/units';

const UNITS = [
  ...troopSet('ARC1', 'SP1', 'RD1', 'ARC2', 'SP2', 'RD3'),
  ...mercenarySet('EMH6', 'ABT6', 'LGN6', 'CHR6'),
];
const LABEL_OF = new Map(UNITS.map((unit) => [unit.id, unit.label]));

/**
 * The unit sheets in the reports show one army-wide percentage plus a per-category top-up. Solving the
 * report's own damage lines gives: report 1 strength army +187 with melee/mounted/flying +1 and ranged +2
 * (SP1 ×2.88, ARC1 ×2.89, EMH ×2.87), health army +142 with every category +2 (×2.44, EMH ×2.42);
 * report 2 is the same one point lower (army +186 / +141).
 */
const COUNTS = [
  { label: 'SP1', count: 944 },
  { label: 'ARC1', count: 930 },
  { label: 'RD1', count: 464 },
  { label: 'ARC2', count: 514 },
  { label: 'SP2', count: 513 },
  { label: 'RD3', count: 143 },
  { label: 'CHR6', count: 12 },
  { label: 'EMH6', count: 22 },
  { label: 'ABT6', count: 23 },
  { label: 'LGN6', count: 23 },
];

function totals(army: { health: number; strength: number }) {
  return totalsFrom({
    health: {
      army: army.health,
      melee: 2,
      ranged: 2,
      mounted: 2,
      flying: 2,
    },
    strength: {
      army: army.strength,
      melee: 1,
      ranged: 2,
      mounted: 1,
      flying: 1,
    },
    special: { doubleDamageChance: 3 },
  });
}

function labels(entries: JournalEntry[], actor: 'army' | 'enemy'): string[] {
  return entries.filter((entry) => entry.actor === actor).map((entry) => LABEL_OF.get(entry.unitId)!);
}

function damageOf(stacks: Stack[], label: string): number {
  const unitId = UNITS.find((unit) => unit.label === label)!.id;
  return stacks.find((stack) => stack.unitId === unitId)!.damagePerHit;
}

function hpOf(stacks: Stack[], label: string): number {
  const unitId = UNITS.find((unit) => unit.label === label)!.id;
  return stacks.find((stack) => stack.unitId === unitId)!.totalHp;
}

function expectClose(actual: number, expected: number, relative: number): void {
  expect(Math.abs(actual - expected) / expected).toBeLessThanOrEqual(relative);
}

describe('report 1 — 2026-09-11 23:02, our army first, 3 enemy squads', () => {
  const enemy: EnemyFormation = { flying: 1, melee: 1, mounted: 1, ranged: 0 };
  const stacks = stacksInOrder(COUNTS, UNITS, totals({ health: 142, strength: 187 }), enemy);
  const journal = buildJournal(stacks, 3, true);

  it('targets the same enemy squad as the report for every stack', () => {
    const targets = Object.fromEntries(stacks.map((stack) => [LABEL_OF.get(stack.unitId), stack.target]));
    expect(targets).toEqual({
      SP1: 'mounted',
      ARC1: 'flying',
      // Rider I never attacked in this fight; with no ranged squad present it would have hit melee.
      RD1: 'melee',
      ARC2: 'flying',
      SP2: 'mounted',
      // No ranged squad in this formation, so Rider 3 and the Chariots fall back to melee, as in the report.
      RD3: 'melee',
      CHR6: 'melee',
      EMH6: 'melee',
      ABT6: 'flying',
      LGN6: 'mounted',
    });
  });

  it('reproduces every per-hit damage of the hit list (±1)', () => {
    expect(damageOf(stacks, 'SP1')).toBe(154_344);
    expect(damageOf(stacks, 'ARC1')).toBe(165_540);
    expect(damageOf(stacks, 'ARC2')).toBe(180_414);
    expect(damageOf(stacks, 'CHR6')).toBe(131_328);
    expect(damageOf(stacks, 'ABT6')).toBe(348_726);
    expect(damageOf(stacks, 'LGN6')).toBe(254_771);
    // The game truncates where we round.
    expect(damageOf(stacks, 'SP2')).toBe(160_210); // report 160,209
    expect(damageOf(stacks, 'RD3')).toBe(131_789); // report 131,788
    expect(damageOf(stacks, 'EMH6')).toBe(400_154); // report 400,153
  });

  it("reproduces every enemy damage line as the destroyed stack's total HP (±0.2 %)", () => {
    expect(hpOf(stacks, 'SP1')).toBe(345_504);
    expect(hpOf(stacks, 'ARC1')).toBe(340_380);
    expect(hpOf(stacks, 'RD1')).toBe(339_648);
    expect(hpOf(stacks, 'CHR6')).toBe(333_792);
    expect(hpOf(stacks, 'ABT6')).toBe(319_884);
    expect(hpOf(stacks, 'LGN6')).toBe(319_884);
    expectClose(hpOf(stacks, 'ARC2'), 338_623, 0.002);
    expectClose(hpOf(stacks, 'SP2'), 337_964, 0.002);
    expectClose(hpOf(stacks, 'RD3'), 334_963, 0.002);
    expectClose(hpOf(stacks, 'EMH6'), 324_231, 0.002);
  });

  it('reproduces the round structure: same kill order, same attack order minus the Rider I hit', () => {
    expect(journal.entries).toHaveLength(29); // the report shows 28: Rider I never attacked
    expect(labels(journal.entries, 'enemy')).toEqual([
      'SP1',
      'ARC1',
      'RD1',
      'ARC2',
      'SP2',
      'RD3',
      'CHR6',
      'EMH6',
      'ABT6',
      'LGN6',
    ]);
    expect(labels(journal.entries, 'army').filter((label) => label !== 'RD1')).toEqual([
      'SP1',
      'ARC1',
      'ARC2',
      'SP2',
      'RD3',
      'CHR6',
      'EMH6',
      'ABT6',
      'LGN6',
      'SP2',
      'RD3',
      'CHR6',
      'EMH6',
      'ABT6',
      'LGN6',
      'EMH6',
      'ABT6',
      'LGN6',
    ]);
  });
});

describe('report 2 — 2026-09-11 23:00, enemy first, 4 enemy squads (a swarm squad included)', () => {
  const enemy: EnemyFormation = { flying: 1, melee: 1, mounted: 1, ranged: 1 };
  const stacks = stacksInOrder(COUNTS, UNITS, totals({ health: 141, strength: 186 }), enemy);
  const journal = buildJournal(stacks, 4, false);

  it('re-targets Rider 3 and the Chariots onto the ranged squad', () => {
    expect(damageOf(stacks, 'CHR6')).toBe(355_680);
    expect(damageOf(stacks, 'RD3')).toBe(198_141); // report 198,140
    expect(stacks.find((stack) => stack.unitId === 'rider-3')?.target).toBe('ranged');
  });

  it('reproduces the other per-hit damages exactly', () => {
    expect(damageOf(stacks, 'ARC1')).toBe(165_075);
    expect(damageOf(stacks, 'ARC2')).toBe(179_951);
    expect(damageOf(stacks, 'SP2')).toBe(159_748);
    expect(damageOf(stacks, 'EMH6')).toBe(399_707);
    expect(damageOf(stacks, 'ABT6')).toBe(348_289);
    expect(damageOf(stacks, 'LGN6')).toBe(254_334);
  });

  it('models the double damage of entry 8 as a plain ×2 on a hit', () => {
    // Rider 3: 5 % of its own plus the +3 % bonus.
    expect(stacks.find((stack) => stack.unitId === 'rider-3')?.doubleDamageChance).toBe(8);
    expect(2 * damageOf(stacks, 'RD3')).toBeCloseTo(396_280, -1);
  });

  it('reproduces the round structure with N = 4 and the enemy striking first', () => {
    expect(journal.entries).toHaveLength(25); // the report shows 24: Rider I never attacked
    expect(labels(journal.entries, 'enemy')).toEqual([
      'SP1',
      'ARC1',
      'RD1',
      'ARC2',
      'SP2',
      'RD3',
      'CHR6',
      'EMH6',
      'ABT6',
      'LGN6',
    ]);
    expect(labels(journal.entries, 'army').filter((label) => label !== 'RD1')).toEqual([
      'ARC1',
      'ARC2',
      'SP2',
      'RD3',
      'CHR6',
      'EMH6',
      'ABT6',
      'LGN6',
      'RD3',
      'CHR6',
      'EMH6',
      'ABT6',
      'LGN6',
      'LGN6',
    ]);
  });

  it("reproduces the enemy damage lines (stack HP at the fight's +143 % health)", () => {
    expect(hpOf(stacks, 'CHR6')).toBe(332_424);
    expect(hpOf(stacks, 'ABT6')).toBe(318_573);
    expectClose(hpOf(stacks, 'SP1'), 344_088, 0.002);
    expectClose(hpOf(stacks, 'ARC1'), 338_985, 0.002);
    expectClose(hpOf(stacks, 'RD1'), 338_256, 0.002);
    expectClose(hpOf(stacks, 'ARC2'), 337_235, 0.002);
    expectClose(hpOf(stacks, 'SP2'), 336_579, 0.002);
    expectClose(hpOf(stacks, 'RD3'), 333_590, 0.002);
    expectClose(hpOf(stacks, 'EMH6'), 322_891, 0.002);
  });
});
