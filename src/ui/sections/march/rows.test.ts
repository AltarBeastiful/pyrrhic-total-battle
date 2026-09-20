/**
 * The one line a March edit writes under the pills (S-104, `resizeWords`).
 *
 * The words are the owner's promise back to him — *"the plan then computes safely the best course of action
 * with the new parameters in mind … without putting out another"* — so this file holds the sentence itself,
 * and `march.test.tsx` holds the fact that the pane draws it after a real press.
 */
import { expect, test } from 'vitest';

import { getUnits } from '@/data';

import { resizeWords } from './rows';
import type { MarchResize } from './runStore';

const UNITS = getUnits()
  .filter((unit) => unit.pool === 'leadership')
  .slice(0, 4);
const idOf = (index: number): string => UNITS[index]?.id ?? '';
const nameOf = (index: number): string => UNITS[index]?.name ?? '';

const note = (over: Partial<MarchResize>): MarchResize => ({
  putBack: [],
  tookOut: [],
  unfielded: [],
  noStock: [],
  inPlan: true,
  fill: 100,
  ...over,
});

test('a put-back on a plan names the type and promises the two rules', () => {
  expect(resizeWords(note({ putBack: [idOf(0)] }), UNITS)).toBe(
    `Re-sized with ${nameOf(0)} put back — nothing else was pushed out, and your hired stacks are re-sized to what the troops shelter.`,
  );
});

test('a type taken out reads the same way round', () => {
  expect(resizeWords(note({ tookOut: [idOf(1)] }), UNITS)).toContain(`with ${nameOf(1)} left out`);
});

test('two types are named, three are counted', () => {
  expect(resizeWords(note({ putBack: [idOf(0), idOf(1)] }), UNITS)).toContain(
    `with ${nameOf(0)} and ${nameOf(1)} put back`,
  );
  expect(resizeWords(note({ putBack: [idOf(0), idOf(1), idOf(2)] }), UNITS)).toContain(
    'with 3 types put back',
  );
});

test('a type that could not be fielded is said outright rather than left to reappear', () => {
  expect(resizeWords(note({ putBack: [idOf(0)], unfielded: [idOf(0)] }), UNITS)).toContain(
    `${nameOf(0)} could not be fielded at all.`,
  );
});

test('a sizer run makes only the shelter promise: there is no plan to push anything out of', () => {
  const words = resizeWords(note({ putBack: [idOf(0)], inPlan: false }), UNITS);
  expect(words).toContain('your hired stacks stay under the troops');
  expect(words).not.toContain('nothing else was pushed out');
});

test('a hired stock too small to last the stop is a different fact, and is said as one', () => {
  // S-107: not "it would not fit" but "there is none of it to spend on every march this stop plays"
  // (`MarchWithin.hired`). A monster never reads this way — it is trained rather than spent, so it is
  // capped by its own pool and a stop that fields none of one has decided nothing about it.
  expect(resizeWords(note({ putBack: [idOf(0)], noStock: [idOf(0)] }), UNITS)).toContain(
    `Your ${nameOf(0)} stock cannot last every march of this stop, so it could not be fielded.`,
  );
});
