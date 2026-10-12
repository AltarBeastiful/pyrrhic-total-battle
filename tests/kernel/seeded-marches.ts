/**
 * **The seeded marches the raise's tests ask about** (W16 E2a's corpus, moved here 2026-10-12 when a second and
 * a third file needed it).
 *
 * `sizeStacks` answers the army's own march, and it is the one march an exhaustive raise can say **nothing**
 * about: the sizer fills the housing to the last point, so the spare is nothing, so no stack may be raised —
 * the box is empty and the search has no answer to give (`raise()`'s two clamps, investigation 0026). The
 * shapes a raise is *for* are therefore the seeded ones: counts drawn at random inside the housing, with hired
 * stacks above the troops, total-HP ties, and room left for a raise to move something.
 *
 * One definition, three readers — `raise-kernel.test.ts` (whose golden this corpus is), `raise-census.test.ts`
 * and `raise-point.test.ts` — because a second copy of a generator is a second corpus, and the golden would
 * then hold the kernel to a march the other two never asked about.
 */
/// <reference types="node" />
import { mulberry32 } from '@/engine';
import { marchResult } from '@/engine/plan';
import { sizeStacks } from '@/engine/stacker';
import type { StackRequest, StackResult } from '@/engine/types';
import { liftedCounts } from '@/ui/sections/march/positions';
import { countsOf, shelterCeiling, troopFloor } from '@/ui/sections/march/raise';

/** Seeded marches within housing, some of them with hired stacks above the troops. */
export function randomCounts(
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
export function marchesOf(
  request: StackRequest,
): { name: string; request: StackRequest; base: StackResult }[] {
  const own = sizeStacks(request);
  const out = [
    { name: 'the sizer’s own march', request, base: own },
    ...randomCounts(request, 0x51771, 12, countsOf(own)).map((counts, index) => ({
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
  // The whole-roster path: one mercenary at half a unit more. **Over a march with room in it** (2026-10-12):
  // the sizer's own fills the housing, so since the box's two clamps the path would never be taken at all.
  const roomy = roomyBase(request);
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
      base: marchResult(fractional, countsOf(roomy)).result,
    });
  }
  return out;
}

/**
 * **The same seeded marches, as marches alone** — for a caller that has no raise kernel set (`marchesOf`'s
 * "a raised march" asks `liftedCounts` for one) and wants only a base with room in it.
 */
export function seededBases(request: StackRequest, total: number): StackResult[] {
  const own = sizeStacks(request);
  return randomCounts(request, 0x51771, total, countsOf(own)).map(
    (counts) => marchResult(request, counts).result,
  );
}

/**
 * **A march with room in it, and one that is not a coin flip**: the sizer's own, with every hired stack's count
 * brought down to half of what the shelter allows it. The troops are untouched, so the floor and every ceiling
 * are the sizer's own; the halves leave the housing half unspent and put every hired stack under the line it is
 * sheltered by — which is exactly what the sizer's own march does not do, and why the raise has nothing to move
 * on it since the box's two clamps (2026-10-12, investigation 0026).
 *
 * Deterministic on purpose: the corpus that holds the whole-roster path and the tie-break (`raise-kernel.json`)
 * must not depend on which marches a random draw happened to leave room on.
 */
export function roomyBase(request: StackRequest): StackResult {
  const own = sizeStacks(request);
  const floor = troopFloor(own);
  if (floor === null) return own;
  const counts = countsOf(own);
  for (const stack of own.stacks) {
    if (stack.pool === 'leadership' || stack.count <= 0) continue;
    const ceiling = Math.min(
      shelterCeiling(floor, stack.hpPerUnit),
      request.caps[stack.unitId] ?? Number.MAX_SAFE_INTEGER,
    );
    counts[stack.unitId] = Math.max(1, Math.floor(Math.min(stack.count, ceiling) / 2));
  }
  return marchResult(request, counts).result;
}
