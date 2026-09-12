// @vitest-environment jsdom
/**
 * The Bonuses card, checked the way a player uses it (design plan §7.3, journey J3): the TOTAL is
 * three labelled figures in the header, the sources are rows with a switch and a gear, and every
 * editor is a sheet that repeats the TOTAL so the figures are visible while they move.
 *
 * Everything is selected by role and by accessible name, so a class, a layout or a glyph can change
 * without a test noticing.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import { BonusesSection } from './BonusesSection';

// The card pulls in every data table and renders eight groups; under full-suite load the first
// render can exceed the default 5 s budget, which is the cost of the import, not a hang.
vi.setConfig({ testTimeout: 30_000 });

beforeEach(() => {
  globalThis.localStorage.clear();
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

const profile = () => selectActiveProfile(useStore.getState());
const setup = () => selectActiveSetup(useStore.getState());

/** The card itself; the sheets render in a portal, outside it. */
function card(): HTMLElement {
  const node = document.querySelector('#bonuses');
  if (node === null) throw new Error('the Bonuses card is not on screen');
  return node as HTMLElement;
}

/** The four labelled figures of a TOTAL header, as a name → value map. */
function totals(scope: HTMLElement): Record<string, string> {
  const list = within(scope).getByLabelText('Army bonus totals');
  const out: Record<string, string> = {};
  for (const term of list.querySelectorAll('dt')) {
    out[term.textContent ?? ''] = term.nextElementSibling?.textContent ?? '';
  }
  return out;
}

/** The line that unfolds the sources. */
function disclosure(): HTMLElement {
  return within(card()).getByRole('button', { name: /^Sources/ });
}

function expand(): void {
  const trigger = disclosure();
  if (trigger.getAttribute('aria-expanded') !== 'true') fireEvent.click(trigger);
}

/** Opens one row's editor and returns its sheet. */
function openEditor(name: string): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: `Edit ${name}` }));
  return screen.getByRole('dialog');
}

/** A kit Select's trigger; its accessible name is the chosen value, then the field's own label. */
function selectTrigger(scope: HTMLElement, label: string): HTMLElement {
  return within(scope).getByRole('button', { name: new RegExp(`${label}$`) });
}

function done(sheet: HTMLElement): void {
  fireEvent.click(within(sheet).getByRole('button', { name: 'Done' }));
}

/** Types into a stepper the way the field expects it: a change, then leaving the field. */
function typeNumber(scope: HTMLElement, label: string, value: string): void {
  const field = within(scope).getByLabelText(label);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

/**
 * Adds a captain, picks the one named and sets its base level. Beowulf gives the *whole army* 1 %
 * of health and of strength per level, which is the figure the header carries; Aydae gives the same
 * to guardsmen only, which is what a row says and the header deliberately does not.
 */
function addCaptain(name: string, level: string): void {
  fireEvent.click(screen.getByRole('button', { name: 'Add captain' }));
  const sheet = screen.getByRole('dialog');
  fireEvent.click(selectTrigger(sheet, 'Captain'));
  fireEvent.click(screen.getByRole('option', { name }));
  typeNumber(sheet, 'Base level', level);
  done(sheet);
}

test('the header carries the TOTAL as three labelled figures and the count of sources on', () => {
  render(<BonusesSection />);

  expect(within(card()).getByRole('heading', { level: 2, name: 'Bonuses' })).toBeTruthy();
  expect(totals(card())).toEqual({
    Health: '0 %',
    Strength: '0 %',
    Special: '0 %',
    'Sources on': '3',
  });
});

test('a source switched on with nothing typed in it is counted in the header', () => {
  render(<BonusesSection />);

  // VIP, the dragon and the unexplained remainder start switched on and empty.
  expect(within(card()).getByText('3 on but empty')).toBeTruthy();

  expand();
  fireEvent.click(within(card()).getByRole('switch', { name: 'Dragon' }));

  expect(setup()?.active.dragon).toBe(false);
  expect(within(card()).getByText('2 on but empty')).toBeTruthy();
});

test('the sources are folded away by default and the choice is remembered per device', () => {
  const first = render(<BonusesSection />);
  expect(disclosure().getAttribute('aria-expanded')).toBe('false');

  fireEvent.click(disclosure());
  expect(disclosure().getAttribute('aria-expanded')).toBe('true');
  expect(globalThis.localStorage.getItem('pyrrhic.ui.v1')).toContain('"bonusesExpanded":true');

  first.unmount();
  render(<BonusesSection />);
  expect(disclosure().getAttribute('aria-expanded')).toBe('true');
});

test('a row switch takes its source in and out of the march', () => {
  render(<BonusesSection />);
  expand();
  addCaptain('Beowulf', '20');

  expect(profile()?.sources.captains).toHaveLength(1);
  expect(setup()?.active.captains).toHaveLength(1);
  expect(totals(card()).Health).toBe('+20 %');

  const beowulf = within(card()).getByRole('switch', { name: 'Beowulf' });
  expect((beowulf as HTMLInputElement).checked).toBe(true);
  fireEvent.click(beowulf);

  expect(setup()?.active.captains).toEqual([]);
  expect(profile()?.sources.captains).toHaveLength(1);
  expect(totals(card()).Health).toBe('0 %');
});

test('a row says what its source is worth, key named', () => {
  render(<BonusesSection />);
  expand();
  addCaptain('Aydae', '20');

  const row = within(card()).getByRole('switch', { name: 'Aydae' }).closest('li');
  expect(row?.textContent).toContain('+20 % health and strength (guardsmen)');
});

test('a permanent source has no switch, wears a gear, and always counts', () => {
  render(<BonusesSection />);
  expand();

  expect(within(card()).queryByRole('switch', { name: 'Hall of Fame' })).toBeNull();

  const sheet = openEditor('Hall of Fame');
  expect(within(sheet).getByRole('heading', { name: 'Hall of Fame' })).toBeTruthy();
  typeNumber(sheet, 'Army health', '40');
  done(sheet);

  expect(totals(card()).Health).toBe('+40 %');
});

test('the gear opens a sheet named after the source, and the TOTAL moves in both places', () => {
  render(<BonusesSection />);
  expand();
  addCaptain('Beowulf', '20');

  const sheet = openEditor('Beowulf');
  expect(within(sheet).getByRole('heading', { name: 'Beowulf' })).toBeTruthy();
  expect(totals(sheet).Health).toBe('+20 %');

  typeNumber(sheet, 'Base level', '30');

  expect(profile()?.sources.captains[0]?.level).toBe(30);
  expect(totals(sheet).Health).toBe('+30 %');
  expect(totals(card()).Health).toBe('+30 %');

  done(sheet);
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('the sheet says where the figures are read in game', () => {
  render(<BonusesSection />);
  expand();
  addCaptain('Aydae', '0');

  const sheet = openEditor('Aydae');
  expect(within(sheet).getByText(/the Captains screen/)).toBeTruthy();
});

test('adding a piece of equipment puts it in the list, switched on', () => {
  render(<BonusesSection />);
  expand();

  fireEvent.click(within(card()).getByRole('button', { name: 'Add equipment' }));
  const sheet = screen.getByRole('dialog');
  expect(within(sheet).getByLabelText('Equipment type')).toBeTruthy();
  done(sheet);

  expect(profile()?.sources.equipment).toHaveLength(1);
  expect(setup()?.active.equipment).toHaveLength(1);
  expect(within(card()).getByRole('switch', { name: 'Emerald Guardian' })).toBeTruthy();
  expect(totals(card()).Health).toBe('0 %');
});

test('changing an equipment quality moves the TOTAL', () => {
  render(<BonusesSection />);
  expand();
  fireEvent.click(within(card()).getByRole('button', { name: 'Add equipment' }));
  done(screen.getByRole('dialog'));

  const sheet = openEditor('Emerald Guardian');
  fireEvent.click(selectTrigger(sheet, 'Quality'));
  fireEvent.click(screen.getByRole('option', { name: 'Godlike' }));
  done(sheet);

  expect(profile()?.sources.equipment[0]?.quality).toBe('godlike');
  const row = within(card()).getByRole('switch', { name: 'Emerald Guardian' }).closest('li');
  expect(row?.textContent).toContain('+128 % health and strength (melee)');
});

test('a group says the cap the game puts on it', () => {
  render(<BonusesSection />);
  expand();
  addCaptain('Aydae', '10');

  expect(within(card()).getByText('1 of 3 captains on')).toBeTruthy();
});

test('a title has to be added before it can be worn, and giving it up removes the row', () => {
  render(<BonusesSection />);
  expand();

  fireEvent.click(within(card()).getByRole('button', { name: 'Add title' }));
  const sheet = screen.getByRole('dialog');
  const name = within(sheet).getByRole('heading', { level: 2 }).textContent ?? '';
  done(sheet);

  expect(profile()?.sources.titles).toEqual([expect.any(String)]);
  expect(setup()?.active.titles).toHaveLength(1);

  fireEvent.click(within(card()).getByRole('button', { name: `Edit ${name}` }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Give up this title' }));

  expect(profile()?.sources.titles).toEqual([]);
  expect(setup()?.active.titles).toEqual([]);
});

test('deleting a source switches it off in every battle setup', () => {
  render(<BonusesSection />);
  expand();
  addCaptain('Aydae', '20');
  fireEvent.click(within(card()).getByRole('button', { name: 'Duplicate battle setup' }));
  expect(profile()?.setups.every((entry) => entry.active.captains.length === 1)).toBe(true);

  const sheet = openEditor('Aydae');
  fireEvent.click(within(sheet).getByRole('button', { name: 'Remove captain' }));

  expect(profile()?.sources.captains).toEqual([]);
  expect(profile()?.setups.every((entry) => entry.active.captains.length === 0)).toBe(true);
});

test('every battle setup keeps its own selection of sources', () => {
  render(<BonusesSection />);
  expand();
  addCaptain('Beowulf', '20');
  const first = setup();

  fireEvent.click(within(card()).getByRole('button', { name: 'New battle setup' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Setup name'), { target: { value: 'Solo' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

  expect(profile()?.setups).toHaveLength(2);
  expect(setup()?.name).toBe('Solo');
  expect(setup()?.active.captains).toHaveLength(1);

  fireEvent.click(within(card()).getByRole('switch', { name: 'Beowulf' }));
  expect(setup()?.active.captains).toEqual([]);

  fireEvent.click(selectTrigger(card(), 'Battle setup'));
  fireEvent.click(screen.getByRole('option', { name: first?.name ?? '' }));

  expect(setup()?.id).toBe(first?.id);
  expect(totals(card()).Health).toBe('+20 %');
});

test('the temple and training row keeps the recovery settings behind its gear', () => {
  render(<BonusesSection />);
  expand();

  const sheet = openEditor('Temple and training');
  typeNumber(sheet, 'Temple level', '30');
  typeNumber(sheet, 'Guardsmen training cost reduction', '12.5');
  done(sheet);

  expect(profile()?.recovery.templeLevel).toBe(30);
  expect(profile()?.recovery.trainingCostReduction).toEqual({ guardsmen: 12.5 });
  expect(within(card()).getByText(/revival costs divided by 3.84/)).toBeTruthy();
});
