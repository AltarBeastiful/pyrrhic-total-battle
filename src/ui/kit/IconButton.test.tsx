// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { CloseIcon, PinIcon } from '../icons';
import { IconButton } from './IconButton';

afterEach(cleanup);

test('the required label is the only accessible name of a glyph-only button', () => {
  render(
    <IconButton label="Close the sheet">
      <CloseIcon />
    </IconButton>,
  );

  expect(screen.getByRole('button', { name: 'Close the sheet' })).toBeTruthy();
});

test('it presses with the pointer and with the keyboard', async () => {
  const onPress = vi.fn();
  render(
    <IconButton label="Pin this unit" onPress={onPress}>
      <PinIcon />
    </IconButton>,
  );
  const button = screen.getByRole('button', { name: 'Pin this unit' });

  fireEvent.click(button);
  await act(async () => {
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyUp(button, { key: 'Enter' });
  });
  expect(onPress).toHaveBeenCalledTimes(2);
});

test('both sizes and both variants render', () => {
  render(
    <>
      <IconButton label="quiet sm" size="sm" variant="quiet">
        <PinIcon />
      </IconButton>
      <IconButton label="secondary md" size="md" variant="secondary">
        <PinIcon />
      </IconButton>
    </>,
  );

  expect(screen.getAllByRole('button')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'secondary md' })).toBeTruthy();
});

test('a disabled icon button does not fire', () => {
  const onPress = vi.fn();
  render(
    <IconButton label="Pin" isDisabled onPress={onPress}>
      <PinIcon />
    </IconButton>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
  expect(onPress).not.toHaveBeenCalled();
});
