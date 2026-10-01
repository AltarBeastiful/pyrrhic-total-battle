/**
 * **The raise positions on the kernel answer what the March's own TypeScript once did** (S-147; W16 E3 S5b:
 * `src/kernel/raise.ts`, `src/ui/sections/march/positions.ts`).
 *
 * Until S5b this file asked every position twice — the kernel set, then cleared so `liftedCounts` fell back to
 * `raisedCounts` + `exactRaise` — and held the two answers to each other. The TypeScript search is gone now
 * (the owner, 2026-10-01: *"retire the ts version"*), so its testimony is kept instead: on the commit that
 * retired it, this same corpus was asked of both paths, they agreed on every answer, and the kernel's answers
 * were written to `tests/golden/raise-kernel.json`. The file is now the kernel held to that golden — **every
 * count, how the search found it (`how`, `space`) and what it cost (`scored`)**, which is the whole of what the
 * door returns.
 *
 * On every benchmark army, from four kinds of march:
 *
 *  - the army sized by its own sizer (`sizeStacks`), a real march with troops and hired stacks;
 *  - **seeded marches inside the housing**, with total-HP ties and hired stacks above the troops — the shapes
 *    that make the raise's own tie-break (`T.order`, the base march's stack order) decide an answer;
 *  - a march a position already moved, which is what a caller pricing the positions one after another hands
 *    over;
 *  - the sizer's march with one mercenary at half a unit more of cost — user input the kernel's slots-only
 *    point cannot prove exact, so the box takes the whole-roster path (`tests/kernel/raise-point.test.ts`).
 *
 * And the tie-break on its own: a base whose own stack order is the **reverse** of the kill-order ranking
 * tells the two rules apart, and the answer must follow `applyCounts` — the replay the March draws a raise
 * with (`docs/plans/best-v2.md` §5).
 *
 * `CAPTURE=1 pnpm vitest run tests/kernel/raise-kernel.test.ts` rewrites the golden **from the kernel** — there
 * is no second path left to hold it to, so a capture is a re-base and only the owner registers one
 * (`docs/design-rules.md`, the benchmark rule).
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

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

const CAPTURE = process.env.CAPTURE === '1';
const GOLDEN = fileURLToPath(new URL('../golden/raise-kernel.json', import.meta.url));
const RANDOM_BASES = 12;

/** One position on one march: the counts that **differ** from the march's own, and how they were found. */
interface Answer {
  army: string;
  march: string;
  position: RaiseMode;
  moved: Record<string, number>;
  how: 'walked' | 'searched' | null;
  space: number;
  scored: number;
}

// Set when the file loads, not in a hook: the corpus is asked at collection time, one `it` an army.
setRaiseKernel(createRaiseKernel(loadKernelModule()));
afterAll(() => {
  setRaiseKernel(null);
});

/**
 * The counts a march really stands at, as a map over every unit the request carries, kept only where they
 * differ from the march's own — the kernel answers dense and the TypeScript answered sparse, and this is the
 * shape both read the same (and the one that keeps the golden small).
 */
function moved(request: StackRequest, here: Record<string, number>, counts: Record<string, number>) {
  const merged = { ...here, ...counts };
  const out: Record<string, number> = {};
  for (const unit of [...request.units].sort((a, b) => a.id.localeCompare(b.id))) {
    const count = merged[unit.id] ?? 0;
    if (count !== (here[unit.id] ?? 0)) out[unit.id] = count;
  }
  return out;
}

function answer(
  army: string,
  march: string,
  request: StackRequest,
  base: StackResult,
  position: RaiseMode,
): Answer {
  const lifted = liftedCounts(request, base, { authority: position, dominance: position });
  return {
    army,
    march,
    position,
    moved: moved(request, countsOf(base), lifted?.counts ?? {}),
    how: lifted?.how ?? null,
    space: lifted?.space ?? 0,
    scored: lifted?.scored ?? 0,
  };
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

/** Every march of one army the corpus asks about, by the name its golden entries carry. */
function marchesOf(request: StackRequest): { name: string; request: StackRequest; base: StackResult }[] {
  const own = sizeStacks(request);
  const out = [
    { name: 'the sizer’s own march', request, base: own },
    ...randomCounts(request, 0x51771, RANDOM_BASES, countsOf(own)).map((counts, index) => ({
      name: `seeded march ${String(index)}`,
      request,
      base: marchResult(request, counts).result,
    })),
  ];
  // A march a position already moved: the shape a caller pricing the positions one after another hands over.
  const raised = liftedCounts(request, own, { authority: 'v2', dominance: 'v2' });
  out.push({
    name: 'a raised march',
    request,
    // Over the march's own counts: an answer is a raise of the pools it walked, not a whole march.
    base: raised === null ? own : marchResult(request, { ...countsOf(own), ...raised.counts }).result,
  });
  // The whole-roster path: one mercenary at half a unit more, over the same base march.
  const hired = own.stacks.find((stack) => stack.pool === 'authority');
  if (hired !== undefined) {
    const fractional: StackRequest = {
      ...request,
      units: request.units.map((unit) =>
        unit.id === hired.unitId ? { ...unit, cost: unit.cost + 0.5 } : unit,
      ),
    };
    out.push({
      name: 'a fractional mercenary cost',
      request: fractional,
      base: marchResult(fractional, countsOf(own)).result,
    });
  }
  return out;
}

/** The whole corpus, asked of the kernel in the golden's own order. */
function corpus(): Answer[] {
  const out: Answer[] = [];
  for (const scenario of criteriaScenarios()) {
    for (const { name, request, base } of marchesOf(scenario.request)) {
      for (const position of POSITIONS) out.push(answer(scenario.label, name, request, base, position));
    }
  }
  // The tie-break: the first army's sizer march with its stack order reversed.
  const first = criteriaScenarios()[0];
  if (first !== undefined) {
    const sized = sizeStacks(first.request);
    const reversed: StackResult = { ...sized, stacks: [...sized.stacks].reverse() as Stack[] };
    for (const position of POSITIONS) {
      out.push(
        answer(first.label, 'the sizer’s march, stack order reversed', first.request, reversed, position),
      );
    }
  }
  return out;
}

describe('the raise positions on the kernel', () => {
  if (CAPTURE) {
    it('writes the golden from the kernel', () => {
      writeFileSync(GOLDEN, `${JSON.stringify(corpus(), null, 1)}\n`);
    }, 600_000);
    return;
  }

  const golden = JSON.parse(readFileSync(GOLDEN, 'utf8')) as Answer[];
  const answers = corpus();

  it('asks the same questions the golden answers', () => {
    expect(answers.map(({ army, march, position }) => `${army} · ${march} · ${position}`)).toStrictEqual(
      golden.map(({ army, march, position }) => `${army} · ${march} · ${position}`),
    );
  });

  it.each(criteriaScenarios().map((scenario) => [scenario.label] as const))(
    'answers every position of army %s as the TypeScript once did',
    (label) => {
      const mine = answers.filter((one) => one.army === label);
      const theirs = golden.filter((one) => one.army === label);
      expect(mine.length).toBeGreaterThan(0);
      for (const [index, one] of mine.entries()) {
        expect(one, `${one.march}: ${one.position}`).toStrictEqual(theirs[index]);
      }
    },
  );

  it('takes the whole-roster path and the tie-break the TypeScript did', () => {
    const special = (one: Answer) =>
      one.march === 'a fractional mercenary cost' || one.march.endsWith('stack order reversed');
    const mine = answers.filter(special);
    expect(mine.length).toBeGreaterThan(POSITIONS.length);
    expect(mine).toStrictEqual(golden.filter(special));
    // At least one of them is a real search, or the golden would be holding nothing.
    expect(mine.some((one) => one.how !== null)).toBe(true);
  });
});
