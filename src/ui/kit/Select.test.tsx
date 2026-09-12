// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { Select } from './Select';

afterEach(cleanup);

const METHODS = [
  { value: 'ladder', label: 'Tier ladder', description: 'The highest tiers go in first' },
  { value: 'troops', label: 'Troops first' },
  { value: 'own', label: 'Your own order' },
];

function Method({ start = 'ladder' }: { start?: string | null }) {
  const [value, setValue] = useState<string | null>(start);
  return (
    <>
      <Select
        label="Method"
        value={value}
        onChange={setValue}
        options={METHODS}
        placeholder="Choose a method"
      />
      <output>{value ?? 'none'}</output>
    </>
  );
}

function shown(): string {
  return screen.getByRole('status').textContent ?? '';
}

function trigger(): HTMLElement {
  return screen.getByRole('button');
}

test('Select shows the chosen option and is named by its label', () => {
  render(<Method />);
  expect(trigger().textContent).toContain('Tier ladder');
  expect(trigger().getAttribute('aria-labelledby')).not.toBeNull();
  expect(screen.getByText('Method')).toBeDefined();
});

test('Select falls back to its placeholder, never to a bare label', () => {
  render(<Method start={null} />);
  expect(trigger().textContent).toContain('Choose a method');
});

test('Select opens with Enter and picks with the arrow keys', async () => {
  render(<Method />);
  const button = trigger();
  button.focus();
  fireEvent.keyDown(button, { key: 'Enter' });
  fireEvent.keyUp(button, { key: 'Enter' });

  const listbox = await screen.findByRole('listbox');
  expect(within(listbox).getByRole('option', { name: /Troops first/ })).toBeDefined();

  const focused = document.activeElement ?? listbox;
  fireEvent.keyDown(focused, { key: 'ArrowDown' });
  fireEvent.keyUp(focused, { key: 'ArrowDown' });

  const chosen = document.activeElement ?? listbox;
  fireEvent.keyDown(chosen, { key: 'Enter' });
  fireEvent.keyUp(chosen, { key: 'Enter' });

  await waitFor(() => {
    expect(screen.queryByRole('listbox')).toBeNull();
  });
  expect(shown()).toBe('troops');
});

test('an option can carry a description without losing its name', async () => {
  render(<Method />);
  fireEvent.click(trigger());

  const listbox = await screen.findByRole('listbox');
  const option = within(listbox).getByRole('option', { name: /Tier ladder/ });
  expect(option.textContent).toContain('The highest tiers go in first');

  fireEvent.click(within(listbox).getByRole('option', { name: /Your own order/ }));
  await waitFor(() => {
    expect(screen.queryByRole('listbox')).toBeNull();
  });
  expect(shown()).toBe('own');
});
