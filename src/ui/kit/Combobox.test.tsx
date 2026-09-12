// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import type { ComboboxSection } from './Combobox';
import { Combobox } from './Combobox';

afterEach(cleanup);

const SECTIONS: ComboboxSection[] = [
  {
    id: 'tier-6',
    title: 'Tier VI',
    tone: 'text-tier-6',
    items: [
      { id: 'abomination-6', label: 'Abomination VI, tier 6' },
      { id: 'arbalester-6', label: 'Arbalester VI, tier 6' },
    ],
  },
  {
    id: 'tier-5',
    title: 'Tier V',
    tone: 'text-tier-5',
    items: [{ id: 'bear-5', label: 'Bear V, tier 5' }],
  },
];

function Picker({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <Combobox
      label="Add a mercenary"
      placeholder="Name or code"
      description="Grouped by tier, strongest first."
      sections={SECTIONS}
      onSelect={onSelect}
      emptyState="No mercenary of that name."
    />
  );
}

const field = (): HTMLElement => screen.getByRole('combobox', { name: 'Add a mercenary' });

test('the field carries its label, its placeholder and its one quiet line', () => {
  render(<Picker onSelect={() => {}} />);
  expect(field().getAttribute('placeholder')).toBe('Name or code');
  expect(screen.getByText('Grouped by tier, strongest first.')).toBeTruthy();
  expect(screen.queryByRole('listbox')).toBeNull();
});

test('focus opens the whole list, grouped by tier, highest first', async () => {
  const user = userEvent.setup();
  render(<Picker onSelect={() => {}} />);

  await user.click(field());

  const listbox = await screen.findByRole('listbox');
  const headings = within(listbox)
    .getAllByRole('group')
    .map((group) => group.textContent ?? '');
  expect(headings[0]).toContain('Tier VI');
  expect(headings[1]).toContain('Tier V');
  expect(within(listbox).getAllByRole('option')).toHaveLength(3);
});

test('typing narrows every group at once, and an empty group goes with it', async () => {
  const user = userEvent.setup();
  render(<Picker onSelect={() => {}} />);

  await user.click(field());
  await user.type(field(), 'bear');

  const listbox = await screen.findByRole('listbox');
  expect(within(listbox).getByRole('option', { name: 'Bear V, tier 5' })).toBeTruthy();
  expect(within(listbox).queryByRole('option', { name: 'Abomination VI, tier 6' })).toBeNull();
  expect(within(listbox).getAllByRole('group')).toHaveLength(1);
});

test('a press reports the row, empties the field and leaves the list open for the next one', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<Picker onSelect={onSelect} />);

  await user.click(field());
  await user.type(field(), 'bear');
  await user.click(await screen.findByRole('option', { name: 'Bear V, tier 5' }));

  expect(onSelect).toHaveBeenCalledWith('bear-5');
  expect((field() as HTMLInputElement).value).toBe('');
  // Still open, and showing everything again: hiring six mercenaries is six presses.
  const listbox = await screen.findByRole('listbox');
  expect(within(listbox).getAllByRole('option')).toHaveLength(3);
});

test('the arrow keys and Enter pick without touching the pointer', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<Picker onSelect={onSelect} />);

  await user.click(field());
  await screen.findByRole('listbox');
  await user.keyboard('{ArrowDown}{Enter}');

  expect(onSelect).toHaveBeenCalledWith('abomination-6');
  expect((field() as HTMLInputElement).value).toBe('');
});

test('a word that matches nothing says so, and is never a value of its own', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<Picker onSelect={onSelect} />);

  await user.click(field());
  await user.type(field(), 'zzz');

  await waitFor(() => {
    expect(screen.getByText('No mercenary of that name.')).toBeTruthy();
  });
  await user.keyboard('{Enter}');
  expect(onSelect).not.toHaveBeenCalled();
  expect((field() as HTMLInputElement).value).toBe('zzz');
});
