// @vitest-environment jsdom
/**
 * The profile has to survive the real spread: a 6.5 M mercenary stack next to a 260 K troop stack. On a
 * linear scale the troop bar is four pixels of nothing, so the bars are drawn on a square-root scale —
 * one scale for the whole list, because two would break the top-to-bottom kill order.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import type { Stack } from '@/engine/types';

import { HpProfile } from './HpProfile';

afterEach(() => {
  cleanup();
});

const stack = (unitId: string, pool: Stack['pool'], totalHp: number): Stack => ({
  unitId,
  pool,
  count: 10,
  hpPerUnit: totalHp / 10,
  totalHp,
  strengthPerUnit: 1,
  target: 'melee',
  damagePerHit: 1,
  featuresDamage: 0,
  doubleDamageChance: 0,
  strikeTwoSquadsChance: 0,
});

const stacks = [
  stack('mercenary', 'authority', 6_500_000),
  stack('troop', 'leadership', 260_000),
  stack('sliver', 'leadership', 0),
];

function bars(): HTMLElement[] {
  const list = screen.getByRole('list', { name: /Total HP per stack/ });
  return within(list)
    .getAllByRole('listitem')
    .map((item) => {
      const bar = item.querySelector<HTMLElement>('[data-hp-bar]');
      if (bar === null) throw new Error('a stack was drawn without a bar');
      return bar;
    });
}

test('a stack 25 times smaller still draws a bar you can see', () => {
  render(<HpProfile stacks={stacks} units={[]} kept={[]} />);
  const [merc, troop] = bars().map((bar) => Number(bar.dataset.hpBar));

  expect(merc).toBe(100);
  // Linear would be 4 %; the square root keeps it a fifth of the widest bar.
  expect(troop).toBe(20);
});

test('bars shorten from top to bottom, so the order they fall in still reads', () => {
  render(<HpProfile stacks={stacks} units={[]} kept={[]} />);
  const widths = bars().map((bar) => Number(bar.dataset.hpBar));
  expect([...widths].sort((a, b) => b - a)).toEqual(widths);
});

test('an empty stack keeps a 2 px bar rather than disappearing', () => {
  render(<HpProfile stacks={stacks} units={[]} kept={[]} />);
  const last = bars().at(-1);
  expect(last?.dataset.hpBar).toBe('2');
  expect(last?.className).toContain('min-w-[2px]');
});

test('the caption says the bars are scaled and the figures are not', () => {
  render(<HpProfile stacks={stacks} units={[]} kept={[]} />);
  expect(screen.getByText(/square-root scale/)).toBeTruthy();
  // The numbers beside the bars stay exact.
  expect(screen.getByText('6,500,000')).toBeTruthy();
  expect(screen.getByText('260,000')).toBeTruthy();
});
