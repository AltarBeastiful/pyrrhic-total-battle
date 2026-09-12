// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import type { ProfileTroops } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';

import { TroopsSection } from './TroopsSection';
import { TROOPS_EXPANDED } from './uiPrefs';

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

/** The one line the card always shows: the card's own button carries it. */
const header = () => screen.getByRole('button', { name: /^Troops/ });

const summaryHas = (text: string): boolean => within(header()).queryByText(text) !== null;

/** Open the card; it starts closed for an account that already has troops. */
async function open(): Promise<void> {
  const trigger = header();
  if (trigger.getAttribute('aria-expanded') === 'true') return;
  fireEvent.click(trigger);
  await waitFor(() => {
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });
}

const stepper = (name: string) => screen.getByRole('group', { name });

test('the collapsed card sums every group up in game shorthand', () => {
  render(<TroopsSection />);

  // The first-run account: guardsmen I–III, specialists I, nothing else.
  expect(summaryHas('G1–G3')).toBe(true);
  expect(summaryHas('S1')).toBe(true);
  expect(summaryHas('no engineers')).toBe(true);
  expect(summaryHas('no monsters')).toBe(true);
  expect(header().getAttribute('aria-expanded')).toBe('false');
});

test('the arrow keys move one end of a range, and the two ends clamp each other', async () => {
  render(<TroopsSection />);
  await open();

  // G1–G3 becomes G1–G4 with a single key, which is the whole point of the stepper (R2, D-22).
  fireEvent.keyDown(stepper('Guardsmen to'), { key: 'ArrowRight' });
  expect(troops().guardsmen).toEqual({ min: 1, max: 4 });
  expect(summaryHas('G1–G4')).toBe(true);

  // "From" cannot pass "to": it stops on the tier "to" sits on.
  for (let press = 0; press < 6; press += 1) {
    fireEvent.keyDown(stepper('Guardsmen from'), { key: 'ArrowRight' });
  }
  expect(troops().guardsmen).toEqual({ min: 4, max: 4 });

  // …and "to" cannot drop below "from" either.
  fireEvent.keyDown(stepper('Guardsmen to'), { key: 'ArrowLeft' });
  fireEvent.keyDown(stepper('Guardsmen to'), { key: 'ArrowLeft' });
  expect(troops().guardsmen).toEqual({ min: 4, max: 4 });

  // A single tier reads as one code, not as a range.
  expect(summaryHas('G4')).toBe(true);
});

test('a guardsmen tile drops the category of the top tier, and only of the top tier', async () => {
  render(<TroopsSection />);
  await open();

  fireEvent.click(screen.getByRole('button', { name: 'Rider III, tier 3, on' }));

  expect(troops().topTierExcluded.guardsmen).toEqual(['mounted']);
  expect(troops().excludedUnitIds).toEqual([]);
  expect(screen.getByRole('button', { name: 'Rider III, tier 3, off' })).toBeTruthy();
  // Rider I and Rider II are lower tiers: always in, and never drawn as a tile.
  expect(screen.queryByRole('button', { name: /^Rider II,/ })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Rider III, tier 3, off' }));
  expect(troops().topTierExcluded.guardsmen).toEqual([]);
});

test('a monster tile drops that one monster, because a tier has four unrelated ones', async () => {
  setTroops({ monsters: { min: 3, max: 3 } });
  render(<TroopsSection />);
  await open();

  fireEvent.click(screen.getByRole('button', { name: 'Battle Boar, tier 3, on' }));

  expect(troops().excludedUnitIds).toEqual(['battle-boar']);
  expect(troops().topTierExcluded).toEqual({ guardsmen: [], specialists: [] });
  expect(screen.getByRole('button', { name: 'Emerald Dragon, tier 3, on' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Battle Boar, tier 3, off' }));
  expect(troops().excludedUnitIds).toEqual([]);
});

test('a type the March left out below the top tier is named, and can be put back', async () => {
  setTroops({ excludedUnitIds: ['archer-1', 'rider-2'] });
  render(<TroopsSection />);
  await open();

  expect(screen.getByText('Left out:')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Put back Archer I' }));
  expect(troops().excludedUnitIds).toEqual(['rider-2']);

  // One name left, so the "all" shortcut goes with it.
  expect(screen.queryByRole('button', { name: /^Put back all/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Put back Rider II' }));
  expect(troops().excludedUnitIds).toEqual([]);
  expect(screen.queryByText('Left out:')).toBeNull();
});

test('"put back all" clears the whole group at once', async () => {
  setTroops({ excludedUnitIds: ['archer-1', 'rider-2', 'battle-boar'] });
  render(<TroopsSection />);
  await open();

  fireEvent.click(screen.getByRole('button', { name: 'Put back all guardsmen' }));

  // Only the guardsmen went back: the monster the March left out is not this row's business.
  expect(troops().excludedUnitIds).toEqual(['battle-boar']);
});

test('a group at none is one stepper, and stepping up opens the rest of the row', async () => {
  render(<TroopsSection />);
  await open();

  expect(troops().monsters).toBeNull();
  expect(stepper('Monsters from')).toBeTruthy();
  expect(screen.queryByRole('group', { name: 'Monsters to' })).toBeNull();
  expect(screen.queryByRole('group', { name: /^Monsters at/ })).toBeNull();

  // Monsters only exist from tier 3 in the tables, so "on" cannot mean tier 1.
  fireEvent.keyDown(stepper('Monsters from'), { key: 'ArrowRight' });
  expect(troops().monsters).toEqual({ min: 3, max: 3 });
  expect(screen.getByRole('group', { name: 'Monsters to' })).toBeTruthy();
  expect(screen.getByRole('group', { name: 'Monsters at M3' })).toBeTruthy();

  // Stepping back below the first tier switches the group off again.
  fireEvent.keyDown(stepper('Monsters from'), { key: 'ArrowLeft' });
  expect(troops().monsters).toBeNull();
  expect(summaryHas('no monsters')).toBe(true);
});

test('engineers have a range but no tiles: one type per tier means nothing to click out', async () => {
  setTroops({ engineers: { min: 1, max: 4 } });
  render(<TroopsSection />);
  await open();

  expect(stepper('Engineers from')).toBeTruthy();
  expect(stepper('Engineers to')).toBeTruthy();
  expect(screen.queryByRole('group', { name: /^Engineers at/ })).toBeNull();
  expect(summaryHas('E1–E4')).toBe(true);
});

test('an account with nothing in it opens the card and says what to do', () => {
  setTroops({ guardsmen: null, specialists: null, engineers: null, monsters: null });
  render(<TroopsSection />);

  expect(header().getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByText('Add your troops: pick the lowest and highest tier you own.')).toBeTruthy();
  expect(summaryHas('no guardsmen')).toBe(true);

  // Every group can be stepped out of "none", guardsmen included.
  fireEvent.keyDown(stepper('Guardsmen from'), { key: 'ArrowRight' });
  expect(troops().guardsmen).toEqual({ min: 1, max: 1 });
});

test('the card remembers whether it is open on this device', async () => {
  const { unmount } = render(<TroopsSection />);
  await open();
  expect(globalThis.localStorage.getItem('pyrrhic.ui.v1')).toContain(TROOPS_EXPANDED);

  fireEvent.click(header());
  await waitFor(() => {
    expect(header().getAttribute('aria-expanded')).toBe('false');
  });
  unmount();

  render(<TroopsSection />);
  expect(header().getAttribute('aria-expanded')).toBe('false');
  cleanup();

  globalThis.localStorage.setItem('pyrrhic.ui.v1', JSON.stringify({ [TROOPS_EXPANDED]: true }));
  render(<TroopsSection />);
  expect(header().getAttribute('aria-expanded')).toBe('true');
});
