// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { Split } from './Split';

afterEach(() => {
  cleanup();
});

test('the two halves are rendered in order, each in its own scrolling column', () => {
  render(<Split data-testid="split" start={<p>editor</p>} end={<p>result</p>} />);
  const split = screen.getByTestId('split');
  const [start, end] = Array.from(split.children) as HTMLElement[];

  expect(start?.textContent).toBe('editor');
  expect(end?.textContent).toBe('result');
  for (const column of [start, end]) {
    expect(column?.className.split(' ')).toEqual(
      expect.arrayContaining(['min-w-0', 'lg:h-dvh', 'lg:overflow-y-auto']),
    );
  }
});

test('from the breakpoint up the frame owns the viewport, so the page itself cannot scroll', () => {
  render(<Split data-testid="split" start="a" end="b" />);
  const split = screen.getByTestId('split');
  expect(split.className.split(' ')).toEqual(
    expect.arrayContaining(['grid', 'lg:h-dvh', 'lg:grid-cols-12', 'lg:overflow-hidden']),
  );
});

test('the default ratio is 5/7 and `1/1` halves the frame', () => {
  const { rerender } = render(<Split data-testid="split" start="a" end="b" />);
  let columns = Array.from(screen.getByTestId('split').children) as HTMLElement[];
  expect(columns[0]?.className).toContain('lg:col-span-5');
  expect(columns[1]?.className).toContain('lg:col-span-7');

  rerender(<Split data-testid="split" ratio="1/1" start="a" end="b" />);
  columns = Array.from(screen.getByTestId('split').children) as HTMLElement[];
  expect(columns[0]?.className).toContain('lg:col-span-6');
  expect(columns[1]?.className).toContain('lg:col-span-6');
});

test('the breakpoint moves every responsive class with it', () => {
  render(<Split data-testid="split" breakpoint="md" start="a" end="b" />);
  const split = screen.getByTestId('split');
  expect(split.className).toContain('md:grid-cols-12');
  expect(split.className).not.toContain('lg:');
  expect((split.children[0] as HTMLElement).className).toContain('md:col-span-5');
});
