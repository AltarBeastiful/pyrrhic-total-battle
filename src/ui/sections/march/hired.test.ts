/**
 * `hired.ts`'s `stockRun` (S-148): what a stock of hired units buys one stack — the chunks a march burns,
 * the identical marches left, and the damage those marches come to.
 *
 * The arithmetic here is held **against the engine's own** and never recomputed from the sheet's side: the
 * count that burns is `chunks` (`engine/recovery.ts`) and the marches are `lastsMarches` (`engine/plan.ts`),
 * which is what the plan rations a stop with. `hiredLost` and `hiredStock` are exercised through the screens
 * that draw them (`march.test.tsx`).
 */
import { expect, test } from 'vitest';

import { stockRun } from './hired';

test('a stock of 4 200 carries nine marches of 2 310, at 231 burnt each', () => {
  const run = stockRun(4_200, 2_310, 12_500, 340_000);
  // One in ten, rounded up: the chunks a march loses for good are `chunks(2 310) = ceil(231) = 231`.
  expect(run.burn).toBe(231);
  // And the marches are `floor((4 200 − 2 310) / 231) + 1 = floor(8.18) + 1 = 9`: eight marches' worth of
  // stock is spent getting to the ninth, and the ninth is the one the last 231 units field.
  expect(run.marches).toBe(9);
  // The two totals are that count of marches over each damage figure — the stack's own (9 × 12 500) and the
  // whole march's (9 × 340 000), which is the pair the sheet prints beside each other.
  expect(run.stackDamage).toBe(112_500);
  expect(run.marchDamage).toBe(3_060_000);
});

test('a stock of exactly the count buys one march, and not nought', () => {
  // `floor((2 310 − 2 310) / 231) + 1 = 1`: the stock fields the count once and the first march's burn is
  // the last chunk it has. A rule that read the division alone would answer nought and hide the one march
  // the account can still fight; the `+ 1` is exactly the march the count itself pays for.
  const run = stockRun(2_310, 2_310, 1_000, 2_000);
  expect(run.marches).toBe(1);
  expect(run.stackDamage).toBe(1_000);
});

test('a count that is not a multiple of ten rounds its burn up', () => {
  // 2 311 is 231 chunks and a remainder of one unit, and the Temple charges the whole chunk: the burn is
  // `ceil(231.1) = 232`. The marches follow that larger burn, not the count's own ten-thousands:
  // `floor((4 200 − 2 311) / 232) + 1 = floor(8.14) + 1 = 9` — the same nine, one chunk narrower.
  const run = stockRun(4_200, 2_311, 0, 0);
  expect(run.burn).toBe(232);
  expect(run.marches).toBe(9);
});

test('a count of zero burns nothing and lasts forever, as the engine says it does', () => {
  // `chunks(0)` is nought and `lastsMarches` answers `Infinity` before it divides (`plan.ts:1537`), and
  // this function adds no guard of its own — a second rule here would be a second answer. A zero stack is
  // not a stack the sheet draws, so the case is pinned rather than defended: nothing burned, no ceiling.
  const run = stockRun(4_200, 0, 1_000, 2_000);
  expect(run.burn).toBe(0);
  expect(run.marches).toBe(Number.POSITIVE_INFINITY);
  expect(run.stackDamage).toBe(Number.POSITIVE_INFINITY);
  expect(run.marchDamage).toBe(Number.POSITIVE_INFINITY);
});

test('a stock that cannot field the count once comes back negative, and the caller refuses it', () => {
  // 2 000 held against 2 310 needed: the first march already owes 310 units the account does not have, so
  // the engine's own rule reads `floor((2 000 − 2 310) / 231) + 1 = floor(−1.34) + 1 = −1`. It is returned
  // **unclamped**, because the guard that refuses this is the caller's `marches >= 1`: a nought here would
  // say the stock is used up where the truth is that it never fielded the count at all, and the two lead a
  // reader to different fixes.
  const run = stockRun(2_000, 2_310, 12_500, 340_000);
  expect(run.burn).toBe(231);
  expect(run.marches).toBe(-1);
  // The totals carry the same sign for the same reason: they are the run's figures, and a negative run's
  // damage is not nought units of damage.
  expect(run.stackDamage).toBe(-12_500);
  expect(run.marchDamage).toBe(-340_000);
});
