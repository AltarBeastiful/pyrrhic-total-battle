/**
 * W17 A0 — `CampaignPlan.budgetBound` (`docs/plans/progression-advisor.md` §1): the plan says when the
 * clock cut it, and a plan the clock never reached is the same whatever `budgetMs` it was given. The advisor's
 * pool relies on both: its jobs pass no `budgetMs`, so a phone and a desktop give one answer.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import { getUnits } from '@/data';
import { emptyTotals, planCampaign } from '@/engine';
import type { StackRequest, UnitDef } from '@/engine/types';

/** The small army of `plan-fixes.test.ts`: four troop types and three hired soldiers with a stock. */
function request(): StackRequest {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3);
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000);
  const chosen: UnitDef[] = [...troops.slice(0, 4), ...mercs.slice(0, 3)];
  const caps: Record<string, number> = {};
  for (const merc of mercs.slice(0, 3)) caps[merc.id] = 30;
  return {
    units: chosen,
    caps,
    housing: { leadership: 4_000, authority: 2_000, dominance: 0 },
    totals: emptyTotals(),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
}

const HORIZON = 4;
const TIMEOUT = 60_000;

describe('W17 A0 — budgetBound', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test(
    'no budget and a budget the plan never reaches give the same plan, and neither is budget-bound',
    () => {
      const req = request();
      const open = planCampaign({ request: req, marchTarget: HORIZON });
      const roomy = planCampaign({ request: req, marchTarget: HORIZON, budgetMs: 600_000 });
      expect(open.budgetBound).toBeUndefined();
      expect(roomy.budgetBound).toBeUndefined();
      expect(roomy).toEqual(open);
    },
    TIMEOUT,
  );

  test(
    'a clock that runs out half way marks the plan budget-bound, and a full run is not',
    () => {
      // A clock that moves one millisecond each time it is read: this plan reads it 163 times end to end
      // (2026-10-08), so 80 ms cuts the search after it has a plan and before it has finished.
      let tick = 0;
      vi.spyOn(Date, 'now').mockImplementation(() => (tick += 1));
      const cut = planCampaign({ request: request(), marchTarget: HORIZON, budgetMs: 80 });
      expect(cut.budgetBound).toBe(true);

      tick = 0;
      const full = planCampaign({ request: request(), marchTarget: HORIZON, budgetMs: 1_000_000 });
      expect(full.budgetBound).toBeUndefined();
    },
    TIMEOUT,
  );
});
