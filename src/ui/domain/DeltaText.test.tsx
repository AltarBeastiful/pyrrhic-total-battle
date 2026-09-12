// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { DeltaText } from './DeltaText';

afterEach(cleanup);

const plain = (n: number) => String(n);

test('without a previous run only the value is shown', () => {
  render(<DeltaText value={100} format={plain} betterWhen="higher" />);

  expect(screen.getByText('100')).toBeTruthy();
  expect(screen.queryByText(/%/)).toBeNull();
});

test('a rise is better when higher is better', () => {
  render(<DeltaText value={104} previous={100} format={plain} betterWhen="higher" />);

  expect(screen.getByText('(+4 %)')).toBeTruthy();
  expect(screen.getByText('better')).toBeTruthy();
});

test('the same rise is worse when lower is better', () => {
  render(<DeltaText value={104} previous={100} format={plain} betterWhen="lower" />);

  expect(screen.getByText('(+4 %)')).toBeTruthy();
  expect(screen.getByText('worse')).toBeTruthy();
});

test('a fall is written with a real minus sign', () => {
  render(<DeltaText value={97} previous={100} format={plain} betterWhen="higher" />);

  expect(screen.getByText('(−3 %)')).toBeTruthy();
  expect(screen.getByText('worse')).toBeTruthy();
});

test('no change is neither better nor worse', () => {
  render(<DeltaText value={100} previous={100} format={plain} betterWhen="lower" />);

  expect(screen.getByText('(0 %)')).toBeTruthy();
  expect(screen.queryByText('better')).toBeNull();
  expect(screen.queryByText('worse')).toBeNull();
});

test('a previous run of zero cannot yield a percentage', () => {
  render(<DeltaText value={5} previous={0} format={(n) => `${n} hits`} betterWhen="higher" />);

  expect(screen.getByText('5 hits')).toBeTruthy();
  expect(screen.queryByText(/%/)).toBeNull();
});
