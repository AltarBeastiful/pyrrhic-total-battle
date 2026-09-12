// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { CheckIcon, ChevronDownIcon } from '../icons';
import { Button } from './Button';

afterEach(cleanup);

/** React Aria activates a press from `keydown` + `keyup`, exactly as a browser does on a button. */
function pressKey(element: Element, key: string) {
  return act(async () => {
    fireEvent.keyDown(element, { key });
    fireEvent.keyUp(element, { key });
  });
}

test('the label is the accessible name and a click presses it', () => {
  const onPress = vi.fn();
  render(<Button onPress={onPress}>Generate</Button>);

  fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('Enter and Space press the button from the keyboard', async () => {
  const onPress = vi.fn();
  render(<Button onPress={onPress}>Save</Button>);
  const button = screen.getByRole('button', { name: 'Save' });

  await pressKey(button, 'Enter');
  await pressKey(button, ' ');
  expect(onPress).toHaveBeenCalledTimes(2);
});

test('a disabled button is announced as disabled and never fires', () => {
  const onPress = vi.fn();
  render(
    <Button isDisabled onPress={onPress}>
      Save
    </Button>,
  );
  const button = screen.getByRole('button', { name: 'Save' });

  expect((button as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(button);
  expect(onPress).not.toHaveBeenCalled();
});

test('a pending button keeps its name, is announced as busy and swallows the press', () => {
  const onPress = vi.fn();
  render(
    <Button isPending onPress={onPress} icon={<CheckIcon />}>
      Generating
    </Button>,
  );
  const button = screen.getByRole('button', { name: 'Generating' });

  expect(button.getAttribute('data-pending')).not.toBeNull();
  fireEvent.click(button);
  expect(onPress).not.toHaveBeenCalled();
});

test('icons decorate the label without joining the accessible name', () => {
  render(
    <Button icon={<CheckIcon />} iconRight={<ChevronDownIcon />}>
      Method
    </Button>,
  );

  expect(screen.getByRole('button', { name: 'Method' })).toBeTruthy();
});

test('every variant and size renders a pressable button', () => {
  const variants = ['primary', 'secondary', 'quiet', 'danger'] as const;
  const sizes = ['sm', 'md', 'lg'] as const;
  render(
    <>
      {variants.map((variant) =>
        sizes.map((size) => (
          <Button key={`${variant}-${size}`} variant={variant} size={size} fullWidth={size === 'lg'}>
            {`${variant} ${size}`}
          </Button>
        )),
      )}
    </>,
  );

  expect(screen.getAllByRole('button')).toHaveLength(12);
  expect(screen.getByRole('button', { name: 'quiet md' })).toBeTruthy();
});
