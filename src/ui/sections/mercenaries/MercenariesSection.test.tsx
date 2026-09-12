// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';

import { MercenariesSection } from './MercenariesSection';

// Every render walks the whole 69-mercenary picker; under full-suite load that is slower than the
// default 5 s budget, and it is a cost of the render, not a hang.
vi.setConfig({ testTimeout: 30_000 });

beforeEach(() => {
  globalThis.localStorage.clear();
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

const mercs = () => selectActiveProfile(useStore.getState())?.mercenaries;

/** Write straight to the profile when the test is about what the card *shows*, not how you fill it. */
function own(entries: { id: string; cap: number | null }[]): void {
  const profile = selectActiveProfile(useStore.getState());
  if (profile === undefined) throw new Error('the default document has no profile');
  act(() => {
    useStore.getState().updateProfile(profile.id, (current) => ({
      mercenaries: { ...current.mercenaries, selected: entries },
    }));
  });
}

const picker = () => screen.getByRole('grid', { name: 'Add a mercenary' });
const ownedList = () => screen.getByRole('grid', { name: 'Mercenaries you own' });
const search = () => screen.getByRole('searchbox', { name: 'Find a mercenary' });

/** One row's whole line, whitespace squeezed the way a reader hears it. */
const text = (row: HTMLElement): string => (row.textContent ?? '').replace(/\s+/g, ' ').trim();

test('what you own is on the card straight away, with the quantity on the line', () => {
  render(<MercenariesSection />);
  expect(screen.getByText('None hired yet. Find one below and say how many you own.')).toBeTruthy();

  own([
    { id: 'abomination-6', cap: 22 },
    { id: 'bear-5', cap: null },
  ]);

  // No disclosure, no summary line: the list itself is the recap.
  expect(screen.queryByRole('button', { name: /^Mercenaries/ })).toBeNull();
  expect(screen.getByRole('heading', { level: 2, name: 'Mercenaries' })).toBeTruthy();

  const rows = within(ownedList()).getAllByRole('row');
  expect(rows).toHaveLength(2);
  expect(text(rows[0] as HTMLElement)).toContain('Abomination VI');
  expect(text(rows[0] as HTMLElement)).toContain('×22');
  expect(text(rows[1] as HTMLElement)).toContain('×∞');
});

test('pressing a row in the picker hires it, and pressing its own row gives it back', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);

  await user.click(within(picker()).getByRole('row', { name: 'Bear V, tier 5' }));
  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: null }]);

  // It leaves the picker, so the two lists never show the same mercenary twice.
  expect(within(picker()).queryByRole('row', { name: 'Bear V, tier 5' })).toBeNull();
  const row = within(ownedList()).getByRole('row', { name: 'Bear V, tier 5' });
  expect(row.getAttribute('aria-selected')).toBe('true');

  await user.click(row);
  expect(mercs()?.selected).toEqual([]);
  expect(within(picker()).getByRole('row', { name: 'Bear V, tier 5' })).toBeTruthy();
});

test('the stepper says how many you own, and Unlimited takes the limit off again', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);
  await user.click(within(picker()).getByRole('row', { name: 'Bear V, tier 5' }));

  const row = within(ownedList()).getByRole('row', { name: 'Bear V, tier 5' });
  const owned = within(row).getByLabelText('Owned');
  fireEvent.change(owned, { target: { value: '22' } });
  fireEvent.blur(owned);
  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: 22 }]);

  // The stepper is the row's own control: using it never unticks the row it sits in.
  expect(within(ownedList()).getByRole('row', { name: 'Bear V, tier 5' }).getAttribute('aria-selected')).toBe(
    'true',
  );

  await user.click(within(row).getByRole('button', { name: 'Increase Owned' }));
  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: 23 }]);

  const unlimited = within(row).getByRole('switch', { name: 'Unlimited' }) as HTMLInputElement;
  expect(unlimited.checked).toBe(false);
  fireEvent.click(unlimited);
  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: null }]);
  expect((within(ownedList()).getByRole('switch', { name: 'Unlimited' }) as HTMLInputElement).checked).toBe(
    true,
  );
});

test('the search field narrows the picker to what matches', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);
  expect(within(picker()).getByRole('row', { name: 'Abomination VI, tier 6' })).toBeTruthy();

  await user.type(search(), 'bear');

  expect(within(picker()).getByRole('row', { name: 'Bear V, tier 5' })).toBeTruthy();
  expect(within(picker()).queryByRole('row', { name: 'Abomination VI, tier 6' })).toBeNull();
});

test('the filter chips narrow the picker, and combine with each other', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);

  await user.click(screen.getByRole('button', { name: 'Guardsmen' }));
  // Bear V counts as a monster, so a "guardsmen" filter has to hide it.
  expect(within(picker()).queryByRole('row', { name: 'Bear V, tier 5' })).toBeNull();
  expect(within(picker()).getByRole('row', { name: 'Arbalester VI, tier 6' })).toBeTruthy();

  await user.click(screen.getByRole('button', { name: 'Tier 7' }));
  expect(within(picker()).queryByRole('row', { name: 'Arbalester VI, tier 6' })).toBeNull();
  expect(within(picker()).getByRole('row', { name: 'Arbalester VII, tier 7' })).toBeTruthy();

  await user.click(screen.getByRole('button', { name: 'Guardsmen' }));
  await user.click(screen.getByRole('button', { name: 'Tier 7' }));
  expect(within(picker()).getByRole('row', { name: 'Bear V, tier 5' })).toBeTruthy();
});

test('nothing matching says so instead of showing an empty box', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);

  await user.type(search(), 'zzz');
  expect(screen.getByText('Nothing matches those filters.')).toBeTruthy();
});

test('the last mercenaries hired come back first in the picker', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);

  await user.click(within(picker()).getByRole('row', { name: 'Bear V, tier 5' }));
  await user.click(within(ownedList()).getByRole('row', { name: 'Bear V, tier 5' }));

  const first = within(picker()).getAllByRole('row')[0];
  expect(first?.getAttribute('aria-label')).toBe('Bear V, tier 5');
});

test('once something is hired the picker folds behind one button', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);
  await user.click(within(picker()).getByRole('row', { name: 'Bear V, tier 5' }));

  await user.click(screen.getByRole('button', { name: 'Done adding' }));
  expect(screen.queryByRole('searchbox', { name: 'Find a mercenary' })).toBeNull();
  // What you own is never behind a press; only the picker is.
  expect(within(ownedList()).getByRole('row', { name: 'Bear V, tier 5' })).toBeTruthy();

  await user.click(screen.getByRole('button', { name: 'Add mercenaries' }));
  expect(search()).toBeTruthy();
});

test('the custom sheet adds a mercenary the tables do not carry', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);

  await user.click(screen.getByRole('button', { name: 'Custom mercenary' }));
  const sheet = screen.getByRole('dialog');

  await user.type(within(sheet).getByLabelText('Name'), 'Spider Queen');
  fireEvent.change(within(sheet).getByLabelText('Health'), { target: { value: '420000' } });
  fireEvent.blur(within(sheet).getByLabelText('Health'));
  fireEvent.change(within(sheet).getByLabelText('Authority cost'), { target: { value: '90' } });
  fireEvent.blur(within(sheet).getByLabelText('Authority cost'));
  await user.click(within(sheet).getByRole('button', { name: 'Add mercenary' }));

  const custom = mercs()?.custom ?? [];
  expect(custom).toHaveLength(1);
  expect(custom[0]?.name).toBe('Spider Queen');
  expect(custom[0]?.health).toBe(420000);
  expect(custom[0]?.cost).toBe(90);

  expect(within(ownedList()).getByRole('row', { name: 'Spider Queen, custom' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Edit Spider Queen' })).toBeTruthy();
});
