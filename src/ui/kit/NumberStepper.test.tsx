// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { NumberStepper } from './NumberStepper';

afterEach(cleanup);

/** Type one character at a time, as a player does: a rejected character never reaches the field. */
function typeInto(input: HTMLInputElement, text: string) {
  for (const character of text) {
    fireEvent.change(input, { target: { value: input.value + character } });
  }
}

function Leadership({
  start = 10,
  allowEmpty = false,
  max = 1000000,
}: {
  start?: number | null;
  allowEmpty?: boolean;
  max?: number;
}) {
  const [value, setValue] = useState<number | null>(start);
  return (
    <>
      <NumberStepper
        label="Leadership"
        value={value}
        onChange={setValue}
        min={0}
        max={max}
        allowEmpty={allowEmpty}
        description="How many troops you can lead"
      />
      <output>{value === null ? 'empty' : String(value)}</output>
    </>
  );
}

function shown(): string {
  return screen.getByRole('status').textContent ?? '';
}

test('NumberStepper is named by its label and stepped by its buttons', () => {
  render(<Leadership />);
  expect(screen.getByLabelText('Leadership')).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Increase Leadership' }));
  expect(shown()).toBe('11');

  fireEvent.click(screen.getByRole('button', { name: 'Decrease Leadership' }));
  expect(shown()).toBe('10');
});

test('arrow keys step by one, Shift by ten and Ctrl by a hundred', () => {
  render(<Leadership />);
  const input = screen.getByLabelText('Leadership');

  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(shown()).toBe('11');

  fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });
  expect(shown()).toBe('21');

  fireEvent.keyDown(input, { key: 'ArrowUp', ctrlKey: true });
  expect(shown()).toBe('121');

  fireEvent.keyDown(input, { key: 'ArrowDown', shiftKey: true });
  expect(shown()).toBe('111');

  fireEvent.keyDown(input, { key: 'ArrowDown', metaKey: true });
  expect(shown()).toBe('11');
});

test('the modifier jumps stay inside the range', () => {
  render(<Leadership start={5} max={50} />);
  const input = screen.getByLabelText('Leadership');

  fireEvent.keyDown(input, { key: 'ArrowDown', ctrlKey: true });
  expect(shown()).toBe('0');

  fireEvent.keyDown(input, { key: 'ArrowUp', ctrlKey: true });
  expect(shown()).toBe('50');
});

test('a grouped number is parsed whichever way it is typed', () => {
  render(<Leadership start={0} />);
  const input = screen.getByLabelText('Leadership') as HTMLInputElement;

  fireEvent.change(input, { target: { value: '' } });
  typeInto(input, '84 300');
  fireEvent.blur(input);
  expect(shown()).toBe('84300');

  fireEvent.change(input, { target: { value: '' } });
  typeInto(input, '84,300');
  fireEvent.blur(input);
  expect(shown()).toBe('84300');

  fireEvent.change(input, { target: { value: '' } });
  typeInto(input, '84300');
  fireEvent.blur(input);
  expect(shown()).toBe('84300');
});

test('allowEmpty reports an empty field as nothing rather than as zero', () => {
  render(<Leadership allowEmpty />);
  const input = screen.getByLabelText('Leadership');

  fireEvent.change(input, { target: { value: '' } });
  fireEvent.blur(input);
  expect(shown()).toBe('empty');
});

test('without allowEmpty the last value comes back when the field is emptied', () => {
  render(<Leadership />);
  const input = screen.getByLabelText('Leadership');

  fireEvent.change(input, { target: { value: '' } });
  fireEvent.blur(input);
  expect(shown()).toBe('10');
});

test('NumberStepper hands its description to a screen reader', () => {
  render(<Leadership />);
  const describedBy = screen.getByLabelText('Leadership').getAttribute('aria-describedby') ?? '';
  const text = describedBy
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
  expect(text).toContain('How many troops you can lead');
});
