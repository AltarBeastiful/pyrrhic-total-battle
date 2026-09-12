// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { InfoIcon } from '../icons';
import { IconButton } from './IconButton';
import { Popover } from './Popover';

afterEach(cleanup);

function Example() {
  return (
    <Popover
      label="How the tier ladder works"
      trigger={
        <IconButton label="What is this?">
          <InfoIcon />
        </IconButton>
      }
    >
      <p>The ladder walks tiers from the top down.</p>
    </Popover>
  );
}

test('pressing the trigger opens a named panel', async () => {
  render(<Example />);
  const trigger = screen.getByRole('button', { name: 'What is this?' });
  trigger.focus();
  fireEvent.click(trigger);

  expect(await screen.findByRole('dialog', { name: 'How the tier ladder works' })).toBeTruthy();
  expect(screen.getByText('The ladder walks tiers from the top down.')).toBeTruthy();
});

test('Esc closes the panel and focus returns to the trigger', async () => {
  render(<Example />);
  const trigger = screen.getByRole('button', { name: 'What is this?' });
  trigger.focus();
  fireEvent.click(trigger);
  const panel = await screen.findByRole('dialog');

  await act(async () => {
    fireEvent.keyDown(panel, { key: 'Escape' });
    fireEvent.keyUp(panel, { key: 'Escape' });
  });

  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

test('nothing is in the document before the trigger is pressed', () => {
  render(<Example />);

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByText('The ladder walks tiers from the top down.')).toBeNull();
});
