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
import { Button, Indicator, Loader, Text, Tooltip } from '@mantine/core';
import { Swords } from 'lucide-react';
import { useMemo } from 'react';

import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { useResultStore } from '@/ui/resultStore';
import { blockedReason, fabState } from '@/ui/shell/state';
import { HAS_KEYBOARD, useMediaQuery } from '@/ui/shell/useMediaQuery';

import { cancelGenerate, runGenerate } from './generate';
import classes from './march.module.css';
import { setupFingerprint, useRunStore } from './runStore';

/**
 * **The keystroke, written on the button** (owner, 2026-09-21: *"generate is now driven through
 * ctrl+enter; give a hint of that around the generate button, although it should be hidden when it's not
 * possible: without keyboard"*).
 *
 * `Ctrl`/`⌘ + Enter` runs a march from anywhere on the page, including from inside a field
 * (`shell/useGenerateRun.ts`) — the one shortcut the app has, and until now the one thing about it a
 * player could only find by reading the source. It is drawn **inside the button**, at its end, so it
 * costs the command bar no width of its own and travels with Generate to the phone's sheet, where it is
 * simply not drawn.
 *
 * Hidden whenever it cannot be typed or would be wrong: no fine pointer (`HAS_KEYBOARD`), a run in
 * flight — where the button says "Cancel" and Enter would start nothing — or a blocked button, whose
 * label is the reason it is blocked and must not share its line.
 *
 * The word is the machine's own: `⌘` where the key is called that, `Ctrl` everywhere else. The listener
 * takes either, so this is only what to call it.
 */
function shortcutWords(): string {
  const agent = globalThis.navigator?.userAgent ?? '';
  return /Mac|iPhone|iPad|iPod/i.test(agent) ? '⌘ ↵' : 'Ctrl ↵';
}

export interface MarchGenerateButtonProps {
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

export function MarchGenerateButton({ size = 'md', fullWidth = false }: MarchGenerateButtonProps) {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const running = useResultStore((state) => state.running);
  const hasResult = useResultStore((state) => state.last !== null);
  const keyboard = useMediaQuery(HAS_KEYBOARD);
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
      // 44 px in the March pane, 40 in the bottom app bar — the artboards' own two heights
      // (design plan §5.5, `.gen` and `.gen.sm`).
      h={fullWidth ? 44 : 40}
      radius={10}
      fz="0.9375rem"
      aria-label={name}
      {...(blocked ? { 'data-disabled': true, 'aria-disabled': true } : {})}
      // The one gilded control on the page. Blocked, it drops the metal: a button that cannot be
      // pressed must not look like the thing to press (docs/design.md §1, "one primary per view").
      variant={blocked ? 'default' : 'gold'}
      leftSection={
        running ? <Loader size={14} color="var(--pyr-gold-ink)" /> : <Swords size={16} aria-hidden />
      }
      // The hint is the button's own ink, stepped back: a reminder beside the word, never a second
      // thing to read. `aria-hidden`, because the button's name already says what it does and a
      // reader has no use for a key it cannot see (the shortcut works for it all the same).
      {...(keyboard && !running && !blocked
        ? {
            rightSection: (
              <Text span size="xs" aria-hidden className={classes.shortcut}>
                {shortcutWords()}
              </Text>
            ),
          }
        : {})}
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
