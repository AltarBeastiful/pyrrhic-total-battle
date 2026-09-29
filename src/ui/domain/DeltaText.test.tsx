// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { renderWithTheme } from '../kit/testRender';
import { DeltaText } from './DeltaText';
import { count } from './format';

afterEach(cleanup);

test('without a previous run only the figure is drawn', () => {
  renderWithTheme(<DeltaText value={12480} format={count} betterWhen="higher" />);
  expect(screen.getByText('12 480')).toBeTruthy();
});

test('a rise is an improvement when higher is better, and a fall when lower is', () => {
  const { container, rerender } = renderWithTheme(
    <DeltaText value={12480} previous={12000} format={count} betterWhen="higher" />,
  );
  expect(container.textContent).toContain('+4');
  expect(container.textContent).toContain('better');

  rerender(<DeltaText value={12480} previous={12000} format={count} betterWhen="lower" />);
  expect(container.textContent).toContain('worse');
});

test('a fall is written with a real minus sign, never a hyphen', () => {
  const { container } = renderWithTheme(
    <DeltaText value={9000} previous={12000} format={count} betterWhen="higher" />,
  );
  expect(container.textContent).toContain('−');
  expect(container.textContent).toContain('25');
});

/**
 * **The full figure, one hover away** (S-148). The recap prints its figures in the short notation, which is
 * lossy on purpose: 8 338 153 and 8 341 200 both read "8.34M" while the change beside them rounds to "0 %".
 * `exact` is where the digits live, and it changes nothing about the figure that is drawn — the visible text
 * is the caller's own `format`, and the hover carries the grouped one.
 */
test('the exact figure is the value’s title, and never changes what is written', () => {
  renderWithTheme(
    <DeltaText
      value={8_338_153}
      previous={8_341_200}
      // The notation as the recap writes it (three digits at most, `format.ts`), spelled out here so the two
      // figures this test rests on are visible rather than computed by the code under test.
      format={() => '8.34M'}
      betterWhen="higher"
      exact={count(8_338_153)}
    />,
  );
  const value = screen.getByText('8.34M');
  expect(value.getAttribute('title')).toBe('8 338 153');
  // And a three-thousandth-of-a-march fall rounds to a whole "0%" beside it: a figure that moved and a
  // percent that says nothing is the pair the title exists for (S-148), so it is asserted here. The change
  // line is the value's own sibling, not the whole container — Mantine's styles reach that one.
  expect(value.parentElement?.textContent).toMatch(/0\s%\)/u);

  // Without `exact` there is no title at all: a figure the caller did not ask to explain carries none.
  const plain = renderWithTheme(<DeltaText value={12480} format={count} betterWhen="higher" />);
  expect(plain.container.querySelector('[title]')).toBeNull();
});
