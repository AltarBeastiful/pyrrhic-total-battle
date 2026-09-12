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
import { makeRequest } from '../helpers/request';
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
