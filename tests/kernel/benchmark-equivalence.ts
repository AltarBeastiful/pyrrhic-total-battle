/**
 * **The benchmark with the kernel is the benchmark without it** — the differential half of "both paths in
 * `pnpm test`" (2026-09-24; the owner: no drift between TS and AS, checked automatically).
 *
 * The `kernel` vitest project runs `plan-benchmark.test.ts` with the kernel set, but there it is held only to
 * the pins, which are floors: a kernel that drifted *upwards*, or by less than a pin's slack, would pass. This
 * holds the two paths to each other instead. Every benchmark army is measured twice **in one process**, by the
 * benchmark's own code (`measure` + `figuresOf`, `tests/engine/plan-measure.ts`) — once with no kernel set,
 * once with it — and the two must be equal on:
 *
 *  - every figure `benchmark-run.json` records for the army, except the clock (`TIMING_FIELDS`);
 *  - every row **unrounded** (the payload rounds damage to the unit; a one-ulp drift must not hide there);
 *  - the plan itself, less `retype.ms` (as `plan-equivalence.test.ts` strips it).
 *
 * Both measurements run **unbudgeted** (`UNBUDGETED`), so no deadline makes an answer depend on how loaded the
 * machine is — `pnpm test` runs this beside the benchmark on both paths. No army on the table is budget-bound
 * (S-124), so these are the answers the benchmark itself measures.
 *
 * Not a copy of `plan-equivalence.test.ts`: that one plans four input variants with no sizer rows; this one is
 * the benchmark's whole table — both sizers, every Generate objective (`searchPriority` → `sizeStacks`, the
 * kernel's sizer), the sizer switches and the pricing — on the benchmark's own plan input. Split over two
 * files (`.common` and `.owner`) only so vitest runs the halves in parallel.
 */
/// <reference types="node" />
import { afterEach, describe, expect, it } from 'vitest';

import { setKernel } from '@/engine/fast';
import { createPlanKernel } from '@/kernel/plan';

import type { Scenario } from '../engine/plan-scenarios';
import { TIMING_FIELDS, UNBUDGETED, figuresOf, measure } from '../engine/plan-measure';

import { loadKernelModule } from './load';

/** Remove the wall-clock fields (`retype.ms`) wherever they sit — `plan-equivalence.test.ts`'s rule. */
function stripClock(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripClock);
  if (value === null || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    if (key === 'retype' && inner !== null && typeof inner === 'object') {
      const { ms: _ms, ...rest } = inner as Record<string, unknown>;
      out[key] = stripClock(rest);
    } else out[key] = stripClock(inner);
  }
  return out;
}

/** One army measured on the path currently set, less everything that reads a clock. */
function measured(scenario: Scenario): unknown {
  const one = measure(scenario, UNBUDGETED);
  const figures: Record<string, unknown> = { ...figuresOf(scenario.label, one) };
  for (const field of TIMING_FIELDS) delete figures[field];
  return {
    figures,
    rows: one.rows.map((row) => ({ ...row })),
    plan: stripClock(one.plan),
  };
}

/** Registers one test per army: measured on TypeScript, then with the kernel, and deep-equal. */
export function benchmarkEquivalence(title: string, scenarios: Scenario[]): void {
  const kernel = createPlanKernel(loadKernelModule());
  afterEach(() => setKernel(null));
  describe(title, () => {
    it.each(scenarios.map((s) => [s.label, s] as const))(
      '%s: the kernel’s benchmark figures are the TypeScript engine’s',
      (_label, scenario) => {
        setKernel(null);
        const reference = measured(scenario);
        setKernel(kernel);
        const fast = measured(scenario);
        setKernel(null);
        expect(fast).toStrictEqual(reference);
      },
      900_000,
    );
  });
}
