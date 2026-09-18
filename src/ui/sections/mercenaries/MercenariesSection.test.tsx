// @vitest-environment jsdom
import { act, cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

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

const camp = () => screen.getByRole('group', { name: 'Mercenaries you own' });

/** The pills, in the order they are drawn: one body button each, named by what it holds. */
const pillNames = (): string[] =>
  within(camp())
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label') ?? '')
    .filter((name) => !name.startsWith('Remove '));

/** One pill's whole line, as a glance reads it: the pill around the badge that carries the name. */
const pillText = (name: string): string =>
  (screen.getByRole('button', { name }).closest('.mantine-Pill-root')?.textContent ?? '').replace(/\s+/g, '');

/** Open the picker the way a player does: press it, then type the name. */
async function find(user: ReturnType<typeof userEvent.setup>, query?: string): Promise<HTMLElement> {
  await user.click(screen.getByRole('button', { name: 'Hire mercenary…' }));
  if (query !== undefined) {
    await user.type(screen.getByRole('textbox', { name: 'Search mercenaries' }), query);
  }
  return screen.getByRole('listbox');
}

test('an empty camp is the picker and one line of guidance, and no chips', () => {
  renderWithTheme(<MercenariesSection />);

  expect(screen.getByRole('heading', { level: 2, name: 'Mercenaries' })).toBeTruthy();
  expect(screen.queryByRole('group', { name: 'Mercenaries you own' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Deselect all' })).toBeNull();
  expect(screen.queryByText(/selected\)/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Hire mercenary…' })).toBeTruthy();
  expect(
    screen.getByText('Type a name, or open the list: mercenaries are grouped by tier, lowest first.'),
  ).toBeTruthy();
  // The Tier / Role / Race chips are gone (owner, 2026-09-13).
  expect(screen.queryByRole('button', { name: 'Guardsmen' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Tier 7' })).toBeNull();
});

test('the section is a landmark named by its own heading', () => {
  const { container } = renderWithTheme(<MercenariesSection />);
  const region = container.querySelector('section#mercenaries');
  const heading = screen.getByRole('heading', { level: 2, name: 'Mercenaries' });
  expect(region?.getAttribute('aria-labelledby')).toBe(heading.id);
});

test('what you own is a row of pills, lowest tier first, counted in the panel meta', () => {
  renderWithTheme(<MercenariesSection />);

  own([
    { id: 'arbalester-7', cap: 8 },
    { id: 'bear-5', cap: null },
    { id: 'abomination-6', cap: 22 },
  ]);

  expect(screen.getByText('3 hired')).toBeTruthy();
  expect(pillNames()).toEqual([
    'Bear V: owned unlimited',
    'Abomination VI: owned 22',
    'Arbalester VII: owned 8',
  ]);
  // Code, tier numeral and quantity, in that order — "🐾 ABM VI 22".
  expect(pillText('Abomination VI: owned 22')).toContain('ABM');
  expect(pillText('Abomination VI: owned 22')).toContain('VI');
  expect(pillText('Abomination VI: owned 22')).toContain('22');
  expect(pillText('Bear V: owned unlimited')).toContain('∞');
  expect(screen.getByRole('button', { name: 'Remove Bear V' })).toBeTruthy();
});

test('the picker is grouped by tier from the lowest up, and narrows to what you type', async () => {
  const user = userEvent.setup();
  renderWithTheme(<MercenariesSection />);

  const listbox = await find(user);
  expect(
    within(listbox)
      .getAllByRole('group')
      .map((group) => group.firstElementChild?.textContent),
  ).toEqual(['Tier V', 'Tier VI', 'Tier VII', 'Tier IX']);

  await user.type(screen.getByRole('textbox', { name: 'Search mercenaries' }), 'arbalester');
  expect(
    within(listbox)
      .getAllByRole('group')
      .map((group) => group.firstElementChild?.textContent),
  ).toEqual(['Tier VI', 'Tier VII']);
  expect(within(listbox).getByRole('option', { name: 'Arbalester VI tier 6' })).toBeTruthy();
  expect(within(listbox).queryByRole('option', { name: 'Bear V tier 5' })).toBeNull();
});

test('picking a mercenary adds its pill, and the list stays open for the next one', async () => {
  const user = userEvent.setup();
  renderWithTheme(<MercenariesSection />);

  const listbox = await find(user, 'bear');
  await user.click(within(listbox).getByRole('option', { name: 'Bear V tier 5' }));
  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: null }]);

  // The list stays open for the next pick, and what was hired has left it: the camp and the picker
  // never show the same mercenary twice.
  expect(screen.getByRole('listbox')).toBeTruthy();
  expect(screen.queryByRole('option', { name: 'Bear V tier 5' })).toBeNull();
  expect(screen.getByText('1 hired')).toBeTruthy();
});

test('a name the tables do not carry says so, and is never hired by accident', async () => {
  const user = userEvent.setup();
  renderWithTheme(<MercenariesSection />);

  await find(user, 'spider queen');
  expect(screen.getByText('No mercenary of that name. Add it by hand.')).toBeTruthy();
  await user.keyboard('{Enter}');
  expect(mercs()?.selected).toEqual([]);
});

test('pressing a pill opens the quantity under it: a plain field, no step buttons', async () => {
  const user = userEvent.setup();
  renderWithTheme(<MercenariesSection />);
  own([{ id: 'bear-5', cap: null }]);

  await user.click(screen.getByRole('button', { name: 'Bear V: owned unlimited' }));
  const editor = await screen.findByRole('dialog');
  expect(within(editor).getByText('Bear V')).toBeTruthy();
  // An owned count is typed, not walked to (owner, 2026-09-13).
  expect(within(editor).queryByRole('button', { name: /Increase|Decrease/ })).toBeNull();

  await user.type(within(editor).getByRole('textbox', { name: 'Owned' }), '22');
  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: 22 }]);
  expect(pillText('Bear V: owned 22')).toContain('22');
});

test('the Unlimited switch gives the quantity back to the camp', async () => {
  const user = userEvent.setup();
  renderWithTheme(<MercenariesSection />);
  own([{ id: 'bear-5', cap: 22 }]);

  await user.click(screen.getByRole('button', { name: 'Bear V: owned 22' }));
  const editor = await screen.findByRole('dialog');
  const unlimited = within(editor).getByRole('switch', { name: 'Unlimited' }) as HTMLInputElement;
  expect(unlimited.checked).toBe(false);

  await user.click(unlimited);
  expect(mercs()?.selected).toEqual([{ id: 'bear-5', cap: null }]);
  expect(pillText('Bear V: owned unlimited')).toContain('∞');
});

test('the pill removes its mercenary in one press, and Put back restores it where it stood', async () => {
  const user = userEvent.setup();
  renderWithTheme(<MercenariesSection />);
  own([
    { id: 'bear-5', cap: null },
    { id: 'abomination-6', cap: 22 },
  ]);

  // The body is the remove (owner, 2026-09-18); no × on the pill any more.
  await user.click(screen.getByRole('button', { name: 'Remove Bear V' }));
  expect(mercs()?.selected).toEqual([{ id: 'abomination-6', cap: 22 }]);
  expect(screen.queryByRole('button', { name: /^Dismiss|^Remove Bear V$/ })).toBeNull();

  // …and the way back, under the row, in a live region.
  const status = screen.getByRole('status');
  expect(status.textContent).toContain('Bear V removed.');
  await user.click(within(status).getByRole('button', { name: 'Put back' }));
  expect(mercs()?.selected).toEqual([
    { id: 'bear-5', cap: null },
    { id: 'abomination-6', cap: 22 },
  ]);
  expect(screen.queryByRole('status')).toBeNull();
  // The line also goes by itself after six seconds (`UNDO_MS`), which a fake clock under
  // `userEvent` stalls on in jsdom; the timer is three lines and is read, not tested.
});

test('Deselect all empties the camp in one press, and Put back fills it again', async () => {
  const user = userEvent.setup();
  renderWithTheme(<MercenariesSection />);
  own([
    { id: 'bear-5', cap: null },
    { id: 'abomination-6', cap: 22 },
  ]);

  await user.click(screen.getByRole('button', { name: 'Deselect all' }));
  expect(mercs()?.selected).toEqual([]);
  expect(screen.queryByRole('group', { name: 'Mercenaries you own' })).toBeNull();

  expect(screen.getByRole('status').textContent).toContain('2 mercenaries removed.');
  await user.click(screen.getByRole('button', { name: 'Put back' }));
  expect(mercs()?.selected).toEqual([
    { id: 'bear-5', cap: null },
    { id: 'abomination-6', cap: 22 },
  ]);
});

test('the custom sheet adds a mercenary the tables do not carry, and its pill reopens it', async () => {
  const user = userEvent.setup();
  renderWithTheme(<MercenariesSection />);

  await user.click(screen.getByRole('button', { name: 'Custom mercenary' }));
  // The sheet is a chunk of its own (T-06); Vitest transforms it on demand, so give it a moment.
  const sheet = await screen.findByRole('dialog', { name: 'Custom mercenary' }, { timeout: 10_000 });

  await user.type(within(sheet).getByRole('textbox', { name: 'Name' }), 'Spider Queen');
  await user.type(within(sheet).getByRole('textbox', { name: 'Health' }), '420000');
  await user.type(within(sheet).getByRole('textbox', { name: 'Authority cost' }), '90');
  await user.click(within(sheet).getByRole('button', { name: 'Add mercenary' }));

  const custom = mercs()?.custom ?? [];
  expect(custom).toHaveLength(1);
  expect(custom[0]?.name).toBe('Spider Queen');
  expect(custom[0]?.health).toBe(420000);
  expect(custom[0]?.cost).toBe(90);

  expect(pillText('Edit Spider Queen')).toContain('Custom');
  expect(screen.getByRole('button', { name: 'Remove Spider Queen' })).toBeTruthy();

  await user.click(screen.getByRole('button', { name: 'Edit Spider Queen' }));
  expect(await screen.findByRole('dialog', { name: 'Edit custom mercenary' })).toBeTruthy();
}, 20_000);
