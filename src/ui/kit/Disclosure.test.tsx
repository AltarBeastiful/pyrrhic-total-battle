// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';

import { Disclosure } from './Disclosure';

afterEach(cleanup);

function pressKey(element: Element, key: string) {
  return act(async () => {
    fireEvent.keyDown(element, { key });
    fireEvent.keyUp(element, { key });
  });
}

function Example() {
  return (
    <Disclosure title="Bonuses" summary="Health +312 % · Strength +198 %">
      <p>Every bonus, one by one.</p>
    </Disclosure>
  );
}

test('the collapsed line keeps the summary visible and is announced as collapsed', () => {
  render(<Example />);

  const trigger = screen.getByRole('button', { name: /Bonuses/ });
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  expect(screen.getByText('Health +312 % · Strength +198 %')).toBeTruthy();
});

test('a press opens the panel and a second press closes it', async () => {
  render(<Example />);
  const trigger = screen.getByRole('button', { name: /Bonuses/ });

  fireEvent.click(trigger);
  await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('true'));
  expect(screen.getByText('Every bonus, one by one.')).toBeTruthy();

  fireEvent.click(trigger);
  await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'));
});

test('Enter and Space toggle the disclosure from the keyboard', async () => {
  render(<Example />);
  const trigger = screen.getByRole('button', { name: /Bonuses/ });

  await pressKey(trigger, 'Enter');
  expect(trigger.getAttribute('aria-expanded')).toBe('true');

  await pressKey(trigger, ' ');
  expect(trigger.getAttribute('aria-expanded')).toBe('false');

  await pressKey(trigger, ' ');
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
});

test('defaultExpanded opens it on first render', () => {
  render(
    <Disclosure title="Battle story" defaultExpanded>
      <p>Round one</p>
    </Disclosure>,
  );

  expect(screen.getByRole('button', { name: /Battle story/ }).getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByText('Round one')).toBeTruthy();
});

test('it can be driven from the outside', async () => {
  const onExpandedChange = vi.fn();

  function Controlled() {
    const [isExpanded, setExpanded] = useState(false);
    return (
      <Disclosure
        title="March"
        isExpanded={isExpanded}
        onExpandedChange={(next) => {
          onExpandedChange(next);
          setExpanded(next);
        }}
      >
        <p>The table</p>
      </Disclosure>
    );
  }

  render(<Controlled />);
  const trigger = screen.getByRole('button', { name: /March/ });

  await pressKey(trigger, 'Enter');
  expect(onExpandedChange).toHaveBeenCalledWith(true);
  await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('true'));
});

test('a disabled disclosure does not open', () => {
  render(
    <Disclosure title="Sync" isDisabled>
      <p>Hidden</p>
    </Disclosure>,
  );
  const trigger = screen.getByRole('button', { name: /Sync/ });

  fireEvent.click(trigger);
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
});
