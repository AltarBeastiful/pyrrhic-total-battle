// @vitest-environment jsdom
/**
 * The account as a player meets it (S-49b): four rows in the menu that already exists, and the one
 * dialog that has to be read rather than clicked through — the 409, where both answers lose
 * something and the words have to say which.
 */
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { useAccountStore } from '@/account/state';
import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';

import { renderWithTheme } from '../kit/testRender';
import { AccountMenu } from '../shell/AccountMenu';
import { AccountDialogs } from './AccountDialogs';

vi.mock('pocketbase', async () => {
  const { FakePocketBase, FakeAuthStore } = await import('@/account/fixtures');
  return { default: FakePocketBase, LocalAuthStore: FakeAuthStore };
});

vi.setConfig({ testTimeout: 20_000 });

const USER = { id: 'u1', email: 'player@example.com', verified: true };

const BASE = {
  enabled: true,
  user: null,
  remoteVersion: 0,
  deviceId: 'this-device',
  dirty: false,
  busy: 'none',
  notice: '',
  error: '',
  conflict: null,
  dialog: null,
  pending: null,
} as const;

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  useAccountStore.setState({ ...BASE });
});

afterEach(() => {
  cleanup();
});

async function openMenu(): Promise<HTMLElement> {
  const user = userEvent.setup();
  renderWithTheme(<AccountMenu />);
  await user.click(screen.getByRole('button', { name: /^Account:/ }));
  return screen.findByRole('menu');
}

test('a build with no backend has no account rows at all', async () => {
  useAccountStore.setState({ enabled: false });
  const menu = await openMenu();
  expect(within(menu).queryByRole('menuitem', { name: /Sign in/ })).toBeNull();
  expect(within(menu).queryByText('Account')).toBeNull();
});

test('signed out, the menu offers the two ways in', async () => {
  const menu = await openMenu();
  expect(within(menu).getByRole('menuitem', { name: /^Sign in with Google/ })).toBeTruthy();
  expect(within(menu).getByRole('menuitem', { name: /^Sign in with email/ })).toBeTruthy();
});

test('signed in, the menu says who you are and what you can do about it', async () => {
  useAccountStore.setState({ user: USER, dirty: true });
  const menu = await openMenu();
  expect(within(menu).getByRole('menuitem', { name: /Signed in as player@example\.com/ })).toBeTruthy();
  expect(within(menu).getByRole('menuitem', { name: /^Save to account/ })).toBeTruthy();
  expect(within(menu).getByRole('menuitem', { name: /^Load from account/ })).toBeTruthy();
  expect(within(menu).getByRole('menuitem', { name: /^Sign out/ })).toBeTruthy();
});

test('saving is offered only when there is something to save, and says so once it is done', async () => {
  useAccountStore.setState({ user: USER, dirty: false, notice: '' });
  let menu = await openMenu();
  // Mantine marks a disabled menu item with `data-disabled`, which is what stops the click.
  expect(
    within(menu)
      .getByRole('menuitem', { name: /^Save to account/ })
      .hasAttribute('data-disabled'),
  ).toBe(true);
  expect(within(menu).getByText('Up to date')).toBeTruthy();

  cleanup();
  useAccountStore.setState({ user: USER, dirty: false, notice: 'Saved' });
  menu = await openMenu();
  // "Saved" also names the storage state under the profile's own row; this one is the account's.
  expect(within(menu).getByRole('menuitem', { name: /^Save to account/ }).textContent).toContain('Saved');
});

test('the email row opens a dialog with a create-account toggle', async () => {
  const user = userEvent.setup();
  const menu = await openMenu();
  await user.click(within(menu).getByRole('menuitem', { name: /^Sign in with email/ }));
  expect(useAccountStore.getState().dialog).toBe('signin');

  cleanup();
  renderWithTheme(<AccountDialogs />);
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByLabelText('Email')).toBeTruthy();
  expect(within(dialog).getByLabelText('Password')).toBeTruthy();

  await user.click(within(dialog).getByRole('switch', { name: 'Create account' }));
  expect(await screen.findByRole('button', { name: 'Create account' })).toBeTruthy();
});

test('the conflict names both losses, and offers a JSON export before either', async () => {
  useAccountStore.setState({
    user: USER,
    remoteVersion: 3,
    conflict: { serverVersion: 5, updated: '2026-09-13 04:26:09.794Z' },
    dialog: 'conflict',
  });
  renderWithTheme(<AccountDialogs />);

  const dialog = await screen.findByRole('alertdialog');
  expect(within(dialog).getByText(/Both ways out lose something/)).toBeTruthy();
  expect(within(dialog).getByText(/since version 3 is discarded/)).toBeTruthy();
  expect(within(dialog).getByText(/\(version 5\) is replaced by/)).toBeTruthy();
  expect(within(dialog).getByRole('button', { name: 'Export JSON first' })).toBeTruthy();
  expect(within(dialog).getByRole('button', { name: /^Load the other device/ })).toBeTruthy();
  expect(within(dialog).getByRole('button', { name: 'Overwrite with this device' })).toBeTruthy();
});

test('loading over unsaved work asks first', async () => {
  const user = userEvent.setup();
  useAccountStore.setState({ user: USER, dirty: true });
  const menu = await openMenu();
  await user.click(within(menu).getByRole('menuitem', { name: /^Load from account/ }));
  expect(useAccountStore.getState().dialog).toBe('load');

  cleanup();
  renderWithTheme(<AccountDialogs />);
  const dialog = await screen.findByRole('alertdialog');
  expect(within(dialog).getByText(/replaced by the copy saved on your account/)).toBeTruthy();
  expect(within(dialog).getByRole('button', { name: 'Keep this browser' })).toBeTruthy();
});
