// @vitest-environment jsdom
import { Button } from '@mantine/core';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { Dialog } from './Dialog';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

function Example({ role = 'dialog' }: { role?: 'dialog' | 'alertdialog' }) {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpened(true);
        }}
      >
        Reset everything
      </Button>
      <Dialog
        opened={opened}
        onClose={() => {
          setOpened(false);
        }}
        title="Reset the setup?"
        description="Every tier, mercenary and bonus goes back to its default."
        role={role}
        footer={<Button>Reset</Button>}
      >
        <p>This cannot be undone.</p>
      </Dialog>
    </>
  );
}

test('it opens as a dialog named by its title', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  await user.click(screen.getByRole('button', { name: 'Reset everything' }));
  expect(await screen.findByRole('dialog', { name: 'Reset the setup?' })).toBeTruthy();
  expect(screen.getByText('This cannot be undone.')).toBeTruthy();
});

test('Escape closes the plain dialog and returns focus to the trigger', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  const trigger = screen.getByRole('button', { name: 'Reset everything' });
  trigger.focus();
  await user.click(trigger);
  await screen.findByRole('dialog');
  await user.keyboard('{Escape}');
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  await waitFor(() => {
    expect(document.activeElement).toBe(trigger);
  });
});

test('the alertdialog variant carries the role and refuses to be dismissed by Escape', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example role="alertdialog" />);
  await user.click(screen.getByRole('button', { name: 'Reset everything' }));
  const dialog = await screen.findByRole('alertdialog', { name: 'Reset the setup?' });
  expect(dialog).toBeTruthy();

  await user.keyboard('{Escape}');
  expect(screen.getByRole('alertdialog')).toBeTruthy();
});
