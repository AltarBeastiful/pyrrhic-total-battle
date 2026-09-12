// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import { BonusesSection } from './BonusesSection';

// The section pulls in every data table and renders nine blocks; under full-suite load the first
// render can exceed the default 5 s budget, which is the cost of the import, not a hang.
vi.setConfig({ testTimeout: 30_000 });

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

const profile = () => selectActiveProfile(useStore.getState());
const setup = () => selectActiveSetup(useStore.getState());

type CardName = 'Health totals' | 'Strength totals' | 'Special totals';

/** The TOTAL row for one key, as text ("Guardsmen+20 %"); rows nothing feeds are not rendered at all. */
function totalRow(card: CardName, key: string): string {
  const region = screen.getByRole('region', { name: card });
  const row = within(region).getByText(key).closest('summary');
  return row?.textContent ?? '';
}

function hasTotalRow(card: CardName, key: string): boolean {
  const region = screen.getByRole('region', { name: card });
  return within(region).queryByText(key) !== null;
}

/** Opens the editor behind a chip's gear and returns its dialog. */
function openDialog(name: string): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name }));
  return screen.getByRole('dialog');
}

function done(dialog: HTMLElement): void {
  fireEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
}

/** Adds Aydae at the given base level; she gives guardsmen health and strength, 1 % per level. */
function addAydae(level: string): void {
  fireEvent.change(screen.getByLabelText('Captain to add'), { target: { value: 'aydae' } });
  const dialog = openDialog('Add captain');
  fireEvent.change(within(dialog).getByLabelText('Base level'), { target: { value: level } });
  done(dialog);
}

/** The header line, which stays visible when the section is folded. */
function headerSummary(): string {
  return screen.getByText(/^Army health/).textContent ?? '';
}

test('the header summary carries the army totals and what is switched on', () => {
  render(<BonusesSection />);
  expect(headerSummary()).toContain('Army health 0 %');

  const permanent = openDialog('Edit Hall of Fame');
  fireEvent.change(within(permanent).getByLabelText('Hall of Fame Army health'), {
    target: { value: '40' },
  });
  done(permanent);
  addAydae('20');

  const summary = headerSummary();
  expect(summary).toContain('Army health +40 %');
  expect(summary).toContain('1 permanent');
  expect(summary).toContain('1 captain');
  expect(summary).not.toContain('2 captains');
});

test('a captain at level 20 shows up in the guardsmen totals', () => {
  render(<BonusesSection />);
  addAydae('20');

  expect(profile()?.sources.captains).toHaveLength(1);
  expect(setup()?.active.captains).toHaveLength(1);
  expect(totalRow('Health totals', 'Guardsmen')).toContain('+20 %');
  expect(totalRow('Strength totals', 'Guardsmen')).toContain('+20 %');
});

test('switching a chip off takes its source out of the totals', () => {
  render(<BonusesSection />);
  addAydae('20');

  fireEvent.click(screen.getByRole('button', { name: /^Aydae/ }));

  expect(setup()?.active.captains).toEqual([]);
  expect(profile()?.sources.captains).toHaveLength(1);
  expect(hasTotalRow('Health totals', 'Guardsmen')).toBe(false);
});

test('the breakdown names the source that feeds a key', () => {
  render(<BonusesSection />);
  addAydae('20');

  const region = screen.getByRole('region', { name: 'Health totals' });
  expect(within(region).getByText(/^Aydae L20/)).toBeTruthy();
});

test('a permanent editor is always on and feeds the totals', () => {
  render(<BonusesSection />);
  const dialog = openDialog('Edit Hall of Fame');
  fireEvent.change(within(dialog).getByLabelText('Hall of Fame Army health'), { target: { value: '40' } });
  done(dialog);

  expect(totalRow('Health totals', 'Army')).toContain('+40 %');
  expect(screen.queryByRole('button', { name: /^Hall of Fame$/ })).toBeNull();
});

test('changing an equipment quality moves the totals', () => {
  render(<BonusesSection />);
  const dialog = openDialog('Add a piece');
  expect(within(dialog).getByLabelText('Equipment type')).toBeTruthy();
  done(dialog);
  expect(totalRow('Health totals', 'Melee')).toContain('+16 %');

  const again = openDialog('Edit Emerald Guardian');
  fireEvent.change(within(again).getByLabelText('Quality'), { target: { value: 'godlike' } });
  done(again);

  expect(profile()?.sources.equipment[0]?.quality).toBe('godlike');
  expect(totalRow('Health totals', 'Melee')).toContain('+128 %');
});

test('an artifact without a level table uses the value typed by hand', () => {
  render(<BonusesSection />);
  const dialog = openDialog('Add an artifact');
  fireEvent.change(within(dialog).getByLabelText('Artifact'), { target: { value: 'forest-crown' } });
  fireEvent.change(within(dialog).getByLabelText('Hand-typed Army health'), { target: { value: '30' } });
  done(dialog);

  expect(profile()?.sources.artifacts[0]?.manual?.health).toEqual({ army: 30 });
  expect(totalRow('Health totals', 'Army')).toContain('+30 %');
  expect(screen.getByText(/no level table yet/)).toBeTruthy();
});

test('a title has to be owned before it can be worn on a march', () => {
  render(<BonusesSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Manage titles' }));
  fireEvent.click(screen.getByRole('switch', { name: 'Battlemaster' }));
  fireEvent.keyDown(document.body, { key: 'Escape' });

  expect(profile()?.sources.titles).toEqual(['battlemaster']);
  expect(setup()?.active.titles).toEqual([]);

  fireEvent.click(screen.getByRole('button', { name: /^Battlemaster/ }));

  expect(setup()?.active.titles).toEqual(['battlemaster']);
  expect(totalRow('Health totals', 'Army')).toContain('+150 %');
  expect(totalRow('Special totals', 'Double damage chance')).toContain('+5 %');
});

test('every battle setup keeps its own selection of sources', () => {
  render(<BonusesSection />);
  addAydae('20');
  const first = setup();

  const dialog = openDialog('New battle setup');
  fireEvent.change(within(dialog).getByLabelText('Setup name'), { target: { value: 'Solo' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

  expect(profile()?.setups).toHaveLength(2);
  expect(setup()?.name).toBe('Solo');
  expect(setup()?.active.captains).toHaveLength(1);

  fireEvent.click(screen.getByRole('button', { name: /^Aydae/ }));
  expect(setup()?.active.captains).toEqual([]);

  fireEvent.change(screen.getByLabelText('Battle setup'), { target: { value: first?.id ?? '' } });

  expect(setup()?.id).toBe(first?.id);
  expect(setup()?.active.captains).toHaveLength(1);
  expect(totalRow('Health totals', 'Guardsmen')).toContain('+20 %');
});

test('deleting a source switches it off in every setup', () => {
  render(<BonusesSection />);
  addAydae('20');
  fireEvent.click(screen.getByRole('button', { name: 'Duplicate battle setup' }));
  expect(profile()?.setups.every((entry) => entry.active.captains.length === 1)).toBe(true);

  const dialog = openDialog('Edit Aydae');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Remove captain' }));

  expect(profile()?.sources.captains).toEqual([]);
  expect(profile()?.setups.every((entry) => entry.active.captains.length === 0)).toBe(true);
});

test('the temple level shows the divisor it applies to revival costs', () => {
  render(<BonusesSection />);
  fireEvent.change(screen.getByLabelText('Temple level'), { target: { value: '30' } });

  expect(profile()?.recovery.templeLevel).toBe(30);
  expect(screen.getByText('Revival costs divided by')).toBeTruthy();
  expect(screen.getByText('3.84')).toBeTruthy();
});

test('training reduction and speed are stored per group', () => {
  render(<BonusesSection />);
  fireEvent.change(screen.getByLabelText('Guardsmen training cost reduction'), { target: { value: '12.5' } });
  fireEvent.change(screen.getByLabelText('Monsters training speed'), { target: { value: '40' } });

  expect(profile()?.recovery.trainingCostReduction).toEqual({ guardsmen: 12.5 });
  expect(profile()?.recovery.trainingSpeed).toEqual({ monster: 40 });
});
