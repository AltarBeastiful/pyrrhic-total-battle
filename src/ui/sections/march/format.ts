/**
 * How the March writes a figure. Everything here is a game figure, so the rules are the game's:
 * whole numbers grouped in threes, ratios with two decimals while they are small, durations written
 * the way a training queue writes them ("5d 23h").
 *
 * The grouping itself is `domain`'s and not a second opinion: the number fields put a space every
 * three digits (`thousandSeparator: ' '` in the theme), so every read-only figure beside them has to
 * do the same — a comma here and a space there reads as two different numbers.
 */
import { count } from '@/ui/domain';

/** A whole number: unit counts, damage, silver, gold, dragon coins. */
export function amount(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return count(Math.round(value));
}

const COMPACT_WHOLE = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 0 });
const COMPACT_TENTH = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * The same figure with the digits a glance needs: "1.7M", "890K". Only for places where the line
 * has to stay short — the phone bar's quick summary — never where a number is read off and typed
 * into the game.
 */
export function compact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return COMPACT_TENTH.format(Math.round(value));
}

/**
 * The shortest compact figure that still says something: **two digits at least, and no more than the
 * magnitude needs** — "325K", "12K", "1.2M".
 *
 * The rule is the owner's, for the recap's damage a hired unit (2026-09-20: *"simplify … with only 325k,
 * no commas needed there. Only for 1.2m you need comma so at least you get 2 numbers"*), and the reason it
 * is not simply `compact` is the reason `ratio` carries decimals (S-59): a figure a player *compares*
 * against the last run has to be printed to where two runs differ. "432K" differs from "418K"; "1M" does
 * not differ from "1M", so a million-sized ratio is the one place the decimal has to be spent.
 */
export function compactTwo(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const whole = COMPACT_WHOLE.format(Math.round(value));
  const digits = whole.replace(/\D/gu, '').length;
  return digits >= 2 ? whole : COMPACT_TENTH.format(Math.round(value));
}

/**
 * A ratio such as damage per silver: two decimals while it is small, whole numbers above 100.
 *
 * `decimals` is there for one reason, and it is a measured one (S-59 review, 2026-09-16): on the plan's
 * trade the column named "Per silver" printed **0.54 on all three rows** — the plans differ in the third
 * decimal (0.536, 0.535, 0.534), so a column that decides a row's *name* was rounding the decision away
 * and the row called "Best for silver" read exactly like the two under it. A figure a player chooses by
 * has to be printed to where it differs.
 */
export function ratio(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  return Math.abs(value) >= 100 ? amount(value) : value.toFixed(decimals);
}

/**
 * **A ratio that is also a headline figure**: `ratio`'s decimals while the figure is small, `compactTwo`'s
 * three digits once it is not.
 *
 * The figure this exists for is the damage a hired unit — a hired stack's own damage over the hired units
 * it burns for good (`PlanRepeat.hiredDamage` over `mercLost`) — which is a ratio at one end of its range
 * and a six-figure number on a real account: a hired stack with a million points behind it strikes for
 * **325 000** a unit, and the plan's tables printed all six of those digits. The owner read them there on
 * 2026-09-28 (*"simplify the plan table display of merc damage: use 3 digits at most … like nnnK or nnnM
 * or n.nnM"*), which is the rule he had already set for the recap's line about this same figure ("only
 * 325k, no commas needed there", `compactTwo`) — so the plan's tables and the recap's line agree at the
 * magnitudes this figure lives at, which is where the owner met both (design rule 5).
 *
 * **Under 100 the decimals stay**, and for `ratio`'s own reason (S-59): this column is read by comparing a
 * row against the row above it, and three plans at 2.91 · 2.37 · 2.96 have to stay three different figures.
 * Above 100 the magnitude is what tells them apart, and the fourth, fifth and sixth digits say nothing a
 * glance can use — the notation is what a reader sees.
 */
export function compactRatio(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  return Math.abs(value) >= 100 ? compactTwo(value) : ratio(value, decimals);
}

/** A percentage as entered (5 → "5%", 2.5 → "2.5%"). */
export function percent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${Number.isInteger(value) ? String(value) : value.toFixed(1)}%`;
}

/** "5d 23h", "21h 40m", "12m" — the way the game writes a training queue. */
export function duration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total === 0) return '—';
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  if (days > 0) return `${String(days)}d ${String(hours)}h`;
  if (hours > 0) return `${String(hours)}h ${String(minutes)}m`;
  if (minutes > 0) return `${String(minutes)}m`;
  return `${String(total)}s`;
}

/**
 * A percent **change**, with the sign a reader needs to know which way it went: "+2.4%", "-18.2%", "0%".
 *
 * `percent` above writes a figure as entered — a bonus of 5 is "5%" and nothing is being compared. This one
 * is for a figure that is a difference, where the sign carries as much as the number: the put-back line in
 * the plan's fold says a march gained 2.4 % of damage and gave back 18.2 % of its silver, and "18.2%" on its
 * own would read as a rise. Rounded to the tenth it is printed at, so a change of 0.04 % says "0%" rather
 * than claiming a direction it does not have.
 */
export function signedPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return '0%';
  return `${rounded > 0 ? '+' : '-'}${percent(Math.abs(rounded))}`;
}

/**
 * **What one type's bonuses come to, in the two words the unit sheet and the corner mark use** (owner,
 * 2026-09-28: *"on the hover of the information badge opening the troop detail, add a tooltip to read those
 * with text like Health: +xx.x% / Strength: +xx.x%"*).
 *
 * Two lines and not a sentence: they are the two brackets the Bonuses card is filled in, both read off the
 * same march (`healthPercent` and `strengthPercent`, `src/engine/units.ts`), and the sheet's own bars are
 * labelled with those two words (`UnitSheet`). The colon is what makes a *line* of a tooltip read as a
 * figure rather than as a phrase — and it is the shape the owner asked for, kept.
 *
 * `signedPercent` and not `percent`: a bonus of 0 is worth printing as "0%" rather than as "+0%", and every
 * other figure carries the sign a reader needs to know which way it went (design rule 5 — one figure, one
 * shape, wherever the screen prints it).
 */
export function bonusLines(health: number, strength: number): [string, string] {
  return [`Health: ${signedPercent(health)}`, `Strength: ${signedPercent(strength)}`];
}

/** A difference against the generated result: "+240", "-1 150", "0". */
export function delta(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value);
  if (rounded === 0) return '0';
  return `${rounded > 0 ? '+' : '-'}${amount(Math.abs(rounded))}`;
}

/**
 * `damage / resource`, with a resource of zero reading as "—" rather than as infinity: `ratio` prints any
 * non-finite value that way, and a march that burns no hired unit has no damage a hired unit rather than an
 * infinite one. Shared by the plan's trade and the Details fold's damage split, which print the same ratio.
 */
export function per(damage: number, resource: number): number {
  return resource > 0 ? damage / resource : Number.NaN;
}
