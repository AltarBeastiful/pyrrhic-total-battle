/**
 * What a row of the plan's bar is **called**, in our words (S-59; `docs/design.md` §7, design rule 26).
 *
 * The engine states **which** answer a row is (`PlanRow.pick`, `src/engine/plan.ts`); naming it is the
 * UI's, and it is named once. The bar's tip, the trade's rows, their accessible names and the tests that
 * hold them all read `planWords` below, so a row cannot be called two things on one screen — which is what
 * the owner was looking at when he asked for "better names": four stops each wearing a *shape sentence*
 * (`3 stacks · 205 hired · 2.3M silver a march`), two of them one row apart and reading as a typo.
 *
 * `PlanRow.label` still carries that sentence and **is no longer drawn anywhere**. It is kept in the
 * payload because a dozen recorded experiments (`tools/theorycraft/63`…`86`) quote it as a row's identity
 * in their committed reports; a field the record reads is not the UI's to delete.
 */
import type { PlanPick, PlanRow } from '@/engine/plan';

/**
 * The three answers the bar carries (`PlanPick`), each with the one name it wears. Private: `planWords`
 * below is the single place a row is named, so nothing can index this map a second way.
 */
const PICK_WORD: Record<PlanPick, string> = {
  'spare-the-stock': 'Spare the stock',
  'sweet-spot': 'Sweet spot',
  'most-damage': 'Most damage',
};

/**
 * **A row's words, wherever they are written** (review of 2026-09-16, design rule 5: one name per thing).
 *
 * A row is named by **which answer it is** and by nothing else: the `step` filler the bar used to carry
 * between two named stops is gone with the silver axis (review of 2026-09-18), so there is no row left that
 * has to be named after its own figures.
 *
 * Every reader goes through here — the tip, the thumb's value text, the trade's row heads, its bars'
 * accessible names — so a stop cannot be called one thing on the bar and another in the table below it.
 */
export function planWords(row: Pick<PlanRow, 'pick'>): string {
  return PICK_WORD[row.pick];
}

/** The words for the two efficiencies, keyed the way `PlanRow.bestFor` is. */
const BEST_FOR_WORD = { silver: 'best a silver', hired: 'best a hired' } as const;

/**
 * **The two efficiencies, in the words the stop that has one wears** (owner, 2026-09-17: the bar is *"about
 * balancing between burning silver efficiently… and burning mercs efficiently"*, and a separate "Best for
 * silver" stop that is the "Most damage" stop to 0.2 % is *"inefficient and causes frustration"*).
 *
 * `null` when the stop is neither. Of the stops the bar carries exactly one is the best damage a silver and
 * exactly one the best damage a hired unit (`PlanRow.bestFor`, `src/engine/plan.ts`), and nothing stops the
 * same stop being both — so the two words join rather than stacking into a second line.
 *
 * The words are the trade's own column heads, "Per silver" and "Per hired", said the short way (design rule
 * 5: one name per thing). A note under a row's name, the row's accessible name and the bar's tip all read
 * this one function, so a stop cannot claim an efficiency in one place and a different one in another.
 */
export function bestForWords(row: Pick<PlanRow, 'bestFor'>): string | null {
  if (row.bestFor.silver && row.bestFor.hired) return 'best a silver and a hired';
  if (row.bestFor.silver) return BEST_FOR_WORD.silver;
  if (row.bestFor.hired) return BEST_FOR_WORD.hired;
  return null;
}

/**
 * The two words under the bar, naming its ends — the resource `CampaignPlan.alternatives` is sorted along.
 *
 * They are the axis's own name and not decoration: the stops run along the hired units a march burns for
 * good (thriftiest first), and calling those ends "Least silver … Most silver" would name the one resource
 * the bar is *not* ordered by. The words match the trade's "Hired lost" head for the same reason (rule 5).
 *
 * **One pair, because there is one bar** (review of 2026-09-18). It was a record keyed by an axis the
 * payload carried; the silver ordering it was the other half of was retired with `CampaignPlan.barAxis`,
 * and a map of one entry is a choice nobody makes.
 */
export const BAR_ENDS = { low: 'Fewest hired lost', high: 'Most hired lost' } as const;
