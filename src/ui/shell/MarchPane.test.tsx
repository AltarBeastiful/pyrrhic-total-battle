// @vitest-environment jsdom
/**
 * The pane's one decision, and the rule behind it (design rule 17: "one page scroll. No panes that
 * scroll independently of the page; a supporting pane may stick").
 *
 * The March itself is a stub here: what this file is about is the *frame's* answer to "does the
 * March fit the window?" — the pane sticks while it does and gives up the stick when it does not, so
 * that the wheel over the March is always the page's. The `max-height` and the `overflow-y: auto`
 * that used to answer the question by growing a second scrollbar are gone (owner, 2026-09-15), and
 * the decision below is what would have to change for them to come back.
 */
import { cleanup, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, test, vi } from 'vitest';

import { renderWithTheme } from '../kit/testRender';
import { MarchPane } from './MarchPane';
import { paneRoom } from './usePaneFits';

vi.mock('@/ui/sections/march', () => ({
  MarchSection: (): ReactNode => <section id="march" aria-label="March" />,
}));

afterEach(cleanup);

/** The window the shell sees, for the length of one case. */
function windowHeight(px: number): void {
  Object.defineProperty(window, 'innerHeight', { value: px, configurable: true, writable: true });
}

/**
 * The pane, laid out `height` px tall in a window `windowPx` tall. jsdom lays nothing out and does
 * not read the theme's custom properties, so the measurement the hook makes is the one thing here
 * that has to be made up — and the resize event is what tells the hook to make it again.
 */
function paneIn(height: number, windowPx: number): HTMLElement {
  windowHeight(windowPx);
  const { container } = renderWithTheme(<MarchPane />);
  const pane = container.querySelector('aside');
  if (pane === null) throw new Error('the pane is not in the tree');
  vi.spyOn(pane, 'getBoundingClientRect').mockReturnValue({ height } as DOMRect);
  fireEvent(window, new Event('resize'));
  return pane;
}

/** True when the pane has given up the stick and travels with the page. */
const flows = (pane: HTMLElement): boolean =>
  [...pane.classList].some((name) => name.includes('paneFlowing'));

test('the room a pane is measured against is the window, less its own top, the bar and the air', () => {
  windowHeight(900);
  // 16 px of `--mantine-spacing-lg` (the pane's `top`), the 120 px command bar (`theme.ts`'s
  // `--pyr-commandbar-height`, read off the root in a browser and fallen back to here), 24 px of air.
  // The number is the whole basis of the decision below, so it is asserted rather than assumed: a
  // changed bar height or a dropped term would show up here and nowhere else.
  expect(paneRoom()).toBe(900 - 160);
  windowHeight(700);
  expect(paneRoom()).toBe(700 - 160);
});

test('a March that fits the room sticks, including exactly at the limit', () => {
  // 740 = 900 − 160: the last height at which the pane can sit under the app bar's line and above
  // the command bar without anything of it going out of sight.
  expect(flows(paneIn(740, 900))).toBe(false);
});

test('a March taller than the room travels with the page, and sticks again when the window grows', () => {
  const pane = paneIn(741, 900);
  expect(
    flows(pane),
    'a pane still sticking at 1 px over its room would have to hide its own tail, or scroll to show it',
  ).toBe(true);

  // The window grows past the March — or the March shrinks under it, which is the same measurement:
  // it is re-read, and the pane goes back to following the setup.
  windowHeight(1200);
  fireEvent(window, new Event('resize'));
  expect(flows(pane)).toBe(false);
});
