// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { TierSelect } from './TierSelect';
import { clampTier } from './tiers';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

const TIERS = [1, 2, 3, 4, 5];

test('the select is named by its label and shows the tier with its prefix', () => {
  renderWithTheme(
    <TierSelect label="Guardsmen from" prefix="G" tiers={TIERS} value={3} onChange={() => {}} />,
  );
  const select = screen.getByRole('combobox', { name: 'Guardsmen from' });
  expect((select as HTMLSelectElement).value).toBe('3');
  expect(screen.getByRole('option', { name: 'G4' })).toBeTruthy();
});

test('a value above the other end is clamped, and the tiers past it cannot be chosen', () => {
  renderWithTheme(
    <TierSelect label="Guardsmen from" prefix="G" tiers={TIERS} value={5} max={3} onChange={() => {}} />,
  );
  expect((screen.getByRole('combobox', { name: 'Guardsmen from' }) as HTMLSelectElement).value).toBe('3');
  expect((screen.getByRole('option', { name: 'G4' }) as HTMLOptionElement).disabled).toBe(true);
  expect((screen.getByRole('option', { name: 'G2' }) as HTMLOptionElement).disabled).toBe(false);
});

test('choosing a tier reports the number, and "—" reports null', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  renderWithTheme(
    <TierSelect label="Monsters to" prefix="M" tiers={TIERS} value={2} allowNone onChange={onChange} />,
  );
  const select = screen.getByRole('combobox', { name: 'Monsters to' });
  await user.selectOptions(select, '4');
  expect(onChange).toHaveBeenCalledWith(4);
  await user.selectOptions(select, '—');
  expect(onChange).toHaveBeenCalledWith(null);
});

test('clampTier holds the range from both ends', () => {
  expect(clampTier(7, 2, 4)).toBe(4);
  expect(clampTier(1, 2, 4)).toBe(2);
  expect(clampTier(3, 2, 4)).toBe(3);
  expect(clampTier(null, 2, 4)).toBe(null);
});
