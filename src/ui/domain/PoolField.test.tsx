// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { PoolField } from './PoolField';

afterEach(cleanup);

test('the pool is named and its pair of numbers is shown', () => {
  render(<PoolField pool="leadership" used={84300} total={84300} />);

  expect(screen.getByText('Leadership')).toBeTruthy();
  expect(screen.getByText('84,300 / 84,300')).toBeTruthy();
});

test('the usage bar is a meter carrying used, total and the spoken pair', () => {
  render(<PoolField pool="dominance" used={120} total={480} />);

  const meter = screen.getByRole('meter', { name: 'Dominance used' });
  expect(meter.getAttribute('aria-valuenow')).toBe('120');
  expect(meter.getAttribute('aria-valuemin')).toBe('0');
  expect(meter.getAttribute('aria-valuemax')).toBe('480');
  expect(meter.getAttribute('aria-valuetext')).toBe('120 / 480');
});

test('an empty pool does not divide by zero', () => {
  render(<PoolField pool="authority" used={0} total={0} />);

  expect(screen.getByRole('meter', { name: 'Authority used' }).getAttribute('aria-valuenow')).toBe('0');
});
