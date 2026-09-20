/**
 * The insight table's own readings (S-113): which rate the last column offers, and which row — if any —
 * wears a best mark.
 *
 * These are here rather than in `PlanPanel.test.tsx` because they are **decisions, not drawings**: whether a
 * column exists at all, and whether a mark is a claim the table is entitled to make. Each one is measured
 * (experiment 120, `tools/theorycraft/out/120-what-the-table-should-carry.md`) or ruled
 * (`docs/investigations/0019` §2.3), and both are things a later refactor could quietly lose.
 */
import { expect, test } from 'vitest';

import type { PlanRepeat, PlanRow } from '@/engine/plan';

import { PER_SILVER, bestOn, tableMarks } from './picks';

/** A row is only ever read through `repeat` here, so the rest of `PlanTotals` is filled once and shared. */
function row(pick: PlanRow['pick'], repeat: Partial<PlanRepeat>): PlanRow {
  const full: PlanRepeat = {
    damage: 1_000_000,
    hiredDamage: 0,
    silver: 1_000_000,
    gold: 0,
    dragonCoins: 0,
    seconds: 100_000,
    mercLost: 0,
    ...repeat,
  };
  return {
    pick,
    label: pick,
    bestFor: { silver: false, hired: false },
    counts: {},
    repeat: full,
    shape: 'ladder',
    totalDamage: full.damage,
    hiredDamage: full.hiredDamage,
    silver: full.silver,
    gold: full.gold,
    dragonCoins: full.dragonCoins ?? 0,
    seconds: full.seconds,
    mercLost: full.mercLost,
    marches: 4,
    damagePerSilver: full.silver > 0 ? full.damage / full.silver : 0,
    damagePerMercenary: full.mercLost > 0 ? full.hiredDamage / full.mercLost : 0,
    damagePerDragonCoin: 0,
  };
}

test('a mark is drawn only where it is a claim about one row', () => {
  const rows = [row('silver-saver', { damage: 1_000_000 }), row('sweet-spot', { damage: 2_000_000 })];

  expect(bestOn(rows, (one) => one.repeat.damage, 'higher')).toBe(1);
  expect(bestOn(rows, (one) => one.repeat.silver, 'lower')).toBe(null); // every row reads the same
  // One row is not a race, however good its figure.
  expect(bestOn([rows[0] as PlanRow], (one) => one.repeat.damage, 'higher')).toBe(null);
  // Two rows tied at the top: "the best" is a claim about one row, and the table would make it twice.
  const tied = [...rows, row('all-in', { damage: 2_000_000 })];
  expect(bestOn(tied, (one) => one.repeat.damage, 'higher')).toBe(null);
  // Nothing to divide by never reads as a winner.
  expect(bestOn(rows, () => Number.NaN, 'higher')).toBe(null);
});

test('damage a hired unit is never marked best, and every other column is', () => {
  // `docs/investigations/0019` §2.3 measured this ratio **rising** while the march collapses, and §1 calls
  // it "never the right compass". It is a fact the table carries; a best mark on it is the trap itself.
  const rows = [
    row('silver-saver', { damage: 3_000_000, silver: 3_000_000, mercLost: 2, hiredDamage: 1_000_000 }),
    row('all-in', { damage: 4_000_000, silver: 8_000_000, mercLost: 9, hiredDamage: 900_000 }),
  ];
  const marks = tableMarks(rows);

  // `TableMarks` has no field for the hired rate at all, which is the strongest form the ban can take: the
  // silver saver *is* the better hired rate here — 500 000 a hired unit against 100 000 — and there is
  // nowhere for the table to say so.
  expect(Object.keys(marks).sort()).toEqual(['damage', 'hiredLost', 'perSilver', 'silver']);
  const perHired = (one: PlanRow): number => one.repeat.hiredDamage / one.repeat.mercLost;
  expect(perHired(rows[0] as PlanRow)).toBeGreaterThan(perHired(rows[1] as PlanRow));

  // Every other mark on the same rows is drawn as usual: the ban is on one column, not on the table.
  expect(marks.damage).toBe(1); // all-in hits hardest
  expect(marks.silver).toBe(0); // the silver saver is cheapest
  expect(marks.hiredLost).toBe(0); // …and burns the least stock
  expect(marks.perSilver).toBe(0); // 1.0 a silver against 0.5
  expect(PER_SILVER.decimals).toBe(3); // where the owner's plans differ (S-59)
});
