// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { StatBar } from './StatBar';

afterEach(cleanup);

const number = (n: number) => n.toLocaleString('en-US');

test('both bars are meters on the same scale, and both numbers are visible', () => {
  render(<StatBar label="Health" base={420} boosted={1260} format={number} />);

  const base = screen.getByRole('meter', { name: 'Health, base' });
  const boosted = screen.getByRole('meter', { name: 'Health, with bonuses' });

  expect(base.getAttribute('aria-valuenow')).toBe('420');
  expect(base.getAttribute('aria-valuemax')).toBe('1260');
  expect(boosted.getAttribute('aria-valuenow')).toBe('1260');
  expect(boosted.getAttribute('aria-valuemax')).toBe('1260');

  expect(screen.getByText('420')).toBeTruthy();
  expect(screen.getByText('1,260')).toBeTruthy();
});

test('the label is shown once and the rows are named', () => {
  render(<StatBar label="Strength" base={0} boosted={0} format={number} />);

  expect(screen.getByText('Strength')).toBeTruthy();
  expect(screen.getByText('Base')).toBeTruthy();
  expect(screen.getByText('With bonuses')).toBeTruthy();
  expect(screen.getByRole('meter', { name: 'Strength, base' }).getAttribute('aria-valuemax')).toBe('1');
});
