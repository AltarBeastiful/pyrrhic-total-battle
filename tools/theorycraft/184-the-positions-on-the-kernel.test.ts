/**
 * 184 — **the five raise positions on the kernel: what they cost, and what the block under the plan draws**
 * (S-147). Owner, 2026-09-29: *"take all positions remaining and implement them in assemblyscript. Goal is to
 * offer them as precomputed with the trades they offer visible to the user."*
 *
 * The March asks one position at a time, when a player presses it, because `Best v2` is a search over up to a
 * million count vectors — measured at **2.7 ms median and 51 s worst** on the stops where a raise can move a
 * count at all (`out/182-v2-cost.md`). Pricing all five *before* they are asked is five of those searches, and
 * that is only affordable if the box search runs in the wasm: `src/kernel/raise.ts` is `raisedCounts` and
 * the March's exhaustive search ported, and `positions.ts` asks it through `raiseKernel()`. Until W16 E3 S5b
 * the March's own TypeScript was the fallback and this file priced every stop on both paths; that search is
 * retired now (the owner, 2026-10-01: *"retire the ts version"*), and what it answered is kept as
 * `tests/golden/raise.json` — this file's own corpus, captured on both paths while both were alive.
 *
 * On every stop of every benchmark army:
 *
 *   1. **The kernel answers what the TypeScript did** — every count, how the search found it, the box and the
 *      scoring count, per stop per position, against the golden. The trade figures are the app's replay of
 *      those counts (`applyCounts`), so equal counts are equal figures.
 *   2. **What the kernel costs** — the five positions priced end to end, reported as a distribution: what the
 *      block under the plan costs a browser. (The TypeScript column this table carried until S5b read
 *      2.3 ms median and 10 304 ms worst a march, against the kernel's 0.7 ms and 649 ms, on the run before.)
 *   3. **The promises hold on the real corpus** — `Best v2` and `Safe` never below the climb they are seeded
 *      with, `Tight` never below the plan's own march, no capped position burning past its cap, no position
 *      fielding more units than `Most`. Experiment 180 asserts the same set over the same stops with the
 *      sampled climb as its reference row; this one reads the climb through `raisedCounts`.
 *   4. **What a press reads, and what it may not** (S-149). The control in the battle summary takes the row of
 *      the stop and the position on screen rather than running the same search again, and the guard that makes
 *      a row *this* march's answer is asserted on the corpus: the stop's own march is read, a march with one
 *      troop type lowered by a unit is refused.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/184-the-positions-on-the-kernel.test.ts`
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import { setRaiseKernel } from '@/engine/fast';
import type { StackRequest } from '@/engine/types';
import { createRaiseKernel } from '@/kernel/raise';
import { applyCounts } from '@/ui/sections/march/manual';
import { positionTrades, pricedRaise } from '@/ui/sections/march/positions';
import type { PositionTrade } from '@/ui/sections/march/positions';
import { burnOf, countsOf, raisedCounts } from '@/ui/sections/march/raise';
import type { RaiseModes } from '@/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report, n } from './harness';

const kernel = createRaiseKernel(loadKernelModule());

/** The label the block under the plan draws a position with (`MarchPills.tsx`'s own list). */
const LABEL: Record<PositionTrade['mode'], string> = {
  tens: 'Most, in tens',
  most: 'Most',
  v2: 'Best v2',
  safe: 'Safe',
  tight: 'Tight',
  tightOld: 'Tight (old)',
};

/** A tenth of a percent is a rounding, not a move. */
function change(to: number, from: number): number {
  if (from === 0) return 0;
  const percent = ((to - from) / from) * 100;
  return Math.abs(percent) <= 0.1 ? 0 : percent;
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

/** The counts a march really stands at, as a map over every unit the request carries. */
function effective(request: StackRequest, own: Record<string, number>, counts: Record<string, number>) {
  const merged = { ...own, ...counts };
  return Object.fromEntries(request.units.map((unit) => [unit.id, merged[unit.id] ?? 0]));
}

/** One stop's five positions as the March's retired TypeScript answered them (`tests/golden/raise.json`). */
interface GoldenRow {
  mode: PositionTrade['mode'];
  counts: Record<string, number>;
  how: 'walked' | 'searched' | null;
  space: number;
  scored: number;
}

const GOLDEN = new Map(
  (
    JSON.parse(readFileSync(new URL('../../tests/golden/raise.json', import.meta.url), 'utf8')) as {
      army: string;
      stop: string;
      rows: GoldenRow[];
    }[]
  ).map((entry) => [`${entry.army}|${entry.stop}`, entry.rows]),
);

describe.skipIf(!process.env.THEORY)('the raise positions on the kernel', () => {
  it('prices every position on every stop, and holds the kernel to the golden', () => {
    setRaiseKernel(kernel);
    const report = new Report('184-the-positions-on-the-kernel');
    report.add(
      [
        'Every stop of every benchmark army, priced five ways — `Most, in tens`, `Most`, `Best v2`, `Safe` and',
        '`Tight` — by the kernel (`src/kernel/raise.ts`), and held to what the March’s retired TypeScript',
        'answered (`tests/golden/raise.json`): every count, the box and the scoring count, which is asserted;',
        'what each position offers over the plan’s own march is reported, and so is what the kernel costs.',
      ].join(' '),
    );

    const broken: string[] = [];
    const moved = new Map<string, number>();
    const gained = new Map<string, number[]>();
    const lost = new Map<string, number>();
    /** One stop's five positions (the block's cost), and one **bar**'s — every stop of it, priced ahead. */
    const times = { kernel: [] as number[] };
    const bars = { kernel: [] as number[], stops: [] as number[] };
    /** The three exhaustive positions' boxes only: `Most` and `Most, in tens` search nothing. */
    const spaces: number[] = [];
    const scoreCounts: number[] = [];
    let stops = 0;
    let refusals = 0;
    let readings = 0;
    /** What a press reads off the bar (S-149), and what the guard refuses to let it read. */
    let pressable = 0;
    let refused = 0;
    let mixed = 0;

    for (const scenario of criteriaScenarios()) {
      let plan;
      try {
        // **The app's own plan, flag for flag** — the same call experiment 180 makes, so the stops are the
        // bar the block is drawn under.
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
      let barKernel = 0;
      report.add('| stop | position | damage | vs plan | silver | gold | merc | box | scored |');
      report.add('|---|---|---|---|---|---|---|---|---|');

      for (const stop of plan.alternatives) {
        stops += 1;
        const request = scenario.request;
        const base = planMarch(request, stop.counts).result;
        const planCounts = countsOf(base);

        const fastStart = performance.now();
        const fast = positionTrades(request, base);
        const fastMs = performance.now() - fastStart;
        times.kernel.push(fastMs);
        barKernel += fastMs;
        // 1. **The golden.** Every count, and how the search found it, on every position.
        expect(fast.rows.length).toBe(5);
        const golden = GOLDEN.get(`${scenario.label}|${stop.pick}`);
        expect(golden, `${scenario.label} · ${stop.pick}: a stop the golden does not have`).toBeDefined();
        for (let index = 0; index < fast.rows.length; index += 1) {
          const one = fast.rows[index] as PositionTrade;
          const other = golden?.[index] as GoldenRow;
          readings += 1;
          const where = `${scenario.label} · ${stop.pick} · ${one.mode}`;
          if (one.mode !== other.mode) broken.push(`${where}: the golden priced a different position`);
          expect(effective(request, planCounts, one.counts), `${where}: counts`).toStrictEqual(other.counts);
          expect(one.how, `${where}: how`).toBe(other.how);
          expect(one.space, `${where}: box`).toBe(other.space);
          expect(one.scored, `${where}: scored`).toBe(other.scored);
          if (one.space > 0) {
            spaces.push(one.space);
            scoreCounts.push(one.scored);
          }
        }

        // 3. **The promises**, on the counts the real corpus produces.
        const climbCounts = raisedCounts(request, base, { authority: 'v2', dominance: 'v2' });
        const climbed = { ...planCounts, ...climbCounts };
        const climbBurn = burnOf(base, climbed);
        const planBurn = burnOf(base, planCounts);
        const climbDamage = applyCounts(request, base, climbed).summary.minDamage;
        const most = fast.rows.find((row) => row.mode === 'most') as PositionTrade;

        for (const row of fast.rows) {
          const gain = change(row.damage, fast.own.damage);
          if (gain > 0) {
            const list = gained.get(row.mode) ?? [];
            list.push(gain);
            gained.set(row.mode, list);
          } else if (gain < 0) lost.set(row.mode, (lost.get(row.mode) ?? 0) + 1);
          if (row.damage !== fast.own.damage) moved.set(row.mode, (moved.get(row.mode) ?? 0) + 1);
          if (row.mode !== 'most' && row.units > most.units) broken.push(`${row.mode} fielded past most`);
          if (row.mode === 'v2' || row.mode === 'safe') {
            if (row.damage < fast.own.damage) broken.push(`${row.mode} lost the plan's own damage`);
            if (row.damage < climbDamage) broken.push(`${row.mode} came out below the climb`);
          }
          if (row.mode === 'safe' && row.mercLost > climbBurn) broken.push('safe burnt past the climb');
          if (row.mode === 'tight') {
            if (row.damage < fast.own.damage) broken.push('tight lost the plan');
            if (row.mercLost > planBurn) broken.push('tight burnt past the plan');
          }
          report.add(
            `| ${stop.pick} | ${LABEL[row.mode]} | ${n(row.damage)} | ${
              gain === 0 ? '—' : `${gain > 0 ? '+' : ''}${gain.toFixed(2)} %`
            } | ${n(row.silver)} | ${n(row.gold)} | ${n(row.mercLost)} | ${n(row.space)} | ${n(
              row.scored,
            )} |`,
          );
        }

        /**
         * 4. **What a press lands on, and when the table may not be read at all** (S-149). The control in the
         * battle summary takes the row of the stop and the position on screen (`pricedRaise`) instead of
         * running the search again, and the guard that makes a row *this* march's answer is what this asserts
         * on the real corpus: the stop's own march is read, and a march with one troop type lowered by a single
         * unit — what a March edit leaves on screen — is refused, on every stop of every army.
         */
        for (const mode of ['most', 'v2', 'tight'] as const) {
          const its = fast.rows.find((one) => one.mode === mode) as PositionTrade;
          const linked: RaiseModes = { authority: mode, dominance: mode };
          expect(
            pricedRaise(base, planCounts, fast, linked),
            `${stop.pick} · ${mode}: what a press lands on`,
          ).toStrictEqual(its.counts);
          pressable += 1;
          const troop = base.stacks.find((stack) => stack.pool === 'leadership');
          if (troop !== undefined) {
            const edited = applyCounts(request, base, {
              ...planCounts,
              [troop.unitId]: troop.count - 1,
            }).result;
            expect(
              pricedRaise(edited, planCounts, fast, linked),
              `${stop.pick} · ${mode}: a re-sized march was handed the table's answer`,
            ).toBeNull();
            refused += 1;
          }
        }
        // The two questions no row answers: a control whose two blocks stand on different segments, and `As is`.
        expect(pricedRaise(base, planCounts, fast, { authority: 'most', dominance: 'v2' })).toBeNull();
        expect(pricedRaise(base, planCounts, fast, { authority: 'off', dominance: 'off' })).toBeNull();
        mixed += 1;
      }
      if (plan.alternatives.length > 1) {
        bars.kernel.push(barKernel);
        bars.stops.push(plan.alternatives.length);
      }
      report.add('');
      if (plan.alternatives.length > 1) {
        report.add(
          `**The whole bar, priced ahead**: ${barKernel.toFixed(0)} ms on the kernel, over its ${String(
            plan.alternatives.length,
          )} stops — one job a stop, which is what makes a press on the slide another table rather than another \
wait.`,
        );
      }
      report.add('');
    }

    report.h('What it costs');
    report.add('');
    report.add(
      [
        `**${String(stops)} stops, ${String(readings)} position-readings, ${String(refusals)} armies the plan`,
        'refuses.** One march, all five positions, priced end to end — the bounds, the box search and the five',
        'replays the trade figures are read off:',
      ].join(' '),
    );
    report.add('');
    report.add('| path | median ms a march | worst ms a march |');
    report.add('|---|---|---|');
    report.add(
      `| the kernel | ${median(times.kernel).toFixed(1)} | ${Math.max(...times.kernel, 0).toFixed(0)} |`,
    );
    report.add('');
    report.add(
      [
        `A whole **bar** — every stop of the plan, priced ahead so a press on the slide is another table rather`,
        `than another wait — is **${median(bars.kernel).toFixed(0)} ms** median and`,
        `**${Math.max(...bars.kernel, 0).toFixed(0)} ms** at its worst on the kernel, over`,
        `bars of ${String(Math.min(...bars.stops))} to ${String(Math.max(...bars.stops))} stops.`,
      ].join(' '),
    );
    report.add('');
    report.add(
      [
        `Over the **three exhaustive positions** — the two unit answers search nothing — the box comes to`,
        `median ${n(median(spaces))} vectors a position and ${n(Math.max(...spaces, 0))} at its widest, and a`,
        `position scores median ${n(median(scoreCounts))} vectors before it answers.`,
      ].join(' '),
    );
    report.add('');

    report.h('What each position offers over the plan’s own march');
    report.add('');
    report.add(
      '| position | stops it moved a count | damage gained | damage lost | median gain | best gain |',
    );
    report.add('|---|---|---|---|---|---|');
    for (const [mode, list] of gained) {
      report.add(
        `| ${LABEL[mode as PositionTrade['mode']]} | ${String(moved.get(mode) ?? 0)} | ${String(
          list.length,
        )} | ${String(lost.get(mode) ?? 0)} | ${median(list).toFixed(2)} % | ${Math.max(...list).toFixed(
          2,
        )} % |`,
      );
    }
    report.add('');
    report.add(
      [
        'The counts are the same five the control in the battle summary offers, so a row here is what a press',
        'of that segment would put on screen — and the block under the plan draws exactly these figures, from',
        'exactly these calls (`PositionTrade.tsx`).',
      ].join(' '),
    );
    report.add('');

    report.h('What a press lands on (S-149)');
    report.add('');
    report.add(
      [
        `**${n(pressable)} of ${n(pressable)} readings** — three positions on every one of the ${n(stops)}`,
        'stops — take the row the bar printed, count for count, and the counts they land on are the ones the',
        'March’s retired TypeScript produced for the same stop and the same position, which is what the golden',
        'above asserts of every row. A march the plan did not size is refused the table on every one of those',
        `readings (${n(refused)}), so a March edit cannot be handed a raise priced for the march before it, and`,
        `so are the two questions no row answers — a mixed control and \`As is\` (${n(mixed)} stops).`,
      ].join(' '),
    );
    report.add('');
    report.add(
      [
        'What that removes is the search a press used to run: `Best v2`, `Safe` and `Tight` are the three',
        'positions whose answer is a walk of the box, measured at **2.7 ms median and 51 s at its worst** on the',
        'stops where a position moves a count at all (`out/182-v2-cost.md`) — the wait the row replaces, and',
        'the reason the block is priced once per bar rather than once per press.',
      ].join(' '),
    );
    report.add('');
    report.save();
    writeFileSync(new URL('./out/184-timings.json', import.meta.url), JSON.stringify({ times, spaces }));

    expect(broken, broken.join('\n')).toEqual([]);
  }, 3_600_000);
});
