// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { renderWithTheme } from '../kit/testRender';
import { PoolGauge } from './PoolGauge';

afterEach(cleanup);

test('the pool reads "used of total" and the bar says the same thing', () => {
  renderWithTheme(<PoolGauge pool="leadership" used={84300} total={84300} />);
  expect(screen.getByText('84 300 of 84 300')).toBeTruthy();
  const bar = screen.getByRole('progressbar', { name: 'Leadership used' });
  expect(bar.getAttribute('aria-valuetext')).toBe('84 300 of 84 300');
  expect(bar.getAttribute('aria-valuenow')).toBe('84300');
});

test('an empty pool is a bar at zero, not a crash', () => {
  renderWithTheme(<PoolGauge pool="dominance" used={0} total={0} />);
  expect(screen.getByRole('progressbar', { name: 'Dominance used' }).getAttribute('aria-valuenow')).toBe('0');
});
