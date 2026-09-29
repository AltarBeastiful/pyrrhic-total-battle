/**
 * **The raise positions on the kernel are the raise positions without it** (S-147; `src/kernel/raise.ts`,
 * `src/ui/sections/march/positions.ts`).
 *
 * `liftedCounts` asks `raiseKernel()` first and falls back to the March's own `raisedCounts` + `exactRaise`,
 * so the two paths are one function: this file sets the kernel, asks for a position, asks again with it
 * cleared, and holds the two answers to each other — **every count, and how the search found it** (`how`,
 * `space`), which is the whole of what the door returns.
 *
 * On every benchmark army, from three kinds of march:
 *
 *  - the army sized by its own sizer (`sizeStacks`), a real march with troops and hired stacks;
 *  - **seeded marches inside the housing**, with total-HP ties and hired stacks above the troops — the shapes
 *    that make the raise's own tie-break (`T.order`, the base march's stack order) decide an answer;
 *  - a march a position already moved, which is what a caller pricing the positions one after another hands
 *    over.
 *
 * And a direct test of the tie-break: a base whose own stack order is the **reverse** of the kill-order
 * ranking tells the two rules apart, and the answer must follow `applyCounts` — the replay the March draws a
 * raise with (`docs/plans/best-v2.md` §5).
 */
/// <reference types="node" />
import { afterEach, describe, expect, it } from 'vitest';

import { mulberry32 } from '@/engine';
import { setRaiseKernel } from '@/engine/fast';
import { marchResult } from '@/engine/plan';
import { sizeStacks } from '@/engine/stacker';
import type { Stack, StackRequest, StackResult } from '@/engine/types';
import { createRaiseKernel } from '@/kernel/raise';
import { POSITIONS, liftedCounts } from '@/ui/sections/march/positions';
import { countsOf } from '@/ui/sections/march/raise';
import type { RaiseMode } from '@/ui/sections/march/raise';

import { criteriaScenarios } from '../engine/plan-scenarios';

import { loadKernelModule } from './load';

const kernel = createRaiseKernel(loadKernelModule());
const RANDOM_BASES = 12;

afterEach(() => setRaiseKernel(null));

/** The counts a march really stands at, as a map over every unit the request carries. */
function effective(
  request: StackRequest,
  own: Record<string, number>,
  counts: Record<string, number>,
): Record<string, number> {
  const merged = { ...own, ...counts };
  return Object.fromEntries(request.units.map((unit) => [unit.id, merged[unit.id] ?? 0]));
}

/** One position, asked twice: with the kernel set (`fast`) and without it (`reference`). */
function both(
  request: StackRequest,
  base: StackResult,
  position: RaiseMode,
): { reference: ReturnType<typeof liftedCounts>; fast: ReturnType<typeof liftedCounts> } {
  const modes = { authority: position, dominance: position } as const;
  setRaiseKernel(null);
  const reference = liftedCounts(request, base, modes);
  setRaiseKernel(kernel);
  const fast = liftedCounts(request, base, modes);
  setRaiseKernel(null);
  return { reference, fast };
}

/** Seeded marches within housing, some of them with hired stacks above the troops. */
function randomCounts(
  request: StackRequest,
  seed: number,
  total: number,
  start: Record<string, number>,
): Record<string, number>[] {
  const random = mulberry32(seed);
  const int = (max: number): number => Math.floor(random() * (max + 1));
  const out: Record<string, number>[] = [start];
  while (out.length < total) {
    const counts: Record<string, number> = {};
    for (const unit of request.units) {
      if (random() < 0.35) continue;
      const room = request.housing[unit.pool] / Math.max(1, unit.cost) / Math.max(2, request.units.length);
      const cap = request.caps[unit.id] ?? Math.max(1, Math.floor(room));
      const count = int(Math.min(cap, Math.max(1, Math.floor(room))));
      if (count > 0) counts[unit.id] = count;
    }
    out.push(counts);
  }
  return out;
}

describe('the raise positions with the kernel', () => {
  describe.each(criteriaScenarios().map((scenario) => [scenario.label, scenario.request] as const))(
    'army %s',
    (_label, request) => {
      const own = sizeStacks(request);
      const bases: { name: string; base: StackResult }[] = [
        { name: 'the sizer’s own march', base: own },
        ...randomCounts(request, 0x51771, RANDOM_BASES, countsOf(own)).map((counts, index) => ({
          name: `seeded march ${String(index)}`,
          base: marchResult(request, counts).result,
        })),
      ];

      it.each(POSITIONS.map((position) => [position] as const))(
        'answers %s exactly as the March’s own TypeScript does',
        (position) => {
          for (const { name, base } of bases) {
            const { reference, fast } = both(request, base, position);
            const here = countsOf(base);
            expect(
              effective(request, here, fast?.counts ?? {}),
              `${name}: the counts of ${position}`,
            ).toStrictEqual(effective(request, here, reference?.counts ?? {}));
            expect(fast?.how ?? null, `${name}: how ${position} was found`).toBe(reference?.how ?? null);
            expect(fast?.space ?? 0, `${name}: the box of ${position}`).toBe(reference?.space ?? 0);
            // The two paths scored the same number of vectors, so they took the same route to the answer.
            expect(fast?.scored ?? 0, `${name}: what ${position} cost`).toBe(reference?.scored ?? 0);
          }
        },
        120_000,
      );

      it('prices a raised march as exactly as a generated one', () => {
        // The second pass starts from a march a position already moved, which is the shape a caller pricing
        // the positions one after another hands over.
        const raised = liftedCounts(request, own, { authority: 'v2', dominance: 'v2' });
        const base = raised === null ? own : marchResult(request, raised.counts).result;
        for (const position of POSITIONS) {
          const { reference, fast } = both(request, base, position);
          const here = countsOf(base);
          expect(effective(request, here, fast?.counts ?? {})).toStrictEqual(
            effective(request, here, reference?.counts ?? {}),
          );
        }
      }, 120_000);
    },
  );

  it('scores a candidate by the base march’s own stack order, not by its own rank', () => {
    // **Two stacks of one total HP.** `applyCounts` breaks the tie by the base march's stack order and the
    // kernel's own `battle` breaks it by the kill-order rank, so a base whose order is the *reverse* of the
    // ranking is what tells the two rules apart — and the answer must follow `applyCounts`, which is the
    // replay the March draws a raise with.
    const scenario = criteriaScenarios()[0];
    const request = scenario?.request as StackRequest;
    const sized = sizeStacks(request);
    expect(sized.stacks.filter((stack) => stack.pool !== 'leadership').length).toBeGreaterThan(0);
    const reversed: StackResult = { ...sized, stacks: [...sized.stacks].reverse() as Stack[] };
    for (const position of POSITIONS) {
      const { reference, fast } = both(request, reversed, position);
      const here = countsOf(reversed);
      expect(effective(request, here, fast?.counts ?? {}), position).toStrictEqual(
        effective(request, here, reference?.counts ?? {}),
      );
    }
  }, 120_000);
});
