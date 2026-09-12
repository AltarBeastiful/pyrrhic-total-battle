// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import type { ProfileTroops } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';

import { TroopsSection } from './TroopsSection';

beforeEach(() => {
  globalThis.localStorage.clear();
  useStore.getState().replaceDocument(newRoot());
});

afterEach(cleanup);

const troops = (): ProfileTroops => {
  const profile = selectActiveProfile(useStore.getState());
  if (profile === undefined) throw new Error('no active profile');
  return profile.troops;
};

/** Edit the account the way the rest of the app does, to set a test up. */
function setTroops(next: Partial<ProfileTroops>): void {
  const state = useStore.getState();
  const profile = selectActiveProfile(state);
  if (profile === undefined) throw new Error('no active profile');
  state.updateProfile(profile.id, (current) => ({ troops: { ...current.troops, ...next } }));
}

const stepper = (name: string) => screen.getByRole('group', { name });

/** What one end of a range reads: the only button of the stepper that carries a word. */
const shown = (name: string): string =>
  within(stepper(name)).getByRole('button', { name: /^(?:[GSEM]\d+|none)$/ }).textContent ?? '';

test('the card is the form: every group is on screen with nothing to open', () => {
  render(<TroopsSection />);

  expect(screen.getByRole('heading', { level: 2, name: 'Troops' })).toBeTruthy();
  // No disclosure to unfold: the four rows are the card.
  expect(screen.queryByRole('button', { name: /^Troops/ })).toBeNull();
  for (const group of ['Guardsmen', 'Specialists', 'Engineers', 'Monsters']) {
    expect(stepper(`${group} from`)).toBeTruthy();
  }

  // The first-run account: guardsmen I–III, specialists I, nothing else.
  expect(shown('Guardsmen from')).toBe('G1');
  expect(shown('Guardsmen to')).toBe('G3');
  expect(shown('Specialists from')).toBe('S1');
  expect(shown('Engineers from')).toBe('none');
  expect(shown('Monsters from')).toBe('none');
  expect(screen.getByRole('group', { name: 'Guardsmen at G3' })).toBeTruthy();
});

test('a group at none is its stepper and nothing else', () => {
  render(<TroopsSection />);

  expect(troops().engineers).toBeNull();
  expect(stepper('Engineers from')).toBeTruthy();
  expect(screen.queryByRole('group', { name: 'Engineers to' })).toBeNull();
  expect(screen.queryByRole('group', { name: /^Engineers at/ })).toBeNull();
  expect(shown('Engineers from')).toBe('none');
});

test('the arrow keys move one end of a range, and the two ends clamp each other', () => {
  render(<TroopsSection />);

  // G1–G3 becomes G1–G4 with a single key, which is the whole point of the stepper (R2, D-22).
  fireEvent.keyDown(stepper('Guardsmen to'), { key: 'ArrowRight' });
  expect(troops().guardsmen).toEqual({ min: 1, max: 4 });
  expect(shown('Guardsmen to')).toBe('G4');

  // "From" cannot pass "to": it stops on the tier "to" sits on.
  for (let press = 0; press < 6; press += 1) {
    fireEvent.keyDown(stepper('Guardsmen from'), { key: 'ArrowRight' });
  }
  expect(troops().guardsmen).toEqual({ min: 4, max: 4 });

  // …and "to" cannot drop below "from" either.
  fireEvent.keyDown(stepper('Guardsmen to'), { key: 'ArrowLeft' });
  fireEvent.keyDown(stepper('Guardsmen to'), { key: 'ArrowLeft' });
  expect(troops().guardsmen).toEqual({ min: 4, max: 4 });
  expect(shown('Guardsmen from')).toBe('G4');
});

test('a guardsmen tile drops the category of the top tier, and only of the top tier', () => {
  render(<TroopsSection />);

  fireEvent.click(screen.getByRole('button', { name: 'Rider III, tier 3, on' }));

  expect(troops().topTierExcluded.guardsmen).toEqual(['mounted']);
  expect(troops().excludedUnitIds).toEqual([]);
  expect(screen.getByRole('button', { name: 'Rider III, tier 3, off' })).toBeTruthy();
  // Rider I and Rider II are lower tiers: always in, and never drawn as a tile.
  expect(screen.queryByRole('button', { name: /^Rider II,/ })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Rider III, tier 3, off' }));
  expect(troops().topTierExcluded.guardsmen).toEqual([]);
});

test('a monster tile drops that one monster, because a tier has four unrelated ones', () => {
  setTroops({ monsters: { min: 3, max: 3 } });
  render(<TroopsSection />);

  fireEvent.click(screen.getByRole('button', { name: 'Battle Boar, tier 3, on' }));

  expect(troops().excludedUnitIds).toEqual(['battle-boar']);
  expect(troops().topTierExcluded).toEqual({ guardsmen: [], specialists: [] });
  expect(screen.getByRole('button', { name: 'Emerald Dragon, tier 3, on' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Battle Boar, tier 3, off' }));
  expect(troops().excludedUnitIds).toEqual([]);
});

test('a type the March left out below the top tier is named, and can be put back', () => {
  setTroops({ excludedUnitIds: ['archer-1', 'rider-2'] });
  render(<TroopsSection />);

  expect(screen.getByText('Left out:')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Put back Archer I' }));
  expect(troops().excludedUnitIds).toEqual(['rider-2']);

  // One name left, so the "all" shortcut goes with it.
  expect(screen.queryByRole('button', { name: /^Put back all/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Put back Rider II' }));
  expect(troops().excludedUnitIds).toEqual([]);
  expect(screen.queryByText('Left out:')).toBeNull();
});

test('"put back all" clears the whole group at once', () => {
  setTroops({ excludedUnitIds: ['archer-1', 'rider-2', 'battle-boar'] });
  render(<TroopsSection />);

  fireEvent.click(screen.getByRole('button', { name: 'Put back all guardsmen' }));

  // Only the guardsmen went back: the monster the March left out is not this row's business.
  expect(troops().excludedUnitIds).toEqual(['battle-boar']);
});

test('stepping a group out of none opens the rest of its row, and back again', () => {
  render(<TroopsSection />);

  expect(troops().monsters).toBeNull();
  expect(screen.queryByRole('group', { name: 'Monsters to' })).toBeNull();

  // Monsters only exist from tier 3 in the tables, so "on" cannot mean tier 1.
  fireEvent.keyDown(stepper('Monsters from'), { key: 'ArrowRight' });
  expect(troops().monsters).toEqual({ min: 3, max: 3 });
  expect(screen.getByRole('group', { name: 'Monsters to' })).toBeTruthy();
  expect(screen.getByRole('group', { name: 'Monsters at M3' })).toBeTruthy();

  // Stepping back below the first tier switches the group off again.
  fireEvent.keyDown(stepper('Monsters from'), { key: 'ArrowLeft' });
  expect(troops().monsters).toBeNull();
  expect(shown('Monsters from')).toBe('none');
});

test('engineers have a range but no tiles: one type per tier means nothing to click out', () => {
  setTroops({ engineers: { min: 1, max: 4 } });
  render(<TroopsSection />);

  expect(shown('Engineers from')).toBe('E1');
  expect(shown('Engineers to')).toBe('E4');
  expect(screen.queryByRole('group', { name: /^Engineers at/ })).toBeNull();
});

test('an account with nothing in it says what to do, above the four rows', () => {
  setTroops({ guardsmen: null, specialists: null, engineers: null, monsters: null });
  render(<TroopsSection />);

  expect(screen.getByText('Add your troops: pick the lowest and highest tier you own.')).toBeTruthy();
  expect(screen.getAllByRole('group', { name: /from$/ })).toHaveLength(4);
  expect(shown('Guardsmen from')).toBe('none');

  // Every group can be stepped out of "none", guardsmen included.
  fireEvent.keyDown(stepper('Guardsmen from'), { key: 'ArrowRight' });
  expect(troops().guardsmen).toEqual({ min: 1, max: 1 });
});
