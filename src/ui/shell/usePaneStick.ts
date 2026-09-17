/**
 * Where the March pane stands while the page scrolls (design rule 17 — "one page scroll. No panes
 * that scroll independently of the page; a supporting pane may stick").
 *
 * **A March that fits the window sticks under the app bar's line**, and that is the whole story for
 * most marches. **A March taller than the window sticks at both ends** (owner, 2026-09-17: "the right
 * panel should move with the scroll so the recap is shown always, or not far from the scroll"): the
 * page carries it while its middle is on screen, its tail pins above the command bar when the page
 * scrolls down past it, and its head — the recap — pins under the app bar's line the moment the page
 * scrolls up again. Nothing in the pane ever scrolls on its own; the pane is never given a
 * `max-height` or an `overflow`, and the wheel over the March is always the page's. Whichever way the
 * player scrolls, the recap is at most one flick away — which is what a sidebar that does this on a
 * documentation site or a store is for, and why the pattern is the one to copy (design rule 16).
 *
 * The old answer (2026-09-15) was a yes/no: it fits, so it sticks; it does not, so the page carries it
 * top to bottom. On the owner's plan (919 px of March against 768 px of room, then 998 px with the
 * plan block open) that meant the recap left the screen with the first flick and came back with the
 * last, and every Generate was a scroll to the top to read (`docs/design.md` §4 has the measurements).
 *
 * Three stands, and the page's scroll direction is what moves the pane between them:
 *
 *   top    — `position: sticky; top: --mantine-spacing-lg`. The pane's head is pinned. This is the
 *            stand a March that fits keeps for good, and the stand a taller March reaches by scrolling
 *            up until its head is back on the line.
 *   tail   — `position: sticky` with a *negative* `top`: `lead + room − height`, so that when the pane
 *            is stuck its bottom edge sits `AIR` above the command bar. A sticky element only ever
 *            moves *down* from its natural place, and the pane's natural place is the head of its
 *            column, so a `bottom` inset would never take hold: pinning the tail is a `top` too.
 *   flow   — `position: relative; top: <offset>`. Between the two, travelling with the page. Entered
 *            from either stuck stand the moment the scroll turns, at the offset that keeps the pane
 *            exactly where it is, and left for the opposite stand once that edge reaches its line.
 *
 * The room and the line are the same two tokens as before — the window, less the pane's own `top`,
 * less the command bar the pane must never be hidden under, less a little air:
 *
 *     room = 100dvh − --mantine-spacing-lg − --pyr-commandbar-height − AIR
 *
 * read off the root rather than written here twice, so the tokens stay the only place those heights
 * are said. CSS alone cannot do this: when an element is taller than the window, `top` wins over
 * `bottom` in a sticky box, and no selector knows which way the page last moved.
 */
import { useLayoutEffect, useState, type RefObject } from 'react';

/** The air between the pane's bottom edge and the command bar. */
const AIR = 24;

/** Where the pane stands; `top` is the px the stand needs written inline, when it needs one. */
export type PaneStand = { mode: 'top' } | { mode: 'tail'; top: number } | { mode: 'flow'; top: number };

/** A `px` or `rem` length off the root, resolved to px. */
function length(style: CSSStyleDeclaration, property: string, fallback: number): number {
  const declared = style.getPropertyValue(property).trim();
  const value = Number.parseFloat(declared);
  if (!Number.isFinite(value)) return fallback;
  return declared.endsWith('rem') ? value * (Number.parseFloat(style.fontSize) || 16) : value;
}

/** The line the pane's head sticks on: its `top` in `shell.module.css`, `.pane`. */
export function paneLead(): number {
  return length(getComputedStyle(document.documentElement), '--mantine-spacing-lg', 16);
}

/**
 * The space the window leaves a sticky pane, in px. Exported for the shell's own test to assert
 * against, since the pane's decisions are only as good as the number under them.
 */
export function paneRoom(view: Window = window): number {
  const root = getComputedStyle(document.documentElement);
  return (
    view.innerHeight -
    length(root, '--mantine-spacing-lg', 16) -
    // The fallback is the token's own value (`theme.ts`), for the two places that cannot read a
    // custom property: jsdom, and the service worker's global. Keep the two in step — a fallback
    // that drifts is a reserve nobody is checking.
    length(root, '--pyr-commandbar-height', 120) -
    AIR
  );
}

/** Which way the page moved since the pane last looked, or that it did not move at all. */
type Turn = 'up' | 'down' | 'still';

/**
 * The pane's natural place: the top of the column's content box, where it would sit with no
 * positioning at all. Read off the parent rather than off the pane, because the pane's own box is
 * the one thing here that has been moved.
 */
function naturalTop(node: HTMLElement): number {
  const column = node.parentElement;
  if (column === null) return node.getBoundingClientRect().top;
  const style = getComputedStyle(column);
  return column.getBoundingClientRect().top + column.clientTop + (Number.parseFloat(style.paddingTop) || 0);
}

/**
 * The stand the pane should take now, given the one it has, the way the page just moved and by how
 * much, and where its box is. Pure, so the test can walk it: everything measured comes in as an
 * argument.
 *
 * `delta` matters at the two flips. A scroll event arrives *after* the page has moved, and a stuck
 * pane has already held its line through that move: letting go where it stands would leave the pane
 * one tick behind the page, so it is let go where it *would* stand had it been travelling — its
 * natural place, or the line it held less the part of the move the stick absorbed, whichever is
 * lower on the page. Playwright's wheel moves a whole tick in one event, a real wheel a few px per
 * event; either way the pane moves with the page from the first one.
 */
export function nextStand(
  current: PaneStand,
  turn: Turn,
  box: { top: number; bottom: number; height: number; natural: number },
  lines: { lead: number; room: number },
  delta = 0,
): PaneStand {
  const { lead, room } = lines;
  // A March that fits has one stand and keeps it: the head pinned, the whole of it on screen.
  if (box.height <= room) return { mode: 'top' };

  // The `top` that pins the tail `AIR` above the command bar — negative, since it does not fit.
  const tailTop = lead + room - box.height;
  const tail: PaneStand = { mode: 'tail', top: tailTop };
  // Let go at `top` px from the window's top: the stand that puts the pane there, which is a stuck one
  // if that place is already on a line.
  const letGoAt = (top: number): PaneStand => {
    if (top >= lead) return { mode: 'top' };
    if (top + box.height <= lead + room) return tail;
    return { mode: 'flow', top: top - box.natural };
  };

  switch (current.mode) {
    case 'top':
      // Stuck, and the page went down `delta`: travelling, the pane would be `delta` lower than
      // where the stick held it — or at its natural place if the stick had not taken hold yet. Where
      // it held it, not the line: a column barely taller than the March pushes a stuck pane up off
      // its line as the column's end comes by (measured 35 px on the plan method at 1400×900).
      if (turn === 'down') return letGoAt(Math.max(box.natural, box.top - delta));
      // No scroll, but the pane outgrew its room — a fold opened, the window shrank. If it is stuck
      // it stays exactly where it is until the page moves, so the recap does not leap off screen the
      // moment a fold opens under it; if it is not stuck yet it takes the tail stand, which sits at
      // the natural place until the page scrolls down past it and pins the tail there.
      if (turn === 'still') return box.top > box.natural + 0.5 ? current : tail;
      return current;
    case 'tail':
      // The mirror: the page went up `delta` while the tail held its line.
      if (turn === 'up') return letGoAt(Math.max(box.natural, box.top + delta));
      // The height or the window changed: the same stand, at the `top` the new height asks for.
      return tail;
    case 'flow':
      if (turn === 'down' && box.bottom <= lead + room) return tail;
      if (turn === 'up' && box.top >= lead) return { mode: 'top' };
      return current;
  }
}

function same(a: PaneStand, b: PaneStand): boolean {
  return a.mode === b.mode && (a.mode === 'top' || b.mode === 'top' || a.top === b.top);
}

/**
 * The pane's stand, kept in step with the page's scroll and with the size of the pane and the window.
 * Measured, never guessed: opening the plan fold or planning a march with more stacks in it is exactly
 * what makes the March outgrow the window, and the page's own scroll is what moves it between stands.
 */
export function usePaneStick(pane: RefObject<HTMLElement | null>): PaneStand {
  const [stand, setStand] = useState<PaneStand>({ mode: 'top' });

  // Laid out rather than merely effected: the first answer is read **before the frame is painted**,
  // because a reload that lands mid-page would otherwise paint the pane stuck and move it a frame
  // later. Nothing here measures anything that depends on having been painted.
  useLayoutEffect(() => {
    const node = pane.current;
    if (node === null) return undefined;

    let current: PaneStand = { mode: 'top' };
    let lastY = window.scrollY;

    const decide = (turn: Turn, delta = 0): void => {
      const rect = node.getBoundingClientRect();
      const next = nextStand(
        current,
        turn,
        { top: rect.top, bottom: rect.bottom, height: rect.height, natural: naturalTop(node) },
        { lead: paneLead(), room: paneRoom() },
        delta,
      );
      if (same(next, current)) return;
      current = next;
      setStand(next);
    };

    const onScroll = (): void => {
      const y = window.scrollY;
      const turn: Turn = y > lastY ? 'down' : y < lastY ? 'up' : 'still';
      const delta = Math.abs(y - lastY);
      lastY = y;
      if (turn !== 'still') decide(turn, delta);
    };
    const onResize = (): void => {
      decide('still');
    };

    decide('still');

    // `ResizeObserver` is missing in jsdom and in the service worker's global, and a pane that is
    // never re-measured there is a pane that keeps its first answer — which is the right one for a
    // test that does not resize anything.
    const watcher = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    watcher?.observe(node);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      watcher?.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pane]);

  return stand;
}
