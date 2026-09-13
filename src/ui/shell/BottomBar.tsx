/**
 * The Material bottom app bar (frame V1, spike 0009): below 1200 px the answer and Generate live
 * here — a very quick summary on the left, whose whole half is the target that opens the March
 * sheet, and Generate on the right. 64 px, one bar per edge, no floating button anywhere.
 *
 * Measured at 390×844 in the spike: 64 px top + 64 px bottom of chrome, and because the bar is
 * sticky rather than fixed it lands in the flow at the end of the page instead of covering the last
 * control on it.
 *
 * Since the March moved into the sheet (design rule 5, 2026-09-13) this summary is the only place a
 * phone shows the answer while the setup is on screen, so a finished run has to be visible *here*:
 * `pulse` counts the runs, and a new count restarts the one short flash on the summary. It is a
 * count rather than a flag so that a second run flashes again; it is honoured only where the player
 * has not asked for stillness (`prefers-reduced-motion`), and the sentence the shell announces says
 * the same thing without it.
 */
import { Paper, UnstyledButton } from '@mantine/core';

import { MarchGenerateButton, MarchQuickSummary } from '@/ui/sections/march';

import classes from './shell.module.css';

export interface BottomBarProps {
  /** Opens the March sheet: the summary half of the bar is one big target. */
  onOpenRecap: () => void;
  /** How many runs have finished with the sheet shut; each one flashes the summary once. */
  pulse?: number;
}

export function BottomBar({ onOpenRecap, pulse = 0 }: BottomBarProps) {
  return (
    <Paper component="div" radius={0} bg="var(--mantine-color-default)" className={classes.bottomBar}>
      <UnstyledButton
        className={classes.tapRow}
        style={{ flex: '1 1 auto' }}
        aria-label="Open the march recap"
        onClick={onOpenRecap}
      >
        {/* Keyed on the run count so the animation is re-run rather than re-declared: a CSS
            animation only restarts when the element it is on is a new one. */}
        <div key={pulse} className={pulse > 0 ? classes.pulse : undefined}>
          <MarchQuickSummary />
        </div>
      </UnstyledButton>
      <MarchGenerateButton size="sm" />
    </Paper>
  );
}
