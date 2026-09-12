// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';

import { MercenariesSection } from './MercenariesSection';

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

const mercs = () => selectActiveProfile(useStore.getState())?.mercenaries;

function openCustomForm(): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: 'Custom mercenary' }));
  return screen.getByRole('dialog');
}

function fill(dialog: HTMLElement, label: string, value: string): void {
  fireEvent.change(within(dialog).getByLabelText(label), { target: { value } });
}

test('the text filter narrows the picker to matching mercenaries', () => {
  render(<MercenariesSection />);
  expect(screen.getByRole('button', { name: 'Add Abomination VI' })).toBeTruthy();

  fireEvent.change(screen.getByLabelText('Search mercenaries'), { target: { value: 'bear' } });

  expect(screen.getByRole('button', { name: 'Add Bear V' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Add Abomination VI' })).toBeNull();
});

test('facet chips combine with the text filter', () => {
  render(<MercenariesSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Specialist', pressed: false }));

  // Bear V is tagged as a monster, so a "specialist" filter must hide it.
  expect(screen.queryByRole('button', { name: 'Add Bear V' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Specialist', pressed: true }));
  expect(screen.getByRole('button', { name: 'Add Bear V' })).toBeTruthy();
});

test('adding a mercenary moves it to the owned list, where a cap can be typed', () => {
  render(<MercenariesSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Add Bear V' }));

  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: null }]);
  // It leaves the picker so the two lists never show the same mercenary twice.
  expect(screen.queryByRole('button', { name: 'Add Bear V' })).toBeNull();

  fireEvent.change(screen.getByLabelText('Bear V owned'), { target: { value: '12' } });
  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: 12 }]);

  // Clearing the field means "no limit", not zero.
  fireEvent.change(screen.getByLabelText('Bear V owned'), { target: { value: '' } });
  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: null }]);
});

test('a mercenary can be removed again', () => {
  render(<MercenariesSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Add Bear V' }));
  fireEvent.click(screen.getByRole('button', { name: 'Remove Bear V' }));

  expect(mercs()?.selected).toEqual([]);
  expect(screen.getByRole('button', { name: 'Add Bear V' })).toBeTruthy();
});

test('the custom form creates a mercenary from the values on its in-game sheet', () => {
  render(<MercenariesSection />);
  const dialog = openCustomForm();
  fill(dialog, 'Name', 'Spider Queen');
  fill(dialog, 'Health', '420000');
  fill(dialog, 'Strength', '140000');
  fill(dialog, 'Authority cost', '70');
  fill(dialog, 'Revival gold', '560');
  fill(dialog, 'Double damage chance', '5');
  fill(dialog, 'Role', 'monster');
  fill(dialog, 'Category', 'flying');
  fill(dialog, 'Race', 'beast');
  fill(dialog, 'Event', 'arachnes');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Add mercenary' }));

  const custom = mercs()?.custom ?? [];
  expect(custom).toHaveLength(1);
  expect(custom[0]).toMatchObject({
    name: 'Spider Queen',
    health: 420000,
    strength: 140000,
    cost: 70,
    revivalGold: 560,
    doubleDamageChance: 5,
    role: 'monster',
    category: 'flying',
    race: 'beast',
    event: 'arachnes',
  });
  expect(custom[0]?.id).toMatch(/^custom-[0-9a-f]{8}$/);
  expect(screen.getByRole('button', { name: 'Edit Spider Queen' })).toBeTruthy();
});

test('a custom mercenary can be edited without losing its id, and deleted', () => {
  render(<MercenariesSection />);
  const dialog = openCustomForm();
  fill(dialog, 'Name', 'Spider Queen');
  fill(dialog, 'Health', '1000');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Add mercenary' }));
  const created = mercs()?.custom[0];

  fireEvent.click(screen.getByRole('button', { name: 'Edit Spider Queen' }));
  const editor = screen.getByRole('dialog');
  expect(within(editor).getByLabelText<HTMLInputElement>('Health').value).toBe('1000');
  fill(editor, 'Name', 'Spider Matriarch');
  fireEvent.click(within(editor).getByRole('button', { name: 'Save changes' }));

  expect(mercs()?.custom).toHaveLength(1);
  expect(mercs()?.custom[0]?.id).toBe(created?.id);
  expect(mercs()?.custom[0]?.name).toBe('Spider Matriarch');

  fireEvent.click(screen.getByRole('button', { name: 'Delete Spider Matriarch' }));
  expect(mercs()?.custom).toEqual([]);
});
