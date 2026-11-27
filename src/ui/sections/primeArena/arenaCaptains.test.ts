/**
 * B-45: the captain quick select, at the Arena store seam. Opening the page fills the empty slots with the strongest
 * owned captains, "Pick 5 strongest" replaces the selection, and both are saved like a hand-made one. Asserted on the
 * saved squad. Captain figures are the table's own (`captains.json`), worked by hand beside each case.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { useUiStore } from '@/ui/uiStore';

import { CAPTAIN_SHINE_MS, usePrimeArenaStore } from './primeArenaStore';

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  usePrimeArenaStore.getState().reset();
  useUiStore.setState({ page: 'primeArena' });
});

afterEach(() => {
  vi.useRealTimers();
});

/** Records captains on the account, each under the entry id `e-<captain>`; `star` is the stored 0..6 step. */
function own(list: [captainId: string, level: number, star?: number][]): void {
  const profile = selectActiveProfile(useStore.getState())!;
  useStore.getState().updateProfile(profile.id, {
    sources: {
      ...profile.sources,
      captains: list.map(([captainId, level, star = 0]) => ({
        id: `e-${captainId}`,
        captainId,
        level,
        star,
      })),
    },
  });
}

/** Opens the page over a march whose captains are `chosen`, as the setup column does. */
function open(chosen: string[] = []): void {
  const march = selectActiveSetup(useStore.getState())!;
  usePrimeArenaStore.getState().open({ ...march, active: { ...march.active, captains: chosen } });
}

const saved = (): string[] => selectActiveProfile(useStore.getState())!.primeArena.setup.active.captains;

test('opening fills the empty slots with the highest-level captains, after the ones already chosen', () => {
  own([
    ['aurora', 5],
    ['aydae', 40],
    ['beowulf', 30],
    ['bernard', 20],
    ['brunhild', 10],
    ['carter', 1],
  ]);
  open(['e-carter']);
  expect(saved()).toEqual(['e-carter', 'e-aydae', 'e-beowulf', 'e-bernard', 'e-brunhild']);
});

test('equal levels are settled by the bonus points that count in the Arena, then by the picker order', () => {
  // At level 10 and one star: Skadi 20 + 20 = 40; Aydae and Bernard 10 + 10 = 20 each (Aydae is earlier in the
  // picker); Ramses II 10 (health only). Nothing counts for Amanitore (group marches only; she would have 30),
  // Brann (engineers, who never fight in the Arena; he would have 20) or Hercules (epic monsters only), so they
  // follow in the picker's order, and Amanitore is the first of them.
  own([
    ['amanitore', 10],
    ['brann', 10],
    ['hercules', 10],
    ['ramses-ii', 10],
    ['bernard', 10],
    ['aydae', 10],
    ['skadi', 10],
  ]);
  open();
  expect(saved()).toEqual(['e-skadi', 'e-aydae', 'e-bernard', 'e-ramses-ii', 'e-amanitore']);
});

test('the stars count in a tie, and a higher level beats any number of points', () => {
  // Alexander at level 10 and three stars: 10 + 20 from the level, 40 + 40 from the stars = 110, over Skadi's 40.
  // Aurora has no bonus at all and still leads on her level.
  own([
    ['skadi', 10],
    ['alexander', 10, 2],
    ['aurora', 11],
  ]);
  open();
  expect(saved()).toEqual(['e-aurora', 'e-alexander', 'e-skadi']);
});

test('with fewer than five owned captains all of them are picked, and never a level-0 one', () => {
  own([
    ['skadi', 0, 6],
    ['aydae', 3],
    ['bernard', 0],
    ['carter', 1],
  ]);
  open();
  expect(saved()).toEqual(['e-aydae', 'e-carter']);
});

test('a captain recorded twice, or already chosen, takes one slot', () => {
  const profile = selectActiveProfile(useStore.getState())!;
  useStore.getState().updateProfile(profile.id, {
    sources: {
      ...profile.sources,
      captains: [
        { id: 'first', captainId: 'skadi', level: 30, star: 0 },
        { id: 'second', captainId: 'skadi', level: 30, star: 0 },
        { id: 'a1', captainId: 'aydae', level: 20, star: 0 },
        { id: 'a2', captainId: 'aydae', level: 20, star: 0 },
      ],
    },
  });
  // `a2` came with the march: Aydae is aboard, so her other entry is not added beside it.
  open(['a2']);
  expect(saved()).toEqual(['a2', 'first']);
});

test('a selected entry the account no longer has leaves its slot empty, so it is filled', () => {
  own([
    ['aydae', 40],
    ['beowulf', 30],
    ['bernard', 20],
    ['brunhild', 10],
    ['carter', 1],
  ]);
  open(['e-removed']);
  expect(saved()).toEqual(['e-aydae', 'e-beowulf', 'e-bernard', 'e-brunhild', 'e-carter']);
});

test('five chosen captains are left as they are, and a chosen level-0 captain stays', () => {
  own([
    ['aurora', 0],
    ['aydae', 40],
    ['beowulf', 30],
    ['bernard', 20],
    ['brunhild', 10],
    ['carter', 1],
    ['skadi', 99],
  ]);
  const five = ['e-aurora', 'e-carter', 'e-brunhild', 'e-bernard', 'e-beowulf'];
  open(five);
  expect(saved()).toEqual(five);
});

test('captains are filled once per opening: a hand edit stays until the page is left and opened again', () => {
  own([
    ['aydae', 40],
    ['beowulf', 30],
  ]);
  open();
  expect(saved()).toEqual(['e-aydae', 'e-beowulf']);
  usePrimeArenaStore.getState().updateSetup((s) => ({ active: { ...s.active, captains: ['e-aydae'] } }));
  // The setup column asks again on every account change, and is drawn anew when the window changes shape.
  open();
  expect(saved()).toEqual(['e-aydae']);
  useUiStore.getState().setPage('calculator');
  useUiStore.getState().setPage('primeArena');
  open();
  expect(saved()).toEqual(['e-aydae', 'e-beowulf']);
});

test('an opening that has nothing to add leaves the saved squad untouched', () => {
  own([['aydae', 40]]);
  open();
  const before = selectActiveProfile(useStore.getState())!.primeArena;
  useUiStore.getState().setPage('calculator');
  useUiStore.getState().setPage('primeArena');
  open();
  // No new revision, so the account merge does not read an opening as an edit.
  expect(selectActiveProfile(useStore.getState())!.primeArena).toBe(before);
});

const SEVEN: [string, number][] = [
  ['aurora', 0],
  ['aydae', 40],
  ['beowulf', 30],
  ['bernard', 20],
  ['brunhild', 10],
  ['carter', 1],
  ['skadi', 99],
];
const STRONGEST = ['e-skadi', 'e-aydae', 'e-beowulf', 'e-bernard', 'e-brunhild'];

test('"Pick 5 strongest" replaces the whole selection and saves it like a hand-made one', () => {
  own(SEVEN);
  const five = ['e-aurora', 'e-carter', 'e-brunhild', 'e-bernard', 'e-beowulf'];
  open(five);
  const before = selectActiveProfile(useStore.getState())!.primeArena.setup.rev;
  usePrimeArenaStore.getState().pickStrongest();
  expect(saved()).toEqual(STRONGEST);
  expect(selectActiveProfile(useStore.getState())!.primeArena.setup.rev).toBe(before + 1);
});

test('"Pick 5 strongest" over the same five, in another order, is no edit', () => {
  own(SEVEN);
  open([...STRONGEST].reverse());
  const before = selectActiveProfile(useStore.getState())!.primeArena;
  usePrimeArenaStore.getState().pickStrongest();
  expect(selectActiveProfile(useStore.getState())!.primeArena).toBe(before);
});

test('"Pick 5 strongest" with fewer than five owned captains keeps those alone', () => {
  own([
    ['aurora', 0],
    ['aydae', 3],
    ['carter', 1],
  ]);
  open(['e-aurora']);
  usePrimeArenaStore.getState().pickStrongest();
  expect(saved()).toEqual(['e-aydae', 'e-carter']);
});

test('with no captain at level 1 or above, "Pick 5 strongest" empties nothing', () => {
  own([['aurora', 0]]);
  open(['e-aurora']);
  usePrimeArenaStore.getState().pickStrongest();
  expect(saved()).toEqual(['e-aurora']);
});

test('the captains an opening or a pick adds shine once, and the shine ends by itself', () => {
  vi.useFakeTimers();
  own(SEVEN);
  open(['e-carter']);
  expect(usePrimeArenaStore.getState().shining).toEqual(['skadi', 'aydae', 'beowulf', 'bernard']);
  vi.advanceTimersByTime(CAPTAIN_SHINE_MS);
  expect(usePrimeArenaStore.getState().shining).toEqual([]);
  // Only what was not already aboard: Carter makes way for Brunhild, the other four stay.
  usePrimeArenaStore.getState().pickStrongest();
  expect(usePrimeArenaStore.getState().shining).toEqual(['brunhild']);
  vi.advanceTimersByTime(CAPTAIN_SHINE_MS);
  usePrimeArenaStore.getState().pickStrongest();
  expect(usePrimeArenaStore.getState().shining).toEqual([]);
});

test('a hand-made selection does not shine, and the shine is never saved', () => {
  own(SEVEN);
  usePrimeArenaStore.getState().updateSetup((s) => ({ active: { ...s.active, captains: ['e-carter'] } }));
  expect(usePrimeArenaStore.getState().shining).toEqual([]);
  usePrimeArenaStore.getState().pickStrongest();
  expect(usePrimeArenaStore.getState().shining).toHaveLength(5);
  const document = JSON.stringify(useStore.getState().doc);
  expect(document).not.toContain('shining');
  expect(document).not.toContain('filled');
});

test('leaving the page ends a shine', () => {
  own(SEVEN);
  open();
  expect(usePrimeArenaStore.getState().shining).toHaveLength(5);
  useUiStore.getState().setPage('calculator');
  expect(usePrimeArenaStore.getState().shining).toEqual([]);
});
