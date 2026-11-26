// @vitest-environment jsdom
/**
 * B-35: the Prime Arena in the calculator's frame. The page is the calculator's own: its Troops and Bonuses cards in
 * the setup column, the command bar on the bottom edge and the answer in the March pane's place (or, narrow, in the
 * sheet). Checked the way a player meets it: by role and by name, through the real `Shell`.
 */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { captains as captainTable } from '@/data';
import { newProfile, newRoot } from '@/state/defaults';
import { selectActiveSetup, useStore } from '@/state/store';
import { ThemeHarness } from '@/ui/kit/testRender';
import { DESKTOP_BAR } from '@/ui/shell/command';
import { Shell } from '@/ui/shell/Shell';
import { TWO_PANES } from '@/ui/shell/useMediaQuery';
import { useUiStore } from '@/ui/uiStore';

import { defaultArenaTroops, usePrimeArenaStore } from './primeArenaStore';

vi.setConfig({ testTimeout: 30_000 });

const realMatchMedia = window.matchMedia;

function stubMedia(matching: string[]): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (media: string) => ({
      media,
      matches: matching.includes(media),
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

const desktop = (): void => {
  stubMedia([TWO_PANES, DESKTOP_BAR]);
};

function seed(captainCount: number): void {
  const root = newRoot();
  const profile = newProfile('arena');
  profile.sources.captains = Array.from({ length: captainCount }, (_, i) => ({
    id: `c${String(i)}`,
    captainId: 'alexander',
    level: 10,
    star: 2,
  }));
  root.profiles = [profile];
  root.activeProfileId = profile.id;
  useStore.getState().replaceDocument(root);
}

function renderArena(): ReturnType<typeof render> {
  useUiStore.setState({ page: 'primeArena' });
  return render(<Shell />, { wrapper: ThemeHarness });
}

beforeEach(() => {
  Element.prototype.scrollIntoView ??= () => {};
  seed(1);
  usePrimeArenaStore.getState().reset();
  usePrimeArenaStore.setState({ budget: { maxEvaluations: 60, maxMillis: 1000 } });
  desktop();
});

afterEach(() => {
  cleanup();
  useUiStore.setState({ page: 'calculator' });
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: realMatchMedia });
});

const typeInto = (name: RegExp, value: string): void => {
  const field = screen.getByRole('textbox', { name });
  fireEvent.focus(field);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
};

test('is the calculator’s frame: its Troops and Bonuses cards, the March pane’s place and the command bar', async () => {
  const { container } = renderArena();
  const sections = await waitFor(() => {
    const found = [...container.querySelectorAll('main section[id]')].map((node) => node.id);
    expect(found).toContain('bonuses');
    return found;
  });
  // The calculator's cards that apply, in the calculator's order; Mercenaries and Battle do not exist in the arena.
  expect(sections).toEqual(['troops', 'bonuses']);
  expect(screen.getByRole('heading', { level: 2, name: 'Troops' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 2, name: 'Bonuses' })).toBeTruthy();
  // The answer sits in the pane, where the March does.
  const pane = container.querySelector('aside');
  expect(pane).not.toBeNull();
  expect(within(pane as HTMLElement).getByRole('heading', { level: 2, name: 'Match' })).toBeTruthy();
  // The calculator's bar, with the two pools the arena has and no objective.
  const bar = screen.getByRole('form', { name: 'This match' });
  expect(within(bar).getByRole('textbox', { name: /leadership/i })).toBeTruthy();
  expect(within(bar).getByRole('textbox', { name: /dominance/i })).toBeTruthy();
  expect(within(bar).queryByRole('textbox', { name: /authority/i })).toBeNull();
  expect(within(bar).queryByLabelText(/objective/i)).toBeNull();
});

test('has no division control: the Guardsmen level of the Troops card fixes the pool', async () => {
  renderArena();
  await screen.findByRole('heading', { level: 2, name: 'Bonuses' });
  expect(screen.queryByText(/division/i)).toBeNull();
  expect(screen.queryByRole('radiogroup')).toBeNull();
  // The card is the calculator's own steppers, and it writes the arena's troops, not the account's.
  const user = userEvent.setup();
  const before = usePrimeArenaStore.getState().troops.guardsmen?.max ?? 0;
  await user.click(screen.getByRole('button', { name: 'Guardsmen to: one tier down' }));
  expect(usePrimeArenaStore.getState().troops.guardsmen?.max).toBe(before - 1);
  expect(useStore.getState().doc.profiles[0]?.troops.guardsmen).not.toEqual(
    usePrimeArenaStore.getState().troops.guardsmen,
  );
  expect(screen.queryByRole('group', { name: /^Engineers at/ })).toBeNull();
});

test('the permanent sources and the talents are the calculator’s chips, under the calculator’s names', async () => {
  renderArena();
  const group = await screen.findByRole('group', { name: /permanent sources/i });
  const names = within(group)
    .getAllByRole('checkbox')
    .map((box) => box.getAttribute('aria-label'));
  expect(names).toEqual([
    'Army Modernization, counted',
    'Customization, counted',
    'Hall of Fame, counted',
    'Monsters Boost, counted',
    'Talents, counted',
    'Dragon, not counted', // the squad is seeded from the march, whose dragon is off
  ]);
  fireEvent.click(within(group).getByRole('checkbox', { name: 'Talents, counted' }));
  expect(usePrimeArenaStore.getState().toggles.talents).toBe(false);
  fireEvent.click(within(group).getByRole('checkbox', { name: 'Dragon, not counted' }));
  expect(usePrimeArenaStore.getState().setup.active.dragon).toBe(true);
  // No source the arena leaves out has a chip.
  for (const name of [/clan/i, /union of triumph/i, /hero talents/i]) {
    expect(within(group).queryByText(name)).toBeNull();
  }
});

test('keeps at most five captains, over the calculator’s own captain chips', async () => {
  renderArena();
  await screen.findByRole('heading', { level: 2, name: 'Bonuses' });
  const chips = captainTable
    .slice(0, 6)
    .map((record) =>
      screen.getByRole('checkbox', { name: new RegExp(`^Send ${record.name} on this march$`) }),
    );
  for (const chip of chips) fireEvent.click(chip);
  expect(usePrimeArenaStore.getState().setup.active.captains).toHaveLength(5);
  expect(screen.getByText(/five captains at most/i)).toBeTruthy();
  // The calculator's march is untouched.
  expect(selectActiveSetup(useStore.getState())?.active.captains).toEqual([]);
  expect(screen.queryByRole('checkbox', { name: /hero/i })).toBeNull();
  expect(screen.queryByText('Titles')).toBeNull();
});

test('Generate waits for a Leadership or Dominance budget, and says so', async () => {
  renderArena();
  const bar = await screen.findByRole('form', { name: 'This match' });
  const generate = within(bar).getByRole('button', { name: /generate match/i });
  expect(generate.getAttribute('aria-disabled')).toBe('true');
  expect(generate.textContent).toMatch(/add housing first/i);
});

test('Generate in the bar plans an attack stack and logs both rounds in the pane', async () => {
  const { container } = renderArena();
  await screen.findByRole('form', { name: 'This match' });
  typeInto(/leadership/i, '200000');
  typeInto(/dominance/i, '100000');
  fireEvent.click(screen.getByRole('button', { name: /^generate match$/i }));

  const pane = container.querySelector('aside') as HTMLElement;
  const stackList = await within(pane).findByRole('table', { name: /stack list/i }, { timeout: 8000 });
  expect(within(stackList).getAllByRole('row').length).toBeGreaterThan(1);
  await waitFor(() => {
    expect(within(pane).getByRole('heading', { name: /round 1/i })).toBeTruthy();
    expect(within(pane).getByRole('heading', { name: /round 2/i })).toBeTruthy();
  });
  expect(within(pane).getByText(/attacker strikes first/i)).toBeTruthy();
  expect(within(pane).getByText(/defender strikes first/i)).toBeTruthy();
});

test('narrow, the setup is the page, the bar carries the answer and the sheet holds the match', async () => {
  stubMedia([]);
  const { container } = renderArena();
  await screen.findByRole('form', { name: 'This match' });
  expect(container.querySelector('aside')).toBeNull();
  expect(screen.getByText('No match yet')).toBeTruthy();
  // Phone bar: housing as chips, no third pool.
  expect(screen.getByRole('button', { name: /^Leadership/ })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Authority/ })).toBeNull();

  act(() => {
    useStore.getState().replaceDocument(useStore.getState().doc);
    usePrimeArenaStore.getState().updateSetup((s) => ({
      housing: { ...s.housing, leadership: 200_000, dominance: 100_000 },
    }));
  });
  fireEvent.click(screen.getByRole('button', { name: /^generate match$/i }));
  const sheet = await screen.findByRole('dialog', { name: 'Match' }, { timeout: 8000 });
  expect(await within(sheet).findByRole('table', { name: /stack list/i })).toBeTruthy();
});

test('the fresh arena opens at the top level of the Troops card', () => {
  expect(usePrimeArenaStore.getState().troops).toEqual(defaultArenaTroops());
});
