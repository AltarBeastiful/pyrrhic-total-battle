// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { SwitchRow } from './SwitchRow';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

test('the row is a switch named by its label, with the sentence under it', () => {
  renderWithTheme(
    <SwitchRow
      label="Sort by total HP"
      description="The strongest stack falls last."
      checked
      onChange={() => {}}
    />,
  );
  const control = screen.getByRole('switch', { name: /Sort by total HP/ });
  expect((control as HTMLInputElement).checked).toBe(true);
  expect(screen.getByText('The strongest stack falls last.')).toBeTruthy();
});

test('clicking the label flips it, and the keyboard does the same', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  renderWithTheme(<SwitchRow label="Unlimited" checked={false} onChange={onChange} />);

  await user.click(screen.getByRole('switch', { name: 'Unlimited' }));
  expect(onChange).toHaveBeenLastCalledWith(true);

  screen.getByRole('switch', { name: 'Unlimited' }).focus();
  await user.keyboard(' ');
  expect(onChange).toHaveBeenCalledTimes(2);
});

test('a disabled row cannot be flipped', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  renderWithTheme(<SwitchRow label="Unlimited" checked={false} disabled onChange={onChange} />);
  await user.click(screen.getByRole('switch', { name: 'Unlimited' }));
  expect(onChange).not.toHaveBeenCalled();
});
