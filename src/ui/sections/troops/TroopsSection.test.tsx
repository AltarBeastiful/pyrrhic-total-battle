// @vitest-environment jsdom
/**
 * The Troops block, asked for the way a player meets it: by role and by the words on screen. The
 * two ends of a range are `combobox`es named "Guardsmen from" / "Guardsmen to"; the top tier is a
 * named `group` of `checkbox` chips; "Put back" is a button. Nothing here knows a class name.
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

/** One end of a range. Its value is the tier as a number, or "—" when the group is unused. */
const end = (name: string): HTMLSelectElement => screen.getByRole('combobox', { name }) as HTMLSelectElement;

const option = (name: string, label: string): HTMLOptionElement =>
  within(end(name)).getByRole('option', { name: label }) as HTMLOptionElement;

const chip = (name: string): HTMLInputElement => screen.getByRole('checkbox', { name }) as HTMLInputElement;

test('the block is the form: four groups, both ends of every range, nothing to unfold', () => {
  renderWithTheme(<TroopsSection />);

  expect(screen.getByRole('heading', { level: 2, name: 'Troops' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Troops/ })).toBeNull();
  // Four rows, two ends each — engineers and monsters keep their "to" even when unused.
  expect(screen.getAllByRole('combobox')).toHaveLength(8);

  // The first-run account: guardsmen I–III, specialists I, nothing else.
  expect(end('Guardsmen from').value).toBe('1');
  expect(end('Guardsmen to').value).toBe('3');
  expect(end('Specialists from').value).toBe('1');

  // The top tier is a named group of chips, each one an emoji and the type's short code.
  const top = screen.getByRole('group', { name: 'Guardsmen at G3' });
  expect(within(top).getAllByRole('checkbox')).toHaveLength(3);
  expect(within(top).getByText('RD')).toBeTruthy();
  expect(chip('Rider III').checked).toBe(true);
});

test('a group with nothing in it reads "—" at both ends and has no chips', () => {
  renderWithTheme(<TroopsSection />);

  expect(troops().engineers).toBeNull();
  expect(end('Engineers from').value).toBe('—');
  expect(end('Engineers to').value).toBe('—');
  expect(screen.queryByRole('group', { name: /^Engineers at/ })).toBeNull();
  expect(end('Monsters to').value).toBe('—');
});

test('the highest tier widens the range, and the lowest cannot pass it', async () => {
  const user = userEvent.setup();
  renderWithTheme(<TroopsSection />);

  await user.selectOptions(end('Guardsmen to'), '4');
  expect(troops().guardsmen).toEqual({ min: 1, max: 4 });
  expect(screen.getByRole('group', { name: 'Guardsmen at G4' })).toBeTruthy();

  await user.selectOptions(end('Guardsmen to'), '2');
  expect(troops().guardsmen).toEqual({ min: 1, max: 2 });
  // "From" may not offer a tier above "to"…
  expect(option('Guardsmen from', 'G3').disabled).toBe(true);
  expect(option('Guardsmen from', 'G2').disabled).toBe(false);
});

test('the lowest tier clamps the highest from the other side', async () => {
  const user = userEvent.setup();
  renderWithTheme(<TroopsSection />);

  await user.selectOptions(end('Guardsmen from'), '3');
  expect(troops().guardsmen).toEqual({ min: 3, max: 3 });
  // …and "to" may not drop below "from".
  expect(option('Guardsmen to', 'G2').disabled).toBe(true);
  expect(option('Guardsmen to', 'G4').disabled).toBe(false);
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

  await user.selectOptions(end('Guardsmen to'), '4');
  expect(troops().topTierExcluded.guardsmen).toEqual([]);
  expect(chip('Rider IV').checked).toBe(true);
});

test('a type the March left out below the top tier is named, and goes back in one press', async () => {
  const user = userEvent.setup();
  setTroops({ excludedUnitIds: ['archer-1', 'rider-2'] });
  renderWithTheme(<TroopsSection />);

  expect(screen.getByText(/Left out: Archer I, Rider II/)).toBeTruthy();

  await user.click(screen.getByRole('button', { name: 'Put back left-out guardsmen' }));

  expect(troops().excludedUnitIds).toEqual([]);
  expect(screen.queryByText(/Left out:/)).toBeNull();
});

test('engineers have a range but no chips: one type per tier means nothing to click out', () => {
  setTroops({ engineers: { min: 1, max: 4 } });
  renderWithTheme(<TroopsSection />);

  expect(end('Engineers from').value).toBe('1');
  expect(end('Engineers to').value).toBe('4');
  expect(screen.queryByRole('group', { name: /^Engineers at/ })).toBeNull();
});

test('a group comes out of "—" and goes back into it', async () => {
  const user = userEvent.setup();
  renderWithTheme(<TroopsSection />);

  // Monsters only exist from tier 3 in the tables, so "on" cannot mean tier 1.
  await user.selectOptions(end('Monsters from'), '3');
  expect(troops().monsters).toEqual({ min: 3, max: 3 });
  expect(screen.getByRole('group', { name: 'Monsters at M3' })).toBeTruthy();

  await user.selectOptions(end('Monsters from'), '—');
  expect(troops().monsters).toBeNull();
  expect(end('Monsters from').value).toBe('—');
  expect(screen.queryByRole('group', { name: /^Monsters at/ })).toBeNull();
});

test('an account with nothing in it says what to do, above the four rows', async () => {
  const user = userEvent.setup();
  setTroops({ guardsmen: null, specialists: null, engineers: null, monsters: null });
  renderWithTheme(<TroopsSection />);

  expect(screen.getByText('Add your troops: pick the lowest and highest tier you own.')).toBeTruthy();
  expect(screen.getAllByRole('combobox')).toHaveLength(8);
  expect(end('Guardsmen from').value).toBe('—');

  // Every group can be brought out of "—", guardsmen included.
  await user.selectOptions(end('Guardsmen from'), '1');
  expect(troops().guardsmen).toEqual({ min: 1, max: 1 });
});
