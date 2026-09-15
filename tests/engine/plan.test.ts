/**
 * S-55 — `planCampaign`: the campaign planned from the army alone. What is asserted here is the contract the
 * UI relies on, not any particular plan: the counts are fieldable, the marches obey the game's decay of the
 * mercenary stock, the damage each march shows is the battle's own, the frontier is really non-dominated, and
 * a silver budget is respected.
 */
import { describe, expect, test } from 'vitest';

import { getUnits } from '@/data';
import { emptyTotals, planCampaign, planMarch } from '@/engine';
import type { StackRequest, UnitDef } from '@/engine/types';

/** A small but complete army: four troop types and three mercenaries with a stock to spend. */
function request(silver = false): StackRequest {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3);
  // The hired soldiers, not the monster-class units that share the authority pool (a quarter-million HP
  // apiece): a plan has to shelter whatever it fields, so the pool's biggest units are not a test army.
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000);
  expect(troops.length).toBeGreaterThan(2);
  expect(mercs.length).toBeGreaterThan(1);
  const chosen: UnitDef[] = [...troops.slice(0, 4), ...mercs.slice(0, 3)];
  const caps: Record<string, number> = {};
  for (const merc of mercs.slice(0, 3)) caps[merc.id] = 20;
  return {
    units: chosen,
    caps,
    housing: { leadership: 4_000, authority: 2_000, dominance: 0 },
    totals: emptyTotals(),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
    ...(silver ? {} : {}),
  };
}

const used = (req: StackRequest, counts: Record<string, number>, pool: string): number =>
  Object.entries(counts).reduce((sum, [id, count]) => {
    const unit = req.units.find((candidate) => candidate.id === id);
    return unit?.pool === pool ? sum + count * unit.cost : sum;
  }, 0);

// The search is a real one — it walks the march count, the mercenary counts and the ladder — so each case
// gets a budget well above the default five seconds.
const TIMEOUT = 60_000;

describe(
  'planCampaign',
  () => {
    test('sizes a plan whose counts are fieldable and whose damage is the battle’s own', () => {
      const req = request();
      const plan = planCampaign({ request: req });

      expect(plan.marches).toBeGreaterThan(0);
      expect(used(req, plan.march.counts, 'leadership')).toBeLessThanOrEqual(req.housing.leadership);
      expect(used(req, plan.march.counts, 'authority')).toBeLessThanOrEqual(req.housing.authority);

      // The march's own figure is the one `marchResult`/`simulateBattle` gives for those counts.
      const its = planMarch(req, plan.march.counts);
      expect(plan.march.damage).toBe(its.summary.avgDamage);

      // The plan's total is its marches plus its final march, nothing else.
      const repeated = plan.marches - (plan.finale ? 1 : 0);
      const finale = plan.finale ? planMarch(req, plan.finale.counts).summary.avgDamage : 0;
      expect(plan.totalDamage).toBe(repeated * plan.march.damage + finale);
    });

    /**
     * The owner, 2026-09-15: *"a horizon of 1 plays 2 marches"*. `targetRepeats` clamped to a whole repeat
     * (`max(1, planned − 1)`), so a **one-march** target played a repeat *and* a finale. The target is the
     * campaign's total, and a campaign that is not repeated has nothing to leave over for a final march.
     */
    test(
      'plays exactly the marches it was asked for, a target of one included',
      () => {
        const req = request();

        const one = planCampaign({ request: req, marchTarget: 1 });
        expect(one.marches).toBe(1);
        // No finale: a plan of one march leaves nothing over, so the single march is the repeated one.
        expect(one.finaleCounts).toBeUndefined();

        for (const target of [2, 3, 10]) {
          const plan = planCampaign({ request: req, marchTarget: target });
          expect(plan.marches, `a target of ${String(target)} must play ${String(target)} marches`).toBe(
            target,
          );
        }
      },
      TIMEOUT,
    );

    test('never fields more of a mercenary than the stock has, and lasts the marches the stock allows', () => {
      const req = request();
      const plan = planCampaign({ request: req });
      for (const [id, count] of Object.entries(plan.march.mercFielded)) {
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(req.caps[id] ?? 0);
      }
      // Every unit fielded a march is lost at one per chunk of ten, so the stock must cover the plan.
      for (const [id, count] of Object.entries(plan.march.mercFielded)) {
        const chunksLost = Math.ceil(count / 10);
        const repeated = plan.marches - (plan.finale ? 1 : 0);
        expect(repeated * chunksLost).toBeLessThanOrEqual(req.caps[id] ?? 0);
      }
    });

    test('keeps a silver budget and says so', () => {
      const req = request();
      const tight = 2_000_000;
      const plan = planCampaign({ request: req, silverBudget: tight });
      expect(plan.silver).toBeLessThanOrEqual(tight * 1.001);

      // A budget too small to shelter the mercenaries at all is refused rather than quietly broken: the
      // march it would have to field is one the game cannot pay for.
      expect(() => planCampaign({ request: req, silverBudget: 1_000 })).toThrow(/no feasible plan/);
    });

    test('the frontier is non-dominated, cheapest first, and carries the march of each point', () => {
      const req = request();
      const plan = planCampaign({ request: req, alternatives: 8 });
      const rows = plan.alternatives;
      expect(rows.length).toBeGreaterThan(1);
      for (let index = 1; index < rows.length; index += 1) {
        const previous = rows[index - 1];
        const current = rows[index];
        if (!previous || !current) continue;
        expect(current.silver).toBeGreaterThanOrEqual(previous.silver);
      }
      // The frontier property: no plan on it may be beaten by another on *every* resource at once. Damage
      // need not rise with silver — a cheaper plan can burn more mercenaries — so this, not monotonicity, is
      // what "non-dominated" means here.
      for (const a of rows) {
        for (const b of rows) {
          if (a === b) continue;
          const beats =
            b.silver <= a.silver &&
            b.mercLost <= a.mercLost &&
            b.totalDamage >= a.totalDamage &&
            (b.silver < a.silver || b.mercLost < a.mercLost || b.totalDamage > a.totalDamage);
          expect(beats).toBe(false);
        }
      }
      for (const row of rows) {
        expect(Object.keys(row.counts).length).toBeGreaterThan(0);
        const its = planMarch(req, row.counts);
        expect(its.summary.avgDamage).toBeGreaterThan(0);
      }
    });

    test('without a budget it recommends the plan between the two ends of the trade', () => {
      const req = request();
      const plan = planCampaign({ request: req, alternatives: 8 });
      const recommend = plan.recommend;
      expect(recommend).toBeDefined();
      if (!recommend) return;
      // The answer is one of the plans it drew…
      expect(
        plan.alternatives.some(
          (row) => row.silver === recommend.silver && row.totalDamage === recommend.totalDamage,
        ),
      ).toBe(true);
      // …and it sits between the two ends of the trade: it does not beat the silver-efficiency peak on
      // silver, nor the mercenary-efficiency peak on mercenaries. That is what "the compromise" means.
      expect(plan.mostEfficient).toBeDefined();
      expect(plan.mostThrifty).toBeDefined();
      if (plan.mostEfficient) {
        expect(recommend.damagePerSilver).toBeLessThanOrEqual(plan.mostEfficient.damagePerSilver + 1e-6);
      }
      if (plan.mostThrifty) {
        expect(recommend.damagePerMercenary).toBeLessThanOrEqual(plan.mostThrifty.damagePerMercenary + 1e-6);
      }
    });

    test('its marches are the longest the stock allows for the counts it fields', () => {
      const req = request();
      const plan = planCampaign({ request: req, alternatives: 6 });
      for (const row of plan.alternatives) {
        const counts = Object.entries(row.counts).filter(
          ([id]) => req.units.find((unit) => unit.id === id)?.pool === 'authority',
        );
        if (counts.length === 0) continue;
        const repeated = row.marches - (row.finaleCounts ? 1 : 0);
        for (const [id, count] of counts) {
          const held = req.caps[id] ?? 0;
          const lasts = Math.floor((held - count) / Math.ceil(count / 10)) + 1;
          expect(repeated).toBeLessThanOrEqual(lasts);
        }
      }
    });
  },
  TIMEOUT,
);
