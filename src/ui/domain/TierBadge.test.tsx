// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { renderWithTheme } from '../kit/testRender';
import { TierBadge } from './TierBadge';

afterEach(cleanup);

test('the tier is a roman numeral, and the name spells it out', () => {
  renderWithTheme(<TierBadge tier={6} />);
  const badge = screen.getByLabelText('tier 6');
  expect(badge.textContent).toBe('VI');
});

test('a tier the tables carry no colour for still arrives with a numeral', () => {
  renderWithTheme(<TierBadge tier={3} />);
  expect(screen.getByLabelText('tier 3').textContent).toBe('III');
});
