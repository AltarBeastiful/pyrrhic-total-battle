/**
 * The supporting pane (M3's canonical supporting-pane layout, design plan §5.0/§5.1): 360 dp,
 * trailing, shown from `lg` (1200 px), so the answer stays on screen while the setup changes
 * (design rules 1 and 2).
 *
 * **One page scroll** (design rule 17, resolved 2026-09-13 after investigation 0011 measured the
 * pane holding 1 787 px of content in 836 px of window and scrolling inside itself). Only the part
 * that has to stay on screen sticks: the recap figures and Generate, in a block pinned under the app
 * bar. Everything under them — the tiles, the pools, the counts, the trade-off, the details, the
 * saved marches — flows with the page like any other block, and the wheel moves the page wherever
 * the pointer is.
 */
import { Box } from '@mantine/core';

import { MarchSection } from '@/ui/sections/march';
import { Panel } from '@/ui/kit';

import classes from './shell.module.css';

export function MarchPane() {
  return (
    // Unnamed on purpose: the March section inside carries the name, and two landmarks called
    // "March" would be one too many.
    <Box component="aside" className={classes.pane}>
      {/* One surface for the whole pane, as the spike drew it (investigation 0009,
          `v1-desktop.jpg`) and as direction A lights it: the recap, Generate and the March are one
          object, not three floating blocks on the page ground. `MarchSection` brings no ground. */}
      {/* What stays put is decided inside the section now (owner, 2026-09-13): the sticky block is
          the whole "march at a glance" — the figures, Generate, the pools and their pills — because
          a header that slid over the pills hid the very thing the pane exists to show. */}
      <Panel surface="pane" style={{ height: '100%' }}>
        <MarchSection />
      </Panel>
    </Box>
  );
}
