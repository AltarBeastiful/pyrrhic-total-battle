/**
 * S-34 — Battle Summary. Minimum / maximum / average, damage by pool and the derived ratios.
 *
 * Our summary deliberately uses the **journal** per-hit value (the strength-against part counted once).
 * TotalStack's summary counts it twice (`base + 2 × features`, battle-model-observations §2) for a reason
 * nobody has been able to explain, and the in-game reports show the journal value. So a captured MINIMUM
 * cannot be asserted directly: the tests below assert our minimum against the sum of the journal's own
 * damage lines, and then check that adding the journal's features back a second time lands on TotalStack's
 * published number.
 */
import { describe, expect, it } from 'vitest';

import { buildJournal, enemySquadCount, simulateBattle } from '../../src/engine/battle';
import { emptyTotals } from '../../src/engine/bonuses';
import { sizeStacks } from '../../src/engine/stacker';
import { parseJournal } from '../helpers/journal';
import {
  ARACHNE_ENEMY,
  STANDARD_ENEMY,
  countsByLabel,
  makeRequest,
  stacksInOrder,
  totalsFrom,
} from '../helpers/request';
import { mercenarySet, monsterSet, troopSet } from '../helpers/units';

const UNITS = [
  ...troopSet('ARC1', 'SP2', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3'),
  ...monsterSet('WE', 'BB', 'ED', 'SG'),
  ...mercenarySet('BER5'),
];
const EP8_ORDER = [
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
];

describe('minimum damage', () => {
  it("is the enemy-first journal total, and +Σ features lands on TotalStack's MINIMUM (2,428,230)", () => {
    const stacks = stacksInOrder(EP8_ORDER, UNITS, emptyTotals(), STANDARD_ENEMY);
    const journal = buildJournal(stacks, 4, false);
    const captured = parseJournal('totalstack-2026-09-12-journal-ep-enemy-first.txt');

    const friendly = captured.filter((entry) => entry.actor === 'army');
    // The transcript prints the features figure only on a squad's first hit.
    const features = new Map<string, number>();
    for (const entry of friendly) {
      if (entry.features !== undefined && !features.has(entry.label)) {
        features.set(entry.label, entry.features);
      }
    }
    const damageSum = friendly.reduce((sum, entry) => sum + entry.damage, 0);
    const featureSum = friendly.reduce((sum, entry) => sum + (features.get(entry.label) ?? 0), 0);

    expect(journal.totalDamage).toBe(damageSum);
    // TotalStack's own number, reached by counting the features a second time (±2 of rounding).
    expect(Math.abs(damageSum + featureSum - 2_428_230)).toBeLessThanOrEqual(2);
  });
});

describe('summary of run ep-8stacks', () => {
  const units = [
    ...troopSet('ARC1', 'SP2', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3'),
    ...monsterSet('WE', 'BB', 'ED', 'SG'),
  ];
  const request = makeRequest({ units });
  const result = sizeStacks(request);
  const summary = simulateBattle(result, request);

  it('reports the 12 stacks of the run', () => {
    expect(summary.stackCount).toBe(12);
  });

  it('keeps minimum ≤ average ≤ maximum, the average being exactly the midpoint', () => {
    expect(summary.minDamage).toBeLessThanOrEqual(summary.avgDamage);
    expect(summary.avgDamage).toBeLessThanOrEqual(summary.maxDamage);
    expect(summary.avgDamage).toBe(Math.round((summary.minDamage + summary.maxDamage) / 2));
  });

  it('reports the two journals\u2019 own sums, the way a battle report adds up (S-30, 2026-09-13)', () => {
    // The game prints no total damage: you add up the hit lines. So both bounds are exactly those sums and
    // a user can reconcile a real report against one of them. Procs stay upside we do not price in.
    expect(summary.minDamage).toBe(summary.journals.enemyFirst.totalDamage);
    expect(summary.maxDamage).toBe(summary.journals.armyFirst.totalDamage);
    expect(summary.avgDamage).toBe(Math.round((summary.minDamage + summary.maxDamage) / 2));
    const riders = result.stacks.filter((stack) => stack.doubleDamageChance > 0);
    expect(riders.length).toBeGreaterThan(0);
    expect(summary.maxDamage).toBeLessThan(
      summary.journals.armyFirst.totalDamage * (1 + riders[0]!.doubleDamageChance / 100),
    );
  });

  it('splits the average across the pools it came from', () => {
    const total = Object.values(summary.damageByPool).reduce((sum, value) => sum + value, 0);
    expect(Math.abs(total - summary.avgDamage)).toBeLessThanOrEqual(2);
    expect(summary.damageByPool.authority).toBe(0);
    expect(summary.damageByPool.dominance).toBeGreaterThan(0);
  });

  it('divides the average by the recovery plan to get the three ratios', () => {
    expect(summary.recovery.silver).toBe(1_435_200);
    expect(summary.recovery.dragonCoins).toBe(1_080);
    expect(summary.damagePerSilver).toBeCloseTo(summary.avgDamage / summary.recovery.silver, 6);
    expect(summary.damagePerDragonCoin).toBeCloseTo(summary.avgDamage / 1_080, 6);
    // **And no gold at all under a retrain** (2026-09-21): this army hires nothing, and a monster is
    // recruited again in the Lair rather than bought back from the Temple, so the third purse is not
    // opened. A ratio with nothing under the line is reported as nought, never as `Infinity`.
    expect(summary.recovery.gold).toBe(0);
    expect(summary.damagePerGold).toBe(0);
  });

  it('carries the model notes the UI shows next to the numbers', () => {
    expect(summary.modelNotes.length).toBeGreaterThan(4);
    expect(summary.modelNotes.join(' ')).toMatch(/strike-two-squads is not modelled/i);
  });
});

describe("Arachne's event", () => {
  it('only changes the enemy formation: 8 squads, 26 entries, 14 friendly hits', () => {
    expect(enemySquadCount(ARACHNE_ENEMY)).toBe(8);
    const stacks = stacksInOrder(
      [
        { label: 'RD1', count: 328 },
        { label: 'ARC1', count: 653 },
        { label: 'RD2', count: 181 },
        { label: 'ARC2', count: 361 },
        { label: 'SP2', count: 361 },
        { label: 'ARC3', count: 203 },
        { label: 'SP3', count: 202 },
        { label: 'RD3', count: 101 },
        { label: 'WE', count: 18 },
        { label: 'ED', count: 7 },
        { label: 'BB', count: 8 },
        { label: 'SG', count: 6 },
      ],
      UNITS,
      totalsFrom({
        health: { army: 25, guardsmen: 20 },
        strength: { army: 25, guardsmen: 20 },
      }),
      ARACHNE_ENEMY,
    );
    const journal = buildJournal(stacks, 8, false);
    expect(journal.rounds).toBe(26);
    expect(journal.friendlyHits).toBe(14);
    // Per-hit damage is unchanged by the event (fixture bonus-event-arachne).
    expect(journal.entries.find((entry) => entry.unitId === 'emerald-dragon')?.damage).toBe(97_650);
  });
});

describe('mechanics runs', () => {
  it('leaves the stack counts untouched under the uniform title Battlemaster bonus', () => {
    const units = [
      ...troopSet('ARC1', 'SP2', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3'),
      ...monsterSet('WE', 'BB', 'ED', 'SG'),
    ];
    const zero = sizeStacks(makeRequest({ units }));
    const titled = sizeStacks(
      makeRequest({
        units,
        totals: totalsFrom({
          health: { army: 150 },
          strength: { army: 150 },
          special: { doubleDamageChance: 5, strikeTwoSquadsChance: 5 },
        }),
      }),
    );
    expect(countsByLabel(titled, units)).toEqual(countsByLabel(zero, units));
  });

  it('reproduces the first Battlemaster journal entries (ARC1 103,818 of which 21,943 features)', () => {
    const stacks = stacksInOrder(
      EP8_ORDER,
      UNITS,
      totalsFrom({
        health: { army: 150 },
        strength: { army: 150 },
        special: { doubleDamageChance: 5, strikeTwoSquadsChance: 5 },
      }),
      STANDARD_ENEMY,
    );
    const journal = buildJournal(stacks, 4, false);
    expect(journal.entries.slice(0, 5).map((entry) => entry.damage)).toEqual([
      256_500, 103_818, 245_625, 103_005, 245_250,
    ]);
    // The 5 % chances never touch a journal line; they only move the average.
    expect(journal.entries[1]?.featuresDamage).toBe(21_943);
  });

  it('reproduces run captain-bernard-ranged (ARC1 706 × 165 = 116,490)', () => {
    const units = troopSet('ARC1', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3');
    const result = sizeStacks(
      makeRequest({
        units,
        housing: { dominance: 0 },
        totals: totalsFrom({ health: { ranged: 10 }, strength: { ranged: 10 } }),
      }),
    );
    const archer = result.stacks.find((stack) => stack.unitId === 'archer-1');
    expect(archer?.count).toBe(706);
    expect(archer?.hpPerUnit).toBe(165);
    expect(archer?.totalHp).toBe(116_490);
    expect(result.stacks.find((stack) => stack.unitId === 'rider-1')?.totalHp).toBe(116_400);
  });
});

describe('degenerate inputs', () => {
  it('survives an empty army and a formation with no squads', () => {
    const request = makeRequest({ units: [], enemy: { flying: 0, melee: 0, ranged: 0, mounted: 0 } });
    const summary = simulateBattle(sizeStacks(request), request);
    expect(summary.stackCount).toBe(0);
    expect(summary.minDamage).toBe(0);
    expect(summary.avgDamage).toBe(0);
    expect(summary.damagePerSilver).toBe(0);
    expect(summary.journals.enemyFirst.entries).toEqual([]);
  });

  it('drops every unit type when there is no housing at all', () => {
    const units = troopSet('ARC1', 'RD1');
    const result = sizeStacks(makeRequest({ units, housing: { leadership: 0, authority: 0, dominance: 0 } }));
    expect(result.stacks).toEqual([]);
    expect(result.dropped.map((entry) => entry.unitId)).toEqual(['archer-1', 'rider-1']);
  });

  it('never loops forever when a single enemy squad faces a single stack', () => {
    const units = troopSet('ARC1');
    const request = makeRequest({
      units,
      housing: { leadership: 10, authority: 0, dominance: 0 },
      enemy: { flying: 1, melee: 0, ranged: 0, mounted: 0 },
    });
    const summary = simulateBattle(sizeStacks(request), request);
    expect(summary.journals.enemyFirst.entries).toHaveLength(1);
    expect(summary.journals.enemyFirst.friendlyHits).toBe(0);
    expect(summary.journals.armyFirst.friendlyHits).toBe(1);
  });
});

describe('QA regression: average must never exceed the maximum', () => {
  it('orders the three figures on the ten-troop-type, leadership 4100 march', () => {
    const units = troopSet('SW1', 'ARC1', 'SP1', 'SP2', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3');
    const request = makeRequest({
      units,
      housing: { leadership: 4100, authority: 0, dominance: 0 },
    });
    const summary = simulateBattle(sizeStacks(request), request);

    // Both bounds are the journals' own sums (S-30); the riders' double-damage chance is upside on top.
    expect(summary.minDamage).toBe(925_723);
    expect(summary.avgDamage).toBe(944_473);
    expect(summary.maxDamage).toBe(963_223);
    expect(summary.minDamage).toBeLessThan(summary.avgDamage);
    expect(summary.avgDamage).toBeLessThan(summary.maxDamage);
  });

  it('holds for every captured army and both preservation methods', () => {
    const armies = [
      makeRequest({
        units: [
          ...troopSet('ARC1', 'SP2', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3'),
          ...monsterSet('WE', 'BB', 'ED', 'SG'),
        ],
      }),
      makeRequest({
        units: [
          ...troopSet('SW1', 'ARC1', 'SP1', 'SP2', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3'),
          ...monsterSet('WE', 'BB', 'ED', 'SG'),
        ],
        options: { method: 'ms' },
      }),
      makeRequest({
        units: [
          ...troopSet('ARC1', 'SP2', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3'),
          ...mercenarySet('BER5'),
        ],
        caps: { 'bear-5': 6 },
        options: { method: 'ms', roundTo10: true },
      }),
    ];
    for (const request of armies) {
      const summary = simulateBattle(sizeStacks(request), request);
      expect(summary.minDamage).toBeLessThanOrEqual(summary.avgDamage);
      expect(summary.avgDamage).toBeLessThanOrEqual(summary.maxDamage);
      const byPool = Object.values(summary.damageByPool).reduce((sum, value) => sum + value, 0);
      expect(Math.abs(byPool - summary.avgDamage)).toBeLessThanOrEqual(2);
    }
  });
});
