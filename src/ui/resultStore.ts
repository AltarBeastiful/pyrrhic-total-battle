/**
 * The last computed result, kept outside the saved document: it is derived data, cheap to recompute,
 * and it must not grow the localStorage payload. The Results section writes to it after every
 * `Generate`; the share dialog reads it to build a battle link.
 */
import { create } from 'zustand';

import type { BattleSummary, StackRequest, StackResult } from '@/engine/types';
import type { SavedSummary, StackCount } from '@/state/schema';

export interface ResultSnapshot {
  /** The request the engine was called with, so a share link can reproduce it. */
  request: StackRequest;
  result: StackResult;
  summary: BattleSummary;
  /** Which profile and setup produced it; a switch makes the result stale. */
  profileId: string;
  setupId: string;
  at: number;
}

export type ResultInput = Omit<ResultSnapshot, 'at'> & { at?: number | undefined };

export interface ResultState {
  last: ResultSnapshot | null;
  /** True while a calculation is running (the worker client is driven by the Results section). */
  running: boolean;
  /** Message of the last failed calculation, cleared by the next successful one. */
  error: string | null;
  setResult: (snapshot: ResultInput) => void;
  setRunning: (running: boolean) => void;
  setError: (message: string | null) => void;
  clear: () => void;
}

export const useResultStore = create<ResultState>()((set) => ({
  last: null,
  running: false,
  error: null,
  setResult: (snapshot) => {
    set({ last: { ...snapshot, at: snapshot.at ?? Date.now() }, error: null, running: false });
  },
  setRunning: (running) => {
    set({ running });
  },
  setError: (message) => {
    set({ error: message, running: false });
  },
  clear: () => {
    set({ last: null, error: null, running: false });
  },
}));

/** The stack counts as the share codec and saved stacks store them. */
export function resultCounts(result: StackResult): StackCount[] {
  return result.stacks.map((stack) => ({ unitId: stack.unitId, count: stack.count }));
}

/** The subset of the battle summary that is small enough to travel in a battle link. */
export function toSavedSummary(summary: BattleSummary): SavedSummary {
  return {
    minDamage: summary.minDamage,
    maxDamage: summary.maxDamage,
    avgDamage: summary.avgDamage,
    damagePerSilver: summary.damagePerSilver,
    damagePerGold: summary.damagePerGold,
    damagePerDragonCoin: summary.damagePerDragonCoin,
    recovery: { ...summary.recovery },
  };
}
