// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { Tabs } from './Tabs';

afterEach(cleanup);

function Sync() {
  const [value, setValue] = useState('sync');
  return (
    <Tabs
      label="Sync"
      value={value}
      onChange={setValue}
      items={[
        { value: 'sync', label: 'Pull / Push', content: <p>Nothing on either side yet.</p> },
        { value: 'settings', label: 'Settings', content: <p>GitHub token</p> },
      ]}
    />
  );
}

test('the tab row is named and only the chosen panel is mounted', () => {
  render(<Sync />);
  const list = screen.getByRole('tablist', { name: 'Sync' });
  expect(within(list).getByRole('tab', { name: 'Pull / Push' }).getAttribute('aria-selected')).toBe('true');
  expect(within(list).getByRole('tab', { name: 'Settings' }).getAttribute('aria-selected')).toBe('false');

  expect(screen.getByRole('tabpanel')).toBeTruthy();
  expect(screen.getByText('Nothing on either side yet.')).toBeTruthy();
  expect(screen.queryByText('GitHub token')).toBeNull();
});

test('clicking a tab swaps the panel', () => {
  render(<Sync />);
  fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));

  expect(screen.getByRole('tab', { name: 'Settings' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByText('GitHub token')).toBeTruthy();
  expect(screen.queryByText('Nothing on either side yet.')).toBeNull();
});

test('the arrow keys walk the row and Home returns to its first tab', () => {
  render(<Sync />);
  const first = screen.getByRole('tab', { name: 'Pull / Push' });
  first.focus();

  fireEvent.keyDown(first, { key: 'ArrowRight' });
  const second = screen.getByRole('tab', { name: 'Settings' });
  expect(document.activeElement).toBe(second);
  expect(second.getAttribute('aria-selected')).toBe('true');

  fireEvent.keyDown(second, { key: 'Home' });
  expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Pull / Push' }));
});
