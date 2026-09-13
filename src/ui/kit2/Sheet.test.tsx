// @vitest-environment jsdom
import { Button } from '@mantine/core';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { Sheet } from './Sheet';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

function Example() {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpened(true);
        }}
      >
        Edit the unit
      </Button>
      <Sheet
        opened={opened}
        onClose={() => {
          setOpened(false);
        }}
        title="Archer III"
        description="Guardsmen · tier 3"
        footer={<Button>Keep in march</Button>}
      >
        <p>Stats and bonuses</p>
      </Sheet>
    </>
  );
}

test('the sheet is a dialog named by its title, with the description, the body and the footer', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  await user.click(screen.getByRole('button', { name: 'Edit the unit' }));

  const dialog = await screen.findByRole('dialog', { name: 'Archer III' });
  expect(dialog).toBeTruthy();
  expect(screen.getByText('Guardsmen · tier 3')).toBeTruthy();
  expect(screen.getByText('Stats and bonuses')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Keep in march' })).toBeTruthy();
});

test('Escape closes the sheet and gives focus back to what opened it', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  const trigger = screen.getByRole('button', { name: 'Edit the unit' });
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

test('the close button closes it too', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  await user.click(screen.getByRole('button', { name: 'Edit the unit' }));
  await screen.findByRole('dialog');
  await user.click(screen.getByRole('button', { name: /close/i }));
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
