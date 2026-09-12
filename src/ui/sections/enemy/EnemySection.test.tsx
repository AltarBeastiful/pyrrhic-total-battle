// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveSetup, useStore } from '@/state/store';

import { EnemySection } from './EnemySection';

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

const enemy = () => selectActiveSetup(useStore.getState())?.enemy;

test('starts on the standard four-squad formation', () => {
  render(<EnemySection />);
  expect(screen.getByRole('button', { name: 'Standard 4' }).getAttribute('aria-pressed')).toBe('true');
  expect(enemy()).toEqual({ melee: 1, ranged: 1, mounted: 1, flying: 1 });
});

test('switching to the double preset writes eight squads to the march', () => {
  render(<EnemySection />);
  fireEvent.click(screen.getByRole('button', { name: 'Double 8' }));

  expect(enemy()).toEqual({ melee: 2, ranged: 2, mounted: 2, flying: 2 });
  expect(screen.getByRole('button', { name: 'Double 8' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByText(/8 squads in total/)).toBeTruthy();
});

test('custom reveals one field per category and writes what is typed', () => {
  render(<EnemySection />);
  expect(screen.queryByLabelText('Flying')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
  const flying = screen.getByLabelText('Flying');
  fireEvent.change(flying, { target: { value: '3' } });

  expect(enemy()).toEqual({ melee: 1, ranged: 1, mounted: 1, flying: 3 });
});

test('an event that forces a formation locks the section', () => {
  const setup = selectActiveSetup(useStore.getState());
  useStore.getState().updateActiveSetup({ active: { ...setup!.active, events: ['arachnes'] } });
  render(<EnemySection />);

  expect(screen.queryByRole('button', { name: 'Double 8' })).toBeNull();
  expect(screen.getByText(/An active event sets the formation/)).toBeTruthy();
});
