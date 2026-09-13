// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { renderWithTheme } from '../kit2/testRender';
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
