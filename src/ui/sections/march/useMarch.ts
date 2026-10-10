/**
 * One reading of the march, for the four places that draw it: the section in the page, the recap in
 * the March pane, the recap sheet on a phone and the quick summary in the bottom bar.
 *
 * The contract components (M-08) take no data props — the shell decides *where* they go, never
 * *what* they say — so the derivation lives here rather than four times over: the cached result,
 * the counts the player edited by hand applied on top of it, the two readings of the formation
 * (tiles and rows) and the run before this one to compare against.
 */
import { useEffect, useMemo } from 'react';

import type { BattleSummary, Pool, StackResult } from '@/engine/types';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { useResultStore, type ResultSnapshot } from '@/ui/resultStore';

import { applyCounts, hasEdits } from './manual';
import type { PositionTrades } from './positions';
import { usePricedRaise } from './positionsSearch';
import { raisedCounts, troopFloor } from './raise';
import type { RaiseModes } from './raise';
import { useRaiseSearch } from './raiseSearch';
import { leftOutOf, marchRows, poolRows, type PillOrder } from './rows';
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
  /**
   * **An exhaustive position's search is in flight for this march** (S-143b). The counts on screen are the
   * damage climb's until it lands — a march the game would take, and the seed the search starts from — so
   * this only says whether the control is still waiting for the exhaustive answer (`raiseSearch.ts`).
   *
   * It is `false` whenever the plan's own table already holds the answer (S-149): a position the wasm priced
   * before the press is not waited for, and the control says so by drawing no wait at all.
   */
  searching: boolean;
  /** The stop's priced positions, which the raise control's hover previews; `null` while they are coming. */
  trades: PositionTrades | null;
  rows: MarchStackRow[];
  /** The army as pills, one block per housing pool (design plan §5.5). */
  pools: PoolRow[];
  /**
   * Types this march does not field, each with the reason: the player took it out of the march on
   * screen, or the sizer / priority search dropped it.
   */
  leftOut: LeftOutUnit[];
}

/**
 * `pillOrder` is how the March's pills are ordered (Critical 04): a view preference held by the one
 * component that draws the switch, never by a store, so every other caller gets the battle selection order.
 */
export function useMarch(pillOrder: PillOrder = 'battle'): MarchView {
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
  // what the shelter allows. A sizer's march has nothing left to give (`stacker.ts:81-98`). The plan itself
  // is read as the object it is — its identity is what the tables under it are filed under, one level down
  // (`positionsSearch.ts`), and `null` is the whole of what the two lines below need from it.
  const plan = useRunStore((state) => state.plan);
  const planned = plan !== null;

  // The store hands out the same profile and setup objects until one of them is edited, so this is
  // rebuilt only when something a march is actually computed from moved.
  const fingerprint = useMemo(() => setupFingerprint(profile, setup), [profile, setup]);
  const stale = snapshot !== null && lastRunFingerprint !== null && lastRunFingerprint !== fingerprint;

  /**
   * Whether the raise is offered at all, read here rather than inside the memo below because **the
   * exhaustive search is a hook and has to be asked above the early return** — hooks do not run on a branch.
   * It is the same two conditions the memo asks (`raise.ts` has the long form): a plan's own march, with
   * troops to shelter by.
   */
  const canRaise = planned && snapshot !== null && troopFloor(snapshot.result) !== null;
  /**
   * **The one asynchronous reading in the March** (S-143b): `counts` is `null` until the search answers.
   * Read out as two values rather than as the object the hook returns — a fresh object every render would
   * be a new dependency every render, and the memo below would never hold.
   *
   * **`priced` is what the plan's own table has already answered** (S-149), and it is asked first: it starts
   * the bar's pricing as well, so the block under the fold and the control in the summary are answered by one
   * run of one job a stop. `pricing` is the table **on its way**, which is a fact of its own (`PricedRaise`).
   */
  const position = useRunStore((state) => state.planPick);
  const { counts: priced, trades, pricing } = usePricedRaise(snapshot, plan, position, raiseModes, canRaise);
  const { counts: exhaustiveCounts, running: waiting } = useRaiseSearch(
    /**
     * **A search the plan's own table has already answered is not asked again** (S-149; owner, 2026-09-30:
     * *"make the positions selector (as is, tight…) use the already computed assemblyscript values"*). The row
     * under the plan is the same counts — the wasm answered that question for all five positions on every stop
     * of the bar, before this press — so the wait, and the search behind it, are the second computation of an
     * answer already in hand. `null` is this hook's own "off the march" state, and the job in flight is
     * stopped with it: the table's answer supersedes it either way.
     *
     * **And neither is it asked while that table is still coming** (S-149's follow-up; the owner, 2026-10-01:
     * *"it seems when clicking again on generate, we're still using ts tight version instead of assembly
     * script"*). A Generate re-prices the bar — a new plan, a new army — and in the frames before its rows land
     * there is no answer to read, which used to be read as "the table will not answer" and started the search
     * the wasm was about to make unnecessary: measured at one dispatched search a Generate, up to 51 s of
     * walking, stopped the moment the row landed. The climb stands on screen for those frames instead, exactly
     * as it does while the exhaustive search runs, and the search is left for the marches the table really
     * cannot describe: one the plan did not size, a stop whose job failed, and a host with no worker at all.
     */
    priced === null && !pricing ? snapshot : null,
    raiseModes,
    canRaise,
  );

  const march = useMemo(() => {
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
        searching: false,
        trades: null,
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
    const raised =
      canRaise && priced === null ? raisedCounts(snapshot.request, snapshot.result, raiseModes) : null;
    /**
     * **The plan's own answer, or the climb with the search over it** (S-143b, S-145, S-149).
     *
     * `priced` is the row under the plan — the same question the control asks, answered ahead of the press by
     * the wasm, and the raise whole: the climb's counts are inside it and the search's own counts are on top
     * of them (`positions.ts`), which is why `raisedCounts` is not run for it at all.
     *
     * Without it — no plan, the bar still being priced, a march the plan did not size — this is the March's
     * own path, and the two things it must not do were caught by the review of 2026-09-29. It must **not** be
     * skipped when `raised` is `null`: the sampled climb can find nothing on a stop where the exhaustive
     * search finds something — that is the whole gap this position closes — and the old guard threw that
     * answer away. And the search's counts must be merged over `raised` on **every** slot it walked and not
     * only the ones it moved, or a stack it decided to bring back down to the plan's count would keep the
     * seed's higher one.
     */
    const lifted = priced ?? (exhaustiveCounts === null ? raised : { ...raised, ...exhaustiveCounts });
    const effective = lifted === null ? counts : { ...lifted, ...counts };
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
      // Nothing is waited for while the plan's own table answers: the counts are already in hand (S-149).
      searching: priced === null && waiting,
      trades,
      rows: marchRows(snapshot.request, snapshot.result, result, summary),
      pools: poolRows({
        result: army,
        units: snapshot.request.units,
        totals: snapshot.request.totals,
        keepEmpty: editing,
        order: pillOrder,
      }),
      leftOut: leftOutOf(snapshot.request.units, army, leftOutByPlayer, editing),
    };
  }, [
    snapshot,
    counts,
    editing,
    leftOutByPlayer,
    previous,
    stale,
    raiseModes,
    canRaise,
    priced,
    trades,
    exhaustiveCounts,
    waiting,
    pillOrder,
  ]);

  /**
   * **What the March draws is what the next Generate compares against** (owner, 2026-10-07: *"the default
   * (tight) changes the reference used to compute the percent"*). The recap's notes are read against the
   * previous run, and with Tight on by default the previous run on screen was a raised march: comparing the
   * next one against the snapshot under it would credit Tight's own gain to the new march every time.
   *
   * **And it is the march the run put on screen, held for the run** (owner, 2026-10-10): a put-back, a hand edit
   * or the As is | Tight selector recompute the figures against that reference and never replace it
   * (`runStore.showSummary`).
   */
  useEffect(() => {
    // Not while the run's own raise is still being priced or searched: the reference is the march the player
    // is first shown, Tight included, and not the plan's counts that stand there for the frames before it.
    if (pricing || waiting) return;
    useRunStore.getState().showSummary(march.summary, snapshot?.at ?? null);
  }, [march.summary, snapshot?.at, pricing, waiting]);

  return march;
}
