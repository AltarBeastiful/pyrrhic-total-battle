/**
 * **A test-only recorder of the plan's re-typing pipeline** (W14 step 1, experiment 176,
 * `tools/theorycraft/176-where-death-orders-are-lost.test.ts`).
 *
 * Off by default: `planTrace.sink` is `null` and every call site in `planCampaign` is `planTrace.sink?.(…)`,
 * which reads one property and does nothing else. An experiment sets a sink, plans, and reads back what each
 * step of the re-typing pass (`retypeOne`, `retypeRowNow`, `foldFinale`, `keepReadings`, the hand-backs,
 * S-94, the fold, the own-ladder finale) did to which march. The sink only receives copies of what the engine
 * already computed; it never feeds anything back, so no output can depend on it
 * (`tests/kernel/plan-equivalence.test.ts` and `tests/engine/plan.test.ts` hold that).
 */
export type PlanTraceEvent =
  | {
      step: 'retypeOne';
      counts: Record<string, number>;
      /** What `retypeMarch` returned, before the plan's own guards (null: nothing rated above 0). */
      found: Record<string, number> | null;
      rating: number;
      /** `retypeMarch` reported its deadline cut the search. */
      cut: boolean;
      /** The pass's own clock had run out before the search was asked (`retypeDeadline`). */
      deadline: boolean;
      /** Which of `retypeOne`'s guards refused `found`, if one did. */
      refused: 'hired' | 'shelter' | null;
      out: Record<string, number>;
    }
  | {
      step: 'retypeRowNow';
      pick: string | undefined;
      marches: Record<string, number>[];
      /** Marches whose re-typing moved (times > 0). */
      changed: number;
      /** The row-level silver-saver guard handed the whole row back. */
      silverSaverGuard: boolean;
    }
  | { step: 'foldFinale'; pick: string | undefined; folded: boolean }
  | { step: 'keepReadings'; pick: string | undefined; reading: number; handedBack: boolean }
  | { step: 'foldHandBack'; pick: string | undefined }
  | { step: 'collisionHandBack'; pick: string | undefined }
  | { step: 'allInS94'; outcome: 'kept' | 'rebuilt' | 'dropped' }
  | { step: 'allInDescending'; outcome: 'kept' | 'dropped' }
  | { step: 'fold'; before: (string | undefined)[]; after: (string | undefined)[]; band: (string | undefined)[] }
  | {
      step: 'foldBandRetype';
      pick: string | undefined;
      taken: boolean;
      named: boolean;
      single: boolean;
      ordered: boolean;
    }
  | { step: 'ownLadderFinale'; pick: string | undefined; counts: Record<string, number> }
  | { step: 'pass'; phase: 'begin' | 'end' };

export const planTrace: { sink: ((event: PlanTraceEvent) => void) | null } = { sink: null };
