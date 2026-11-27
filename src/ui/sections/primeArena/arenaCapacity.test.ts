/**
 * B-43: Prime Arena fills Leadership and Dominance with the squad's maximum, at the Arena store seam: asserted on the
 * saved squad. Captain figures are the game's own (`capacities.json`, the same for every captain); the ones used here,
 * as leadership / dominance: level 8 1000 / 400, level 10 1500 / 450, level 100 14000 / 3500, level 600
 * 270000 / 67500.
 */
import { beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { migrate } from '@/state/migrations';
import type { RootDocument } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import { usePrimeArenaStore } from './primeArenaStore';

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  usePrimeArenaStore.getState().reset();
});

const profile = () => selectActiveProfile(useStore.getState())!;
const arena = () => usePrimeArenaStore.getState();
/** The saved pools, as `[leadership, dominance]`. */
const pools = (): [number, number] => {
  const { leadership, dominance } = profile().primeArena.setup.housing;
  return [leadership, dominance];
};

/** Records captains on the account, each under the entry id `e-<captain>`, as an edit of any page does. */
function own(list: [captainId: string, level: number, star?: number][]): void {
  useStore.getState().updateProfile(profile().id, {
    sources: {
      ...profile().sources,
      captains: list.map(([captainId, level, star = 0]) => ({
        id: `e-${captainId}`,
        captainId,
        level,
        star,
      })),
    },
  });
}

/** What the setup column does on each change of the account while the page is open. */
function open(): void {
  arena().open(selectActiveSetup(useStore.getState())!);
}

const ride = (...captainIds: string[]): void => {
  arena().updateSetup((s) => ({ active: { ...s.active, captains: captainIds.map((id) => `e-${id}`) } }));
};

const type = (leadership: number, dominance: number): void => {
  arena().updateSetup((s) => ({ housing: { ...s.housing, leadership, dominance } }));
};

/** The document as it comes back from storage, to a page that has not been opened yet. */
function reload(): void {
  usePrimeArenaStore.setState({ filled: false });
  const stored = JSON.parse(JSON.stringify(useStore.getState().doc)) as RootDocument;
  useStore.getState().replaceDocument(newRoot());
  useStore.getState().replaceDocument(migrate(stored));
}

test('opening fills Leadership and Dominance with the sum of the squad captains', () => {
  own([
    ['aydae', 100],
    ['beowulf', 10],
  ]);
  open();
  expect(pools()).toEqual([15_500, 3950]);
});

test('the march keeps its housing, and the arena holds no authority', () => {
  own([['aydae', 100]]);
  const housing = { leadership: 900, authority: 50, dominance: 400 };
  useStore.getState().updateActiveSetup({ housing });
  open();
  expect(profile().primeArena.setup.housing).toEqual({ leadership: 14_000, authority: 0, dominance: 3500 });
  ride();
  open();
  expect(selectActiveSetup(useStore.getState())!.housing).toEqual(housing);
});

test('a change of the squad captains fills the new maximum', () => {
  own([
    ['aydae', 100],
    ['beowulf', 10],
  ]);
  open();
  ride('beowulf');
  expect(pools()).toEqual([1500, 450]);
  arena().pickStrongest();
  expect(pools()).toEqual([15_500, 3950]);
});

test('a selected captain’s new level fills the new maximum, wherever it was typed', () => {
  own([['aydae', 10]]);
  open();
  expect(pools()).toEqual([1500, 450]);
  // The calculator's own edit: the account changes while the arena store is only listening.
  own([['aydae', 100]]);
  open();
  expect(pools()).toEqual([14_000, 3500]);
});

test('a typed value stays until the inputs change, a reload included', () => {
  // Beowulf at level 0 is not owned yet, so no opening picks him.
  own([
    ['aydae', 10],
    ['beowulf', 0],
  ]);
  open();
  type(1234, 77);
  open();
  expect(pools()).toEqual([1234, 77]);
  reload();
  open();
  expect(pools()).toEqual([1234, 77]);
  // Neither the stars of a squad captain nor the level of one left behind is an input.
  own([
    ['aydae', 10, 3],
    ['beowulf', 100],
  ]);
  open();
  expect(pools()).toEqual([1234, 77]);
  own([
    ['aydae', 100, 3],
    ['beowulf', 100],
  ]);
  open();
  expect(pools()).toEqual([14_000, 3500]);
});

test('the other capacity bonus % is saved and raises the maximum', () => {
  own([['aydae', 100]]);
  open();
  expect(profile().primeArena.otherCapacity).toBe(0);
  type(5, 5);
  arena().setOtherCapacity(10);
  expect(profile().primeArena.otherCapacity).toBe(10);
  expect(pools()).toEqual([15_400, 3850]);
  type(5, 5);
  // The same figure again is not a change.
  arena().setOtherCapacity(10);
  expect(pools()).toEqual([5, 5]);
  reload();
  open();
  expect(pools()).toEqual([5, 5]);
  expect(arena().otherCapacity).toBe(10);
});

test('the other capacity bonus % is held to two decimals between 0 and 1000', () => {
  arena().setOtherCapacity(-3);
  expect(arena().otherCapacity).toBe(0);
  arena().setOtherCapacity(12.345);
  expect(arena().otherCapacity).toBe(12.35);
  arena().setOtherCapacity(5000);
  expect(arena().otherCapacity).toBe(1000);
});

test('the maximum is the exact floor', () => {
  // 1000 × 1.007 is 1006.9999999999999 in floating point; the maximum is 1007. Dominance 400 × 1.007 = 402.8.
  own([['aydae', 8]]);
  open();
  arena().setOtherCapacity(0.7);
  expect(pools()).toEqual([1007, 402]);
});

test('a level-0 captain adds nothing; one whose bonuses do not count in the Arena adds its capacity', () => {
  own([
    ['aydae', 0],
    ['amanitore', 10], // group marches only
    ['hercules', 8], // epic monsters only
  ]);
  open();
  ride('aydae', 'amanitore', 'hercules');
  expect(pools()).toEqual([2500, 850]);
});

test('a level past the last one of the game’s table counts as 600', () => {
  own([['aydae', 999]]);
  open();
  expect(pools()).toEqual([270_000, 67_500]);
});

test('Max restores the maximum at any time', () => {
  own([['aydae', 100]]);
  open();
  type(1, 2);
  arena().fillMaximum();
  expect(pools()).toEqual([14_000, 3500]);
});

/** A saved arena as an older version leaves it: pools and squad, no capacity basis. */
function saveWithoutBasis(leadership: number, dominance: number): void {
  const saved = profile().primeArena;
  useStore.getState().updateProfile(profile().id, {
    primeArena: {
      ...saved,
      seeded: true,
      capacityBasis: null,
      setup: {
        ...saved.setup,
        active: { ...saved.setup.active, captains: ['e-aydae'] },
        housing: { leadership, authority: 0, dominance },
      },
    },
  });
}

test('a saved profile with no basis keeps its typed values and adopts the basis', () => {
  own([['aydae', 10]]);
  saveWithoutBasis(700, 0);
  open();
  expect(pools()).toEqual([700, 0]);
  expect(profile().primeArena.capacityBasis).not.toBeNull();
  own([['aydae', 100]]);
  open();
  expect(pools()).toEqual([14_000, 3500]);
});

test('a saved profile with no basis keeps its typed values while the opening fills the empty captain slots', () => {
  own([
    ['aydae', 10],
    ['beowulf', 100],
  ]);
  saveWithoutBasis(700, 300);
  open();
  expect(arena().setup.active.captains).toEqual(['e-aydae', 'e-beowulf']);
  expect(pools()).toEqual([700, 300]);
});

test('a saved profile with no basis and both pools at zero is filled', () => {
  own([['aydae', 10]]);
  saveWithoutBasis(0, 0);
  open();
  expect(pools()).toEqual([1500, 450]);
});

test('the march’s pools, copied by the first opening, stand only while the squad can lead nothing', () => {
  useStore.getState().updateActiveSetup({ housing: { leadership: 900, authority: 50, dominance: 400 } });
  open();
  expect(pools()).toEqual([900, 400]);
  expect(profile().primeArena.setup.housing.authority).toBe(0);
  own([['aydae', 10]]);
  open();
  // Owning a captain changes nothing until he is aboard.
  expect(pools()).toEqual([900, 400]);
  ride('aydae');
  expect(pools()).toEqual([1500, 450]);
});

test('the first opening over a march with captains fills their maximum, not the march’s pools', () => {
  own([['aydae', 10]]);
  const march = selectActiveSetup(useStore.getState())!;
  useStore.getState().updateActiveSetup({
    housing: { leadership: 900, authority: 50, dominance: 400 },
    active: { ...march.active, captains: ['e-aydae'] },
  });
  open();
  expect(pools()).toEqual([1500, 450]);
});
