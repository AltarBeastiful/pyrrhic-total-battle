// @vitest-environment jsdom
/**
 * The app menu: preferences, install, update and About. What is tested here is what a player can name,
 * never how the menu is drawn.
 */
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';

import { renderWithTheme } from '../kit/testRender';
import { MainMenu } from './MainMenu';

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
  renderWithTheme(<MainMenu />);
  await user.click(screen.getByRole('button', { name: 'Menu' }));
  return screen.findByRole('menu');
}

test('the menu carries the preferences and About, and nothing about profiles, files or sharing', async () => {
  const menu = await openMenu();
  expect(within(menu).getByRole('menuitem', { name: /^About Pyrrhic/ })).toBeTruthy();
  expect(within(menu).getByRole('radiogroup', { name: 'Theme' })).toBeTruthy();
  for (const name of [
    'Rename profile',
    'New profile',
    'Duplicate profile',
    'Delete profile',
    'Export JSON',
    'Import JSON',
    'Share this march',
  ]) {
    expect(within(menu).queryByRole('menuitem', { name: new RegExp(`^${name}`) })).toBeNull();
  }
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
  // choice, and that it does not walk away — kit's segmented row keeps the menu open.
  expect(screen.getByRole('menu')).toBeTruthy();
});

test('the pool line row opens on Neither and writes the pools a Generate opens with to the profile', async () => {
  const user = userEvent.setup();
  const menu = await openMenu();
  const row = within(menu).getByRole('radiogroup', { name: 'Pool line on Generate' });
  for (const name of ['Both', 'Mercs', 'Monsters', 'Neither']) {
    expect(within(row).getByRole('radio', { name })).toBeTruthy();
  }
  expect(within(row).getByRole('radio', { name: 'Neither' })).toHaveProperty('checked', true);

  await user.click(within(row).getByRole('radio', { name: 'Mercs' }));
  await waitFor(() => {
    expect(useStore.getState().doc.profiles[0]?.settings.poolLine).toBe('mercs');
  });
  expect(screen.getByRole('menu')).toBeTruthy();
});
