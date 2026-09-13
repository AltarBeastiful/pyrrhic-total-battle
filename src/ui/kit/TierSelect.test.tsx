// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { TierSelect } from './TierSelect';
import { clampTier } from './tiers';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

const TIERS = [1, 2, 3, 4, 5];

/** The stepper's value: a `spinbutton` whose text is the tier written with its prefix. */
const stepper = (name: string): HTMLElement => screen.getByRole('spinbutton', { name });

test('the stepper is named by its label and shows the tier with its prefix', () => {
  renderWithTheme(
    <TierSelect label="Guardsmen from" prefix="G" tiers={TIERS} value={3} onChange={() => {}} />,
  );
  const value = stepper('Guardsmen from');
  expect(value.getAttribute('aria-valuetext')).toBe('G3');
  expect(value.getAttribute('aria-valuenow')).toBe('3');
  expect(value.textContent).toBe('G3');
});

test('a value above the other end is clamped, and the stepper cannot walk past it', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  renderWithTheme(
    <TierSelect label="Guardsmen from" prefix="G" tiers={TIERS} value={5} max={3} onChange={onChange} />,
  );
  expect(stepper('Guardsmen from').getAttribute('aria-valuetext')).toBe('G3');
  // G3 is the top of the window, so the "up" arrow is not a thing that can be pressed.
  expect(
    (screen.getByRole('button', { name: 'Guardsmen from: one tier up' }) as HTMLButtonElement).disabled,
  ).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Guardsmen from: one tier down' }));
  expect(onChange).toHaveBeenCalledWith(2);
});

test('stepping reports the number, and stepping below the first tier reports null', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  renderWithTheme(
    <TierSelect label="Monsters to" prefix="M" tiers={TIERS} value={2} allowNone onChange={onChange} />,
  );
  await user.click(screen.getByRole('button', { name: 'Monsters to: one tier up' }));
  expect(onChange).toHaveBeenCalledWith(3);
  await user.click(screen.getByRole('button', { name: 'Monsters to: one tier down' }));
  expect(onChange).toHaveBeenCalledWith(1);
});

test('the arrow keys walk the stepper, and Home reaches the "—" position', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  renderWithTheme(
    <TierSelect label="Monsters to" prefix="M" tiers={TIERS} value={2} allowNone onChange={onChange} />,
  );
  const value = stepper('Monsters to');
  value.focus();
  await user.keyboard('{ArrowUp}');
  expect(onChange).toHaveBeenLastCalledWith(3);
  await user.keyboard('{ArrowDown}');
  expect(onChange).toHaveBeenLastCalledWith(1);
  await user.keyboard('{Home}');
  expect(onChange).toHaveBeenLastCalledWith(null);
  await user.keyboard('{End}');
  expect(onChange).toHaveBeenLastCalledWith(5);
});

test('clampTier holds the range from both ends', () => {
  expect(clampTier(7, 2, 4)).toBe(4);
  expect(clampTier(1, 2, 4)).toBe(2);
  expect(clampTier(3, 2, 4)).toBe(3);
  expect(clampTier(null, 2, 4)).toBe(null);
});
