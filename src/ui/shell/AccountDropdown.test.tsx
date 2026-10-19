// @vitest-environment jsdom
/**
 * B-17: the account as an icon-only control of its own at the right of the bar. Its dropdown opens on the
 * profile switcher, then the account rows, then the sync status. Icon-only at every width, so its name and
 * its state are spoken, not drawn (design rules 18 and 24).
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
import { AccountDropdown } from './AccountDropdown';
import { AccountMenu } from './AccountMenu';

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
  renderWithTheme(<AccountDropdown />);
  await user.click(screen.getByRole('button', { name: /^Profiles and account/ }));
  return screen.findByRole('menu');
}

test('the control is icon-only, and its name says whether anyone is signed in', () => {
  renderWithTheme(<AccountDropdown />);
  const signedOut = screen.getByRole('button', { name: /^Profiles and account/ });
  expect(signedOut.textContent.trim()).toBe('');
  expect(signedOut.getAttribute('aria-label')).toContain('signed out');
  expect(signedOut.getAttribute('data-state')).toBe('signed-out');

  cleanup();
  useAccountStore.setState({ user: USER });
  renderWithTheme(<AccountDropdown />);
  const signedIn = screen.getByRole('button', { name: /^Profiles and account/ });
  expect(signedIn.getAttribute('aria-label')).toContain('signed in as player@example.com');
  expect(signedIn.getAttribute('data-state')).toBe('signed-in');
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
});

test('the old combined menu no longer carries the profile switcher or the account rows', async () => {
  useAccountStore.setState({ user: USER });
  const user = userEvent.setup();
  renderWithTheme(<AccountMenu />);
  await user.click(screen.getByRole('button', { name: /^Account:/ }));
  const menu = await screen.findByRole('menu');
  expect(within(menu).queryByText('Switch profile')).toBeNull();
  expect(within(menu).queryByRole('menuitem', { name: /^Sign out/ })).toBeNull();
  expect(within(menu).getByRole('menuitem', { name: /^Rename profile/ })).toBeTruthy();
});
