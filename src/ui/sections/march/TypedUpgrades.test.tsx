// @vitest-environment jsdom
/**
 * **The player's own upgrades, drawn and edited** (W17 C2): the folded list in the advisor card, "Add an
 * upgrade" through its sheet (Enter on the last field saves), an edit that keeps the id, a delete, and the
 * checks that stay silent until the first save. What a draft may hold is `upgradeDraft.test.ts`'s; this file is
 * about the store the list writes to.
 */
import { act, cleanup, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import type { UserUpgrade } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

import { TypedUpgrades } from './TypedUpgrades';

// The line select lists 58 choices; under full-suite load opening it is slower than the default 5 s budget.
vi.setConfig({ testTimeout: 30_000 });

beforeEach(() => {
  globalThis.localStorage.clear();
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

const upgrades = () => selectActiveProfile(useStore.getState())?.upgrades;

const TALENT: UserUpgrade = {
  id: 'upgrade-talent',
  label: 'Talent: army health III',
  deltas: { health: { army: 2.5 } },
  cost: { amount: 4, unit: 'talent points' },
};

function own(list: UserUpgrade[]): void {
  const profile = selectActiveProfile(useStore.getState());
  if (profile === undefined) throw new Error('the default document has no profile');
  act(() => {
    useStore.getState().updateProfile(profile.id, () => ({ upgrades: list }));
  });
}

async function unfold(user: UserEvent): Promise<void> {
  await user.click(screen.getByRole('button', { name: /Your own upgrades/u }));
  // The fold opens on the next frame, even with Mantine's transitions off.
  await screen.findByRole('button', { name: 'Add an upgrade' });
}

async function pickLine(user: UserEvent, sheet: HTMLElement, name: string): Promise<void> {
  await user.click(within(sheet).getByRole('combobox', { name: 'What line 1 changes' }));
  await user.click(await screen.findByRole('option', { name }));
}

test('folded, its summary the count; the empty list says what to type', async () => {
  const user = userEvent.setup();
  const { unmount } = renderWithTheme(<TypedUpgrades />);
  expect(screen.getByText('none typed')).toBeTruthy();
  await unfold(user);
  expect(screen.getByText(/Type the next step of a talent tier/u)).toBeTruthy();
  expect(screen.queryAllByTestId('typed-upgrade')).toHaveLength(0);
  unmount();
  own([TALENT, { ...TALENT, id: 'upgrade-two', label: 'Modernization step 2' }]);
  renderWithTheme(<TypedUpgrades />);
  expect(screen.getByText('2 upgrades')).toBeTruthy();
});

test('add: name, a line, a cost; Enter on the last field saves it to the profile', async () => {
  const user = userEvent.setup();
  renderWithTheme(<TypedUpgrades />);
  await unfold(user);
  await user.click(screen.getByRole('button', { name: 'Add an upgrade' }));
  const sheet = await screen.findByRole('dialog', { name: 'Add an upgrade' });

  await user.type(within(sheet).getByRole('textbox', { name: 'Name' }), 'Talent: army health III');
  await pickLine(user, sheet, 'Army health');
  await user.type(within(sheet).getByRole('textbox', { name: 'What Army health adds' }), '2.5');
  await user.type(within(sheet).getByRole('textbox', { name: 'Cost' }), '4');
  await user.type(within(sheet).getByRole('textbox', { name: 'Counted in' }), 'talent points{Enter}');

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(upgrades()).toEqual([
    {
      id: expect.stringMatching(/^upgrade-/u),
      label: 'Talent: army health III',
      deltas: { health: { army: 2.5 } },
      cost: { amount: 4, unit: 'talent points' },
    },
  ]);
  const row = screen.getByTestId('typed-upgrade');
  expect(row.textContent).toContain('Talent: army health III');
  expect(row.textContent).toContain('costs 4 talent points');
  expect(screen.getByText('1 upgrade')).toBeTruthy();
});

test('edit: the sheet opens on the upgrade, and saving keeps its id and its place', async () => {
  const user = userEvent.setup();
  const other: UserUpgrade = {
    id: 'upgrade-other',
    label: 'Leadership step',
    deltas: { housing: { leadership: 500 } },
  };
  own([TALENT, other]);
  renderWithTheme(<TypedUpgrades />);
  await unfold(user);
  await user.click(screen.getByRole('button', { name: 'Edit Talent: army health III' }));
  const sheet = await screen.findByRole('dialog', { name: 'Edit upgrade' });

  const name = within(sheet).getByRole('textbox', { name: 'Name' });
  expect((name as HTMLInputElement).value).toBe('Talent: army health III');
  const figure = within(sheet).getByRole('textbox', { name: 'What Army health adds' });
  await user.clear(figure);
  await user.type(figure, '3');
  await user.click(within(sheet).getByRole('button', { name: 'Save changes' }));

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(upgrades()).toEqual([{ ...TALENT, deltas: { health: { army: 3 } } }, other]);
});

test('delete: the row goes, the others stay', async () => {
  const user = userEvent.setup();
  const other: UserUpgrade = {
    id: 'upgrade-other',
    label: 'Leadership step',
    deltas: { housing: { leadership: 500 } },
  };
  own([TALENT, other]);
  renderWithTheme(<TypedUpgrades />);
  await unfold(user);
  await user.click(screen.getByRole('button', { name: 'Delete Talent: army health III' }));
  expect(upgrades()).toEqual([other]);
  expect(screen.getAllByTestId('typed-upgrade').map((row) => row.textContent)).toEqual([
    expect.stringContaining('Leadership step'),
  ]);
});

test('validation: silent until the first save, then one sentence per wrong field, and nothing is saved', async () => {
  const user = userEvent.setup();
  renderWithTheme(<TypedUpgrades />);
  await unfold(user);
  await user.click(screen.getByRole('button', { name: 'Add an upgrade' }));
  const sheet = await screen.findByRole('dialog', { name: 'Add an upgrade' });

  expect(within(sheet).queryByText('Name the upgrade, as the game calls it.')).toBeNull();
  await user.type(within(sheet).getByRole('textbox', { name: 'Cost' }), '4');
  await user.click(within(sheet).getByRole('button', { name: 'Add upgrade' }));

  expect(within(sheet).getByText('Name the upgrade, as the game calls it.')).toBeTruthy();
  expect(within(sheet).getByRole('alert').textContent).toBe('Add at least one line the upgrade changes.');
  expect(within(sheet).getByText('Say what the cost is counted in.')).toBeTruthy();
  expect(upgrades()).toEqual([]);

  // Once tried, the checks follow every keystroke.
  await user.type(within(sheet).getByRole('textbox', { name: 'Name' }), 'Talent');
  expect(within(sheet).queryByText('Name the upgrade, as the game calls it.')).toBeNull();

  await user.click(within(sheet).getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(upgrades()).toEqual([]);
});
