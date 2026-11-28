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

import { CAPTAIN_SHINE_MS, usePrimeArenaStore } from './primeArenaStore';

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
  vi.restoreAllMocks();
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
  // The card is the calculator's own, on the account's troops: one source, so a step here is a step there.
  const user = userEvent.setup();
  const before = useStore.getState().doc.profiles[0]!.troops.guardsmen?.max ?? 0;
  await user.click(screen.getByRole('button', { name: 'Guardsmen to: one tier down' }));
  expect(useStore.getState().doc.profiles[0]!.troops.guardsmen?.max).toBe(before - 1);
  // ... and the other way: the calculator's write shows in the arena's card.
  act(() => {
    useStore.getState().updateProfile(useStore.getState().doc.activeProfileId, (p) => ({
      troops: { ...p.troops, guardsmen: { min: 1, max: 4 } },
    }));
  });
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Guardsmen to: one tier down' })).toBeTruthy();
  });
  await user.click(screen.getByRole('button', { name: 'Guardsmen to: one tier down' }));
  expect(useStore.getState().doc.profiles[0]!.troops.guardsmen?.max).toBe(3);
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
    'Hall of Fame, counted',
    'Monsters Boost, counted',
    'Monuments, counted',
    'Other Arena bonus, counted',
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
  seed(0); // nobody owned, so the opening fills nothing and every chip starts off
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

test('artifacts read with what they give against other players, and the Summary lists strike two squads', async () => {
  const user = userEvent.setup();
  renderArena();
  await user.click(await screen.findByRole('button', { name: /^Artifacts/ }));
  await user.click(await screen.findByRole('checkbox', { name: "Equip Mars' Twin Blades" }));
  // The chip rides the arena's figure: level 1 gives army health and strength against other players only.
  expect(screen.getByText(/42 % HP \/ \+42 % STR army/)).toBeTruthy();
  await user.click(screen.getByRole('button', { name: /Mars' Twin Blades’s level$/ }));
  const editor = screen.getByRole('dialog');
  expect(within(editor).getByText('+42 % health and strength (army)')).toBeTruthy();
  expect(within(editor).getByText('+1.1 % strike two squads chance')).toBeTruthy();
  await user.keyboard('{Escape}');

  await user.click(screen.getByRole('button', { name: 'Summary' }));
  const special = await screen.findByRole('region', { name: 'Special' });
  expect(within(special).getByText('Strike two squads chance')).toBeTruthy();
  expect(within(special).getAllByText('+1.1 %').length).toBeGreaterThan(0);
  // The Summary reads the arena's sources: what the artifact gives against other players is in it.
  const strength = screen.getByRole('region', { name: 'Strength' });
  expect(within(strength).getByText("Mars' Twin Blades L1 ★0.1")).toBeTruthy();
});

test('a random line against other players counts in the arena (B-42)', async () => {
  const user = userEvent.setup();
  renderArena();
  // The fold may open by itself: the device remembers how it was left.
  const fold = await screen.findByRole('button', { name: /^Artifacts/ });
  if (fold.getAttribute('aria-expanded') !== 'true') await user.click(fold);
  await user.click(await screen.findByRole('checkbox', { name: "Equip Mars' Twin Blades" }));
  await user.click(screen.getByRole('button', { name: /Mars' Twin Blades’s level$/ }));
  const editor = screen.getByRole('dialog');
  await user.click(within(editor).getByRole('combobox', { name: 'Star rating' }));
  await user.click(within(editor).getByRole('option', { name: '★ 1.0' }));
  await user.click(within(editor).getByRole('combobox', { name: 'Random bonus 1' }));
  await user.click(within(editor).getByRole('option', { name: 'Army strength against other players' }));
  const field = within(editor).getByRole('combobox', { name: 'Random bonus 1' });
  const described = (field.getAttribute('aria-describedby') ?? '').split(' ');
  expect(described.map((id) => document.getElementById(id)?.textContent ?? '').join('')).toBe(
    'Against other players',
  );
  expect(within(editor).queryByText(/not counted/i)).toBeNull();
  // Level 1: 42 against players, and the line's smallest value, 20.
  expect(within(editor).getByText('+62 % strength (army)')).toBeTruthy();
});

test('Zeus’ capacity counts in the arena: no mark on its lines, and the editor shows what it raises (B-44)', async () => {
  const user = userEvent.setup();
  renderArena();
  await waitFor(() => expect(savedPools()).toEqual([1500, 450]));
  const fold = await screen.findByRole('button', { name: /^Artifacts/ });
  if (fold.getAttribute('aria-expanded') !== 'true') await user.click(fold);
  await user.click(await screen.findByRole('checkbox', { name: "Equip Zeus' Lightning" }));
  // Level 1: 2.5 % to both pools.
  expect(savedPools()).toEqual([1537, 461]);
  await user.click(screen.getByRole('button', { name: /Zeus' Lightning’s level$/ }));
  const editor = screen.getByRole('dialog');
  await user.click(within(editor).getByRole('combobox', { name: 'Star rating' }));
  await user.click(within(editor).getByRole('option', { name: '★ 1.0' }));
  await user.click(within(editor).getByRole('combobox', { name: 'Random bonus 1' }));
  // Authority is still nowhere; Leadership and Dominance carry no mark.
  expect(within(editor).getByRole('option', { name: /Authority\s*Not counted/ })).toBeTruthy();
  expect(within(editor).getByRole('option', { name: 'Dominance' })).toBeTruthy();
  await user.click(within(editor).getByRole('option', { name: 'Leadership' }));
  // No note under the line.
  const field = within(editor).getByRole('combobox', { name: 'Random bonus 1' });
  const described = (field.getAttribute('aria-describedby') ?? '').split(' ');
  expect(described.map((id) => document.getElementById(id)?.textContent ?? '').join('')).toBe('');
  expect(within(editor).getByText('+3.5 % leadership')).toBeTruthy(); // and the line's smallest value, 1
  expect(within(editor).getByText('+2.5 % dominance')).toBeTruthy();
  await waitFor(() => expect(savedPools()).toEqual([1552, 461]));
});

test('Generate waits for a Leadership or Dominance budget, and says so', async () => {
  seed(0); // a squad with a captain fills the pools by itself (B-43)
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
  // The attacker role is the default: the answer says which side is ours.
  expect(within(pane).getAllByRole('table', { name: 'Attacker (you)' })).toHaveLength(2);
  // With no enemy typed the answer names itself all-round and says how the squad does over the assumed enemies.
  expect(within(pane).getByText('All-round plan')).toBeTruthy();
  expect(within(pane).getByText(/beats \d+ % of \d+ assumed enemies/i)).toBeTruthy();
  expect(within(pane).getByText(/an even fill of your top tier beats/i)).toBeTruthy();
  expect(within(pane).getByText(/average lead [+-]?\d+ points.*bad cases [+-]?\d+ points/i)).toBeTruthy();
  expect(within(pane).getByText(/lead.*your survivors minus theirs/i)).toBeTruthy();
  expect(within(pane).getByText(/even army of your size, with your bonuses/i)).toBeTruthy();
  // What the match does not model, and the check of the typed housing.
  expect(within(pane).getByText(/blocked.*not modelled/i)).toBeTruthy();
  expect(within(pane).getAllByText(/real maximum/i).length).toBeGreaterThanOrEqual(1);
  // The new wording keeps to our rule: no em dash.
  expect(pane.textContent).not.toContain('\u2014');
});

test('the Enemy card takes the units of every type up to the Guardsmen level; typing them counter-picks (B-46)', async () => {
  const { container } = renderArena();
  const card = await screen.findByRole('region', { name: 'Enemy' });
  expect(within(card).getByText('All-round')).toBeTruthy();
  const level = useStore.getState().doc.profiles[0]!.troops.guardsmen!.max;
  expect(level).toBe(3);
  // The top tier is on the card; the lower tiers sit in a fold; nothing above the level is offered.
  expect(within(card).getByRole('textbox', { name: 'Rider III' })).toBeTruthy();
  expect(within(card).getByRole('textbox', { name: 'Water Elemental' })).toBeTruthy();
  expect(within(card).queryByRole('textbox', { name: 'Rider IV' })).toBeNull();
  const clear = within(card).getByRole('button', { name: 'Clear enemy' }) as HTMLButtonElement;
  expect(clear.disabled).toBe(true);

  typeInto(/^rider iii$/i, '4000');
  expect(useStore.getState().doc.profiles[0]!.primeArena.enemy).toEqual([{ unitId: 'rider-3', count: 4000 }]);
  expect(within(card).getByText('Counter-pick · 1 stack')).toBeTruthy();
  typeInto(/leadership/i, '20000');
  typeInto(/dominance/i, '3000');
  fireEvent.click(screen.getByRole('button', { name: /^generate match$/i }));
  const pane = container.querySelector('aside') as HTMLElement;
  await within(pane).findByText('Counter-pick', undefined, { timeout: 8000 });
  expect(within(pane).getByText(/^(victory|defeat|draw)\b/i)).toBeTruthy();
  expect(within(pane).getByText(/against the enemy you typed/i)).toBeTruthy();
  expect(within(pane).queryByText(/assumed enemies/i)).toBeNull();
  expect(within(pane).getByRole('heading', { name: /round 2/i })).toBeTruthy();

  fireEvent.click(clear);
  expect(useStore.getState().doc.profiles[0]!.primeArena.enemy).toEqual([]);
  expect(within(card).getByText('All-round')).toBeTruthy();
  expect((within(card).getByRole('textbox', { name: 'Rider III' }) as HTMLInputElement).value).toBe('');
});

test('a unit typed above the level stays on the card, to be read, changed or emptied (B-46)', async () => {
  renderArena();
  const card = await screen.findByRole('region', { name: 'Enemy' });
  typeInto(/^rider iii$/i, '4000');
  const setLevel = (max: number | null): void => {
    act(() => {
      useStore.getState().updateProfile(useStore.getState().doc.activeProfileId, (p) => ({
        troops: { ...p.troops, guardsmen: max === null ? null : { min: 1, max } },
      }));
    });
  };
  // The level moves down past the typed unit, then the Guardsmen row goes out of use altogether.
  for (const level of [2, null]) {
    setLevel(level);
    const field = within(card).getByRole('textbox', { name: 'Rider III' }) as HTMLInputElement;
    expect(field.value.replace(/\D/g, '')).toBe('4000');
    expect(within(card).getByText('Counter-pick · 1 stack')).toBeTruthy();
  }
  typeInto(/^rider iii$/i, '');
  expect(useStore.getState().doc.profiles[0]!.primeArena.enemy).toEqual([]);
});

test('with no unit to field the answer says so instead of rating an empty squad (B-46)', async () => {
  const { container } = renderArena();
  await screen.findByRole('form', { name: 'This match' });
  act(() => {
    useStore.getState().updateProfile(useStore.getState().doc.activeProfileId, (p) => ({
      troops: { ...p.troops, guardsmen: { min: 1, max: 1 } },
    }));
  });
  typeInto(/leadership/i, '2000');
  fireEvent.click(screen.getByRole('button', { name: /^generate match$/i }));
  const pane = container.querySelector('aside') as HTMLElement;
  await within(pane).findByText(/no unit to field/i, undefined, { timeout: 8000 });
  expect(within(pane).queryByText(/beats/i)).toBeNull();
  expect(within(pane).queryByRole('heading', { name: /round 1/i })).toBeNull();
});

test('the calculator neither shows nor offers the other Arena bonus (B-46)', async () => {
  render(<Shell />, { wrapper: ThemeHarness });
  const group = await screen.findByRole('group', { name: /permanent sources/i });
  expect(within(group).getByRole('checkbox', { name: /army modernization/i })).toBeTruthy();
  expect(within(group).queryByRole('checkbox', { name: /other arena bonus/i })).toBeNull();
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

test('the role is the calculator’s segmented control, saved, and a defender plan reads from the defender’s side', async () => {
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
  await within(pane).findByText(/assumed enemies/i, undefined, { timeout: 8000 });
  expect(usePrimeArenaStore.getState().plan?.role).toBe('defender');
  // Our side is the defender: it is the one marked, and the verdict is read for it.
  expect(within(pane).getAllByRole('table', { name: 'Defender (you)' })).toHaveLength(2);
  expect(within(pane).queryByRole('table', { name: 'Attacker (you)' })).toBeNull();
  // Changing the role after a plan leaves the plan on screen but stale.
  fireEvent.click(within(role).getByRole('radio', { name: 'Attacker' }));
  expect(usePrimeArenaStore.getState().plan?.role).toBe('defender');
});

test('there is no stack cap to type: a squad may field every troop type it has', async () => {
  renderArena();
  const role = await screen.findByRole('region', { name: 'Role' });
  expect(within(role).queryByRole('textbox')).toBeNull();
  expect(screen.queryByText(/most stacks/i)).toBeNull();
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

/** Seven captains at levels that rank them Skadi, Aydae, Beowulf, Bernard, Brunhild, Carter; Aurora is not owned. */
function seedRoster(): void {
  const profile = selectActiveProfile(useStore.getState())!;
  const levels: [string, number][] = [
    ['aurora', 0],
    ['aydae', 40],
    ['beowulf', 30],
    ['bernard', 20],
    ['brunhild', 10],
    ['carter', 1],
    ['skadi', 99],
  ];
  useStore.getState().updateProfile(profile.id, {
    sources: {
      ...profile.sources,
      captains: levels.map(([captainId, level]) => ({ id: `e-${captainId}`, captainId, level, star: 0 })),
    },
  });
}

/** The names of the captain chips that are on, and of those marked to shine. */
function chipNames(): { riding: string[]; shining: string[] } {
  const chips = within(screen.getByRole('group', { name: 'Captains and hero' })).getAllByRole(
    'checkbox',
  ) as HTMLInputElement[];
  const nameOf = (chip: HTMLInputElement): string =>
    (chip.getAttribute('aria-label') ?? '').replace(/^Send | on this march$|, riding with this march$/g, '');
  return {
    riding: chips.filter((chip) => chip.checked).map(nameOf),
    shining: chips.filter((chip) => chip.closest('[data-shine]') !== null).map(nameOf),
  };
}

/**
 * Holds the shine's own timeout, so a shine lasts until the test ends it, however slow the machine draws the page.
 * Every other timeout runs as usual (fake timers would stall Testing Library's own waits).
 */
function holdShine(): () => void {
  const real = globalThis.setTimeout;
  let finish: (() => void) | undefined;
  vi.spyOn(globalThis, 'setTimeout').mockImplementation(((handler: () => void, ms?: number) => {
    if (ms !== CAPTAIN_SHINE_MS) return real(handler, ms);
    finish = handler;
    return real(() => undefined, 0);
  }) as typeof setTimeout);
  return () => {
    act(() => finish?.());
  };
}

test('opening the page fills the squad with the strongest captains, which shine once (B-45)', async () => {
  const endShine = holdShine();
  seedRoster();
  renderArena();
  await screen.findByRole('heading', { level: 2, name: 'Bonuses' });
  const strongest = ['Aydae', 'Beowulf', 'Bernard', 'Brunhild', 'Skadi'];
  await waitFor(() => expect(chipNames().riding).toEqual(strongest), { timeout: 8000 });
  expect(chipNames().shining).toEqual(strongest);
  // Once: the mark goes by itself and the chips stay on.
  endShine();
  expect(chipNames().shining).toEqual([]);
  expect(chipNames().riding).toEqual(strongest);
});

test('"Pick 5 strongest" stands beside the captains heading and replaces the selection at once (B-45)', async () => {
  const endShine = holdShine();
  seedRoster();
  renderArena();
  const button = await screen.findByRole('button', { name: 'Pick 5 strongest' });
  // Beside the heading: the same label column as the family's name and its count.
  expect(button.parentElement?.textContent).toMatch(/^Hero and captains5\/5/);
  endShine();
  // A hand edit swaps Skadi for Carter, without a shine and without being undone.
  fireEvent.click(screen.getByRole('checkbox', { name: 'Skadi, riding with this march' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Send Carter on this march' }));
  expect(chipNames()).toEqual({
    riding: ['Aydae', 'Beowulf', 'Bernard', 'Brunhild', 'Carter'],
    shining: [],
  });
  fireEvent.click(button);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(chipNames()).toEqual({
    riding: ['Aydae', 'Beowulf', 'Bernard', 'Brunhild', 'Skadi'],
    shining: ['Skadi'],
  });
  expect(selectActiveSetup(useStore.getState())?.active.captains).toEqual([]);
});

test('with no captain owned "Pick 5 strongest" cannot be pressed (B-45)', async () => {
  seed(0);
  renderArena();
  const button = await screen.findByRole('button', { name: 'Pick 5 strongest' });
  expect((button as HTMLButtonElement).disabled).toBe(true);
});

test('the calculator keeps its own captain selection: nothing filled, no quick pick (B-45)', async () => {
  seedRoster();
  render(<Shell />, { wrapper: ThemeHarness });
  await screen.findByRole('group', { name: 'Captains and hero' });
  expect(screen.queryByRole('button', { name: 'Pick 5 strongest' })).toBeNull();
  expect(chipNames()).toEqual({ riding: [], shining: [] });
  expect(selectActiveSetup(useStore.getState())?.active.captains).toEqual([]);
});

/** The saved arena pools, as `[leadership, dominance]`. */
const savedPools = (): [number, number] => {
  const { leadership, dominance } = selectActiveProfile(useStore.getState())!.primeArena.setup.housing;
  return [leadership, dominance];
};

// The seeded captain is level 10: 1500 Leadership and 450 Dominance in the game's table.
test('the bar fills the squad’s maximum, takes the other capacity bonus % and restores it with Max (B-43)', async () => {
  renderArena();
  const bar = await screen.findByRole('form', { name: 'This match' });
  await waitFor(() => expect(savedPools()).toEqual([1500, 450]));
  const field = within(bar).getByRole('textbox', { name: 'Other capacity bonus %' }) as HTMLInputElement;
  expect(field.value).toBe('0');
  const user = userEvent.setup();
  // Typed key by key: a decimal fraction survives the way there.
  await user.click(field);
  await user.keyboard('0.7');
  expect(field.value).toBe('0.7');
  expect(selectActiveProfile(useStore.getState())!.primeArena.otherCapacity).toBe(0.7);
  expect(savedPools()).toEqual([1510, 453]);
  typeInto(/^leadership/i, '5');
  expect(savedPools()).toEqual([5, 453]);
  await user.click(within(bar).getByRole('button', { name: 'Max Leadership and Dominance' }));
  expect(savedPools()).toEqual([1510, 453]);
});

test('a captain level changed while the page is open refills the pools (B-43)', async () => {
  renderArena();
  await waitFor(() => expect(savedPools()).toEqual([1500, 450]));
  const profile = selectActiveProfile(useStore.getState())!;
  act(() => {
    useStore.getState().updateProfile(profile.id, {
      sources: {
        ...profile.sources,
        captains: profile.sources.captains.map((entry) => ({ ...entry, level: 100 })),
      },
    });
  });
  await waitFor(() => expect(savedPools()).toEqual([14_000, 3500]));
});

test('the phone bar holds the bonus % as a chip beside the pools, with Max (B-43)', async () => {
  stubMedia([]);
  renderArena();
  const bar = await screen.findByRole('form', { name: 'This match' });
  await waitFor(() => expect(savedPools()).toEqual([1500, 450]));
  const user = userEvent.setup();
  await user.click(within(bar).getByRole('button', { name: 'Other capacity bonus 0 %' }));
  await user.keyboard('12.5');
  fireEvent.blur(within(bar).getByRole('textbox', { name: 'Other capacity bonus %' }));
  expect(within(bar).getByRole('button', { name: 'Other capacity bonus 12.5 %' })).toBeTruthy();
  expect(savedPools()).toEqual([1687, 506]);
  // A fraction that opens with a zero can be typed too: 1500 × 1.005 = 1507.5.
  await user.click(within(bar).getByRole('button', { name: 'Other capacity bonus 12.5 %' }));
  await user.keyboard('0.5');
  fireEvent.blur(within(bar).getByRole('textbox', { name: 'Other capacity bonus %' }));
  expect(savedPools()).toEqual([1507, 452]);
  await user.click(within(bar).getByRole('button', { name: 'Other capacity bonus 0.5 %' }));
  await user.keyboard('12.5');
  fireEvent.blur(within(bar).getByRole('textbox', { name: 'Other capacity bonus %' }));
  act(() => {
    usePrimeArenaStore.getState().updateSetup((s) => ({ housing: { ...s.housing, dominance: 9 } }));
  });
  await user.click(within(bar).getByRole('button', { name: 'Max Leadership and Dominance' }));
  expect(savedPools()).toEqual([1687, 506]);
});
