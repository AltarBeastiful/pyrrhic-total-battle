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
import { Box, Paper, Stack } from '@mantine/core';

import { MarchGenerateButton, MarchRecap, MarchSection } from '@/ui/sections/march';

import classes from './shell.module.css';

export function MarchPane() {
  return (
    // Unnamed on purpose: the March section inside carries the name, and two landmarks called
    // "March" would be one too many.
    <Box component="aside" className={classes.pane}>
      {/* One surface for the whole pane, as the spike drew it (investigation 0009,
          `v1-desktop.jpg`): the recap, Generate and the March are one object, not three floating
          blocks on the page ground. `MarchSection` brings no ground of its own. */}
      <Paper radius="md" p="md" bg="var(--mantine-color-default)">
        <Stack gap="md">
          {/* The header is the whole reason frame V1 won: the recap figures and the primary
              Generate travel together, and they are what stays put while the march scrolls past
              under them — hence the pane's own surface colour on this block, so the march really
              does pass behind it. */}
          <div className={classes.paneHeader}>
            <Stack gap="md">
              <MarchRecap />
              <MarchGenerateButton fullWidth />
            </Stack>
          </div>
          <MarchSection />
        </Stack>
      </Paper>
    </Box>
  );
}
