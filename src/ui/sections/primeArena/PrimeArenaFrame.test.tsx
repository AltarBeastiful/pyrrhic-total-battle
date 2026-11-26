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
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
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
  expect(screen.queryByRole('radiogroup', { name: /division/i })).toBeNull();
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
    'Hall of Fame, counted',
    'Monuments, counted',
    'Personal Technologies, counted',
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
  // The planned army is the calculator's own pills, one block per housing pool; no table of its own.
  const stackGroup = (
    await within(pane).findAllByRole('group', { name: /stacks$/i }, { timeout: 8000 })
  )[0] as HTMLElement;
  expect(stackGroup.querySelectorAll('[data-stack]').length).toBeGreaterThan(0);
  expect(within(pane).queryByRole('table', { name: /stack list/i })).toBeNull();
  await waitFor(() => {
    expect(within(pane).getByRole('heading', { name: /round 1/i })).toBeTruthy();
    expect(within(pane).getByRole('heading', { name: /round 2/i })).toBeTruthy();
  });
  // The housing check: used of available per pool, with a maxed-out or "N left" state.
  expect(within(pane).getByRole('progressbar', { name: /leadership used/i })).toBeTruthy();
  expect(within(pane).getByRole('progressbar', { name: /dominance used/i })).toBeTruthy();
  expect(within(pane).getAllByText(/maxed out|left/i).length).toBeGreaterThanOrEqual(2);
  expect(within(pane).getByText(/attacker.* strikes first/i)).toBeTruthy();
  expect(within(pane).getByText(/defender.* strikes first/i)).toBeTruthy();
  // The attacker role is the default: the answer says which side is ours, and what the squad was ranked on.
  expect(within(pane).getAllByRole('table', { name: 'Attacker (you)' })).toHaveLength(2);
  expect(within(pane).getByText(/average of \d+ opponents/i)).toBeTruthy();
  // Panel wording is plain (rule 26): sizes against yours, no jargon letter; opponents of other mixes are listed.
  const note = within(pane).getByText(/average of \d+ opponents/i).textContent ?? '';
  expect(note).toMatch(/% of your size/);
  expect(note).toMatch(/even split/);
  expect(note).toMatch(/mostly melee/);
  expect(note).not.toMatch(/\bk\b/);
  // What the match does not model, and the check of the typed housing.
  expect(within(pane).getByText(/blocked.*not modelled/i)).toBeTruthy();
  expect(within(pane).getAllByText(/real maximum/i).length).toBeGreaterThanOrEqual(1);
  expect(within(pane).getByText(/^(victory|defeat|draw)\b/i)).toBeTruthy();
});

test('a pool typed as zero says no units are fielded from it', async () => {
  const { container } = renderArena();
  await screen.findByRole('form', { name: 'This match' });
  typeInto(/leadership/i, '200000');
  typeInto(/dominance/i, '0');
  fireEvent.click(screen.getByRole('button', { name: /^generate match$/i }));
  const pane = container.querySelector('aside') as HTMLElement;
  await within(pane).findByText(/no dominance typed, so no monsters are fielded/i, undefined, {
    timeout: 8000,
  });
});

test('the role is the calculator’s segmented control, saved, and a defender plan ranks against the worst case', async () => {
  const { container } = renderArena();
  const role = await screen.findByRole('radiogroup', { name: /role/i });
  expect((within(role).getByRole('radio', { name: 'Attacker' }) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(within(role).getByRole('radio', { name: 'Defender' }));
  expect(usePrimeArenaStore.getState().role).toBe('defender');
  expect(useStore.getState().doc.profiles[0]?.primeArena.role).toBe('defender');

  typeInto(/leadership/i, '200000');
  typeInto(/dominance/i, '100000');
  fireEvent.click(screen.getByRole('button', { name: /^generate match$/i }));
  const pane = container.querySelector('aside') as HTMLElement;
  await within(pane).findByText(/worst case of \d+ opponents/i, undefined, { timeout: 8000 });
  expect(usePrimeArenaStore.getState().plan?.role).toBe('defender');
  // Our side is the defender: it is the one marked, and the verdict is read for it.
  expect(within(pane).getAllByRole('table', { name: 'Defender (you)' })).toHaveLength(2);
  expect(within(pane).queryByRole('table', { name: 'Attacker (you)' })).toBeNull();
  expect(within(pane).getByText(/^(victory|defeat|draw)\b/i)).toBeTruthy();
  // Changing the role after a plan leaves the plan on screen but stale.
  fireEvent.click(within(role).getByRole('radio', { name: 'Attacker' }));
  expect(usePrimeArenaStore.getState().plan?.role).toBe('defender');
});

test('the stack cap is a typed figure, saved, and the planner is held to it', async () => {
  renderArena();
  await screen.findByRole('radiogroup', { name: /role/i });
  expect((screen.getByRole('textbox', { name: /most stacks/i }) as HTMLInputElement).value).toBe('8');
  typeInto(/most stacks/i, '2');
  expect(usePrimeArenaStore.getState().maxStacks).toBe(2);
  typeInto(/leadership/i, '200000');
  typeInto(/dominance/i, '100000');
  fireEvent.click(screen.getByRole('button', { name: /^generate match$/i }));
  await waitFor(() => expect(usePrimeArenaStore.getState().plan).not.toBeNull(), { timeout: 8000 });
  expect(usePrimeArenaStore.getState().plan?.stacks.length).toBeLessThanOrEqual(2);
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
  expect((await within(sheet).findAllByRole('group', { name: /stacks$/i })).length).toBeGreaterThan(0);
  expect(within(sheet).queryByRole('table', { name: /stack list/i })).toBeNull();
});

test('the fresh arena opens at the top level of the Troops card', () => {
  expect(usePrimeArenaStore.getState().troops).toEqual(defaultArenaTroops());
});

test('an equipment set switches on in the arena squad, not on the calculator march (B-35)', async () => {
  const profile = selectActiveProfile(useStore.getState())!;
  useStore.getState().updateProfile(profile.id, {
    sources: {
      ...profile.sources,
      equipment: [
        { id: 'a1', equipmentId: 'emerald-guardian', quality: 'rare', setId: 's1' },
        { id: 'a2', equipmentId: 'war-master', quality: 'rare', setId: 's1' },
      ],
    } as typeof profile.sources,
  });
  const marchBefore = selectActiveSetup(useStore.getState())!.active.equipment;
  renderArena();
  const user = userEvent.setup();
  await user.click(await screen.findByRole('checkbox', { name: /0 of 2 on/ }));
  expect([...usePrimeArenaStore.getState().setup.active.equipment].sort()).toEqual(['a1', 'a2']);
  expect(selectActiveSetup(useStore.getState())!.active.equipment).toEqual(marchBefore);
  await user.click(await screen.findByRole('checkbox', { name: /2 of 2 on/ }));
  expect(usePrimeArenaStore.getState().setup.active.equipment).toEqual([]);
});
