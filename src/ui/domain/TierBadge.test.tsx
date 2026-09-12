// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { TierBadge } from './TierBadge';
import { TIER_TONE } from './TierBadge.tones';

afterEach(cleanup);

test('a tier is drawn as its roman numeral and read out in words', () => {
  render(<TierBadge tier={6} />);

  expect(screen.getByText('VI')).toBeTruthy();
  expect(screen.getByText('tier 6')).toBeTruthy();
});

test('every tier the tables carry a colour for wears its own ink', () => {
  render(
    <>
      {[5, 6, 7, 8, 9].map((tier) => (
        <TierBadge key={tier} tier={tier} />
      ))}
    </>,
  );

  for (const tier of [5, 6, 7, 8, 9]) {
    const badge = screen.getByText(`tier ${tier}`).parentElement;
    expect(badge?.className).toContain(TIER_TONE[tier]);
  }
});

test('a tier with no colour of its own still says which tier it is', () => {
  render(<TierBadge tier={3} />);

  const badge = screen.getByText('tier 3').parentElement;
  expect(screen.getByText('III')).toBeTruthy();
  expect(badge?.className).not.toContain('text-tier-');
});
