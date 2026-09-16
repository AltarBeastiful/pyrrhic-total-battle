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
import type { PlanRepeat } from '@/engine/plan';

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

    test('the bar carries the four answers, and each name is true of the row that wears it', () => {
      const req = request();
      const plan = planCampaign({ request: req, alternatives: 6 });
      const rows = plan.alternatives;

      // Four at most, and never the same answer twice — two rules that land on one plan are one row.
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.length).toBeLessThanOrEqual(4);
      expect(new Set(rows.map((row) => row.pick)).size).toBe(rows.length);

      // Cheapest first, because the bar is read left to right as "spend less … spend more".
      const silver = rows.map((row) => row.silver);
      expect([...silver].sort((a, b) => a - b)).toEqual(silver);

      // The bar opens on the sweet spot, so the plan the engine recommends is one of the rows it carries —
      // and it is the same plan, not a copy that drifted.
      const sweet = rows.find((row) => row.pick === 'sweet-spot');
      expect(sweet).toBeDefined();
      expect(plan.recommend?.counts).toEqual(sweet?.counts);

      // **The name is a definition, stated on the figures the row itself carries**: no other row beats the
      // one named for a figure, on that figure. A `best-for-silver` row may be absent — when the sweet spot
      // is itself the best for silver, the name is not handed down to the runner-up. A `most-damage` row is
      // always there, because some row of a non-empty list is its biggest.
      const perSilver = (row: (typeof rows)[number]) =>
        row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : -1;
      const best = (of: (row: (typeof rows)[number]) => number) => Math.max(...rows.map(of));
      expect(rows.find((row) => row.pick === 'most-damage')?.repeat.damage).toBe(
        best((row) => row.repeat.damage),
      );
      const efficient = rows.find((row) => row.pick === 'best-for-silver');
      if (efficient) expect(perSilver(efficient)).toBe(best(perSilver));

      // The three answers other than the sweet spot are drawn from the plans **inside the band** — the
      // owner's "just don't show the extremes": at least half the hired units the plan's own march fields,
      // and more than one troop stack. (The sweet spot is offered whether or not the band would keep it: it
      // is the recommendation, and where the bar opens.)
      const mercIds = new Set(req.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id));
      const hiredOf = (counts: Record<string, number>) =>
        Object.entries(counts).reduce((sum, [id, count]) => sum + (mercIds.has(id) ? count : 0), 0);
      const troopsOf = (counts: Record<string, number>) =>
        Object.keys(counts).filter((id) => !mercIds.has(id)).length;
      for (const row of rows) {
        if (row.pick === 'sweet-spot') continue;
        expect(hiredOf(row.counts) * 2, row.pick).toBeGreaterThanOrEqual(hiredOf(plan.counts));
        expect(troopsOf(row.counts), row.pick).toBeGreaterThan(1);
      }

      // The shape sentence the experiments read is still carried beside the identity — the two are not a
      // second opinion on a number, and the record in `tools/theorycraft/63`…`86` still reproduces.
      for (const row of rows) expect(row.label).toContain('silver a march');

      // What the bar does not offer is counted, and the count can never exceed the frontier it came from.
      expect(plan.leftOut).toBeGreaterThanOrEqual(0);
    });

    test('the sweet spot is the middle of the trade in hired stock', () => {
      // The owner, 2026-09-16: *"the sweet spot seems to be too similar with silver save, especially for merc
      // spends."* The rule was the plan closest to the best on both ratios, which walks to the silver end and
      // burns as much stock as the dearest plan on the bar; it is now the **middle of the trade's own stock
      // range**, which is a statement about the plans the bar can carry rather than about the search's peaks
      // (`tools/theorycraft/out/90-the-sweet-spot.md`).
      const req = request();
      const plan = planCampaign({ request: req, alternatives: 8, withTrade: true });
      const trade = plan.trade ?? [];
      const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot');
      expect(sweet).toBeDefined();
      expect(trade.length).toBeGreaterThan(2);

      const burns = trade.map((row) => row.repeat.mercLost);
      const middle = (Math.min(...burns) + Math.max(...burns)) / 2;
      const reach = (row: { repeat: { mercLost: number } }): number => Math.abs(row.repeat.mercLost - middle);

      // Nobody is nearer the middle of the range than it is…
      for (const row of trade) {
        expect(reach(row), 'a plan outside the trade beats the sweet spot').toBeGreaterThanOrEqual(
          reach(sweet as { repeat: { mercLost: number } }),
        );
      }
      // …and among the plans that burn the same, it does the most with it. (Where two plans sit either side of
      // the middle, the thriftier side wins — a band narrow enough to have no side of its own is the case
      // where the choice would otherwise fall back to the dearest plan on the bar.)
      const sameBurn = trade.filter((row) => row.repeat.mercLost === sweet?.repeat.mercLost);
      expect(sameBurn.length).toBeGreaterThan(0);
      for (const row of sameBurn) {
        expect(sweet?.repeat.damage).toBeGreaterThanOrEqual(row.repeat.damage);
      }
      // Which is what makes the recommendation a genuine middle rather than an end: on an army whose trade
      // spans a range, it is not the plan that burns the most, and not the plan that burns the least.
      expect(burns.length).toBeGreaterThan(2);
      if (Math.max(...burns) > Math.min(...burns)) {
        expect(sweet?.repeat.mercLost).toBeLessThan(Math.max(...burns));
      }
    });

    test('the burn axis: one plan a burn level, thriftiest first, the same sweet spot', () => {
      // Review of 2026-09-16 (`tools/theorycraft/out/91-cross-review.md`): behind `barAxis: 'burn'` the bar
      // runs along hired units burned a march. The sweet spot is the very plan the silver axis recommends,
      // so the flag changes what stands beside the recommendation and never the recommendation itself.
      const req = request();
      const silver = planCampaign({ request: req, alternatives: 4, withTrade: true });
      const burn = planCampaign({ request: req, alternatives: 4, withTrade: true, barAxis: 'burn' });
      expect(silver.barAxis).toBe('silver');
      expect(burn.barAxis).toBe('burn');
      expect(burn.recommend?.counts).toEqual(silver.recommend?.counts);

      const rows = burn.alternatives;
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.length).toBeLessThanOrEqual(4);
      // Sorted by burn, and no two stops burn the same: the ladder is one plan a level.
      const burns = rows.map((row) => row.repeat.mercLost);
      expect([...burns].sort((a, b) => a - b)).toEqual(burns);
      expect(new Set(burns).size).toBe(burns.length);
      // Each stop is the best march at its burn level among the plans the bar may carry.
      const trade = burn.trade ?? [];
      for (const row of rows) {
        const level = trade.filter((other) => other.repeat.mercLost === row.repeat.mercLost);
        expect(Math.max(...level.map((other) => other.repeat.damage))).toBe(row.repeat.damage);
      }
      // The ends are named; the sweet spot is on the bar; a filler is a `step`, and nothing else is.
      expect(rows.find((row) => row.pick === 'most-damage')?.repeat.damage).toBe(
        Math.max(...trade.map((other) => other.repeat.damage)),
      );
      expect(rows.some((row) => row.pick === 'sweet-spot')).toBe(true);
      for (const row of rows) {
        expect(['spare-the-stock', 'sweet-spot', 'step', 'most-damage']).toContain(row.pick);
      }
      // Every stop carries the gold its march's hired stacks cost, and it grows with the burn.
      for (const row of rows) expect(row.repeat.gold).toBeGreaterThanOrEqual(0);
      const golds = rows.map((row) => row.repeat.gold);
      expect([...golds].sort((a, b) => a - b)).toEqual(golds);
    });

    test('merging near stops: two plans that burn the same and sit within the tolerance are one stop', () => {
      // The candidate fix to the silver axis (`mergeNearStops`): measured on the owner's bar, `best-for-silver`
      // and `most-damage` burned 22 each at 6 905 207 and 6 920 621 damage a march — one plan to the eye.
      const req = request();
      const loose = planCampaign({ request: req, alternatives: 6 });
      const tight = planCampaign({ request: req, alternatives: 6, mergeNearStops: 0.02 });
      const near = (a: { repeat: PlanRepeat }, b: { repeat: PlanRepeat }): boolean =>
        a.repeat.mercLost === b.repeat.mercLost &&
        Math.abs(a.repeat.damage - b.repeat.damage) <= 0.02 * Math.max(a.repeat.damage, b.repeat.damage) &&
        Math.abs(a.repeat.silver - b.repeat.silver) <= 0.02 * Math.max(a.repeat.silver, b.repeat.silver);
      // No two surviving stops are near each other…
      for (const a of tight.alternatives) {
        for (const b of tight.alternatives) {
          if (a !== b) expect(near(a, b)).toBe(false);
        }
      }
      // …every survivor is one of the stops the loose bar carried, the sweet spot survives, and the merge
      // never invents a row.
      for (const row of tight.alternatives) {
        expect(
          loose.alternatives.some((other) => JSON.stringify(other.counts) === JSON.stringify(row.counts)),
        ).toBe(true);
      }
      expect(tight.alternatives.some((row) => row.pick === 'sweet-spot')).toBe(true);
      expect(tight.alternatives.length).toBeLessThanOrEqual(loose.alternatives.length);
      // With the tolerance at zero, nothing changes.
      const off = planCampaign({ request: req, alternatives: 6, mergeNearStops: 0 });
      expect(off.alternatives).toEqual(loose.alternatives);
    });
  },
  TIMEOUT,
);
