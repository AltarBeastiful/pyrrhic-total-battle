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
 * **And it sticks at both ends when the March is taller than the window** (owner, 2026-09-17: "the
 * right panel should move with the scroll so the recap is shown always, or not far from the
 * scroll"). Design rule 17 allows a supporting pane to stick and forbids one that scrolls
 * independently of the page — so the pane is never given a scroll of its own. While the March fits
 * the room the window leaves it, its head is pinned and that is that. Once it does not, the page
 * carries it, its tail pins above the command bar as the page scrolls down past it, and its head —
 * the recap — pins back under the app bar's line the moment the page scrolls up. `usePaneStick`
 * measures and decides, on the pane's own height, the window's and the way the page last moved,
 * because opening a fold or planning a longer march is what makes the March outgrow the window in
 * the first place.
 */
import { Box } from '@mantine/core';
import { useRef } from 'react';

import { MarchSection } from '@/ui/sections/march';
import { Panel } from '@/ui/kit';

import classes from './shell.module.css';
import { usePaneStick } from './usePaneStick';

export function MarchPane() {
  const pane = useRef<HTMLDivElement>(null);
  const stand = usePaneStick(pane);

  return (
    // Unnamed on purpose: the March section inside carries the name, and two landmarks called
    // "March" would be one too many.
    //
    // The stand is a class for its `position` and, for the two stands that need one, an inline `top`
    // in px: the tail stand's is a negative sticky inset the stylesheet cannot know, and the flow
    // stand's is the offset that keeps the pane where the last scroll left it.
    <Box
      component="aside"
      ref={pane}
      className={stand.mode === 'flow' ? `${classes.pane} ${classes.paneFlowing}` : classes.pane}
      data-stand={stand.mode}
      {...(stand.mode === 'top' ? {} : { style: { top: stand.top } })}
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
