/**
 * `format.ts`, where a figure is turned into the words a player reads.
 *
 * Three helpers are here, and each for the same reason: the **shape** of what they print is the thing that was
 * asked for, not a detail of it. `signedPercent`'s sign carries meaning rather than decoration — the plan's
 * put-back line says a march gained damage and gave silver back, and a reader who meets "18.2%" where
 * "-18.2%" was meant reads a rise for a saving. `compactTwo`'s digit count is the owner's own rule, and
 * `compactRatio`'s threshold is the one decision inside it — where a rate stops being comparable digit by
 * digit and starts being a figure to take in. The rest of the file is exercised through the screens that draw
 * it (`march.test.tsx`, `PlanPanel.test.tsx`), which is where a format is worth holding.
 */
import { expect, test } from 'vitest';

import { bonusLines, compact, compactRatio, compactTwo, signedPercent } from './format';

test('signedPercent wears its sign, rounds to the tenth it prints, and claims no direction at zero', () => {
  // A gain and a loss, at the one decimal `percent` gives a fractional figure.
  expect(signedPercent(2.4)).toBe('+2.4%');
  expect(signedPercent(-18.2)).toBe('-18.2%');
  // A whole number prints whole, as `percent` writes a bonus as entered.
  expect(signedPercent(38)).toBe('+38%');
  expect(signedPercent(-3)).toBe('-3%');
  // Rounded to the tenth it is printed at, so a figure that reads "0%" never wears a sign it cannot show:
  // a put-back that moved the queue by four hundredths of a percent did not move it.
  expect(signedPercent(0)).toBe('0%');
  expect(signedPercent(0.04)).toBe('0%');
  expect(signedPercent(-0.04)).toBe('0%');
  expect(signedPercent(0.06)).toBe('+0.1%');
  expect(signedPercent(-0.06)).toBe('-0.1%');
  // The same guard every figure in this file has: nothing to divide by prints as an em dash, not as NaN.
  expect(signedPercent(Number.NaN)).toBe('—');
  expect(signedPercent(Number.POSITIVE_INFINITY)).toBe('—');
});

test('a unit’s two brackets read as two lines, and a type no bonus touches reads zero', () => {
  // The tooltip and the unit sheet both say them, in this order — health first, the way the Bonuses card
  // is filled in and the way the sheet's own bars stand (`bonusLines`, `UnitSheet`).
  expect(bonusLines(43.5, 12)).toEqual(['Health: +43.5%', 'Strength: +12%']);
  // A type nothing in the account reaches is a real answer and not a missing figure: "0%" says the
  // bonuses do not touch it, where a dash would leave the reader wondering whether it was measured.
  expect(bonusLines(0, 0)).toEqual(['Health: 0%', 'Strength: 0%']);
  // And the same guard as everything else here: a bonus that was never computed is not a bonus of nought.
  expect(bonusLines(Number.NaN, 5)).toEqual(['Health: —', 'Strength: +5%']);
});

test('compactTwo spends a decimal only where it buys a second digit', () => {
  // The owner's own examples (2026-09-20): "only 325k, no commas needed there. Only for 1.2m you need
  // comma so at least you get 2 numbers".
  expect(compactTwo(325_000)).toBe('325K');
  expect(compactTwo(1_230_000)).toBe('1.2M');
  // Three digits and two digits both say enough on their own; one does not.
  expect(compactTwo(431_781)).toBe('432K');
  expect(compactTwo(12_400)).toBe('12K');
  expect(compactTwo(9_400)).toBe('9.4K');
  expect(compactTwo(940)).toBe('940');
  expect(compactTwo(94)).toBe('94');
  // Small enough to need no notation at all, and it gets none.
  expect(compactTwo(7)).toBe('7');
  // `compact` is untouched: the phone bar's summary keeps its tenth, whatever the magnitude.
  expect(compact(325_000)).toBe('325K');
  expect(compact(1_230_000)).toBe('1.2M');
  expect(compact(431_781)).toBe('431.8K');
  // Nothing to divide by prints as an em dash, as everywhere else in the file.
  expect(compactTwo(Number.NaN)).toBe('—');
  expect(compactTwo(Number.POSITIVE_INFINITY)).toBe('—');

  // **The decimal budget is the caller's** (owner, 2026-09-29: "lets add a parameter that is max decimal
  // number allowed and set it to 2 where text can be large and 1 where text needs to be small. Still the
  // same rounding as before"). Two decimals, on a figure whose first decimal left it one digit short.
  expect(compactTwo(8_338_153, 2)).toBe('8.34M');
  expect(compactTwo(7_732_100, 2)).toBe('7.73M');
  expect(compactTwo(1_240_000, 2)).toBe('1.24M');
  // And the rule is a *budget*, not a demand: where the whole-decimal form already reached two digits the
  // second decimal is not spent, because the digits it would buy are digits the magnitude does not need.
  expect(compactTwo(325_000, 2)).toBe('325K');
  expect(compactTwo(12_345_678, 2)).toBe('12M');
  // A budget of one is the default the file shipped with, so a caller who asks for it by hand gets the
  // same string as the caller who says nothing — there is no second path through this function.
  expect(compactTwo(8_338_153, 1)).toBe('8.3M');
  expect(compactTwo(8_338_153, 1)).toBe(compactTwo(8_338_153));
  expect(compactTwo(94, 2)).toBe('94');

  // **The budget is floored into a whole count, and a non-finite one reads as the default**: it is a cache
  // key as well as a rounding, so 2.5 must not seed a key nothing else looks up. Pinned here as
  // implemented — `NaN` and the infinities take the default of one, and a negative clamps to nought
  // (whole digits only), which is the guard written beside the parameter.
  expect(compactTwo(9_400, 2.5)).toBe('9.4K');
  expect(compactTwo(9_400, Number.NaN)).toBe(compactTwo(9_400));
  expect(compactTwo(9_400, Number.POSITIVE_INFINITY)).toBe(compactTwo(9_400));
  expect(compactTwo(9_400, -2)).toBe('9K');
  // The guard is the parameter's and not the figure's: a budget the parameter pushed down to nought still
  // answers the digit rule first, so a three-digit whole form is untouched by it.
  expect(compactTwo(325_000, -2)).toBe('325K');
});

test('compactRatio is a ratio below a hundred and a compact figure above it', () => {
  // **Above the threshold the digits the owner asked to be rid of** (2026-09-28): a hired unit striking
  // for 325 000 is "325K" in the plan's tables and on the recap's line about the same figure.
  expect(compactRatio(325_000)).toBe('325K');
  expect(compactRatio(1_230_000)).toBe('1.2M');
  expect(compactRatio(137_000)).toBe('137K');
  expect(compactRatio(99_999)).toBe('100K');
  // **At the threshold and under it, `ratio` itself**: a figure a player chooses a row by is printed to
  // where two rows differ (S-59) — three plans at 2.91 · 2.37 · 2.96 are three rows.
  expect(compactRatio(2.91)).toBe('2.91');
  expect(compactRatio(94.25)).toBe('94.25');
  expect(compactRatio(99.99)).toBe('99.99');
  expect(compactRatio(100)).toBe('100');
  // And the decimals are the caller's, the way they are `ratio`'s: the trade's per silver column asks
  // for three.
  expect(compactRatio(2.9104, 3)).toBe('2.910');
  // Nothing to divide by prints as an em dash, as everywhere else in the file.
  expect(compactRatio(Number.NaN)).toBe('—');
  expect(compactRatio(Number.POSITIVE_INFINITY)).toBe('—');
});
