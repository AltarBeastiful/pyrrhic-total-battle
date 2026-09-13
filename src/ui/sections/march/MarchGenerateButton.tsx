/**
 * Generate, wherever the frame puts it (design rule 2): the March pane header on desktop, the
 * bottom app bar on a phone. One component, because the four states and the press are the same in
 * both places and a second copy would drift.
 *
 * - **ready** — the accent fill, nothing else to say;
 * - **stale** — the same fill with a dot: the setup moved under the answer on screen;
 * - **running** — a spinner, and the press cancels the run;
 * - **blocked** — disabled, and the *reason* is the label as well as the tooltip. A disabled button
 *   fires no hover, so a tooltip alone would hide the one thing the player needs to read.
 *
 * The states themselves are decided by `src/ui/shell/state.ts`, which is where the frame reads them
 * from too: one answer to "can I press this", not two that have to agree.
 */
import { Button, Indicator, Loader, Tooltip } from '@mantine/core';
import { Swords } from 'lucide-react';
import { useMemo } from 'react';

import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { useResultStore } from '@/ui/resultStore';
import { blockedReason, fabState } from '@/ui/shell/state';

import { cancelGenerate, runGenerate } from './generate';
import { setupFingerprint, useRunStore } from './runStore';

export interface MarchGenerateButtonProps {
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

export function MarchGenerateButton({ size = 'md', fullWidth = false }: MarchGenerateButtonProps) {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const running = useResultStore((state) => state.running);
  const hasResult = useResultStore((state) => state.last !== null);
  const lastRunFingerprint = useRunStore((state) => state.lastRunFingerprint);

  // The store hands out the same profile and setup objects until one of them is edited, so the
  // fingerprint is rebuilt only when something a march is computed from really changed.
  const fingerprint = useMemo(() => setupFingerprint(profile, setup), [profile, setup]);
  const hint = blockedReason(profile, setup);
  const state = fabState({ running, blocked: hint, hasResult, fingerprint, lastRunFingerprint });

  const press = (): void => {
    if (running) {
      cancelGenerate();
      return;
    }
    if (hint !== null) return;
    void runGenerate();
  };

  const blocked = state === 'blocked' && hint !== null;
  const label = blocked ? hint : running ? 'Cancel' : 'Generate';
  const name = blocked ? `Generate march: ${hint}` : running ? 'Generate march: cancel' : 'Generate march';

  const button = (
    <Button
      size={size}
      fullWidth={fullWidth}
      aria-label={name}
      {...(blocked ? { 'data-disabled': true, 'aria-disabled': true } : {})}
      variant={blocked ? 'default' : 'filled'}
      leftSection={
        running ? <Loader size={14} color="var(--pyr-on-brass)" /> : <Swords size={16} aria-hidden />
      }
      onClick={(event) => {
        if (blocked) {
          event.preventDefault();
          return;
        }
        press();
      }}
    >
      {label}
    </Button>
  );

  // The state is written on the button's own wrapper, which is what the browser suite waits on to
  // know a run has finished.
  return (
    <Tooltip label={hint ?? 'Size the stacks for this march'} disabled={!blocked} withinPortal>
      <Indicator
        data-state={state}
        aria-busy={running}
        size={8}
        offset={4}
        color="brass"
        disabled={state !== 'stale'}
        withBorder
        {...(fullWidth ? { w: '100%' } : {})}
      >
        {button}
      </Indicator>
    </Tooltip>
  );
}
