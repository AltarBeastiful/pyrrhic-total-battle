// @vitest-environment jsdom
/**
 * D-12 — the frame itself: the landmarks a screen reader navigates by, the setup beside the march,
 * the sections in the order the registry fixes, and nothing sticky anywhere (design plan §5.1).
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';

import { SECTIONS } from '../sections';
import { AppLayout } from './AppLayout';

// The first render compiles every section; under full-suite load that costs more than the default
// budget, and it is the cost of the import rather than a hang.
vi.setConfig({ testTimeout: 30_000 });

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

test('the page is a banner, one main and a footer — and no jump bar', () => {
  render(<AppLayout />);

  expect(screen.getByRole('banner')).toBeTruthy();
  expect(screen.getByRole('main')).toBeTruthy();
  expect(screen.getByRole('contentinfo')).toBeTruthy();
  expect(screen.queryByRole('navigation')).toBeNull();
});

test('a keyboard reaches the calculator without walking the header', () => {
  render(<AppLayout />);
  const skip = screen.getByRole('link', { name: 'Skip to the calculator' });
  expect(skip.getAttribute('href')).toBe('#main');
  expect(screen.getByRole('main').id).toBe('main');
});

test('the brand is the only H1, and every section is a region in registry order', () => {
  const { container } = render(<AppLayout />);

  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Pyrrhic');

  // How a card heads itself is the card's business (a disclosure, a card title); the frame only
  // owns which cards are on the page and in what order.
  const ids = [...container.querySelectorAll('main section[id]')].map((node) => node.id);
  expect(ids).toEqual(SECTIONS.map((section) => section.id));
});

test('the setup sits in one column and the march in the other', () => {
  const { container } = render(<AppLayout />);
  const columns = container.querySelectorAll('main > div');
  expect(columns).toHaveLength(2);

  const setup = [...(columns[0]?.querySelectorAll('section[id]') ?? [])].map((node) => node.id);
  const march = [...(columns[1]?.querySelectorAll('section[id]') ?? [])].map((node) => node.id);
  expect(setup).toEqual(SECTIONS.filter((section) => section.id !== 'results').map((s) => s.id));
  expect(march).toEqual(['results']);
});

test('the app bar is the only sticky element, the floating button the only fixed one', () => {
  const { container } = render(<AppLayout />);

  const sticky = [...container.querySelectorAll('.sticky')];
  expect(sticky).toHaveLength(1);
  expect(sticky[0]?.tagName.toLowerCase()).toBe('header');

  const fixed = [...container.querySelectorAll('.fixed')];
  expect(fixed).toHaveLength(1);
  expect(fixed[0]?.querySelector('button')?.getAttribute('aria-label')).toContain('Generate march');

  // The supporting pane is the one exception, and the frame only lets it stick where it really sits
  // beside the page: on a narrow window (what jsdom reports) it is part of the one page scroll.
  expect(container.querySelectorAll('.pane-sticky')).toHaveLength(0);
});

test('the page keeps one scrollbar: no column owns the viewport', () => {
  const { container } = render(<AppLayout />);
  const main = container.querySelector('main');

  expect(main?.className).not.toContain('h-dvh');
  expect(main?.className).not.toContain('overflow-hidden');
  for (const column of Array.from(main?.children ?? [])) {
    expect((column as HTMLElement).className).not.toContain('overflow-y-auto');
  }
});

test('one Generate control per screen: the app bar above xl, the floating button below', () => {
  const { container } = render(<AppLayout />);
  const controls = screen.getAllByRole('button', { name: /^Generate march/ });

  expect(controls).toHaveLength(2);
  expect(controls[0]?.closest('.hidden.xl\\:block')).not.toBeNull();
  expect(controls[1]?.closest('.xl\\:hidden')).not.toBeNull();
  expect(container.querySelectorAll('.xl\\:hidden .fixed')).toHaveLength(1);
});

test('the frame adds no heading of its own between the brand and the cards', () => {
  const { container } = render(<AppLayout />);
  const stray = [...container.querySelectorAll('main h2, main h3')].filter(
    (heading) => heading.closest('section[id]') === null,
  );
  expect(stray).toEqual([]);
});
