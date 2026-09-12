// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';

import { useResultStore } from '../resultStore';
import { useRunStore } from '../sections/results/runStore';
import { MarchStatus } from './MarchStatus';
import { ONE_COLUMN, REDUCED_MOTION } from './useMediaQuery';

const realMatchMedia = window.matchMedia;

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

test('the run announces itself politely and says nothing the rest of the time', () => {
  render(<MarchStatus />);
  expect(screen.getByRole('status').textContent).toBe('');

  act(() => {
    useResultStore.getState().setRunning(true);
  });
  expect(screen.getByRole('status').textContent).toContain('Generating…');
});

test('a priority search says how far it has got', () => {
  useStore.getState().updateActiveSetup({ priority: 'minDamage' });
  useResultStore.getState().setRunning(true);
  render(<MarchStatus />);
  expect(screen.getByRole('status').textContent).toContain('Trying formations…');

  act(() => {
    useRunStore.getState().setProgress({ evaluated: 1200, bestScore: 3.5, elapsedMs: 10 });
  });
  expect(screen.getByRole('status').textContent).toContain('Tried 1,200 formations');
});

test('with motion turned off, the link replaces the scroll', () => {
  useResultStore.getState().setRunning(true);
  stubMedia([ONE_COLUMN]);
  render(<MarchStatus />);
  expect(screen.queryByRole('link', { name: 'Go to march' })).toBeNull();
  cleanup();

  stubMedia([ONE_COLUMN, REDUCED_MOTION]);
  render(<MarchStatus />);
  const link = screen.getByRole('link', { name: 'Go to march' });
  expect(link.getAttribute('href')).toBe('#results');
});
