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
import {
  largestSustained,
  planCampaign,
  planMarch,
  planRepeats,
  resizeMarchOver,
  sizeStacks,
} from '@/engine';
import { effectiveTable } from '@/engine/plan';
import type { CampaignPlan, PlanTotals, ResizedMarch } from '@/engine/plan';
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
 * The caps a re-size is given, exactly as the March pane builds them (`generate.ts`):
 *
 *  - a **mercenary** at what the account can spend on every march the stop plays — `largestSustained(stock,
 *    repeats)`, or the whole authority pool for a type hired with no cap (S-107, 2026-09-19). It was the
 *    stop's own count until then (S-104), which made a take-out a no-op: the stacks that are left grow, the
 *    troop floor rises, and the count the stop was standing under the old floor is no longer what the new
 *    one shelters;
 *  - a **monster** at its own pool, `housing.dominance / cost`, because it is *trained* and not spent
 *    (S-102; the owner: *"monster or any other troop put back"*), so a stop that fields none of one has
 *    decided nothing about it.
 */
const capsFor = (
  request: StackRequest,
  counts: Record<string, number>,
  repeats: number,
): Record<string, number> => {
  const caps: Record<string, number> = {};
  for (const unit of request.units) {
    if (unit.pool === 'leadership') continue;
    if (unit.pool === 'dominance') {
      const inStop = counts[unit.id] ?? 0;
      caps[unit.id] = Math.max(inStop, Math.floor(request.housing.dominance / Math.max(1, unit.cost)));
      continue;
    }
    const held = request.caps[unit.id];
    caps[unit.id] =
      held === undefined
        ? Math.floor(request.housing.authority / Math.max(1, unit.cost))
        : largestSustained(held, repeats);
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

/**
 * **What a take-out re-derives** (S-107, 2026-09-19; the owner: *"taking out one group, like SP1, doesn't
 * compute again the mercs and I'm left with a merc stack that's below what could be added with proper
 * shielding"*).
 *
 * Two promises, on top of the three `holds` reads back:
 *
 *  1. **the bound is never tighter than the plan's own count**. A stop's march is repeated as often as it is,
 *     so every count in it already lasts those marches — `largestSustained(stock, repeats)` is therefore at
 *     least what the stop fields, and the cap can only give the sizer *more* room than S-104's did;
 *  2. **the sheltered maximum is reached**: the answer fields at least what the stop did of every hired type,
 *     unless the march it is now standing on forbids it — the type's own count would stand at or over the
 *     lowest troop stack (the shelter), or putting it back would ask for more authority than the camp
 *     houses. Those are the only two things allowed to leave a stack smaller than the plan had it.
 */
function reDerives(
  request: StackRequest,
  stop: PlanTotals,
  caps: Record<string, number>,
  answer: ResizedMarch,
): void {
  const { result } = planMarch(request, answer.counts);
  const troopStacks = result.stacks.filter((stack) => stack.pool === 'leadership' && stack.count > 0);
  if (troopStacks.length === 0) return;
  const floor = Math.min(...troopStacks.map((stack) => stack.totalHp));
  const usedAuthority = request.units.reduce(
    (sum, unit) => sum + (unit.pool === 'authority' ? (answer.counts[unit.id] ?? 0) * unit.cost : 0),
    0,
  );
  for (const unit of request.units) {
    if (unit.pool !== 'authority') continue;
    const had = stop.counts[unit.id] ?? 0;
    expect(
      caps[unit.id] ?? 0,
      `${unit.id}: the sustain bound is under the stop's own count`,
    ).toBeGreaterThanOrEqual(had);
    const got = answer.counts[unit.id] ?? 0;
    if (got >= had) continue;
    // The **effective** HP, bonuses and all — what the shelter is read on (`shelterUnder`), not the table's
    // base health.
    const hp = effectiveTable(request).find((entry) => entry.id === unit.id)?.hp ?? 0;
    const sheltered = had * hp < floor;
    const houses = usedAuthority - got * unit.cost + had * unit.cost <= request.housing.authority;
    expect(
      sheltered && houses,
      `${unit.id}: the stop stood ${String(had)} and the re-size fields ${String(got)}, ` +
        `under a floor of ${floor.toLocaleString('en-US')} HP with ` +
        `${usedAuthority.toLocaleString('en-US')} of ${request.housing.authority.toLocaleString('en-US')} ` +
        `authority spent`,
    ).toBe(false);
  }
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
          const hired = capsFor(scenario.request, stop.counts, planRepeats(stop));
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
              reDerives(scenario.request, stop, hired, answer as ResizedMarch);
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
        const caps = capsFor(camp.request, taken, planRepeats(stop));
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
      const caps = capsFor(camp.request, stop.counts, planRepeats(stop));
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
    'a hired type the caps hold at nothing stays out, whatever the floor would shelter',
    () => {
      if (camp === undefined) return;
      const plan = planFor(camp.request);
      expect(plan).not.toBeNull();
      const stop = (plan as CampaignPlan).recommend ?? (plan as CampaignPlan);
      const troops = troopIdsOf(camp.request).filter((id) => (stop.counts[id] ?? 0) > 0);
      const merc = camp.request.units.find((unit) => unit.pool === 'authority');
      if (!merc) throw new Error('his camp hires a mercenary');
      // A cap of nothing is what a stock too small to last every march of this stop looks like (S-107,
      // `largestSustained`), and the re-size may not spend past a cap whatever the troops would shelter.
      // The pane names the type rather than leaving the pill to bounce back without a word
      // (`MarchResize.noStock`, `resizeWords`).
      const caps = { ...capsFor(camp.request, stop.counts, planRepeats(stop)), [merc.id]: 0 };
      const answer = resizeMarchOver(camp.request, { troopIds: troops, hired: caps });
      expect(answer).not.toBeNull();
      holds(camp.request, caps, troops, answer as ResizedMarch);
      expect((answer as ResizedMarch).counts[merc.id] ?? 0).toBe(0);
    },
    180_000,
  );
});

/**
 * **Taking a type out re-derives the hired count up to what the shelter allows** (S-107, 2026-09-19; the
 * owner: *"taking out one group, like SP1, doesn't compute again the mercs and I'm left with a merc stack
 * that's below what could be added with proper shielding"*).
 *
 * The two camps he plays, measured the day it was written — the sweet spot, its lowest fielded troop type
 * taken out, under S-104's caps (the stop's own counts) and under these:
 *
 *  - **his 450-hunter camp**, Rider I out. The stacks that are left grow and the floor rises from the stop's
 *    456 624 HP to **696 340**; the answer is the same four troop stacks either way (Archer II 1 625 ·
 *    Spearman II 1 290 · Rider II 660 · Rider III 370) for the same **2 635 500** silver and the same
 *    12 d 10 h of queue — and the hunters go **38 → 72**, damage **1 902 783 → 2 452 872** (+28.9 %), the
 *    burn 4 → 8 chunks. 72 is the sheltered maximum to the unit: one more hunter stands over 696 340 HP.
 *    The cap the re-size is given is `largestSustained(450, 3)` = **374**, never 38.
 *  - **his TotalStack profile**, Archer I out: the floor is 319 260, the hunters go **49 → 62** (the
 *    sheltered maximum), damage **2 016 985 → 2 163 313** (+7.3 %) for the same 2 234 900 silver and the
 *    same queue, the burn 5 → 7, and the four tier-3 monsters are unmoved at 10 · 4 · 3 · 3 for 960 coins.
 *    Its cap is `largestSustained(80, 3)` = **66**.
 *
 * **And a put-back still re-derives downward**, which is the half S-104 already had: putting Archer I back
 * on the first camp lowers the floor to 336 878 and the answer is **35** hunters for 1 987 686 — the same
 * march under both cap rules, to the unit, because the shelter and not the cap is what binds there.
 */
describe('taking a type out re-derives the hired count up to what the shelter allows', () => {
  const camps = [
    { find: 'hunters 450', hired: 'epic-monster-hunter-6', before: 38, after: 72, cap: 374 },
    { find: 'TotalStack profile', hired: 'epic-monster-hunter-5', before: 49, after: 62, cap: 66 },
  ];
  for (const camp of camps) {
    const scenario = criteriaScenarios().find((one) => one.label.includes(camp.find));
    const when = scenario === undefined ? test.skip : test;
    when(
      camp.find,
      () => {
        if (scenario === undefined) return;
        const plan = planFor(scenario.request);
        expect(plan).not.toBeNull();
        const stop = (plan as CampaignPlan).recommend ?? (plan as CampaignPlan);
        expect(stop.counts[camp.hired] ?? 0).toBe(camp.before);
        const repeats = planRepeats(stop);
        const caps = capsFor(scenario.request, stop.counts, repeats);
        // The cap is what the stock sustains over the stop's own repeats, not what the stop fields.
        expect(caps[camp.hired]).toBe(camp.cap);

        const fielded = troopIdsOf(scenario.request).filter((id) => (stop.counts[id] ?? 0) > 0);
        const byId = new Map(scenario.request.units.map((unit) => [unit.id, unit]));
        const lowest = fielded.reduce((held, id) =>
          (byId.get(id)?.tier ?? 0) < (byId.get(held)?.tier ?? 0) ? id : held,
        );
        const wanted = fielded.filter((id) => id !== lowest);
        const answer = resizeMarchOver(scenario.request, { troopIds: wanted, hired: caps });
        expect(answer).not.toBeNull();
        const resized = answer as ResizedMarch;
        holds(scenario.request, caps, wanted, resized);
        reDerives(scenario.request, stop, caps, resized);

        // The hunters rise to what the new floor shelters, and one more would not fit under it.
        expect(resized.counts[camp.hired] ?? 0).toBe(camp.after);
        const { result } = planMarch(scenario.request, resized.counts);
        const floor = Math.min(
          ...result.stacks
            .filter((stack) => stack.pool === 'leadership' && stack.count > 0)
            .map((stack) => stack.totalHp),
        );
        const hp = effectiveTable(scenario.request).find((entry) => entry.id === camp.hired)?.hp ?? 0;
        expect(hp).toBeGreaterThan(0);
        expect(camp.after * hp).toBeLessThan(floor);
        expect((camp.after + 1) * hp).toBeGreaterThanOrEqual(floor);

        // And the old rule — the stop's own count as the ceiling — fields the stop's own stack again and
        // hits less hard for exactly the same silver and the same queue. That is the owner's sentence.
        const ceiling = resizeMarchOver(scenario.request, {
          troopIds: wanted,
          hired: { ...caps, [camp.hired]: camp.before },
        });
        expect(ceiling).not.toBeNull();
        const old = ceiling as ResizedMarch;
        expect(old.counts[camp.hired] ?? 0).toBe(camp.before);
        expect(resized.damage).toBeGreaterThan(old.damage);
        expect(resized.silver).toBe(old.silver);
        expect(resized.seconds).toBe(old.seconds);
      },
      180_000,
    );
  }
});

/**
 * **S-117 — a press never answers with a march the stop beats.**
 *
 * The owner, 2026-09-20: *"I'm not that sure any more that when removing or adding a troop … we should not
 * compute again the best possible outcome."* The defect underneath his doubt was not the objective but the
 * candidate list: nothing in the family `resizeMarchOver` builds was *"this march, with that one type taken
 * out or put in, and nothing else touched"*, and that family is a strict subset of the one `planCampaign`
 * walked to build the stop. So a press could only move the player to a **different** march, and on three of
 * the fourteen stops measured it moved them to a worse one — 85.3 % of the damage for 101 % of the silver on
 * his live account, and investigation 0024 §5's 5 143 823 for 2 498 200 against 5 763 382 for 2 449 200.
 *
 * The contract, on the press that changes **no type at all** — a put-back whose type cannot be fielded, a
 * `Put back all` over types that do not fit: **the answer never deals less damage than the march it
 * replaced.** `MarchWithin.stop` is what makes it true; `beats` is untouched.
 *
 * The test proves it is **not vacuous** in the same pass: it counts the stops where the family's own best
 * (the same call with no `stop`, which is the re-size as S-107 shipped it) falls short of the stop's own
 * march, and fails if that count is zero — a corpus where the defect cannot fire would make the assertion
 * above prove nothing.
 */
describe('S-117 · the march on screen is a candidate of its own re-size', () => {
  test('a press that changes no type never lowers the damage, and the corpus can tell', () => {
    let bound = 0;
    let stops = 0;
    for (const scenario of criteriaScenarios()) {
      const plan = planFor(scenario.request);
      if (plan === null) continue;
      for (const stop of plan.alternatives) {
        const fielded = troopIdsOf(scenario.request).filter((id) => (stop.counts[id] ?? 0) > 0);
        if (fielded.length === 0) continue;
        const caps = capsFor(scenario.request, stop.counts, planRepeats(stop));
        const within = { troopIds: fielded, hired: caps };
        const answer = resizeMarchOver(scenario.request, { ...within, stop: stop.counts });
        expect(answer).not.toBeNull();
        const got = answer as ResizedMarch;
        stops += 1;
        holds(scenario.request, caps, fielded, got);

        // What the stop's own march is worth, priced the way the answer is (S-94, the worst opening).
        const itsOwn = Math.round(planMarch(scenario.request, stop.counts).summary.minDamage);
        expect(
          got.damage,
          `${scenario.label} · ${stop.pick}: the press answered with ${got.damage.toLocaleString(
            'en-US',
          )} where the march on screen deals ${itsOwn.toLocaleString('en-US')}`,
        ).toBeGreaterThanOrEqual(itsOwn);

        // Non-vacuity: the family on its own — the re-size as it shipped before S-117 — falls short here.
        const family = resizeMarchOver(scenario.request, within);
        if (family !== null && family.damage < itsOwn) bound += 1;
      }
    }
    expect(stops).toBeGreaterThan(0);
    expect(
      bound,
      'no stop in the corpus beats the shapes the re-size builds, so the assertion above proves nothing',
    ).toBeGreaterThan(0);
  }, 180_000);
});

/**
 * **S-117 — the dial takes wins and never trades.**
 *
 * `MarchWithin.fills` offers the same shapes at a smaller leadership pool. Experiment 119 measured that dial
 * on a **generated stop** and found 0 marches worth taking, which retired S-115; after an **edit** the type
 * set, the troop floor and the kill order have all moved, and 363 marches gave dominations — the export at
 * 96 % of its pool deals 102.2 % of the full-pool answer's damage for 96 % of the silver at identical burn.
 *
 * The contract is the one that makes the dial safe to apply with no control on screen: **a fill below 100 is
 * taken only when it dominates** — at least the damage, no more silver, no more hired burnt, and no more
 * troop types left unfielded. A fill that merely trades damage for silver is never taken, whatever its rate.
 */
describe('S-117 · a smaller leadership pool is taken only when it dominates', () => {
  test('every dialled answer beats the full-pool one on damage, silver and burn', () => {
    let dialled = 0;
    let edits = 0;
    for (const scenario of criteriaScenarios()) {
      const plan = planFor(scenario.request);
      if (plan === null) continue;
      for (const stop of plan.alternatives) {
        const troops = troopIdsOf(scenario.request);
        const fielded = troops.filter((id) => (stop.counts[id] ?? 0) > 0);
        if (fielded.length <= 2) continue;
        const caps = capsFor(scenario.request, stop.counts, planRepeats(stop));
        // The two edits a player makes first: the lowest type out, and the highest.
        for (const gone of [fielded[0], fielded[fielded.length - 1]]) {
          if (gone === undefined) continue;
          const wanted = fielded.filter((id) => id !== gone);
          const within = { troopIds: wanted, hired: caps, stop: stop.counts };
          const flat = resizeMarchOver(scenario.request, within);
          const dial = resizeMarchOver(scenario.request, { ...within, fills: CAMPAIGN.editFills });
          if (flat === null || dial === null) continue;
          edits += 1;
          holds(scenario.request, caps, wanted, dial);
          expect(dial.fill).toBeGreaterThan(0);
          expect(dial.fill).toBeLessThanOrEqual(100);
          if (dial.fill >= 100) {
            // No fill dominated, so the answer is the full-pool one, unchanged.
            expect(dial.damage).toBe(flat.damage);
            expect(dial.silver).toBe(flat.silver);
            continue;
          }
          dialled += 1;
          const where = `${scenario.label} · ${stop.pick} · without ${gone} at ${String(dial.fill)} %`;
          // With no policy passed, a taken fill is a win and nothing else: it never gives up damage, so it
          // never has a trade to disclose.
          expect(dial.traded, `${where}: a trade was taken without the rates being given`).toBeUndefined();
          expect(dial.damage, `${where}: less damage than the full pool`).toBeGreaterThanOrEqual(flat.damage);
          expect(dial.silver, `${where}: more silver than the full pool`).toBeLessThanOrEqual(flat.silver);
          expect(dial.mercLost, `${where}: more hired burnt than the full pool`).toBeLessThanOrEqual(
            flat.mercLost,
          );
          expect(dial.unfielded.length).toBeLessThanOrEqual(flat.unfielded.length);
          // And it is a win rather than a draw: something is strictly better, or it would not be taken.
          expect(
            dial.damage > flat.damage || dial.silver < flat.silver || dial.mercLost < flat.mercLost,
            `${where}: taken without beating the full pool on anything`,
          ).toBe(true);
        }
      }
    }
    expect(edits).toBeGreaterThan(0);
    // Reported rather than asserted: whether a benchmark army has a dominating fill at all is a fact about
    // those armies, and the contract above has to hold whether it is 0 or every one of them.
    expect(dialled).toBeLessThanOrEqual(edits);
  }, 180_000);
});

/**
 * **S-117 change 3 — a trade is taken only inside the player's own rates, and it says what it cost.**
 *
 * The owner, 2026-09-21, having read what a dominations-only dial leaves on the table: *"do change 3 too"*.
 * `MarchWithin.putBack` lets a fill that gives up damage be taken as well — the same `CAMPAIGN.putBack`
 * arithmetic `putBackOn` applies to a stop at Generate time, said about a leadership fill.
 *
 * Four promises, over every take-out of every stop of every benchmark scenario:
 *
 *  1. a trade is never taken when a **win** exists — the answer with the rates is at least as good on damage
 *     as the answer without them whenever the latter dialled at all;
 *  2. every trade is **inside the rates**: it recovers faster, scores at least zero, and loses no more than
 *     `damageLossCap` of the damage;
 *  3. it never burns more of the hired stock and never leaves a type unfielded that the full pool fielded —
 *     neither of those is damage, and neither is on the scale the rates weigh;
 *  4. it **discloses**: `traded` is present exactly when the answer gave up damage, and its three figures
 *     are the ones a reader can check against the two marches.
 */
describe('S-117 · a trade is taken at the owner’s rates, and never in place of a win', () => {
  test('every trade recovers faster, scores, stays inside the cap and says what it cost', () => {
    let trades = 0;
    let edits = 0;
    for (const scenario of criteriaScenarios()) {
      const plan = planFor(scenario.request);
      if (plan === null) continue;
      for (const stop of plan.alternatives) {
        const troops = troopIdsOf(scenario.request);
        const fielded = troops.filter((id) => (stop.counts[id] ?? 0) > 0);
        if (fielded.length <= 2) continue;
        const caps = capsFor(scenario.request, stop.counts, planRepeats(stop));
        for (const gone of [fielded[0], fielded[fielded.length - 1]]) {
          if (gone === undefined) continue;
          const wanted = fielded.filter((id) => id !== gone);
          const within = { troopIds: wanted, hired: caps, stop: stop.counts };
          const full = resizeMarchOver(scenario.request, within);
          const wins = resizeMarchOver(scenario.request, { ...within, fills: CAMPAIGN.editFills });
          const rated = resizeMarchOver(scenario.request, {
            ...within,
            fills: CAMPAIGN.editFills,
            putBack: CAMPAIGN.putBack,
          });
          if (full === null || wins === null || rated === null) continue;
          edits += 1;
          holds(scenario.request, caps, wanted, rated);
          const where = `${scenario.label} · ${stop.pick} · without ${gone}`;

          // 1 — a win is never given up for a trade.
          if (wins.fill < 100) {
            expect(rated.traded, `${where}: a trade was taken where a fill wins outright`).toBeUndefined();
            expect(rated.damage).toBe(wins.damage);
            expect(rated.silver).toBe(wins.silver);
            continue;
          }

          // 4 — disclosure, both ways round: a trade says so, and an answer that gave up nothing does not.
          if (rated.fill >= 100 || rated.damage >= full.damage) {
            expect(rated.traded, `${where}: nothing was given up, so nothing is disclosed`).toBeUndefined();
            continue;
          }
          trades += 1;
          const cost = rated.traded;
          expect(cost, `${where}: damage was given up without saying so`).toBeDefined();
          if (cost === undefined) continue;

          // 2 — inside the rates, re-derived here from the two marches rather than read back.
          const saved = (before: number, after: number): number =>
            before > 0 ? ((before - after) / before) * 100 : 0;
          const damage = -saved(full.damage, rated.damage);
          const silver = saved(full.silver, rated.silver);
          const seconds = saved(full.seconds, rated.seconds);
          expect(cost.damage).toBeCloseTo(damage, 6);
          expect(cost.silver).toBeCloseTo(silver, 6);
          expect(cost.seconds).toBeCloseTo(seconds, 6);
          expect(rated.seconds, `${where}: a trade that recovers no faster`).toBeLessThan(full.seconds);
          expect(-damage, `${where}: past the damage cap`).toBeLessThanOrEqual(
            CAMPAIGN.putBack.damageLossCap,
          );
          const score =
            silver / CAMPAIGN.putBack.silverPerDamage + seconds / CAMPAIGN.putBack.timePerDamage + damage;
          expect(score, `${where}: taken on a negative score`).toBeGreaterThanOrEqual(0);

          // 3 — and never with the rare stock, which the rates do not weigh.
          expect(rated.mercLost, `${where}: a trade that burns more hired`).toBeLessThanOrEqual(
            full.mercLost,
          );
          expect(rated.unfielded.length).toBeLessThanOrEqual(full.unfielded.length);
        }
      }
    }
    expect(edits).toBeGreaterThan(0);
    expect(trades).toBeLessThanOrEqual(edits);
  }, 180_000);
});
