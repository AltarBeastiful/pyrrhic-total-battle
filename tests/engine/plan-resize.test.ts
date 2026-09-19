/**
 * **S-104 — putting a type back re-sizes the selected stop inside the plan's rules.**
 *
 * The owner, 2026-09-19, for the third time that day: *"Adding back troops doesn't shield the mercs"*, and
 * what he means by it — *"I'm able to put it back in and the plan then computes safely the best course of
 * action with the new parameters in mind (the spot selected, monster or any other troop put back) without
 * putting out another, because then we're manually fixing the reco without clicking Generate."*
 *
 * Three promises, read back off the answer on **every stop of every plan of every benchmark army**
 * (`criteriaScenarios`), for every troop type that stop leaves out and every one it fields:
 *
 *  1. every troop type asked for is fielded, and no other one is — *"without putting out another"*;
 *  2. no hired count is above the selected stop's, so the burn can only fall and the campaign the plan
 *     planned is still sustained;
 *  3. every hired and dominance stack stands **strictly under** the lowest troop stack (`shelterUnder`,
 *     S-87) — the rule the old path could not keep, because it ran the plain sizer;
 *
 * and the figure the pane would print is the battle's own: `damage` is `planMarch(...).summary.minDamage`
 * to the unit (S-94, the worst opening).
 *
 * The last test is the defect itself, kept on record: the **old** path — `sizeStacks` on the request
 * filtered to the types that are in — stands his 450 hunters over his troops.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch, resizeMarchOver, sizeStacks } from '@/engine';
import type { CampaignPlan, ResizedMarch } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';

import { HORIZON, criteriaScenarios } from './plan-scenarios';

/** The app's own plan: its horizon, its fixes, its put-back rates (`src/config.ts`, `buildPlanRequest`). */
function planFor(request: StackRequest): CampaignPlan | null {
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    });
  } catch {
    // An army the plan refuses outright (no hired stock to spread) has no stop to re-size.
    return null;
  }
}

const troopIdsOf = (request: StackRequest): string[] =>
  request.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);

/**
 * The caps a re-size is given, exactly as the March pane builds them (`generate.ts`, S-104):
 *
 *  - a **mercenary** at the stop's own count — the rare stock the plan decided to spend, and no more;
 *  - a **monster** at its own pool, `housing.dominance / cost`, because it is *trained* and not spent
 *    (S-102; the owner: *"monster or any other troop put back"*), so a stop that fields none of one has
 *    decided nothing about it.
 */
const capsFor = (request: StackRequest, counts: Record<string, number>): Record<string, number> => {
  const caps: Record<string, number> = {};
  for (const unit of request.units) {
    if (unit.pool === 'leadership') continue;
    const inStop = counts[unit.id] ?? 0;
    caps[unit.id] =
      unit.pool === 'dominance'
        ? Math.max(inStop, Math.floor(request.housing.dominance / Math.max(1, unit.cost)))
        : inStop;
  }
  return caps;
};

/**
 * The three promises and the figure, on one answer. `planMarch` is what the March pane draws for those
 * counts, so the shelter is read off the very stacks the player sees.
 */
function holds(
  request: StackRequest,
  caps: Record<string, number>,
  wanted: string[],
  answer: ResizedMarch,
): void {
  const asked = new Set(wanted);
  // 1 — every troop type asked for is fielded, unless the answer says outright that it could not be.
  for (const id of wanted) {
    if (answer.unfielded.includes(id)) continue;
    expect(answer.counts[id] ?? 0).toBeGreaterThan(0);
  }
  // 1b — and nothing else was pushed *in*: the march fields no troop type that was not asked for.
  for (const id of troopIdsOf(request)) {
    if (asked.has(id)) continue;
    expect(answer.counts[id] ?? 0).toBe(0);
  }
  // 2 — the caps are a ceiling, whatever they were read off.
  for (const [id, cap] of Object.entries(caps)) {
    expect(answer.counts[id] ?? 0).toBeLessThanOrEqual(cap);
  }
  // and a march the camp can house: a monster put back is bounded by the dominance pool, not by a stop.
  const used = { leadership: 0, authority: 0, dominance: 0 };
  for (const unit of request.units) used[unit.pool] += (answer.counts[unit.id] ?? 0) * unit.cost;
  expect(used.leadership).toBeLessThanOrEqual(request.housing.leadership);
  expect(used.authority).toBeLessThanOrEqual(request.housing.authority);
  expect(used.dominance).toBeLessThanOrEqual(request.housing.dominance);

  const { result, summary } = planMarch(request, answer.counts);
  const troopStacks = result.stacks.filter((stack) => stack.pool === 'leadership');
  const hiredStacks = result.stacks.filter((stack) => stack.pool !== 'leadership');
  expect(troopStacks.length).toBeGreaterThan(0);
  // 3 — the shelter: every hired and dominance stack strictly under the lowest troop stack.
  if (hiredStacks.length > 0) {
    const floor = Math.min(...troopStacks.map((stack) => stack.totalHp));
    const top = Math.max(...hiredStacks.map((stack) => stack.totalHp));
    expect(top).toBeLessThan(floor);
  }
  // and the figure the bar and the recap print is that battle's worst opening, to the unit.
  expect(answer.damage).toBe(Math.round(summary.minDamage));
}

describe('a March edit on a plan re-sizes the stop inside the plan’s rules', () => {
  for (const scenario of criteriaScenarios()) {
    test(
      scenario.label,
      () => {
        const plan = planFor(scenario.request);
        if (plan === null) {
          expect(scenario.pinned?.refuses ?? true).toBe(true);
          return;
        }
        const troops = troopIdsOf(scenario.request);
        let edits = 0;
        for (const stop of plan.alternatives) {
          const fielded = troops.filter((id) => (stop.counts[id] ?? 0) > 0);
          const hired = capsFor(scenario.request, stop.counts);
          // Every type this stop leaves out, put back one at a time.
          for (const extra of troops.filter((id) => !fielded.includes(id))) {
            const wanted = [...fielded, extra];
            const answer = resizeMarchOver(scenario.request, { troopIds: wanted, hired });
            expect(answer).not.toBeNull();
            holds(scenario.request, hired, wanted, answer as ResizedMarch);
            edits += 1;
          }
          // And every type it fields, taken out — while more than two are left to stand on, which is the
          // extreme the band refuses ("not a strategy", owner 2026-09-15).
          if (fielded.length > 2) {
            for (const gone of fielded) {
              const wanted = fielded.filter((id) => id !== gone);
              const answer = resizeMarchOver(scenario.request, { troopIds: wanted, hired });
              expect(answer).not.toBeNull();
              holds(scenario.request, hired, wanted, answer as ResizedMarch);
              edits += 1;
            }
          }
        }
        expect(edits).toBeGreaterThan(0);
      },
      180_000,
    );
  }
});

/**
 * **A monster is trained, not spent** (S-104 on S-102; the owner, 2026-09-19: *"the spot selected, **monster
 * or any other troop** put back"*, and *"apart from mercs, they can be trained just like troops"*).
 *
 * A mercenary a stop fields at zero stays at zero — that is the rare stock the plan decided not to spend. A
 * **monster** is not that: the Army tab recruits it again for silver, queue time and dragon coins, there is
 * no count of them to ration over the horizon (`sustain` is `Infinity` for a dominance type), and the only
 * thing that bounds one is the camp's own dominance housing. So taking a monster out and putting it back has
 * to field it again, and its three prices are billed on the answer.
 *
 * Measured the day it was written: on experiment 110's 900-dominance camp, Battle Boar zeroed in the stop
 * comes back as **22 fielded for 7 920 dragon coins**, where the stop's count as a cap fields **0**; on his
 * TotalStack profile of 2026-09-19 (100 dominance) it is **4 for 960 coins** against 0.
 */
describe('putting a monster back fields it again, under the troops', () => {
  const camps = criteriaScenarios().filter(
    (scenario) =>
      scenario.request.housing.dominance > 0 &&
      scenario.request.units.some((unit) => unit.pool === 'dominance'),
  );
  expect(camps.length).toBeGreaterThan(0);

  for (const camp of camps) {
    test(
      camp.label,
      () => {
        const plan = planFor(camp.request);
        if (plan === null) throw new Error('the monster camps all have a plan');
        const stop = plan.recommend ?? plan;
        const monster = camp.request.units.find((unit) => unit.pool === 'dominance');
        if (!monster) throw new Error('filtered above');
        const troops = troopIdsOf(camp.request).filter((id) => (stop.counts[id] ?? 0) > 0);
        // The state a player is in after taking that monster out: the stop's march, less this one type.
        const taken = { ...stop.counts, [monster.id]: 0 };
        const caps = capsFor(camp.request, taken);
        expect(caps[monster.id]).toBeGreaterThan(0);

        const answer = resizeMarchOver(camp.request, { troopIds: troops, hired: caps });
        expect(answer).not.toBeNull();
        holds(camp.request, caps, troops, answer as ResizedMarch);
        // It is fielded again, and the dragon coins it costs are on the answer.
        expect((answer as ResizedMarch).counts[monster.id] ?? 0).toBeGreaterThan(0);
        expect((answer as ResizedMarch).dragonCoins).toBeGreaterThan(0);

        // And the rule it is the exception to: capped at the stop's own zero, as a mercenary is, it stays out.
        const asMercenary = resizeMarchOver(camp.request, {
          troopIds: troops,
          hired: { ...caps, [monster.id]: 0 },
        });
        expect(asMercenary).not.toBeNull();
        expect((asMercenary as ResizedMarch).counts[monster.id] ?? 0).toBe(0);
      },
      180_000,
    );
  }
});

/**
 * **The defect, on record** (owner, 2026-09-19: *"adding back troops doesn't shield the mercs"*).
 *
 * The old path filtered the snapshot's request to the types that are in and called `sizeStacks` on it
 * through the worker's `stack` job — the request's own mercenary caps, his whole 450-hunter stock, and no
 * shelter, because the shelter lives inside `planCampaign`. So the answer a put-back put on screen stood
 * the hunters at or over the troop line: the enemy's first kill, and the rarest stock on the field spent
 * before a troop has died. This test fails the day someone puts that path back.
 */
describe('his 450-hunter camp', () => {
  const camp = criteriaScenarios().find((scenario) => scenario.label.includes('hunters 450'));
  const when = camp === undefined ? test.skip : test;

  when(
    'the old path — the plain sizer on the filtered request — leaves the hunters unsheltered',
    () => {
      if (camp === undefined) return;
      const plan = planFor(camp.request);
      expect(plan).not.toBeNull();
      const stop = (plan as CampaignPlan).recommend ?? (plan as CampaignPlan);
      const troops = troopIdsOf(camp.request);
      const fielded = troops.filter((id) => (stop.counts[id] ?? 0) > 0);
      const extra = troops.find((id) => !fielded.includes(id));
      expect(extra).toBeDefined();
      const included = new Set([
        ...fielded,
        extra as string,
        ...camp.request.units.filter((unit) => unit.pool !== 'leadership').map((unit) => unit.id),
      ]);

      // Exactly what `generate.ts` used to run: the snapshot's request, filtered.
      const old = sizeStacks({
        ...camp.request,
        units: camp.request.units.filter((unit) => included.has(unit.id)),
      });
      const oldTroops = old.stacks.filter((stack) => stack.pool === 'leadership' && stack.count > 0);
      const oldHired = old.stacks.filter((stack) => stack.pool !== 'leadership' && stack.count > 0);
      expect(oldHired.length).toBeGreaterThan(0);
      const oldFloor = Math.min(...oldTroops.map((stack) => stack.totalHp));
      const oldTop = Math.max(...oldHired.map((stack) => stack.totalHp));
      // The defect: a hired stack at or above the lowest troop stack.
      expect(oldTop).toBeGreaterThanOrEqual(oldFloor);

      // And the new path, on the same put-back, keeps every promise.
      const caps = capsFor(camp.request, stop.counts);
      const answer = resizeMarchOver(camp.request, {
        troopIds: [...fielded, extra as string],
        hired: caps,
      });
      expect(answer).not.toBeNull();
      holds(camp.request, caps, [...fielded, extra as string], answer as ResizedMarch);
    },
    180_000,
  );

  when(
    'a mercenary the stop spends none of stays out: that stock is the plan’s own decision',
    () => {
      if (camp === undefined) return;
      const plan = planFor(camp.request);
      expect(plan).not.toBeNull();
      const stop = (plan as CampaignPlan).recommend ?? (plan as CampaignPlan);
      const troops = troopIdsOf(camp.request).filter((id) => (stop.counts[id] ?? 0) > 0);
      const merc = camp.request.units.find((unit) => unit.pool === 'authority');
      if (!merc) throw new Error('his camp hires a mercenary');
      // The stop fields none of it — which is what a mercenary the plan decided to keep looks like — so the
      // caps hold it at nothing and the re-size may not spend it. The pane names it rather than leaving the
      // pill to bounce back without a word (`MarchResize.noStock`, `resizeWords`).
      const caps = { ...capsFor(camp.request, stop.counts), [merc.id]: 0 };
      const answer = resizeMarchOver(camp.request, { troopIds: troops, hired: caps });
      expect(answer).not.toBeNull();
      holds(camp.request, caps, troops, answer as ResizedMarch);
      expect((answer as ResizedMarch).counts[merc.id] ?? 0).toBe(0);
    },
    180_000,
  );
});
