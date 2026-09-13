// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { renderWithTheme } from '../kit/testRender';
import { UnitTile } from './UnitTile';
import { ARCHER, FIRE_ELEMENTAL } from './fixtures';

afterEach(cleanup);

test('a tile that cannot be pressed still says what it is', () => {
  renderWithTheme(<UnitTile unit={ARCHER} size="md" />);
  expect(screen.getByText('Archer, tier 3, on')).toBeTruthy();
  expect(screen.getByText('III')).toBeTruthy();
  expect(screen.getByText('ARC')).toBeTruthy();
});

test('given a press handler it becomes a toggle button carrying its state', async () => {
  const user = userEvent.setup();
  const onPress = vi.fn();
  renderWithTheme(<UnitTile unit={ARCHER} size="md" state="off" onPress={onPress} />);

  const button = screen.getByRole('button', { name: 'Archer, tier 3, off' });
  expect(button.getAttribute('aria-pressed')).toBe('false');
  await user.click(button);
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('on reads as pressed, left out reads as unpressed and struck through', () => {
  const { rerender } = renderWithTheme(<UnitTile unit={ARCHER} size="md" state="on" onPress={() => {}} />);
  expect(screen.getByRole('button', { name: /, on$/ }).getAttribute('aria-pressed')).toBe('true');

  rerender(<UnitTile unit={ARCHER} size="md" state="leftOut" onPress={() => {}} />);
  expect(screen.getByRole('button', { name: /left out/ }).getAttribute('aria-pressed')).toBe('false');
});

test('a monster is drawn by its race and a troop by its category', () => {
  const { container } = renderWithTheme(<UnitTile unit={FIRE_ELEMENTAL} size="lg" />);
  expect(container.textContent).toContain('🔥');
  cleanup();
  const troop = renderWithTheme(<UnitTile unit={ARCHER} size="lg" />);
  expect(troop.container.textContent).toContain('🏹');
});
