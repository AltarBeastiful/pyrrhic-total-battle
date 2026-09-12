// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { Button } from './Button';
import { Sheet } from './Sheet';

afterEach(cleanup);

function open(name: string) {
  const trigger = screen.getByRole('button', { name });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

function escape(element: Element) {
  return act(async () => {
    fireEvent.keyDown(element, { key: 'Escape' });
    fireEvent.keyUp(element, { key: 'Escape' });
  });
}

function Example() {
  return (
    <Sheet
      trigger={<Button>Edit the unit</Button>}
      title="Archer 3"
      description="Guardsmen · tier 3"
      footer={<Button variant="primary">Keep in march</Button>}
    >
      <p>Stats and bonuses</p>
    </Sheet>
  );
}

test('the trigger opens a dialog named by its title, with the description and the body', async () => {
  render(<Example />);
  open('Edit the unit');

  const dialog = await screen.findByRole('dialog', { name: 'Archer 3' });
  expect(dialog).toBeTruthy();
  expect(screen.getByText('Guardsmen · tier 3')).toBeTruthy();
  expect(screen.getByText('Stats and bonuses')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Keep in march' })).toBeTruthy();
});

test('the visible Close button closes the sheet and returns focus to the trigger', async () => {
  render(<Example />);
  const trigger = open('Edit the unit');
  await screen.findByRole('dialog');

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));

  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

test('Esc closes the sheet and returns focus to the trigger', async () => {
  render(<Example />);
  const trigger = open('Edit the unit');
  const dialog = await screen.findByRole('dialog');

  await escape(dialog);

  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

function Controlled() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Open the editor</Button>
      <Sheet isOpen={isOpen} onOpenChange={setIsOpen} title="Custom mercenary" size="lg">
        <p>Fields go here</p>
      </Sheet>
      <output>{isOpen ? 'open' : 'closed'}</output>
    </>
  );
}

test('it can be driven from the outside with isOpen and onOpenChange', async () => {
  render(<Controlled />);
  expect(screen.getByRole('status').textContent).toBe('closed');

  fireEvent.click(screen.getByRole('button', { name: 'Open the editor' }));
  const dialog = await screen.findByRole('dialog', { name: 'Custom mercenary' });

  await escape(dialog);
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('closed'));
});
