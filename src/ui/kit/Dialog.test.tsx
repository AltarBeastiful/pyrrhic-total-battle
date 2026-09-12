// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { Button } from './Button';
import { Dialog } from './Dialog';

afterEach(cleanup);

function open(name: string) {
  const trigger = screen.getByRole('button', { name });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

test('the title names the dialog and the footer holds its actions', async () => {
  const onConfirm = vi.fn();
  render(
    <Dialog
      trigger={<Button>Delete profile</Button>}
      title="Delete this profile?"
      description="This cannot be undone."
      footer={
        <Button variant="danger" onPress={onConfirm}>
          Delete
        </Button>
      }
    >
      <p>Aydael and its 4 saved marches go with it.</p>
    </Dialog>,
  );
  open('Delete profile');

  expect(await screen.findByRole('dialog', { name: 'Delete this profile?' })).toBeTruthy();
  expect(screen.getByText('This cannot be undone.')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

test('role="alertdialog" is announced as an alert dialog', async () => {
  render(
    <Dialog trigger={<Button>Reset</Button>} title="Reset everything?" role="alertdialog">
      <p>Nothing can be recovered.</p>
    </Dialog>,
  );
  open('Reset');

  expect(await screen.findByRole('alertdialog', { name: 'Reset everything?' })).toBeTruthy();
});

test('Esc closes the dialog and focus returns to the trigger', async () => {
  render(
    <Dialog trigger={<Button>About</Button>} title="About Pyrrhic">
      <p>Version 0</p>
    </Dialog>,
  );
  const trigger = open('About');
  const dialog = await screen.findByRole('dialog');

  await act(async () => {
    fireEvent.keyDown(dialog, { key: 'Escape' });
    fireEvent.keyUp(dialog, { key: 'Escape' });
  });

  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

test('the Close button closes the dialog', async () => {
  render(
    <Dialog trigger={<Button>About</Button>} title="About Pyrrhic">
      <p>Version 0</p>
    </Dialog>,
  );
  open('About');
  await screen.findByRole('dialog');

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
