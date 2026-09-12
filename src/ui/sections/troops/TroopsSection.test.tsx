// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';

import { TroopsSection } from './TroopsSection';

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

const troops = () => selectActiveProfile(useStore.getState())?.troops;

/** The header line, as a player reads it: it stays in the header whether the body is open or not. */
const summary = () =>
  (document.querySelector('#troops-summary')?.textContent ?? '').replace(/\s+/g, ' ').trim();

test('the header sums the account up in one line: tiers, what was dropped, how many types', () => {
  render(<TroopsSection />);
  expect(summary()).toBe(
    'Guardsmen G1\u2013G3 \u00b7 Specialists S1 \u00b7 no engineers \u00b7 no monsters \u00b7 10 types',
  );

  fireEvent.click(screen.getByRole('button', { name: 'G3 Mounted', pressed: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Archer I', pressed: true }));

  expect(summary()).toBe(
    'Guardsmen G1\u2013G3 (no mounted at G3) \u00b7 Specialists S1 \u00b7 no engineers \u00b7 no monsters \u00b7 9 types, 1 left out',
  );
});

test('a fresh profile shows its unlocked tiers and every unit they contain', () => {
  render(<TroopsSection />);
  // Default account: guardsmen I–III and specialists I, so ten unit types.
  expect(screen.getByText('(10 in, 0 out)')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Archer I', pressed: true })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Swordsman II' })).toBeNull();
});

test('raising the highest tier widens the range and adds the new units', () => {
  render(<TroopsSection />);
  fireEvent.change(screen.getByLabelText('Specialists highest tier'), { target: { value: '3' } });

  expect(troops()?.specialists).toEqual({ min: 1, max: 3 });
  expect(screen.getByRole('button', { name: 'Swordsman III', pressed: true })).toBeTruthy();
});

test('lowering the lowest tier past the highest one pushes it instead of inverting the range', () => {
  render(<TroopsSection />);
  fireEvent.change(screen.getByLabelText('Guardsmen lowest tier'), { target: { value: '5' } });

  expect(troops()?.guardsmen).toEqual({ min: 5, max: 5 });
});

test('switching a family off stores null and switching it back on starts at its lowest tier', () => {
  render(<TroopsSection />);
  expect(troops()?.monsters).toBeNull();

  fireEvent.click(screen.getByRole('switch', { name: 'Monsters unlocked' }));

  // Monsters only exist from tier 3 in the tables, so "on" cannot mean tier 1.
  expect(troops()?.monsters).toEqual({ min: 3, max: 3 });
});

test('a top-tier category chip drops that category from the highest tier only', () => {
  render(<TroopsSection />);
  fireEvent.click(screen.getByRole('button', { name: 'G3 Melee', pressed: true }));

  expect(troops()?.topTierExcluded.guardsmen).toEqual(['melee']);
  expect(screen.queryByRole('button', { name: 'Spearman III' })).toBeNull();
  // Lower tiers keep their melee unit.
  expect(screen.getByRole('button', { name: 'Spearman II', pressed: true })).toBeTruthy();
});

test('moving the highest tier clears the chips, which described the old tier', () => {
  render(<TroopsSection />);
  fireEvent.click(screen.getByRole('button', { name: 'G3 Mounted', pressed: true }));
  expect(troops()?.topTierExcluded.guardsmen).toEqual(['mounted']);

  fireEvent.change(screen.getByLabelText('Guardsmen highest tier'), { target: { value: '4' } });

  expect(troops()?.topTierExcluded.guardsmen).toEqual([]);
  expect(screen.getByRole('button', { name: 'Rider III', pressed: true })).toBeTruthy();
});

test('a single unit can be left out and restored, one by one or all at once', () => {
  render(<TroopsSection />);
  const restoreAll = screen.getByRole('button', { name: 'Restore all units' });
  expect(restoreAll.hasAttribute('disabled')).toBe(true);

  fireEvent.click(screen.getByRole('button', { name: 'Archer I', pressed: true }));
  expect(troops()?.excludedUnitIds).toEqual(['archer-1']);
  expect(screen.getByRole('button', { name: 'Archer I', pressed: false })).toBeTruthy();
  expect(screen.getByText('(9 in, 1 out)')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Rider II', pressed: true }));
  expect(troops()?.excludedUnitIds).toEqual(['archer-1', 'rider-2']);

  fireEvent.click(screen.getByRole('button', { name: 'Archer I', pressed: false }));
  expect(troops()?.excludedUnitIds).toEqual(['rider-2']);

  fireEvent.click(screen.getByRole('button', { name: 'Restore all units' }));
  expect(troops()?.excludedUnitIds).toEqual([]);
  expect(screen.getByText('(10 in, 0 out)')).toBeTruthy();
});
