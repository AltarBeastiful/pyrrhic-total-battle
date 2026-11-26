// @vitest-environment jsdom
/** The totals card and header figures take already-resolved sources as well as (profile, setup). */
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import type { ResolvedSource } from '@/engine/types';
import { renderWithTheme } from '@/ui/kit/testRender';

import { totalsSummaryFromSources } from './rows';
import { TotalsBreakdown } from './TotalsBreakdown';

afterEach(cleanup);

const SOURCES: ResolvedSource[] = [
  { id: 'permanent:x', label: 'Arena Shop', kind: 'permanent', health: { army: 10 }, strength: { army: 25 } },
];

test('summarises resolved sources', () => {
  expect(totalsSummaryFromSources(SOURCES)).toMatchObject({ health: 10, strength: 25, on: 1, empty: 0 });
});

test('breaks down resolved sources', () => {
  renderWithTheme(<TotalsBreakdown sources={SOURCES} />);
  expect(screen.getAllByText('Arena Shop')).toHaveLength(2);
});
