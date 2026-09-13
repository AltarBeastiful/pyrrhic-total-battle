// @vitest-environment jsdom
/**
 * The account menu (design plan §5.2): every profile action a player has, behind one control, in
 * the order the plan fixes. What is tested here is what a player can name — the rows, the two
 * questions that interrupt (rename, delete) and the theme row — never how the menu is drawn.
 */
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';

import { renderWithTheme } from '../kit2/testRender';
import { AccountMenu } from './AccountMenu';

vi.setConfig({ testTimeout: 20_000 });

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  cleanup();
});

/** Open the menu; everything below starts here, because nothing of this is on the page itself. */
async function openMenu(): Promise<HTMLElement> {
  const user = userEvent.setup();
  renderWithTheme(<AccountMenu />);
  await user.click(screen.getByRole('button', { name: /^Account:/ }));
  return screen.findByRole('menu');
}

test('the menu carries the profile actions, the file actions, the link and About', async () => {
  const menu = await openMenu();
  const names = [
    'Rename profile',
    'New profile',
    'Duplicate profile',
    'Delete profile',
    'Export JSON',
    'Import JSON',
    'Sync…',
    'Share this march',
    'About Pyrrhic',
  ];
  for (const name of names) {
    expect(within(menu).getByRole('menuitem', { name: new RegExp(`^${name}`) })).toBeTruthy();
  }
  // The save state is a word under the profile's own row, not a line of permanent chrome (R5).
  expect(within(menu).getByText('Saved', { exact: true })).toBeTruthy();
});

test('the switcher lists every profile and moves to the one that is picked', async () => {
  const user = userEvent.setup();
  useStore.getState().createProfile('Second account');
  useStore.getState().setActiveProfile(useStore.getState().doc.profiles[0]?.id ?? '');

  renderWithTheme(<AccountMenu />);
  await user.click(screen.getByRole('button', { name: /^Account:/ }));
  const section = screen.getByText('Switch profile').parentElement;
  if (section === null) throw new Error('the switcher lost its heading');

  const names = within(section)
    .getAllByRole('menuitem')
    .map((item) => item.textContent);
  expect(names).toEqual(['My account', 'Second account']);

  await user.click(within(section).getByRole('menuitem', { name: 'Second account' }));
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Account: Second account' })).toBeTruthy();
  });
});

test('renaming asks for the new name in a dialog and writes it to the store', async () => {
  const user = userEvent.setup();
  const menu = await openMenu();
  await user.click(within(menu).getByRole('menuitem', { name: /^Rename profile/ }));

  const dialog = await screen.findByRole('dialog');
  const field = within(dialog).getByLabelText('Profile name');
  await user.clear(field);
  await user.type(field, 'Renamed');
  await user.click(within(dialog).getByRole('button', { name: 'Save' }));

  await waitFor(() => {
    expect(useStore.getState().doc.profiles[0]?.name).toBe('Renamed');
  });
  expect(screen.getByRole('button', { name: 'Account: Renamed' })).toBeTruthy();
});

test('deleting asks first, in a dialog that interrupts', async () => {
  const user = userEvent.setup();
  useStore.getState().createProfile('Spare');
  const menu = await openMenu();
  await user.click(within(menu).getByRole('menuitem', { name: /^Delete profile/ }));

  const dialog = await screen.findByRole('alertdialog');
  expect(dialog.textContent).toContain('Export it first');
  expect(useStore.getState().doc.profiles).toHaveLength(2);

  await user.click(within(dialog).getByRole('button', { name: 'Delete profile' }));
  await waitFor(() => {
    expect(useStore.getState().doc.profiles.map((profile) => profile.name)).toEqual(['My account']);
  });
});

test('the theme row offers the three choices and writes the one that is picked', async () => {
  const user = userEvent.setup();
  const menu = await openMenu();
  const row = within(menu).getByRole('radiogroup', { name: 'Theme' });

  for (const name of ['System', 'Light', 'Dark']) {
    expect(within(row).getByRole('radio', { name })).toBeTruthy();
  }

  await user.click(within(row).getByRole('radio', { name: 'Dark' }));
  await waitFor(() => {
    expect(useStore.getState().doc.ui.theme).toBe('dark');
  });
  // The document attribute is the frame's job (`Shell` applies it); what the menu owes is the
  // choice, and that it does not walk away — kit2's segmented row keeps the menu open.
  expect(screen.getByRole('menu')).toBeTruthy();
});
