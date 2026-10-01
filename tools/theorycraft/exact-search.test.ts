/**
 * The exhaustive box search (S-143b): what it promises a caller, and nothing about marches — the box and
 * the score are the caller's, and this file hands it toys so that every claim here can be checked by hand.
 *
 * The two claims that matter are the two the March leans on: **the walk is the optimum** (the only place an
 * optimum is known rather than argued) and **the search never comes out below the vector it was given**.
 */
import { expect, test } from 'vitest';

import { boxSize, exactSearch } from './exact-search';
import type { BoxVector, SearchSlot } from './exact-search';

const slots = (...ranges: [string, number, number][]): SearchSlot[] =>
  ranges.map(([id, from, to]) => ({ id, from, to }));

/** What every vector in a box is worth, worked out the slow way — the control the walk is held against. */
function bruteForce(box: readonly SearchSlot[], score: (vector: BoxVector) => number): number {
  let best = Number.NEGATIVE_INFINITY;
  const walk = (index: number, vector: BoxVector): void => {
    if (index === box.length) {
      best = Math.max(best, score(vector));
      return;
    }
    const slot = box[index] as SearchSlot;
    for (let count = slot.from; count <= slot.to; count += 1) {
      walk(index + 1, { ...vector, [slot.id]: count });
    }
  };
  walk(0, {});
  return best;
}

test('a box that fits is walked whole, and the walk is the optimum', () => {
  const box = slots(['a', 2, 9], ['b', 0, 4], ['c', 3, 5]);
  // A scorer with no shape a climb could rely on: it is not monotone, not separable, not convex.
  const score = (v: BoxVector): number =>
    Math.sin((v.a ?? 0) * 1.7) * 3 + Math.cos((v.b ?? 0) * 2.3) * ((v.c ?? 0) - 4) ** 2 + (v.a ?? 0) * 0.1;

  const answer = exactSearch(box, score);
  expect(answer?.how).toBe('walked');
  expect(answer?.space).toBe(8 * 5 * 3);
  expect(boxSize(box)).toBe(120);
  // Exactly what walking every vector by hand says — the one reading that is the optimum and not a find.
  expect(score(answer?.counts ?? {})).toBe(bruteForce(box, score));
});

test('a box too big to walk is searched, and never comes out below where it started', () => {
  const box = slots(['a', 0, 40], ['b', 0, 40], ['c', 0, 40]);
  // 68 921 vectors, walked would be fine here — the cap is what makes this the search's branch.
  const score = (v: BoxVector): number => 1000 - (v.a ?? 0) - (v.b ?? 0) - (v.c ?? 0);
  const start: BoxVector = { a: 7, b: 11, c: 3 };

  const answer = exactSearch(box, score, { walkCap: 100, restarts: 8, start });
  expect(answer?.how).toBe('searched');
  // A monotone scorer: the best is the corner, and the search is not allowed to miss it from any start.
  expect(score(answer?.counts ?? {})).toBe(bruteForce(box, score));
  expect(answer?.counts).toEqual({ a: 0, b: 0, c: 0 });
});

test('two stacks that only improve together are found — the neighbourhood a one-stack climb cannot see', () => {
  /**
   * `a × b` is the smallest thing a coordinate climb is blind to: from `(0, 0)` moving either stack alone
   * changes nothing at all, and the ascent sits there for ever. That blindness is exactly what experiment
   * 181 measured on real marches (+2.28 % median on the stops where two stacks trade a round of strikes),
   * and it is what the pairwise neighbourhood exists for.
   */
  const box = slots(['a', 0, 10], ['b', 0, 10]);
  const score = (v: BoxVector): number => (v.a ?? 0) * (v.b ?? 0);
  expect(score({ a: 0, b: 0 })).toBe(0);

  const answer = exactSearch(box, score, { walkCap: 0, restarts: 0 });
  expect(answer?.how).toBe('searched');
  expect(score(answer?.counts ?? {})).toBe(100);
});

test('the search is deterministic: the same box and the same start answer the same vector', () => {
  const box = slots(['a', 0, 60], ['b', 0, 60], ['c', 0, 60]);
  const score = (v: BoxVector): number =>
    0 - ((v.a ?? 0) - 31) ** 2 - ((v.b ?? 0) - 17) ** 2 + Math.sin((v.c ?? 0) * 0.9) * 50;
  const options = { walkCap: 100, restarts: 6 } as const;

  const first = exactSearch(box, score, options);
  const second = exactSearch(box, score, options);
  expect(first?.counts).toEqual(second?.counts);
  // And a different seed is a different walk of the same box, not a different answer to the question: the
  // scorer's own optimum is 31, 17, and whatever the sine likes best.
  const third = exactSearch(box, score, { ...options, seed: 7 });
  expect(score(third?.counts ?? {})).toBe(score(first?.counts ?? {}));
});

test('a vector the scorer refuses is never the answer', () => {
  // `-Infinity` is how a caller says "the housing cannot pay for this one", so the answer must be feasible.
  const box = slots(['a', 0, 5], ['b', 0, 5]);
  const score = (v: BoxVector): number =>
    (v.a ?? 0) + (v.b ?? 0) > 6 ? Number.NEGATIVE_INFINITY : (v.a ?? 0) * 2 + (v.b ?? 0);

  const answer = exactSearch(box, score, { start: { a: 5, b: 5 } });
  for (const vector of [
    answer?.counts ?? {},
    // The same box, too big to walk: the search's branch must refuse it too.
    exactSearch(slots(['a', 0, 50], ['b', 0, 50]), (v) =>
      (v.a ?? 0) + (v.b ?? 0) > 6 ? Number.NEGATIVE_INFINITY : (v.a ?? 0) * 2 + (v.b ?? 0),
    )?.counts ?? {},
  ]) {
    expect(score(vector)).toBeGreaterThan(Number.NEGATIVE_INFINITY);
  }
});

test('a start outside the box is clipped into it, and a partial start is filled in', () => {
  const box = slots(['a', 2, 5], ['b', 10, 12]);
  const score = (v: BoxVector): number => (v.a ?? 0) * 100 + (v.b ?? 0);
  // `a: 99` is not in the box and `b` is missing: neither may take a vector outside what the caller allowed.
  const answer = exactSearch(box, score, { start: { a: 99 } });
  expect(answer?.counts).toEqual({ a: 5, b: 12 });
});

test('a box with nothing to move is no answer at all', () => {
  expect(exactSearch([], () => 0)).toBeNull();
  expect(exactSearch(slots(['a', 4, 4], ['b', 9, 9]), () => 0)).toBeNull();
  // A slot that cannot move is dropped from the box rather than searched at one value.
  const answer = exactSearch(slots(['a', 0, 3], ['b', 7, 7]), (v) => v.a ?? 0);
  expect(answer?.counts).toEqual({ a: 3 });
  expect(answer?.space).toBe(4);
});

test('a box with nothing feasible in it is no answer at all', () => {
  /**
   * The scorer answers `-Infinity` for a vector the caller refuses, so a box where **every** vector is
   * refused has no optimum — and handing the start back would be handing a caller a count to field that its
   * own scorer says cannot be fielded. Both branches: the walk, which shows it to every vector in the box,
   * and the search, which can only ever climb to what it has seen.
   */
  const refused = (): number => Number.NEGATIVE_INFINITY;
  expect(exactSearch(slots(['a', 0, 3], ['b', 0, 3]), refused)).toBeNull();
  expect(exactSearch(slots(['a', 0, 20], ['b', 0, 20]), refused, { walkCap: 0 })).toBeNull();
  // The same box, one feasible vector in it: the walk finds it and the search from a refused start reaches it.
  const one = (v: BoxVector): number => ((v.a ?? 0) === 3 && (v.b ?? 0) === 2 ? 7 : Number.NEGATIVE_INFINITY);
  expect(exactSearch(slots(['a', 0, 3], ['b', 0, 3]), one)?.counts).toEqual({ a: 3, b: 2 });
  expect(exactSearch(slots(['a', 0, 20], ['b', 0, 20]), one, { walkCap: 0 })?.counts).toEqual({ a: 3, b: 2 });
});

test('a negative seed still keeps every restart inside the box', () => {
  // `randomFrom` folds into `[0, 2^32)` before anything is drawn: a negative seed used to make every draw
  // negative, which put the restarts below their slots' `from` — outside the box the caller described.
  const box = slots(['a', 5, 9], ['b', 5, 9]);
  const seen: BoxVector[] = [];
  const answer = exactSearch(
    box,
    (v) => {
      seen.push(v);
      return (v.a ?? 0) + (v.b ?? 0);
    },
    { walkCap: 0, restarts: 12, seed: -20_260_929 },
  );
  expect(answer?.counts).toEqual({ a: 9, b: 9 });
  for (const vector of seen) {
    expect(vector.a).toBeGreaterThanOrEqual(5);
    expect(vector.a).toBeLessThanOrEqual(9);
    expect(vector.b).toBeGreaterThanOrEqual(5);
    expect(vector.b).toBeLessThanOrEqual(9);
  }
});
