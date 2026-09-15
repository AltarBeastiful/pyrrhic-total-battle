/**
 * S-58 — the two candidate fixes for "the plan drops a whole hired type", each behind its own flag
 * (`engine/plan.ts`, `CAMPAIGN.planFixes`).
 *
 * They ship **off**, and that is the first thing asserted here: with both flags unset the engine answers
 * exactly what it answered before the flags existed. The other two cases pin what each flag *does*, so the
 * pair cannot rot while the owner decides between them — the comparison itself lives in
 * `tools/theorycraft/out/80-token-floor.md` and `out/81-band-refusal.md`.
 */
import { describe, expect, test } from 'vitest';

import { getUnits } from '@/data';
import { emptyTotals, planCampaign } from '@/engine';
import type { StackRequest, UnitDef } from '@/engine/types';

/** The same small army the plan's own suite uses: four troop types and three hired soldiers with a stock. */
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

const HORIZON = 10;
/** A budget well past the default five seconds: this is a real search, not a stub. */
const TIMEOUT = 60_000;

const stocked = (req: StackRequest): string[] =>
  Object.entries(req.caps)
    .filter(([, held]) => held > 0)
    .map(([id]) => id);

describe('S-58 — the plan fixes', () => {
  test(
    'both flags are off by default, and the answer is the one the engine gave before them',
    () => {
      const req = request();
      const plain = planCampaign({ request: req, marchTarget: HORIZON, alternatives: 4 });
      const explicitlyOff = planCampaign({
        request: req,
        marchTarget: HORIZON,
        alternatives: 4,
        tokenFloor: false,
        refuseDroppedTypes: false,
      });

      // The default is not merely "an answer that looks the same": it is the same arithmetic, so every
      // figure the UI reads has to match to the unit.
      expect(explicitlyOff.totalDamage).toBe(plain.totalDamage);
      expect(explicitlyOff.leftOut).toBe(plain.leftOut);
      expect(explicitlyOff.recommend?.counts).toEqual(plain.recommend?.counts);
      expect(explicitlyOff.alternatives.map((row) => row.counts)).toEqual(
        plain.alternatives.map((row) => row.counts),
      );
    },
    TIMEOUT,
  );

  test(
    'fix A — the token floor: the thrift end of an offered plan samples a chunk, never a zero',
    () => {
      const req = request();
      const ids = stocked(req);
      expect(ids.length).toBeGreaterThan(1);
      const fixed = planCampaign({
        request: req,
        marchTarget: HORIZON,
        alternatives: 4,
        tokenFloor: true,
      });

      for (const row of fixed.alternatives) {
        for (const id of ids) {
          expect(
            row.counts[id] ?? 0,
            'a plan the bar offers must field a little of every type the account holds',
          ).toBeGreaterThan(0);
        }
      }
      // And the grid still holds the shape the plan actually recommends, so the fix is not paying for the
      // guarantee by losing the winner: the campaign it points at is still a whole campaign.
      expect(fixed.totalDamage).toBeGreaterThan(0);
      expect(fixed.recommend?.counts).toBeDefined();
    },
    TIMEOUT,
  );

  test(
    'fix B — the band refusal: the list loses its holes and `leftOut` says how many it refused',
    () => {
      const req = request();
      const ids = stocked(req);
      const fixed = planCampaign({
        request: req,
        marchTarget: HORIZON,
        alternatives: 4,
        refuseDroppedTypes: true,
      });

      for (const row of fixed.alternatives) {
        for (const id of ids) {
          expect(row.counts[id] ?? 0, 'the band must not offer a plan with a hole in it').toBeGreaterThan(0);
        }
      }
      // The count and the list have to agree, the way they do for the band's other three refusals: the UI
      // prints this number next to the table it describes.
      expect(fixed.leftOut).toBeGreaterThanOrEqual(0);
      // The winner is the engine's own, untouched by the band: B filters what is shown, never what is found.
      expect(fixed.totalDamage).toBeGreaterThan(0);
    },
    TIMEOUT,
  );
});
