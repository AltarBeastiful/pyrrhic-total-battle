/**
 * **The thrifty stop** (`CampaignInput.fifthStop`, `engine/thriftyStop.ts`; owner, 2026-10-14; experiments 232–238).
 *
 * On every benchmark army, planned without a clock so the answer is the machine's no less than the owner's:
 *  - the stop is **additive** — every other stop is the march it was, in the order it was, with the option off;
 *  - when a bar carries a thrifty stop it keeps the rule it was offered under, read off the bar's own sweet spot:
 *    a shorter queue, no more silver, gold or coins, no less damage a silver or a merc, at least the damage floor,
 *    a burn at most the stop above the sweet spot's;
 *  - it is a march of its own: no other stop has its counts.
 *
 * No count of armies is pinned: which armies get a stop is a report (experiment 238), not a baseline.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import type { CampaignPlan, PlanRow } from '@/engine/plan';
import { planCampaign } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';

import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';

const profile = ownerProfile();
const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];

const plan = (request: StackRequest, fifthStop: boolean): CampaignPlan | undefined => {
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      ...CAMPAIGN.planFixes,
      fifthStop: fifthStop ? CAMPAIGN.planFixes.fifthStop : undefined,
      putBack: CAMPAIGN.putBack,
    });
  } catch {
    return undefined;
  }
};

const identity = (row: PlanRow): string => `${row.pick}|${JSON.stringify(row.counts)}`;

describe('the thrifty stop', () => {
  test.each(scenarios.map((s) => [s.label, s] as const))('%s', (_label, scenario) => {
    const off = plan(scenario.request, false);
    const on = plan(scenario.request, true);
    expect(off === undefined).toBe(on === undefined);
    if (!off || !on) return;

    const others = on.alternatives.filter((row) => row.pick !== 'thrifty');
    expect(others.map(identity), 'every other stop is the march it was, in its order').toEqual(
      off.alternatives.map(identity),
    );

    const stop = on.alternatives.find((row) => row.pick === 'thrifty');
    if (!stop) return;
    const sweet = on.alternatives.find((row) => row.pick === 'sweet-spot');
    expect(sweet, 'a thrifty stop is read against a sweet spot').toBeDefined();
    if (!sweet) return;
    const rule = CAMPAIGN.planFixes.fifthStop;
    const r = stop.repeat;
    const s = sweet.repeat;
    expect(on.alternatives.filter((row) => row.pick === 'thrifty')).toHaveLength(1);
    expect(r.seconds, 'queue').toBeLessThan(s.seconds);
    expect(r.silver, 'silver').toBeLessThanOrEqual(s.silver);
    expect(r.gold, 'gold').toBeLessThanOrEqual(s.gold * (1 + rule.goldTolerance));
    expect(r.dragonCoins ?? 0, 'coins').toBeLessThanOrEqual((s.dragonCoins ?? 0) * (1 + rule.goldTolerance));
    expect(r.damage / r.silver, 'damage a silver').toBeGreaterThanOrEqual(
      (s.damage / s.silver) * rule.silverFloor,
    );
    expect(r.hiredDamage / Math.max(1, r.mercLost), 'damage a merc').toBeGreaterThanOrEqual(
      (s.hiredDamage / Math.max(1, s.mercLost)) * rule.mercFloor,
    );
    expect(r.damage, 'damage floor').toBeGreaterThanOrEqual(s.damage * rule.damageFloor);
    const above = on.alternatives.filter((row) => row.pick !== 'thrifty' && row.repeat.damage > s.damage);
    if (above.length > 0)
      expect(r.mercLost, 'burn at most the stop above the sweet spot').toBeLessThanOrEqual(
        Math.min(...above.map((row) => row.repeat.mercLost)),
      );
    else
      expect(r.mercLost, 'no stop above: no more burn than the sweet spot').toBeLessThanOrEqual(s.mercLost);
    // Two whole plans an army, the monster camps at seconds each: the default 5 s is a full suite's load away.
  }, 60_000);
});
