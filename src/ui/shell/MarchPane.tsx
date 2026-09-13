/**
 * The supporting pane (M3's canonical supporting-pane layout, design plan §5.0/§5.1): 360 dp,
 * trailing, shown from `lg` (1200 px) and sticky under the app bar, so the answer stays on screen
 * while the setup changes (design rules 1 and 2).
 *
 * Its header is the whole reason frame V1 won: the recap figures and the primary Generate travel
 * together, at the top of the pane, above the march itself.
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
          blocks on the page ground. `MarchSection` drops its own card at this width. */}
      <Paper radius="md" p="md" bg="var(--mantine-color-default)">
        <Stack gap="md">
          <MarchRecap variant="pane" />
          <MarchGenerateButton fullWidth />
          <MarchSection />
        </Stack>
      </Paper>
    </Box>
  );
}
