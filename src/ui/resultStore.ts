/**
 * The last computed result, kept outside the saved document: it is derived data, cheap to recompute,
 * and it must not grow the localStorage payload. The Results section writes to it after every
 * `Generate`; the share dialog reads it to build a battle link.
 *
 * It *is* cached in its own storage key so a reload does not lose the stacks you just generated
 * (`pyrrhic.lastResult.v1`). Only the output travels there — result, summary, the counts edited by hand
 * and which profile/march produced them. The request is not stored: it holds every unit table row of the
 * march and is rebuilt from the profile when the result is restored (`restoreLastResult`).
 */
import { create } from 'zustand';
import { z } from 'zod';

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
  /** Counts the player changed by hand on top of the generated result, keyed by unit id. */
  manualCounts: Record<string, number>;
  setResult: (snapshot: ResultInput) => void;
  setRunning: (running: boolean) => void;
  setError: (message: string | null) => void;
  setManualCounts: (counts: Record<string, number>) => void;
  editCount: (unitId: string, count: number) => void;
  resetCounts: () => void;
  clear: () => void;
}

export const useResultStore = create<ResultState>()((set) => ({
  last: null,
  running: false,
  error: null,
  manualCounts: {},
  setResult: (snapshot) => {
    // A new formation invalidates the hand-edited counts: they belonged to the previous one.
    set({
      last: { ...snapshot, at: snapshot.at ?? Date.now() },
      error: null,
      running: false,
      manualCounts: {},
    });
  },
  setRunning: (running) => {
    set({ running });
  },
  setError: (message) => {
    set({ error: message, running: false });
  },
  setManualCounts: (counts) => {
    set({ manualCounts: counts });
  },
  editCount: (unitId, count) => {
    set((state) => ({ manualCounts: { ...state.manualCounts, [unitId]: Math.max(0, Math.round(count)) } }));
  },
  resetCounts: () => {
    set({ manualCounts: {} });
  },
  clear: () => {
    set({ last: null, error: null, running: false, manualCounts: {} });
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

// ---- Cached last result -------------------------------------------------------------------------------
/** Its own key, separate from `pyrrhic.v1`: this is a cache, and dropping it must never touch the config. */
export const LAST_RESULT_KEY = 'pyrrhic.lastResult.v1';

const poolUsageSchema = z.object({ used: z.number(), capacity: z.number() });
const poolMapSchema = <T extends z.ZodType>(value: T) =>
  z.object({ leadership: value, authority: value, dominance: value });
const categorySchema = z.enum(['melee', 'ranged', 'mounted', 'flying']);

const stackSchema = z.object({
  unitId: z.string(),
  pool: z.enum(['leadership', 'authority', 'dominance']),
  count: z.number(),
  hpPerUnit: z.number(),
  totalHp: z.number(),
  strengthPerUnit: z.number(),
  target: categorySchema,
  damagePerHit: z.number(),
  featuresDamage: z.number(),
  doubleDamageChance: z.number(),
  strikeTwoSquadsChance: z.number(),
});

const resultSchema = z.object({
  stacks: z.array(stackSchema),
  pools: poolMapSchema(poolUsageSchema),
  dropped: z.array(z.object({ unitId: z.string(), reason: z.string() })),
  warnings: z.array(z.string()),
});

const journalSchema = z.object({
  entries: z.array(
    z.object({
      n: z.number(),
      actor: z.enum(['enemy', 'army']),
      unitId: z.string(),
      target: categorySchema.optional(),
      damage: z.number(),
      featuresDamage: z.number().optional(),
      hits: z.number(),
    }),
  ),
  rounds: z.number(),
  friendlyHits: z.number(),
  totalDamage: z.number(),
});

const summarySchema = z.object({
  stackCount: z.number(),
  minDamage: z.number(),
  maxDamage: z.number(),
  avgDamage: z.number(),
  damageByPool: poolMapSchema(z.number()),
  recovery: z.object({
    silver: z.number(),
    gold: z.number(),
    dragonCoins: z.number(),
    seconds: z.number(),
  }),
  damagePerSilver: z.number(),
  damagePerGold: z.number(),
  damagePerDragonCoin: z.number(),
  journals: z.object({ enemyFirst: journalSchema, armyFirst: journalSchema }),
  modelNotes: z.array(z.string()),
});

export const storedResultSchema = z.object({
  /** Bumped when the cached shape changes; an older cache is dropped rather than migrated. */
  v: z.literal(1),
  at: z.int().min(0),
  profileId: z.string().min(1),
  setupId: z.string().min(1),
  result: resultSchema,
  summary: summarySchema,
  counts: z.record(z.string(), z.number()),
});

export interface StoredResult {
  v: 1;
  at: number;
  profileId: string;
  setupId: string;
  result: StackResult;
  summary: BattleSummary;
  counts: Record<string, number>;
}

/** Storage is guarded everywhere: a private window or a blocked cookie policy throws on first access. */
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The cached result, or `null` when there is none, it is unreadable, or it no longer matches the shape. */
export function readStoredResult(): StoredResult | null {
  let raw: string | null;
  try {
    raw = storage()?.getItem(LAST_RESULT_KEY) ?? null;
  } catch {
    return null;
  }
  if (raw === null) return null;
  try {
    const parsed = storedResultSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      writeStoredResult(null);
      return null;
    }
    // zod widens optional keys to `| undefined`, which `exactOptionalPropertyTypes` rejects; the shape
    // itself has just been validated, so the engine types are taken on trust here and nowhere else.
    return parsed.data as StoredResult;
  } catch {
    writeStoredResult(null);
    return null;
  }
}

/** Write the cache, or clear it with `null`. Never throws: losing the cache is not an error. */
export function writeStoredResult(value: StoredResult | null): void {
  try {
    const store = storage();
    if (!store) return;
    if (value === null) store.removeItem(LAST_RESULT_KEY);
    else store.setItem(LAST_RESULT_KEY, JSON.stringify(value));
  } catch {
    /* a full or disabled storage must not break the calculator */
  }
}

/**
 * Keep the cache in step with the store. Returns the unsubscribe function; the Results section starts it
 * once it has restored whatever was there.
 */
export function initResultPersistence(): () => void {
  return useResultStore.subscribe((state, previous) => {
    if (state.last === previous.last && state.manualCounts === previous.manualCounts) return;
    const snapshot = state.last;
    if (snapshot === null) {
      writeStoredResult(null);
      return;
    }
    writeStoredResult({
      v: 1,
      at: snapshot.at,
      profileId: snapshot.profileId,
      setupId: snapshot.setupId,
      result: snapshot.result,
      summary: snapshot.summary,
      counts: state.manualCounts,
    });
  });
}
