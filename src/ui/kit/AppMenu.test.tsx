// @vitest-environment jsdom
import { Button } from '@mantine/core';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { AppMenu, type AppMenuSection } from './AppMenu';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

function sections(onReset: () => void, onTheme: (value: string) => void): AppMenuSection[] {
  return [
    {
      id: 'profile',
      title: 'Profile',
      entries: [{ id: 'share', label: 'Share this setup', onSelect: () => {} }],
    },
    {
      id: 'look',
      entries: [
        {
          kind: 'segment',
          id: 'theme',
          label: 'Theme',
          value: 'system',
          onChange: onTheme,
          options: [
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ],
        },
      ],
    },
    {
      id: 'danger',
      entries: [{ id: 'reset', label: 'Reset everything', danger: true, onSelect: onReset }],
    },
  ];
}

test('the trigger opens a menu with its sections, and an item runs its action', async () => {
  const user = userEvent.setup();
  const onReset = vi.fn();
  renderWithTheme(
    <AppMenu label="Account" trigger={<Button>Account</Button>} sections={sections(onReset, () => {})} />,
  );
  await user.click(screen.getByRole('button', { name: 'Account' }));

  expect(await screen.findByRole('menu')).toBeTruthy();
  expect(screen.getByText('Profile')).toBeTruthy();
  await user.click(screen.getByRole('menuitem', { name: /Reset everything/ }));
  expect(onReset).toHaveBeenCalledTimes(1);
});

test('the segmented row inside the menu changes its value without closing the menu', async () => {
  const user = userEvent.setup();
  const onTheme = vi.fn();
  renderWithTheme(
    <AppMenu label="Account" trigger={<Button>Account</Button>} sections={sections(() => {}, onTheme)} />,
  );
  await user.click(screen.getByRole('button', { name: 'Account' }));
  await screen.findByRole('menu');

  await user.click(screen.getByRole('radio', { name: 'Dark' }));
  expect(onTheme).toHaveBeenCalledWith('dark');
  expect(screen.getByRole('menu')).toBeTruthy();
});
