/**
 * The supporting pane (M3's canonical supporting-pane layout, design plan §5.0/§5.1): 360 dp,
 * trailing, shown from `lg` (1200 px), so the answer stays on screen while the setup changes
 * (design rules 1 and 2).
 *
 * **The pane is what sticks** (owner, 2026-09-13). The earlier arrangement pinned only the top of
 * the column — the figures, the pools and the pills — and let the rest of the March flow with the
 * page, which meant the copy/edit row, the trade-off, the folded Details and the saved marches slid
 * *behind* the block that was pinned: "the battle summary still goes over its detailed content on
 * scrolling". One sticky element per column and no split inside it is the only arrangement in which
 * that cannot happen.
 *
 * **And it sticks only while the March fits the window** (owner, 2026-09-15: "I want to avoid double
 * scrollbars; make this change so we always avoid scroll bars on the battle summary"). Design rule
 * 17 allows a supporting pane to stick, and forbids one that scrolls independently of the page — so
 * the pane is never given a scroll of its own: when the March grows past the room the window leaves
 * it, it gives up the stick and the page carries it, top to bottom. `usePaneFits` measures it, on
 * the pane's own height and the window's, because opening a fold or planning a longer march is what
 * makes the March outgrow the window in the first place.
 */
import { Box } from '@mantine/core';
import { useRef } from 'react';

import { MarchSection } from '@/ui/sections/march';
import { Panel } from '@/ui/kit';

import classes from './shell.module.css';
import { usePaneFits } from './usePaneFits';

export function MarchPane() {
  const pane = useRef<HTMLDivElement>(null);
  const fits = usePaneFits(pane);

  return (
    // Unnamed on purpose: the March section inside carries the name, and two landmarks called
    // "March" would be one too many.
    <Box
      component="aside"
      ref={pane}
      className={fits ? classes.pane : `${classes.pane} ${classes.paneFlowing}`}
    >
      {/* One surface for the whole pane, as the spike drew it (investigation 0009,
          `v1-desktop.jpg`) and as direction A lights it: the recap, Generate and the March are one
          object, not three floating blocks on the page ground. `MarchSection` brings no ground. */}
      <Panel surface="pane">
        <MarchSection />
      </Panel>
    </Box>
  );
}
