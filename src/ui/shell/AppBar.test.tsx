// @vitest-environment jsdom
/**
 * The sticky app bar: the brand, the answer the last run produced, and the two controls that act on
 * it. It is the one bar the design review kept, so what it carries is worth a test of its own.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';

import { useResultStore } from '../resultStore';
import { useRunStore } from '../sections/results/runStore';
import { AppBar } from './AppBar';
import { MEDIUM } from './useMediaQuery';

const realMatchMedia = window.matchMedia;

/** Stand in for the browser: only the listed queries match. */
function stubMedia(matching: string[]): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (media: string) => ({
      media,
      matches: matching.includes(media),
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

/** Just enough of a result for the bar's one line, with two stacks to draw tiles for. */
function putResult(): void {
  useResultStore.setState({
    last: {
      request: { units: [] },
      result: { stacks: [{ unitId: 'archer-3' }, { unitId: 'swordsman-3' }] },
      summary: {
        avgDamage: 1_670_000,
        minDamage: 1_290_000,
        journals: { enemyFirst: { friendlyHits: 2 } },
      },
      profileId: 'p',
      setupId: 's',
      at: 1,
    },
  } as never);
}

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  useResultStore.getState().clear();
  useRunStore.getState().reset();
  stubMedia([MEDIUM]);
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: realMatchMedia,
  });
});

test('the bar sticks, and it is the page banner', () => {
  const { container } = render(<AppBar />);
  const header = container.querySelector('header');

  expect(header?.className.split(' ')).toEqual(expect.arrayContaining(['sticky', 'top-0', 'z-30']));
  expect(screen.getByRole('banner')).toBe(header);
  expect(container.querySelector('.h-appbar')).not.toBeNull();
});

test('the brand is the page H1 and the account menu is the other end of the bar', () => {
  render(<AppBar />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Pyrrhic');
  expect(screen.getByRole('button', { name: 'Account: My account' })).toBeTruthy();
});

test('the centre says there is no march until there is one, then reads it out', () => {
  const { rerender } = render(<AppBar />);
  expect(screen.getByText('No march yet')).toBeTruthy();

  putResult();
  rerender(<AppBar />);
  expect(screen.getByText(/avg 1\.67M · min 1\.29M · 2/)).toBeTruthy();
  expect(screen.queryByText(/since this result/)).toBeNull();

  // …and the march it belongs to, as tiles, from a medium window up.
  expect(screen.getByText('Archer III, tier 3, on')).toBeTruthy();
  expect(screen.getByText('Swordsman III, tier 3, on')).toBeTruthy();
});

test('a compact window keeps the bar to the brand and the two controls', () => {
  putResult();
  stubMedia([]);
  render(<AppBar />);

  expect(screen.queryByText(/^avg /)).toBeNull();
  expect(screen.queryByText('Archer III, tier 3, on')).toBeNull();
  expect(screen.getByRole('button', { name: /^Account: / })).toBeTruthy();
});

test('an edit after a result marks the answer as changed', () => {
  putResult();
  useRunStore.setState({ lastRunFingerprint: 'the setup as it was' });
  useStore.getState().updateActiveSetup({ housing: { leadership: 4100, authority: 0, dominance: 0 } });

  render(<AppBar />);
  // The mark reads "changed" and is spoken in full.
  expect(screen.getByText('changed').textContent).toContain('changed since this result');
});

test('Generate sits in the bar from xl up, and says why it cannot run', () => {
  render(<AppBar />);
  const button = screen.getByRole('button', { name: 'Generate march: Add housing first' });

  expect(button.closest('.hidden.xl\\:block')).not.toBeNull();
  expect(button).toHaveProperty('disabled', true);

  cleanup();
  useStore.getState().updateActiveSetup({ housing: { leadership: 4100, authority: 0, dominance: 0 } });
  render(<AppBar />);
  expect(screen.getByRole('button', { name: 'Generate march' })).toHaveProperty('disabled', false);
});
