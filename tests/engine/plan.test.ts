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
import { sizeStacks } from '@/engine/stacker';
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

/**
 * The marches a stop plays, first to last: its own sequence, or its repeats, the final march and the
 * troops-only marches the horizon leaves over once its stock is spent (`PlanTotals.tail`, S-89).
 */
function marchesOf(row: PlanTotals): Record<string, number>[] {
  if (row.sequence) return row.sequence;
  const tail = row.tail?.marches ?? 0;
  const repeats = row.marches - (row.finaleCounts ? 1 : 0) - tail;
  const marches = Array.from({ length: repeats }, () => row.counts);
  if (row.finaleCounts) marches.push(row.finaleCounts);
  for (let i = 0; i < tail; i += 1) marches.push(row.tail?.counts ?? {});
  return marches;
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
     * **The horizon is a ceiling on the hired stock, and the troops march on** (owner, 2026-09-18: *"no more
     * magic static numbers"*, then S-89 from the six-proposal table of the same day).
     *
     * A first-run army holding one or two of a hired type holds **no** count that lasts three repeats, so its
     * grid came back empty, `planCampaign` threw, and the app answered "it needs your mercenaries filled in
     * first" (`src/ui/sections/march/generate.ts`) to a player who had filled them in. S-76 answered it with a
     * **shorter campaign**: the marches the stock lasts, and no more.
     *
     * **Re-based 2026-09-18 (S-89).** A shorter campaign was the wrong half of the answer: the marches the
     * horizon still had room for were thrown away, and every sizer sequence in the benchmark went on playing
     * them with troops alone. So the stock is still what decides how many marches field a mercenary — that is
     * what this test holds, and it is unchanged — but the campaign itself now always reaches the horizon, the
     * marches left over played on troops alone (`PlanTotals.tail`). On this very army it is the difference
     * between 4 722 842 damage and **18 554 768** (`tools/theorycraft/out/105-six-proposals.md` §P1).
     */
    test(
      'a stock the horizon outruns fields hired units for as long as it lasts, then marches on troops alone',
      () => {
        for (const cap of [1, 2]) {
          const req = firstRun({ id: 'bear-5', cap });
          const plan = planCampaign({ request: req, marchTarget: 4, ...CAMPAIGN.planFixes });
          // The campaign reaches the horizon whatever the stock is…
          expect(plan.marches, `a stock of ${String(cap)} still plays the horizon`).toBe(4);
          // …and one bear fields a march at a count of one, two bears two: the hired marches are exactly that
          // many, the rest of the campaign being the troops-only tail.
          expect(
            plan.marches - (plan.tail?.marches ?? 0),
            `a stock of ${String(cap)} fields hired units for as many marches as it lasts`,
          ).toBe(cap);
          expect(plan.alternatives.length).toBeGreaterThan(0);
          for (const row of plan.alternatives) {
            // The plan is about spreading the hired stock, so every stop fields the one type it holds…
            expect(row.counts['bear-5'] ?? 0, `${row.pick} fields the bear`).toBeGreaterThan(0);
            expect(row.marches).toBe(4);
            expect(row.marches - (row.tail?.marches ?? 0)).toBeGreaterThanOrEqual(1);
            // The tail is troops alone, so it can never field the bear.
            expect(row.tail?.counts['bear-5'] ?? 0, `${row.pick}'s tail hires nothing`).toBe(0);
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
     * **The troops-only tail, priced** (S-89; owner, 2026-09-18, choosing P1 from the six-proposal table of
     * `tools/theorycraft/out/105-six-proposals.md`).
     *
     * The three armies the proposal moves, and the whole of what it does to them: the stop reaches the
     * horizon, the marches it does not field a mercenary on are one Elite march of troops alone, and the
     * campaign is exactly what it was plus that march as many times as the horizon had room for. The
     * pre-tail figures below are **measured**, on the S-87 engine and on the 07 benchmark run of 2026-09-18
     * (`tools/theorycraft/out/benchmark-2026-09-18-07-curve-over-band.json`); they are pinned rather than
     * recomputed so that the arithmetic asserted here is the proposal's and not a restatement of the
     * engine's.
     *
     * `repeat` is pinned too, and it is the point of the design: every rule that chooses a stop reads the
     * repeated march, so a tail that moved it would be a change to the bar. It does not move.
     */
    test(
      'a repeated stop plays the horizon out on troops alone, and its campaign is the tail added on',
      () => {
        // cap → the campaign before the tail (damage, silver, queue) and the repeated march it is made of
        // (damage, silver, queue, hired burned). Measured 2026-09-18, engine S-87.
        const before = {
          1: { campaign: [4_722_842, 8_131_400, 2_269_380], repeat: [4_722_842, 8_131_400, 2_269_380, 1] },
          2: { campaign: [9_557_884, 16_262_800, 4_538_760], repeat: [4_835_042, 8_131_400, 2_269_380, 1] },
          3: { campaign: [14_168_526, 24_394_200, 6_808_140], repeat: [4_722_842, 8_131_400, 2_269_380, 1] },
        } as const;
        // The tail itself, one Elite march over every troop type this army holds with no mercenary in it —
        // the same march on all three, because it is the same army (`out/105` §P1).
        const TAIL = { damage: 4_610_642, silver: 8_131_400, seconds: 2_269_380 };

        for (const cap of [1, 2, 3] as const) {
          const plan = planCampaign({
            request: firstRun({ id: 'bear-5', cap }),
            marchTarget: 4,
            ...CAMPAIGN.planFixes,
          });
          const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot');
          if (!sweet) throw new Error(`no sweet spot at a stock of ${String(cap)}`);
          const pin = before[cap];

          // The repeated march is untouched: it is what every stop rule reads.
          expect(
            [sweet.repeat.damage, sweet.repeat.silver, sweet.repeat.seconds, sweet.repeat.mercLost],
            `a stock of ${String(cap)} repeats the same march it did before the tail`,
          ).toEqual(pin.repeat);

          // The stop reaches the horizon, and the marches it did not reach are the tail.
          expect(sweet.marches, `a stock of ${String(cap)} plays the horizon`).toBe(4);
          const tail = sweet.tail;
          if (!tail) throw new Error(`no tail at a stock of ${String(cap)}`);
          // One bear fields one march, two fields two, three fields three: the rest is the tail.
          expect(tail.marches).toBe(4 - cap);
          expect([tail.damage, tail.silver, tail.seconds]).toEqual([TAIL.damage, TAIL.silver, TAIL.seconds]);
          // Troops alone: no hired stack at all, which is what makes the tail sheltered by construction.
          expect(tail.counts['bear-5'] ?? 0).toBe(0);

          // The campaign is what it was, plus the tail as many times as the horizon had room for.
          expect(
            [sweet.totalDamage, sweet.silver, sweet.seconds],
            `a stock of ${String(cap)} adds its tail on`,
          ).toEqual([
            pin.campaign[0] + tail.marches * TAIL.damage,
            pin.campaign[1] + tail.marches * TAIL.silver,
            pin.campaign[2] + tail.marches * TAIL.seconds,
          ]);
          // The stock burns exactly what it burned, so the two ratios follow from the arithmetic above.
          expect(sweet.mercLost).toBe(cap);
          expect(sweet.damagePerSilver).toBeCloseTo(sweet.totalDamage / sweet.silver, 9);
          expect(sweet.damagePerMercenary).toBeCloseTo(sweet.totalDamage / sweet.mercLost, 3);

          // A stop with no finale is its repeated march and its tail, and nothing else.
          if (!sweet.finaleCounts) {
            const played = sweet.marches - tail.marches;
            expect(sweet.totalDamage).toBe(played * sweet.repeat.damage + tail.marches * TAIL.damage);
            expect(sweet.silver).toBe(played * sweet.repeat.silver + tail.marches * TAIL.silver);
            expect(sweet.seconds).toBe(played * sweet.repeat.seconds + tail.marches * TAIL.seconds);
          }
        }

        // **It is the same march the `all-in` ends on.** Three bears is the one of the three armies that
        // offers both stops, and the `all-in`'s fourth march — the one it plays once 3 · 2 · 1 has spent the
        // stock — is this tail to the unit. One question, sized once a plan (`troopsOnlyMarch`, `plan.ts`).
        const three = planCampaign({
          request: firstRun({ id: 'bear-5', cap: 3 }),
          marchTarget: 4,
          ...CAMPAIGN.planFixes,
        });
        const allIn = three.alternatives.find((row) => row.pick === 'all-in');
        const sweet = three.alternatives.find((row) => row.pick === 'sweet-spot');
        if (!allIn?.sequence || !sweet?.tail) throw new Error('three bears offers both stops');
        expect(allIn.sequence).toHaveLength(4);
        expect(sweet.tail.counts).toEqual(allIn.sequence[allIn.sequence.length - 1]);
      },
      TIMEOUT,
    );

    /**
     * **The campaign's gold includes the finale's gold** (S-90; the bug experiment 105's validator found on
     * 2026-09-18, chosen for a fix by the owner the same day).
     *
     * `PlanTotals.gold` was `repeats × the repeated march's gold` and nothing else, while `silver` and
     * `seconds` beside it have always been `repeats × the march + the finale`. So the last march of every
     * repeated plan — the one that spends what the stock has left, and therefore the one that fields the
     * **most** hired units of the campaign — was revived for free on the bar. Measured on this army at a
     * four-march horizon, before the fix: the silver saver printed **864** gold where its four marches cost
     * **1 344**, the sweet spot 1 224 against 1 632, the steady max and the plan itself 1 344 against 1 728.
     * On the owner's evening account the worst of it was 1 248 gold missing from a 3 192-gold campaign.
     *
     * Held here the way the queue is held above: against the **recap's own pricing** of each march the stop
     * plays (`marchResult` → `recoveryCosts`), which is what the March section prints for the same counts, so
     * the assertion is the battle's reading of the campaign and not a second copy of the plan's arithmetic.
     */
    test(
      'prices the campaign\u2019s revive gold as its marches do, the finale included',
      () => {
        const req = request();
        const plan = planCampaign({
          request: req,
          marchTarget: 4,
          tokenFloor: true,
          sizerShape: true,
          putBack: CAMPAIGN.putBack,
        });
        const goldOf = (counts: Record<string, number>): number =>
          planMarch(req, counts).summary.recovery.gold;
        // The bug needs a finale to show at all: this army's plan plays one, and so does every repeated stop.
        expect(plan.finale, 'the army must plan a finale for this to be a test of anything').toBeDefined();

        const rows: { what: string; row: PlanTotals }[] = [
          ...plan.alternatives.map((row) => ({ what: String(row.pick), row: row as PlanTotals })),
          { what: 'the plan itself', row: plan as PlanTotals },
        ];
        for (const { what, row } of rows) {
          // Every march the stop plays, priced as the recap prices it — the sequence stop included.
          const marches = marchesOf(row);
          expect(marches.length, `${what} plays as many marches as it counts`).toBe(row.marches);
          expect(row.gold, `${what} adds its marches' gold up`).toBe(
            marches.reduce((sum, counts) => sum + goldOf(counts), 0),
          );
          // And, for a repeated stop, that sum written out: the repeats plus the final march.
          if (row.sequence) continue;
          const played = row.marches - (row.finaleCounts ? 1 : 0) - (row.tail?.marches ?? 0);
          expect(row.gold, `${what} prices its repeats and its finale`).toBe(
            played * row.repeat.gold + (row.finaleCounts ? goldOf(row.finaleCounts) : 0),
          );
          // The repeated march's own gold is the recap's too, exactly as `repeat.seconds` is above.
          expect(row.repeat.gold, `${what} prices its own march`).toBe(goldOf(row.counts));
          // The finale is not free, which is the whole of what S-90 fixed.
          if (row.finaleCounts) expect(goldOf(row.finaleCounts)).toBeGreaterThan(0);
        }
      },
      TIMEOUT,
    );

    /**
     * **And the troops-only tail adds no gold** (S-89's tail under S-90's sum): a march with no hired stack
     * on it revives nothing, so a tailed stop's campaign gold is the gold it had before the tail was added.
     * `withTail` sums `played × tail.gold` rather than assuming the nought, and this is what holds that line
     * true — a tail that ever fielded a hired unit would fail here rather than quietly under-price it.
     */
    test(
      'a tailed stop\u2019s gold is its untailed gold',
      () => {
        for (const cap of [1, 2, 3] as const) {
          const req = firstRun({ id: 'bear-5', cap });
          const plan = planCampaign({ request: req, marchTarget: 4, ...CAMPAIGN.planFixes });
          const goldOf = (counts: Record<string, number>): number =>
            planMarch(req, counts).summary.recovery.gold;
          const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot');
          const tail = sweet?.tail;
          if (!sweet || !tail) throw new Error(`no tailed stop at a stock of ${String(cap)}`);
          // The tail march itself, as the recap prices it.
          expect(goldOf(tail.counts), `the tail of a stock of ${String(cap)} revives nothing`).toBe(0);
          const played = sweet.marches - tail.marches - (sweet.finaleCounts ? 1 : 0);
          expect(sweet.gold, `a stock of ${String(cap)} adds no gold for its tail`).toBe(
            played * sweet.repeat.gold + (sweet.finaleCounts ? goldOf(sweet.finaleCounts) : 0),
          );
        }
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
 * bears in stock and 25 439 016 with three, against this plan's 21 732 276 and 19 115 768 (2026-09-19, the
 * all-in's tail).
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
    'three bears: the all-in fields 3 · 2 · 1 and then marches on troops alone',
    () => {
      const req = firstRun({ id: 'bear-5', cap: 3 });
      const plan = planCampaign({ request: req, marchTarget: CAMPAIGN.marches, ...CAMPAIGN.planFixes });
      const allIn = plan.alternatives.find((row) => row.pick === 'all-in');
      expect(allIn, 'the all-in stop is offered').toBeDefined();
      expect((allIn?.sequence ?? []).map((march) => march['bear-5'] ?? 0)).toEqual([3, 2, 1, 0]);
      // It is the hardest-hitting campaign on this bar, which is the point of offering it: measured
      // 2026-09-19, 19 115 768 against the repeat's 14 168 526 (one bear a march for three marches).
      expect(allIn?.totalDamage ?? 0).toBeGreaterThan(
        Math.max(...plan.alternatives.filter((row) => row.pick !== 'all-in').map((row) => row.totalDamage)),
      );
      // **And it plays the horizon** (2026-09-19). It used to stop where the stock did — 14 505 126 over
      // three marches of a four-march horizon — and the whole of the gap to TotalStack was the march it never
      // played. The fourth is the sizer's own march over the troop types, no hired stack in it, and the
      // campaign is 19 115 768 at 32 525 600 silver against TotalStack's 19 388 676 at 32 535 200.
      expect(allIn?.marches).toBe(CAMPAIGN.marches);
      expect(allIn?.sequence?.length).toBe(CAMPAIGN.marches);
      expect(allIn?.totalDamage ?? 0).toBeGreaterThanOrEqual(19_000_000);
    },
    TIMEOUT,
  );
});

/**
 * **The horizon the all-in plays out on troops alone** (owner, 2026-09-19: *"continue for the measured
 * additions"*).
 *
 * Every other stop repeats one march and spends what is left in a finale, so the horizon is a ceiling it
 * never has to fill (S-76). The `all-in` is the one stop that is a **sequence**, and spending the stock
 * fastest is the whole of it: once the hired stock is gone the marches the horizon still has room for are the
 * sizer's own march over the troop types, with no mercenary in it. Measured on a first-run army holding three
 * Bear V at 20 000 leadership: 3 · 2 · 1 was 14 505 126 for 24 394 200 silver over three marches of four, and
 * the tail march is 4 610 642 for 8 131 400 — 19 115 768 at 32 525 600 against TotalStack's 19 388 676 at
 * 32 535 200, which is 98.6 % of its answer at the same silver.
 */
describe('the all-in plays the horizon', () => {
  /** The marches of a stop, priced one by one by the battle itself — `marchResult` → `simulateBattle`. */
  const priced = (req: StackRequest, marches: Record<string, number>[]): { damage: number; silver: number } =>
    marches.reduce<{ damage: number; silver: number }>(
      (sum, counts) => {
        const { summary } = planMarch(req, counts);
        return { damage: sum.damage + summary.avgDamage, silver: sum.silver + summary.recovery.silver };
      },
      { damage: 0, silver: 0 },
    );

  test.each([3, 10])(
    '%i bears: the sequence is the horizon, and its totals are the marches priced one by one',
    (cap) => {
      const req = firstRun({ id: 'bear-5', cap });
      const plan = planCampaign({ request: req, marchTarget: CAMPAIGN.marches, ...CAMPAIGN.planFixes });
      const allIn = plan.alternatives.find((row) => row.pick === 'all-in');
      expect(allIn, 'the all-in stop is offered').toBeDefined();
      const sequence = allIn?.sequence ?? [];
      // Exactly the horizon: no march fewer, and — the S-76 ceiling — no march more.
      expect(sequence.length).toBe(CAMPAIGN.marches);
      expect(allIn?.marches).toBe(CAMPAIGN.marches);

      // Every march is fieldable, and the ones the spent stock left over are troops alone: no hired unit in
      // them, and a real march of troops rather than an empty one.
      for (const counts of sequence) {
        expect(used(req, counts, 'leadership')).toBeLessThanOrEqual(req.housing.leadership);
        expect(used(req, counts, 'authority')).toBeLessThanOrEqual(req.housing.authority);
        const troops = Object.entries(counts).filter(
          ([id]) => req.units.find((unit) => unit.id === id)?.pool === 'leadership',
        );
        expect(troops.reduce((sum, [, count]) => sum + count, 0)).toBeGreaterThan(0);
      }
      // A stock of three lasts three marches, so the last is the tail; ten bears field 10 · 9 · 8 · 7 and
      // there is no tail at all (measured 2026-09-19).
      const tails = sequence.filter((counts) => fieldedOf(req, counts) === 0);
      expect(tails.length).toBe(cap === 3 ? 1 : 0);
      for (const tail of tails) expect(tail['bear-5'] ?? 0).toBe(0);

      // The row's own figures are the campaign's marches, priced by the battle: nothing is spread, summed
      // twice or left out.
      const sum = priced(req, sequence);
      expect(Math.abs((allIn?.totalDamage ?? 0) - sum.damage)).toBeLessThanOrEqual(1);
      expect(Math.abs((allIn?.silver ?? 0) - sum.silver)).toBeLessThanOrEqual(1);
      // The first march's own figures are `repeat`, as they always were — the tail never touches them.
      const head = sequence[0];
      if (!head) throw new Error('no first march');
      expect(allIn?.repeat.damage).toBe(planMarch(req, head).summary.avgDamage);
    },
    TIMEOUT,
  );

  test(
    'three bears: the campaign clears nineteen million',
    () => {
      const req = firstRun({ id: 'bear-5', cap: 3 });
      const plan = planCampaign({ request: req, marchTarget: CAMPAIGN.marches, ...CAMPAIGN.planFixes });
      const allIn = plan.alternatives.find((row) => row.pick === 'all-in');
      // Measured 2026-09-19: 19 115 768 for 32 525 600 silver, where the stop stopped at 14 505 126 for
      // 24 394 200 before the tail.
      expect(allIn?.totalDamage ?? 0).toBeGreaterThanOrEqual(19_000_000);
    },
    TIMEOUT,
  );

  /**
   * **A stock that lasts the horizon is untouched.** The owner's export holds 234 hired units over four
   * types, and its all-in already fielded hired on all four marches: measured 2026-09-18 at 22 518 504 for
   * 14 337 600 silver over four marches, and the tail cannot fire on it.
   */
  describe.skipIf(!existsSync(OWNER_EXPORT))('the owner’s account at 7 000 leadership', () => {
    test(
      'the all-in is the campaign it was, hired on every march of it',
      () => {
        const parsed = parseImport(readFileSync(OWNER_EXPORT, 'utf8'));
        if (parsed.kind !== 'profile') throw new Error('no profile');
        const setup = parsed.payload.setups[0];
        if (!setup) throw new Error('no setup');
        const input = buildPlanRequest(parsed.payload, setup);
        const plan = planCampaign(input);
        const allIn = plan.alternatives.find((row) => row.pick === 'all-in');
        expect(allIn, 'the all-in stop is offered').toBeDefined();
        expect(allIn?.marches).toBe(CAMPAIGN.marches);
        expect(allIn?.sequence?.length).toBe(CAMPAIGN.marches);
        for (const counts of allIn?.sequence ?? []) {
          expect(fieldedOf(input.request, counts), 'every march of it fields hired units').toBeGreaterThan(0);
        }
        expect(allIn?.totalDamage).toBe(22_518_504);
        expect(allIn?.silver).toBe(14_337_600);
      },
      TIMEOUT,
    );
  });
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
 * **S-87 — every hired type is sheltered, capped or unlimited** (owner, 2026-09-18: *"a critical rule is to
 * shield mercs. Right now mercs are unshielded on all complete optimization marches … more damage with a lot
 * of merc spent should trigger a failing test as we're using too much of a rare resource"*).
 *
 * S-75 lowered every hired stack under the lowest troop stack; S-77 narrowed that to the **unlimited** types,
 * reading his earlier sentence — *"when a merc is unlimited and is put in, don't put more, and lower it so the
 * health stack still makes sense — below the troops"* — as being about the one type nothing else bounds, and
 * taking the damage a sponge on top buys (a hired stack above the troops is the enemy's first kill and moves
 * every other stack one slot later; the battle model prices it, burn included,
 * `tools/theorycraft/out/101-shelter-cost-and-ten-bears.md` §A). S-87 restores S-75's rule: a capped type is
 * just as rare as an unlimited one once it is gone.
 *
 * So the army below now answers the **same way** whichever way the second type is hired — which is the whole
 * of the change, stated as a test. Measured 2026-09-18, 40 arbalesters and 40 Chitinous Defenders VII at
 * 7 000 leadership: the steady max is 27 arbalesters (153 900 HP) and **14** defenders (147 000 HP) under a
 * lowest troop stack of 156 480, for 2 696 285 a march, capped or unlimited. Under S-77 the capped army stood
 * **32** defenders (336 000 HP) on top for 2 842 356 — the 5 % the shelter costs here, paid now on every type.
 */
describe('every hired type is sheltered, capped or unlimited', () => {
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
    'the same army answers the same way whether the second type is capped or unlimited',
    () => {
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
      // Both hired types are fielded, and **both** stand under the troops — the capped one included.
      expect(counts['arbalester-6'] ?? 0).toBeGreaterThan(0);
      expect(counts['chitinous-defender-7'] ?? 0).toBeGreaterThan(0);
      expect(hp.get('chitinous-defender-7') ?? 0, 'the capped type is sheltered').toBeLessThan(floor);
      expect(hp.get('arbalester-6') ?? 0, 'the other hired type is sheltered').toBeLessThan(floor);
      // It stands on more than one troop stack, and the march is the battle's own.
      const troops = capped.request.units.filter(
        (unit) => unit.pool === 'leadership' && (counts[unit.id] ?? 0) > 0,
      );
      expect(troops.length).toBeGreaterThan(1);
      expect(most?.repeat.damage).toBe(planMarch(capped.request, counts).summary.avgDamage);
      // Measured 2026-09-18: 2 696 285 a march, the figure the unlimited army answered with under S-77.
      expect(most?.repeat.damage ?? 0).toBeGreaterThanOrEqual(2_690_000);
      // And every stop of that bar shelters every hired stack it fields, not just the steady max.
      for (const row of plan.alternatives) {
        const stacks = stackHp(capped, row.counts);
        const under = troopFloor(capped, row.counts);
        for (const id of ['arbalester-6', 'chitinous-defender-7']) {
          if ((row.counts[id] ?? 0) <= 0) continue;
          expect(stacks.get(id) ?? 0, `${row.pick} shelters ${id}`).toBeLessThan(under);
        }
      }

      // The same army with the defenders hired as unlimited answers with the same steady max: the shelter no
      // longer asks which of the two a type is.
      const free = army(
        [
          { id: 'arbalester-6', cap: 40 },
          { id: 'chitinous-defender-7', cap: null },
        ],
        7_000,
      );
      const other = planCampaign(free);
      const otherMost = other.alternatives.find((row) => row.pick === 'steady-max');
      expect(otherMost?.counts).toEqual(counts);
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
 * **S-87 on the owner's account.** His export at 7 000 is the case experiment 101 §A measured: the sizer's
 * MS-relaxed shape stands 34 legionaries on top as the enemy's first kill — every other stack one slot later,
 * the arbalesters striking three times instead of two — for 6 242 452 damage a march against 5 864 482
 * sheltered, at one more legionary burned and 48 gold. S-77 took that damage and let the sponge be the steady
 * max; S-87 gives it back, because the owner asked for the shelter on every hired type
 * (*"a critical rule is to shield mercs"*, 2026-09-18). Measured that day, with the shelter restored: the
 * steady max fields **27** legionaries — 295 488 HP under a lowest troop stack of 361 200 — for **5 864 482**
 * a march, and the bar still carries all four hired types (S-58 B).
 */
describe.skipIf(!existsSync(OWNER_EXPORT))(
  'the legionaries stand under the troops on the owner’s account',
  () => {
    const parsed = existsSync(OWNER_EXPORT) ? parseImport(readFileSync(OWNER_EXPORT, 'utf8')) : null;
    const profile = parsed?.kind === 'profile' ? parsed.payload : null;

    test(
      'the steady max shelters every hired stack, at his own setup (7 000 leadership)',
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
        // Measured 2026-09-18 (S-87): 27 legionaries, 295 488 HP under a lowest troop stack of 361 200, for
        // 5 864 482 damage — the sheltered twin of the 34-legionary sponge (372 096 HP, 6 242 452) S-77 offered.
        expect(counts['legionary-6'] ?? 0).toBeGreaterThan(0);
        expect(stack('legionary-6')).toBeLessThan(floor);
        expect(most?.repeat.damage ?? 0).toBeGreaterThanOrEqual(5_800_000);
        // Every hired stack of that march is under the troops, not just the legionaries.
        for (const unit of input.request.units) {
          if (unit.pool !== 'authority' || (counts[unit.id] ?? 0) <= 0) continue;
          expect(stack(unit.id), `${unit.id} is sheltered`).toBeLessThan(floor);
        }
        // The march is priced exactly as the recap prices it.
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
  },
);

/**
 * **The put-back pass** (owner, 2026-09-18: *"generation sometimes skips low-level stacks and misses some
 * damage that seems cheap … troops of higher tier are longer to train … add a pass to consider again lower
 * level troops if the cost for them (silver, silver/damage, total damage) is not too high and we get a nice
 * reduction in training time"*; the rates are `CAMPAIGN.putBack`, the pass is in `engine/plan.ts`).
 *
 * What is held here is the owner's rule and the two things a row must still be after it: a march the recap
 * prices identically, and a plan whose hired stacks the stock still sustains.
 */
const putBackScore = (put: { damage: number; silver: number; seconds: number }): number =>
  put.silver / CAMPAIGN.putBack.silverPerDamage + put.seconds / CAMPAIGN.putBack.timePerDamage + put.damage;

/**
 * The put-back the owner's formula takes on one **generated** march, worked out here from the engine's own
 * pieces — the MS sizer over the march's types plus one, priced by `planMarch` — rather than read off
 * experiment 103's committed table. It is the same family the pass scores, so the two must agree on which
 * type goes back; if the sizer or the rates move, this recomputes and the assertion below still means
 * something.
 */
function bestPutBack(req: StackRequest, row: PlanTotals): { unitId: string; score: number } | null {
  const mercIds = req.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
  const troopIds = req.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
  const inMarch = troopIds.filter((id) => (row.counts[id] ?? 0) > 0);
  const caps: Record<string, number> = { ...req.caps };
  for (const id of mercIds) caps[id] = row.counts[id] ?? 0;
  let best: { unitId: string; score: number } | null = null;
  for (const extra of troopIds.filter((id) => !inMarch.includes(id))) {
    const sized = sizeStacks({
      ...req,
      units: req.units.filter(
        (unit) => inMarch.includes(unit.id) || unit.id === extra || mercIds.includes(unit.id),
      ),
      caps,
      options: { ...req.options, method: 'ms', relaxedPreservation: false },
    });
    const counts: Record<string, number> = {};
    for (const stack of sized.stacks) if (stack.count > 0) counts[stack.unitId] = stack.count;
    // The pass refuses a march standing on one troop stack, the extreme the band refuses.
    if (Object.keys(counts).filter((id) => !mercIds.includes(id)).length < 2) continue;
    /**
     * **The shelter** (S-87, `shelterUnder` in `plan.ts`): MS sizes every stack to a matched HP, hired stacks
     * included, so its hired stacks land *at* the troop line — the enemy's first kill — and the pass lowers
     * them to just under the lowest troop stack before it prices the march. This recomputation is only the
     * same family as the pass if it lowers them too; otherwise it scores a march the engine never builds.
     */
    const hpOf = (id: string): number => {
      const unit = req.units.find((candidate) => candidate.id === id);
      return unit ? effectiveUnit(unit, req.totals, req.enemy, req.activeEvents).hpPerUnit : 0;
    };
    const shelter = Math.min(
      ...Object.entries(counts)
        .filter(([id]) => !mercIds.includes(id))
        .map(([id, count]) => count * hpOf(id)),
    );
    for (const id of mercIds) {
      const count = counts[id] ?? 0;
      const hp = hpOf(id);
      if (count <= 0 || hp <= 0 || count * hp < shelter) continue;
      const lowered = Math.max(0, Math.ceil(shelter / hp) - 1);
      if (lowered > 0) counts[id] = lowered;
      else delete counts[id];
    }
    const { summary } = planMarch(req, counts);
    // A put-back has to shorten the training queue — the clause the owner's sentence turns on, checked before
    // the score because a large enough damage gain outvotes any rise in it (`putBackOn`).
    if (summary.recovery.seconds >= row.repeat.seconds) continue;
    const damage = ((summary.avgDamage - row.repeat.damage) / row.repeat.damage) * 100;
    const silver = ((row.repeat.silver - summary.recovery.silver) / row.repeat.silver) * 100;
    const seconds = ((row.repeat.seconds - summary.recovery.seconds) / row.repeat.seconds) * 100;
    const score = putBackScore({ damage, silver, seconds });
    if (score < 0 || damage < -CAMPAIGN.putBack.damageLossCap) continue;
    if (!best || score > best.score) best = { unitId: extra, score };
  }
  return best;
}

/**
 * **A put-back with no export on the machine** (the twin of the live test below).
 *
 * A first-run account — Guardsmen I–III and Specialists I, no bonuses — holding 83 Epic Monster Hunters at
 * 7 000 leadership takes **Spearman II** back on both of its rung stops, and takes it for nothing: measured
 * 2026-09-18, +5.4 % damage, 3.5 % of the silver and 8.9 % of the training queue saved on the sweet spot, and
 * +5.3 % / 3.5 % / 8.9 % on the steady max. That is the owner's case in its purest form — the ladder's own
 * shape leaves a low tier out, and putting it back is better on every one of the three prices.
 */
describe('a put-back on a first-run army', () => {
  test(
    'Epic Monster Hunters at 7 000: the rung stops put Spearman II back, and gain on all three prices',
    () => {
      const profile = newProfile('first run, hunters');
      profile.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: 83 }];
      const setup = profile.setups[0];
      if (!setup) throw new Error('no setup');
      const req = buildStackRequest(profile, {
        ...setup,
        housing: { leadership: 7_000, authority: 40_000, dominance: 0 },
      });
      const input: CampaignInput = {
        request: req,
        marchTarget: CAMPAIGN.marches,
        ...CAMPAIGN.planFixes,
        putBack: CAMPAIGN.putBack,
      };
      const plan = planCampaign(input);
      const put = plan.alternatives.filter((row) => row.putBack !== undefined && !row.sequence);
      expect(put.length, 'at least one rung stop puts a type back').toBeGreaterThan(0);
      for (const row of put) {
        const back = row.putBack;
        if (!back) throw new Error('no put-back');
        expect(back.unitId, `${row.pick} puts Spearman II back`).toBe('spearman-2');
        // Free: more damage, less silver, less queue. Nothing is traded away on this army.
        expect(back.damage, `${row.pick} gains damage`).toBeGreaterThan(0);
        expect(back.silver, `${row.pick} saves silver`).toBeGreaterThan(0);
        expect(back.seconds, `${row.pick} saves training time`).toBeGreaterThan(0);
        // And the row is still a march the recap prices identically, and a plan the stock sustains.
        expect(row.repeat.damage).toBe(planMarch(req, row.counts).summary.avgDamage);
        expect((row.counts['epic-monster-hunter-6'] ?? 0) > 0).toBe(true);
      }
      // The rule itself: every put-back the bar carries scores, and none of them costs more damage than the cap.
      for (const row of plan.alternatives) {
        if (!row.putBack) continue;
        expect(putBackScore(row.putBack), `${row.pick} scores`).toBeGreaterThanOrEqual(0);
        expect(row.putBack.damage, `${row.pick} is inside the loss cap`).toBeGreaterThanOrEqual(
          -CAMPAIGN.putBack.damageLossCap,
        );
      }
    },
    TIMEOUT,
  );
});

/**
 * **The put-back on the owner's live army** (2026-09-18, the setup experiment 103 measured: Aydae 43 ★3 alone,
 * 4 975 leadership, 2 180 authority, the two top guardsman tiers he does not own clicked out, and his own
 * hired stock — 83 hunters, unlimited legionaries, 10 chariots, 60 arbalesters).
 *
 * This is the army the owner was looking at when he wrote the complaint: the plan's steady max was a three-type
 * ladder, RD2 984 · ARC2 1931 · RD3 532, for 4 777 523 damage, 2 694 300 silver and 13d 7h of training queue,
 * and one more troop type in it is better on all three (`tools/theorycraft/out/103-put-back-time.md`).
 */
const LIVE_HIRED = [
  { id: 'epic-monster-hunter-6', cap: 83 },
  { id: 'legionary-6', cap: null },
  { id: 'chariot-6', cap: 10 },
  { id: 'arbalester-6', cap: 60 },
];
const AYDAE = { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 };
const THREE_HEROES = [
  AYDAE,
  { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
  { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
];

describe.skipIf(!existsSync(OWNER_EXPORT))('the put-back on the owner’s own account', () => {
  const parsed = existsSync(OWNER_EXPORT) ? parseImport(readFileSync(OWNER_EXPORT, 'utf8')) : null;
  const base = parsed?.kind === 'profile' ? parsed.payload : null;
  /** One of experiment 103's four setups, through the app's own request builder. */
  const setupOf = (
    captains: { id: string; captainId: string; level: number; star: number }[],
    leadership: number,
    live: boolean,
  ): CampaignInput => {
    if (!base) throw new Error('no profile');
    const profile = structuredClone(base);
    if (captains.length > 0) profile.sources.captains = [...captains];
    if (live) {
      profile.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: [] };
      profile.mercenaries.selected = structuredClone(LIVE_HIRED);
    }
    const setup = profile.setups[0];
    if (!setup) throw new Error('no setup');
    return buildPlanRequest(profile, {
      ...setup,
      housing: { ...setup.housing, leadership, ...(live ? { authority: 2_180 } : {}) },
    });
  };

  test(
    'the steady max fields a low tier again: Archer I back, more damage, less silver, five days less queue',
    () => {
      const input = setupOf([AYDAE], 4_975, true);
      const plan = planCampaign(input);
      const most = plan.alternatives.find((row) => row.pick === 'steady-max');
      expect(most, 'the steady max is offered').toBeDefined();
      const back = most?.putBack;
      expect(back, 'the steady max put a troop type back').toBeDefined();
      // Archer I scores highest of the five left-out types on his own rates: +2.7 % damage, 18.2 % of the
      // silver and 38.3 % of the queue, a score of 10.2 against Rider I's 10.1, Spearman I's 9.9 and
      // Spearman II's 3.4 (`tools/theorycraft/out/103-put-back-time.md`, the "steady-max" block).
      expect(back?.unitId).toBe('archer-1');
      expect((most?.counts['archer-1'] ?? 0) > 0, 'Archer I is in the march').toBe(true);
      // The figures the owner was promised: better than the ladder's 4 777 523 for 2 694 300.
      expect(most?.repeat.damage ?? 0).toBeGreaterThanOrEqual(4_880_000);
      expect(most?.repeat.silver ?? Infinity).toBeLessThanOrEqual(2_210_000);
      // And the recap prices it identically — the put-back is priced by `toMarch`, like every other march.
      expect(most?.repeat.damage).toBe(planMarch(input.request, most?.counts ?? {}).summary.avgDamage);
      expect(most?.repeat.silver).toBe(planMarch(input.request, most?.counts ?? {}).summary.recovery.silver);
      expect(most?.repeat.seconds).toBe(
        planMarch(input.request, most?.counts ?? {}).summary.recovery.seconds,
      );
      // Every hired type he holds is still fielded (S-58 B holds through the pass).
      for (const hired of LIVE_HIRED) {
        expect(most?.counts[hired.id] ?? 0, `${hired.id} is still fielded`).toBeGreaterThan(0);
      }
    },
    TIMEOUT,
  );

  /**
   * **Experiment 103's verdicts, pinned** — the "take" and "keep" of its four setups, recomputed here from the
   * engine (`bestPutBack` above) rather than read off the report, and checked against what the pass actually
   * did. The generated marches come from the same plan with the pass switched off, which is the only way to
   * see the march a verdict is about once the pass has replaced it.
   */
  test('the four setups of experiment 103 take and keep what the owner’s rule says', () => {
    // `want` is what the owner's rule says about the **generated** march; `onBar` is what the stop ends up
    // carrying. They differ on two rows, for two different reasons.
    //
    // At **12 000** the rule takes Spearman I and the *ladder guard* refuses it: taking it would leave "Steady
    // max" 1.5 % under the sweet spot beside it (8 063 238 against 8 185 823), so the engine hands that row its
    // generated march back (`plan.ts`).
    //
    // At **three heroes, 4 975** the two rows are not the same march at all, and that is the pass working as
    // designed: it runs on the burn ladder *before* the stops are named, so the rung the bar ends up calling
    // "sweet spot" need not be the one the generated bar called that. Measured 2026-09-18 (S-87): generated,
    // the sweet spot is the 8-burn rung at 3 671 253 a march and the rule says nothing goes back on it
    // (`want` null); with the pass the sweet spot is the 11-burn rung with **Spearman I** back, 4 346 683 for
    // 2 078 900 silver — a better march at every reading than the one it replaced.
    //
    // **Re-based 2026-09-18 by the shelter** (S-87, every hired type under the troops): on that same setup the
    // generated steady max is now the 12-burn rung ARB 40 · CH 8 · EMH 38 · LEG 27 (4 616 996 for 2 268 000),
    // and the rule's verdict on it moves from Spearman II to **Spearman I** — 4 496 973 for 2 078 900 and a
    // shorter queue, 2.6 % of the damage inside the owner's 3 % cap. The other two setups are untouched:
    // Aydae alone still takes Archer I on both readings, and the export at 12 000 did not move at all.
    for (const [title, captains, leadership, live, pick, want, onBar] of [
      ['Aydae alone, 4 975', [AYDAE], 4_975, true, 'steady-max', 'archer-1', 'archer-1'],
      ['three heroes, 4 975', THREE_HEROES, 4_975, true, 'sweet-spot', null, 'spearman-1'],
      ['three heroes, 4 975', THREE_HEROES, 4_975, true, 'steady-max', 'spearman-1', 'spearman-1'],
      ['the export at 12 000', [], 12_000, false, 'steady-max', 'spearman-1', null],
    ] as const) {
      const input = setupOf([...captains], leadership, live);
      const generated = planCampaign({ ...input, putBack: undefined });
      const before = generated.alternatives.find((row) => row.pick === pick);
      expect(before, `${title}: ${pick} is offered without the pass`).toBeDefined();
      if (!before) continue;
      const verdict = bestPutBack(input.request, before);
      expect(verdict?.unitId ?? null, `${title}: the rule's verdict on the generated ${pick}`).toBe(want);
      const after = planCampaign(input).alternatives.find((row) => row.pick === pick);
      expect(after, `${title}: ${pick} is still offered with the pass`).toBeDefined();
      expect(after?.putBack?.unitId ?? null, `${title}: what the pass did to ${pick}`).toBe(onBar);
      if (onBar !== null) {
        const back = after?.putBack;
        if (!back) throw new Error('no put-back');
        expect(putBackScore(back), `${title}: ${pick} scores`).toBeGreaterThanOrEqual(0);
        expect(back.damage, `${title}: ${pick} is inside the loss cap`).toBeGreaterThanOrEqual(
          -CAMPAIGN.putBack.damageLossCap,
        );
      }
    }
  }, 180_000);
});

/**
 * **The two guards on the pass** (owner, 2026-09-18: *"consider again lower level troops if the cost for them
 * … is not too high and we get a nice reduction in training time"*), on the one army measured where the score
 * alone says yes and the sentence says no: a first-run account holding 42 legionaries and 20 chariots at
 * 12 000 leadership.
 *
 * Its silver saver's cheapest left-out type, Swordsman I, scores **57** — +109.2 % damage — by spending
 * 182.4 % more silver and sitting 151.8 % longer in the barracks, and the march it makes is dearer than the
 * sweet spot beside it (5 108 400 against 4 878 400) at 0.706 a silver against 0.858. Both guards refuse it:
 * the queue one in the engine's own scoring, and the silver saver's own rule after the pass.
 */
describe('a put-back never lengthens the queue, and never costs the silver saver its name', () => {
  test(
    '42 legionaries and 20 chariots at 12 000: every stop recovers faster, and the saver still saves',
    () => {
      const profile = newProfile('first run, legionaries');
      profile.mercenaries.selected = [
        { id: 'legionary-6', cap: 42 },
        { id: 'chariot-6', cap: 20 },
      ];
      const setup = profile.setups[0];
      if (!setup) throw new Error('no setup');
      const req = buildStackRequest(profile, {
        ...setup,
        housing: { leadership: 12_000, authority: 40_000, dominance: 0 },
      });
      const input: CampaignInput = {
        request: req,
        marchTarget: CAMPAIGN.marches,
        ...CAMPAIGN.planFixes,
        putBack: CAMPAIGN.putBack,
      };
      const plan = planCampaign(input);
      // Guard one: a put-back that lengthens the queue is not a put-back, whatever it scores.
      for (const row of plan.alternatives) {
        if (!row.putBack) continue;
        expect(row.putBack.seconds, `${row.pick} recovers faster`).toBeGreaterThan(0);
        expect(row.putBack.unitId, `${row.pick} did not take the swordsman`).not.toBe('swordsman-1');
      }
      // Guard two: the silver saver is still cheaper than the sweet spot and still at least as efficient a
      // silver — the pair of facts the stop is offered for.
      const saver = plan.alternatives.find((row) => row.pick === 'silver-saver');
      const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot');
      expect(saver, 'the silver saver is offered').toBeDefined();
      expect(sweet, 'the sweet spot is offered').toBeDefined();
      if (!saver || !sweet) return;
      expect(saver.repeat.silver).toBeLessThanOrEqual(sweet.repeat.silver);
      expect(saver.repeat.damage / saver.repeat.silver).toBeGreaterThanOrEqual(
        sweet.repeat.damage / sweet.repeat.silver,
      );
      // And whatever it is, it is a march the recap prices identically.
      expect(saver.repeat.damage).toBe(planMarch(req, saver.counts).summary.avgDamage);
    },
    TIMEOUT,
  );
});

/**
 * **The queue guard, on the two marches that exercise it** (owner, 2026-09-18: a put-back is for when *"we get
 * a nice reduction in training time"*).
 *
 * The guard is the one refusal the score cannot make on its own: a candidate that lengthens the training queue
 * is thrown out before it is scored, however well it scores. The owner's export is where that bites — its
 * `all-in` stop scores a Spearman II put-back on both setups measured, and both of them would sit *longer* in
 * the barracks. Each case below rebuilds the candidate the pass considered (the MS sizer over the all-in's own
 * first-march types plus Spearman II, its own hired counts as caps, priced by the battle) and asserts both
 * halves: the score is positive, so nothing else refuses it, **and** the queue rises, which is what does. Stub
 * the guard and the first assertion below fails.
 *
 * The first-run probe army above (42 legionaries and 20 chariots) does **not** exercise this: its Swordsman I
 * candidate is refused by the queue guard too, but it would have been dropped a second time by the silver
 * saver's own rule, so a stubbed guard would still pass there. These two are the clean cases.
 */
describe.skipIf(!existsSync(OWNER_EXPORT))('the queue guard on the owner’s export', () => {
  const parsed = existsSync(OWNER_EXPORT) ? parseImport(readFileSync(OWNER_EXPORT, 'utf8')) : null;
  const base = parsed?.kind === 'profile' ? parsed.payload : null;

  test('the all-in keeps its own march at 7 000 and at 12 000: the put-back scores, and costs queue', () => {
    if (!base) throw new Error('no profile');
    for (const leadership of [7_000, 12_000]) {
      const profile = structuredClone(base);
      const setup = profile.setups[0];
      if (!setup) throw new Error('no setup');
      const input = buildPlanRequest(profile, {
        ...setup,
        housing: { ...setup.housing, leadership },
      });
      const req = input.request;
      const plan = planCampaign(input);
      const allIn = plan.alternatives.find((row) => row.pick === 'all-in');
      expect(allIn, `${String(leadership)}: the all-in is offered`).toBeDefined();
      if (!allIn) continue;
      expect(allIn.putBack, `${String(leadership)}: the all-in kept its own march`).toBeUndefined();

      // The candidate the pass built and refused: the all-in's first march re-sized over its own troop
      // types plus Spearman II, its hired counts as the sizer's caps — exactly what `putBackOn` scores.
      const mercIds = req.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
      const inMarch = req.units
        .filter((unit) => unit.pool === 'leadership' && (allIn.counts[unit.id] ?? 0) > 0)
        .map((unit) => unit.id);
      expect(inMarch, `${String(leadership)}: Spearman II is left out`).not.toContain('spearman-2');
      const caps: Record<string, number> = { ...req.caps };
      for (const id of mercIds) caps[id] = allIn.counts[id] ?? 0;
      const sized = sizeStacks({
        ...req,
        units: req.units.filter(
          (unit) => inMarch.includes(unit.id) || unit.id === 'spearman-2' || mercIds.includes(unit.id),
        ),
        caps,
        options: { ...req.options, method: 'ms', relaxedPreservation: false },
      });
      const counts: Record<string, number> = {};
      for (const stack of sized.stacks) if (stack.count > 0) counts[stack.unitId] = stack.count;
      const { summary } = planMarch(req, counts);

      // It scores — and well: measured 2026-09-18, 5.8 at 7 000 (+8.6 % damage) and 1.9 at 12 000
      // (+8.0 %). Nothing in the rule refuses it.
      const damage = ((summary.avgDamage - allIn.repeat.damage) / allIn.repeat.damage) * 100;
      const silver = ((allIn.repeat.silver - summary.recovery.silver) / allIn.repeat.silver) * 100;
      const seconds = ((allIn.repeat.seconds - summary.recovery.seconds) / allIn.repeat.seconds) * 100;
      expect(
        putBackScore({ damage, silver, seconds }),
        `${String(leadership)}: the refused candidate would have scored`,
      ).toBeGreaterThan(0);
      expect(damage, `${String(leadership)}: and is inside the loss cap`).toBeGreaterThanOrEqual(
        -CAMPAIGN.putBack.damageLossCap,
      );
      // And the queue is the one thing it makes worse, which is why it is not on the bar.
      expect(
        summary.recovery.seconds,
        `${String(leadership)}: the refused candidate sits longer in the barracks`,
      ).toBeGreaterThan(allIn.repeat.seconds);
    }
  }, 180_000);
});
