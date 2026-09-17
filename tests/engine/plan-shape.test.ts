/**
 * S-55 — the plan's shape, pinned. `plan.test.ts` asserts the *contract* (fieldable counts, the game's decay
 * of the stock, the frontier's non-domination). This file asserts the two things a refactor can break
 * underneath that contract without any contract being violated:
 *
 *  1. **the arithmetic of a shape** — a plan is `K` repeats of one march plus a finale, and the scorer
 *     refuses any shape the stock cannot field;
 *  2. **the quality of the search** — the figures it reaches on a fixed army, frozen. A refactor that
 *     quietly stops looking (at the ladder's scale, at the counts, at the finale) satisfies every invariant
 *     there is while shipping a worse plan; it fails here instead.
 *
 * When a figure below moves, that is the test doing its job: read the new one, satisfy yourself it is better
 * or that the change was intended, and update it here with the reason in the same commit.
 *
 * The plan is computed once for the whole file — the search is a real one, and it is the object under test.
 */
import { describe, expect, test } from 'vitest';

import { getUnits } from '@/data';
import { emptyTotals, planCampaign } from '@/engine';
import { lastsMarches, shapeScorer } from '@/engine/plan';
import type { StackRequest, UnitDef } from '@/engine/types';

/** The small but complete army `plan.test.ts` uses: four troop types, three mercenaries, a stock each. */
function request(mercenaries = 3, stock = 20): StackRequest {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3);
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000);
  const chosen: UnitDef[] = [...troops.slice(0, 4), ...mercs.slice(0, mercenaries)];
  const caps: Record<string, number> = {};
  for (const merc of mercs.slice(0, mercenaries)) caps[merc.id] = stock;
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

const REQUEST = request();
const PLAN = planCampaign({ request: REQUEST });
const SCORE = shapeScorer(REQUEST);

/** The ladder's ten scales as `plan.ts` offers them (`LADDER_GROWTHS`), for the comparison in §4. */
const GRID_SCALES = [1, 1.25, 1.5, 1.8, 2.2, 2.6, 3.2, 4, 5, 6];

/** The mercenary counts of a plan's repeated march, and how many troop rungs stand behind them. */
function split(counts: Record<string, number>): { mercs: Record<string, number>; rungs: number } {
  const mercs: Record<string, number> = {};
  let rungs = 0;
  for (const [id, count] of Object.entries(counts)) {
    if (REQUEST.units.find((unit) => unit.id === id)?.pool === 'authority') mercs[id] = count;
    else rungs += 1;
  }
  return { mercs, rungs };
}

const SHAPE = split(PLAN.march.counts);
const REPEATS = PLAN.marches - (PLAN.finale ? 1 : 0);

describe('the arithmetic of a shape', () => {
  test('the repeated march is one march, whatever the march count', () => {
    const marches = [1, 2, 3, 5, 8, 12].map((K) => {
      const scored = SCORE(K, SHAPE.mercs, SHAPE.rungs, 1.5);
      expect(scored).not.toBeNull();
      return scored;
    });
    const first = marches[0];
    if (!first) throw new Error('no shape scored');
    for (const scored of marches) {
      if (!scored) continue;
      // The whole premise of the planner: the repeats are *one* march, so the same counts, the same
      // damage, the same silver, the same losses — only the finale differs between them.
      expect(scored.march.damage).toBe(first.march.damage);
      expect(scored.march.silver).toBe(first.march.silver);
      expect(scored.march.mercLost).toBe(first.march.mercLost);
      expect(scored.rungs.map((rung) => rung.count)).toEqual(first.rungs.map((rung) => rung.count));
      // And the plan's totals are exactly the repeats plus that finale, nothing else.
      expect(scored.total).toBe(scored.marches * scored.march.damage + (scored.finale?.march.damage ?? 0));
      expect(scored.silver).toBe(scored.marches * scored.march.silver + (scored.finale?.march.silver ?? 0));
    }
  });

  test('the final march burns less stock as the march count grows, and the step is the march where it holds still', () => {
    // The final march is not a repeat — it spends the stock the repeats burned — so marching more leaves it
    // *fewer* units, always. What it does with them is not monotone: fewer troops re-order the kill order,
    // and a mercenary stack that dies later strikes more, so its damage can go up as its size goes down.
    // That is why the drift of the two ratios with K (investigation 0017 §2) is measured, not derived.
    let compared = 0;
    for (let K = 1; K <= 11; K += 1) {
      const at = SCORE(K, SHAPE.mercs, SHAPE.rungs, 1.5);
      const next = SCORE(K + 1, SHAPE.mercs, SHAPE.rungs, 1.5);
      if (!at?.finale || !next?.finale) continue;
      compared += 1;
      expect(next.finale.march.mercLost).toBeLessThanOrEqual(at.finale.march.mercLost);
      // Where the final march has stopped changing, the plan is a pure ray: the step is exactly the repeated
      // march. It does not always stop changing — that depends on the army — so this is checked, not assumed.
      if (next.finale.march.damage === at.finale.march.damage) {
        expect(next.total - at.total).toBe(at.march.damage);
        expect(next.silver - at.silver).toBe(at.march.silver);
      }
    }
    // The plan marches 14 times, so the shape is marchable well past row 12: the loop above really ran.
    expect(compared).toBeGreaterThan(2);
  });

  test('refuses a shape the stock cannot field, and `lastsMarches` is the rule it refuses by', () => {
    // The stock sustains the whole shape only as long as its *tightest* type does — the guard takes the
    // minimum over the types fielded, exactly as `marchesFor` does when the planner derives the count.
    const lasts = Math.min(
      ...Object.entries(SHAPE.mercs).map(([id, count]) => lastsMarches(REQUEST.caps[id] ?? 0, count)),
    );
    expect(Number.isFinite(lasts)).toBe(true);
    expect(SCORE(lasts, SHAPE.mercs, SHAPE.rungs, 1.5)).not.toBeNull();
    expect(SCORE(lasts + 1, SHAPE.mercs, SHAPE.rungs, 1.5)).toBeNull();

    // A count the account does not hold, and a march with no mercenaries at all, are both refused rather
    // than scored: fielding them would burn stock that is not there.
    const tooMany = { ...SHAPE.mercs };
    const [firstId] = Object.keys(tooMany);
    if (firstId) tooMany[firstId] = (REQUEST.caps[firstId] ?? 0) + 1;
    expect(SCORE(1, tooMany, SHAPE.rungs, 1.5)).toBeNull();
    expect(SCORE(1, {}, SHAPE.rungs, 1.5)).toBeNull();

    // The rule is the game's own: a march loses one unit per chunk of ten, for good, and the count has to
    // still be there to field on the last march — floor((held − count) / ceil(count / 10)) + 1.
    expect(lastsMarches(20, 7)).toBe(14);
    expect(lastsMarches(20, 11)).toBe(5);
    expect(lastsMarches(16, 5)).toBe(12);
    expect(lastsMarches(7, 1)).toBe(7);
    expect(lastsMarches(20, 0)).toBe(Infinity);
  });

  test('a budget too large to bind buys the plan no budget buys', () => {
    // The two inputs walk the same grid, but the search caches the final march only when there is no budget
    // (with one, each ladder leaves different silver behind). So this is the check that the two paths agree
    // where the budget cannot matter — and it is the one that would catch a cache read where it does not.
    // A narrower army than the one above: the budgeted path cannot use the cache, so it pays the eighty
    // ladders per shape in full, and this is about agreement rather than size.
    const narrow = request(2, 10);
    const free = planCampaign({ request: narrow });
    const roomy = planCampaign({ request: narrow, silverBudget: free.silver * 4 });
    expect(roomy.totalDamage).toBe(free.totalDamage);
    expect(roomy.silver).toBe(free.silver);
    expect(roomy.mercLost).toBe(free.mercLost);
    expect(roomy.march.counts).toEqual(free.march.counts);
  });

  test('the ladder is searched between the ten scales the grid offers', () => {
    // The planner samples `LADDER_GROWTHS` and hill-climbs on top of it (`plan.ts`, SCALE_STEPS), so for the
    // shape its own plan chose it must reach *at least* what the ten values alone reach — and the finer grid
    // can only add to them, since every one of the ten is on it. How much the finer grid adds depends on the
    // army: on the owner's account it was +5.6 % on one shape (`69-scale-grid`), on this small one the ten
    // values happen to contain the optimum, which is why the assertion is `>=` and not `>`.
    const best = (scales: number[]): number => {
      let damage = 0;
      for (const scale of scales) {
        const scored = SCORE(REPEATS, SHAPE.mercs, SHAPE.rungs, scale);
        if (scored && scored.total > damage) damage = scored.total;
      }
      return damage;
    };
    const fine: number[] = [];
    for (let scale = 1; scale <= 6.0001; scale += 0.05) fine.push(Math.round(scale * 100) / 100);
    expect(best(fine)).toBeGreaterThanOrEqual(best(GRID_SCALES));
    // And the engine's own answer cannot be worse than the grid it started from, on the shape it chose.
    expect(PLAN.totalDamage).toBeGreaterThanOrEqual(best(GRID_SCALES));
  });
}, 120_000);

describe('the search does not get worse', () => {
  test('the plan this army produces, frozen', () => {
    // Measured 2026-09-15 with the ladder's scale hill-climbed (`plan.ts`, SCALE_STEPS).
    expect(PLAN.marches).toBe(15);
    expect(PLAN.totalDamage).toBe(18_331_217);
    expect(PLAN.silver).toBe(33_288_500);
    expect(PLAN.mercLost).toBe(45);
    expect(PLAN.march.counts).toEqual({
      'archer-2': 2_569,
      'archer-3': 1_417,
      'arbalester-6': 7,
      'arbalester-7': 7,
      'chariot-6': 7,
    });
    // 11 → 9 → **3** on 2026-09-15. The list stopped being an even sample of the frontier and became the
    // **named picks** the owner asked for — "a few 4-5 common, good picks to have a slider control how much
    // silver vs merc we want to spend… the algorithm should figure out where are the best spots": the
    // cheapest, the best damage a silver, the sweet spot, the most damage, and the kindest to the stock. On
    // this frontier four of those rules land on distinct plans (the sweet spot *is* the plan the module sized
    // here, and the stock-sparing end is refused by the band as the silver sink it measured as), so the bar
    // carries four stops.
    //
    // `leftOut` stays what it was: not the rows this list lost, but how many of the frontier's plans the bar
    // does **not** carry — the count the UI needs to be honest about the bar it draws. It is a big number
    // because a frontier is a big number: 190 plans here, of which three are worth a stop (the bar carries
    // three since 2026-09-18). Every other figure in this test is unmoved, because the plan is the same plan.
    expect(PLAN.alternatives).toHaveLength(3);
    expect(PLAN.leftOut).toBe(187);
    // Moved 18 → 19 on 2026-09-15, when the grid stopped crossing every mercenary type against every other
    // (`CROSSED_TYPES`, which is what made an account fielding monsters hang) and the climb took the
    // per-type shares over. The plan is the same plan — every figure above is unmoved — and the curve gained
    // the silver level that search reaches.
    expect(PLAN.curve).toHaveLength(19);
  });

  test('and the two rates it reaches are floors, not ceilings', () => {
    // Damage is the objective; the two ratios are the trade. All three may only improve — this is the
    // assertion that fails if the search loses a lever (the scale, the counts, the finale).
    expect(PLAN.totalDamage).toBeGreaterThanOrEqual(18_331_217);
    expect(PLAN.mostEfficient?.damagePerSilver ?? 0).toBeGreaterThanOrEqual(2.49);
    expect(PLAN.mostThrifty?.damagePerMercenary ?? 0).toBeGreaterThanOrEqual(816_726);
    expect(PLAN.recommend).toBeDefined();
    // **Every name is true of the row that wears it** (S-59): no plan the bar carries beats the row named for
    // a figure, on that figure. What the UI may rely on is the names, not the winner's presence — the search
    // maximises the campaign total, where the bar answers about a march, so the plan it settled on is not
    // necessarily one of the four (it is not, on this army).
    const rows = PLAN.alternatives;
    const named = (pick: (typeof rows)[number]['pick']) => rows.find((row) => row.pick === pick);
    const best = (of: (row: (typeof rows)[number]) => number): number => Math.max(...rows.map(of));
    const perSilver = (row: (typeof rows)[number]) =>
      row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : -1;
    expect(named('most-damage')?.repeat.damage).toBe(best((row) => row.repeat.damage));
    // The most-damage end is the bar's best a silver, said as a note rather than offered as a stop.
    expect(named('most-damage')?.bestFor.silver).toBe(true);
    expect(perSilver(named('most-damage') as (typeof rows)[number])).toBe(best(perSilver));
    expect(named('sweet-spot')).toBeDefined();
    // The bar opens on the sweet spot, so the row the engine recommends has to be one of the rows it carries.
    expect(rows.some((row) => row.pick === 'sweet-spot')).toBe(true);
  });
}, 120_000);
