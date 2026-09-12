// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { Button } from './Button';
import { OptionList } from './OptionList';
import type { OptionListItem } from './OptionList';

afterEach(cleanup);

const METHODS: OptionListItem[] = [
  {
    value: 'elite',
    title: 'Tier ladder',
    description: 'Your cheapest, lowest-tier stacks take the hits first.',
  },
  { value: 'ms', title: 'Troops first', description: 'Hired units only fall after all your troops.' },
  { value: 'custom', title: 'Your own order', description: 'You decide which stack falls first.' },
];

function Methods({
  collapsible = false,
  trailing = false,
  disabled = false,
}: {
  collapsible?: boolean;
  trailing?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('elite');
  const [edits, setEdits] = useState(0);
  const options = METHODS.map((option) =>
    option.value === 'custom'
      ? {
          ...option,
          ...(disabled ? { isDisabled: true } : {}),
          ...(trailing
            ? {
                trailing: (
                  <Button
                    size="sm"
                    onPress={() => {
                      setEdits((count) => count + 1);
                    }}
                  >
                    Edit order
                  </Button>
                ),
              }
            : {}),
        }
      : option,
  );
  return (
    <>
      <OptionList
        label="Stacking method"
        value={value}
        onChange={setValue}
        options={options}
        collapsible={collapsible}
      />
      <output>{`${value} ${String(edits)}`}</output>
    </>
  );
}

const shown = (): string => screen.getByRole('status').textContent ?? '';

test('OptionList is a named radio group whose rows are named by their title alone', () => {
  render(<Methods />);
  const group = screen.getByRole('radiogroup', { name: 'Stacking method' });
  expect(group).toBeDefined();

  const chosen = screen.getByRole('radio', { name: 'Tier ladder' });
  expect((chosen as HTMLInputElement).checked).toBe(true);
  expect((screen.getByRole('radio', { name: 'Troops first' }) as HTMLInputElement).checked).toBe(false);

  // The supporting text is the row's description, not part of its name.
  const describedBy = chosen.getAttribute('aria-describedby') ?? '';
  expect(document.getElementById(describedBy)?.textContent).toBe(
    'Your cheapest, lowest-tier stacks take the hits first.',
  );
});

test('pressing anywhere on a row chooses it, supporting text included', async () => {
  const user = userEvent.setup();
  render(<Methods />);

  await user.click(screen.getByText('Hired units only fall after all your troops.'));
  expect(shown()).toBe('ms 0');
  expect((screen.getByRole('radio', { name: 'Troops first' }) as HTMLInputElement).checked).toBe(true);
});

test('the arrow keys move the choice down and up the list', () => {
  render(<Methods />);
  const first = screen.getByRole('radio', { name: 'Tier ladder' });
  first.focus();

  fireEvent.keyDown(first, { key: 'ArrowDown' });
  expect(shown()).toBe('ms 0');

  fireEvent.keyDown(screen.getByRole('radio', { name: 'Troops first' }), { key: 'ArrowUp' });
  expect(shown()).toBe('elite 0');
});

test('a trailing control is its own target and never moves the choice', async () => {
  const user = userEvent.setup();
  render(<Methods trailing />);

  await user.click(screen.getByRole('button', { name: 'Edit order' }));
  expect(shown()).toBe('elite 1');
  expect((screen.getByRole('radio', { name: 'Your own order' }) as HTMLInputElement).checked).toBe(false);
});

test('a disabled option cannot be chosen', async () => {
  const user = userEvent.setup();
  render(<Methods disabled />);

  await user.click(screen.getByRole('radio', { name: 'Your own order' }));
  expect(shown()).toBe('elite 0');
});

test('collapsible shows the chosen row alone until Change unfolds the list', async () => {
  const user = userEvent.setup();
  render(<Methods collapsible />);

  expect(screen.getAllByRole('radio')).toHaveLength(1);
  expect(screen.getByRole('radio', { name: 'Tier ladder' })).toBeDefined();

  await user.click(screen.getByRole('button', { name: 'Change Stacking method' }));
  expect(screen.getAllByRole('radio')).toHaveLength(3);

  // Choosing folds the list back around the new answer.
  await user.click(screen.getByRole('radio', { name: 'Troops first' }));
  expect(shown()).toBe('ms 0');
  expect(screen.getAllByRole('radio')).toHaveLength(1);
  expect(screen.getByRole('radio', { name: 'Troops first' })).toBeDefined();
});
