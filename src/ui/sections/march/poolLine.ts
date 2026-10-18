/**
 * **The pool line's presses and the burn ceiling, as the March's handlers** (`docs/plans/burn-ceiling.md`
 * §3.1, §3.2). Plain functions over the stores, like `formation.ts`, so the pane and a test press the same thing.
 */
import { useStore } from '@/state/store';
import type { PoolLineRule } from '@/state/schema';

import { useResultStore } from '@/ui/resultStore';
import { isAbortError } from '@/worker/client';

import { resizeMarch } from './generate';
import { troopFloor } from './raise';
import type { RaisedPool } from './raise';
import { primeRaise } from './raiseSearch';
import { useRunStore, wholeCeiling } from './runStore';

/**
 * **A press of a pool line's push or round** — a toggle on that pool (S-159). Switching one **on** also
 * records it as the rule the account's *Pool line on Generate* setting opens with (§3.1: *"the standing rule it
 * turns on is the one the button last set"*), so the setting needs no second knob. Written only when it moves:
 * a profile write is a sync.
 */
export function pressPoolLine(pool: RaisedPool, rule: PoolLineRule, on: boolean): void {
  const run = useRunStore.getState();
  if (rule === 'push') run.setPushed(pool, on);
  else run.setRounded(pool, on);
  if (!on) return;
  const state = useStore.getState();
  const id = state.doc.activeProfileId;
  const profile = state.doc.profiles.find((candidate) => candidate.id === id);
  if (profile === undefined || profile.settings.poolLineRule === rule) return;
  state.updateProfile(id, (current) => ({ settings: { ...current.settings, poolLineRule: rule } }));
}

/** The ceiling whose march is being computed, so a second commit of the same figure asks nothing again. */
let pending: { ceiling: number | null; controller: AbortController } | null = null;

/**
 * **A ceiling typed into the `Burn ≤` field** (§3.2; owner, 2026-10-18: the march under a ceiling is **the
 * kernel's Tight with that ceiling**, and it lands **in one update**).
 *
 * The answer is computed first and the ceiling set with it, in one tick, so no frame draws the march before it
 * or a climb under it:
 *
 *  - **a March edit on screen** is re-sized again under the new ceiling — same types, same stop — and the
 *    kernel's raise over it asked before it is published (`resizeMarch`, which sets the ceiling with it);
 *  - **the plan's own stop**: the kernel's raise of the march on screen under it (`primeRaise`). The bar's
 *    tables are not re-priced: the ceiling is per march, and the bar's stops are untouched (§3.2);
 *  - anything else (a sizer's march, no march) takes the ceiling at once: nothing is drawn under it there.
 */
export async function changeBurnCeiling(ceiling: number | null): Promise<void> {
  const next = wholeCeiling(ceiling);
  const run = useRunStore.getState();
  if (pending !== null && pending.ceiling === next) return;
  pending?.controller.abort();
  if (next === run.burnCeiling) {
    pending = null;
    return;
  }
  const controller = new AbortController();
  pending = { ceiling: next, controller };
  const settle = (): void => {
    if (pending?.controller === controller) pending = null;
  };
  const snapshot = useResultStore.getState().last;
  const plan = run.plan;
  if (snapshot === null || plan === null || troopFloor(snapshot.result) === null) {
    run.setBurnCeiling(next);
    settle();
    return;
  }
  if (run.resize !== null) {
    await resizeMarch(run.includedUnitIds, run.leftOutByPlayer, {}, next);
    settle();
    return;
  }
  let commit: (() => void) | null = null;
  try {
    commit = await primeRaise(
      snapshot.request,
      snapshot.result,
      run.raiseModes,
      next ?? undefined,
      controller.signal,
    );
  } catch (error) {
    // A newer ceiling took over: it commits its own answer.
    if (controller.signal.aborted || isAbortError(error)) {
      settle();
      return;
    }
  }
  if (controller.signal.aborted) return;
  // The march on screen must still be the one the answer is about; otherwise the March asks for its own.
  if (useResultStore.getState().last === snapshot && useRunStore.getState().plan === plan) commit?.();
  useRunStore.getState().setBurnCeiling(next);
  settle();
}
