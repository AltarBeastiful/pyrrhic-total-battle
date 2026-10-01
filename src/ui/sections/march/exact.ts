/**
 * **The exhaustive raise, as the March asks for it** (S-143b): which pools a search walks, and the shape of
 * the question and the answer that cross to the worker (`src/worker/protocol.ts`, the `raise` job).
 *
 * The search itself is the kernel's (`src/kernel/raise.ts`, behind `raiseKernel()`): `Best v2`, `Safe` and
 * `Tight` walk a box of up to a million count vectors — every hired stack from the plan's own count up to
 * `min(shelter ceiling, owned stock)`, every vector paid for by the whole pool's housing and scored by the
 * march's worst opening — seeded with the climb `raisedCounts` answers, so it can only ever improve on what
 * the March draws while it runs. The TypeScript search this file used to hold was retired with the rest of
 * the TS engine path (the owner, 2026-10-01: *"retire the ts version"*; W16 E3 S5b); experiments 180–183
 * were measured on it and keep a research copy in `tools/theorycraft/exact-raise.ts`.
 *
 * **Which pools it walks** (owner, 2026-09-29: *"give another options for both"*): every raised pool whose
 * own control stands on an exhaustive position, and no other. With both on one — which is what pressing a
 * segment does — it is **one search over the mercenaries and the monsters together**. A pool standing on
 * another position is **held at that position's counts** while the others are walked, so a mixed control
 * answers the question it looks like it is asking.
 */
import type { StackRequest, StackResult } from '@/engine/types';

import { RAISED_POOLS, isExhaustive } from './raise';
import type { RaiseModes, RaisedPool } from './raise';

/** What the search needs to reproduce the march it was asked about — the pane's own snapshot, in full. */
export interface ExactRaiseInput {
  request: StackRequest;
  base: StackResult;
  modes: RaiseModes;
}

/** The exhaustive answer, in the app's own shape: a count per type, and how it was found. */
export interface ExactRaiseAnswer {
  /**
   * **A count for every type the march's request carries, moved or not** — the kernel answers dense. The
   * distinction is not cosmetic: the March merges this over the climb's answer (`{...raised, ...counts}`),
   * and a sparse record diffed against the *plan's* counts would silently keep the seed's count wherever the
   * search came back **down** to the plan's — a vector the search never scored, possibly below the climb.
   */
  counts: Record<string, number>;
  /** `walked` when the whole box was enumerated, `searched` when the multistart search answered. */
  how: 'walked' | 'searched';
  /** The vectors in the box — how much space the search was allowed, reported rather than hidden. */
  space: number;
  /** How many vectors the search actually scored — what the answer cost, in the only unit that matters. */
  scored: number;
}

/** The pools whose own control stands on an exhaustive position: the stacks this search may move. */
export function exhaustivePools(modes: RaiseModes): RaisedPool[] {
  return RAISED_POOLS.filter((pool) => isExhaustive(modes[pool]));
}
