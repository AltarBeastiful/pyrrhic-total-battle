// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { Split } from './Split';

afterEach(() => {
  cleanup();
});

test('the two halves are rendered in order, the pane a fixed width beside the page', () => {
  render(<Split data-testid="split" start={<p>editor</p>} end={<p>result</p>} />);
  const split = screen.getByTestId('split');
  const [start, end] = Array.from(split.children) as HTMLElement[];

  expect(start?.textContent).toBe('editor');
  expect(end?.textContent).toBe('result');
  expect(start?.className.split(' ')).toEqual(expect.arrayContaining(['min-w-0', 'xl:flex-1']));
  expect(end?.className.split(' ')).toEqual(expect.arrayContaining(['xl:w-pane', 'xl:shrink-0']));
});

test('the page keeps its one scrollbar: no column owns the viewport', () => {
  render(<Split data-testid="split" start="a" end="b" />);
  const split = screen.getByTestId('split');
  const classes = [split, ...Array.from(split.children)]
    .map((node) => (node as HTMLElement).className)
    .join(' ');

  for (const trapped of ['h-dvh', 'overflow-hidden', 'overflow-y-auto', 'overscroll-contain']) {
    expect(classes).not.toContain(trapped);
  }
  expect(split.className.split(' ')).toEqual(expect.arrayContaining(['flex', 'flex-col', 'xl:flex-row']));
});

test('the pane sticks only when it is asked to: the class carries no breakpoint', () => {
  const { rerender } = render(<Split data-testid="split" start="a" end="b" />);
  const pane = (): HTMLElement => screen.getByTestId('split').children[1] as HTMLElement;
  expect(pane().className).not.toContain('pane-sticky');

  rerender(<Split data-testid="split" sticky start="a" end="b" />);
  expect(pane().className).toContain('pane-sticky');
});

test('the two panes are 24 px apart on a wide screen', () => {
  render(<Split data-testid="split" start="a" end="b" />);
  expect(screen.getByTestId('split').className).toContain('xl:gap-6');
});
