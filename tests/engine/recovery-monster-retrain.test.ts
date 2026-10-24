/**
 * Owner, 2026-10-24: a monster is retrained the way a G1 troop is. Every dead unit is trained again at its full
 * price — silver, queue time, and for a monster dragon coins — with no Temple and no 90 % in it.
 */
import { describe, expect, test } from 'vitest';

import { recoveryCosts, retrainOne } from '@/engine/recovery';
import type { Stack } from '@/engine/types';

import { monsterSet, troopSet } from '../helpers/units';

const UNITS = [...troopSet('ARC1', 'SP1'), ...monsterSet('WE', 'BB')];
const unit = (label: string) => UNITS.find((u) => u.label === label)!;
const settings = { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } } as const;

describe('retraining a monster', () => {
  test.each([18, 40, 7])('%i monsters cost n × silver, n × dragon coins and n × queue, and no gold', (n) => {
    const wyvern = unit('WE');
    const cost = retrainOne(wyvern, n, settings);
    expect(cost.silver).toBe(n * wyvern.training!.silver);
    expect(cost.dragonCoins).toBe(n * (wyvern.training!.dragonCoins ?? 0));
    expect(cost.seconds).toBe(n * wyvern.training!.seconds);
    expect(cost.gold).toBe(0);
  });

  test('a monster and a troop are billed by the same rule: per unit', () => {
    const stacks = [
      { unitId: unit('ARC1').id, count: 25 },
      { unitId: unit('BB').id, count: 25 },
    ] as Stack[];
    const total = recoveryCosts(stacks, UNITS, settings).plan;
    expect(total.silver).toBe(25 * unit('ARC1').training!.silver + 25 * unit('BB').training!.silver);
  });
});
