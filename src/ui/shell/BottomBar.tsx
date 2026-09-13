/**
 * The Material bottom app bar (frame V1, spike 0009): below 1200 px the answer and Generate live
 * here — a very quick summary on the left, whose whole half is the target that opens the full
 * recap, and Generate on the right. 64 px, one bar per edge, no floating button anywhere.
 *
 * Measured at 390×844 in the spike: 64 px top + 64 px bottom of chrome, and because the bar is
 * sticky rather than fixed it lands in the flow at the end of the page instead of covering the last
 * control on it.
 */
import { Paper, UnstyledButton } from '@mantine/core';

import { MarchGenerateButton, MarchQuickSummary } from '@/ui/sections/march';

import classes from './shell.module.css';

export interface BottomBarProps {
  /** Opens the recap sheet: the summary half of the bar is one big target. */
  onOpenRecap: () => void;
}

export function BottomBar({ onOpenRecap }: BottomBarProps) {
  return (
    <Paper component="div" radius={0} px="sm" bg="var(--mantine-color-default)" className={classes.bottomBar}>
      <UnstyledButton
        className={classes.tapRow}
        style={{ flex: '1 1 auto' }}
        aria-label="Open the march recap"
        onClick={onOpenRecap}
      >
        <MarchQuickSummary />
      </UnstyledButton>
      <MarchGenerateButton size="sm" />
    </Paper>
  );
}
