// @vitest-environment jsdom
import { Button } from '@mantine/core';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';

import { closeOpenEditors } from './openEditors';
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
        footer={<Button>Leave out</Button>}
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
  expect(screen.getByRole('button', { name: 'Leave out' })).toBeTruthy();
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

test('the march shortcut closes it: a sheet is a setup editor, and it is over the answer', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  await user.click(screen.getByRole('button', { name: 'Edit the unit' }));
  await screen.findByRole('dialog');

  // What `Ctrl`/`⌘ + Enter` does before it generates (`shell/useGenerateRun.ts`).
  act(() => {
    expect(closeOpenEditors()).toBe(true);
  });

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  expect(closeOpenEditors()).toBe(false);
});

test('Enter walks the sheet’s fields, and on the last one does what the sheet’s button does', async () => {
  // Owner, 2026-10-02: *"same in popup, validate on entry."* A figure is written as it is typed, so
  // Enter's job is to move on — to the next field, then out.
  const onEnter = vi.fn();
  renderWithTheme(
    <Sheet opened onClose={() => {}} onEnter={onEnter} title="Recovery">
      <input aria-label="Hospital" />
      <input aria-label="Temple" />
    </Sheet>,
  );
  const first = await screen.findByLabelText('Hospital');
  fireEvent.keyDown(first, { key: 'Enter' });
  expect(document.activeElement).toBe(screen.getByLabelText('Temple'));
  expect(onEnter).not.toHaveBeenCalled();

  fireEvent.keyDown(screen.getByLabelText('Temple'), { key: 'Enter' });
  expect(onEnter).toHaveBeenCalledTimes(1);
});
