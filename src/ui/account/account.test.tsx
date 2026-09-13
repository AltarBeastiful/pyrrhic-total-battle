// @vitest-environment jsdom
/**
 * The account as a player meets it (S-49b): rows in the menu that already exists, and the dialogs
 * that have to be read rather than clicked through — the 409, where both answers lose something and
 * the words have to say which, and the two that change or end the account.
 */
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { resetClient } from '@/account/client';
import { onRequest, resetFakePocketBase } from '@/account/fixtures';
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
  verificationSent: false,
  dialog: null,
  pending: null,
} as const;

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  useAccountStore.setState({ ...BASE });
  localStorage.clear();
  resetClient();
  resetFakePocketBase();
  vi.stubEnv('VITE_BACKEND_ORIGIN', 'https://backend.test');
});

/** Give the fake client a session, so the flows that read it have one. */
async function signIn(): Promise<void> {
  onRequest('authWithPassword', () => ({ token: 'tok', record: USER }));
  const { signInWithPassword } = await import('@/account/auth');
  await signInWithPassword(USER.email, 'password1234');
}

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

test('an unconfirmed address gets a row that explains the refusal and sends the email again', async () => {
  const user = userEvent.setup();
  useAccountStore.setState({ user: { ...USER, verified: false } });
  onRequest('requestVerification', () => true);

  const menu = await openMenu();
  const row = within(menu).getByRole('menuitem', { name: /^Confirm your email address/ });
  expect(row.textContent).toContain('Saving needs a confirmed address');

  await user.click(row);
  await vi.waitFor(() => {
    expect(useAccountStore.getState().verificationSent).toBe(true);
  });
});

test('a confirmed account is never asked to confirm anything', async () => {
  useAccountStore.setState({ user: USER });
  const menu = await openMenu();
  expect(within(menu).queryByRole('menuitem', { name: /^Confirm your email address/ })).toBeNull();
});

test('a forgotten password is answered the same way whether or not the address exists', async () => {
  const user = userEvent.setup();
  useAccountStore.setState({ dialog: 'signin' });
  onRequest('requestPasswordReset', () => true);
  renderWithTheme(<AccountDialogs />);

  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: 'Forgot your password?' }));
  await user.type(await screen.findByLabelText('Email'), 'player@example.com');
  await user.click(screen.getByRole('button', { name: 'Send the reset link' }));

  expect(await screen.findByText(/If an account exists for this address/)).toBeTruthy();
});

test('the row naming the account leads to the two errands the menu does not carry', async () => {
  const user = userEvent.setup();
  useAccountStore.setState({ user: USER });

  const menu = await openMenu();
  // The menu itself stays four rows long: a dropdown taller than the window cannot be pressed.
  expect(within(menu).queryByRole('menuitem', { name: /^Change password/ })).toBeNull();
  await user.click(within(menu).getByRole('menuitem', { name: /^Signed in as/ }));
  expect(useAccountStore.getState().dialog).toBe('account');

  cleanup();
  renderWithTheme(<AccountDialogs />);
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: 'Delete account…' }));
  expect(useAccountStore.getState().dialog).toBe('delete');
});

test('two new passwords that differ are refused before the server is asked', async () => {
  const user = userEvent.setup();
  useAccountStore.setState({ user: USER, dialog: 'password' });
  renderWithTheme(<AccountDialogs />);

  const dialog = await screen.findByRole('dialog');
  await user.type(within(dialog).getByLabelText('Current password'), 'password1234');
  await user.type(within(dialog).getByLabelText('New password'), 'newpassword12');
  await user.type(within(dialog).getByLabelText('New password again'), 'newpassword13');
  await user.click(within(dialog).getByRole('button', { name: 'Change password' }));

  expect((await screen.findByRole('alert')).textContent).toContain('The two new passwords are not the same');
});

test('a changed password says this browser is signed in again and the others are not', async () => {
  const user = userEvent.setup();
  await signIn();
  useAccountStore.setState({ user: USER, dialog: 'password' });
  onRequest('update', () => ({ ...USER }));
  onRequest('authWithPassword', () => ({ token: 'fresh', record: USER }));
  renderWithTheme(<AccountDialogs />);

  const dialog = await screen.findByRole('dialog');
  await user.type(within(dialog).getByLabelText('Current password'), 'password1234');
  await user.type(within(dialog).getByLabelText('New password'), 'newpassword12');
  await user.type(within(dialog).getByLabelText('New password again'), 'newpassword12');
  await user.click(within(dialog).getByRole('button', { name: 'Change password' }));

  expect(await screen.findByText(/every other device is signed out/)).toBeTruthy();
});

test('deleting the account interrupts, says what survives it, and confirms plainly', async () => {
  const user = userEvent.setup();
  await signIn();
  useAccountStore.setState({ user: USER, dialog: 'delete' });
  onRequest('delete', () => true);
  renderWithTheme(<AccountDialogs />);

  const dialog = await screen.findByRole('alertdialog');
  expect(within(dialog).getByText(/Your profiles in this browser are not touched/)).toBeTruthy();
  expect(within(dialog).getByRole('button', { name: 'Keep my account' })).toBeTruthy();

  await user.click(within(dialog).getByRole('button', { name: 'Delete my account' }));

  expect(await screen.findByText(/Everything in this browser is untouched/)).toBeTruthy();
  expect(useAccountStore.getState().user).toBeNull();
});
