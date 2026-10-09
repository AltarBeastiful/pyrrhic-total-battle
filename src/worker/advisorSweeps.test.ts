/** W17 step D: the campaign probes run through the advisor's pass, and one lane or three give one answer. */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { emptyTotals } from '@/engine';
import { horizonProbes, housingSweep, mercStockProbes } from '@/engine/advisor-sweeps';
import type { CampaignInput } from '@/engine/plan';

import { runAdvisor } from './advisor';
import { createInlineClient, type CalcClient } from './client';
import { createCalcPool } from './pool';

function campaign(): CampaignInput {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3).slice(0, 4);
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000).slice(0, 3);
  return {
    request: {
      units: [...troops, ...mercs],
      caps: Object.fromEntries(mercs.map((merc) => [merc.id, 30])),
      housing: { leadership: 4_000, authority: 2_000, dominance: 0 },
      totals: emptyTotals(),
      options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
      enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
      activeEvents: [],
      recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
    },
    marchTarget: CAMPAIGN.marches,
    ...CAMPAIGN.planFixes,
    putBack: CAMPAIGN.putBack,
  };
}

function poolOf(size: number) {
  return createCalcPool({
    size,
    createClient: (): CalcClient => ({ ...createInlineClient(), mode: 'worker' }),
  });
}

describe('the step D probes through the advisor pass', () => {
  test('rows come back in probe order, gains are never negative, and 1 and 3 lanes agree', async () => {
    const input = campaign();
    const probes = [
      ...housingSweep('leadership', [10, 40]),
      ...mercStockProbes(input.request.caps, [50]),
      ...horizonProbes(CAMPAIGN.marches, [3]),
    ];
    const one = poolOf(1);
    const three = poolOf(3);
    const a = await runAdvisor(input, probes, one);
    const b = await runAdvisor(input, probes, three);
    one.dispose();
    three.dispose();
    expect(a.failed).toEqual([]);
    expect(a.cut).toEqual([]);
    expect(a.rows).toHaveLength(probes.length);
    for (const row of a.rows) for (const stop of row.stops) expect(stop.gain).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(b.rows)).toBe(JSON.stringify(a.rows));
  }, 240_000);
});
