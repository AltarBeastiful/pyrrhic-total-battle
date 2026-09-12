/**
 * S-32 / S-34 — the journal must be readable side by side with TotalStack's screen: same numbered entries,
 * same actors, same targets, same per-hit damage, same hit counters.
 *
 * The stacks are built from the *captured* counts (helpers/request.ts `stacksInOrder`), not from our sizer:
 * this file tests the battle model alone, `stacker.test.ts` tests the sizing.
 */
import { describe, expect, it } from 'vitest';

import { buildJournal, expectedHits } from '../../src/engine/battle';
import { emptyTotals } from '../../src/engine/bonuses';
import type { JournalEntry } from '../../src/engine/types';
import { parseJournal, type ParsedEntry } from '../helpers/journal';
import { STANDARD_ENEMY, stacksInOrder } from '../helpers/request';
import { mercenarySet, monsterSet, troopSet } from '../helpers/units';

function compare(entries: JournalEntry[], expected: ParsedEntry[], labelOf: Map<string, string>): void {
  expect(entries).toHaveLength(expected.length);
  entries.forEach((entry, index) => {
    const want = expected[index]!;
    const where = `entry ${want.n}`;
    expect(`${where} ${entry.actor}`).toBe(`${where} ${want.actor}`);
    expect(`${where} ${labelOf.get(entry.unitId)}`).toBe(`${where} ${want.label}`);
    expect(`${where} damage ${entry.damage}`).toBe(`${where} damage ${want.damage}`);
    expect(`${where} hits ${entry.hits}`).toBe(`${where} hits ${want.hits}`);
    if (want.target) expect(`${where} target ${entry.target}`).toBe(`${where} target ${want.target}`);
    if (want.features !== undefined) {
      expect(`${where} features ${entry.featuresDamage}`).toBe(`${where} features ${want.features}`);
    }
  });
}

const UNITS = [
  ...troopSet('ARC1', 'SP2', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3'),
  ...monsterSet('WE', 'BB', 'ED', 'SG'),
  ...mercenarySet('BER5'),
];
const LABEL_OF = new Map(UNITS.map((unit) => [unit.id, unit.label]));

describe('captured TotalStack journals', () => {
  it('reproduces journal-ep-enemy-first.txt entry for entry', () => {
    // Stack order and counts exactly as the run reports them (total HP descending).
    const stacks = stacksInOrder(
      [
        { label: 'WE', count: 18 },
        { label: 'ARC1', count: 655 },
        { label: 'RD1', count: 327 },
        { label: 'RD2', count: 181 },
        { label: 'ARC2', count: 361 },
        { label: 'SP2', count: 361 },
        { label: 'ARC3', count: 203 },
        { label: 'SP3', count: 202 },
        { label: 'RD3', count: 101 },
        { label: 'ED', count: 7 },
        { label: 'BB', count: 8 },
        { label: 'SG', count: 6 },
      ],
      UNITS,
      emptyTotals(),
      STANDARD_ENEMY,
    );
    const journal = buildJournal(stacks, 4, false);
    expect(journal.rounds).toBe(33);
    expect(journal.friendlyHits).toBe(21);
    compare(journal.entries, parseJournal('totalstack-2026-09-12-journal-ep-enemy-first.txt'), LABEL_OF);
  });

  it('reproduces journal-mp-bear-army-first.txt entry for entry', () => {
    const stacks = stacksInOrder(
      [
        { label: 'ARC1', count: 655 },
        { label: 'RD1', count: 327 },
        { label: 'RD2', count: 181 },
        { label: 'ARC2', count: 361 },
        { label: 'SP2', count: 361 },
        { label: 'ARC3', count: 203 },
        { label: 'SP3', count: 202 },
        { label: 'RD3', count: 101 },
        { label: 'WE', count: 17 },
        { label: 'ED', count: 7 },
        { label: 'BB', count: 8 },
        { label: 'SG', count: 6 },
        { label: 'BER5', count: 1 },
      ],
      UNITS,
      emptyTotals(),
      STANDARD_ENEMY,
    );
    const journal = buildJournal(stacks, 4, true);
    expect(journal.rounds).toBe(38);
    expect(journal.friendlyHits).toBe(25);
    const expected = parseJournal('totalstack-2026-09-12-journal-mp-bear-army-first.txt');
    compare(
      journal.entries,
      expected.map((entry) => ({ ...entry, label: entry.label === 'BER' ? 'BER5' : entry.label })),
      LABEL_OF,
    );
  });

  it('reproduces journal-mp-bear-enemy-first.txt (37 entries, 24 friendly hits)', () => {
    const stacks = stacksInOrder(
      [
        { label: 'ARC1', count: 655 },
        { label: 'RD1', count: 327 },
        { label: 'RD2', count: 181 },
        { label: 'ARC2', count: 361 },
        { label: 'SP2', count: 361 },
        { label: 'ARC3', count: 203 },
        { label: 'SP3', count: 202 },
        { label: 'RD3', count: 101 },
        { label: 'WE', count: 17 },
        { label: 'ED', count: 7 },
        { label: 'BB', count: 8 },
        { label: 'SG', count: 6 },
        { label: 'BER5', count: 1 },
      ],
      UNITS,
      emptyTotals(),
      STANDARD_ENEMY,
    );
    const journal = buildJournal(stacks, 4, false);
    expect(journal.rounds).toBe(37);
    expect(journal.friendlyHits).toBe(24);
    const expected = parseJournal('totalstack-2026-09-12-journal-mp-bear-enemy-first.txt');
    compare(
      journal.entries,
      expected.map((entry) => ({ ...entry, label: entry.label === 'BER' ? 'BER5' : entry.label })),
      LABEL_OF,
    );
  });
});

describe('closed form for the hit counters', () => {
  it('matches the simulated hit counts for every kill position (N = 1..8, both openings)', () => {
    for (let enemyStacks = 1; enemyStacks <= 8; enemyStacks += 1) {
      for (const armyFirst of [false, true]) {
        const stacks = stacksInOrder(
          Array.from({ length: 14 }, (_, index) => ({ label: 'ARC1', count: 100 + index })),
          UNITS,
          emptyTotals(),
          STANDARD_ENEMY,
        );
        const journal = buildJournal(stacks, enemyStacks, armyFirst);
        const simulated = new Map<number, number>();
        journal.entries
          .filter((entry) => entry.actor === 'army')
          .forEach((entry) => simulated.set(entry.n, entry.hits));
        for (let position = 1; position <= stacks.length; position += 1) {
          const fromJournal = journal.entries.filter((entry) => entry.actor === 'enemy' && entry.hits >= 0)[
            position - 1
          ];
          expect(fromJournal?.hits, `N=${enemyStacks} armyFirst=${armyFirst} p=${position}`).toBe(
            expectedHits(position, enemyStacks, armyFirst),
          );
        }
      }
    }
  });
});
