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

test('a march under the leadership pool says so, and says why the gap is a win', () => {
  // S-117: the engine sizes under the pool only where doing so answers with at least the damage for no
  // more silver and no more hired burnt, so the sentence states the win rather than offering a trade —
  // what it explains is the gap the player can see on the leadership bar.
  const words = resizeWords(note({ tookOut: [idOf(1)], fill: 96 }), UNITS);
  expect(words).toContain('It fields 96 % of your leadership');
  expect(words).toContain('the rest bought no damage and cost silver');
});

test('the ordinary edit says nothing about leadership: a full pool is not news (rule 15)', () => {
  expect(resizeWords(note({ tookOut: [idOf(1)] }), UNITS)).not.toContain('of your leadership');
});

test('a trade says what it cost before what it bought: the cost is the part nobody chose', () => {
  // S-117 change 3. A win and a trade both leave the leadership bar short of full, and they must not read
  // alike: the win explains a gap, the trade states a price paid at the player's own rates.
  const words = resizeWords(
    note({ tookOut: [idOf(1)], fill: 90, traded: { damage: -2.4, silver: 10, seconds: 10 } }),
    UNITS,
  );
  expect(words).toContain('It fields 90 % of your leadership, at your own rates:');
  expect(words).toContain('2.4 % less damage for 10.0 % less silver and 10.0 % less training');
  // And it never claims the gap was free, which is the other reading's whole sentence.
  expect(words).not.toContain('bought no damage');
});

test('a win at a smaller pool still reads as a win, not as a price', () => {
  const words = resizeWords(note({ tookOut: [idOf(1)], fill: 96 }), UNITS);
  expect(words).toContain('the rest bought no damage and cost silver');
  expect(words).not.toContain('at your own rates');
});
