/**
 * S-111 — **the plan for an army that hires nothing.**
 *
 * `planCampaign` used to throw *"no feasible plan for this army"* at every account with no hired stock; a
 * first-run profile is one, and so is any account that has not typed its mercenaries in yet. Experiment 115
 * measured what was being refused: the Tier ladder's march — the one Generate answers with — is **rank 14 of
 * the 1 023 subsets on damage** and the army's frontier is two dozen marches wide, so the refusal was hiding
 * a real answer rather than declining an empty one.
 *
 * What is asserted here is the contract the owner set for it (2026-09-20): *"if we KNOW for sure it's the
 * best play with the given configuration and we've explored all possibilities, then we've answered the
 * complete optimization goal."* So the test does not check that the planner returns *a* plan — it enumerates
 * **every subset of the army** and checks the planner's own top stop against the true optimum.
 */
import { describe, expect, it } from 'vitest';

import { simulateBattle } from '../../src/engine/battle';
import { planCampaign } from '../../src/engine/plan';
import { recoveryCosts } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest } from '../../src/engine/types';
import { newRoot } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { refusalOf } from '../../src/ui/sections/march/generate';

function firstRun(): { profile: Profile; setup: BattleSetup } {
  const root = newRoot();
  const profile = root.profiles[0];
  const setup = profile?.setups[0];
  if (!profile || !setup) throw new Error('no first-run profile');
  return { profile, setup };
}

function armyAt(leadership: number): { profile: Profile; setup: BattleSetup } {
  const { profile, setup } = firstRun();
  return { profile, setup: { ...setup, housing: { ...setup.housing, leadership } } };
}

/** Every non-empty subset of the army, sized and fought: the true optimum, by enumeration. */
function exhaustive(base: StackRequest): { damage: number; silver: number; ids: string[] }[] {
  const ids = base.units.map((unit) => unit.id);
  const out: { damage: number; silver: number; ids: string[] }[] = [];
  for (let mask = 1; mask < 1 << ids.length; mask += 1) {
    const kept = new Set(ids.filter((_id, index) => (mask & (1 << index)) !== 0));
    const request: StackRequest = { ...base, units: base.units.filter((unit) => kept.has(unit.id)) };
    const result = sizeStacks(request);
    if (result.stacks.length === 0) continue;
    out.push({
      damage: simulateBattle(result, request).minDamage,
      silver: recoveryCosts(result.stacks, request.units, request.recovery).plan.silver,
      ids: [...kept],
    });
  }
  return out;
}

describe('the plan for an army that hires nothing', () => {
  it('answers instead of refusing, on a first-run account', () => {
    const { profile, setup } = armyAt(12_000);
    const plan = planCampaign(buildPlanRequest(profile, setup));

    expect(plan.alternatives.length).toBeGreaterThan(0);
    // Nothing is spent for good, so nothing hired binds and no row burns any of it.
    expect(plan.binding.mercenaries).toBe(false);
    for (const stop of plan.alternatives) {
      expect(stop.mercLost).toBe(0);
      expect(stop.hiredDamage).toBe(0);
      expect(stop.totalDamage).toBeGreaterThan(0);
      // Every stop is a march the player can actually field.
      const used = Object.entries(stop.counts).reduce((sum, [id, count]) => {
        const unit = buildStackRequest(profile, setup).units.find((one) => one.id === id);
        return sum + (unit?.cost ?? 0) * count;
      }, 0);
      expect(used).toBeLessThanOrEqual(setup.housing.leadership);
    }
  });

  it('offers a bar that spends more for more, cheapest first', () => {
    const { profile, setup } = armyAt(12_000);
    const stops = planCampaign(buildPlanRequest(profile, setup)).alternatives;

    expect(stops.length).toBeGreaterThanOrEqual(2);
    for (let index = 1; index < stops.length; index += 1) {
      const previous = stops[index - 1];
      const current = stops[index];
      if (!previous || !current) throw new Error('missing stop');
      // Left to right is "spend less … spend more", and a stop that costs more has to buy more: a bar whose
      // rows are not ordered on both is a bar with a row nobody would ever stand on.
      expect(current.silver).toBeGreaterThan(previous.silver);
      expect(current.totalDamage).toBeGreaterThan(previous.totalDamage);
    }
    // Exactly one stop wears "best damage a silver", as on the hired bar.
    expect(stops.filter((stop) => stop.bestFor.silver)).toHaveLength(1);
    expect(stops.filter((stop) => stop.bestFor.hired)).toHaveLength(0);
  });

  it('reaches the true optimum of the whole subset space', () => {
    for (const leadership of [4_100, 12_000, 20_000]) {
      const { profile, setup } = armyAt(leadership);
      const base = buildStackRequest(profile, setup);
      const every = exhaustive(base);
      const truth = every.reduce((best, one) => (one.damage > best.damage ? one : best));
      const plan = planCampaign(buildPlanRequest(profile, setup));
      const marches = plan.alternatives[0]?.marches ?? 1;
      const best = Math.max(...plan.alternatives.map((stop) => stop.totalDamage)) / marches;

      // The contract: what the bar's dearest stop fields *is* the best march this army can make. Not "close
      // to" — experiment 116 measured tier windows and greedy elimination as containing the optimum on all
      // three of these pools, and this is the assertion that keeps it true.
      expect(best).toBe(truth.damage);
    }
  });

  it('carries the Tier ladder march on the bar, and beats it', () => {
    const { profile, setup } = armyAt(12_000);
    const base = buildStackRequest(profile, setup);
    const ladder = sizeStacks(base);
    const ladderDamage = simulateBattle(ladder, base).minDamage;
    const plan = planCampaign(buildPlanRequest(profile, setup));
    const marches = plan.alternatives[0]?.marches ?? 1;

    // What Generate answers with today is on the bar — a player has to be able to find the march he knows —
    // and it is not the dearest stop: the frontier goes past it (115: 2 710 128 against 2 959 404).
    const onBar = plan.alternatives.some(
      (stop) => Math.round(stop.totalDamage / marches) === Math.round(ladderDamage),
    );
    expect(onBar).toBe(true);
    expect(Math.max(...plan.alternatives.map((stop) => stop.totalDamage)) / marches).toBeGreaterThan(
      ladderDamage,
    );
  });

  it('still refuses nothing it used to answer: an army with one hired unit takes the old path', () => {
    const { profile, setup } = armyAt(20_000);
    const hired = structuredClone(profile);
    hired.mercenaries.selected = [{ id: 'bear-5', cap: 1 }];
    const plan = planCampaign(
      buildPlanRequest(hired, { ...setup, housing: { ...setup.housing, authority: 2_000 } }),
    );
    // One bear is stock, so this is the search's own answer and not the troops-only planner's: it fields the
    // bear, which the troops-only planner has no way to do.
    expect(plan.alternatives.some((stop) => (stop.counts['bear-5'] ?? 0) > 0)).toBe(true);
  });
});

/**
 * The three defects the S-111 review found by sweeping 270 troop-window × leadership armies. Each is a case
 * the first build got wrong, so each is asserted rather than described.
 */
describe('what the S-111 review found', () => {
  it('answers for an army that holds stock it cannot field', () => {
    const { profile, setup } = armyAt(20_000);
    // A bear in the stock and **no authority housing**: it holds a hired unit and can put none of it on the
    // field, which the first gate read as "hires something" and sent to a search that then threw.
    const hired = structuredClone(profile);
    hired.mercenaries.selected = [{ id: 'bear-5', cap: 1 }];
    const plan = planCampaign(
      buildPlanRequest(hired, { ...setup, housing: { ...setup.housing, authority: 0 } }),
    );
    expect(plan.alternatives.length).toBeGreaterThan(0);
    expect(plan.alternatives.every((stop) => (stop.counts['bear-5'] ?? 0) === 0)).toBe(true);
  });

  it('opens on the row it names, however short the bar', () => {
    // G1 alone is one stop and G1–G2 is two, so neither has a knee: the stand used to be the dearest row
    // while `recommend` was the cheapest, and the bar then painted "Sweet spot" on a row called
    // "Silver saver". One stand now, and it wears the word.
    for (const [min, max] of [
      [1, 1],
      [1, 2],
      [1, 3],
    ] as const) {
      const { profile, setup } = armyAt(12_000);
      const narrow = structuredClone(profile);
      narrow.troops.guardsmen = { min, max };
      narrow.troops.specialists = null;
      const plan = planCampaign(buildPlanRequest(narrow, setup));

      const sweet = plan.alternatives.filter((stop) => stop.pick === 'sweet-spot');
      expect(sweet).toHaveLength(1);
      // The plan's own campaign figures, the row the bar opens on and the row that wears the word are one
      // plan — the three readers that disagreed.
      expect(plan.recommend?.counts).toEqual(sweet[0]?.counts);
      expect(plan.totalDamage).toBe(sweet[0]?.totalDamage);
      expect(plan.silver).toBe(sweet[0]?.silver);
    }
  });

  it('draws one row a plan in the table under the bar', () => {
    // Two subsets can price to the same damage for the same silver; the reference table keys its rows on the
    // silver, so an exact tie used to be two rows with one key.
    for (const leadership of [600, 1_200, 4_100, 12_000, 20_000]) {
      const { profile, setup } = armyAt(leadership);
      const plan = planCampaign(buildPlanRequest(profile, setup));
      const keys = plan.curve.map((point) => `${String(point.silver)}|${String(point.damage)}`);
      expect(new Set(keys).size).toBe(keys.length);
      expect(new Set(plan.curve.map((point) => point.silver)).size).toBe(plan.curve.length);
    }
  });

  it('refuses a march that does not fit, in words about the housing', () => {
    // The literal first-run default: `defaultHousing()` is all zeros, so nothing can be fielded at all. The
    // command bar blocks Generate before this ("Add housing first", `shell/state.ts`), and the engine still
    // owes an honest sentence to anything that reaches it.
    const { profile, setup } = armyAt(0);
    expect(() => planCampaign(buildPlanRequest(profile, setup))).toThrow(/no march fits/);
    expect(refusalOf(new Error('planCampaign: no march fits this army’s housing'))).toMatch(/housing/);
    // …and the old sentence, which sends the player to the Mercenaries card, is not what he is told.
    expect(refusalOf(new Error('planCampaign: no march fits this army’s housing'))).not.toMatch(
      /mercenaries/,
    );
  });
});
