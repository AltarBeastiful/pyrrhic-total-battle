// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { GroupedCombobox, type ComboboxGroup } from './GroupedCombobox';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

const GROUPS: ComboboxGroup[] = [
  {
    key: '5',
    label: 'Tier V',
    options: [
      { value: 'bear-5', label: 'Bear' },
      { value: 'hunter-5', label: 'Epic Monster Hunter' },
    ],
  },
  { key: '6', label: 'Tier VI', options: [{ value: 'archdemon-6', label: 'Archdemon' }] },
];

function Example({ onPick = () => {} }: { onPick?: (value: string) => void }) {
  return (
    <GroupedCombobox
      triggerLabel="Hire mercenary…"
      searchLabel="Search mercenaries"
      groups={GROUPS}
      onPick={onPick}
    />
  );
}

test('the trigger opens a list grouped by tier', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  await user.click(screen.getByRole('button', { name: 'Hire mercenary…' }));

  expect(screen.getByRole('textbox', { name: 'Search mercenaries' })).toBeTruthy();
  expect(screen.getByText('Tier V')).toBeTruthy();
  expect(screen.getByRole('option', { name: 'Archdemon' })).toBeTruthy();
});

test('the search narrows the list to what matches', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  await user.click(screen.getByRole('button', { name: 'Hire mercenary…' }));
  await user.type(screen.getByRole('textbox', { name: 'Search mercenaries' }), 'arch');

  expect(screen.getByRole('option', { name: 'Archdemon' })).toBeTruthy();
  expect(screen.queryByRole('option', { name: 'Bear' })).toBeNull();
});

test('the list stays open after a pick, so several can be hired in a row', async () => {
  const user = userEvent.setup();
  const onPick = vi.fn();
  renderWithTheme(<Example onPick={onPick} />);
  await user.click(screen.getByRole('button', { name: 'Hire mercenary…' }));

  await user.click(screen.getByRole('option', { name: 'Bear' }));
  expect(onPick).toHaveBeenLastCalledWith('bear-5');
  expect(screen.getByRole('option', { name: 'Archdemon' })).toBeTruthy();

  await user.click(screen.getByRole('option', { name: 'Archdemon' }));
  expect(onPick).toHaveBeenLastCalledWith('archdemon-6');
  expect(onPick).toHaveBeenCalledTimes(2);
});

test('Escape in the search field closes the list', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  await user.click(screen.getByRole('button', { name: 'Hire mercenary…' }));
  await user.type(screen.getByRole('textbox', { name: 'Search mercenaries' }), '{Escape}');
  expect(screen.queryByRole('option', { name: 'Bear' })).toBeNull();
});
