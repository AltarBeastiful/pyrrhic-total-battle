/**
 * 142 — **what the sheltered raise is worth** (S-142; owner, 2026-09-29: *"add a button in the battle
 * summary next to monsters and mercs to safely up the number of monsters or merc while keeping them
 * shielded against … a slider with three options: default count, maximize number and spent (rounding to the
 * nearest 10 number that's still shielded), maximize global (going to nearest count that's still shielded
 * not caring about rounding to 10)"*).
 *
 * The plan sizes the hired stacks to a **trade**: damage against the stock burnt over `CAMPAIGN.marches`
 * marches. On an account whose stock is thin against its troop floor, that trade stops the hired counts
 * **below** what the shelter allows — the whole reason the parked note existed (`src/kernel/todos.md:7`:
 * *"we could add more mercs while still protecting them without augmenting silver"*). The control raises
 * them to the line the troops draw: `ceil(floor / hpPerUnit) − 1`, the number `shelterUnder` lowers a stack
 * to.
 *
 * **What this measures, stop by stop, on the owner's live account**: what each position buys — damage,
 * silver, gold, the hired stock burnt — and what it costs — the shelter margin left standing under the
 * lowest troop stack. Then the questions the story has to answer with numbers rather than with an argument:
 *
 *   1. does a raise ever **lose** damage? It grows a stack's total HP, so the stack climbs the kill order
 *      and survives fewer rounds: the units bought can be paid for with a round of strikes. (It is the
 *      owner's own report of 2026-09-29 that made this concrete: 14 stacks, 28 hits, a stack's hits being
 *      its kill position.)
 *   2. does the **housing** ever bind, or is the **stock** always the thing in the way? The owner's rule for
 *      a short pool — *"fill the stack that strikes most first"* — only does anything when the spare runs
 *      out, and a rule nothing exercises is a rule nobody has measured.
 *   3. what does a raised march **burn**? The burn is `ceil(count / 10)` a march, so more units fielded is
 *      more stock gone per march however well sheltered they are — and the raised march spends one march's
 *      worth of a stock the plan spreads over four.
 *
 * Every figure is `simulateBattle` on the counts (`evaluateCounts`), and the damage is the **worst
 * opening** (`summary.minDamage`), like the bar's own column since S-108. The raise itself is the app's own
 * function — `raisedCounts`, from `src/ui/sections/march/raise` — so this measures the button and not a
 * second implementation of it.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/142-the-sheltered-raise.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import type { PlanRow } from '../../src/engine/plan';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { raisedCounts, troopFloor } from '../../src/ui/sections/march/raise';
import type { RaiseMode, RaiseModes } from '../../src/ui/sections/march/raise';
import { Report, evaluateCounts, loadLiveAccount, n } from './harness';

/** One march, as the March pane and the recap read it. */
interface Reading {
  damage: number;
  silver: number;
  gold: number;
  burn: number;
  /** The lowest troop stack's total HP: the line every hired stack must stay strictly under. */
  floor: number;
  /** How far the largest hired stack sits under that line, as a fraction of it. */
  margin: number;
  /** The hired units fielded, both hired pools together. */
  hired: number;
}

/** The march a set of counts describes: figures from `simulateBattle`, the line and the margin from its stacks. */
function read(request: StackRequest, counts: Record<string, number>): Reading {
  const { result, summary } = evaluateCounts(request, counts);
  const live = result.stacks.filter((stack) => stack.count > 0);
  const floor = troopFloor(result) ?? 0;
  const hired = live.filter((stack) => stack.pool !== 'leadership');
  const heaviest = hired.reduce((most, stack) => Math.max(most, stack.totalHp), 0);
  return {
    damage: summary.minDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    burn: hiredLost(result.stacks),
    floor,
    margin: floor <= 0 ? 0 : (floor - heaviest) / floor,
    hired: hired.reduce((sum, stack) => sum + stack.count, 0),
  };
}

/** How a figure moved against the plan's own march, in percent. */
function delta(before: number, after: number): string {
  if (before === 0) return after === 0 ? '—' : 'new';
  const percent = ((after - before) / before) * 100;
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)} %`;
}

/** The positions, in the order the segments carry them. */
const POSITIONS: readonly { mode: RaiseMode; label: string }[] = [
  { mode: 'most', label: 'Most' },
  { mode: 'tens', label: 'Most, in tens' },
];

/** Both hired pools asked for at once: what the two controls offer together. */
const BOTH: Record<RaiseMode, RaiseModes> = {
  off: { authority: 'off', dominance: 'off' },
  tens: { authority: 'tens', dominance: 'tens' },
  most: { authority: 'most', dominance: 'most' },
  // The exhaustive positions read as the climb in `raisedCounts` (S-143b, S-144, S-145): their answers are
  // the worker's, and this file is about what the synchronous positions promise. `safe` and `tight` are `v2`
  // under a cap on the stock, so on this file's reading — the counts the pane draws first — they are the
  // same answer, and that is exactly the promise they make: no worse than the climb drawn here.
  v2: { authority: 'v2', dominance: 'v2' },
  safe: { authority: 'v2', dominance: 'v2' },
  tight: { authority: 'v2', dominance: 'v2' },
  tightOld: { authority: 'v2', dominance: 'v2' },
};

/** What the two hired pools have left to spend, in housing points. */
function spareOf(request: StackRequest, counts: Record<string, number>): number {
  let spare = 0;
  for (const pool of ['authority', 'dominance'] as const) {
    let used = 0;
    for (const unit of request.units) {
      if (unit.pool === pool) used += (counts[unit.id] ?? 0) * unit.cost;
    }
    spare += Math.max(0, request.housing[pool] - used);
  }
  return spare;
}

/** The stacks a march fields, in kill order — the order they fall in, which is the order a raise reorders. */
function killOrder(result: StackResult): string {
  return result.stacks
    .filter((stack) => stack.count > 0)
    .map((stack) => `${stack.unitId} ${String(stack.count)} (${n(stack.totalHp)} HP)`)
    .join(' · ');
}

interface Tally {
  stops: number;
  moved: number;
  lost: number;
  bound: number;
}

/**
 * Every stop of the bar, read three ways: the plan's own counts, then each position.
 *
 * Each raised reading carries the **shelter margin** beside it, because that is the price: the raise leaves
 * the heaviest hired stack one HP under the lowest troop stack, which is exactly the near tie the March's
 * faint warning is about.
 */
function bar(
  report: Report,
  title: string,
  profile: Parameters<typeof buildPlanRequest>[0],
  setup: Parameters<typeof buildPlanRequest>[1],
  request: StackRequest,
): Tally {
  const plan = planCampaign(buildPlanRequest(profile, setup));
  report.h(`${title} — ${String(plan.alternatives.length)} stops`);
  report.add('');
  report.add(
    '| stop | position | hired | damage | vs plan | silver | gold | burn | margin | housing spare |',
  );
  report.add('|---|---|---|---|---|---|---|---|---|---|');

  const tally: Tally = { stops: plan.alternatives.length, moved: 0, lost: 0, bound: 0 };
  for (const stop of plan.alternatives) {
    const own = read(request, stop.counts);
    report.add(
      `| ${stop.pick} | — | ${n(own.hired)} | **${n(own.damage)}** | | ${n(own.silver)} | ${n(own.gold)} | ${n(
        own.burn,
      )} | ${(own.margin * 100).toFixed(2)} % | |`,
    );
    for (const { mode, label } of POSITIONS) {
      const before = evaluateCounts(request, stop.counts).result;
      const raised = raisedCounts(request, before, BOTH[mode]);
      if (raised === null) {
        report.add(`| ${stop.pick} | ${label} | — | — | — | — | — | — | — | nothing left to raise |`);
        continue;
      }
      tally.moved += 1;
      const after = read(request, { ...stop.counts, ...raised });
      if (after.damage < own.damage) tally.lost += 1;
      const spare = spareOf(request, stop.counts);
      if (spare <= 0) tally.bound += 1;
      report.add(
        `| ${stop.pick} | ${label} | **${n(after.hired)}** | ${n(after.damage)} | ${delta(
          own.damage,
          after.damage,
        )} | ${n(after.silver)} | ${n(after.gold)} | ${n(after.burn)} | ${(after.margin * 100).toFixed(
          2,
        )} % | ${n(spare)} |`,
      );
    }
  }
  report.add('');
  return tally;
}

describe.skipIf(!process.env.THEORY)('the sheltered raise', () => {
  it('prices the two positions on the owner’s live account, and on it with monsters', () => {
    const report = new Report('142-the-sheltered-raise');

    report.add(
      [
        'The control on the mercenaries’ and monsters’ blocks raises every hired stack to the last count that',
        'still sits **strictly** under the lowest troop stack — `ceil(floor / hpPerUnit) − 1`, the number',
        '`shelterUnder` lowers a stack to — bounded by the owned stock (a mercenary) and by the dominance pool',
        '(a monster), and never past the spare housing. `Most, in tens` rounds that ceiling down to a whole',
        'ten, which is how the game hands units back.',
      ].join(' '),
    );

    // **His live account**: 20 000 leadership, 2 180 authority, 83 epic monster hunters in stock, no
    // dominance pool — the bar he was reading when the parked note was written.
    const live = loadLiveAccount();
    const liveRequest = buildStackRequest(live.profile, live.setup);
    const mercs = bar(report, 'His live account (mercenaries only)', live.profile, live.setup, liveRequest);

    // **The same account with a dominance pool**, so the monsters’ control has something to do and the two
    // pools are raised together — the second half of the owner’s sentence (*"or merc"*).
    const monsters = { ...live.setup, housing: { ...live.setup.housing, dominance: 1_200 } };
    const monsterRequest = buildStackRequest(live.profile, monsters);
    const both = bar(
      report,
      'The same account with 1 200 dominance (monsters too)',
      live.profile,
      monsters,
      monsterRequest,
    );

    // The dearest stop stack by stack: a reader can redo the sums, and see the reordering a raise causes.
    const plan = planCampaign(buildPlanRequest(live.profile, live.setup));
    const dearest = plan.alternatives.reduce((best: PlanRow, row: PlanRow) =>
      read(liveRequest, row.counts).damage > read(liveRequest, best.counts).damage ? row : best,
    );
    const before = evaluateCounts(liveRequest, dearest.counts).result;
    const raised = raisedCounts(liveRequest, before, BOTH.most) ?? {};
    report.h(`The dearest stop (${dearest.pick}), stack by stack`);
    report.add(`- plan: ${killOrder(before)}`);
    report.add(
      `- raised: ${killOrder(evaluateCounts(liveRequest, { ...dearest.counts, ...raised }).result)}`,
    );
    report.add('');

    const readings = (mercs.stops + both.stops) * POSITIONS.length;
    const lost = mercs.lost + both.lost;
    const bound = mercs.bound + both.bound;
    report.h('What the numbers say');
    report.add('');
    report.add(
      [
        `- **${String(mercs.moved + both.moved)} of ${String(readings)} readings moved the counts at all.**`,
        'Where the plan already fields what the shelter allows, both positions do nothing — that is a march',
        'whose counts are bounded by the line rather than by the stock, and the control is drawn for the case',
        'this story is about: a stock thin against a troop floor.',
      ].join(' '),
    );
    report.add(
      [
        `- **${String(lost)} of them lost damage** to the raise, which is the kill-order effect the owner’s`,
        'report of 2026-09-29 made concrete: a stack with more total HP dies a round earlier and strikes that',
        'much less. It is why a `Best` position — the count that gives the most damage under the line — is a',
        'second step rather than folded into `Most`, which promises *units*, not damage.',
      ].join(' '),
    );
    report.add(
      [
        `- **The housing bound on ${String(bound)} readings.** Where it did, the spare was spent in kill`,
        'order from the bottom up — the owner’s *"fill the stack that strikes most first"*, the last to fall',
        'being the one that strikes most. Where it did not, the **stock** is what stops the raise, never the',
        'pool: a mercenary is bounded by what the account owns.',
      ].join(' '),
    );
    report.add('');

    report.save();
  }, 300_000);
});
