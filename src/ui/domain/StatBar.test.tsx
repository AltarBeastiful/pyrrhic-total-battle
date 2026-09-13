// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { renderWithTheme } from '../kit/testRender';
import { StatBar } from './StatBar';
import { count } from './format';

afterEach(cleanup);

test('the two bars are named and carry the figure they draw', () => {
  renderWithTheme(<StatBar label="Strength" base={380} boosted={520} format={count} />);

  const base = screen.getByRole('progressbar', { name: 'Strength, base' });
  const boosted = screen.getByRole('progressbar', { name: 'Strength, with bonuses' });
  expect(base.getAttribute('aria-valuetext')).toBe('380');
  expect(boosted.getAttribute('aria-valuetext')).toBe('520');
  expect(screen.getByText('520')).toBeTruthy();
});

test('the bars share one scale, so the gap between them is the bonus', () => {
  renderWithTheme(<StatBar label="Health" base={500} boosted={1000} format={count} />);
  const base = screen.getByRole('progressbar', { name: 'Health, base' });
  const boosted = screen.getByRole('progressbar', { name: 'Health, with bonuses' });
  expect(base.getAttribute('aria-valuemax')).toBe('1000');
  expect(base.getAttribute('aria-valuenow')).toBe('500');
  expect(boosted.getAttribute('aria-valuemax')).toBe('1000');
  expect(boosted.getAttribute('aria-valuenow')).toBe('1000');
});
