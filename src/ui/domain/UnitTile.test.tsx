// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { ARCHER, CATAPULT, FIRE_ELEMENTAL, SAMPLE_UNITS } from './fixtures';
import { UnitTile } from './UnitTile';

afterEach(cleanup);

test('a tile without a press handler is not a control but still says what it is', () => {
  render(<UnitTile unit={ARCHER} size="md" />);

  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByText('Archer, tier 3, on')).toBeTruthy();
});

test('a pressable tile is a button named after the unit, its tier and its state', () => {
  render(<UnitTile unit={ARCHER} size="md" state="off" onPress={() => {}} />);

  expect(screen.getByRole('button', { name: 'Archer, tier 3, off' })).toBeTruthy();
});

test('left out is said in words, not only drawn', () => {
  render(<UnitTile unit={CATAPULT} size="lg" state="leftOut" onPress={() => {}} />);

  expect(screen.getByRole('button', { name: 'Catapult, tier 4, left out' })).toBeTruthy();
});

test('an explicit label replaces the generated name', () => {
  render(<UnitTile unit={ARCHER} size="sm" label="Keep archers in the march" onPress={() => {}} />);

  expect(screen.getByRole('button', { name: 'Keep archers in the march' })).toBeTruthy();
});

test('aria-pressed follows the state and a press is reported once', async () => {
  const user = userEvent.setup();
  const onPress = vi.fn();
  const { rerender } = render(<UnitTile unit={ARCHER} size="md" state="on" onPress={onPress} />);

  const tile = screen.getByRole('button');
  expect(tile.getAttribute('aria-pressed')).toBe('true');

  await user.click(tile);
  expect(onPress).toHaveBeenCalledTimes(1);

  rerender(<UnitTile unit={ARCHER} size="md" state="off" onPress={onPress} />);
  expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');

  rerender(<UnitTile unit={ARCHER} size="md" state="pinned" onPress={onPress} />);
  expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
});

test('a short pointer press is a press, not a long press', async () => {
  const user = userEvent.setup();
  const onPress = vi.fn();
  const onLongPress = vi.fn();
  render(<UnitTile unit={ARCHER} size="md" onPress={onPress} onLongPress={onLongPress} />);

  await user.click(screen.getByRole('button'));

  expect(onPress).toHaveBeenCalledTimes(1);
  expect(onLongPress).not.toHaveBeenCalled();
});

test('holding the pointer down for 500 ms is a long press and swallows the click', () => {
  vi.useFakeTimers();
  try {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    render(<UnitTile unit={ARCHER} size="md" onPress={onPress} onLongPress={onLongPress} />);
    const tile = screen.getByRole('button');

    fireEvent.pointerDown(tile, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(tile);
    fireEvent.click(tile);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});

test('moving the pointer cancels the long press', () => {
  vi.useFakeTimers();
  try {
    const onLongPress = vi.fn();
    render(<UnitTile unit={ARCHER} size="md" onPress={() => {}} onLongPress={onLongPress} />);
    const tile = screen.getByRole('button');

    fireEvent.pointerDown(tile, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.pointerMove(tile);
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});

test('the keyboard never long-presses', async () => {
  const user = userEvent.setup();
  const onPress = vi.fn();
  const onLongPress = vi.fn();
  render(<UnitTile unit={ARCHER} size="md" onPress={onPress} onLongPress={onLongPress} />);

  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('button'));
  await user.keyboard('{Enter}');

  expect(onPress).toHaveBeenCalledTimes(1);
  expect(onLongPress).not.toHaveBeenCalled();
});

test('the short code appears from md up and the full name and group on lg', () => {
  const { rerender } = render(<UnitTile unit={ARCHER} size="sm" />);
  expect(screen.queryByText('ARC')).toBeNull();

  rerender(<UnitTile unit={ARCHER} size="md" />);
  expect(screen.getByText('ARC')).toBeTruthy();
  expect(screen.queryByText('Archer')).toBeNull();

  rerender(<UnitTile unit={ARCHER} size="lg" />);
  expect(screen.getByText('ARC')).toBeTruthy();
  expect(screen.getByText('Archer')).toBeTruthy();
  expect(screen.getByText('Guardsmen · tier 3')).toBeTruthy();
});

test('a monster is drawn by its race and every sample unit renders at every size', () => {
  render(
    <>
      {SAMPLE_UNITS.map((unit) => (
        <UnitTile key={unit.id} unit={unit} size="lg" />
      ))}
    </>,
  );

  expect(screen.getByText('Monsters · tier 5')).toBeTruthy();
  expect(screen.getByText('Mercenaries · tier 6')).toBeTruthy();
  expect(screen.getByText(`${FIRE_ELEMENTAL.name}, tier 5, on`)).toBeTruthy();
});
