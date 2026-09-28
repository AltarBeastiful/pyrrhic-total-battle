/**
 * One reading of the march, for the four places that draw it: the section in the page, the recap in
 * the March pane, the recap sheet on a phone and the quick summary in the bottom bar.
 *
 * The contract components (M-08) take no data props — the shell decides *where* they go, never
 * *what* they say — so the derivation lives here rather than four times over: the cached result,
 * the counts the player edited by hand applied on top of it, the two readings of the formation
 * (tiles and rows) and the run before this one to compare against.
 */
import { useMemo } from 'react';

import type { BattleSummary, Pool, StackResult } from '@/engine/types';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { useResultStore, type ResultSnapshot } from '@/ui/resultStore';

import { applyCounts, hasEdits } from './manual';
import { raisedCounts, troopFloor } from './raise';
import type { RaiseModes } from './raise';
import { leftOutOf, marchRows, poolRows } from './rows';
import type { LeftOutUnit, MarchStackRow, PoolRow } from './rows';
import { setupFingerprint, useRunStore } from './runStore';

export interface MarchView {
  /** The generated result as it came out of the engine, with the request it belongs to. */
  snapshot: ResultSnapshot | null;
  /** What is on screen: the generated result, or the hand-edited one when there are edits. */
  result: StackResult | null;
  summary: BattleSummary | null;
  /** The run before this one, when there was one; the recap says which way each figure moved. */
  previous: BattleSummary | null;
  /**
   * The setup has moved since this march was generated, so what is on screen answers a question the
   * form no longer asks. One reading for the three places that show it (owner, 2026-09-13): the
   * recap's warning line, the dimmed figures and pills, the ⚠️ on the phone bar's answer — and it is
   * the same comparison Generate's own dot is drawn from (`shell/state.ts`, `fabState`).
   */
  stale: boolean;
  /** Counts were changed by hand, so there is something to undo. */
  edited: boolean;
  /** Pools the hand-edited counts no longer fit in. */
  overflow: Pool[];
  /**
   * **The position of each hired pool's sheltered-raise control** (S-142), as the player left it. A standing
   * rule: it survives a Generate, and `useMarch` applies it to whatever march is on screen.
   */
  raiseModes: RaiseModes;
  /**
   * Whether the raise is offered on this march at all — the run is a **plan's**, and there are troops to
   * shelter by. The sizer methods have nothing to give (their exact fill already takes the pool, the stock
   * and the shelter — `stacker.ts:81-98`), so the control is not drawn there (design rule 15), and a raise
   * left on from a plan is not applied to them either: one rule, the control and its effect together.
   */
  canRaise: boolean;
  rows: MarchStackRow[];
  /** The army as pills, one block per housing pool (design plan §5.5). */
  pools: PoolRow[];
  /**
   * Types this march does not field, each with the reason: the player took it out of the march on
   * screen, or the sizer / priority search dropped it.
   */
  leftOut: LeftOutUnit[];
}

export function useMarch(): MarchView {
  const snapshot = useResultStore((state) => state.last);
  // Manual edits live in the result store so they survive a reload with the result they belong to.
  const counts = useResultStore((state) => state.manualCounts);
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const previous = useRunStore((state) => state.previousSummary);
  const lastRunFingerprint = useRunStore((state) => state.lastRunFingerprint);
  // Left out *of the march on screen*, by hand — run state, cleared by the next Generate (S-53).
  // What the account does not own at all is not a march decision and never reaches here:
  // `buildStackRequest` never puts it in the request.
  const leftOutByPlayer = useRunStore((state) => state.leftOutByPlayer);
  // Counts are being typed into the pills (`MarchCountsBar`), which changes what the *army* looks
  // like, never what the figures are computed from.
  const editing = useRunStore((state) => state.editingCounts);
  // The sheltered raise (S-142): the position of each hired pool's control, read as the object it is (a
  // selector on a field would keep re-rendering the five components that call this).
  const raiseModes = useRunStore((state) => state.raiseModes);
  // **Where the raise is offered**: a plan's own march, whose counts are the plan's trade and sit below
  // what the shelter allows. A sizer's march has nothing left to give (`stacker.ts:81-98`).
  const planned = useRunStore((state) => state.plan !== null);

  // The store hands out the same profile and setup objects until one of them is edited, so this is
  // rebuilt only when something a march is actually computed from moved.
  const fingerprint = useMemo(() => setupFingerprint(profile, setup), [profile, setup]);
  const stale = snapshot !== null && lastRunFingerprint !== null && lastRunFingerprint !== fingerprint;

  return useMemo(() => {
    if (snapshot === null) {
      return {
        snapshot: null,
        result: null,
        summary: null,
        previous,
        stale: false,
        edited: false,
        overflow: [],
        raiseModes,
        canRaise: false,
        rows: [],
        pools: [],
        leftOut: [],
      };
    }

    /**
     * **The raise, then the typing over it** (S-142). The positions are a standing rule the player set, so
     * they are applied to the march on screen every time — a Generate, another stop, a put-back — and never
     * written into `manualCounts`, which is why nothing here can go stale and why `Undo` (and the sentence
     * that says "counts edited by hand") keeps meaning exactly what it meant.
     *
     * A count typed by hand is the player's own last word on that one stack, so it is merged **over** the
     * raise. `effective` is what is really on the field; `edits` and `edited` are two different questions
     * asked of it — "is there anything to replay?" and "did the player type?" — because the first draws the
     * figures and the second draws the Undo mark and the note.
     */
    const canRaise = planned && troopFloor(snapshot.result) !== null;
    const raised = canRaise ? raisedCounts(snapshot.request, snapshot.result, raiseModes) : null;
    const effective = raised === null ? counts : { ...raised, ...counts };
    const edited = hasEdits(snapshot.result, counts);

    const edits = hasEdits(snapshot.result, effective)
      ? applyCounts(snapshot.request, snapshot.result, effective)
      : null;
    const result = edits?.result ?? snapshot.result;
    const summary = edits?.summary ?? snapshot.summary;

    /**
     * **While the counts are being edited by hand, the pills are the fields** (owner, 2026-09-21: *"it
     * should only be deleted on done editing cause it can prevent me from typing"*).
     *
     * So the army is drawn from the **generated** list with what has been typed into it, rather than from
     * the edited march: a stack typed down to nothing — which is what an emptied box means, and every box
     * is empty for a moment between two figures — keeps its pill, in its place, instead of falling into
     * the "Left out" row and taking the focused field with it. And the order is the one the march was
     * generated in, so a figure landing does not re-sort the grid under the cursor.
     *
     * Nothing else follows this reading: the figures, the plan and the recovery are all computed from
     * `result`, the edited march, at every keystroke as before. Leaving the mode is what moves a stack at
     * 0 out of the army — one place where a removal can be seen happening.
     */
    const army = editing
      ? {
          ...result,
          stacks: snapshot.result.stacks.map((stack) => {
            // `effective` and not `counts`: with a raise on, a stack the player has not typed into still
            // shows the count it is fielded at, and the field agrees with the figures above it.
            const typed = effective[stack.unitId];
            return typed === undefined ? stack : { ...stack, count: Math.max(0, Math.round(typed)) };
          }),
        }
      : result;

    return {
      snapshot,
      result,
      summary,
      previous,
      stale,
      edited,
      overflow: edits?.overflow ?? [],
      raiseModes,
      canRaise,
      rows: marchRows(snapshot.request, snapshot.result, result, summary),
      pools: poolRows({
        result: army,
        units: snapshot.request.units,
        totals: snapshot.request.totals,
        keepEmpty: editing,
      }),
      leftOut: leftOutOf(snapshot.request.units, army, leftOutByPlayer, editing),
    };
  }, [snapshot, counts, editing, leftOutByPlayer, previous, stale, raiseModes, planned]);
}
