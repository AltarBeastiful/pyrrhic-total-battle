/**
 * **The slots-only point is the whole-roster point** (W16 E2a, `raisePointSlots` in `kernel/assembly/index.ts`).
 *
 * The raise search writes only the slots of a vector and adds only their terms to sums the held stacks laid
 * down once a `raise()` (`raisePrime`); the whole-roster point it replaced (`raisePointWhole`) is kept as the
 * path a box it cannot prove exact takes, and as the reference here:
 *
 *  - **the differential**: on every benchmark army, from its sizer's own march and seeded marches, after each
 *    of the three exhaustive positions, at least 10^6 random vectors of the box scored both ways with the memo
 *    out of both — the verdict (`Object.is`, bit for bit, the refusals included) and the memo index each
 *    would have read, the slots-only one carried from sample to sample as the search carries it (`raiseSet`);
 *  - **the guard**: a mercenary cost of x.5 (a custom cost is user input) sends the box down the whole-roster
 *    path, and the answer is still the March's own TypeScript one; and on integer costs, an instance forced
 *    down the whole-roster path answers every position exactly as the slots-only one, `scored` included.
 */
/// <reference types="node" />
import { afterEach, describe, expect, it } from 'vitest';

import { mulberry32 } from '@/engine';
import { setRaiseKernel } from '@/engine/fast';
import { marchResult } from '@/engine/plan';
import { sizeStacks } from '@/engine/stacker';
import type { StackRequest, StackResult } from '@/engine/types';
import { createRaiseKernel, createRaiseKernelProbe } from '@/kernel/raise';
import { liftedCounts, raiseCode } from '@/ui/sections/march/positions';
import { countsOf } from '@/ui/sections/march/raise';
import type { RaiseMode } from '@/ui/sections/march/raise';

import { criteriaScenarios } from '../engine/plan-scenarios';

import { loadKernelModule } from './load';

const EXHAUSTIVE: readonly RaiseMode[] = ['v2', 'safe', 'tight'];
const SAMPLES = 1_000_000;
const SEEDED = 3;

afterEach(() => setRaiseKernel(null));

const modesOf = (mode: RaiseMode) => ({ authority: raiseCode(mode), dominance: raiseCode(mode) });

/** The sizer's own march and a few seeded ones inside the housing. */
function basesOf(request: StackRequest): StackResult[] {
  const own = sizeStacks(request);
  const random = mulberry32(0xe2a);
  const out: StackResult[] = [own];
  while (out.length < 1 + SEEDED) {
    const counts: Record<string, number> = { ...countsOf(own) };
    for (const unit of request.units) {
      if (unit.pool === 'leadership' || random() < 0.4) continue;
      const room = request.housing[unit.pool] / Math.max(1, unit.cost) / Math.max(2, request.units.length);
      const cap = Math.min(request.caps[unit.id] ?? Number.MAX_SAFE_INTEGER, Math.max(1, Math.floor(room)));
      const count = Math.floor(random() * (cap + 1));
      if (count > 0) counts[unit.id] = count;
    }
    out.push(marchResult(request, counts).result);
  }
  return out;
}

describe('the slots-only point', () => {
  it('scores every random box vector exactly as the whole-roster point', () => {
    const kernel = createRaiseKernelProbe(loadKernelModule());
    const marches = criteriaScenarios().flatMap((scenario) =>
      basesOf(scenario.request).map((base) => ({ label: scenario.label, request: scenario.request, base })),
    );
    // First pass: which (march, position) pairs have a box the slots-only point takes.
    const boxes: { label: string; request: StackRequest; base: StackResult; mode: RaiseMode }[] = [];
    for (const march of marches) {
      for (const mode of EXHAUSTIVE) {
        kernel.position({ request: march.request, base: march.base, modes: modesOf(mode) });
        if (kernel.probe(march.request, march.base, 0, 0) === 0) boxes.push({ ...march, mode });
      }
    }
    expect(boxes.length).toBeGreaterThan(20);
    const each = Math.ceil(SAMPLES / boxes.length);
    let sampled = 0;
    for (const [index, box] of boxes.entries()) {
      kernel.position({ request: box.request, base: box.base, modes: modesOf(box.mode) });
      const differ = kernel.probe(box.request, box.base, each, 0x9e3779b9 + index);
      expect(differ, `${box.label} / ${box.mode}`).toBe(0);
      sampled += each;
    }
    expect(sampled).toBeGreaterThanOrEqual(SAMPLES);
  }, 600_000);

  it('answers every position exactly as an instance forced down the whole-roster path', () => {
    const module = loadKernelModule();
    let boxes = 0;
    for (const scenario of criteriaScenarios()) {
      for (const base of basesOf(scenario.request).slice(0, 2)) {
        const slots = createRaiseKernelProbe(module);
        const whole = createRaiseKernelProbe(module);
        // Bind the forced instance with a position that walks nothing, then force it.
        whole.position({ request: scenario.request, base, modes: modesOf('off') });
        whole.forceWhole(scenario.request, base, true);
        for (const mode of EXHAUSTIVE) {
          const fast = slots.position({ request: scenario.request, base, modes: modesOf(mode) });
          const reference = whole.position({ request: scenario.request, base, modes: modesOf(mode) });
          expect(whole.fastPath(scenario.request, base)).toBe(false);
          expect(fast, `${scenario.label} / ${mode}`).toStrictEqual(reference);
          if (fast?.how) boxes += 1;
        }
      }
    }
    expect(boxes).toBeGreaterThan(20);
  }, 600_000);

  it('sends a box with a fractional mercenary cost down the whole-roster path, to the same answer', () => {
    const kernel = createRaiseKernelProbe(loadKernelModule());
    let checked = 0;
    for (const scenario of criteriaScenarios()) {
      const base = sizeStacks(scenario.request);
      const hired = base.stacks.find((stack) => stack.pool === 'authority');
      if (hired === undefined) continue;
      // The same army with that mercenary at half a unit more, over the same base march.
      const request: StackRequest = {
        ...scenario.request,
        units: scenario.request.units.map((unit) =>
          unit.id === hired.unitId ? { ...unit, cost: unit.cost + 0.5 } : unit,
        ),
      };
      const march = marchResult(request, countsOf(base)).result;
      for (const mode of EXHAUSTIVE) {
        const fast = kernel.position({ request, base: march, modes: modesOf(mode) });
        if (!fast?.how) continue;
        expect(kernel.fastPath(request, march), `${scenario.label} / ${mode}`).toBe(false);
        const modes = { authority: mode, dominance: mode } as const;
        setRaiseKernel(null);
        const reference = liftedCounts(request, march, modes);
        setRaiseKernel(createRaiseKernel(loadKernelModule()));
        const door = liftedCounts(request, march, modes);
        setRaiseKernel(null);
        const here = countsOf(march);
        const at = (counts: Record<string, number> | undefined) =>
          request.units.map((unit) => ({ ...here, ...counts })[unit.id] ?? 0);
        expect(at(door?.counts), `${scenario.label} / ${mode}`).toStrictEqual(at(reference?.counts));
        expect([door?.how, door?.space, door?.scored]).toStrictEqual([
          reference?.how,
          reference?.space,
          reference?.scored,
        ]);
        checked += 1;
      }
      // And the integer army takes the slots-only point.
      kernel.position({ request: scenario.request, base, modes: modesOf('v2') });
      if (kernel.probe(scenario.request, base, 0, 0) === 0)
        expect(kernel.fastPath(scenario.request, base)).toBe(true);
    }
    expect(checked).toBeGreaterThan(0);
  }, 600_000);
});
