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

function search(units: UnitDef[], objective: Objective, budgetMs = 10_000, pinned?: string[]) {
  return searchPriority({
    request: makeRequest({ units, ...(pinned === undefined ? {} : { pinned }) }),
    objective,
    budgetMs,
    seed: 1,
  });
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
    expect(objectiveScore(summary, 'damagePerGold')).toBe(summary.damagePerGold);
  });

  it('scores an unmeasurable ratio −Infinity rather than zero', () => {
    // No monsters at all: nothing costs dragon coins, so "damage per dragon coin" has no meaning.
    const request = makeRequest({ units: TROOPS, housing: { dominance: 0 } });
    const summary = simulateBattle(sizeStacks(request), request);
    expect(summary.recovery.dragonCoins).toBe(0);
    expect(objectiveScore(summary, 'damagePerDragonCoin')).toBe(-Infinity);
    expect(objectiveScore(summary, 'avgDamage')).toBeGreaterThan(0);
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

describe('pinned unit types', () => {
  it('keeps the pinned type and still drops the one the objective does not want', () => {
    const found = search(ALL, 'avgDamage', 10_000, ['swordsman-1']);

    expect(found.includedUnitIds).toContain('swordsman-1');
    expect(found.includedUnitIds).not.toContain('spearman-1');
    // The pin costs damage — it takes the tier-1 slot the free search gives to Archer I.
    expect(found.includedUnitIds).not.toContain('archer-1');
    expect(found.score).toBeLessThan(search(ALL, 'avgDamage').score);
    // ... but it is still the best formation that contains it.
    expect(found.score).toBeGreaterThan(scoreOf(ALL, 'avgDamage'));
    expect(found.result.stacks.some((stack) => stack.unitId === 'swordsman-1')).toBe(true);
  });

  it('counts only the free types when deciding whether it can enumerate exhaustively', () => {
    const thirteen = [...TROOPS, ...monsterSet('WE', 'BB', 'ED')];
    const found = searchPriority({
      request: makeRequest({ units: thirteen, pinned: ['swordsman-1'] }),
      objective: 'avgDamage',
      budgetMs: 30_000,
      seed: 1,
    });

    // 12 free types, and the pins-only subset is a candidate too, so 2^12 evaluations.
    expect(found.exhaustive).toBe(true);
    expect(found.evaluated).toBe(4096);
    expect(found.includedUnitIds).toContain('swordsman-1');
  });

  it('returns the pinned types alone when every free type hurts the objective', () => {
    const found = searchPriority({
      request: makeRequest({ units: ALL, pinned: ['water-elemental'] }),
      objective: 'damagePerDragonCoin',
      budgetMs: 10_000,
      seed: 1,
    });
    expect(found.includedUnitIds).toContain('water-elemental');
  });

  it('ignores pinned ids that are not in the formation', () => {
    const found = search(ALL, 'avgDamage', 10_000, ['not-a-unit']);
    expect(found.includedUnitIds).toEqual(search(ALL, 'avgDamage').includedUnitIds);
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

  it('is the whole formation even when types are pinned', () => {
    const found = search(ALL, 'avgDamage', 10_000, ['swordsman-1']);
    expect(found.baseline.includedUnitIds).toEqual(ALL.map((unit) => unit.id));
    expect(found.score).toBeGreaterThan(objectiveScore(found.baseline.summary, 'avgDamage'));
  });
});
