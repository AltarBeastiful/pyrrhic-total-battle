/**
 * Investigation 0013 — "choosing an objective changes nothing".
 *
 * The whole chain the owner's complaint accuses, without a DOM: the command bar's write
 * (`useCommandBar.setObjective` is `updateActiveSetup({ priority })` and nothing else) → the setup →
 * `buildStackRequest` → the worker job → `searchPriority`. The bar is a `<Select>` around that one
 * store call, so the test writes the value the same way the bar does and follows it from there.
 *
 * The army is the owner's own, from `docs/research/totalstack-review.md` §3: Guardsmen I–III with only
 * the mounted type at III, Specialists I, `swordsman-1` and `rider-2` taken out by hand, four tier-6
 * mercenaries at the caps he owns, leadership 4,100 / authority 2,500 / dominance 0, Elite
 * Preservation, +39.5 % guardsmen health and +76 % guardsmen strength. `sizeStacks` reproduces that
 * run's counts to ±1 (`stacker.test.ts`), so the objectives are being asked about the real march.
 */
import { describe, expect, it } from 'vitest';

import { simulateBattle } from '../../src/engine/battle';
import { sizeStacks } from '../../src/engine/stacker';
import type { Objective, SearchRequest, StackRequest } from '../../src/engine/types';
import { newProfile } from '../../src/state/defaults';
import { buildStackRequest } from '../../src/state/derive';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { battleSetupSchema, OBJECTIVES } from '../../src/state/schema';
import { isPriority, type Priority } from '../../src/ui/sections/battle/choices';
import { createInlineClient } from '../../src/worker/client';
import { runSearch, runStack } from '../../src/worker/jobs';
import type { CalcRequestMessage } from '../../src/worker/protocol';
import { isCalcRequestMessage } from '../../src/worker/protocol';

const SEARCH_BUDGET_MS = 8_000;

// ---- The owner's march ---------------------------------------------------------------------------
function ownerProfile(): Profile {
  const profile = newProfile('Owner', '00000000-0000-4000-8000-00000000dead');
  profile.troops = {
    guardsmen: { min: 1, max: 3 },
    specialists: { min: 1, max: 1 },
    engineers: null,
    monsters: null,
    // Only the mounted type is unlocked at Guardsmen III.
    topTierExcluded: { guardsmen: ['melee', 'ranged', 'flying'], specialists: [] },
    excludedUnitIds: ['swordsman-1', 'rider-2'],
  };
  profile.mercenaries = {
    selected: [
      { id: 'epic-monster-hunter-6', cap: 22 },
      { id: 'arbalester-6', cap: 24 },
      { id: 'legionary-6', cap: 23 },
      { id: 'chariot-6', cap: 12 },
    ],
    custom: [],
  };
  profile.sources.custom = [
    {
      id: 'owner-bonuses',
      name: 'Owner bonuses',
      health: { guardsmen: 39.5, melee: 1, ranged: 1, mounted: 1, army: 3 },
      strength: { guardsmen: 76, army: 3 },
    },
  ];
  const setup = profile.setups[0]!;
  setup.housing = { leadership: 4100, authority: 2500, dominance: 0 };
  setup.active.custom = ['owner-bonuses'];
  profile.setups[0] = setup;
  return profile;
}

/** What the command bar does to the setup, with the bar's own guard, and nothing else. */
function chooseObjective(setup: BattleSetup, value: string): BattleSetup {
  if (!isPriority(value)) return setup;
  return battleSetupSchema.parse({ ...setup, priority: value });
}

/**
 * The branch `src/ui/sections/march/generate.ts` takes after reading `setup.priority`, as the plain
 * message it puts on the worker. The UI file itself pulls in React through its store imports, so the
 * branch is mirrored here rather than imported; it is three lines, and the test asserts the shape of
 * what comes out of it.
 */
function jobFor(request: StackRequest, priority: Priority): CalcRequestMessage {
  return priority === 'none'
    ? { kind: 'stack', id: 'job-1', request }
    : { kind: 'search', id: 'job-1', request: { request, objective: priority, budgetMs: SEARCH_BUDGET_MS } };
}

const ALL_CHOICES: Priority[] = ['none', ...OBJECTIVES];

// ---- 1. Wiring -----------------------------------------------------------------------------------
describe('the objective travels from the bar to the engine', () => {
  const profile = ownerProfile();

  it('is stored on the active setup, and only there', () => {
    for (const choice of ALL_CHOICES) {
      const setup = chooseObjective(profile.setups[0]!, choice);
      expect(setup.priority).toBe(choice);
    }
    // Anything that is not an objective is refused rather than written, so a stale value can never
    // reach the engine as an objective it does not know.
    expect(chooseObjective(profile.setups[0]!, 'damagePerCheese').priority).toBe('none');
  });

  it('is not part of the stack request: the same army feeds every objective', () => {
    const requests = ALL_CHOICES.map((choice) =>
      buildStackRequest(profile, chooseObjective(profile.setups[0]!, choice)),
    );
    for (const request of requests) expect(request).toEqual(requests[0]);
    // The army really is the one the review captured: six troop types and the four mercenaries.
    expect(requests[0]!.units.map((unit) => unit.id)).toEqual([
      'archer-1',
      'archer-2',
      'rider-1',
      'rider-3',
      'spearman-1',
      'spearman-2',
      'arbalester-6',
      'chariot-6',
      'epic-monster-hunter-6',
      'legionary-6',
    ]);
  });

  it('decides the job: "No priority" sizes, every objective searches', () => {
    const request = buildStackRequest(profile, profile.setups[0]!);
    const jobs = ALL_CHOICES.map((choice) => jobFor(request, choice));

    for (const job of jobs) expect(isCalcRequestMessage(job)).toBe(true);
    expect(jobs[0]!.kind).toBe('stack');
    const searches = jobs.slice(1);
    expect(searches.map((job) => job.kind)).toEqual(OBJECTIVES.map(() => 'search'));
    // Five different requests, differing in exactly one field.
    const asked = searches.map((job) => (job as { request: SearchRequest }).request);
    expect(asked.map((search) => search.objective)).toEqual([...OBJECTIVES]);
    expect(new Set(asked.map((search) => JSON.stringify(search))).size).toBe(OBJECTIVES.length);
  });

  it('reaches the engine through the worker protocol', async () => {
    const request = buildStackRequest(profile, profile.setups[0]!);
    const client = createInlineClient();
    try {
      const plain = await client.stack(request);
      const searched = await client.search({
        request,
        objective: 'damagePerGold',
        budgetMs: SEARCH_BUDGET_MS,
      });
      // The one objective that does change this army's march (see below): proof the value crossed.
      expect(searched.includedUnitIds.length).toBeLessThan(request.units.length);
      expect(searched.summary.damagePerGold).toBeGreaterThan(plain.summary.damagePerGold);
    } finally {
      client.dispose();
    }
  });
});

// ---- 2. What each objective answers on that army -------------------------------------------------
describe("the owner's army answers four of the five objectives with the whole army", () => {
  const profile = ownerProfile();
  const request = buildStackRequest(profile, profile.setups[0]!);
  const everything = request.units.map((unit) => unit.id);
  const answer = (objective: Objective) =>
    runSearch(
      { request, objective, budgetMs: SEARCH_BUDGET_MS },
      { onProgress: () => {}, cancelled: () => false },
    );

  it('enumerates its ten types exhaustively, so each answer is the true optimum', () => {
    for (const objective of OBJECTIVES) {
      const found = answer(objective);
      expect(found.exhaustive, objective).toBe(true);
      expect(found.evaluated, objective).toBe(2 ** everything.length - 1);
    }
  });

  it('keeps every type for damage, worst case and damage per silver', () => {
    const plain = runStack(request);
    for (const objective of ['avgDamage', 'minDamage', 'damagePerSilver'] as const) {
      const found = answer(objective);
      expect(found.includedUnitIds, objective).toEqual(everything);
      expect(found.result, objective).toEqual(plain.result);
    }
  });

  it('is not a near-tie: the runner-up is a tenth behind', () => {
    // Dropping Rider I — the best of the nine ten-type marches — for the average.
    const withoutRider1 = request.units.filter((unit) => unit.id !== 'rider-1');
    const scoped = { ...request, units: withoutRider1 };
    const summary = simulateBattle(sizeStacks(scoped), scoped);
    expect(summary.avgDamage).toBeLessThan(runStack(request).summary.avgDamage * 0.92);
  });

  it('leaves the three eight-gold mercenaries at home for damage per gold', () => {
    const found = answer('damagePerGold');
    expect(found.includedUnitIds).not.toContain('arbalester-6');
    expect(found.includedUnitIds).not.toContain('legionary-6');
    expect(found.includedUnitIds).not.toContain('chariot-6');
    expect(found.includedUnitIds).toContain('epic-monster-hunter-6');
    expect(found.summary.recovery.gold).toBeLessThan(found.baseline.summary.recovery.gold / 4);
    expect(found.unmeasurable).toBe(false);
  });

  it('says so when the objective cannot be measured at all', () => {
    // Dominance 0: this march loses no monsters, so no dragon coin is ever spent and there is nothing
    // for "damage per dragon coin" to compare. The winner is the all-types army — the very march "No
    // priority" gives — and the flag is the only thing that tells the two apart.
    const found = answer('damagePerDragonCoin');
    expect(found.summary.recovery.dragonCoins).toBe(0);
    expect(found.unmeasurable).toBe(true);
    expect(found.score).toBe(-Infinity);
    expect(found.includedUnitIds).toEqual(found.baseline.includedUnitIds);
  });
});
