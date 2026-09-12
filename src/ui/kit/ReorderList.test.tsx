// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { ReorderItem, ReorderList } from './ReorderList';

afterEach(cleanup);

const UNITS: Record<string, string> = {
  'archer-3': 'Archer',
  'pikeman-2': 'Pikeman',
  'bear-5': 'Bear',
};

function Order({ start = ['archer-3', 'pikeman-2', 'bear-5'] }: { start?: string[] }) {
  const [order, setOrder] = useState(start);
  return (
    <>
      <ReorderList label="Order of the fall" order={order} onReorder={setOrder}>
        {order.map((id) => (
          <ReorderItem key={id} id={id} label={UNITS[id] ?? id}>
            <span>{UNITS[id]}</span>
          </ReorderItem>
        ))}
      </ReorderList>
      <p data-order={order.join(' ')} />
    </>
  );
}

const current = (): string => document.querySelector('p[data-order]')?.getAttribute('data-order') ?? '';

const rowNames = (): string[] =>
  screen.getAllByRole('row').map((row) => row.getAttribute('aria-label') ?? row.textContent ?? '');

test('the list is named and every row carries a drag handle and two arrows', () => {
  render(<Order />);
  const list = screen.getByRole('grid', { name: 'Order of the fall' });

  expect(within(list).getByRole('button', { name: 'Reorder Archer' })).toBeTruthy();
  expect(within(list).getByRole('button', { name: 'Move Archer up' })).toHaveProperty('disabled', true);
  expect(within(list).getByRole('button', { name: 'Move Archer down' })).toHaveProperty('disabled', false);
  expect(within(list).getByRole('button', { name: 'Move Bear down' })).toHaveProperty('disabled', true);
  expect(rowNames()[0]).toContain('Archer');
});

test('the arrows move a row and report the whole new order', () => {
  render(<Order />);
  fireEvent.click(screen.getByRole('button', { name: 'Move Archer down' }));
  expect(current()).toBe('pikeman-2 archer-3 bear-5');

  fireEvent.click(screen.getByRole('button', { name: 'Move Bear up' }));
  expect(current()).toBe('pikeman-2 bear-5 archer-3');
});

test('the position number follows the row it belongs to', () => {
  render(<Order />);
  expect(screen.getAllByRole('row')[0]?.textContent).toContain('1');

  fireEvent.click(screen.getByRole('button', { name: 'Move Bear up' }));
  const rows = screen.getAllByRole('row');
  expect(rows[1]?.textContent).toContain('Bear');
});

test('the rows are walked with the arrow keys', () => {
  render(<Order />);
  const rows = screen.getAllByRole('row');
  const [first, second] = rows;
  if (first === undefined || second === undefined) throw new Error('no rows');

  first.focus();
  expect(document.activeElement).toBe(first);
  fireEvent.keyDown(first, { key: 'ArrowDown' });
  fireEvent.keyUp(first, { key: 'ArrowDown' });
  expect(document.activeElement).toBe(second);
});

test('a row can be picked up from its handle and dropped with the keyboard', async () => {
  const user = userEvent.setup();
  render(<Order />);

  const handle = screen.getByRole('button', { name: 'Reorder Archer' });
  handle.focus();
  await user.keyboard('{Enter}');
  await user.keyboard('{ArrowDown}');
  await user.keyboard('{Enter}');

  await waitFor(() => {
    expect(current()).toBe('pikeman-2 archer-3 bear-5');
  });
});

test('an empty list says so', () => {
  render(
    <ReorderList label="Order of the fall" order={[]} onReorder={() => {}} emptyState="Nothing to order yet.">
      {[]}
    </ReorderList>,
  );
  expect(screen.getByText('Nothing to order yet.')).toBeTruthy();
});
