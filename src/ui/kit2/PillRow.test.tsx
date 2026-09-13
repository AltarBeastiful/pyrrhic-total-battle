// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { PillRow } from './PillRow';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

test('the row is named, and every pill says what it is', () => {
  renderWithTheme(
    <PillRow
      label="Hired mercenaries"
      items={[
        { id: 'bear-5', label: 'Bear V · 240' },
        { id: 'archdemon-6', label: 'Archdemon VI · 30' },
      ]}
    />,
  );
  expect(screen.getByRole('group', { name: 'Hired mercenaries' })).toBeTruthy();
  expect(screen.getByText('Bear V · 240')).toBeTruthy();
});

test('a pill with a remover has a named button that dismisses it', async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  renderWithTheme(
    <PillRow
      label="Hired mercenaries"
      items={[{ id: 'bear-5', label: 'Bear V', removeLabel: 'Dismiss Bear V', onRemove }]}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Dismiss Bear V' }));
  expect(onRemove).toHaveBeenCalledTimes(1);
});

test('an empty row shows what it is waiting for', () => {
  renderWithTheme(<PillRow label="Hired mercenaries" items={[]} empty={<span>No mercenaries yet</span>} />);
  expect(screen.getByText('No mercenaries yet')).toBeTruthy();
});
