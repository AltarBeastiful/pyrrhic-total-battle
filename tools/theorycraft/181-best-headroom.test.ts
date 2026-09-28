/**
 * 181 — **what `Best` leaves on the table** (owner, 2026-09-29: *"is there still room for improvement for the
 * best selector? are we trying every possible combination in the space we have (max dominance/authority and
 * merc stock?)"*).
 *
 * **No, we are not enumerating the space, and this measures what that costs.** The space a raise can move in
 * is every count vector between the plan's own counts and `min(shelter ceiling, owned stock)` per hired type,
 * under the authority or dominance the housing pays — for the armies here that is between a few hundred and a
 * few hundred million vectors. `climbedCounts` walks **one stack at a time** (a coordinate climb), samples
 * each stack's range at 16 points plus a step-1 refinement around the best, and sweeps at most three times: a
 * few hundred replays, not an enumeration.
 *
 * So the question this answers is a **gap**, per stop, against four stronger readings of the same space:
 *
 *   1. **The interaction gap** — what a **pairwise** neighbourhood finds that one-stack-at-a-time cannot. Two
 *      stacks can only be improved together (raising one costs the other a round of strikes, and the pair can
 *      still come out ahead) and a coordinate climb cannot see that by construction.
 *   2. **The local-optimum gap** — what a **random restart** finds: whether the plan's own counts park the
 *      climb in a basin with something better outside it.
 *   3. **The sampling gap** — what an **exhaustive** walk finds, on the stops small enough to enumerate,
 *      which is the only place the true optimum is knowable at all.
 *   4. **What the *promise* costs** — `Best` never lowers a count below the plan's own, because it is a raise.
 *      The last reading lets a climb go **down** to zero inside the same ceiling and housing: not a raise any
 *      more, but the question "would fewer units ever be the better march", priced rather than assumed.
 *
 * Everything is the app's own arithmetic: the raise is `raisedCounts`, and every reading is a replay of the
 * battle (`applyCounts`) scored on the march's **worst opening**, the figure the plan is ranked on.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/181-best-headroom.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import type { StackRequest, StackResult } from '@/engine/types';
import { applyCounts } from '@/ui/sections/march/manual';
import { raisedCounts, shelterCeiling, troopFloor } from '@/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

const BEST = { authority: 'best', dominance: 'best' } as const;

/** How much work each stronger reading is allowed on one stop — the experiment's own budget, not the app's. */
const PAIR_BUDGET = 30_000;
const EXACT_BUDGET = 200_000;
const RESTARTS = 12;

/**
 * **A deterministic generator for the restarts.** An unseeded `Math.random()` made the whole column a coin
 * flip: a second run of the same file turned "13 of 45, +3.88 %" into "14 of 45, +3.36 %" and moved one stop
 * from a gap to none. A benchmark that changes its answer between two runs of the same code measures the
 * dice, not the algorithm.
 */
function randomFrom(seed: number): () => number {
  let state = seed % 4_294_967_296;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

const random = randomFrom(20_260_929);

/** A stack the raise may move, with the range the game allows it to move in. */
interface Slot {
  unitId: string;
  pool: 'authority' | 'dominance';
  cost: number;
  /** The plan's own count: where a raise starts, and the floor of the space. */
  from: number;
  /** `min(shelter ceiling, owned stock)`: the top of the space. */
  to: number;
}

function slotsOf(request: StackRequest, base: StackResult, floor: number): Slot[] {
  const out: Slot[] = [];
  for (const stack of base.stacks) {
    if (stack.pool === 'leadership' || stack.count <= 0) continue;
    const cap = request.caps[stack.unitId] ?? Number.MAX_SAFE_INTEGER;
    out.push({
      unitId: stack.unitId,
      pool: stack.pool,
      cost: request.units.find((unit) => unit.id === stack.unitId)?.cost ?? 0,
      from: stack.count,
      to: Math.min(shelterCeiling(floor, stack.hpPerUnit), cap),
    });
  }
  return out;
}

/** A scorer for one stop: a move record in, the march's worst opening out, `-Infinity` when it does not fit. */
function scorerOf(request: StackRequest, base: StackResult, slots: readonly Slot[]) {
  const counts: Record<string, number> = {};
  for (const stack of base.stacks) counts[stack.unitId] = stack.count;
  const capacity = { authority: request.housing.authority, dominance: request.housing.dominance };
  return (moves: Record<string, number>): number => {
    const used = { authority: 0, dominance: 0 };
    const candidate = { ...counts, ...moves };
    for (const slot of slots) used[slot.pool] += (candidate[slot.unitId] ?? 0) * slot.cost;
    if (used.authority > capacity.authority || used.dominance > capacity.dominance) {
      return Number.NEGATIVE_INFINITY;
    }
    return applyCounts(request, base, candidate).summary.minDamage;
  };
}

/** One-stack coordinate ascent from a chosen start — the app's own shape, generalised so it can be restarted. */
function climbFrom(
  slots: readonly Slot[],
  score: (moves: Record<string, number>) => number,
  start: Record<string, number>,
  sweeps: number,
): Record<string, number> {
  let moves = { ...start };
  let best = score(moves);
  for (let pass = 0; pass < sweeps; pass += 1) {
    let improved = false;
    for (const slot of slots) {
      let winner = moves[slot.unitId] ?? slot.from;
      let winnerScore = best;
      for (let count = slot.from; count <= slot.to; count += 1) {
        const value = score({ ...moves, [slot.unitId]: count });
        if (value > winnerScore) {
          winner = count;
          winnerScore = value;
        }
      }
      if (winnerScore > best) {
        moves = { ...moves, [slot.unitId]: winner };
        best = winnerScore;
        improved = true;
      }
    }
    if (!improved) break;
  }
  return moves;
}

/** The cheapest neighbourhood that can see an interaction: **every pair, exhaustively**, one pair at a time. */
function pairwiseClimb(
  slots: readonly Slot[],
  score: (moves: Record<string, number>) => number,
  start: Record<string, number>,
): Record<string, number> {
  let moves = { ...start };
  let best = score(moves);
  for (let pass = 0; pass < 3; pass += 1) {
    let improved = false;
    for (let i = 0; i < slots.length; i += 1) {
      for (let j = i + 1; j < slots.length; j += 1) {
        const one = slots[i] as Slot;
        const other = slots[j] as Slot;
        let winner = moves;
        let winnerScore = best;
        for (let a = one.from; a <= one.to; a += 1) {
          for (let b = other.from; b <= other.to; b += 1) {
            const value = score({ ...winner, [one.unitId]: a, [other.unitId]: b });
            if (value > winnerScore) {
              winner = { ...winner, [one.unitId]: a, [other.unitId]: b };
              winnerScore = value;
            }
          }
        }
        if (winnerScore > best) {
          moves = winner;
          best = winnerScore;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return moves;
}

/** What one reading cost on one stop, in milliseconds of wall clock. */
interface Cost {
  app: number;
  one: number;
  pair: number | null;
  restart: number;
  exact: number | null;
  lower: number;
}

interface Row {
  army: string;
  stop: string;
  space: number;
  app: number;
  one: number;
  pair: number | null;
  restart: number;
  exact: number | null;
  lower: number;
  cost: Cost;
}

const gap = (from: number, to: number): number => (from === 0 ? 0 : ((to - from) / from) * 100);

/** `+1.2 %` when a reading is above the app's answer, `—` when it is the same to the unit. */
const better = (from: number, to: number): string => (to > from ? `+${gap(from, to).toFixed(2)} %` : '—');

/** Wall clock around a piece of work, which is what a budget is spent in. */
function timed<T>(work: () => T): { value: T; ms: number } {
  const started = performance.now();
  const value = work();
  return { value, ms: performance.now() - started };
}

/** The middle of a set of timings — **the median**, which is what "what it costs" means. */
function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

describe.skipIf(!process.env.THEORY)('what Best leaves on the table', () => {
  it('prices the interaction, the restarts, the enumeration and the raise-only rule', () => {
    const report = new Report('181-best-headroom');
    report.add(
      [
        '`climbedCounts` is a **coordinate climb**: one stack at a time, 16 samples a stack plus a step-1',
        'refinement, at most three sweeps. The space is every count vector between the plan’s own counts and',
        '`min(shelter ceiling, stock)` per type, under the housing — and this measures the gap to four',
        'stronger readings of that same space, on every stop of every benchmark army where a raise can move a',
        'count at all.',
      ].join(' '),
    );

    const rows: Row[] = [];
    for (const scenario of criteriaScenarios()) {
      let plan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        continue;
      }

      for (const stop of plan.alternatives) {
        const base = planMarch(scenario.request, stop.counts).result;
        const floor = troopFloor(base);
        if (floor === null) continue;
        const slots = slotsOf(scenario.request, base, floor).filter((slot) => slot.to > slot.from);
        if (slots.length === 0) continue;
        const score = scorerOf(scenario.request, base, slots);

        const appRun = timed(() => raisedCounts(scenario.request, base, BEST) ?? {});
        const app = appRun.value;
        const appDamage = score(app);

        // **The sampling gap alone**: the app's own neighbourhood and sweep count, but every count walked
        // instead of 16 samples a stack. This is the reading that tells "we are sampling" from "we are
        // climbing one stack at a time" — without it the two are measured together.
        const oneRun = timed(() => score(climbFrom(slots, score, app, 3)));

        // **The interaction**: pairs, exhaustively, when the pairs fit the budget.
        let pairCost = 0;
        for (let i = 0; i < slots.length; i += 1) {
          for (let j = i + 1; j < slots.length; j += 1) {
            const one = slots[i] as Slot;
            const other = slots[j] as Slot;
            pairCost += (one.to - one.from + 1) * (other.to - other.from + 1);
          }
        }
        const pairRun = pairCost <= PAIR_BUDGET ? timed(() => score(pairwiseClimb(slots, score, app))) : null;

        // **The local optima**: the same climb from random starts inside the space (a raise still).
        const restartRun = timed(() => {
          let restart = appDamage;
          for (let attempt = 0; attempt < RESTARTS; attempt += 1) {
            const seeded: Record<string, number> = {};
            for (const slot of slots) {
              const span = slot.to - slot.from;
              seeded[slot.unitId] = slot.from + (span === 0 ? 0 : Math.floor(random() * (span + 1)));
            }
            restart = Math.max(restart, score(climbFrom(slots, score, seeded, 4)));
          }
          return restart;
        });

        // **The enumeration**, where the space is small enough to walk every vector.
        const space = slots.reduce((product, slot) => product * (slot.to - slot.from + 1), 1);
        const exactRun =
          space <= EXACT_BUDGET
            ? timed(() => {
                let found = Number.NEGATIVE_INFINITY;
                const walk = (index: number, moves: Record<string, number>): void => {
                  if (index === slots.length) {
                    const value = score(moves);
                    if (value > found) found = value;
                    return;
                  }
                  const slot = slots[index] as Slot;
                  for (let count = slot.from; count <= slot.to; count += 1) {
                    walk(index + 1, { ...moves, [slot.unitId]: count });
                  }
                };
                walk(0, app);
                return found;
              })
            : null;

        // **The promise**: a climb allowed down to zero inside the same ceiling and housing.
        const open = slots.map((slot) => ({ ...slot, from: 0 }));
        const lowerRun = timed(() => score(climbFrom(open, score, app, 4)));

        rows.push({
          army: scenario.label,
          stop: stop.pick,
          space,
          app: appDamage,
          one: oneRun.value,
          pair: pairRun?.value ?? null,
          restart: restartRun.value,
          exact: exactRun?.value ?? null,
          lower: lowerRun.value,
          cost: {
            app: appRun.ms,
            one: oneRun.ms,
            pair: pairRun?.ms ?? null,
            restart: restartRun.ms,
            exact: exactRun?.ms ?? null,
            lower: lowerRun.ms,
          },
        });
      }
    }

    report.h(`${String(rows.length)} stops where a raise can move a count`);
    report.add('');
    report.add(
      '| army · stop | space | app’s answer | one stack, exhaustive | pairwise | restarts | exhaustive | lowered |',
    );
    report.add('|---|---|---|---|---|---|---|---|');
    for (const row of rows) {
      report.add(
        `| ${row.army} · ${row.stop} | ${n(row.space)} | ${n(row.app)} | ${better(row.app, row.one)} | ${
          row.pair === null ? 'over budget' : better(row.app, row.pair)
        } | ${better(row.app, row.restart)} | ${
          row.exact === null ? 'over budget' : better(row.app, row.exact)
        } | ${better(row.app, row.lower)} |`,
      );
    }

    const worstOf = (pick: (row: Row) => number | null): { name: string; gap: number } | null => {
      let worst: { name: string; gap: number } | null = null;
      for (const row of rows) {
        const value = pick(row);
        if (value === null) continue;
        const percent = gap(row.app, value);
        if (worst === null || percent > worst.gap)
          worst = { name: `${row.army} · ${row.stop}`, gap: percent };
      }
      return worst;
    };
    const wins = (pick: (row: Row) => number | null): number =>
      rows.filter((row) => {
        const value = pick(row);
        return value !== null && value > row.app;
      }).length;
    const measured = (pick: (row: Row) => number | null): number =>
      rows.filter((row) => pick(row) !== null).length;
    const positives = (pick: (row: Row) => number | null): number[] =>
      rows
        .map((row) => {
          const value = pick(row);
          return value === null ? 0 : gap(row.app, value);
        })
        .filter((percent) => percent > 0.05);

    report.h('What the numbers say');
    report.add('');
    report.add(
      `- **The sampling gap alone** (the app's own neighbourhood, every count walked instead of 16 samples): ` +
        `${String(wins((row) => row.one))} of ${String(rows.length)} stops beat the app's answer, worst ${format(worstOf((row) => row.one))}, ` +
        `median of those ${median(positives((row) => row.one)).toFixed(2)} %.`,
    );
    report.add(
      `- **The interaction** (pairs, exhaustively): ${String(wins((row) => row.pair))} of the ${String(
        measured((row) => row.pair),
      )} stops measured beat it, worst ${format(worstOf((row) => row.pair))}, median of those ${median(
        positives((row) => row.pair),
      ).toFixed(2)} %.`,
    );
    report.add(
      `- **The local optima** (${String(RESTARTS)} seeded restarts): ${String(
        wins((row) => row.restart),
      )} of ${String(rows.length)} stops found a better basin, worst ${format(worstOf((row) => row.restart))}, median of those ${median(
        positives((row) => row.restart),
      ).toFixed(2)} %.`,
    );
    report.add(
      `- **The enumeration** (the control): ${String(wins((row) => row.exact))} of the ${String(
        measured((row) => row.exact),
      )} stops small enough to walk whole beat it, worst ${format(worstOf((row) => row.exact))}, median of those ${median(
        positives((row) => row.exact),
      ).toFixed(2)} %.`,
    );
    report.add(
      `- **The promise** (the climb allowed down to zero): helps on ${String(
        wins((row) => row.lower),
      )} of ${String(rows.length)} stops, worst ${format(worstOf((row) => row.lower))}, median of those ${median(
        positives((row) => row.lower),
      ).toFixed(2)} %.`,
    );
    const cost = (pick: (row: Row) => number | null, label: string): string => {
      const values = rows.map(pick).filter((value): value is number => value !== null);
      if (values.length === 0) return `${label}: not measured`;
      return `${label}: ${median(values).toFixed(1)} ms median, ${Math.max(...values).toFixed(1)} ms worst`;
    };
    report.add('');
    report.add(
      "**What each reading costs on one stop** (the app's rule of thumb is a few tens of milliseconds):",
    );
    report.add('');
    for (const line of [
      cost((row) => row.cost.app, 'the app’s own `Best`'),
      cost((row) => row.cost.one, 'one stack, exhaustive'),
      cost((row) => row.cost.pair, 'pairwise'),
      cost((row) => row.cost.restart, 'restarts'),
      cost((row) => row.cost.exact, 'the enumeration'),
      cost((row) => row.cost.lower, 'the lowered climb'),
    ]) {
      report.add(`- ${line}`);
    }
    report.add('');
    report.save();
  }, 1_800_000);
});

/** A worst case as a sentence: the stop it was found on and what it was worth. */
function format(worst: { name: string; gap: number } | null): string {
  if (worst === null) return 'nothing found';
  return worst.gap <= 0 ? 'nothing found' : `${worst.gap.toFixed(2)} % on ${worst.name}`;
}
