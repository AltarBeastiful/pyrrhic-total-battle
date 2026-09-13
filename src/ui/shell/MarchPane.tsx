/**
 * The supporting pane (M3's canonical supporting-pane layout, design plan §5.0/§5.1): 360 dp,
 * trailing, shown from `lg` (1200 px) and sticky under the app bar, so the answer stays on screen
 * while the setup changes (design rules 1 and 2).
 *
 * Its header is the whole reason frame V1 won: the recap figures and the primary Generate travel
 * together, at the top of the pane, above the march itself.
 */
import { Box, Stack } from '@mantine/core';

import { MarchGenerateButton, MarchRecap, MarchSection } from '@/ui/sections/march';

import classes from './shell.module.css';

export function MarchPane() {
  return (
    // Unnamed on purpose: the March section inside carries the name, and two landmarks called
    // "March" would be one too many.
    <Box component="aside" className={classes.pane}>
      {/* No surface of its own: the March components bring theirs, and a card around a card is the
          "mismatch of CSS" design rule 23 exists to stop. */}
      <Stack gap="md">
        <MarchRecap variant="pane" />
        <MarchGenerateButton fullWidth />
        <MarchSection />
      </Stack>
    </Box>
  );
}
