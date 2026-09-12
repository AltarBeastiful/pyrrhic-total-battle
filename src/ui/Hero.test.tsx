// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { Hero } from './Hero';

afterEach(() => {
  cleanup();
});

test('the hero is the page H1 and nothing else is read out of it', () => {
  render(<Hero />);
  const heading = screen.getByRole('heading', { level: 1 });
  // The shell tests assume this exact string: it is the app's only H1.
  expect(heading.textContent).toBe('Pyrrhic');
});

test('the promise is stated in one line, in our own words', () => {
  render(<Hero />);
  expect(
    screen.getByText('Plan your epic-monster march. Free, offline, nothing leaves your browser.'),
  ).toBeTruthy();
});

test('the illustration is decorative: it never reaches the accessibility tree', () => {
  const { container } = render(<Hero />);
  const svg = container.querySelector('svg');

  expect(svg).not.toBeNull();
  expect(svg?.getAttribute('aria-hidden')).toBe('true');
  expect(svg?.querySelector('title')).toBeNull();
  expect(screen.queryAllByRole('img')).toEqual([]);
});

test('the actions slot sits with the title', () => {
  render(<Hero actions={<button type="button">About</button>} />);
  expect(screen.getByRole('button', { name: 'About' })).toBeTruthy();
});
