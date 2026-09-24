/**
 * **The scorer's ladders on the kernel, each answer `Object.is` to the TypeScript's** (AssemblyScript roadmap,
 * step 4; `ladderShape`, `ladderGrid` and `ladderFinale` in `kernel/assembly/index.ts`, `LadderKernel` in
 * `src/engine/fast.ts`, their use in `makeScorer`).
 *
 * On every benchmark army, under three recovery plans (the bill the kernel prices beside the march), two
 * scorers are built over one context — one asked with no kernel set (the TypeScript, the reference), one with
 * the kernel — and fed the same seeded calls:
 *
 *  - **a vector's whole grid, armed** (`arm`, every depth × growth in `evaluateVector`'s order: `ladderGrid`);
 *  - **single shapes** at random depths (1–10, past the grid's) and scales (the grid's and others:
 *    `ladderShape`), with and without a silver budget;
 *  - with the final march on (`ladderFinale`, cached and budgeted) and off, with housing and without, with the
 *    tier seed's second climb, over vectors the stock sustains, vectors it does not, fractional, negative and
 *    zero counts.
 *
 * Every answer is compared field by field — the rungs' and hired stacks' entries by identity and counts by
 * `Object.is`, the march's and the final march's six figures, the three sums — and the rung orders the two
 * scorers learned, and their logs, must be the same. The kernel's bill (the silver `ratioOf` reads) is held to
 * `recoveryCosts(...).plan` on every shape the kernel answered.
 */
/// <reference types="node" />
import { afterEach, describe, expect, it } from 'vitest';

import { mulberry32 } from '@/engine';
import { enemySquadCount } from '@/engine/battle';
import { setKernel } from '@/engine/fast';
import type { Effective, RungOrderLog, ScoredShape, ShapeContext, ShapeScorer } from '@/engine/plan';
import { DEPTHS, LADDER_GROWTHS, effectiveTable, makeScorer, rankTroops } from '@/engine/plan';
import { recoveryCosts } from '@/engine/recovery';
import type { RecoverySettings, Stack, StackRequest } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';

import { commonScenarios, ownerProfile, ownerScenarios } from '../engine/plan-scenarios';

import { loadKernelModule } from './load';

/** Vectors per scorer pair (half asked as a whole armed grid, half as single shapes). */
const VECTORS = 80;
const SINGLES_PER_VECTOR = 6;

afterEach(() => setKernel(null));

const kernel = createPlanKernel(loadKernelModule());
const profile = ownerProfile();
const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];

type Stacks = { entry: Effective; count: number }[];

function sameStacks(a: Stacks, b: Stacks): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i] as Stacks[number];
    const y = b[i] as Stacks[number];
    if (x.entry !== y.entry || !Object.is(x.count, y.count)) return false;
  }
  return true;
}

const FIGURES = ['damage', 'hiredDamage', 'silver', 'gold', 'mercLost', 'strikes'] as const;
function sameMarch(a: ScoredShape['march'], b: ScoredShape['march']): boolean {
  return FIGURES.every((key) => Object.is(a[key], b[key]));
}

/** Where two scorer answers differ, or `null` when they are the same answer. */
function differs(a: ScoredShape | null, b: ScoredShape | null): string | null {
  if (a === null || b === null) return a === b ? null : `null ${a === null} against ${b === null}`;
  if (!Object.is(a.marches, b.marches) || a.counts !== b.counts) return 'marches or counts';
  if (!sameStacks(a.rungs, b.rungs)) return 'rungs';
  if (!sameStacks(a.mercs, b.mercs)) return 'mercs';
  if (!sameMarch(a.march, b.march)) return 'march';
  if ((a.finale === null) !== (b.finale === null)) return 'finale presence';
  if (a.finale && b.finale) {
    if (!sameStacks(a.finale.rungs, b.finale.rungs)) return 'finale rungs';
    if (!sameStacks(a.finale.mercs, b.finale.mercs)) return 'finale mercs';
    if (!sameMarch(a.finale.march, b.finale.march)) return 'finale march';
  }
  if (!Object.is(a.total, b.total) || !Object.is(a.silver, b.silver) || !Object.is(a.mercLost, b.mercLost)) {
    return 'sums';
  }
  return null;
}

/** `marchRecovery(recovery, rungs, mercs).silver`, rounded as `ratioOf` rounds it — in TypeScript. */
function billSilver(recovery: RecoverySettings, rungs: Stacks, mercs: Stacks): number {
  const fielded = [...rungs, ...mercs].filter((stack) => stack.count > 0);
  return Math.round(
    recoveryCosts(
      fielded.map((stack) => ({ unitId: stack.entry.unit.id, count: stack.count }) as Stack),
      fielded.map((stack) => stack.entry.unit),
      recovery,
    ).plan.silver,
  );
}

/** `planCampaign`'s stock and sustain: an unlimited type holds what its pool houses, and never runs out. */
function stockOf(
  request: StackRequest,
  table: Effective[],
): { stock: Record<string, number>; sustain: Record<string, number> } {
  const stock: Record<string, number> = { ...request.caps };
  const sustain: Record<string, number> = { ...request.caps };
  for (const entry of table) {
    if (entry.pool === 'leadership' || request.caps[entry.id] !== undefined) continue;
    stock[entry.id] = Math.max(0, Math.floor(request.housing[entry.pool] / Math.max(1, entry.cost)));
    sustain[entry.id] = Infinity;
  }
  return { stock, sustain };
}

function recoveryVariants(request: StackRequest): StackRequest[] {
  const withPlan = (plan: RecoverySettings['plan']): StackRequest => ({
    ...request,
    recovery: { ...request.recovery, plan },
  });
  return [
    request,
    withPlan({ mode: 'revive' }),
    withPlan({ mode: 'selective', reviveFamilies: ['guardsmen', 'monsters'] }),
  ];
}

const newLog = (): RungOrderLog => ({
  learned: 0,
  tierWon: 0,
  tierTied: 0,
  tierSame: 0,
  rankingBattles: 0,
  tierBattles: 0,
});

describe('the scorer’s ladders on the kernel', () => {
  it('runs over all 18 benchmark armies where the owner’s export is present', () => {
    if (profile) expect(scenarios.length).toBe(18);
  });

  describe.each(scenarios.map((s, i) => [i, s.label, s.request] as const))(
    'army %i: %s',
    (index, _label, base) => {
      it('answers every ladder shape, grid and final march exactly as the TypeScript scorer', () => {
        const mismatches: string[] = [];
        let shapes = 0;
        let answered = 0;
        let billed = 0;
        recoveryVariants(base).forEach((request, variant) => {
          setKernel(kernel);
          const table = effectiveTable(request);
          const troops = rankTroops(table);
          const mercTypes = table.filter((entry) => entry.pool !== 'leadership');
          const { stock, sustain } = stockOf(request, table);
          [true, false].forEach((withFinale, config) => {
            const random = mulberry32(1_000 * index + 10 * variant + config + 1);
            const context = (log: RungOrderLog): ShapeContext => ({
              troops,
              mercTypes,
              stock,
              sustain,
              leadership: request.housing.leadership,
              housing: withFinale ? request.housing : undefined,
              enemyStacks: enemySquadCount(request.enemy),
              gap: 0.25,
              finale: withFinale,
              tierSeed: !withFinale,
              rungOrderLog: log,
            });
            const tsLog = newLog();
            const kLog = newLog();
            const ts = makeScorer(context(tsLog));
            const fast = makeScorer(context(kLog));
            const ask = (
              scorer: ShapeScorer,
              on: boolean,
              args: Parameters<ShapeScorer>,
            ): ScoredShape | null => {
              setKernel(on ? kernel : null);
              try {
                return scorer(...args);
              } finally {
                setKernel(null);
              }
            };
            const compare = (args: Parameters<ShapeScorer>): void => {
              const reference = ask(ts, false, args);
              const answer = ask(fast, true, args);
              shapes += 1;
              if (answer) answered += 1;
              const why = differs(reference, answer);
              if (why !== null && mismatches.length < 20) {
                mismatches.push(
                  `variant ${variant} config ${config} ${JSON.stringify(args.slice(2))}: ${why}`,
                );
              }
              const billedSilver = (
                answer?.march as {
                  billedSilver?: (r: RecoverySettings, a: object, b: object) => number | undefined;
                }
              )?.billedSilver?.(request.recovery, answer?.rungs ?? [], answer?.mercs ?? []);
              if (answer && billedSilver !== undefined) {
                billed += 1;
                const expected = billSilver(request.recovery, answer.rungs, answer.mercs);
                if (!Object.is(billedSilver, expected) && mismatches.length < 20) {
                  mismatches.push(
                    `variant ${variant} config ${config}: bill ${billedSilver} against ${expected}`,
                  );
                }
              }
            };
            for (let v = 0; v < VECTORS; v += 1) {
              const marches = [1, 1, 2, 3, 4, 5, 0][Math.floor(random() * 7)] as number;
              const counts: Record<string, number> = {};
              for (const entry of mercTypes) {
                const roll = random();
                if (roll < 0.25) continue;
                const held = Number.isFinite(sustain[entry.id] ?? 0)
                  ? (stock[entry.id] ?? 0)
                  : request.housing[entry.pool] / Math.max(1, entry.cost);
                let count = random() * Math.min(held, 3_000) * (roll < 0.9 ? 1 / Math.max(1, marches) : 1.5);
                if (roll > 0.97) count = -count;
                counts[entry.id] = roll < 0.5 ? count : Math.floor(count);
              }
              const armed = v % 2 === 0;
              // A budget on a finale grid prices eighty final marches per shape: kept to single shapes there.
              const budget =
                (!armed || !withFinale) && random() < 0.35 ? 10 ** (5 + 3 * random()) : undefined;
              if (armed) {
                ts.arm?.(marches, counts, budget);
                fast.arm?.(marches, counts, budget);
                for (const depth of DEPTHS) {
                  for (const scale of LADDER_GROWTHS) compare([marches, counts, depth, scale, budget]);
                }
                ts.disarm?.();
                fast.disarm?.();
              } else {
                for (let k = 0; k < SINGLES_PER_VECTOR; k += 1) {
                  const depth = 1 + Math.floor(random() * 10);
                  const scale =
                    random() < 0.6
                      ? (LADDER_GROWTHS[Math.floor(random() * LADDER_GROWTHS.length)] as number)
                      : 0.5 + 6 * random();
                  compare([marches, counts, depth, scale, budget]);
                }
              }
            }
            expect(kLog, `rung-order log, variant ${variant} config ${config}`).toStrictEqual(tsLog);
          });
        });
        process.stderr.write(`army ${index}: ${shapes} shapes, ${answered} answered, ${billed} billed\n`);
        expect(mismatches).toEqual([]);
        expect(shapes).toBeGreaterThan(0);
        // The kernel answered shapes itself (its bill is kept on those), not only handed them back.
        if (answered > 0) expect(billed).toBeGreaterThan(0);
      }, 600_000);
    },
  );
});
