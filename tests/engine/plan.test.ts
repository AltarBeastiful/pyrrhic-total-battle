/**
 * S-55 — `planCampaign`: the campaign planned from the army alone. What is asserted here is the contract the
 * UI relies on, not any particular plan: the counts are fieldable, the marches obey the game's decay of the
 * mercenary stock, the damage each march shows is the battle's own, the frontier is really non-dominated, and
 * a silver budget is respected.
 */
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { emptyTotals, planCampaign, planMarch } from '@/engine';
import type { StackRequest, UnitDef } from '@/engine/types';
import type { CampaignInput, PlanRepeat, PlanTotals } from '@/engine/plan';
import { effectiveUnit } from '@/engine/units';
import { parseImport } from '@/share/exportImport';
import { newProfile } from '@/state/defaults';
import { buildPlanRequest, buildStackRequest } from '@/state/derive';

const OWNER_EXPORT =
  process.env.PYRRHIC_EXPORT_2026_09_17 ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-17 (2).json';

/** A small but complete army: four troop types and three mercenaries with a stock to spend. */
function request(silver = false): StackRequest {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3);
  // The hired soldiers, not the monster-class units that share the authority pool (a quarter-million HP
  // apiece): a plan has to shelter whatever it fields, so the pool's biggest units are not a test army.
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000);
  expect(troops.length).toBeGreaterThan(2);
  expect(mercs.length).toBeGreaterThan(1);
  const chosen: UnitDef[] = [...troops.slice(0, 4), ...mercs.slice(0, 3)];
  const caps: Record<string, number> = {};
  for (const merc of mercs.slice(0, 3)) caps[merc.id] = 20;
  return {
    units: chosen,
    caps,
    housing: { leadership: 4_000, authority: 2_000, dominance: 0 },
    totals: emptyTotals(),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
    ...(silver ? {} : {}),
  };
}

/** A first-run army (Guardsmen I–III, Specialists I, no bonuses) with the hired types at their stocks. */
function firstRun(...hired: { id: string; cap: number }[]): StackRequest {
  const profile = newProfile('first run');
  profile.mercenaries.selected = hired;
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return buildStackRequest(profile, {
    ...setup,
    housing: { leadership: 20_000, authority: 40_000, dominance: 0 },
  });
}

/**
 * The hired units a march **fields**, Σ counts over the authority pool. The bar itself runs along the
 * **burn** — what the stock pays, `ceil(n/10)` a stack — and this is the one reading the engine takes off the
 * counts: the `all-in` stop is offered when its first march fields more than the steady max's repeat, because
 * a stock smaller than a chunk burns the same whatever it fields (`plan.ts`, the all-in offer).
 */
const fieldedOf = (req: StackRequest, counts: Record<string, number>): number =>
  Object.entries(counts).reduce(
    (sum, [id, count]) =>
      req.units.find((unit) => unit.id === id)?.pool === 'authority' ? sum + count : sum,
    0,
  );

/** The marches a stop plays, first to last: its own sequence, or its repeats and the final march. */
function marchesOf(row: PlanTotals): Record<string, number>[] {
  if (row.sequence) return row.sequence;
  const repeats = row.marches - (row.finaleCounts ? 1 : 0);
  const marches = Array.from({ length: repeats }, () => row.counts);
  return row.finaleCounts ? [...marches, row.finaleCounts] : marches;
}

const used = (req: StackRequest, counts: Record<string, number>, pool: string): number =>
  Object.entries(counts).reduce((sum, [id, count]) => {
    const unit = req.units.find((candidate) => candidate.id === id);
    return unit?.pool === pool ? sum + count * unit.cost : sum;
  }, 0);

// The search is a real one — it walks the march count, the mercenary counts and the ladder — so each case
// gets a budget well above the default five seconds.
const TIMEOUT = 60_000;

describe(
  'planCampaign',
  () => {
    test('sizes a plan whose counts are fieldable and whose damage is the battle’s own', () => {
      const req = request();
      const plan = planCampaign({ request: req });

      expect(plan.marches).toBeGreaterThan(0);
      expect(used(req, plan.march.counts, 'leadership')).toBeLessThanOrEqual(req.housing.leadership);
      expect(used(req, plan.march.counts, 'authority')).toBeLessThanOrEqual(req.housing.authority);

      // The march's own figure is the one `marchResult`/`simulateBattle` gives for those counts.
      const its = planMarch(req, plan.march.counts);
      expect(plan.march.damage).toBe(its.summary.avgDamage);

      // The plan's total is its marches plus its final march, nothing else.
      const repeated = plan.marches - (plan.finale ? 1 : 0);
      const finale = plan.finale ? planMarch(req, plan.finale.counts).summary.avgDamage : 0;
      expect(plan.totalDamage).toBe(repeated * plan.march.damage + finale);
    });

    /**
     * The owner, 2026-09-15: *"a horizon of 1 plays 2 marches"*. `targetRepeats` clamped to a whole repeat
     * (`max(1, planned − 1)`), so a **one-march** target played a repeat *and* a finale. The target is the
     * campaign's total, and a campaign that is not repeated has nothing to leave over for a final march.
     */
    test(
      'plays exactly the marches it was asked for, a target of one included',
      () => {
        const req = request();

        const one = planCampaign({ request: req, marchTarget: 1 });
        expect(one.marches).toBe(1);
        // No finale: a plan of one march leaves nothing over, so the single march is the repeated one.
        expect(one.finaleCounts).toBeUndefined();

        for (const target of [2, 3, 10]) {
          const plan = planCampaign({ request: req, marchTarget: target });
          expect(plan.marches, `a target of ${String(target)} must play ${String(target)} marches`).toBe(
            target,
          );
        }
      },
      TIMEOUT,
    );

    /**
     * **The horizon is a ceiling, not a requirement** (owner, 2026-09-18: *"no more magic static numbers"*).
     *
     * A first-run army holding one or two of a hired type holds **no** count that lasts three repeats, so its
     * grid came back empty, `planCampaign` threw, and the app answered "it needs your mercenaries filled in
     * first" (`src/ui/sections/march/generate.ts`) to a player who had filled them in. A stock the horizon
     * outruns plays the marches it lasts; a stock that carries the horizon still plays all four of them.
     */
    test(
      'a stock the horizon outruns plays a shorter campaign instead of being refused',
      () => {
        for (const cap of [1, 2]) {
          const req = firstRun({ id: 'bear-5', cap });
          const plan = planCampaign({ request: req, marchTarget: 4, ...CAMPAIGN.planFixes });
          // One bear lasts one march at a count of one, two bears two: the campaign is exactly that long.
          expect(plan.marches, `a stock of ${String(cap)} plays as many marches as it lasts`).toBe(cap);
          expect(plan.alternatives.length).toBeGreaterThan(0);
          for (const row of plan.alternatives) {
            // The plan is about spreading the hired stock, so every stop fields the one type it holds…
            expect(row.counts['bear-5'] ?? 0, `${row.pick} fields the bear`).toBeGreaterThan(0);
            expect(row.marches).toBeGreaterThanOrEqual(1);
            expect(row.marches).toBeLessThanOrEqual(4);
            // …and never more of it than the stock still has, a chunk of ten lost for good every march.
            let left = cap;
            for (const counts of marchesOf(row)) {
              const fielded = counts['bear-5'] ?? 0;
              expect(
                fielded,
                `${row.pick} fields ${String(fielded)} of ${String(left)} left`,
              ).toBeLessThanOrEqual(left);
              left -= Math.ceil(fielded / 10);
            }
            expect(left).toBeGreaterThanOrEqual(0);
          }
        }
        // A stock that carries the horizon is unchanged: it plays the four marches it was asked for.
        const carried = planCampaign({
          request: firstRun({ id: 'epic-monster-hunter-6', cap: 83 }),
          marchTarget: 4,
          ...CAMPAIGN.planFixes,
        });
        expect(carried.marches).toBe(4);
      },
      TIMEOUT,
    );

    /**
     * **A short type rides the finale; it does not shorten everybody's campaign** (coordinator, 2026-09-18,
     * measuring the first reading of the ceiling on the owner's export at 7 000 with the chariot cap cut to
     * two: the sweet spot and the steady max became two-march campaigns of 9 705 867 and 9 838 204 while the
     * all-in went on playing four for 20 877 865 — two chariots halving the campaign of an account holding 234
     * other hired units, because S-58 B asks every stop to field every stocked type and an outrun type then
     * caps the repeats for all of them).
     *
     * So the repeated march leaves a type the horizon outruns alone, and the final march spends its whole
     * stock; S-58 B is judged over the campaign, so a plan whose finale carries it is not a hole.
     */
    test(
      'a type the horizon outruns rides the finale when another type carries the horizon',
      () => {
        // The hunter's 83 carry four marches; two bears carry none of them.
        const req = firstRun({ id: 'epic-monster-hunter-6', cap: 83 }, { id: 'bear-5', cap: 2 });
        const plan = planCampaign({ request: req, marchTarget: 4, ...CAMPAIGN.planFixes });
        expect(plan.marches).toBe(4);
        for (const row of plan.alternatives) {
          expect(row.marches, `${row.pick} plays the horizon`).toBe(4);
          // The all-in stop is a sequence of four different marches and front-loads the short type itself.
          if (row.sequence) {
            expect(row.sequence.some((march) => (march['bear-5'] ?? 0) > 0)).toBe(true);
            continue;
          }
          expect(row.counts['bear-5'] ?? 0, `${row.pick} keeps the bears out of its repeat`).toBe(0);
          expect(row.finaleCounts?.['bear-5'] ?? 0, `${row.pick} spends the bears in its finale`).toBe(2);
          // The hunters are rationed over the repeats, as they were.
          expect(row.counts['epic-monster-hunter-6'] ?? 0).toBeGreaterThan(0);
        }
      },
      TIMEOUT,
    );

    /**
     * **The training queue is a price like the other two** (owner, 2026-09-18: *"generation sometimes skips
     * low-level stacks and misses some damage that seems cheap; it is mainly because one thing is not taken
     * into account: troops of higher tier are longer to train"*).
     *
     * `PlanRepeat.seconds` is what the March's recap prints for the same counts, to the second, exactly as
     * `repeat.damage` already agrees with the battle's own figure. The plan prices a march the way this file
     * prices everything — the troops retrained, the hired units revived for gold — so the equality is against
     * a request whose recovery plan is `retrain`, which is the app's default and the one this army uses.
     */
    test(
      'prices a march\u2019s recovery time as the recap does, and the campaign as the sum of its marches',
      () => {
        const req = planCampaign({ request: request() });
        const its = planMarch(request(), req.march.counts);
        expect(req.march.seconds).toBeGreaterThan(0);
        expect(req.march.seconds).toBe(its.summary.recovery.seconds);

        // Every stop the bar offers says the same thing about the march it repeats.
        for (const row of req.alternatives) {
          expect(row.repeat.seconds, `${row.pick} prices its own march`).toBe(
            planMarch(request(), row.counts).summary.recovery.seconds,
          );
          // A stop's campaign is its marches' queues added up, whether it repeats one march or plays a
          // sequence of different ones (`PlanTotals.seconds`).
          const queue = marchesOf(row).reduce(
            (sum, counts) => sum + planMarch(request(), counts).summary.recovery.seconds,
            0,
          );
          expect(row.seconds, `${row.pick} adds its marches up`).toBe(queue);
        }

        // The plan itself: its repeats plus its finale, the same arithmetic its damage obeys above.
        const repeated = req.marches - (req.finale ? 1 : 0);
        expect(req.seconds).toBe(repeated * req.march.seconds + (req.finale?.seconds ?? 0));
      },
      TIMEOUT,
    );

    test('never fields more of a mercenary than the stock has, and lasts the marches the stock allows', () => {
      const req = request();
      const plan = planCampaign({ request: req });
      for (const [id, count] of Object.entries(plan.march.mercFielded)) {
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(req.caps[id] ?? 0);
      }
      // Every unit fielded a march is lost at one per chunk of ten, so the stock must cover the plan.
      for (const [id, count] of Object.entries(plan.march.mercFielded)) {
        const chunksLost = Math.ceil(count / 10);
        const repeated = plan.marches - (plan.finale ? 1 : 0);
        expect(repeated * chunksLost).toBeLessThanOrEqual(req.caps[id] ?? 0);
      }
    });

    test('keeps a silver budget and says so', () => {
      const req = request();
      const tight = 2_000_000;
      const plan = planCampaign({ request: req, silverBudget: tight });
      expect(plan.silver).toBeLessThanOrEqual(tight * 1.001);

      // A budget too small to shelter the mercenaries at all is refused rather than quietly broken: the
      // march it would have to field is one the game cannot pay for.
      expect(() => planCampaign({ request: req, silverBudget: 1_000 })).toThrow(/no feasible plan/);
    });

    test('the frontier is non-dominated, thriftiest first, and carries the march of each point', () => {
      const req = request();
      const plan = planCampaign({ request: req });
      const rows = plan.alternatives;
      expect(rows.length).toBeGreaterThan(1);
      for (let index = 1; index < rows.length; index += 1) {
        const previous = rows[index - 1];
        const current = rows[index];
        if (!previous || !current) continue;
        expect(current.repeat.mercLost).toBeGreaterThanOrEqual(previous.repeat.mercLost);
      }
      // The frontier property: no plan on it may be beaten by another on *every* resource at once. Damage
      // need not rise with silver — a cheaper plan can burn more mercenaries — so this, not monotonicity, is
      // what "non-dominated" means here.
      for (const a of rows) {
        for (const b of rows) {
          if (a === b) continue;
          const beats =
            b.silver <= a.silver &&
            b.mercLost <= a.mercLost &&
            b.totalDamage >= a.totalDamage &&
            (b.silver < a.silver || b.mercLost < a.mercLost || b.totalDamage > a.totalDamage);
          expect(beats).toBe(false);
        }
      }
      for (const row of rows) {
        expect(Object.keys(row.counts).length).toBeGreaterThan(0);
        const its = planMarch(req, row.counts);
        expect(its.summary.avgDamage).toBeGreaterThan(0);
      }
    });

    test('without a budget it recommends the plan between the two ends of the trade', () => {
      const req = request();
      const plan = planCampaign({ request: req });
      const recommend = plan.recommend;
      expect(recommend).toBeDefined();
      if (!recommend) return;
      // The answer is one of the plans it drew…
      expect(
        plan.alternatives.some(
          (row) => row.silver === recommend.silver && row.totalDamage === recommend.totalDamage,
        ),
      ).toBe(true);
      // …and it sits between the two ends of the trade: it does not beat the silver-efficiency peak on
      // silver, nor the mercenary-efficiency peak on mercenaries. That is what "the compromise" means.
      expect(plan.mostEfficient).toBeDefined();
      expect(plan.mostThrifty).toBeDefined();
      if (plan.mostEfficient) {
        expect(recommend.damagePerSilver).toBeLessThanOrEqual(plan.mostEfficient.damagePerSilver + 1e-6);
      }
      if (plan.mostThrifty) {
        expect(recommend.damagePerMercenary).toBeLessThanOrEqual(plan.mostThrifty.damagePerMercenary + 1e-6);
      }
    });

    test('its marches are the longest the stock allows for the counts it fields', () => {
      const req = request();
      const plan = planCampaign({ request: req });
      for (const row of plan.alternatives) {
        const counts = Object.entries(row.counts).filter(
          ([id]) => req.units.find((unit) => unit.id === id)?.pool === 'authority',
        );
        if (counts.length === 0) continue;
        const repeated = row.marches - (row.finaleCounts ? 1 : 0);
        for (const [id, count] of counts) {
          const held = req.caps[id] ?? 0;
          const lasts = Math.floor((held - count) / Math.ceil(count / 10)) + 1;
          expect(repeated).toBeLessThanOrEqual(lasts);
        }
      }
    });

    test('the bar: a monotone ladder along the burn, the sweet spot on it, three stops', () => {
      // Review of 2026-09-16/17 (`tools/theorycraft/out/91`, `92`): behind `barAxis: 'burn'` the bar runs along
      // hired units burned a march, one plan a level, and only where burning more buys more.
      const req = request();
      const burn = planCampaign({ request: req, withTrade: true });
      const rows = burn.alternatives;
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.length).toBeLessThanOrEqual(5);

      // Sorted by burn, no two rung stops burn the same, and damage climbs with the burn: a stop never asks
      // for more of the stock than the one to its left for less damage.
      //
      // **The `all-in` may share the burn of the stop before it** (re-based 2026-09-18). It is offered on what
      // its first march *fields* rather than on what it burns, because a stock smaller than a chunk burns the
      // same whatever it fields — and then it is sorted onto the bar by the burn like every other stop, so it
      // can land on the rung it was told apart from. It is always last, being the dearest march at its burn.
      for (let index = 1; index < rows.length; index += 1) {
        const previous = rows[index - 1];
        const current = rows[index];
        if (!previous || !current) continue;
        if (current.pick === 'all-in') {
          expect(current.repeat.mercLost).toBeGreaterThanOrEqual(previous.repeat.mercLost);
          expect(fieldedOf(req, current.counts)).toBeGreaterThan(fieldedOf(req, previous.counts));
          continue;
        }
        expect(current.repeat.mercLost).toBeGreaterThan(previous.repeat.mercLost);
        // The all-in stop fields every mercenary the troops can shelter, which can cost troops: it burns the
        // most and need not hit the hardest a march.
        expect(current.repeat.damage).toBeGreaterThan(previous.repeat.damage);
      }
      // Each rung stop is the best march at its burn level among the plans the bar may carry; the least-silver
      // stop is a different thing — the cheapest efficient march left of the sweet spot — and must cost less.
      const trade = burn.trade ?? [];
      for (const row of rows) {
        if (row.pick === 'all-in') continue;
        if (row.pick === 'silver-saver') {
          const sweetRow = rows.find((other) => other.pick === 'sweet-spot');
          expect(row.repeat.silver).toBeLessThanOrEqual(sweetRow?.repeat.silver ?? Infinity);
          continue;
        }
        const level = trade.filter((other) => other.repeat.mercLost === row.repeat.mercLost);
        expect(Math.max(...level.map((other) => other.repeat.damage))).toBe(row.repeat.damage);
      }
      // The top is the most damage of everything the bar could carry; the sweet spot is on the bar and is the
      // recommendation.
      const rungStops = rows.filter((row) => row.pick !== 'all-in');
      expect(rungStops[rungStops.length - 1]?.pick).toBe('steady-max');
      expect(rungStops[rungStops.length - 1]?.repeat.damage).toBe(
        Math.max(...trade.map((other) => other.repeat.damage)),
      );
      const sweet = rows.find((row) => row.pick === 'sweet-spot');
      expect(sweet).toBeDefined();
      expect(burn.recommend?.counts).toEqual(sweet?.counts);
      for (const row of rows) {
        expect(['silver-saver', 'sweet-spot', 'more-mercs', 'steady-max', 'all-in']).toContain(row.pick);
      }
      // The sweet spot is a plan no rung of the ladder beats on both efficiencies at once (owner, 2026-09-17:
      // his sweet spot at 15 burned lost to the 12 stop on damage a silver *and* a hired).
      const rungs = new Map<number, (typeof trade)[number]>();
      for (const row of trade) {
        const held = rungs.get(row.repeat.mercLost);
        if (!held || row.repeat.damage > held.repeat.damage) rungs.set(row.repeat.mercLost, row);
      }
      const ratios = (row: { repeat: PlanRepeat }) => ({
        silver: row.repeat.damage / row.repeat.silver,
        hired: row.repeat.damage / row.repeat.mercLost,
      });
      for (const row of rows) {
        if (row.pick !== 'sweet-spot') continue;
        const own = ratios(row);
        for (const rung of rungs.values()) {
          const other = ratios(rung);
          const beats =
            other.silver >= own.silver &&
            other.hired >= own.hired &&
            (other.silver > own.silver || other.hired > own.hired);
          expect(beats, `${row.pick} at ${String(row.repeat.mercLost)} burned is beaten on both ratios`).toBe(
            false,
          );
        }
      }
      // Exactly one stop is the bar's best damage a silver and exactly one its best damage a hired unit.
      const perSilver = (row: (typeof rows)[number]): number => row.repeat.damage / row.repeat.silver;
      const perHired = (row: (typeof rows)[number]): number => row.repeat.damage / row.repeat.mercLost;
      expect(rows.filter((row) => row.bestFor.silver)).toHaveLength(1);
      expect(rows.filter((row) => row.bestFor.hired)).toHaveLength(1);
      expect(perSilver(rows.find((row) => row.bestFor.silver) as (typeof rows)[number])).toBe(
        Math.max(...rows.map(perSilver)),
      );
      expect(perHired(rows.find((row) => row.bestFor.hired) as (typeof rows)[number])).toBe(
        Math.max(...rows.map(perHired)),
      );
      // Every stop carries the gold its march's hired stacks cost, and it grows with the burn.
      const golds = rows.map((row) => row.repeat.gold);
      expect([...golds].sort((a, b) => a - b)).toEqual(golds);
    });

    test(
      'a mercenary hired as unlimited is fielded, bounded, and kept under the troops',
      () => {
        // Owner, 2026-09-18: "when a merc is unlimited and is put in, don't put more, and lower it so the health
        // stack still makes sense — below the troops". No cap entered used to read as a stock of nothing.
        const req = request();
        const first = req.units.find((unit) => unit.pool === 'authority');
        if (!first) throw new Error('no mercenary');
        const caps = { ...req.caps };
        delete caps[first.id];
        const plan = planCampaign({
          request: { ...req, caps },
          marchTarget: 4,
          tokenFloor: true,
          sizerShape: true,
        });
        const hp = new Map(
          req.units.map((unit) => [
            unit.id,
            effectiveUnit(unit, req.totals, req.enemy, req.activeEvents).hpPerUnit,
          ]),
        );
        for (const row of plan.alternatives) {
          // Fielded, and never more than the authority pool pays for.
          expect(row.counts[first.id] ?? 0).toBeGreaterThan(0);
          expect((row.counts[first.id] ?? 0) * first.cost).toBeLessThanOrEqual(req.housing.authority);
          // Under the lowest troop stack, so the enemy takes the troops first.
          const troops = req.units.filter(
            (unit) => unit.pool === 'leadership' && (row.counts[unit.id] ?? 0) > 0,
          );
          const floor = Math.min(
            ...troops.map((unit) => (row.counts[unit.id] ?? 0) * (hp.get(unit.id) ?? 0)),
          );
          expect((row.counts[first.id] ?? 0) * (hp.get(first.id) ?? 0)).toBeLessThan(floor);
          // It stands on more than one troop stack.
          expect(troops.length).toBeGreaterThan(1);
        }
        // The stock of an unlimited type never binds.
        expect(plan.binding.mercenaries).toBe(false);
      },
      TIMEOUT,
    );

    test(
      'the sizer shape never makes the plan worse, and can only add a shape the ladder cannot express',
      () => {
        // Owner, 2026-09-17: a put-back beat the plan's own march. Behind `sizerShape` the search also scores
        // the Elite sizer over every troop type for each mercenary vector; the total can only go up.
        const req = request();
        const ladder = planCampaign({ request: req, marchTarget: 4 });
        const both = planCampaign({ request: req, marchTarget: 4, sizerShape: true });
        expect(both.totalDamage).toBeGreaterThanOrEqual(ladder.totalDamage);
        expect(both.marches).toBe(ladder.marches);
        // Whatever shape won, its counts are fieldable and its damage is the battle's own.
        expect(used(req, both.march.counts, 'leadership')).toBeLessThanOrEqual(req.housing.leadership);
        expect(both.march.damage).toBe(planMarch(req, both.march.counts).summary.avgDamage);
        // Five stops, never more (owner, 2026-09-18: silver saver · sweet spot · more mercs · steady max · all in).
        expect(both.alternatives.length).toBeLessThanOrEqual(5);
      },
      TIMEOUT,
    );
  },
  TIMEOUT,
);

/**
 * **A stock smaller than a chunk still gets its all-in** (owner, 2026-09-18: *"a last stop: all mercs
 * possible … fill all the mercs you can safely"*).
 *
 * The bar runs along the **burn**, `ceil(n/10)` summed over the hired stacks a march fields — the game's own
 * rule for what a march costs the stock for good, and what every row shows. The `all-in` was offered on that
 * reading too, and it is the one stop the burn cannot see: with ten bears in stock, 10 · 9 · 8 · 7 and eight a
 * march both burn one chunk a march, so the campaign that spends the stock fastest tied the steady max and was
 * dropped as a duplicate of it (`tools/theorycraft/out/101-shelter-cost-and-ten-bears.md` §B). It is offered
 * on what its first march **fields** instead — the one place the engine reads a count rather than a cost.
 *
 * TotalStack's own priority search answers exactly those campaigns: 26 486 216 over four marches with ten
 * bears in stock and 25 439 016 with three, against this plan's 21 732 276 and 14 168 526.
 */
describe('a stock smaller than a chunk still has an all-in', () => {
  test(
    'ten bears: more than one stop, rising in what they field, and an all-in that spends the stock',
    () => {
      const req = firstRun({ id: 'bear-5', cap: 10 });
      const plan = planCampaign({ request: req, marchTarget: CAMPAIGN.marches, ...CAMPAIGN.planFixes });

      // More than one stop — it was exactly one on the burn axis, because every row burned one chunk.
      expect(plan.alternatives.length).toBeGreaterThan(1);

      // The bar reads left to right as "field fewer … field more", strictly.
      for (let index = 1; index < plan.alternatives.length; index += 1) {
        const previous = plan.alternatives[index - 1];
        const current = plan.alternatives[index];
        if (!previous || !current) continue;
        expect(
          fieldedOf(req, current.counts),
          `${current.pick} fields more than ${previous.pick}`,
        ).toBeGreaterThan(fieldedOf(req, previous.counts));
      }

      // The all-in is on the bar, and it is the campaign that spends the stock fastest: the whole stock on the
      // first march, then a chunk fewer each time (10 · 9 · 8 · 7 — one unit lost a march, the stock being
      // under a chunk).
      const allIn = plan.alternatives.find((row) => row.pick === 'all-in');
      expect(allIn, 'the all-in stop is offered').toBeDefined();
      const sequence = (allIn?.sequence ?? []).map((march) => march['bear-5'] ?? 0);
      expect(sequence[0]).toBe(10);
      for (let index = 1; index < sequence.length; index += 1) {
        expect(sequence[index] ?? 0).toBeLessThan(sequence[index - 1] ?? 0);
      }

      // Every stop is a campaign the two criteria can be read off — the bar draws both of them on every row.
      for (const row of plan.alternatives) {
        expect(Number.isFinite(row.damagePerSilver), `${row.pick} has a damage a silver`).toBe(true);
        expect(Number.isFinite(row.damagePerMercenary), `${row.pick} has a damage a hired unit`).toBe(true);
        expect(row.damagePerSilver).toBeGreaterThan(0);
        expect(row.damagePerMercenary).toBeGreaterThan(0);
      }
    },
    TIMEOUT,
  );

  test(
    'three bears: the all-in fields 3 · 2 · 1 and stops when the stock is gone',
    () => {
      const req = firstRun({ id: 'bear-5', cap: 3 });
      const plan = planCampaign({ request: req, marchTarget: CAMPAIGN.marches, ...CAMPAIGN.planFixes });
      const allIn = plan.alternatives.find((row) => row.pick === 'all-in');
      expect(allIn, 'the all-in stop is offered').toBeDefined();
      expect((allIn?.sequence ?? []).map((march) => march['bear-5'] ?? 0)).toEqual([3, 2, 1]);
      // It is the hardest-hitting campaign on this bar, which is the point of offering it: measured
      // 2026-09-18, 14 505 126 against the repeat's 14 168 526 (one bear a march for three marches).
      expect(allIn?.totalDamage ?? 0).toBeGreaterThan(
        Math.max(...plan.alternatives.filter((row) => row.pick !== 'all-in').map((row) => row.totalDamage)),
      );
      // **It plays three marches, not the horizon's four** (measured 2026-09-18). The all-in stops where the
      // stock does: its rule is "every mercenary the troops can shelter, then what is left", and after 3 · 2 ·
      // 1 there is nothing left to shelter. TotalStack's priority search marches a fourth time on troops alone
      // and reaches 25 439 016 where this bar's best is 14 505 126, so a march with no hired stack in it is
      // damage this method leaves on the table — but it is the sizer's march, not a plan of the hired stock,
      // and nothing else about the horizon changed here (S-76: the horizon is a ceiling).
      expect(allIn?.marches).toBe(3);
      expect(allIn?.sequence?.length).toBe(3);
    },
    TIMEOUT,
  );
});

/**
 * **The short type on a real account** (coordinator, 2026-09-18). The owner's export holds four hired types —
 * 142 hunters, 50 arbalesters, 42 legionaries, 20 chariots — and cutting the chariot stock alone to two or one
 * is the case where the horizon outruns *one* type of an account with 234 other hired units. Measured through
 * the app's own request builder, so the horizon and the S-58 flags are the app's: the plan keeps its four
 * marches and spends the chariots in the finale.
 */
describe.skipIf(!existsSync(OWNER_EXPORT))('a short hired type on the owner’s account', () => {
  const parsed = existsSync(OWNER_EXPORT) ? parseImport(readFileSync(OWNER_EXPORT, 'utf8')) : null;
  const profile = parsed?.kind === 'profile' ? parsed.payload : null;
  const atChariots = (cap: number): CampaignInput => {
    if (!profile) throw new Error('no profile');
    const copy = structuredClone(profile);
    copy.mercenaries.selected = copy.mercenaries.selected.map((hired) =>
      hired.id === 'chariot-6' ? { ...hired, cap } : hired,
    );
    const setup = copy.setups[0];
    if (!setup) throw new Error('no setup');
    return buildPlanRequest(copy, setup);
  };

  test(
    'two chariots ride the finale instead of halving the campaign',
    () => {
      // Measured 2026-09-18 at his own 20 chariots: sweet spot 21 662 734, steady max 23 264 491 over four
      // marches. With the stock cut to two the first reading of the ceiling answered 9 705 867 and 9 838 204
      // over *two* marches; with the chariots in the finale it answers 17 221 858 and 18 286 849 over four —
      // the same campaign less the chariots' share, which is what two of them are worth.
      const full = planCampaign(atChariots(20));
      for (const cap of [2, 1]) {
        const plan = planCampaign(atChariots(cap));
        expect(plan.marches, `a chariot stock of ${String(cap)} still plays the horizon`).toBe(4);
        expect(plan.totalDamage).toBeGreaterThan(full.totalDamage * 0.7);
        // What changed with the chariots in the finale is the band: before, every candidate fielded none of
        // them in its repeated march, S-58 B refused them all, and the bar fell back to the unbanded
        // candidates (nothing left out, a steady max of 18 993 178). Judged over the campaign, the band holds
        // and does its work — 34 candidates left out and a steady max of 18 286 849 on 2026-09-18.
        expect(plan.leftOut, `the band applies with a chariot stock of ${String(cap)}`).toBeGreaterThan(0);
        for (const row of plan.alternatives) {
          expect(row.marches, `${row.pick} plays the horizon`).toBe(4);
          // The all-in stop front-loads the chariots on its first march, as it always did.
          if (row.sequence) {
            expect(row.sequence[0]?.['chariot-6'] ?? 0).toBe(cap);
            continue;
          }
          expect(row.counts['chariot-6'] ?? 0, `${row.pick} keeps the chariots out of its repeat`).toBe(0);
          expect(row.finaleCounts?.['chariot-6'] ?? 0, `${row.pick} spends them in its finale`).toBe(cap);
        }
      }
    },
    TIMEOUT,
  );

  test(
    'five chariots sustain the horizon, and nothing about them changes',
    () => {
      // Three a march last the three repeats, so the type is rationed over the repeated march as before:
      // measured 2026-09-18, three fielded a march and the two left over in the finale.
      const plan = planCampaign(atChariots(5));
      expect(plan.marches).toBe(4);
      for (const row of plan.alternatives) {
        expect(row.counts['chariot-6'] ?? 0, `${row.pick} fields chariots in its repeat`).toBeGreaterThan(0);
      }
    },
    TIMEOUT,
  );
});

/**
 * **S-77 — a capped hired stack may stand on top.** The shelter (S-75) was asked for the one type nothing
 * else bounds (owner, 2026-09-18: *"when a merc is unlimited and is put in, don't put more, and lower it so
 * the health stack still makes sense — below the troops"*); clamping every hired type as well cost damage,
 * because a hired stack above the lowest troop stack is the enemy's first kill and moves every other stack
 * one kill slot later — a sponge the battle model already prices, burn included
 * (`tools/theorycraft/out/101-shelter-cost-and-ten-bears.md` §A). A capped type now keeps the count the
 * sizer gave it; an unlimited one is still lowered under the troops.
 */
describe('a capped hired type is not sheltered, an unlimited one is', () => {
  /** A first-run army (Guardsmen I–III, Specialists I, no bonuses) with two hired types at their stocks. */
  const army = (hired: { id: string; cap: number | null }[], leadership: number): CampaignInput => {
    const profile = newProfile('two hired types');
    profile.mercenaries.selected = hired;
    const setup = profile.setups[0];
    if (!setup) throw new Error('no setup');
    return {
      request: buildStackRequest(profile, {
        ...setup,
        housing: { leadership, authority: 40_000, dominance: 0 },
      }),
      marchTarget: 4,
      tokenFloor: true,
      refuseDroppedTypes: true,
      sizerShape: true,
    };
  };
  /** Every stack of a march, by total HP: what the enemy's kill order reads. */
  const stackHp = (input: CampaignInput, counts: Record<string, number>): Map<string, number> => {
    const { request } = input;
    return new Map(
      request.units
        .filter((unit) => (counts[unit.id] ?? 0) > 0)
        .map((unit) => [
          unit.id,
          (counts[unit.id] ?? 0) *
            effectiveUnit(unit, request.totals, request.enemy, request.activeEvents).hpPerUnit,
        ]),
    );
  };
  const troopFloor = (input: CampaignInput, counts: Record<string, number>): number => {
    const hp = stackHp(input, counts);
    return Math.min(
      ...input.request.units
        .filter((unit) => unit.pool === 'leadership' && hp.has(unit.id))
        .map((unit) => hp.get(unit.id) ?? 0),
    );
  };

  test(
    'the same army answers differently once a type is hired as unlimited',
    () => {
      // Measured 2026-09-18, 40 arbalesters and 40 chitinous defenders VII at 7 000 leadership: the steady max
      // stands 32 defenders (336 000 HP) on top of a lowest troop stack of 156 480 for 2 842 356 a march. Hire
      // the same defenders as unlimited and the shelter takes over: 14 of them, 147 000 HP, under the troops,
      // for 2 696 285 — the 5 % the owner's rule costs, paid only where he asked for it.
      const capped = army(
        [
          { id: 'arbalester-6', cap: 40 },
          { id: 'chitinous-defender-7', cap: 40 },
        ],
        7_000,
      );
      const plan = planCampaign(capped);
      const most = plan.alternatives.find((row) => row.pick === 'steady-max');
      expect(most).toBeDefined();
      const counts = most?.counts ?? {};
      const hp = stackHp(capped, counts);
      const floor = troopFloor(capped, counts);
      // Both hired types are fielded, and the sizer's shape stands one of them above the troops.
      expect(counts['arbalester-6'] ?? 0).toBeGreaterThan(0);
      expect(counts['chitinous-defender-7'] ?? 0).toBeGreaterThan(0);
      expect(hp.get('chitinous-defender-7') ?? 0).toBeGreaterThan(floor);
      // It stands on more than one troop stack, and the march is the battle's own.
      const troops = capped.request.units.filter(
        (unit) => unit.pool === 'leadership' && (counts[unit.id] ?? 0) > 0,
      );
      expect(troops.length).toBeGreaterThan(1);
      expect(most?.repeat.damage).toBe(planMarch(capped.request, counts).summary.avgDamage);

      // The same army with the defenders hired as unlimited: every stack of that type is under the troops.
      const free = army(
        [
          { id: 'arbalester-6', cap: 40 },
          { id: 'chitinous-defender-7', cap: null },
        ],
        7_000,
      );
      const other = planCampaign(free);
      for (const row of other.alternatives) {
        if (row.pick === 'all-in') continue;
        expect(
          row.counts['chitinous-defender-7'] ?? 0,
          `${row.pick} fields the unlimited type`,
        ).toBeGreaterThan(0);
        const unlimitedHp = stackHp(free, row.counts).get('chitinous-defender-7') ?? 0;
        expect(unlimitedHp, `${row.pick} shelters the unlimited type`).toBeLessThan(
          troopFloor(free, row.counts),
        );
      }
    },
    TIMEOUT,
  );
});

/**
 * **S-77 on the owner's account.** His export at 7 000 is the case experiment 101 §A measured: the sizer's
 * MS-relaxed shape stands 34 legionaries on top as the enemy's first kill — every other stack one slot later,
 * the arbalesters striking three times instead of two — for 6 242 452 damage a march against 5 864 482
 * sheltered, at one more legionary burned and 48 gold. With only the unlimited types clamped, that march is
 * the steady max again, and the bar still carries all four hired types (S-58 B).
 */
describe.skipIf(!existsSync(OWNER_EXPORT))('the legionaries stand on top on the owner’s account', () => {
  const parsed = existsSync(OWNER_EXPORT) ? parseImport(readFileSync(OWNER_EXPORT, 'utf8')) : null;
  const profile = parsed?.kind === 'profile' ? parsed.payload : null;

  test(
    'the steady max is the sponge march again, at his own setup (7 000 leadership)',
    () => {
      if (!profile) throw new Error('no profile');
      const setup = profile.setups[0];
      if (!setup) throw new Error('no setup');
      const input = buildPlanRequest(profile, setup);
      const plan = planCampaign(input);
      const most = plan.alternatives.find((row) => row.pick === 'steady-max');
      expect(most).toBeDefined();
      const counts = most?.counts ?? {};
      const hp = new Map(
        input.request.units.map((unit) => [
          unit.id,
          effectiveUnit(unit, input.request.totals, input.request.enemy, input.request.activeEvents)
            .hpPerUnit,
        ]),
      );
      const stack = (id: string): number => (counts[id] ?? 0) * (hp.get(id) ?? 0);
      const floor = Math.min(
        ...input.request.units
          .filter((unit) => unit.pool === 'leadership' && (counts[unit.id] ?? 0) > 0)
          .map((unit) => stack(unit.id)),
      );
      // Measured 2026-09-18: 34 legionaries, 372 096 HP over a lowest troop stack of 361 200, 6 242 452 damage.
      expect(counts['legionary-6'] ?? 0).toBeGreaterThan(0);
      expect(stack('legionary-6')).toBeGreaterThan(floor);
      expect(most?.repeat.damage ?? 0).toBeGreaterThanOrEqual(6_200_000);
      // The march is priced exactly as the recap prices it, sponge and all.
      expect(most?.repeat.damage).toBe(planMarch(input.request, counts).summary.avgDamage);
      // Every hired type the account holds is still on every stop of the bar.
      const hired = input.request.units.filter((unit) => unit.pool === 'authority');
      expect(hired.length).toBe(4);
      for (const row of plan.alternatives) {
        for (const unit of hired) {
          expect(row.counts[unit.id] ?? 0, `${row.pick} fields ${unit.id}`).toBeGreaterThan(0);
        }
      }
    },
    TIMEOUT,
  );
});
