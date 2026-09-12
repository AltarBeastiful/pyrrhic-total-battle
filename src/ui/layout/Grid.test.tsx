// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { Grid } from './Grid';

afterEach(() => {
  cleanup();
});

test('one count applies at every width', () => {
  render(<Grid cols={3} data-testid="grid" />);
  const grid = screen.getByTestId('grid');
  expect(grid.className.split(' ')).toEqual(expect.arrayContaining(['grid', 'grid-cols-3', 'gap-3']));
});

test('a count per breakpoint becomes one class per breakpoint, phone first', () => {
  render(<Grid cols={{ base: 2, sm: 3, lg: 4 }} gap={4} data-testid="grid" />);
  const grid = screen.getByTestId('grid');
  expect(grid.className.split(' ')).toEqual(
    expect.arrayContaining(['grid-cols-2', 'sm:grid-cols-3', 'lg:grid-cols-4', 'gap-4']),
  );
});

test('an object without a base starts at one column', () => {
  render(<Grid cols={{ lg: 2 }} data-testid="grid" />);
  const grid = screen.getByTestId('grid');
  expect(grid.className).toContain('grid-cols-1');
  expect(grid.className).toContain('lg:grid-cols-2');
  expect(grid.className).not.toContain('sm:grid-cols');
});
