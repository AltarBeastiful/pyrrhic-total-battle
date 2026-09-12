/**
 * S-22 — the kill-order ranking. The reference is the default list TotalStack loads into its custom
 * kill-order editor for this army (fixture `totalstack-2026-09-12-runs.json`, `customKillOrderDefault`).
 */
import { describe, expect, it } from 'vitest';

import { buildKillOrder, eliteOrder } from '../../src/engine/killOrder';
import type { StackingOptions } from '../../src/engine/types';
import { mercenarySet, monsterSet, troopSet } from '../helpers/units';

const OPTIONS: StackingOptions = {
  method: 'elite',
  strictMercsAboveMonsters: false,
  monstersLast: false,
  roundTo10: false,
};
const labelsOf = (units: { id: string; label: string }[], ids: string[]): string[] => {
  const byId = new Map(units.map((unit) => [unit.id, unit.label]));
  return ids.map((id) => byId.get(id) ?? id);
};

describe('Elite Preservation ranking', () => {
  it('matches the captured default list: tier ascending, specialist first, then ranged/melee/mounted', () => {
    const units = [
      ...troopSet('RD3', 'ARC1', 'SP3', 'SW1', 'RD1', 'ARC3', 'SP1', 'RD2', 'ARC2', 'SP2'),
      ...monsterSet('SG', 'ED', 'WE', 'BB'),
    ];
    const order = labelsOf(units, buildKillOrder(units, OPTIONS));
    expect(order.slice(0, 12)).toEqual([
      'SW1',
      'ARC1',
      'SP1',
      'RD1',
      'ARC2',
      'SP2',
      'RD2',
      'ARC3',
      'SP3',
      'RD3',
      'WE',
      'BB',
    ]);
    // Emerald Dragon and Stone Gargoyle are both tier-3 flying monsters: the two captured default lists
    // disagree on their relative position (WE, BB, SG, ED vs WE, BB, ED, SG) and nothing in the sizing
    // depends on it, so only the pair is asserted.
    expect(order.slice(12).sort()).toEqual(['ED', 'SG']);
  });

  it('ranks engineers ahead of every other leadership troop', () => {
    const units = troopSet('ARC1', 'CAT5', 'SP1', 'CAT1');
    expect(labelsOf(units, buildKillOrder(units, OPTIONS))).toEqual(['CAT1', 'CAT5', 'ARC1', 'SP1']);
  });

  it('keeps the three pools apart: leadership, then authority, then dominance', () => {
    const units = [...monsterSet('WE'), ...mercenarySet('BER5'), ...troopSet('RD3')];
    expect(labelsOf(units, buildKillOrder(units, OPTIONS))).toEqual(['RD3', 'BER5', 'WE']);
  });

  it('orders mercenaries and monsters by tier ascending inside their own pool', () => {
    const units = [...mercenarySet('CYC5', 'EMH6', 'ABT6'), ...monsterSet('SG', 'gorgon-medusa')];
    expect(labelsOf(units, buildKillOrder(units, OPTIONS)).slice(0, 3)).toEqual(['CYC5', 'ABT6', 'EMH6']);
    expect(labelsOf(units, buildKillOrder(units, OPTIONS)).slice(3)).toEqual(['SG', 'GM']);
  });

  it('is stable: eliteOrder does not mutate its input', () => {
    const units = troopSet('RD3', 'ARC1');
    const before = units.map((unit) => unit.id);
    eliteOrder(units);
    expect(units.map((unit) => unit.id)).toEqual(before);
  });
});

describe('custom order', () => {
  const units = troopSet('ARC1', 'SP1', 'RD1', 'ARC2');

  it('keeps the user list and appends everything left out in Elite-Preservation order', () => {
    const order = buildKillOrder(units, {
      ...OPTIONS,
      method: 'custom',
      customOrder: ['rider-1', 'archer-2'],
    });
    expect(labelsOf(units, order)).toEqual(['RD1', 'ARC2', 'ARC1', 'SP1']);
  });

  it('ignores ids that are not in the formation', () => {
    const order = buildKillOrder(units, {
      ...OPTIONS,
      method: 'custom',
      customOrder: ['water-elemental', 'spearman-1'],
    });
    expect(labelsOf(units, order)).toEqual(['SP1', 'ARC1', 'RD1', 'ARC2']);
  });

  it('falls back to the Elite-Preservation ranking when the list is empty', () => {
    expect(buildKillOrder(units, { ...OPTIONS, method: 'custom', customOrder: [] })).toEqual(
      buildKillOrder(units, OPTIONS),
    );
  });
});
