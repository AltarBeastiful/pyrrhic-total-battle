/**
 * **The kernel's `sizePool` stops its binary search at a fixed point, and answers what all 200 steps answer**
 * (AssemblyScript roadmap, step 5; `kernel/assembly/index.ts`, `sizePool`).
 *
 * The engine's search runs 200 halvings whatever happens (`src/engine/stacker.ts`). Once a step leaves both
 * bounds bit for bit where they were, every later step reads the same two numbers and does the same thing, so
 * the kernel stops there. This holds it to the engine's own arithmetic, `Object.is` on every count and on the
 * housing used, over seeded pools that include the numbers a halving can trip on: zero and huge costs, zero
 * and infinite HP, capacities near the top of the doubles, ceilings or none (the extreme pools capped, so the
 * single-unit fill after the search ends).
 *
 * The reference below is the engine's `sizePool` as written (it is not exported), with its `slot.count` writes
 * returned as an array instead.
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { mulberry32 } from '@/engine';
import { RANK_SPREAD } from '@/engine/stacker';
import { createPlanKernel } from '@/kernel/plan';

import { loadKernelModule } from './load';

interface Slot {
  hp: number;
  cost: number;
  cap: number;
  count: number;
}

/** `sizePool` of `src/engine/stacker.ts`, the TypeScript branch: 200 halvings, then the single-unit fill. */
function referencePool(slots: Slot[], capacity: number, ceiling: number | undefined): number[] | 'none' {
  if (slots.length === 0 || capacity <= 0) return 'none';
  const unitsForTarget = (slot: Slot, target: number): number =>
    slot.hp <= 0 || slot.cost <= 0 ? 0 : Math.max(0, Math.min(Math.floor(target / slot.hp), slot.cap));
  const countsAt = (ceilingHp: number): number[] => {
    const delta = RANK_SPREAD * ceilingHp;
    return slots.map((slot, index) => unitsForTarget(slot, ceilingHp - index * delta));
  };
  const usedBy = (counts: number[]): number =>
    counts.reduce((sum, count, index) => sum + count * (slots[index]?.cost ?? 0), 0);
  const maxHp = Math.max(...slots.map((slot) => slot.hp));
  let low = 0;
  let high = ceiling ?? (capacity + 1) * Math.max(maxHp, 1);
  if (ceiling !== undefined && usedBy(countsAt(ceiling)) <= capacity) low = ceiling;
  else {
    for (let step = 0; step < 200; step += 1) {
      const mid = (low + high) / 2;
      if (usedBy(countsAt(mid)) <= capacity) low = mid;
      else high = mid;
    }
  }
  const counts = countsAt(low);
  let rest = capacity - usedBy(counts);
  let changed = true;
  while (changed && rest > 0) {
    changed = false;
    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      if (!slot || slot.hp <= 0) continue;
      const next = (counts[index] ?? 0) + 1;
      if (slot.cost > rest || next > slot.cap) continue;
      if (ceiling !== undefined && next * slot.hp > ceiling) continue;
      counts[index] = next;
      rest -= slot.cost;
      changed = true;
    }
  }
  return [...counts, capacity - rest];
}

describe('the kernel sizePool stops its bisection only at a fixed point', () => {
  it('answers the 200-step search exactly, on seeded and extreme pools', () => {
    const kernel = createPlanKernel(loadKernelModule());
    const random = mulberry32(0x5e5);
    const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)] as T;
    const hps = [0, 1, 3, 7.5, 120, 1_200, 45_000, 2e6, 1e15, 1e300, Infinity];
    const costs = [0, 1, 2, 3, 5, 12, 40, 1e9, 1e300];
    // Finite caps on the extreme pools: the single-unit fill after the search walks a unit at a time, so a
    // pool with room for 1e300 units and nothing capping them would never end — in the engine as here.
    const caps = [0, 1, 10, 83, 450, 5_000];
    const capacities = [1, 7, 900, 2_180, 5_600, 20_000, 1e9, 1e15, 1e300, 8.9e307, 1.7e308];
    let compared = 0;
    let adversarial = 0;
    for (let trial = 0; trial < 20_000; trial += 1) {
      const extreme = random() < 0.35;
      const n = 1 + Math.floor(random() * 12);
      const slots: Slot[] = Array.from({ length: n }, () => ({
        hp: extreme ? pick(hps) : 1 + Math.floor(random() * 50_000),
        cost: extreme ? pick(costs) : 1 + Math.floor(random() * 12),
        cap: extreme || random() < 0.3 ? pick(caps) : Number.MAX_SAFE_INTEGER,
        count: -1,
      }));
      const capacity = extreme ? pick(capacities) : 1 + Math.floor(random() * 20_000);
      const ceiling =
        random() < 0.4 ? (extreme ? pick([0, 1, 1e6, 1e300, Infinity]) : random() * 3e6) : undefined;
      const reference = referencePool(
        slots.map((slot) => ({ ...slot })),
        capacity,
        ceiling,
      );
      if (reference === 'none') continue;
      const mine = slots.map((slot) => ({ ...slot }));
      const used = kernel.sizePool(mine, capacity, ceiling, RANK_SPREAD);
      if (used === null) continue;
      const got = [...mine.map((slot) => slot.count), used];
      expect(got.length).toBe(reference.length);
      for (let i = 0; i < got.length; i += 1) {
        if (!Object.is(got[i], reference[i])) {
          expect({ trial, slots, capacity, ceiling, got, reference }).toBeNull();
        }
      }
      compared += 1;
      if (extreme) adversarial += 1;
    }
    expect(compared).toBeGreaterThan(15_000);
    expect(adversarial).toBeGreaterThan(4_000);
  });
});
