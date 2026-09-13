// @vitest-environment jsdom
/**
 * The Troops block, asked for the way a player meets it: by role and by the words on screen. The
 * two ends of a range are **steppers** — `spinbutton`s named "Guardsmen from" / "Guardsmen to",
 * each between two arrow buttons (owner, 2026-09-13); the top tier is a named `group` of `checkbox`
 * chips. Nothing here knows a class name.
 *
 * The block writes **technology** and nothing else: the tiers the account has unlocked and, at the
 * top tier, the types it owns. What a march leaves out lives on the battle setup, so it never shows
 * up here — the last test below is what holds that line.
 */
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import type { ProfileTroops } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

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

/** One end of a range: the stepper's value, written with its prefix ("G3") or "—" when unused. */
const end = (name: string): string =>
  screen.getByRole('spinbutton', { name }).getAttribute('aria-valuetext') ?? '';

/** One of a stepper's two arrows. */
const arrow = (name: string, direction: 'up' | 'down'): HTMLButtonElement =>
  screen.getByRole('button', { name: `${name}: one tier ${direction}` }) as HTMLButtonElement;

/** Walk one end of a range by `steps` positions; negative walks down. */
async function step(user: ReturnType<typeof userEvent.setup>, name: string, steps: number): Promise<void> {
  const direction = steps < 0 ? 'down' : 'up';
  for (let i = 0; i < Math.abs(steps); i += 1) await user.click(arrow(name, direction));
}

const chip = (name: string): HTMLInputElement => screen.getByRole('checkbox', { name }) as HTMLInputElement;

test('the block is the form: four groups, both ends of every range, nothing to unfold', () => {
  renderWithTheme(<TroopsSection />);

  expect(screen.getByRole('heading', { level: 2, name: 'Troops' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Troops/ })).toBeNull();
  // Four rows, two ends each — engineers and monsters keep their "to" even when unused.
  expect(screen.getAllByRole('spinbutton')).toHaveLength(8);

  // The first-run account: guardsmen I–III, specialists I, nothing else.
  expect(end('Guardsmen from')).toBe('G1');
  expect(end('Guardsmen to')).toBe('G3');
  expect(end('Specialists from')).toBe('S1');

  // The top tier is a named group of chips, each one an emoji and the type's short code.
  const top = screen.getByRole('group', { name: 'Guardsmen at G3' });
  expect(within(top).getAllByRole('checkbox')).toHaveLength(3);
  expect(within(top).getByText('RD')).toBeTruthy();
  expect(chip('Rider III').checked).toBe(true);
});

test('a group with nothing in it reads "—" at both ends and has no chips', () => {
  renderWithTheme(<TroopsSection />);

  expect(troops().engineers).toBeNull();
  expect(end('Engineers from')).toBe('—');
  expect(end('Engineers to')).toBe('—');
  expect(screen.queryByRole('group', { name: /^Engineers at/ })).toBeNull();
  expect(end('Monsters to')).toBe('—');
});

test('the highest tier widens the range, and the lowest cannot pass it', async () => {
  const user = userEvent.setup();
  renderWithTheme(<TroopsSection />);

  await step(user, 'Guardsmen to', 1);
  expect(troops().guardsmen).toEqual({ min: 1, max: 4 });
  expect(screen.getByRole('group', { name: 'Guardsmen at G4' })).toBeTruthy();

  await step(user, 'Guardsmen to', -2);
  expect(troops().guardsmen).toEqual({ min: 1, max: 2 });
  // "From" may not step above "to": at G2 its up arrow is already at the end of the window.
  await step(user, 'Guardsmen from', 5);
  expect(end('Guardsmen from')).toBe('G2');
  expect(arrow('Guardsmen from', 'up').disabled).toBe(true);
});

test('the lowest tier clamps the highest from the other side', async () => {
  const user = userEvent.setup();
  renderWithTheme(<TroopsSection />);

  await step(user, 'Guardsmen from', 2);
  expect(troops().guardsmen).toEqual({ min: 3, max: 3 });
  // …and "to" may not drop below "from".
  expect(arrow('Guardsmen to', 'down').disabled).toBe(true);
  expect(arrow('Guardsmen to', 'up').disabled).toBe(false);
});

test('a guardsmen chip drops the category of the top tier, and only of the top tier', async () => {
  const user = userEvent.setup();
  renderWithTheme(<TroopsSection />);

  await user.click(chip('Rider III'));

  expect(troops().topTierExcluded.guardsmen).toEqual(['mounted']);
  expect(troops().excludedUnitIds).toEqual([]);
  expect(chip('Rider III').checked).toBe(false);
  // Rider I and Rider II are lower tiers: always in, and never drawn as a chip.
  expect(screen.queryByRole('checkbox', { name: 'Rider II' })).toBeNull();

  await user.click(chip('Rider III'));
  expect(troops().topTierExcluded.guardsmen).toEqual([]);
});

test('a monster chip drops that one monster, because a tier has four unrelated ones', async () => {
  const user = userEvent.setup();
  setTroops({ monsters: { min: 3, max: 3 } });
  renderWithTheme(<TroopsSection />);

  await user.click(chip('Battle Boar'));

  expect(troops().excludedUnitIds).toEqual(['battle-boar']);
  expect(troops().topTierExcluded).toEqual({ guardsmen: [], specialists: [] });
  expect(chip('Emerald Dragon').checked).toBe(true);

  await user.click(chip('Battle Boar'));
  expect(troops().excludedUnitIds).toEqual([]);
});

test('moving the top tier forgets the chips, because they described the tier below', async () => {
  const user = userEvent.setup();
  renderWithTheme(<TroopsSection />);

  await user.click(chip('Rider III'));
  expect(troops().topTierExcluded.guardsmen).toEqual(['mounted']);

  await step(user, 'Guardsmen to', 1);
  expect(troops().topTierExcluded.guardsmen).toEqual([]);
  expect(chip('Rider IV').checked).toBe(true);
});

test('what a march leaves out is not on this card: no left-out line and nothing to put back', () => {
  // The March keeps its own left-out list with the result on screen (S-53), and the account still
  // owns every type, so the card says nothing about them and offers no way to "put them back".
  renderWithTheme(<TroopsSection />);

  expect(screen.queryByText(/Left out/)).toBeNull();
  expect(screen.queryByRole('button', { name: /[Pp]ut back/ })).toBeNull();
  expect(troops().excludedUnitIds).toEqual([]);
  // The chips of the top tier are the card's only per-type control, and they are all still ticked.
  expect(chip('Rider III').checked).toBe(true);
});

test('engineers have a range but no chips: one type per tier means nothing to click out', () => {
  setTroops({ engineers: { min: 1, max: 4 } });
  renderWithTheme(<TroopsSection />);

  expect(end('Engineers from')).toBe('E1');
  expect(end('Engineers to')).toBe('E4');
  expect(screen.queryByRole('group', { name: /^Engineers at/ })).toBeNull();
});

test('a group comes out of "—" and goes back into it', async () => {
  const user = userEvent.setup();
  renderWithTheme(<TroopsSection />);

  // Monsters only exist from tier 3 in the tables, so the first step out of "—" is M3.
  await step(user, 'Monsters from', 1);
  expect(troops().monsters).toEqual({ min: 3, max: 3 });
  expect(screen.getByRole('group', { name: 'Monsters at M3' })).toBeTruthy();

  await step(user, 'Monsters from', -1);
  expect(troops().monsters).toBeNull();
  expect(end('Monsters from')).toBe('—');
  expect(screen.queryByRole('group', { name: /^Monsters at/ })).toBeNull();
});

test('an account with nothing in it says what to do, above the four rows', async () => {
  const user = userEvent.setup();
  setTroops({ guardsmen: null, specialists: null, engineers: null, monsters: null });
  renderWithTheme(<TroopsSection />);

  expect(screen.getByText('Add your troops: pick the lowest and highest tier you own.')).toBeTruthy();
  expect(screen.getAllByRole('spinbutton')).toHaveLength(8);
  expect(end('Guardsmen from')).toBe('—');

  // Every group can be brought out of "—", guardsmen included.
  await step(user, 'Guardsmen from', 1);
  expect(troops().guardsmen).toEqual({ min: 1, max: 1 });
});
