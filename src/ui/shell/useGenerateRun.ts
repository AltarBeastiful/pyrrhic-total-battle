/**
 * One run, two controls. The app bar carries Generate on a wide screen and the floating button
 * carries it everywhere else (never both at once), so the state they show and the press they answer
 * to live here rather than twice.
 */
import { useCallback, useMemo } from 'react';

import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import { useResultStore } from '../resultStore';
import { cancelGenerate, runGenerate } from '../sections/results/generate';
import { setupFingerprint, useRunStore } from '../sections/results/runStore';
import { scrollToMarch } from './march';
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
    scrollToMarch();
  }, [running, hint]);

  return { state, hint, press };
}
