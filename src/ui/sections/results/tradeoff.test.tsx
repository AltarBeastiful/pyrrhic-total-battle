// @vitest-environment jsdom
/**
 * The trade-off table is fed straight from `SearchResult.baseline`, so it is tested on its own: a real
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

function row(label: string): HTMLElement {
  const header = screen.getByRole('rowheader', { name: label });
  const tr = header.closest('tr');
  if (tr === null) throw new Error(`${label} is not in a row`);
  return tr;
}

test('every figure is shown against the all-types army, with a signed difference', () => {
  render(<TradeoffPanel tradeoff={tradeoff} units={[]} kept={[]} />);

  expect(screen.getByText('This selection vs all types')).toBeTruthy();

  const hits = within(row('Hits your army lands (monster first)'));
  expect(hits.getByText('32')).toBeTruthy();
  expect(hits.getByText('40')).toBeTruthy();
  expect(hits.getByText('-8')).toBeTruthy();

  const expected = within(row('Expected damage'));
  expect(expected.getByText('1,800')).toBeTruthy();
  expect(expected.getByText('+300')).toBeTruthy();

  expect(within(row('Damage if the monster strikes first')).getByText('-100')).toBeTruthy();
  expect(within(row('Damage if you strike first')).getByText('0')).toBeTruthy();
  // Spending less silver is an improvement, so the drop is the good colour.
  const silver = within(row('Retrain silver')).getByText('-100');
  expect(silver.className).toContain('text-ok');
  // Losing damage is not.
  expect(within(row('Expected damage')).getByText('+300').className).toContain('text-ok');
  expect(within(row('Damage if the monster strikes first')).getByText('-100').className).toContain(
    'text-warn',
  );
});

test('a type the priority left out can be kept in from the panel', () => {
  render(<TradeoffPanel tradeoff={tradeoff} units={[]} kept={[]} />);
  expect(screen.getByRole('button', { name: /Keep in march/ })).toBeTruthy();
  expect(screen.getByText('Left out by the priority')).toBeTruthy();
});
