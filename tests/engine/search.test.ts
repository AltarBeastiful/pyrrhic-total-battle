/**
 * S-40 / S-41 — priority search. The reference is the zero-bonus fixture army: TotalStack's own
 * "Maximum Damage" priority kept all ten troop types and scored 2,131,530, while its plain 8-type run
 * scored 2,515,830 — i.e. its search is not exhaustive and misses the better answer (fixture note on
 * run ep-10stacks). Our search must make the *choice* TotalStack missed; the absolute numbers differ
 * because our summary counts the strength-against part once (see summary.test.ts).
 */
import { describe, expect, it } from 'vitest';

import { simulateBattle } from '../../src/engine/battle';
import { objectiveScore, searchPriority } from '../../src/engine/search';
import { sizeStacks } from '../../src/engine/stacker';
import type { Objective, SearchProgress, UnitDef } from '../../src/engine/types';
import { makeRequest, totalsFrom } from '../helpers/request';
import { monsterSet, troopSet } from '../helpers/units';

const TROOPS = troopSet('SW1', 'ARC1', 'SP1', 'SP2', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3');
const MONSTERS = monsterSet('WE', 'BB', 'ED', 'SG');
const ALL = [...TROOPS, ...MONSTERS];
const TIER1_SPECIALISTS = ['swordsman-1', 'spearman-1'];

/** Score one fixed formation the same way the search does, so the assertions compare like with like. */
function scoreOf(units: UnitDef[], objective: Objective): number {
  const request = makeRequest({ units });
  return objectiveScore(simulateBattle(sizeStacks(request), request), objective);
}

function search(units: UnitDef[], objective: Objective, budgetMs = 10_000) {
  return searchPriority({ request: makeRequest({ units }), objective, budgetMs, seed: 1 });
}

describe('maximum average damage', () => {
  const eightTypes = ALL.filter((unit) => !TIER1_SPECIALISTS.includes(unit.id));
  const found = search(ALL, 'avgDamage');

  it('beats keeping every unit type, the answer TotalStack returned', () => {
    expect(found.score).toBeGreaterThan(scoreOf(ALL, 'avgDamage'));
  });

  it('is at least as good as the captured 8-type run', () => {
    expect(found.score).toBeGreaterThanOrEqual(scoreOf(eightTypes, 'avgDamage'));
  });

  it('drops exactly the two tier-1 specialists, like the captured 8-stack run', () => {
    expect(found.includedUnitIds).toEqual(eightTypes.map((unit) => unit.id));
    expect(found.summary.stackCount).toBe(12);
    expect(found.result.pools.leadership.used).toBe(3000);
  });
});

describe('damage per silver', () => {
  it("drops the tier-1 types, as TotalStack's own Damage/Silver run did", () => {
    const found = search(ALL, 'damagePerSilver');
    for (const id of TIER1_SPECIALISTS) expect(found.includedUnitIds).not.toContain(id);
    expect(found.score).toBeGreaterThan(scoreOf(ALL, 'damagePerSilver'));
  });

  /**
   * Investigation 0013. Enumerating all 2^14 − 1 subsets of this army puts the peak of damage-per-silver
   * on a monsters-only march at 4.3098: monsters are retrained ten at a time, so the pool that carries
   * most of the damage costs almost no silver. It is twelve simultaneous drops away from the full army,
   * and the first version of the search — one descent from the full formation plus twelve coin-flip
   * restarts — answered whatever its seed landed on: 1.1176 on seed 1, 3.9226 on seeds 2 and 3, the real
   * 4.3098 on seed 7. The pool-shaped starting points are what make it reproducible.
   */
  /**
   * **Re-based 2026-09-22 (S-134), by the owner**, and the only figure on this file that moved: the ratio
   * objectives now divide the **worst** opening rather than the average of the two (*"if we don't open the
   * fight the first troop dies and the rest follows it's a 50/50 coin flip so damage to check is more about
   * the worst case damage"*, then *"1. yes"* to switching them). The peak is the same march — the assertion
   * below on `includedUnitIds` is untouched and still passes — priced on the reliable half of the flip
   * instead of on its midpoint. The old figure was **4.3098**; it is kept here because the story of how this
   * search was built is told against it, and because the gap between the two is what the change is worth.
   */
  const PER_SILVER_OPTIMUM = 3.4819196;

  it('finds the monsters-only peak that no chain of one- or two-type drops leads to', () => {
    const found = search(ALL, 'damagePerSilver');
    expect(found.score).toBeCloseTo(PER_SILVER_OPTIMUM, 4);
    expect(found.includedUnitIds).toEqual(['water-elemental', 'emerald-dragon', 'stone-gargoyle']);
  });

  it('gives the same answer whatever the seed', () => {
    const scores = [1, 2, 3, 7, 42].map(
      (seed) =>
        searchPriority({
          request: makeRequest({ units: ALL }),
          objective: 'damagePerSilver',
          budgetMs: 10_000,
          seed,
        }).score,
    );
    for (const score of scores) expect(score).toBeCloseTo(PER_SILVER_OPTIMUM, 4);
  });

  it('finds a different formation for dragon coins than for silver', () => {
    const coins = search(ALL, 'damagePerDragonCoin');
    const silver = search(ALL, 'damagePerSilver');
    expect(coins.includedUnitIds).not.toEqual(silver.includedUnitIds);
    expect(coins.score).toBeGreaterThan(scoreOf(ALL, 'damagePerDragonCoin'));
  });
});

describe('objectiveScore', () => {
  it('reads the matching field off the summary', () => {
    const request = makeRequest({ units: ALL });
    const summary = simulateBattle(sizeStacks(request), request);
    expect(objectiveScore(summary, 'avgDamage')).toBe(summary.avgDamage);
    // **The ratios divide the worst opening since S-134** (owner: *"1. yes"*), so the default reading is no
    // longer `BattleScore.damagePerSilver` — which `scoreOf` builds on the average of the two openings — but
    // the same bill over `minDamage`. Both readings are asserted, so the change is pinned in both
    // directions rather than replaced by its successor.
    expect(objectiveScore(summary, 'damagePerSilver')).toBe(summary.minDamage / summary.recovery.silver);
    expect(objectiveScore(summary, 'damagePerSilver', 'average')).toBe(summary.damagePerSilver);
    // Gold is the one field this army cannot answer with: it hires nothing, and since 2026-09-21 its
    // monsters are recruited again rather than revived, so nothing here opens the Temple. That is the
    // unmeasurable case the test below is about, and it scores −Infinity rather than the summary's nought.
    expect(summary.recovery.gold).toBe(0);
    expect(objectiveScore(summary, 'damagePerGold')).toBe(-Infinity);
  });

  it('scores an unmeasurable ratio −Infinity rather than zero', () => {
    // No monsters at all: nothing costs dragon coins, so "damage per dragon coin" has no meaning.
    const request = makeRequest({ units: TROOPS, housing: { dominance: 0 } });
    const summary = simulateBattle(sizeStacks(request), request);
    expect(summary.recovery.dragonCoins).toBe(0);
    expect(objectiveScore(summary, 'damagePerDragonCoin')).toBe(-Infinity);
    expect(objectiveScore(summary, 'avgDamage')).toBeGreaterThan(0);
  });

  it('reports an objective nothing could be measured against, rather than passing the army off as its answer', () => {
    const found = searchPriority({
      request: makeRequest({ units: TROOPS, housing: { dominance: 0 } }),
      objective: 'damagePerDragonCoin',
      budgetMs: 10_000,
      seed: 1,
    });
    expect(found.unmeasurable).toBe(true);
    expect(found.score).toBe(-Infinity);
    // What comes back is the all-types army, i.e. exactly what "No priority" would have produced.
    expect(found.includedUnitIds).toEqual(found.baseline.includedUnitIds);
    expect(search(ALL, 'damagePerDragonCoin').unmeasurable).toBe(false);
  });
});

describe('search space', () => {
  it('enumerates exhaustively at 12 unit types (2^12 − 1 subsets)', () => {
    const twelve = [...TROOPS, ...monsterSet('WE', 'BB')];
    const found = searchPriority({
      request: makeRequest({ units: twelve }),
      objective: 'avgDamage',
      budgetMs: 30_000,
      seed: 1,
    });
    expect(found.exhaustive).toBe(true);
    expect(found.evaluated).toBe(4095);
  });

  it('switches to the greedy search above 12 unit types', () => {
    const found = search(ALL, 'avgDamage');
    expect(found.exhaustive).toBe(false);
    expect(found.evaluated).toBeLessThan(2 ** ALL.length);
  });

  it('handles an empty formation', () => {
    const found = search([], 'avgDamage');
    expect(found.includedUnitIds).toEqual([]);
    expect(found.exhaustive).toBe(true);
    expect(found.score).toBe(0);
  });
});

describe('budget, cancellation and determinism', () => {
  it('returns a usable result inside a 1 ms budget', () => {
    const started = Date.now();
    const found = searchPriority({
      request: makeRequest({ units: ALL }),
      objective: 'avgDamage',
      budgetMs: 1,
      seed: 1,
    });
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(found.exhaustive).toBe(false);
    expect(found.includedUnitIds.length).toBeGreaterThan(0);
    expect(found.summary.stackCount).toBeGreaterThan(0);
  });

  it('stops on the cancel signal and still returns the formation it started from', () => {
    const found = searchPriority(
      { request: makeRequest({ units: ALL }), objective: 'avgDamage', budgetMs: 10_000, seed: 1 },
      undefined,
      () => true,
    );
    expect(found.evaluated).toBe(1);
    expect(found.includedUnitIds).toEqual(ALL.map((unit) => unit.id));
    expect(found.exhaustive).toBe(false);
  });

  it('reports progress while it works', () => {
    const progress: SearchProgress[] = [];
    searchPriority(
      { request: makeRequest({ units: ALL }), objective: 'avgDamage', budgetMs: 10_000, seed: 1 },
      (update) => progress.push(update),
    );
    expect(progress.length).toBeGreaterThan(1);
    expect(progress.at(-1)!.evaluated).toBeGreaterThanOrEqual(progress[0]!.evaluated);
    expect(progress.at(-1)!.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('gives the same answer twice for the same seed', () => {
    const first = search(ALL, 'avgDamage');
    const second = search(ALL, 'avgDamage');
    expect(second.includedUnitIds).toEqual(first.includedUnitIds);
    expect(second.score).toBe(first.score);
    expect(second.evaluated).toBe(first.evaluated);
  });
});

/**
 * The bonus army that makes the two damage objectives disagree: Guardsmen I–III and Specialists I–III with
 * +39.5 % health / +76 % strength on guardsmen and 4,100 leadership. Maximising the *average* buys three
 * enormous tier-3 stacks that only pay off when we strike first; maximising the *minimum* keeps the army
 * wide, because the worst case is the enemy striking first.
 */
const BONUS_ARMY = troopSet(
  'ARC1',
  'SP1',
  'RD1',
  'ARC2',
  'SP2',
  'RD2',
  'ARC3',
  'SP3',
  'RD3',
  'SW1',
  'SW2',
  'SW3',
);

function bonusRequest() {
  return makeRequest({
    units: BONUS_ARMY,
    housing: { leadership: 4100, authority: 0, dominance: 0 },
    totals: totalsFrom({ health: { guardsmen: 39.5 }, strength: { guardsmen: 76 } }),
  });
}

describe('minimum damage', () => {
  const worstCase = searchPriority({
    request: bonusRequest(),
    objective: 'minDamage',
    budgetMs: 30_000,
    seed: 1,
  });
  const average = searchPriority({
    request: bonusRequest(),
    objective: 'avgDamage',
    budgetMs: 30_000,
    seed: 1,
  });

  it('reads the worst case off the summary', () => {
    const request = bonusRequest();
    const summary = simulateBattle(sizeStacks(request), request);
    expect(objectiveScore(summary, 'minDamage')).toBe(summary.minDamage);
  });

  it('keeps a wider army than the average does, and never a worse worst case than doing nothing', () => {
    expect(average.includedUnitIds).toEqual(['archer-3', 'spearman-3', 'rider-3']);
    expect(worstCase.includedUnitIds.length).toBeGreaterThan(average.includedUnitIds.length);
    expect(worstCase.summary.minDamage).toBeGreaterThan(average.summary.minDamage);
    expect(worstCase.summary.minDamage).toBeGreaterThanOrEqual(worstCase.baseline.summary.minDamage);
    // The trade the UI has to show: three stacks survive two enemy hits, the wide army survives ten.
    expect(average.summary.journals.enemyFirst.friendlyHits).toBe(2);
    expect(worstCase.summary.journals.enemyFirst.friendlyHits).toBeGreaterThan(
      average.summary.journals.enemyFirst.friendlyHits,
    );
    // Maximising the average really does cost the worst case, which is why the objective exists.
    expect(average.summary.minDamage).toBeLessThan(average.baseline.summary.minDamage);
    expect(average.summary.avgDamage).toBeGreaterThan(worstCase.summary.avgDamage);
  });
});

describe('baseline', () => {
  it('is the all-types army sized from the same request', () => {
    const request = bonusRequest();
    const direct = sizeStacks(request);
    const summary = simulateBattle(direct, request);
    const found = searchPriority({ request, objective: 'avgDamage', budgetMs: 30_000, seed: 1 });

    expect(found.baseline.includedUnitIds).toEqual(BONUS_ARMY.map((unit) => unit.id));
    expect(found.baseline.result).toEqual(direct);
    expect(found.baseline.summary).toEqual(summary);
    // It is the first evaluation, not an extra one.
    expect(found.evaluated).toBe(4095);
  });

  it('is present even when the search never gets to run', () => {
    const found = searchPriority(
      { request: makeRequest({ units: ALL }), objective: 'avgDamage', budgetMs: 10_000, seed: 1 },
      undefined,
      () => true,
    );
    expect(found.baseline.includedUnitIds).toEqual(ALL.map((unit) => unit.id));
    expect(found.baseline.summary).toEqual(found.summary);
  });
});
