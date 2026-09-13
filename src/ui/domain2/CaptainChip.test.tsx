// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { renderWithTheme } from '../kit2/testRender';
import { CaptainChip } from './CaptainChip';

afterEach(cleanup);

test('the chip says whether the captain rides, and pressing it changes that', async () => {
  const user = userEvent.setup();
  const onToggle = vi.fn();
  renderWithTheme(
    <CaptainChip name="Aydae" bonusKey="melee" bonus="HP +25 %" enlisted={false} onToggle={onToggle} />,
  );
  const chip = screen.getByRole('checkbox', { name: 'Send Aydae on this march' });
  await user.click(chip);
  expect(onToggle).toHaveBeenCalledTimes(1);
  expect(screen.getByText('HP +25 %')).toBeTruthy();
});

test('the gear is a second target that edits the level and never enlists anybody', async () => {
  const user = userEvent.setup();
  const onToggle = vi.fn();
  const onEditLevel = vi.fn();
  renderWithTheme(
    <CaptainChip name="Aydae" enlisted onToggle={onToggle} levelSet onEditLevel={onEditLevel} />,
  );

  await user.click(screen.getByRole('button', { name: 'Change Aydae’s level' }));
  expect(onEditLevel).toHaveBeenCalledTimes(1);
  expect(onToggle).not.toHaveBeenCalled();
});

test('a captain with nothing to set carries no gear', () => {
  renderWithTheme(<CaptainChip name="Ardan" enlisted={false} onToggle={() => {}} />);
  expect(screen.queryByRole('button', { name: /level/ })).toBeNull();
});
