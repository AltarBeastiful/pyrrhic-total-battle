// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { NumberStepper } from './NumberStepper';
import { SelectableItem, SelectableList } from './SelectableList';

afterEach(cleanup);

const ROWS = [
  { id: 'bear-5', label: 'Bear V, tier 5' },
  { id: 'abomination-6', label: 'Abomination VI, tier 6' },
  { id: 'arbalester-6', label: 'Arbalester VI, tier 6' },
];

function Example({ empty = false }: { empty?: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [owned, setOwned] = useState<number | null>(3);

  return (
    <>
      <SelectableList
        label="Mercenaries"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        emptyState="Nothing matches those filters."
      >
        {(empty ? [] : ROWS).map((row) => (
          <SelectableItem
            key={row.id}
            id={row.id}
            label={row.label}
            actions={
              row.id === 'bear-5' ? (
                <NumberStepper label="Owned" size="sm" value={owned} onChange={setOwned} min={0} allowEmpty />
              ) : undefined
            }
          >
            <span>{row.label}</span>
          </SelectableItem>
        ))}
      </SelectableList>
      <output>{selected.join(' ')}</output>
      <output aria-label="owned">{owned === null ? 'unlimited' : String(owned)}</output>
    </>
  );
}

const picked = (): string => screen.getAllByRole('status')[0]?.textContent ?? '';

test('a row is named by its label and says whether it is selected', async () => {
  const user = userEvent.setup();
  render(<Example />);

  const list = screen.getByRole('grid', { name: 'Mercenaries' });
  const row = within(list).getByRole('row', { name: 'Bear V, tier 5' });
  expect(row.getAttribute('aria-selected')).toBe('false');

  await user.click(row);
  expect(screen.getByRole('row', { name: 'Bear V, tier 5' }).getAttribute('aria-selected')).toBe('true');
  expect(picked()).toBe('bear-5');
});

test('pressing a row again gives it back', async () => {
  const user = userEvent.setup();
  render(<Example />);

  await user.click(screen.getByRole('row', { name: 'Abomination VI, tier 6' }));
  expect(picked()).toBe('abomination-6');

  await user.click(screen.getByRole('row', { name: 'Abomination VI, tier 6' }));
  expect(picked()).toBe('');
});

test('the rows are walked with the arrow keys and ticked with Space', async () => {
  const user = userEvent.setup();
  render(<Example />);

  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('row', { name: 'Bear V, tier 5' }));

  await user.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(screen.getByRole('row', { name: 'Abomination VI, tier 6' }));

  await user.keyboard(' ');
  expect(picked()).toBe('abomination-6');

  await user.keyboard(' ');
  expect(picked()).toBe('');
});

test('a control inside a row changes its value without ticking the row', async () => {
  const user = userEvent.setup();
  render(<Example />);

  const row = screen.getByRole('row', { name: 'Bear V, tier 5' });
  await user.click(within(row).getByRole('button', { name: 'Increase Owned' }));

  expect(screen.getByLabelText('owned').textContent).toBe('4');
  expect(screen.getByRole('row', { name: 'Bear V, tier 5' }).getAttribute('aria-selected')).toBe('false');
  expect(picked()).toBe('');
});

test('an empty list says so instead of showing nothing', () => {
  render(<Example empty />);
  expect(screen.getByText('Nothing matches those filters.')).toBeTruthy();
});
