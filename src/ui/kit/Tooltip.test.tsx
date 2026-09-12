// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { PinIcon } from '../icons';
import { IconButton } from './IconButton';
import { Tooltip } from './Tooltip';

afterEach(cleanup);

function Example() {
  return (
    <Tooltip content="Pin this unit">
      <IconButton label="Pin this unit">
        <PinIcon />
      </IconButton>
    </Tooltip>
  );
}

test('the tip is absent until the trigger is used', () => {
  render(<Example />);

  expect(screen.queryByRole('tooltip')).toBeNull();
});

test('keyboard focus shows the tip at once and Esc hides it', async () => {
  render(<Example />);
  const trigger = screen.getByRole('button', { name: 'Pin this unit' });

  await act(async () => {
    trigger.focus();
    fireEvent.focus(trigger);
  });
  const tip = await screen.findByRole('tooltip');
  expect(tip.textContent).toBe('Pin this unit');

  await act(async () => {
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    fireEvent.keyUp(document.activeElement ?? document.body, { key: 'Escape' });
  });
  await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
});

test('blurring the trigger hides the tip again', async () => {
  render(<Example />);
  const trigger = screen.getByRole('button', { name: 'Pin this unit' });

  await act(async () => {
    trigger.focus();
    fireEvent.focus(trigger);
  });
  await screen.findByRole('tooltip');

  await act(async () => {
    trigger.blur();
    fireEvent.blur(trigger);
  });
  await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
});
