// @vitest-environment jsdom
/**
 * The profile menu at the right of the bar: the active profile's name, a glyph while signed in, and a
 * dropdown with the profiles, their actions, the file actions, the account rows and the sync status.
 */
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { resetClient } from '@/account/client';
import { resetFakePocketBase } from '@/account/fixtures';
import { useAccountStore } from '@/account/state';
import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';

import { renderWithTheme } from '../kit/testRender';
import { ProfileMenu } from './ProfileMenu';
import { AppBar } from './AppBar';

vi.mock('pocketbase', async () => {
  const { FakePocketBase, FakeAuthStore } = await import('@/account/fixtures');
  return { default: FakePocketBase, LocalAuthStore: FakeAuthStore };
});

const USER = { id: 'u1', email: 'player@example.com', verified: true };

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  useAccountStore.setState({
    enabled: true,
    user: null,
    syncState: 'saved',
    busy: 'none',
    error: '',
    verificationSent: false,
    dialog: null,
    methods: null,
  });
  resetClient();
  resetFakePocketBase();
});

afterEach(() => {
  cleanup();
});

async function open(): Promise<HTMLElement> {
  const user = userEvent.setup();
  renderWithTheme(<ProfileMenu />);
  await user.click(screen.getByRole('button', { name: /^Profile:/ }));
  return screen.findByRole('menu');
}

test('the control shows the profile name, and a person glyph only while signed in', () => {
  renderWithTheme(<ProfileMenu />);
  const signedOut = screen.getByRole('button', { name: /^Profile:/ });
  expect(signedOut.textContent.trim()).toBe('My account');
  expect(signedOut.getAttribute('aria-label')).toContain('signed out');
  expect(signedOut.getAttribute('data-state')).toBe('signed-out');
  expect(signedOut.querySelector('.lucide-user-round')).toBeNull();
  expect(signedOut.querySelector('.lucide-chevron-down')).not.toBeNull();
  expect(signedOut.querySelector('.mantine-Indicator-indicator')).toBeNull();

  cleanup();
  useAccountStore.setState({ user: USER });
  renderWithTheme(<ProfileMenu />);
  const signedIn = screen.getByRole('button', { name: /^Profile:/ });
  expect(signedIn.getAttribute('aria-label')).toContain('signed in as player@example.com');
  expect(signedIn.getAttribute('data-state')).toBe('signed-in');
  expect(signedIn.querySelector('.lucide-user-round')).not.toBeNull();
});

test('the dropdown starts with the profiles, the active one checked, and picking one switches', async () => {
  const user = userEvent.setup();
  useStore.getState().createProfile('Second');
  useStore.getState().setActiveProfile(useStore.getState().doc.profiles[0]?.id ?? '');
  const menu = await open();

  const items = [
    within(menu).getByRole('menuitem', { name: /^My account/ }),
    within(menu).getByRole('menuitem', { name: /^Second/ }),
  ];
  expect(items.map((item) => item.textContent)).toEqual(['My account (active)', 'Second']);

  await user.click(within(menu).getByRole('menuitem', { name: /^Second/ }));
  await waitFor(() => {
    const state = useStore.getState();
    expect(state.doc.profiles.find((p) => p.name === 'Second')?.id).toBe(state.doc.activeProfileId);
  });
});

test('signed out: Sign in and the sync status; signed in: the account, Sign out and the status', async () => {
  const menu = await open();
  expect(within(menu).getByRole('menuitem', { name: /^Sign in…/ })).toBeTruthy();
  expect(within(menu).getByText('Saved in this browser only')).toBeTruthy();

  cleanup();
  useAccountStore.setState({ user: USER, syncState: 'saving' });
  const signedIn = await open();
  expect(within(signedIn).getByRole('menuitem', { name: /Signed in as player@example\.com/ })).toBeTruthy();
  expect(within(signedIn).getByRole('menuitem', { name: /^Sign out/ })).toBeTruthy();
  expect(within(signedIn).getByText('Saving to your account…')).toBeTruthy();
});

test('Sign in opens the sign-in dialog', async () => {
  const user = userEvent.setup();
  const menu = await open();
  await user.click(within(menu).getByRole('menuitem', { name: /^Sign in…/ }));
  expect(useAccountStore.getState().dialog).toBe('signin');
});

test('a build with no backend still offers the profiles, and no account rows', async () => {
  useAccountStore.setState({ enabled: false });
  const menu = await open();
  expect(within(menu).getByRole('menuitem', { name: /^My account \(active\)/ })).toBeTruthy();
  expect(within(menu).queryByRole('menuitem', { name: /Sign in/ })).toBeNull();
  expect(within(menu).getByText('Saved in this browser only')).toBeTruthy();
});

test('with no backend the control is signed out and the name says browser only', () => {
  useAccountStore.setState({ enabled: false });
  renderWithTheme(<ProfileMenu />);
  const button = screen.getByRole('button', { name: /^Profile:/ });
  expect(button.getAttribute('data-state')).toBe('signed-out');
  expect(button.getAttribute('aria-label')).toContain('Saved in this browser only');
});

test('the menu carries the profile actions and the file actions, and no share link', async () => {
  const menu = await open();
  for (const name of [
    'Rename profile',
    'New profile',
    'Duplicate profile',
    'Delete profile',
    'Export JSON',
    'Import JSON',
  ]) {
    expect(within(menu).getByRole('menuitem', { name: new RegExp(`^${name}`) })).toBeTruthy();
  }
  expect(within(menu).queryByRole('menuitem', { name: /Share/ })).toBeNull();
});

test('the old combined menu is gone: the app menu is the Menu button, apart from the profile menu', () => {
  renderWithTheme(<AppBar />);
  expect(screen.queryByRole('button', { name: /^Account:/ })).toBeNull();
  expect(screen.getByRole('button', { name: 'Menu' })).toBeTruthy();
});

test('renaming asks for the new name in a dialog and writes it to the store', async () => {
  const user = userEvent.setup();
  const menu = await open();
  await user.click(within(menu).getByRole('menuitem', { name: /^Rename profile/ }));

  const dialog = await screen.findByRole('dialog');
  const field = within(dialog).getByLabelText('Profile name');
  await user.clear(field);
  await user.type(field, 'Renamed');
  await user.click(within(dialog).getByRole('button', { name: 'Save' }));

  await waitFor(() => {
    expect(useStore.getState().doc.profiles[0]?.name).toBe('Renamed');
  });
});

test('deleting asks first, in a dialog that interrupts', async () => {
  const user = userEvent.setup();
  useStore.getState().createProfile('Spare');
  const menu = await open();
  await user.click(within(menu).getByRole('menuitem', { name: /^Delete profile/ }));

  const dialog = await screen.findByRole('alertdialog');
  expect(dialog.textContent).toContain('Export it first');
  expect(useStore.getState().doc.profiles).toHaveLength(2);

  await user.click(within(dialog).getByRole('button', { name: 'Delete profile' }));
  await waitFor(() => {
    expect(useStore.getState().doc.profiles.map((profile) => profile.name)).toEqual(['My account']);
  });
});
