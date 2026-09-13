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
 * Design rule 17 still holds: the page has one scroll, and the pane takes one of its own only when a
 * march is taller than the window less the command bar — which, with Details and Saved marches
 * folded, a sixteen-stack march is not.
 */
import { Box } from '@mantine/core';

import { MarchSection } from '@/ui/sections/march';
import marchClasses from '@/ui/sections/march/march.module.css';
import { Panel } from '@/ui/kit';

import classes from './shell.module.css';

export function MarchPane() {
  return (
    // Unnamed on purpose: the March section inside carries the name, and two landmarks called
    // "March" would be one too many.
    <Box component="aside" className={classes.pane}>
      {/* One surface for the whole pane, as the spike drew it (investigation 0009,
          `v1-desktop.jpg`) and as direction A lights it: the recap, Generate and the March are one
          object, not three floating blocks on the page ground. `MarchSection` brings no ground.

          The cap and the scroll live on the panel rather than on the `aside`, so the pane's own
          shadow is drawn outside the scroller instead of being clipped by it. */}
      <Panel surface="pane" className={marchClasses.paneScroll}>
        <MarchSection />
      </Panel>
    </Box>
  );
}
