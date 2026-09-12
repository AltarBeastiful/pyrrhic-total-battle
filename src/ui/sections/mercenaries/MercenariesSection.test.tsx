// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';

import { MercenariesSection } from './MercenariesSection';

// Opening the picker walks the whole 69-mercenary table; under full-suite load that is slower than
// the default 5 s budget, and it is a cost of the render, not a hang.
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

const camp = () => screen.getByRole('list', { name: 'Mercenaries you own' });
const pills = () => within(camp()).getAllByRole('listitem');
const picker = () => screen.getByRole('combobox', { name: 'Add a mercenary' });

/** Open the picker and narrow it to one name, the way a player finds a mercenary. */
async function find(user: ReturnType<typeof userEvent.setup>, query: string): Promise<HTMLElement> {
  await user.click(picker());
  await user.type(picker(), query);
  return screen.findByRole('listbox');
}

/**
 * Close the picker again. While it is open React Aria hides the rest of the page from assistive
 * tech — which is what a combobox owes a screen reader — so the camp is read *after* it is shut.
 */
async function shut(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.keyboard('{Escape}');
}

/** One pill's whole line, whitespace squeezed the way a reader hears it. */
const text = (pill: HTMLElement): string => (pill.textContent ?? '').replace(/\s+/g, ' ').trim();

test('an empty camp is the picker and one line of guidance, and no chips', () => {
  render(<MercenariesSection />);

  expect(screen.queryByRole('list', { name: 'Mercenaries you own' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Deselect all' })).toBeNull();
  expect(picker()).toBeTruthy();
  expect(screen.getByText('Type a name, or open the list: mercenaries are grouped by tier.')).toBeTruthy();
  // The Tier / Role / Race chips are gone (owner, 2026-09-13).
  expect(screen.queryByRole('button', { name: 'Guardsmen' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Tier 7' })).toBeNull();
});

test('what you own is a row of pills, lowest tier first, counted in the heading', () => {
  render(<MercenariesSection />);

  own([
    { id: 'bear-5', cap: null },
    { id: 'arbalester-7', cap: 8 },
    { id: 'abomination-6', cap: 22 },
  ]);

  expect(screen.getByText('(3 selected)')).toBeTruthy();
  const lines = pills().map(text);
  // Code, tier numeral and quantity, in that order, climbing the tiers.
  expect(lines[0]).toContain('BER');
  expect(lines[0]).toContain('×∞');
  expect(lines[1]).toContain('ABM');
  expect(lines[1]).toContain('VI');
  expect(lines[1]).toContain('×22');
  expect(lines[2]).toContain('ABT');
  expect(lines[2]).toContain('×8');
  // The name is what a screen reader hears, and the tier is spelled out with it.
  expect(within(pills()[1] as HTMLElement).getByText('Abomination VI')).toBeTruthy();
  expect(within(pills()[1] as HTMLElement).getByText('tier 6')).toBeTruthy();
});

test('the picker is grouped by tier from the lowest up, and narrows to what you type', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);

  const listbox = await find(user, 'arbalester');
  const groups = within(listbox).getAllByRole('group');
  expect(groups.map((group) => group.firstElementChild?.textContent)).toEqual(['Tier VI', 'Tier VII']);
  expect(within(listbox).getByRole('option', { name: 'Arbalester VI, tier 6' })).toBeTruthy();
  expect(within(listbox).queryByRole('option', { name: 'Bear V, tier 5' })).toBeNull();
  await shut(user);
});

test('picking a mercenary adds its pill, and the cross gives it back', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);

  const listbox = await find(user, 'bear');
  await user.click(within(listbox).getByRole('option', { name: 'Bear V, tier 5' }));
  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: null }]);

  // The list stays open for the next pick, and what was hired has left it: the camp and the picker
  // never show the same mercenary twice.
  expect(screen.getByRole('listbox')).toBeTruthy();
  expect(screen.queryByRole('option', { name: 'Bear V, tier 5' })).toBeNull();
  await shut(user);

  expect(pills()).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Remove Bear V' }));
  expect(mercs()?.selected).toEqual([]);
  expect(screen.queryByRole('list', { name: 'Mercenaries you own' })).toBeNull();
});

test('the quantity opens its own editor: a plain field that selects itself, and an Unlimited switch', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);
  own([{ id: 'bear-5', cap: null }]);

  await user.click(screen.getByRole('button', { name: 'Bear V: owned unlimited' }));
  const editor = await screen.findByRole('dialog');

  const owned = within(editor).getByLabelText('Owned');
  // An owned count is typed, not walked to (owner, 2026-09-13).
  expect(within(editor).queryByRole('button', { name: 'Increase Owned' })).toBeNull();
  expect(within(editor).queryByRole('button', { name: 'Decrease Owned' })).toBeNull();

  fireEvent.change(owned, { target: { value: '22' } });
  fireEvent.blur(owned);
  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: 22 }]);

  fireEvent.focus(owned);
  expect((owned as HTMLInputElement).selectionEnd).toBe((owned as HTMLInputElement).value.length);

  const unlimited = within(editor).getByRole('switch', { name: 'Unlimited' }) as HTMLInputElement;
  expect(unlimited.checked).toBe(false);
  fireEvent.click(unlimited);
  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: null }]);

  await user.keyboard('{Escape}');
  expect(text(pills()[0] as HTMLElement)).toContain('×∞');
});

test('Deselect all empties the camp in one press', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);
  own([
    { id: 'bear-5', cap: null },
    { id: 'abomination-6', cap: 22 },
  ]);

  await user.click(screen.getByRole('button', { name: 'Deselect all' }));
  expect(mercs()?.selected).toEqual([]);
  expect(screen.queryByRole('list', { name: 'Mercenaries you own' })).toBeNull();
});

test('a name the tables do not carry says so, and is never hired by accident', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);

  await find(user, 'spider queen');
  expect(screen.getByText('No mercenary of that name. Add it by hand below.')).toBeTruthy();

  await user.keyboard('{Enter}');
  expect(mercs()?.selected).toEqual([]);
  await shut(user);
});

test('the custom sheet adds a mercenary the tables do not carry', async () => {
  const user = userEvent.setup();
  render(<MercenariesSection />);

  await user.click(screen.getByRole('button', { name: 'Custom mercenary…' }));
  // The sheet is a chunk of its own (T-06); Vitest transforms it on demand, so give it a moment.
  const sheet = await screen.findByRole('dialog', {}, { timeout: 10_000 });

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

  const pill = pills()[0] as HTMLElement;
  expect(text(pill)).toContain('Custom');
  expect(within(pill).getByRole('button', { name: 'Edit Spider Queen' })).toBeTruthy();
  expect(within(pill).getByRole('button', { name: 'Remove Spider Queen' })).toBeTruthy();
}, 20_000);
