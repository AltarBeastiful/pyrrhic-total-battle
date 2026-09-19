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
    //
    // **Re-based 2026-09-18**, when the sweep after the hill-climb began scoring each of its levels **per
    // unit** as well as rounded up to a whole chunk. Nothing was taken away — the levels and the vectors the
    // sweep walked before are walked in the same order, verified vector by vector against HEAD on six armies —
    // and the per-unit vectors are extra shapes on top. On this army they find a better campaign, which is
    // what this test exists to notice: **18 333 467 → 18 617 972** damage over 15 → **17** marches, fielding
    // five of each hired type a march instead of seven (a thriftier march lasts longer), for
    // 33 284 700 → 37 966 200 silver and 45 → **51** hired units lost. Damage is the objective and it went up.
    //
    // **Re-based 2026-09-19 (S-94): the plan's damage is the enemy-first journal's, not the midpoint of the
    // two openings** (`engine/plan.ts`, `marchOf` — the owner: *"it's too risky for me to spend 3M silver on
    // a coin flip"*). This army is where the old reading was doing the most work, and the new shape is the
    // point of the change rather than a casualty of it: the frozen plan was **two** enormous troop stacks
    // (Archer II 2 569 · Archer III 1 417) carrying five of each hired type, and the top one is the enemy's
    // first kill — it strikes once if we open and **not at all** if the monster does. Ranked on the bad
    // flip the search answers with **four** troop rungs (Catapult I 143 · Archer III 440 · Archer II 767 ·
    // Archer I 1 354) carrying **nine** of each hired type, a march whose damage does not depend on the
    // coin: 17 340 367 over **13** marches for 19 604 400 silver and 39 hired units lost, against
    // 18 617 972 over 17 for 37 966 200 and 51. Half the silver, a quarter less of the stock, and a campaign
    // worth 93 % of a figure the player was only ever handed half the time.
    expect(PLAN.marches).toBe(13);
    expect(PLAN.totalDamage).toBe(17_340_367);
    expect(PLAN.silver).toBe(19_604_400);
    expect(PLAN.mercLost).toBe(39);
    expect(PLAN.march.counts).toEqual({
      'catapult-1': 143,
      'archer-3': 440,
      'archer-2': 767,
      'archer-1': 1_354,
      'arbalester-6': 9,
      'arbalester-7': 9,
      'chariot-6': 9,
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
    // because a frontier is a big number: 190 plans here, of which four are worth a stop (the bar carries
    // up to four since 2026-09-18). Every other figure in this test is unmoved, because the plan is the same plan.
    //
    // 18 331 217 → 18 333 467 damage and 33 288 500 → 33 284 700 silver on 2026-09-18, when the ladder
    // started learning which type takes which rung (`out/98`): the repeated march is the same march to the
    // unit, and the final march gained 2 250 damage for 3 800 silver less from a better rung order.
    expect(PLAN.alternatives).toHaveLength(4);
    // 309 → **310** on 2026-09-18 with the per-unit sweep vectors: the frontier carries one more plan, and
    // the bar still carries four stops, so one more is left out. Nothing the search used to find was lost.
    // 310 → **288** on 2026-09-19 (S-94): the undominated set is smaller on the worst opening, because two
    // plans that used to be told apart by half a strike of a top stack now tie and one of them is dominated.
    // 288 → **283** on 2026-09-19 (S-97), the top of the burn ladder: the sheltered maximum over each
    // prefix of the troop ranking is scored above the winner's own burn, and on this army the marches it
    // adds **dominate more rows than they add** — the undominated set comes to five fewer. Every figure
    // above is unmoved to the unit: the plan is the same plan and the bar is the same four stops, so this
    // army's top rung was never one of the short ones.
    expect(PLAN.leftOut).toBe(283);
    // Moved 18 → 19 on 2026-09-15, when the grid stopped crossing every mercenary type against every other
    // (`CROSSED_TYPES`, which is what made an account fielding monsters hang) and the climb took the
    // per-type shares over. The plan is the same plan — every figure above is unmoved — and the curve gained
    // the silver level that search reaches.
    // 19 → **20** on 2026-09-18: the per-unit sweep vectors reach one more silver level of the curve.
    // 20 → **14** on 2026-09-18 (S-88): the reference table is bucketed over the plans the bar may offer —
    // the band the stops are drawn from, plus the stops themselves — and no longer over every shape the
    // search prices, so the levels only the thrown-away shapes reached are gone. The plan is the same plan
    // and the bar is the same bar (the two assertions above are unmoved); what changed is the table under
    // it. This army's band is a wide one — 190 plans on the frontier — which is why 14 rows here against the
    // two to four a real account's band comes to.
    // 14 → **13** on 2026-09-19 (S-94): one silver level fewer, with the band above.
    expect(PLAN.curve).toHaveLength(13);
  });

  test('and the two rates it reaches are floors, not ceilings', () => {
    // Damage is the objective; the two ratios are the trade. All three may only improve — this is the
    // assertion that fails if the search loses a lever (the scale, the counts, the finale).
    // 18 333 467 → 18 617 972 on 2026-09-18 (the per-unit sweep vectors, see above). The two rates are
    // unmoved to the unit: 2.4942 a silver and 816 790 a mercenary.
    // **Re-based 2026-09-19 (S-94)**: all three are the same quantities read on the **worst opening** rather
    // than on the midpoint of the two openings, so they are floors at a new level and not a search that got
    // worse — 18 617 972 → **17 340 367** damage, 2.4942 → **2.3192** a silver, 816 790 → **661 893** a
    // mercenary. The note above says what the plan became and why. They are floors as they always were: a
    // change that finds more reliable damage on this army passes here.
    expect(PLAN.totalDamage).toBeGreaterThanOrEqual(17_340_367);
    expect(PLAN.mostEfficient?.damagePerSilver ?? 0).toBeGreaterThanOrEqual(2.31);
    expect(PLAN.mostThrifty?.damagePerMercenary ?? 0).toBeGreaterThanOrEqual(661_893);
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
    expect(named('steady-max')?.repeat.damage).toBe(
      best((row) => (row.pick === 'all-in' ? 0 : row.repeat.damage)),
    );
    // The bar's best a silver is said as a note on the stop that has it, never offered as a stop of its own.
    const noted = rows.find((row) => row.bestFor.silver);
    expect(noted).toBeDefined();
    expect(perSilver(noted as (typeof rows)[number])).toBe(best(perSilver));
    expect(named('sweet-spot')).toBeDefined();
    // The bar opens on the sweet spot, so the row the engine recommends has to be one of the rows it carries.
    expect(rows.some((row) => row.pick === 'sweet-spot')).toBe(true);
  });
}, 120_000);
