/**
 * Generate, for every screen too narrow for the app bar's button (below `xl`; the wrapper hides it
 * above, so the two are never on screen together). It carries the four states of a run — blocked
 * with the reason in the label, stale when the form moved under the answer, running with a press
 * that cancels, ready otherwise.
 *
 * Material 3's extended FAB behaviour: the label collapses to the glyph while the page scrolls down
 * and comes back on the way up or at the top, so the button never sits on top of what you are
 * reading. The listener is passive and does its work in one animation frame.
 *
 * `Ctrl`/`⌘ + Enter` is registered here and only here — the button is mounted at every width, just
 * hidden above `xl`, so the shortcut works everywhere without being bound twice.
 */
import { useEffect, useState } from 'react';

import { GenerateIcon } from '../icons';
import { FloatingAction } from '../kit';
import { NARROW, useMediaQuery } from './useMediaQuery';
import { useGenerateRun } from './useGenerateRun';

/** Scroll noise under this many pixels does not flip the label. */
const SCROLL_THRESHOLD = 8;

/** True while the page is being scrolled down and away from the top (Material 3's extended FAB). */
function useScrollingDown(): boolean {
  const [down, setDown] = useState(false);

  useEffect(() => {
    let last = Math.max(0, globalThis.scrollY);
    let frame = 0;
    // The flag, not the frame id, is the throttle: the id is only there to cancel on unmount, and it
    // is assigned *after* the callback has run whenever a frame resolves synchronously.
    let queued = false;

    const measure = (): void => {
      queued = false;
      const y = Math.max(0, globalThis.scrollY);
      if (Math.abs(y - last) < SCROLL_THRESHOLD) return;
      setDown(y > last && y > 0);
      last = y;
    };

    const onScroll = (): void => {
      if (queued) return;
      queued = true;
      frame = globalThis.requestAnimationFrame(measure);
    };

    globalThis.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      globalThis.removeEventListener('scroll', onScroll);
      if (frame !== 0) globalThis.cancelAnimationFrame(frame);
    };
  }, []);

  return down;
}

export function GenerateFab() {
  const { state, hint, press } = useGenerateRun();
  const narrow = useMediaQuery(NARROW);
  const scrollingDown = useScrollingDown();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey) || event.repeat) return;
      event.preventDefault();
      press();
    };
    globalThis.document.addEventListener('keydown', onKeyDown);
    return () => {
      globalThis.document.removeEventListener('keydown', onKeyDown);
    };
  }, [press]);

  return (
    <div className="xl:hidden">
      <FloatingAction
        label="Generate march"
        state={state}
        {...(hint === null ? {} : { hint })}
        icon={<GenerateIcon />}
        showLabel={!narrow && !scrollingDown}
        onPress={press}
      />
    </div>
  );
}
