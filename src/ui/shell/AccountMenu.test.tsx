// @vitest-environment jsdom
/**
 * D-10 — the account menu holds every action the profile bar used to spread across the page, and
 * each one keeps a name a player (and a test) can ask for.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';

import { useResultStore } from '../resultStore';
import { useUiStore } from '../uiStore';
import { AccountMenu } from './AccountMenu';

/** The two offline rows are driven by the browser; the flags stand in for it. */
const pwa = vi.hoisted(() => ({ installable: false, updateReady: false, prompted: 0, applied: 0 }));

vi.mock('@/pwa/install', () => ({
  subscribeToInstall: () => () => undefined,
  isInstallAvailable: () => pwa.installable,
  promptInstall: () => {
    pwa.prompted += 1;
    return Promise.resolve();
  },
}));

vi.mock('@/pwa/register', () => ({
  subscribeToUpdate: () => () => undefined,
  isUpdateReady: () => pwa.updateReady,
  applyUpdate: () => {
    pwa.applied += 1;
  },
}));

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  useResultStore.getState().clear();
  useUiStore.setState({ dirty: false, lastSavedAt: null, syncConflict: false });
  pwa.installable = false;
  pwa.updateReady = false;
  pwa.prompted = 0;
  pwa.applied = 0;
});

afterEach(() => {
  cleanup();
});

const profiles = () => useStore.getState().doc.profiles;
const active = () => selectActiveProfile(useStore.getState());

function trigger(): HTMLElement {
  return screen.getByRole('button', { name: /^Account:/ });
}

async function openMenu(): Promise<HTMLElement> {
  const button = trigger();
  button.focus();
  fireEvent.click(button);
  return screen.findByRole('menu');
}

/** Pick an item by its accessible name and wait for the menu to close behind it. */
async function choose(name: string | RegExp): Promise<void> {
  fireEvent.click(screen.getByRole('menuitem', { name }));
  await waitFor(() => {
    expect(screen.queryByRole('menu')).toBeNull();
  });
}

async function openDialog(item: string, role = 'dialog'): Promise<HTMLElement> {
  await openMenu();
  await choose(item);
  return screen.findByRole(role);
}

test('the trigger names the active profile and the avatar is decoration', () => {
  render(<AccountMenu />);
  expect(trigger().getAttribute('aria-label')).toBe('Account: My account');
  // The visible text is the name, so the accessible name contains what the player reads.
  expect(trigger().textContent).toContain('My account');
});

test('the menu carries every profile action, by name', async () => {
  render(<AccountMenu />);
  await openMenu();

  for (const name of [
    'Rename profile',
    'New profile',
    'Duplicate profile',
    'Delete profile',
    'Export JSON',
    'Import JSON',
    'Sync…',
    'Share this march',
    'About Pyrrhic',
  ]) {
    expect(screen.getByRole('menuitem', { name: new RegExp(`^${name}`) })).toBeTruthy();
  }

  expect(screen.getByRole('group', { name: 'Switch profile' })).toBeTruthy();
  expect(screen.getByRole('group', { name: 'Theme' })).toBeTruthy();
  // The profile name heads the menu and the save state sits under it, in one word.
  expect(screen.getByRole('group', { name: 'My account' })).toBeTruthy();
  expect(screen.getByText('Saved')).toBeTruthy();
});

test('the saved status says what the browser is doing, in one word', async () => {
  render(<AccountMenu />);
  useUiStore.getState().markDirty();
  await openMenu();
  expect(screen.getByText('Saving…')).toBeTruthy();

  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  await waitFor(() => {
    expect(screen.queryByRole('menu')).toBeNull();
  });

  useUiStore.getState().setSyncConflict(true);
  await openMenu();
  expect(screen.getByText('Sync conflict')).toBeTruthy();
});

test('the switch list ticks the active profile and switches to another', async () => {
  useStore.getState().createProfile('Second account');
  useStore.getState().setActiveProfile(profiles()[0]?.id ?? '');
  render(<AccountMenu />);

  await openMenu();
  const group = screen.getByRole('group', { name: 'Switch profile' });
  const items = within(group).getAllByRole('menuitem');
  expect(items.map((item) => item.textContent)).toEqual(['My account (active)', 'Second account']);

  await choose('Second account');
  expect(active()?.name).toBe('Second account');
});

test('Rename opens a dialog with a text field and saves the new name', async () => {
  render(<AccountMenu />);
  const dialog = await openDialog('Rename profile');

  fireEvent.change(within(dialog).getByLabelText('Profile name'), { target: { value: 'Main account' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

  await waitFor(() => {
    expect(active()?.name).toBe('Main account');
  });
  expect(profiles()).toHaveLength(1);
});

test('New profile creates one and makes it active', async () => {
  render(<AccountMenu />);
  const dialog = await openDialog('New profile');

  fireEvent.change(within(dialog).getByLabelText('Profile name'), { target: { value: 'Second account' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

  await waitFor(() => {
    expect(profiles()).toHaveLength(2);
  });
  expect(active()?.name).toBe('Second account');
});

test('Duplicate copies the profile under a fresh identity', async () => {
  render(<AccountMenu />);
  const original = active();
  const dialog = await openDialog('Duplicate profile');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Duplicate' }));

  await waitFor(() => {
    expect(profiles()).toHaveLength(2);
  });
  const copy = active();
  expect(copy?.name).toBe('My account (copy)');
  expect(copy?.id).not.toBe(original?.id);
});

test('Delete asks in an alert dialog, and cancelling keeps the profile', async () => {
  useStore.getState().createProfile('Throwaway');
  render(<AccountMenu />);
  const doomed = active();

  const dialog = await openDialog('Delete profile', 'alertdialog');
  expect(dialog.getAttribute('role')).toBe('alertdialog');
  expect(dialog.textContent).toContain('Throwaway');

  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  await waitFor(() => {
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
  expect(profiles()).toHaveLength(2);

  const again = await openDialog('Delete profile', 'alertdialog');
  fireEvent.click(within(again).getByRole('button', { name: 'Delete profile' }));

  await waitFor(() => {
    expect(profiles()).toHaveLength(1);
  });
  expect(profiles().some((profile) => profile.id === doomed?.id)).toBe(false);
  expect(useStore.getState().doc.tombstones.map((entry) => entry.id)).toContain(doomed?.id);
});

test('the theme row is a single choice that writes to the document', async () => {
  render(<AccountMenu />);
  await openMenu();

  expect(screen.getByRole('menuitemradio', { name: 'System' }).getAttribute('aria-checked')).toBe('true');
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'Dark' }));

  await waitFor(() => {
    expect(useStore.getState().doc.ui.theme).toBe('dark');
  });
});

test('Share puts the link on the clipboard and says so in a live region', async () => {
  const written: string[] = [];
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: (text: string) => {
        written.push(text);
        return Promise.resolve();
      },
    },
  });

  render(<AccountMenu />);
  await openMenu();
  await choose(/^Share this march/);

  await waitFor(() => {
    expect(screen.getByRole('status').textContent).toBe('Copied');
  });
  expect(written[0]).toContain('#c=');
});

test('the offline rows appear only when the browser offers them', async () => {
  render(<AccountMenu />);
  await openMenu();
  expect(screen.queryByRole('menuitem', { name: /^Install app/ })).toBeNull();
  expect(screen.queryByRole('menuitem', { name: /^Update available/ })).toBeNull();
  cleanup();

  pwa.installable = true;
  pwa.updateReady = true;
  render(<AccountMenu />);
  await openMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: /^Install app/ }));
  await waitFor(() => {
    expect(pwa.prompted).toBe(1);
  });

  await openMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: /^Update available/ }));
  await waitFor(() => {
    expect(pwa.applied).toBe(1);
  });
});
