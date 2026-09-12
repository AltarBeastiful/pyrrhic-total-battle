// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import { MethodSection } from './MethodSection';

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

const options = () => selectActiveSetup(useStore.getState())?.options;

/** The header line, which is all a collapsed section shows of the method. */
const summary = () =>
  (document.querySelector('#method-summary')?.textContent ?? '').replace(/\s+/g, ' ').trim();

test('the header names the rule and every extra rule that is on', () => {
  render(<MethodSection />);
  expect(summary()).toBe('Tier ladder');

  fireEvent.click(screen.getByRole('switch', { name: 'Monsters after troops' }));
  fireEvent.click(screen.getByRole('switch', { name: 'Hired units in tens' }));
  expect(summary()).toBe('Tier ladder \u00b7 monsters after troops \u00b7 tens');

  fireEvent.click(screen.getByRole('radio', { name: 'Your own order' }));
  expect(summary()).toBe('Your own order \u00b7 tens');
});

/** Tier-ladder order of the default account (guardsmen I–III, specialists I). */
const DEFAULT_ORDER = [
  'swordsman-1',
  'archer-1',
  'spearman-1',
  'rider-1',
  'archer-2',
  'spearman-2',
  'rider-2',
  'archer-3',
  'spearman-3',
  'rider-3',
];

function chooseCustom(): void {
  fireEvent.click(screen.getByRole('radio', { name: 'Your own order' }));
}

test('choosing a method writes it to the active battle setup', () => {
  render(<MethodSection />);
  expect(screen.getByRole('radio', { name: 'Tier ladder' })).toBeTruthy();

  fireEvent.click(screen.getByRole('radio', { name: 'Troops first' }));
  expect(options()?.method).toBe('ms');

  chooseCustom();
  expect(options()?.method).toBe('custom');
});

test('each extra rule is only offered with the method it belongs to, and is cleared otherwise', () => {
  render(<MethodSection />);
  const monstersLast = screen.getByRole('switch', { name: 'Monsters after troops' });
  const strict = screen.getByRole('switch', { name: 'Monsters after mercenaries' });

  expect(strict.hasAttribute('disabled')).toBe(true);
  fireEvent.click(monstersLast);
  expect(options()?.monstersLast).toBe(true);

  fireEvent.click(screen.getByRole('radio', { name: 'Troops first' }));
  expect(options()?.monstersLast).toBe(false);
  expect(screen.getByRole('switch', { name: 'Monsters after troops' }).hasAttribute('disabled')).toBe(true);

  fireEvent.click(screen.getByRole('switch', { name: 'Monsters after mercenaries' }));
  expect(options()?.strictMercsAboveMonsters).toBe(true);

  fireEvent.click(screen.getByRole('radio', { name: 'Tier ladder' }));
  expect(options()?.strictMercsAboveMonsters).toBe(false);
});

test('damage trades are offered only with Troops first and are cleared when it is left', () => {
  render(<MethodSection />);
  const underElite = screen.getByRole('switch', { name: 'Allow damage trades' });
  expect(underElite.hasAttribute('disabled')).toBe(true);
  fireEvent.click(underElite);
  expect(options()?.relaxedPreservation).toBe(false);

  fireEvent.click(screen.getByRole('radio', { name: 'Troops first' }));
  fireEvent.click(screen.getByRole('switch', { name: 'Allow damage trades' }));
  expect(options()?.relaxedPreservation).toBe(true);

  fireEvent.click(screen.getByRole('radio', { name: 'Tier ladder' }));
  expect(options()?.relaxedPreservation).toBe(false);
});

test('hired units in tens is available whatever the method is', () => {
  render(<MethodSection />);
  fireEvent.click(screen.getByRole('switch', { name: 'Hired units in tens' }));
  expect(options()?.roundTo10).toBe(true);
});

test('your own order starts as the tier ladder, first to fall on top', () => {
  render(<MethodSection />);
  expect(screen.queryByRole('button', { name: 'Move Archer I down' })).toBeNull();

  chooseCustom();
  const names = screen
    .getAllByRole('button', { name: /^Reorder / })
    .map((node) => node.getAttribute('aria-label')?.replace('Reorder ', ''));
  expect(names).toEqual([
    'Swordsman I',
    'Archer I',
    'Spearman I',
    'Rider I',
    'Archer II',
    'Spearman II',
    'Rider II',
    'Archer III',
    'Spearman III',
    'Rider III',
  ]);
});

test('the up and down buttons reorder the list and store the whole order', () => {
  render(<MethodSection />);
  chooseCustom();

  fireEvent.click(screen.getByRole('button', { name: 'Move Rider III up' }));
  expect(options()?.customOrder).toEqual([
    'swordsman-1',
    'archer-1',
    'spearman-1',
    'rider-1',
    'archer-2',
    'spearman-2',
    'rider-2',
    'archer-3',
    'rider-3',
    'spearman-3',
  ]);

  fireEvent.click(screen.getByRole('button', { name: 'Move Swordsman I down' }));
  expect(options()?.customOrder?.slice(0, 2)).toEqual(['archer-1', 'swordsman-1']);

  // The ends of the list cannot move any further.
  expect(screen.getByRole('button', { name: 'Move Archer I up' }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByRole('button', { name: 'Move Spearman III down' }).hasAttribute('disabled')).toBe(true);
});

test('the reset puts the tier-ladder order back and is disabled once it is the default', () => {
  render(<MethodSection />);
  chooseCustom();
  expect(screen.getByRole('button', { name: 'Back to the tier ladder' }).hasAttribute('disabled')).toBe(true);

  fireEvent.click(screen.getByRole('button', { name: 'Move Rider III up' }));
  const reset = screen.getByRole('button', { name: 'Back to the tier ladder' });
  expect(reset.hasAttribute('disabled')).toBe(false);

  fireEvent.click(reset);
  expect(options()?.customOrder).toEqual(DEFAULT_ORDER);
  expect(screen.getByRole('button', { name: 'Back to the tier ladder' }).hasAttribute('disabled')).toBe(true);
});

test('a stored order survives a change of army: gone units drop out, new ones join at the end', () => {
  render(<MethodSection />);
  chooseCustom();
  fireEvent.click(screen.getByRole('button', { name: 'Move Rider III up' }));

  // The account unlocks specialists II while keeping its custom order.
  const profile = selectActiveProfile(useStore.getState());
  act(() => {
    useStore.getState().updateProfile(profile?.id ?? '', (current) => ({
      troops: { ...current.troops, specialists: { min: 1, max: 2 }, excludedUnitIds: ['archer-1'] },
    }));
  });

  const names = screen
    .getAllByRole('button', { name: /^Reorder / })
    .map((node) => node.getAttribute('aria-label')?.replace('Reorder ', ''));
  expect(names).not.toContain('Archer I');
  expect(names[names.length - 1]).toBe('Swordsman II');
  expect(names.indexOf('Rider III')).toBeLessThan(names.indexOf('Spearman III'));
});
