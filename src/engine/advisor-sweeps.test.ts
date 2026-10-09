/** W17 step D: the campaign-level probes are pure edits, and the sweep's curve finds where it flattens. */
import { describe, expect, test } from 'vitest';

import { getUnits } from '@/data';
import { emptyTotals } from '@/engine';
import type { CampaignInput } from '@/engine/plan';

import {
  curveOfRows,
  horizonProbes,
  housingSweep,
  isCampaignProbe,
  mercStockProbes,
  nextTierProbes,
  silverProbes,
  sweepCurve,
} from './advisor-sweeps';
import type { StackRequest } from './types';

function input(): CampaignInput {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3).slice(0, 4);
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000).slice(0, 3);
  const request: StackRequest = {
    units: [...troops, ...mercs],
    caps: Object.fromEntries(mercs.map((merc) => [merc.id, 30])),
    housing: { leadership: 4_000, authority: 2_000, dominance: 1_000 },
    totals: emptyTotals(),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
  return { request, marchTarget: 4 };
}

describe('sweepCurve', () => {
  test('finds the first step whose marginal gain falls under the threshold', () => {
    // 0→2 %: +4 (2/pt), 2→4: +2 (1/pt), 4→8: +0.1 (0.025/pt) flat
    const curve = sweepCurve([2, 4, 8, 16], [4, 6, 6.1, 6.1], 0.05);
    expect(curve.flatAt).toBe(2);
    expect(curve.peakPercent).toBe(4);
    expect(curve.monotone).toBe(true);
  });

  test('still climbing at the last step: no peak', () => {
    const curve = sweepCurve([2, 4], [1, 2], 0.05);
    expect(curve.flatAt).toBeNull();
    expect(curve.peakPercent).toBeNull();
  });

  test('a first step that is already flat peaks at 0', () => {
    expect(sweepCurve([2, 4], [0, 0], 0.05).peakPercent).toBe(0);
  });

  test('a dip is flagged and read on the running maximum, and a gain is never negative', () => {
    const curve = sweepCurve([2, 4, 8], [5, 3, -1], 0.05);
    expect(curve.monotone).toBe(false);
    expect(curve.points.every((point) => point.gain >= 0 && point.marginal >= 0)).toBe(true);
    expect(curve.flatAt).toBe(1);
  });

  test('curveOfRows maps rows to steps and treats a missing row as no gain', () => {
    const curve = curveOfRows([], [2, 4]);
    expect(curve.points.map((point) => point.gain)).toEqual([0, 0]);
  });
});

describe('campaign probes', () => {
  test('a housing sweep is one probe per step, with housingProbe rounding, and never mutates', () => {
    const base = input();
    const before = JSON.stringify(base);
    const probes = housingSweep('dominance', [2, 50]);
    expect(probes.map((probe) => probe.id)).toEqual(['sweep:dominance:2', 'sweep:dominance:50']);
    const out = probes[1]!.applyInput(base);
    expect(out.request.housing.dominance).toBe(1_500);
    expect(out.request.units).toBe(base.request.units);
    expect(JSON.stringify(base)).toBe(before);
    expect(isCampaignProbe(probes[0]!)).toBe(true);
  });

  test('the next tier adds only the units not already in', () => {
    const base = input();
    const extra = getUnits().find(
      (unit) => unit.pool === 'leadership' && !base.request.units.includes(unit),
    )!;
    const [probe] = nextTierProbes([
      { label: 'guardsmen', units: [extra, base.request.units[0]!] },
      { label: 'none', units: [] },
    ]);
    const out = probe!.applyInput(base);
    expect(out.request.units).toHaveLength(base.request.units.length + 1);
    expect(nextTierProbes([{ label: 'none', units: [] }])).toEqual([]);
  });

  test('more merc stock raises every finite cap by a step of at least one chunk, and counts what it added', () => {
    const base = input();
    const probes = mercStockProbes(base.request.caps, [10, 50]);
    const small = probes[0]!.applyInput(base);
    expect(Object.values(small.request.caps)).toEqual([40, 40, 40]);
    expect(probes[0]!.mercAdded).toBe(30);
    expect(probes[1]!.mercAdded).toBe(45);
    expect(mercStockProbes({}, [10])).toEqual([]);
  });

  test('the horizon skips the baseline and edits the request input, not the config', () => {
    const probes = horizonProbes(4, [3, 4, 5]);
    expect(probes.map((probe) => probe.id)).toEqual(['campaign:horizon:3', 'campaign:horizon:5']);
    expect(probes[1]!.applyInput(input()).marchTarget).toBe(5);
  });

  test('silver is plus and minus with a budget, minus only without one, and never below 0', () => {
    expect(silverProbes({ silverBudget: 1_000 }, 1_000).map((probe) => probe.id)).toEqual([
      'campaign:silver:plus',
      'campaign:silver:minus',
    ]);
    const plus = silverProbes({ silverBudget: 1_000 }, 1_000)[0]!.applyInput(input());
    expect(plus.silverBudget).toBe(1_100);
    const only = silverProbes({}, 1_000);
    expect(only).toHaveLength(1);
    expect(only[0]!.applyInput(input()).silverBudget).toBe(900);
    expect(silverProbes({}, 5, 1_000)[0]!.applyInput(input()).silverBudget).toBe(0);
  });
});
