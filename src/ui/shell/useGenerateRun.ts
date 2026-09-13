/**
 * One run, wherever it is started from. The March pane's button on a desktop and the bottom app
 * bar's on a phone are the March section's own (M-08); what the shell still owns is the keyboard
 * shortcut, and the state it presses through.
 */
import { useCallback, useEffect, useMemo } from 'react';

import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import { useResultStore } from '../resultStore';
import { cancelGenerate, runGenerate } from '../sections/march/generate';
import { setupFingerprint, useRunStore } from '../sections/march/runStore';
import { blockedReason, fabState, type FabState } from './state';

export interface GenerateRun {
  state: FabState;
  /** Why a march cannot be generated, in the words the control shows; `null` when it can. */
  hint: string | null;
  /** Start a run — or stop the one in flight, which is what the same control does while running. */
  press: () => void;
}

export function useGenerateRun(): GenerateRun {
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

  const press = useCallback((): void => {
    if (running) {
      cancelGenerate();
      return;
    }
    if (hint !== null) return;
    void runGenerate();
  }, [running, hint]);

  return { state, hint, press };
}

/**
 * `Ctrl`/`⌘ + Enter` generates from anywhere, including from inside a field — which is exactly
 * where a player's hands are when they want it. Bound once, by the frame, so it cannot be bound
 * twice by two controls that exist at two different widths.
 */
export function useGenerateShortcut(): void {
  const { press } = useGenerateRun();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey) || event.repeat) return;
      event.preventDefault();
      press();
    };
    globalThis.document.addEventListener('keydown', onKeyDown);
    return () => {
      globalThis.document.removeEventListener('keydown', onKeyDown);
    };
  }, [press]);
}
