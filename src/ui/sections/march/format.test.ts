/**
 * `format.ts`, where a figure is turned into the words a player reads.
 *
 * Only `signedPercent` is here, and only because it is the one helper whose **sign** carries meaning rather
 * than decoration: the plan's put-back line says a march gained damage and gave silver back, and a reader who
 * meets "18.2%" where "-18.2%" was meant reads a rise for a saving. The rest of the file is exercised through
 * the screens that draw it (`march.test.tsx`, `PlanPanel.test.tsx`), which is where a format is worth holding.
 */
import { expect, test } from 'vitest';

import { signedPercent } from './format';

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
