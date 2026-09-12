// @vitest-environment jsdom
/**
 * S-52 — the shell's skeleton: the landmarks a screen reader navigates by, one H1, one H2 per
 * section, and the jump bar that makes a seven-section page usable on a phone.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';

import { AppShell } from './AppShell';
import { SECTIONS } from './sections';

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

test('the page is laid out as landmarks: a banner, a nav, one main and a footer', () => {
  render(<AppShell />);

  expect(screen.getByRole('banner')).toBeTruthy();
  expect(screen.getByRole('main')).toBeTruthy();
  expect(screen.getByRole('contentinfo')).toBeTruthy();
  expect(screen.getByRole('navigation', { name: 'Jump to a section' })).toBeTruthy();
});

test('a keyboard reaches the calculator without walking the whole header', () => {
  render(<AppShell />);
  const skip = screen.getByRole('link', { name: 'Skip to the calculator' });
  expect(skip.getAttribute('href')).toBe('#main');
  expect(screen.getByRole('main').id).toBe('main');
});

test('there is exactly one H1, and one H2 per section in page order', () => {
  render(<AppShell />);

  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Pyrrhic');

  const headings = screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent);
  expect(headings).toEqual(SECTIONS.map((section) => section.title));
});

test('every H3 sits inside a section, so the outline never skips a level', () => {
  const { container } = render(<AppShell />);
  const stray = [...container.querySelectorAll('h3')].filter(
    (heading) => heading.closest('section[aria-labelledby]') === null,
  );
  expect(stray).toEqual([]);
});

test('the jump bar links to every section anchor', () => {
  render(<AppShell />);
  const nav = screen.getByRole('navigation', { name: 'Jump to a section' });
  const links = within(nav).getAllByRole('link');

  expect(links.map((link) => link.textContent)).toEqual(SECTIONS.map((section) => section.title));
  expect(links.map((link) => link.getAttribute('href'))).toEqual(SECTIONS.map((section) => `#${section.id}`));
  for (const section of SECTIONS) {
    expect(document.querySelector(`section#${section.id}`)).not.toBeNull();
  }
});

test('a section can be folded away, which is what makes the page navigable on a phone', () => {
  render(<AppShell />);
  const toggle = screen.getByRole('button', { name: 'Troops', expanded: true });
  fireEvent.click(toggle);
  expect(screen.getByRole('button', { name: 'Troops', expanded: false })).toBeTruthy();
});
