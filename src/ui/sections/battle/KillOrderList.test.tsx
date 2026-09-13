// @vitest-environment jsdom
/**
 * The order of the fall without drag and drop (D-31): two buttons a row, position numbers, and a
 * spoken line after every move.
 */
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import type { UnitDef } from '@/data/types';
import { renderWithTheme } from '@/ui/kit2/testRender';

import { KillOrderList } from './KillOrderList';

function unit(id: string, name: string, tier: number): UnitDef {
  return {
    id,
    name,
    label: id.toUpperCase(),
    kind: 'troop',
    pool: 'leadership',
    tier,
    group: 'guardsmen',
    keys: [],
    cost: 1,
    health: 1,
    strength: 1,
    strengthAgainst: {},
    doubleDamageChance: 0,
    revival: { silver: 0, gold: 0, dragonCoins: 0 },
  } as UnitDef;
}

const UNITS = new Map([
  ['a', unit('a', 'Swordsman', 1)],
  ['b', unit('b', 'Archer', 2)],
  ['c', unit('c', 'Rider', 3)],
]);

function Example() {
  const [order, setOrder] = useState(['a', 'b', 'c']);
  return (
    <>
      <KillOrderList order={order} units={UNITS} onChange={setOrder} />
      {/* `<output>` would be a second `role="status"`, which is the list's own announcement. */}
      <div>{order.join(' ')}</div>
    </>
  );
}

afterEach(cleanup);

test('every stack is a numbered row with two arrows', () => {
  renderWithTheme(<Example />);
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(screen.getByRole('list', { name: 'Order of the fall' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Move Archer up' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Move Rider down' })).toBeTruthy();
});

test('an arrow moves its row and says where it landed', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);

  await user.click(screen.getByRole('button', { name: 'Move Archer up' }));
  expect(screen.getByRole('status').textContent).toBe('Archer is now 1 of 3 to fall.');
  expect(screen.getByText('b a c')).toBeTruthy();

  await user.click(screen.getByRole('button', { name: 'Move Archer down' }));
  expect(screen.getByText('a b c')).toBeTruthy();
});

test('the ends of the list have nowhere to go, and focus follows the row that moved', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  expect(screen.getByRole('button', { name: 'Move Swordsman up' })).toHaveProperty('disabled', true);
  expect(screen.getByRole('button', { name: 'Move Rider down' })).toHaveProperty('disabled', true);

  // Pressing "up" on the second row disables that very button: focus moves to its neighbour.
  await user.click(screen.getByRole('button', { name: 'Move Archer up' }));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Move Archer down' }));
});
