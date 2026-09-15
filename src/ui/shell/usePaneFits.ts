/**
 * Does the March fit the space the window leaves it? (design rule 17 — "one page scroll. No panes
 * that scroll independently of the page; a supporting pane may stick".)
 *
 * The pane used to answer this itself, with a `max-height` at this same number and an
 * `overflow-y: auto` under it (`march.module.css` says where it went, 2026-09-15): the moment the
 * March grew past the window, the pane grew a scrollbar of its own and the wheel over it moved the
 * March instead of the page — the two-scroller behaviour the independent review of 2026-09-12
 * withdrew and investigation 0011 logged as rule 17 *partly* met. On the owner's own plan it was
 * not a corner case: 919 px of March against 768 px of room at 1400×900, with the Details and the
 * Plan folds already shut.
 *
 * So the question is measured here instead, and the answer decides whether the pane sticks. CSS
 * cannot ask it — the condition compares the March's own height with the window, and no selector
 * does that — but the *number* it compares against is the one the old cap was built from, and the
 * same two tokens are still the source of it:
 *
 *     room = 100dvh − --mantine-spacing-lg − --pyr-commandbar-height − AIR
 *
 * i.e. the window, less the pane's own sticky top (`top` in `shell.module.css`, `.pane`), less the
 * command bar the pane must never be hidden under, less a little air. Read off the root rather than
 * written here twice, so the two tokens stay the only place those heights are said.
 */
import { useLayoutEffect, useState, type RefObject } from 'react';

/** The air between the pane's bottom edge and the command bar. */
const AIR = 24;

/** A `px` or `rem` length off the root, resolved to px. */
function length(style: CSSStyleDeclaration, property: string, fallback: number): number {
  const declared = style.getPropertyValue(property).trim();
  const value = Number.parseFloat(declared);
  if (!Number.isFinite(value)) return fallback;
  return declared.endsWith('rem') ? value * (Number.parseFloat(style.fontSize) || 16) : value;
}

/**
 * The space the window leaves a sticky pane, in px. Exported for the shell's own test to assert
 * against, since the pane's decision is only as good as the number under it.
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

/**
 * True while the March fits the room above, false once it does not. Measured, never guessed: the
 * pane is re-read whenever it or the window changes size, because opening the Details fold or
 * planning a march with more stacks in it is exactly what makes the March outgrow the window.
 *
 * A pane that does not fit is not given a scroll of its own — it stops sticking and the page carries
 * it (see `MarchPane.tsx`), which is why this is measured rather than left to the browser: it is the
 * *reason* the class changes.
 */
export function usePaneFits(pane: RefObject<HTMLElement | null>): boolean {
  const [fits, setFits] = useState(true);

  // Laid out rather than merely effected: the first answer is read **before the frame is painted**,
  // because a reload that lands mid-page would otherwise paint the pane stuck and move it a frame
  // later. Nothing here measures anything that depends on having been painted.
  useLayoutEffect(() => {
    const node = pane.current;
    if (node === null) return undefined;

    const measure = (): void => {
      setFits(node.getBoundingClientRect().height <= paneRoom());
    };

    measure();

    // `ResizeObserver` is missing in jsdom and in the service worker's global, and a pane that is
    // never re-measured there is a pane that keeps its first answer — which is the right one for a
    // test that does not resize anything.
    const watcher = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    watcher?.observe(node);
    window.addEventListener('resize', measure);
    return () => {
      watcher?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [pane]);

  return fits;
}
