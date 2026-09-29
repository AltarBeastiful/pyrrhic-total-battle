/**
 * 180 — **every position, over the benchmark's own armies** (S-142/S-143/S-143b; owner, 2026-09-29:
 * *"benchmark the 4 positions on the benchmark usecases to assert all the criterias if they were improved or
 * decreased by each position"*, then *"redo the benchmark comparing all positions including best and best
 * v2 over all benchmark usecases"*).
 *
 * Five answers to the same march, priced side by side on **every stop of every benchmark army**:
 *
 *   - `As is` — the plan's own counts;
 *   - `Most, in tens` · `Most` — every hired stack as high as the troops still shelter it, rounded and exact;
 *   - `Best` — the shipped climb (`raise.ts`), which samples its box because it runs on the main thread;
 *   - **`Best v2`** — the research search (`exact-best.ts`): the same seed and the same box, walked whole
 *     where the box fits and searched to convergence where it does not.
 *
 * **What must hold, and is asserted** — the positions are promises, and a promise that fails on one army is
 * a defect:
 *
 *   1. **`Best` and `Best v2` never lose damage.** Both only ever take a count that improves the march's
 *      worst opening, so their damage is at least the plan's own on every army, every stop — and `Best v2`,
 *      which searches the same box the climb samples, is never *below* `Best`.
 *   2. **`Most` fields the most units** — never fewer than the plan, and never fewer than either `Best`,
 *      which is the whole of what the position claims.
 *   3. **Every raised stack is still sheltered**: strictly under the lowest troop stack, on every stop, at
 *      every position. That is what `shelterUnder` means, and the margin is printed so a thin promise is
 *      visible rather than assumed.
 *   4. **Every raised march is one the game would take**: no pool over its housing, no type over its stock.
 *
 * **What is measured and reported rather than asserted** — the ten readings themselves, because the
 * positions are *allowed* to move them: `Most` fields more units, which is more gold to revive and more of
 * the stock gone a march, and whether that is a trade worth making is the player's. (The campaign figures the
 * plan's own criteria pin are deliberately absent: a position touches one march's counts and never the plan,
 * so the campaign behind it cannot move — `pnpm bench:baseline` is where that is held.)
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/180-the-positions.test.ts`
 */
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import type { CampaignPlan } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';
import { applyCounts } from '@/ui/sections/march/manual';
import { hiredLost } from '@/ui/sections/march/hired';
import { raisedCounts, shelterCeiling, troopFloor } from '@/ui/sections/march/raise';
import type { RaiseMode } from '@/ui/sections/march/raise';
import { worstDamageByPool } from '@/ui/sections/march/worst';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { bestV2 } from './exact-best';
import { Report, n } from './harness';

/**
 * The five, in the order the segments carry them (the last is not in the app: `Best v2` is the research
 * search, `exact-best.ts`, and this file is where it is priced against what does ship).
 */
type PositionKey = Exclude<RaiseMode, 'off'> | 'v2';

const POSITIONS: readonly { key: PositionKey; label: string }[] = [
  { key: 'tens', label: 'Most, in tens' },
  { key: 'most', label: 'Most' },
  { key: 'best', label: 'Best' },
  { key: 'v2', label: 'Best v2' },
];

/** What a position does to a march: the counts it moves, and how it found them. */
function movesOf(
  request: StackRequest,
  base: Parameters<typeof raisedCounts>[1],
  key: PositionKey,
): { moves: Record<string, number>; how: string } | null {
  if (key !== 'v2') {
    const modes = { authority: key, dominance: key } as const;
    const moves = raisedCounts(request, base, modes);
    return moves === null ? null : { moves, how: key };
  }
  const found = bestV2(request, base);
  return found === null ? null : { moves: found.moves, how: `${found.how}, box ${n(found.space)}` };
}

/** Every reading one march is judged on. */
interface Reading {
  damage: number;
  perSilver: number;
  perHired: number;
  /** The lowest troop stack's total HP: the line every hired stack must stay strictly under. */
  floor: number;
  /** How far the heaviest hired stack sits under that line, as a fraction of it. `null` with nothing hired. */
  margin: number | null;
  silver: number;
  gold: number;
  coins: number;
  seconds: number;
  burn: number;
  hired: number;
}

function read(
  request: StackRequest,
  counts: Record<string, number>,
  /**
   * **Which replay draws the march** — and it has to be the one the March itself would draw.
   *
   * A *plan stop* is drawn from the engine's own result (`planMarch`, the `snapshot.result` the pane holds);
   * a *position* is a count edit, and `useMarch` draws those through `applyCounts` (the hand-edit replay).
   * The two **disagree on a total-HP tie**: the engine breaks it by the kill-order ranking
   * (`buildKillOrder`), `applyCounts` by the base march's own stack order — so on a march with two stacks of
   * equal HP the same counts can be two different battles, ~1.8 % apart on the monster camp measured below.
   * Reading a position with the engine's path measured a march the player would never see, and it is why
   * `Best v2` — which optimises under `applyCounts` — first looked *worse* than `Best` here.
   */
  base?: Parameters<typeof applyCounts>[1],
): Reading {
  const { result, summary } =
    base === undefined ? planMarch(request, counts) : applyCounts(request, base, counts);
  const live = result.stacks.filter((stack) => stack.count > 0);
  const floor = troopFloor(result) ?? 0;
  const hired = live.filter((stack) => stack.pool !== 'leadership');
  const heaviest = hired.reduce((most, stack) => Math.max(most, stack.totalHp), 0);
  const lost = hiredLost(result.stacks);
  return {
    damage: summary.minDamage,
    perSilver: summary.recovery.silver <= 0 ? 0 : summary.minDamage / summary.recovery.silver,
    perHired: worstDamageByPool(summary.journals.enemyFirst, result.stacks).authority / Math.max(1, lost),
    floor,
    margin: hired.length === 0 || floor <= 0 ? null : (floor - heaviest) / floor,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    coins: summary.recovery.dragonCoins,
    seconds: summary.recovery.seconds,
    burn: lost,
    hired: hired.reduce((sum, stack) => sum + stack.count, 0),
  };
}

/** What the march a set of counts describes would meet in game: the housing it pays and the stock it spends. */
function overTheLine(request: StackRequest, counts: Record<string, number>): string[] {
  const used = { leadership: 0, authority: 0, dominance: 0 };
  const over: string[] = [];
  for (const unit of request.units) {
    const count = counts[unit.id] ?? 0;
    const cap = request.caps[unit.id];
    if (cap !== undefined && count > cap)
      over.push(`${unit.id} ${String(count)} over its stock of ${String(cap)}`);
    used[unit.pool] += count * unit.cost;
  }
  for (const pool of ['leadership', 'authority', 'dominance'] as const) {
    if (used[pool] > request.housing[pool]) {
      over.push(`${pool} ${String(used[pool])} over ${String(request.housing[pool])}`);
    }
  }
  return over;
}

/** The ten readings, with the direction that is better for each — the criteria the owner asked to see move. */
const CRITERIA: readonly { key: keyof Reading; label: string; better: 'higher' | 'lower' }[] = [
  { key: 'damage', label: 'Damage a march', better: 'higher' },
  { key: 'perSilver', label: 'Damage a silver', better: 'higher' },
  { key: 'perHired', label: 'Damage a hired', better: 'higher' },
  { key: 'silver', label: 'Silver', better: 'lower' },
  { key: 'gold', label: 'Gold', better: 'lower' },
  { key: 'coins', label: 'Dragon coins', better: 'lower' },
  { key: 'seconds', label: 'Training queue', better: 'lower' },
  { key: 'burn', label: 'Merc lost', better: 'lower' },
  { key: 'hired', label: 'Hired units fielded', better: 'higher' },
  { key: 'margin', label: 'Shelter margin', better: 'higher' },
];

interface Tally {
  up: number;
  same: number;
  down: number;
}

/** A tenth of a percent is a rounding, not a trade. */
function direction(from: number | null, to: number | null): -1 | 0 | 1 {
  const a = from ?? 0;
  const b = to ?? 0;
  if (Math.abs(b - a) <= Math.max(Math.abs(a), Math.abs(b)) * 0.001) return 0;
  return b > a ? 1 : -1;
}

describe.skipIf(!process.env.THEORY)('every position, over the benchmark armies', () => {
  it('prices every position on every stop, and holds the promises', () => {
    const report = new Report('180-the-positions');
    report.add(
      [
        'Every stop of every benchmark army, read four ways: the plan’s own counts, then `Most, in tens`,',
        '`Most` and `Best`. The four promises are asserted (the damage `Best` keeps, the units `Most` fields,',
        'the shelter that must still hold, the housing that must still pay); the ten readings are **reported**,',
        'with the direction each one moved against the plan’s own march.',
      ].join(' '),
    );

    const blank = (): Map<string, Tally> =>
      new Map<string, Tally>(CRITERIA.map((criterion) => [criterion.label, { up: 0, same: 0, down: 0 }]));
    const tally = new Map<string, Map<string, Tally>>(POSITIONS.map((position) => [position.label, blank()]));
    /** The same readings, each position against **`Best`** rather than against the plan's own march. */
    const against = new Map<string, Map<string, Tally>>(
      POSITIONS.map((position) => [position.label, blank()]),
    );

    let stops = 0;
    let movedReadings = 0;
    let refusals = 0;
    const ties: string[] = [];
    const pools = { authority: 0, dominance: 0 };
    const broken: string[] = [];

    for (const scenario of criteriaScenarios()) {
      /**
       * **An army the plan refuses is not an army this control has anything to say about**: the bar is the
       * thing it is drawn under, and there is no bar. The refusal is caught by its own message and anything
       * else is thrown on: a benchmark that swallowed every error would measure nothing.
       */
      let plan: CampaignPlan;
      try {
        // **The app's own plan, flag for flag** — the same call the benchmark makes (`plan-measure.ts:243`):
        // the sizer fixes, the fold, and the put-back pass at `CAMPAIGN.putBack`. A plan built without them
        // is not the bar this control sits under, and measuring a position on it would measure nothing.
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
        report.h(`**${scenario.label}** — the plan refuses this army`);
        refusals += 1;
        continue;
      }
      report.h(`**${scenario.label}** — ${String(plan.alternatives.length)} stops`);
      report.add('');
      report.add(
        '| stop | position | hired | shelter | damage | a silver | a hired | silver | gold | coins | queue | burn |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|---|---|---|');

      for (const stop of plan.alternatives) {
        stops += 1;
        const base = planMarch(scenario.request, stop.counts).result;
        const own = read(scenario.request, stop.counts);
        // **The two replay paths, on the plan's own counts.** Where they disagree the tie rule alone moved a
        // march, before any position touched it — an app inconsistency this file reports rather than hides.
        const sameCountsOtherPath = applyCounts(scenario.request, base, stop.counts).summary.minDamage;
        if (sameCountsOtherPath !== own.damage) {
          ties.push(
            `${scenario.label} · ${stop.pick}: ${n(own.damage)} drawn from the plan, ${n(sameCountsOtherPath)} from the raise's replay`,
          );
        }
        const here: string[] = [];
        const line = (label: string, reading: Reading): void => {
          report.add(
            `| ${stop.pick} | ${label} | ${n(reading.hired)} | ${
              reading.margin === null ? '—' : `${(reading.margin * 100).toFixed(2)} %`
            } | ${n(reading.damage)} | ${reading.perSilver.toFixed(3)} | ${n(reading.perHired)} | ${n(
              reading.silver,
            )} | ${n(reading.gold)} | ${n(reading.coins)} | ${n(reading.seconds)} | ${n(reading.burn)} |`,
          );
        };
        line('As is', own);

        const byLabel = new Map<string, Reading>([['As is', own]]);
        for (const position of POSITIONS) {
          const found = movesOf(scenario.request, base, position.key);
          if (found === null) {
            report.add(`| ${stop.pick} | ${position.label} | — | — | — | — | — | — | — | — | — | — |`);
            continue;
          }
          const counts = found.moves;
          movedReadings += 1;
          const reading = read(scenario.request, { ...stop.counts, ...counts }, base);
          byLabel.set(position.label, reading);
          line(position.label, reading);

          // **The promises.**
          if (reading.margin !== null && reading.margin <= 0) {
            here.push(`${position.label} left a hired stack at or over the troop floor`);
          }
          here.push(...overTheLine(scenario.request, { ...stop.counts, ...counts }));
          // And the ceiling itself, read back off the stack the position moved.
          for (const [unitId, count] of Object.entries(counts)) {
            const stack = base.stacks.find((one) => one.unitId === unitId);
            const unit = scenario.request.units.find((one) => one.id === unitId);
            if (stack === undefined || unit === undefined) continue;
            if (
              count >
              Math.min(shelterCeiling(own.floor, stack.hpPerUnit), scenario.request.caps[unitId] ?? Infinity)
            ) {
              here.push(`${position.label} put ${unitId} over its ceiling`);
            }
            pools[unit.pool === 'dominance' ? 'dominance' : 'authority'] += 1;
          }
          // **The damage promises.** `Most` is the units answer and is not held to this; the two damage
          // positions are, and `Best v2` — which searches the same box `Best` samples — is never below it.
          if (position.key === 'best' && reading.damage < own.damage) {
            here.push(`Best lost damage (${n(reading.damage)} against ${n(own.damage)})`);
          }
          if (position.key === 'v2' && reading.damage < own.damage) {
            here.push(`Best v2 lost damage (${n(reading.damage)} against ${n(own.damage)})`);
          }
          const bestRow = byLabel.get('Best');
          if (position.key === 'v2' && bestRow !== undefined && reading.damage < bestRow.damage) {
            here.push(`Best v2 came out below Best (${n(reading.damage)} against ${n(bestRow.damage)})`);
          }
          // `Most` fields the most: the two damage positions never field more than it does — they never go
          // above the same ceiling, and it takes the ceiling itself.
          const mostRow = byLabel.get('Most');
          if (position.key !== 'most' && mostRow !== undefined && reading.hired > mostRow.hired) {
            here.push(`${position.label} fielded more units than Most`);
          }
          if (position.key === 'most') {
            const bestSeen = byLabel.get('Best');
            if (bestSeen !== undefined && reading.hired < bestSeen.hired) {
              here.push('Most fielded fewer units than Best');
            }
          }
        }

        for (const problem of here) broken.push(`${scenario.label} · ${stop.pick}: ${problem}`);

        // The criteria: every position against the plan's own march, reading by reading — and against
        // **`Best`**, which is the comparison that says what `Best v2` buys over what ships.
        for (const [label, reading] of byLabel) {
          if (label === 'As is') continue;
          const per = tally.get(label);
          const versusBest = against.get(label);
          const bestRow = byLabel.get('Best');
          for (const criterion of CRITERIA) {
            const way = direction(own[criterion.key], reading[criterion.key]);
            const slot = per?.get(criterion.label);
            if (slot !== undefined) {
              const better = criterion.better === 'higher' ? way > 0 : way < 0;
              const worse = criterion.better === 'higher' ? way < 0 : way > 0;
              if (better) slot.up += 1;
              else if (worse) slot.down += 1;
              else slot.same += 1;
            }
            if (bestRow === undefined || versusBest === undefined) continue;
            const againstBest = direction(bestRow[criterion.key], reading[criterion.key]);
            const slot2 = versusBest.get(criterion.label);
            if (slot2 === undefined) continue;
            const up = criterion.better === 'higher' ? againstBest > 0 : againstBest < 0;
            const down = criterion.better === 'higher' ? againstBest < 0 : againstBest > 0;
            if (up) slot2.up += 1;
            else if (down) slot2.down += 1;
            else slot2.same += 1;
          }
        }
      }
    }

    report.h('The two replays, on the plan’s own counts');
    report.add('');
    if (ties.length === 0) {
      report.add('Every stop draws the same march whichever path replays it.');
    } else {
      report.add(
        `${String(ties.length)} of ${String(stops)} stops draw **two different marches** from the same counts: the engine’s own result (what the pane shows for a plan stop) and ` +
          '`applyCounts` (what it shows for a count edit, and the path every position above was read through). The cause is a total-HP tie broken differently — `buildKillOrder`’s ranking against the base march’s stack order.',
      );
      for (const tie of ties) report.add(`- ${tie}`);
    }
    report.add('');

    report.h('Each position against `Best`: what the extra search buys');
    report.add('');
    report.add('| criterion | position | improved | unchanged | decreased |');
    report.add('|---|---|---|---|---|');
    for (const [label, per] of against) {
      for (const criterion of CRITERIA) {
        const slot = per.get(criterion.label);
        if (slot === undefined) continue;
        report.add(
          `| ${criterion.label} | ${label} | ${String(slot.up)} | ${String(slot.same)} | ${String(slot.down)} |`,
        );
      }
    }
    report.add('');
    report.add(
      [
        '`Best v2` searches the same box `Best` samples — walked whole where the box is small, a seeded',
        'multi-start search where it is not — and it is seeded with `Best`’s own answer, so it can never come',
        'out below it. **Where the two differ, that is the gain the extra search is worth**, and the rows above',
        'are the price of getting it: more units fielded and more stock burnt wherever it moves a count.',
      ].join(' '),
    );
    report.add('');

    report.h('What each position did to each criterion');
    report.add('');
    report.add(
      `${String(stops)} stops, ${String(movedReadings)} moved by a position, ${String(refusals)} armies the ` +
        `plan refuses outright ` +
        `(${String(pools.authority)} readings on the mercenaries’ block, ${String(pools.dominance)} on the monsters’).`,
    );
    report.add('');
    report.add('| criterion | position | improved | unchanged | decreased |');
    report.add('|---|---|---|---|---|');
    for (const [label, per] of tally) {
      for (const criterion of CRITERIA) {
        const slot = per.get(criterion.label);
        if (slot === undefined) continue;
        report.add(
          `| ${criterion.label} | ${label} | ${String(slot.up)} | ${String(slot.same)} | ${String(slot.down)} |`,
        );
      }
    }
    report.add('');
    report.add(
      [
        '**How to read the directions.** A raise buys damage with the stock — `Merc lost` and the gold to',
        'bring them back go **up** wherever the position moved the counts, which is the trade the owner asked',
        'for (*"use most mercs you can"*) — and the shelter margin goes **down** wherever it stands a stack at',
        'the line. Silver is the troops’ own bill and barely moves: what the hired counts pay with is the',
        'authority pool and the stock, not silver.',
      ].join(' '),
    );
    report.add('');
    report.save();

    // The promises, on every stop of every army.
    expect(broken, broken.join('\n')).toEqual([]);
  }, 900_000);
});
