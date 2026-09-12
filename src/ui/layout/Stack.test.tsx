// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { Stack } from './Stack';

afterEach(() => {
  cleanup();
});

test('a stack is a column with the default gap, and renders what it is given', () => {
  render(
    <Stack data-testid="stack">
      <span>first</span>
      <span>second</span>
    </Stack>,
  );
  const stack = screen.getByTestId('stack');
  expect(stack.tagName).toBe('DIV');
  expect(stack.className.split(' ')).toEqual(
    expect.arrayContaining(['flex', 'flex-col', 'gap-3', 'items-stretch']),
  );
  expect(stack.textContent).toBe('firstsecond');
});

test('gap and align are variants, and `as` changes the element', () => {
  render(<Stack as="ul" gap={6} align="center" aria-label="things" />);
  const stack = screen.getByRole('list', { name: 'things' });
  expect(stack.tagName).toBe('UL');
  expect(stack.className).toContain('gap-6');
  expect(stack.className).toContain('items-center');
});

test('a className given by the caller wins over the variant it conflicts with', () => {
  render(<Stack className="gap-1" data-testid="stack" />);
  const stack = screen.getByTestId('stack');
  expect(stack.className).toContain('gap-1');
  expect(stack.className).not.toContain('gap-3');
});
