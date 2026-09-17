// @vitest-environment jsdom
/**
 * The pane's stands, and the rule behind them (design rule 17: "one page scroll. No panes that
 * scroll independently of the page; a supporting pane may stick").
 *
 * The March itself is a stub here: what this file is about is the *frame's* answer to "where does
 * the pane stand now?" — head pinned while the March fits the window, and at both ends once it does
 * not (owner, 2026-09-17), so that the wheel over the March is always the page's and the recap is
 * never more than a flick away. The `max-height` and the `overflow-y: auto` that used to answer the
 * question by growing a second scrollbar are gone (owner, 2026-09-15), and the decisions below are
 * what would have to change for them to come back.
 */
import { cleanup, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, test, vi } from 'vitest';

import { renderWithTheme } from '../kit/testRender';
import { MarchPane } from './MarchPane';
import { nextStand, paneRoom, type PaneStand } from './usePaneStick';

vi.mock('@/ui/sections/march', () => ({
  MarchSection: (): ReactNode => <section id="march" aria-label="March" />,
}));

afterEach(cleanup);

/** The window the shell sees, for the length of one case. */
function windowHeight(px: number): void {
  Object.defineProperty(window, 'innerHeight', { value: px, configurable: true, writable: true });
}

/** Where the page is, for the next scroll event to compare against. */
function scrollTo(y: number): void {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
  fireEvent(window, new Event('scroll'));
}

/**
 * The pane, laid out `height` px tall in a window `windowPx` tall, with its head `top` px from the
 * window's top and its column's head at `natural`. jsdom lays nothing out and does not read the
 * theme's custom properties, so the boxes the hook measures are the one thing here that has to be
 * made up — and the resize event is what tells the hook to measure them again.
 */
function paneIn(height: number, windowPx: number, top = 16, natural = 16): HTMLElement {
  windowHeight(windowPx);
  // The page is at its top when the pane mounts: the last case's scroll must not read as a move.
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
  const { container } = renderWithTheme(<MarchPane />);
  const pane = container.querySelector('aside');
  if (pane === null) throw new Error('the pane is not in the tree');
  place(pane, { height, top, natural });
  fireEvent(window, new Event('resize'));
  return pane;
}

/** Move the made-up boxes: the pane's, and its column's. */
function place(pane: HTMLElement, box: { height: number; top: number; natural: number }): void {
  vi.spyOn(pane, 'getBoundingClientRect').mockReturnValue({
    height: box.height,
    top: box.top,
    bottom: box.top + box.height,
  } as DOMRect);
  const column = pane.parentElement;
  if (column === null) throw new Error('the pane has no column');
  vi.spyOn(column, 'getBoundingClientRect').mockReturnValue({ top: box.natural } as DOMRect);
}

/** The stand the pane says it is in, and the inline `top` it was given for it. */
const stand = (pane: HTMLElement): { mode: string | null; top: string } => ({
  mode: pane.dataset['stand'] ?? null,
  top: pane.style.top,
});

const flows = (pane: HTMLElement): boolean =>
  [...pane.classList].some((name) => name.includes('paneFlowing'));

test('the room a pane is measured against is the window, less its own top, the bar and the air', () => {
  windowHeight(900);
  // 16 px of `--mantine-spacing-lg` (the pane's `top`), the 120 px command bar (`theme.ts`'s
  // `--pyr-commandbar-height`, read off the root in a browser and fallen back to here), 24 px of air.
  // The number is the whole basis of the decisions below, so it is asserted rather than assumed: a
  // changed bar height or a dropped term would show up here and nowhere else.
  expect(paneRoom()).toBe(900 - 160);
  windowHeight(700);
  expect(paneRoom()).toBe(700 - 160);
});

test('a March that fits the room keeps its head pinned, including exactly at the limit', () => {
  // 740 = 900 − 160: the last height at which the pane can sit under the app bar's line and above
  // the command bar without anything of it going out of sight.
  const pane = paneIn(740, 900);
  expect(stand(pane)).toEqual({ mode: 'top', top: '' });
  expect(flows(pane)).toBe(false);

  // And keeps it whichever way the page goes: there is nothing of it to reach by scrolling.
  scrollTo(400);
  scrollTo(100);
  expect(stand(pane)).toEqual({ mode: 'top', top: '' });
});

test('a March taller than the room sticks at both ends, and travels with the page between them', () => {
  // 900 px of March against 740 px of room, at the top of the page: the pane takes the tail stand —
  // a sticky `top` of 740 + 16 − 900 = −144 px, which does nothing until the page has scrolled past
  // the pane and then holds its tail 24 px above the command bar.
  const pane = paneIn(900, 900);
  expect(stand(pane)).toEqual({ mode: 'tail', top: '-144px' });
  expect(flows(pane)).toBe(false);

  // The page scrolls down and the tail catches: still the same stand.
  place(pane, { height: 900, top: -144, natural: -600 });
  scrollTo(616);
  expect(stand(pane)).toEqual({ mode: 'tail', top: '-144px' });

  // The wheel turns, 16 px up: the pane lets go of the tail and travels with the page — not where the
  // stick held it but where it would be had it travelled through those 16 px: −128 px from the
  // window's top, 472 px below its column's head.
  scrollTo(600);
  expect(stand(pane)).toEqual({ mode: 'flow', top: '472px' });
  expect(flows(pane)).toBe(true);

  // Up it goes, with the page, until its head is back on the line: then the head pins.
  place(pane, { height: 900, top: 10, natural: -462 });
  scrollTo(450);
  expect(stand(pane)).toEqual({ mode: 'flow', top: '472px' });
  place(pane, { height: 900, top: 16, natural: -456 });
  scrollTo(444);
  expect(stand(pane)).toEqual({ mode: 'top', top: '' });
  expect(flows(pane)).toBe(false);

  // Down again, 56 px: it lets go 56 px under the line, then pins the tail once that reaches its
  // line.
  place(pane, { height: 900, top: 16, natural: -512 });
  scrollTo(500);
  expect(stand(pane)).toEqual({ mode: 'flow', top: '472px' });
  place(pane, { height: 900, top: -100, natural: -572 });
  scrollTo(560);
  expect(stand(pane)).toEqual({ mode: 'flow', top: '472px' });
  place(pane, { height: 900, top: -150, natural: -622 });
  scrollTo(610);
  expect(stand(pane)).toEqual({ mode: 'tail', top: '-144px' });

  // The window grows past the March — or the March shrinks under it, which is the same measurement:
  // it is re-read, and the pane goes back to one pinned head.
  windowHeight(1200);
  fireEvent(window, new Event('resize'));
  expect(stand(pane)).toEqual({ mode: 'top', top: '' });
});

test('a fold opening under a pinned head leaves the pane where it is until the page moves', () => {
  // The pane is stuck at the line, 500 px into the page, and the plan fold opens: the March is 900 px
  // now. Jumping to the tail stand would throw the recap 144 px off the top of the window on a click
  // that had nothing to do with scrolling, so the pane keeps its head on the line and the next scroll
  // decides: down, and it lets go; up, and there is nothing to do.
  const pane = paneIn(700, 900, 16, -484);
  expect(stand(pane)).toEqual({ mode: 'top', top: '' });
  place(pane, { height: 900, top: 16, natural: -484 });
  fireEvent(window, new Event('resize'));
  expect(stand(pane)).toEqual({ mode: 'top', top: '' });
  scrollTo(40);
  expect(stand(pane)).toEqual({ mode: 'flow', top: '460px' });
});

test('the decision, walked as a table', () => {
  const lines = { lead: 16, room: 740 };
  const tall = (top: number, natural: number): Parameters<typeof nextStand>[2] => ({
    top,
    bottom: top + 900,
    height: 900,
    natural,
  });
  const top: PaneStand = { mode: 'top' };
  const tail: PaneStand = { mode: 'tail', top: -144 };

  // Fits: one stand, whatever else is true.
  expect(nextStand(tail, 'up', { top: 0, bottom: 700, height: 700, natural: 0 }, lines)).toEqual(top);
  // Pinned head, page scrolls down 30: let go 30 px under the line.
  expect(nextStand(top, 'down', tall(16, -200), lines, 30)).toEqual({ mode: 'flow', top: 186 });
  // Pinned head that had not taken hold yet (the page was at its top): let go at the natural place.
  expect(nextStand(top, 'down', tall(20, 20), lines, 30)).toEqual(top);
  // Pinned head, a whole page down in one move: the tail is already past its line, so pin it.
  expect(nextStand(top, 'down', tall(16, -2000), lines, 2000)).toEqual(tail);
  // Pinned head, page scrolls up: nothing to do.
  expect(nextStand(top, 'up', tall(16, -200), lines, 30)).toEqual(top);
  // Travelling down, tail not yet on its line (bottom 800 > 756): keep travelling.
  expect(nextStand({ mode: 'flow', top: 216 }, 'down', tall(-100, -316), lines, 30)).toEqual({
    mode: 'flow',
    top: 216,
  });
  // Travelling down, tail on its line: pin it.
  expect(nextStand({ mode: 'flow', top: 216 }, 'down', tall(-150, -366), lines, 30)).toEqual(tail);
  // Pinned tail, page scrolls up 30: let go 30 px above the line.
  expect(nextStand(tail, 'up', tall(-144, -500), lines, 30)).toEqual({ mode: 'flow', top: 386 });
  // Pinned tail, a whole page up in one move: the head is already past its line, so pin it.
  expect(nextStand(tail, 'up', tall(-144, -500), lines, 2000)).toEqual(top);
  // Pinned tail, the March grew: the same stand at the new inset.
  expect(nextStand(tail, 'still', { top: -244, bottom: 756, height: 1000, natural: -500 }, lines)).toEqual({
    mode: 'tail',
    top: -244,
  });
  // Travelling up, head on its line: pin it.
  expect(nextStand({ mode: 'flow', top: 356 }, 'up', tall(20, -336), lines, 30)).toEqual(top);
});
