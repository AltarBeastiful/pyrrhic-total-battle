/**
 * What a row of the plan's bar is **called**, in our words (S-59; `docs/design.md` §7, design rule 26).
 *
 * The engine states **which** answer a row is (`PlanRow.pick`, `src/engine/plan.ts`); naming it is the
 * UI's, and it is named once. The bar's tip, the trade's rows, their accessible names and the tests that
 * hold them all read `planWords` below, so a row cannot be called two things on one screen — which is what
 * the owner was looking at when he asked for "better names": five stops each wearing a *shape sentence*
 * (`3 stacks · 205 hired · 2.3M silver a march`), two of them one row apart and reading as a typo.
 *
 * `PlanRow.label` still carries that sentence and **is no longer drawn anywhere**. It is kept in the
 * payload because a dozen recorded experiments (`tools/theorycraft/63`…`86`) quote it as a row's identity
 * in their committed reports; a field the record reads is not the UI's to delete.
 */
import { unitById } from '@/data';
import type { PlanPick, PlanRow } from '@/engine/plan';

import { signedPercent } from './format';

/**
 * The five answers the bar carries (`PlanPick`), each with the one name it wears — in the owner's own words
 * of 2026-09-18, and in the bar's own order, thriftiest first. Private: `planWords` below is the single
 * place a row is named, so nothing can index this map a second way.
 *
 * **"Silver saver" and not "Least silver"**, **"Steady max" and not "Most mercs"** (owner, 2026-09-18, with
 * the fifth stop): the thrifty end is a march that spends *less* silver rather than the least of anything —
 * the superlative was read as the cheapest march the app could think of — and the top of the ladder is now
 * the most mercenaries the troops shelter **every** march, which `all-in` beats on the first march alone. Two
 * stops that both claimed "most" would read as the same answer twice.
 */
const PICK_WORD: Record<PlanPick, string> = {
  'silver-saver': 'Silver saver',
  'sweet-spot': 'Sweet spot',
  'more-mercs': 'More mercs',
  'steady-max': 'Steady max',
  'all-in': 'All in',
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
 * silver" stop that is the top of the ladder to 0.2 % is *"inefficient and causes frustration"*).
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
 * the bar is *not* ordered by — a *stop* may be called "Silver saver" (it is the thriftiest efficient rung)
 * and the dear end "All in", but an axis named after either would claim the whole bar is sorted by silver,
 * or that its far end is the only plan spending the stock. The words match the trade's "Hired lost" head for
 * the same reason (rule 5).
 *
 * **Two pairs, because there are two kinds of army** (S-112). It was one pair; an army that hires nothing
 * has no stock to order along, and since S-111 it has a bar all the same — ordered on the silver its stops
 * really differ by. Naming those ends after a stock the account does not hold was the plainest of the
 * hired-word defects the S-111 review found on that bar. The pair is chosen by `spendsStock` below, which is
 * the one place this app asks whether a plan trades a stock at all.
 */
export const BAR_ENDS = { low: 'Fewest hired lost', high: 'Most hired lost' } as const;

/** The same two words for a bar with no stock on it: what its stops really run from and to. */
export const SILVER_BAR_ENDS = { low: 'Least silver', high: 'Most damage' } as const;

/**
 * **Does this bar trade a hired stock at all?** — the one reading the whole plan block turns on (S-112).
 *
 * `mercLost` is the units a campaign never gets back, and it is zero on every stop of an army that hires
 * nothing (`planTroopsOnly`, S-111). Asked of the **bar** rather than of the stop on screen: a hired army
 * whose thrifty stop happens to burn nothing is still trading a stock, and its columns, its axis and its
 * thesis are all about that trade.
 *
 * Every hired word in the block reads this — the bar's ends, the trade's two columns, the recap's row, the
 * thesis, the campaign line, the curve's column — so an army either sees all of them or none, and no screen
 * can say "0.0 of the hired stock" about a stock that does not exist.
 */
export function spendsStock(rows: readonly { mercLost: number }[]): boolean {
  return rows.some((row) => row.mercLost > 0);
}

/** The words under the bar, for the resource its stops are actually ordered by. */
export function barEnds(spendsHired: boolean): { low: string; high: string } {
  return spendsHired ? BAR_ENDS : SILVER_BAR_ENDS;
}

/**
 * Whether a march of the sequence fields any hired unit. A count whose id the tables do not carry is a
 * **custom mercenary** — the one kind of unit the player describes by hand, and always of the authority pool
 * (`buildUnits`, `src/state/derive.ts`) — so an unknown id counts as hired rather than as a troop.
 */
const fieldsHired = (counts: Record<string, number>): boolean =>
  Object.entries(counts).some(([id, count]) => count > 0 && unitById(id)?.pool !== 'leadership');

/**
 * **How a stop is fought, when "N marches of the row above" would not be true of it** — or `null` when it
 * would, and the caller writes that plain count itself.
 *
 * Every other plan on the bar is one march repeated and a last one to spend what is left, so "a march" names
 * the whole campaign and the figures beside it are that march's. `all-in` is not: it fields every mercenary
 * the troops can shelter on the first march and then marches on whatever the stock has left, so its marches
 * **differ** and the engine hands them over whole (`PlanTotals.sequence`, `src/engine/plan.ts`). A row that
 * said "4 marches" and nothing else would be read as four of the march drawn above it, which is the one thing
 * this plan is not.
 *
 * One sentence, in one place (design rule 5): the fold's own summary line and the bar's tip both read it, so
 * the stop cannot describe itself one way over the bar and another over the March.
 *
 * **And it says where the mercenaries run out** (2026-09-19). The stop plays the whole horizon now: when the
 * stock is spent before the last march, the marches left over are the sizer's own, troops and no hired stack
 * at all (`src/engine/plan.ts`, the all-in's tail). A reader told only "four marches, each on what the last
 * one left" would take the fourth for another march of mercenaries — the figures beside it are the first
 * march's — so the tail is counted in the same line rather than left to the counts table to reveal.
 *
 * **Every stop says it now** (S-89, 2026-09-18). A *repeated* stop whose stock the horizon outruns plays the
 * marches left over on troops alone as well (`PlanTotals.tail`), and it is the same fact about the same
 * campaign — so it is said in the same place and in the same words rather than in a second sentence of the
 * fold's own. Such a row keeps its plain count for the marches it fields hired units on, because those *are*
 * the march drawn above it, and adds the tail to it: "2 marches, then 2 on troops alone". On bear ×1 that is
 * the difference between a stop reading "1 march" and a stop reading four, three of them troops alone
 * (`tools/theorycraft/out/105-six-proposals.md` §P1).
 */
export function sequenceWords(
  row: Pick<PlanRow, 'sequence' | 'tail'> & Partial<Pick<PlanRow, 'marches' | 'finaleCounts'>>,
): string | null {
  const sequence = row.sequence ?? [];
  const marches = sequence.length;
  if (marches > 0) {
    const words = `${String(marches)} march${marches === 1 ? '' : 'es'}, each on what the last one left`;
    let tail = 0;
    while (tail < marches && !fieldsHired(sequence[marches - 1 - tail] ?? {})) tail += 1;
    if (tail === 0 || tail === marches) return words;
    return `${words}, the last ${tail === 1 ? '' : `${String(tail)} `}on troops alone`;
  }
  // A repeated stop with a tail: the marches it fields hired units on, counted the way the fold counts them
  // when there is no tail at all, and then the troops-only ones.
  const tail = row.tail;
  if (!tail || tail.marches < 1) return null;
  const played = Math.max(0, (row.marches ?? 0) - tail.marches - (row.finaleCounts ? 1 : 0));
  return (
    `${String(played)} march${played === 1 ? '' : 'es'}${row.finaleCounts ? ' + a last one' : ''}, ` +
    `then ${String(tail.marches)} on troops alone`
  );
}

/**
 * **The troop type the plan put back into this march, and what it bought** — or `null` for a stop the pass
 * left alone (owner, 2026-09-18: *"add a pass to consider again lower level troops if the cost for them
 * (silver, silver/damage, total damage) is not too high and we get a nice reduction in training time"*).
 *
 * The engine records the three changes saving-positive, because that is how it scores them
 * (`PlanRow.putBack`); a reader meets them as **changes to the march**, so the silver and the queue are
 * flipped and every one of the three wears its sign: a march that gained damage and gave back silver reads
 * "+2.4% damage, -18.2% silver, -38.3% to recover". The last two are the trade table's own two figures, in its
 * own order — damage, silver, the queue under the silver — so the line explains the row rather than
 * introducing a fourth way to read it (design rule 5).
 *
 * **What the three are measured against is said out loud**, because it is not the row beside it on the bar.
 * They compare this march with *the same march sized without the type that went back* — the plan the search
 * generated for this rung — and the pass re-keys the rungs by what they burn, so a stop can carry a rung
 * whose put-back cost it 2 % of damage and still show more damage than the bar did before the pass. Without
 * the clause a reader would take the percentages for a change to the stop they are looking at, which is the
 * one thing they are not (design rule 5: a figure says what it is a figure of).
 *
 * One sentence in one place, like every other row's words here: the fold draws it, and the tests read it from
 * this function rather than retyping it.
 */
export function putBackWords(row: Pick<PlanRow, 'putBack'>): string | null {
  const put = row.putBack;
  if (!put) return null;
  // The unit's **name** and not its pill label: this is a sentence and not a chip, and "SP1 put back" is
  // the short code a table cell wears (design rule 27 — unit details read as sentences).
  const unit = unitById(put.unitId);
  const name = unit?.name ?? unit?.label ?? put.unitId;
  return (
    `${name} put back: ${signedPercent(put.damage)} damage, ${signedPercent(-put.silver)} silver, ` +
    `${signedPercent(-put.seconds)} to recover, against the same march without it.`
  );
}
