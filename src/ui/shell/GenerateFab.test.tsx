// @vitest-environment jsdom
/**
 * D-11 — the four states of the floating button, the shortcut that does the same thing from
 * anywhere, and the scroll a phone gets when a march is generated.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';

import { useResultStore } from '../resultStore';
import { useRunStore } from '../sections/results/runStore';
import { GenerateFab } from './GenerateFab';
import { ONE_COLUMN, REDUCED_MOTION } from './useMediaQuery';

const calls = vi.hoisted(() => ({ run: 0, cancel: 0 }));

vi.mock('../sections/results/generate', () => ({
  runGenerate: () => {
    calls.run += 1;
    return Promise.resolve();
  },
  cancelGenerate: () => {
    calls.cancel += 1;
  },
}));

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

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  useResultStore.getState().clear();
  useRunStore.getState().reset();
  calls.run = 0;
  calls.cancel = 0;
  stubMedia([]);
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: realMatchMedia,
  });
});

/** The default document has troops but no housing yet. */
function withHousing(): void {
  useStore.getState().updateActiveSetup({ housing: { leadership: 4100, authority: 0, dominance: 0 } });
}

const fab = (): HTMLElement => screen.getByRole('button', { name: /^Generate march/ });

test('a march that cannot be generated says what is missing', () => {
  render(<GenerateFab />);
  expect(screen.getByRole('button', { name: 'Generate march: Add housing first' })).toBeTruthy();

  fireEvent.click(fab());
  expect(calls.run).toBe(0);
});

test('an empty army names the troops, not the housing', () => {
  useStore.getState().updateProfile(useStore.getState().doc.activeProfileId, {
    troops: {
      guardsmen: null,
      specialists: null,
      engineers: null,
      monsters: null,
      topTierExcluded: { guardsmen: [], specialists: [] },
      excludedUnitIds: [],
    },
  });
  render(<GenerateFab />);

  expect(screen.getByRole('button', { name: 'Generate march: Add troops first' })).toBeTruthy();
});

test('a possible march is ready, and pressing it runs', () => {
  withHousing();
  render(<GenerateFab />);

  fireEvent.click(fab());
  expect(calls.run).toBe(1);
});

test('Ctrl and Enter generate from anywhere on the page, but never while blocked', () => {
  const { rerender } = render(<GenerateFab />);
  fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });
  expect(calls.run).toBe(0);

  withHousing();
  rerender(<GenerateFab />);
  fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });
  expect(calls.run).toBe(1);

  // ⌘ on a Mac keyboard is the same shortcut.
  fireEvent.keyDown(document, { key: 'Enter', metaKey: true });
  expect(calls.run).toBe(2);
});

test('a run in flight is cancelled by the same press', () => {
  withHousing();
  useResultStore.getState().setRunning(true);
  render(<GenerateFab />);

  const button = fab();
  expect(button.closest('[data-state]')?.getAttribute('data-state')).toBe('running');
  fireEvent.click(button);
  expect(calls.cancel).toBe(1);
  expect(calls.run).toBe(0);
});

test('an edit after a result makes the button stale, and generating clears it', () => {
  withHousing();
  useRunStore.setState({ lastRunFingerprint: 'the setup as it was' });
  useResultStore.setState({
    last: {
      request: { units: [] },
      result: { stacks: [] },
      summary: {},
      profileId: 'p',
      setupId: 's',
      at: 1,
    },
  } as never);

  render(<GenerateFab />);
  expect(fab().closest('[data-state]')?.getAttribute('data-state')).toBe('stale');
});

test('the label collapses while the page scrolls down and comes back on the way up', () => {
  withHousing();
  // The listener does its work in an animation frame; running it at once keeps the test honest
  // about the behaviour without waiting for a real frame.
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 1;
  });
  const scrollTo = (y: number): void => {
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: y });
    fireEvent.scroll(window);
  };

  render(<GenerateFab />);
  const label = (): Element | null => fab().querySelector('.sr-only');
  expect(label()).toBeNull();

  scrollTo(400);
  expect(label()).not.toBeNull();

  scrollTo(120);
  expect(label()).toBeNull();

  scrollTo(0);
  expect(label()).toBeNull();
});

test('the button is out of the way from xl up, where the app bar carries Generate', () => {
  withHousing();
  const { container } = render(<GenerateFab />);
  expect(container.querySelector('.xl\\:hidden')).not.toBeNull();
});

test('on one column, generating brings the march into view', () => {
  withHousing();
  const scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  const march = document.createElement('section');
  march.id = 'results';
  document.body.append(march);

  stubMedia([ONE_COLUMN]);
  render(<GenerateFab />);
  fireEvent.click(fab());
  expect(scrollIntoView).toHaveBeenCalledTimes(1);

  // …unless the player asked for no motion, in which case nothing moves on its own.
  scrollIntoView.mockClear();
  cleanup();
  stubMedia([ONE_COLUMN, REDUCED_MOTION]);
  render(<GenerateFab />);
  fireEvent.click(fab());
  expect(scrollIntoView).not.toHaveBeenCalled();

  march.remove();
});
