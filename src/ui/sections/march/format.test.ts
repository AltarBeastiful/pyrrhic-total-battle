/**
 * `format.ts`, where a figure is turned into the words a player reads.
 *
 * Two helpers are here, and each for the same reason: the **shape** of what they print is the thing that was
 * asked for, not a detail of it. `signedPercent`'s sign carries meaning rather than decoration — the plan's
 * put-back line says a march gained damage and gave silver back, and a reader who meets "18.2%" where
 * "-18.2%" was meant reads a rise for a saving. `compactTwo`'s digit count is the owner's own rule. The rest
 * of the file is exercised through the screens that draw it (`march.test.tsx`, `PlanPanel.test.tsx`), which
 * is where a format is worth holding.
 */
import { expect, test } from 'vitest';

import { compact, compactTwo, signedPercent } from './format';

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
});
