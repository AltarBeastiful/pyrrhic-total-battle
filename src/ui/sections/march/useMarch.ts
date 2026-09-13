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

import type { BattleSummary, Pool, StackResult, UnitDef } from '@/engine/types';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { useResultStore, type ResultSnapshot } from '@/ui/resultStore';

import { applyCounts, hasEdits } from './manual';
import { leftOutOf, marchRows, poolRows } from './rows';
import type { MarchStackRow, PoolRow } from './rows';
import { useRunStore } from './runStore';

export interface MarchView {
  /** The generated result as it came out of the engine, with the request it belongs to. */
  snapshot: ResultSnapshot | null;
  /** What is on screen: the generated result, or the hand-edited one when there are edits. */
  result: StackResult | null;
  summary: BattleSummary | null;
  /** The run before this one, when there was one; the recap says which way each figure moved. */
  previous: BattleSummary | null;
  /** Counts were changed by hand, so there is something to undo. */
  edited: boolean;
  /** Pools the hand-edited counts no longer fit in. */
  overflow: Pool[];
  rows: MarchStackRow[];
  /** The army as pills, one block per housing pool (design plan §5.5). */
  pools: PoolRow[];
  /** Unit types kept in the march by hand. */
  pinned: string[];
  /** Types that are not in the request any more: excluded in the profile, or removed here. */
  leftOut: UnitDef[];
  /** Types kept in that this march did not field anyway — something upstream is switched off. */
  keptElsewhere: string[];
}

const EMPTY: string[] = [];

export function useMarch(): MarchView {
  const snapshot = useResultStore((state) => state.last);
  // Manual edits live in the result store so they survive a reload with the result they belong to.
  const counts = useResultStore((state) => state.manualCounts);
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const removedMercenaries = useRunStore((state) => state.removedMercenaries);
  const previous = useRunStore((state) => state.previousSummary);

  const pinned = setup?.pinnedUnitIds ?? EMPTY;
  const excluded = profile?.troops.excludedUnitIds ?? EMPTY;

  return useMemo(() => {
    if (snapshot === null) {
      return {
        snapshot: null,
        result: null,
        summary: null,
        previous,
        edited: false,
        overflow: [],
        rows: [],
        pools: [],
        pinned: [...pinned],
        leftOut: [],
        keptElsewhere: [],
      };
    }

    const edits = hasEdits(snapshot.result, counts)
      ? applyCounts(snapshot.request, snapshot.result, counts)
      : null;
    const result = edits?.result ?? snapshot.result;
    const summary = edits?.summary ?? snapshot.summary;
    const leftOutIds = [...excluded, ...removedMercenaries.map((entry) => entry.id)];

    const pools = poolRows({ result, units: snapshot.request.units, pinned });

    return {
      snapshot,
      result,
      summary,
      previous,
      edited: edits !== null,
      overflow: edits?.overflow ?? [],
      rows: marchRows(snapshot.request, snapshot.result, result, summary),
      pools,
      pinned: [...pinned],
      leftOut: leftOutOf(snapshot.request.units, result, leftOutIds),
      keptElsewhere: pinned.filter((unitId) => !result.stacks.some((stack) => stack.unitId === unitId)),
    };
  }, [snapshot, counts, pinned, excluded, removedMercenaries, previous]);
}
