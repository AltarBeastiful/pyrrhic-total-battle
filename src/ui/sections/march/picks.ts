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

import { amount } from './format';

export const PICK_WORD: Record<PlanPick, string> = {
  'best-for-silver': 'Best for silver',
  'spare-the-stock': 'Spare the stock',
  'sweet-spot': 'Sweet spot',
  'most-damage': 'Most damage',
  // A burn-axis filler (`CampaignInput.barAxis: 'burn'`): it has no answer of its own to be named after, so
  // `planWords` names it by its own burn and this is only the fallback for a row with no figures.
  step: 'Step',
};

/** Everything naming a row needs: which answer it is, and what the march it stands for burns. */
type NamedRow = Pick<PlanRow, 'pick' | 'repeat'>;

/**
 * **A row's words, wherever they are written** (review of 2026-09-16, design rule 5: one name per thing).
 *
 * The four named answers are the map above. A `step` — the filler the burn axis puts between two named
 * stops (`CampaignInput.barAxis: 'burn'`) — answers no question of its own, so "Step" names nothing a
 * player can choose by; it is named by **what it burns**, in the trade's own words ("15 hired lost", the
 * same words as the column head it is read off). The burn is the axis the bar runs along on that axis, so
 * the name is also the row's position on it.
 *
 * Every reader goes through here — the tip, the thumb's value text, the trade's row heads, its bars'
 * accessible names — so a stop cannot be called one thing on the bar and another in the table below it.
 */
export function planWords(row: NamedRow): string {
  return row.pick === 'step' ? `${amount(row.repeat.mercLost)} hired lost` : PICK_WORD[row.pick];
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
 * They are the axis's own name and not decoration: on `'burn'` — the app's axis since 2026-09-17
 * (`CAMPAIGN.planBar.axis`) — the stops run along the hired units a march burns for good (thriftiest
 * first), and calling those ends "Least silver … Most silver" would name the one resource the bar is *not*
 * ordered by. The words match the trade's "Hired lost" head for the same reason `planWords` names a step
 * that way (rule 5). The silver pair stays for the comparison axis, which is still selectable.
 */
export const AXIS_ENDS: Record<'silver' | 'burn', { low: string; high: string }> = {
  silver: { low: 'Least silver', high: 'Most silver' },
  burn: { low: 'Fewest hired lost', high: 'Most hired lost' },
};
