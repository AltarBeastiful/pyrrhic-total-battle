// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';

import { MoonIcon, SunIcon, TrashIcon } from '../icons';
import { Button } from './Button';
import { Menu, MenuItem, MenuSection, MenuSegment } from './Menu';

afterEach(cleanup);

function openMenu(name = 'Account') {
  const trigger = screen.getByRole('button', { name });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

function Example({ onDelete = () => {} }: { onDelete?: () => void }) {
  return (
    <Menu trigger={<Button>Account</Button>} label="Account actions">
      <MenuSection title="Profiles">
        <MenuItem id="aydael" description="Active">
          Aydael
        </MenuItem>
        <MenuItem id="alt">Second profile</MenuItem>
      </MenuSection>
      <MenuSection>
        <MenuItem id="delete" icon={<TrashIcon />} isDanger onAction={onDelete}>
          Delete this profile
        </MenuItem>
        <MenuItem id="locked" isDisabled>
          Sync…
        </MenuItem>
      </MenuSection>
    </Menu>
  );
}

test('the trigger opens a named menu of items', async () => {
  render(<Example />);
  openMenu();

  // React Aria labels the list with its trigger; `label` is the fallback name it carries.
  const menu = await screen.findByRole('menu');
  expect(menu.getAttribute('aria-label')).toBe('Account actions');
  expect(screen.getAllByRole('menuitem')).toHaveLength(4);
  expect(screen.getByRole('group', { name: 'Profiles' })).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: /Second profile/ })).toBeTruthy();
});

test('the arrow keys walk the items', async () => {
  render(<Example />);
  openMenu();
  const menu = await screen.findByRole('menu');

  // React Aria moves focus into the list as it opens.
  await waitFor(() => expect(document.activeElement?.textContent).toContain('Aydael'));

  await act(async () => {
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyUp(menu, { key: 'ArrowDown' });
  });
  expect(document.activeElement?.textContent).toContain('Second profile');

  await act(async () => {
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    fireEvent.keyUp(menu, { key: 'ArrowUp' });
  });
  expect(document.activeElement?.textContent).toContain('Aydael');
});

test('choosing an item runs its action and closes the menu', async () => {
  const onDelete = vi.fn();
  render(<Example onDelete={onDelete} />);
  openMenu();
  await screen.findByRole('menu');

  fireEvent.click(screen.getByRole('menuitem', { name: /Delete this profile/ }));
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  expect(onDelete).toHaveBeenCalledTimes(1);
});

test('Esc closes the menu and focus goes back to the trigger', async () => {
  render(<Example />);
  const trigger = openMenu();
  const menu = await screen.findByRole('menu');

  await act(async () => {
    fireEvent.keyDown(menu, { key: 'Escape' });
    fireEvent.keyUp(menu, { key: 'Escape' });
  });

  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

function ThemeExample() {
  const [theme, setTheme] = useState('system');
  return (
    <>
      <Menu trigger={<Button>Account</Button>} label="Account actions">
        <MenuSegment
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light', icon: <SunIcon /> },
            { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
          ]}
        />
      </Menu>
      <output>{theme}</output>
    </>
  );
}

test('a segmented row is a single-choice group inside the menu', async () => {
  render(<ThemeExample />);
  openMenu();
  await screen.findByRole('menu');

  const options = screen.getAllByRole('menuitemradio');
  expect(options).toHaveLength(3);
  expect(screen.getByRole('menuitemradio', { name: 'System' }).getAttribute('aria-checked')).toBe('true');
  expect(screen.getByRole('group', { name: 'Theme' })).toBeTruthy();

  fireEvent.click(screen.getByRole('menuitemradio', { name: 'Dark' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('dark'));
});
