/**
 * The four answers the plan's bar offers, in our words (S-59; `docs/design.md` §7, design rule 26).
 *
 * The engine states **which** answer a row is (`PlanRow.pick`, `src/engine/plan.ts`); naming it is the
 * UI's, and it is named once. The bar's tip, the trade's rows, their accessible names and the tests that
 * hold them all read this map, so a row cannot be called two things on one screen — which is what the
 * owner was looking at when he asked for "better names": four stops each wearing a *shape sentence*
 * (`3 stacks · 205 hired · 2.3M silver a march`), two of them one row apart and reading as a typo.
 *
 * `PlanRow.label` still carries that sentence and **is no longer drawn anywhere**. It is kept in the
 * payload because a dozen recorded experiments (`tools/theorycraft/63`…`86`) quote it as a row's identity
 * in their committed reports; a field the record reads is not the UI's to delete.
 */
import type { PlanPick } from '@/engine/plan';

export const PICK_WORD: Record<PlanPick, string> = {
  'best-for-silver': 'Best for silver',
  'spare-the-stock': 'Spare the stock',
  'sweet-spot': 'Sweet spot',
  'most-damage': 'Most damage',
};
