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

import { bestOn, rateColumn, rateColumns, tableMarks } from './picks';

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

test('the rate column is offered only for what the army actually spends', () => {
  // An army that hires nothing and buys no gold has one rate to show, and the switch has nothing to switch.
  const troopsOnly = [row('silver-saver', {}), row('sweet-spot', { damage: 2_000_000 })];
  expect(rateColumns(troopsOnly).map((column) => column.key)).toEqual(['silver']);

  // Gold, because experiment 120 measured it as the **only** fact naming its stop on 7 of the 16 benchmark
  // armies — the one rate that points somewhere the rest of the table does not.
  const buysGold = troopsOnly.map((one) => row(one.pick, { ...one.repeat, gold: 500 }));
  expect(rateColumns(buysGold).map((column) => column.key)).toEqual(['silver', 'gold']);

  // And the hired rate wherever a march burns stock (S-112's own reading, `spendsStock`).
  const burns = troopsOnly.map((one) =>
    row(one.pick, { ...one.repeat, gold: 500, mercLost: 4, hiredDamage: 400_000 }),
  );
  expect(rateColumns(burns).map((column) => column.key)).toEqual(['silver', 'gold', 'hired']);
});

test('a rate the army does not spend falls back to the one it does', () => {
  const troopsOnly = [row('silver-saver', {}), row('sweet-spot', { damage: 2_000_000 })];
  // The player switched to "Per hired" on one army and opened another that hires nothing: the table shows
  // the rate it has rather than a column of dashes (design rule 15).
  expect(rateColumn(troopsOnly, 'hired').key).toBe('silver');
  expect(rateColumn(troopsOnly, 'silver').key).toBe('silver');
});

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

test('damage a hired unit is never marked best', () => {
  // `docs/investigations/0019` §2.3 measured this ratio **rising** while the march collapses, and §1 calls
  // it "never the right compass". It is a fact the table carries; a best mark on it is the trap itself.
  const rows = [
    row('silver-saver', { damage: 3_000_000, silver: 3_000_000, mercLost: 2, hiredDamage: 1_000_000 }),
    row('all-in', { damage: 4_000_000, silver: 8_000_000, mercLost: 9, hiredDamage: 900_000 }),
  ];
  const hired = rateColumn(rows, 'hired');
  expect(hired.key).toBe('hired');
  expect(hired.markable).toBe(false);
  // The silver saver *is* the better hired rate (500 000 against 100 000) and still wears no mark.
  expect(hired.of(rows[0] as PlanRow)).toBeGreaterThan(hired.of(rows[1] as PlanRow));
  expect(tableMarks(rows, hired).rate).toBe(null);

  // Every other mark on the same rows is drawn as usual: the ban is on one column, not on the table.
  const marks = tableMarks(rows, rateColumn(rows, 'silver'));
  expect(marks.damage).toBe(1); // all-in hits hardest
  expect(marks.silver).toBe(0); // the silver saver is cheapest
  expect(marks.hiredLost).toBe(0); // …and burns the least stock
  expect(marks.rate).toBe(0); // 1.0 a silver against 0.5
});
