/**
 * One run, wherever it is started from. The March pane's button on a desktop and the bottom app
 * bar's on a phone are the March section's own (M-08); what the shell still owns is the keyboard
 * shortcut, and the state it presses through.
 */
import { useCallback, useEffect, useMemo } from 'react';
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';

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

export interface BarForm {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLFormElement>) => void;
}

/**
 * What makes the command bar a form (design plan §5.6; the review of 2026-09-13: "Enter in a
 * housing field does nothing, which is the one key a hand on the keypad reaches for").
 *
 * Submitting the bar *is* generating, so `Enter` in any of its fields runs the march — and the
 * fields ask for the `go` key on a phone to say so. It is said in two halves because the bar's one
 * button is Generate, which Mantine renders as `type="button"`: with no submit button in it, a form
 * with more than one field has no implicit submission of its own, so `Enter` is turned into a
 * `requestSubmit()` here and the submit is what presses.
 *
 * An `Enter` something else has already dealt with is left alone — choosing an option in the
 * objective's dropdown, above all — and so is `Ctrl`/`⌘ + Enter`, which is the frame's shortcut and
 * would otherwise press twice.
 */
export function useBarForm(): BarForm {
  const { press } = useGenerateRun();

  return {
    onSubmit: (event) => {
      event.preventDefault();
      press();
    },
    onKeyDown: (event) => {
      if (event.key !== 'Enter' || event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if ((event.target as HTMLElement).tagName !== 'INPUT') return;
      event.preventDefault();
      event.currentTarget.requestSubmit();
    },
  };
}
