// @vitest-environment jsdom
/**
 * The trade-off strip is fed straight from `SearchResult.baseline`, so it is tested on its own: a real
 * priority search would spend its whole wall-clock budget to produce two summaries this test can write
 * by hand.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import type { SearchTradeoff, TradeoffFigures } from './runStore';
import { TradeoffPanel } from './TradeoffPanel';

afterEach(() => {
  cleanup();
});

const figures = (over: Partial<TradeoffFigures> = {}): TradeoffFigures => ({
  friendlyHits: 40,
  minDamage: 1_000,
  maxDamage: 2_000,
  avgDamage: 1_500,
  silver: 500,
  gold: 40,
  dragonCoins: 10,
  ...over,
});

const tradeoff: SearchTradeoff = {
  objective: 'avgDamage',
  includedUnitIds: ['archer-1'],
  excludedUnitIds: ['rider-3'],
  // The winner trades hits and worst case away for a higher expected damage and a cheaper recovery.
  selection: figures({ friendlyHits: 32, minDamage: 900, avgDamage: 1_800, silver: 400 }),
  baseline: figures(),
};

/** The block of one figure: its label, the selection's value, and the all-types value under it. */
function block(label: string): HTMLElement {
  const name = screen.getByText(label);
  const parent = name.parentElement;
  if (parent === null) throw new Error(`${label} is not in a block`);
  return parent;
}

test('every figure is shown against the all-types army, with the change spelled out', () => {
  render(<TradeoffPanel tradeoff={tradeoff} />);

  expect(screen.getByRole('heading', { name: 'Compared with all types' })).toBeTruthy();
  expect(screen.getByText(/kept 1 unit type and left 1 out/)).toBeTruthy();

  const hits = within(block('Hits your army lands'));
  expect(hits.getByText('32')).toBeTruthy();
  expect(hits.getByText('All types 40')).toBeTruthy();
  // Fewer hits than the whole army would land: a loss, said in words as well as in colour.
  expect(hits.getByText('worse')).toBeTruthy();

  const expected = within(block('Expected damage'));
  expect(expected.getByText('1,800')).toBeTruthy();
  expect(expected.getByText('All types 1,500')).toBeTruthy();
  expect(expected.getByText('better')).toBeTruthy();
});

test('a cheaper recovery counts as an improvement, not as a fall', () => {
  render(<TradeoffPanel tradeoff={tradeoff} />);

  const silver = within(block('Retrain silver'));
  expect(silver.getByText('400')).toBeTruthy();
  expect(silver.getByText('better')).toBeTruthy();

  // Nothing moved on the dragon coins, so nothing is claimed about them.
  const coins = within(block('Dragon coins'));
  expect(coins.queryByText('better')).toBeNull();
  expect(coins.queryByText('worse')).toBeNull();
});
