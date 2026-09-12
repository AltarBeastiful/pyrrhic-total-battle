// @vitest-environment jsdom
/**
 * The captain tile has two targets and they must stay apart: the body enlists, the badge edits, and
 * a player correcting a level never discovers they also changed who marches (design plan §7.3, D-33).
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { CaptainTile } from './CaptainTile';

afterEach(cleanup);

test('the body is a toggle whose name says the captain and its state', async () => {
  const onEnlist = vi.fn();
  const { rerender } = render(
    <CaptainTile name="Beowulf" bonusKey="army" meta="Army" isEnlisted={false} onEnlist={onEnlist} />,
  );

  const body = screen.getByRole('button', { name: 'Enlist Beowulf' });
  expect(body.getAttribute('aria-pressed')).toBe('false');
  await userEvent.click(body);
  expect(onEnlist).toHaveBeenCalledTimes(1);

  rerender(<CaptainTile name="Beowulf" bonusKey="army" meta="Army" isEnlisted onEnlist={onEnlist} />);
  const enlisted = screen.getByRole('button', { name: 'Beowulf, enlisted' });
  expect(enlisted.getAttribute('aria-pressed')).toBe('true');
});

test('the badge is its own button and never toggles enlistment', async () => {
  const onEnlist = vi.fn();
  const onPress = vi.fn();
  render(
    <CaptainTile
      name="Aydae"
      bonusKey="guardsmen"
      meta="Guardsmen"
      isEnlisted={false}
      onEnlist={onEnlist}
      badge={{ text: 'Set level', isSet: false, onPress }}
    />,
  );

  await userEvent.click(screen.getByRole('button', { name: 'Set Aydae’s level' }));

  expect(onPress).toHaveBeenCalledTimes(1);
  expect(onEnlist).not.toHaveBeenCalled();
});

test('a badge carrying a level is spoken as a change, and draws the level and the stars', () => {
  render(
    <CaptainTile
      name="Beowulf"
      bonusKey="army"
      meta="Army"
      isEnlisted
      onEnlist={vi.fn()}
      badge={{ text: '20 ★3', isSet: true, onPress: vi.fn() }}
    />,
  );

  expect(screen.getByRole('button', { name: 'Change Beowulf’s level' }).textContent).toBe('20 ★3');
});

test('a tile with nothing to set has no badge, and says so on its meta line', () => {
  render(<CaptainTile name="Tengel" meta="No stack bonus" isEnlisted={false} onEnlist={vi.fn()} />);

  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(screen.getByText('No stack bonus')).toBeTruthy();
});

test('a badge can name itself, for a tile whose badge is not a level', async () => {
  const onPress = vi.fn();
  render(
    <CaptainTile
      name="Svyatogor"
      bonusKey="army"
      meta="Army"
      isEnlisted
      onEnlist={vi.fn()}
      badge={{ text: 'Change hero', isSet: true, label: 'Change the hero', onPress }}
    />,
  );

  await userEvent.click(screen.getByRole('button', { name: 'Change the hero' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('the body reaches its press from the keyboard', async () => {
  const onEnlist = vi.fn();
  render(
    <CaptainTile name="Skadi" bonusKey="guardsmen" meta="Guardsmen" isEnlisted={false} onEnlist={onEnlist} />,
  );

  await userEvent.tab();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Enlist Skadi' }));
  await userEvent.keyboard('{Enter}');
  expect(onEnlist).toHaveBeenCalledTimes(1);
});
