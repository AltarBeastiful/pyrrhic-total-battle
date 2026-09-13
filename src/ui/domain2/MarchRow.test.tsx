// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { renderWithTheme } from '../kit2/testRender';
import { MarchRow, MarchTable } from './MarchRow';
import { ARCHER } from './fixtures';

afterEach(cleanup);

function Example({ onCopy }: { onCopy?: (count: number) => void }) {
  return (
    <MarchTable caption="The march">
      <MarchRow
        unit={ARCHER}
        count={1500}
        hits={12}
        lost={340}
        reviveSilver={90000}
        position={3}
        {...(onCopy === undefined ? {} : { onCopy })}
      />
    </MarchTable>
  );
}

test('the row names the unit, its place in the kill order and every figure', () => {
  renderWithTheme(<Example />);
  expect(screen.getByRole('table', { name: 'The march' })).toBeTruthy();
  expect(screen.getByText('Archer')).toBeTruthy();
  expect(screen.getByText('falls 3rd')).toBeTruthy();
  expect(screen.getByText('90 000')).toBeTruthy();
});

test('the count is a button that copies it and says so', async () => {
  const user = userEvent.setup();
  const onCopy = vi.fn();
  renderWithTheme(<Example onCopy={onCopy} />);

  await user.click(screen.getByRole('button', { name: 'Copy 1 500, Archer' }));
  expect(onCopy).toHaveBeenCalledWith(1500);
  expect(screen.getByRole('status').textContent).toBe('Copied');
});

test('a figure that has not been worked out yet is a dash, not a zero', () => {
  renderWithTheme(
    <MarchTable>
      <MarchRow unit={ARCHER} count={1500} />
    </MarchTable>,
  );
  expect(screen.getAllByText('—')).toHaveLength(3);
});
