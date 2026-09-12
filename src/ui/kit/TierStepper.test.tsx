// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { TierStepper } from './TierStepper';

afterEach(cleanup);

const TIERS = [1, 2, 3, 4, 5];

function Guardsmen({
  start = 2,
  allowNone = false,
  min = 1,
  max = 5,
}: {
  start?: number | null;
  allowNone?: boolean;
  min?: number;
  max?: number;
}) {
  const [value, setValue] = useState<number | null>(start);
  return (
    <>
      <TierStepper
        label="Guardsmen from"
        prefix="G"
        tiers={TIERS}
        value={value}
        onChange={setValue}
        allowNone={allowNone}
        min={min}
        max={max}
      />
      <output>{value === null ? 'none' : String(value)}</output>
    </>
  );
}

function shown(): string {
  return screen.getByRole('status').textContent ?? '';
}

test('TierStepper shows the tier as its letter and number and steps with its buttons', () => {
  render(<Guardsmen />);
  const group = screen.getByRole('group', { name: 'Guardsmen from' });
  expect(within(group).getByRole('button', { name: 'G2' })).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Guardsmen from, higher' }));
  expect(shown()).toBe('3');
  expect(screen.getByRole('button', { name: 'G3' })).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Guardsmen from, lower' }));
  expect(shown()).toBe('2');
});

test('the arrow keys step the tier in both orientations', () => {
  render(<Guardsmen />);
  const group = screen.getByRole('group', { name: 'Guardsmen from' });

  fireEvent.keyDown(group, { key: 'ArrowRight' });
  expect(shown()).toBe('3');

  fireEvent.keyDown(group, { key: 'ArrowUp' });
  expect(shown()).toBe('4');

  fireEvent.keyDown(group, { key: 'ArrowLeft' });
  expect(shown()).toBe('3');

  fireEvent.keyDown(group, { key: 'ArrowDown' });
  expect(shown()).toBe('2');
});

test('TierStepper never leaves the bounds it was given', () => {
  render(<Guardsmen start={3} min={2} max={4} />);
  const group = screen.getByRole('group', { name: 'Guardsmen from' });

  fireEvent.keyDown(group, { key: 'ArrowLeft' });
  fireEvent.keyDown(group, { key: 'ArrowLeft' });
  fireEvent.keyDown(group, { key: 'ArrowLeft' });
  expect(shown()).toBe('2');
  expect(screen.getByRole('button', { name: 'Guardsmen from, lower' }).hasAttribute('disabled')).toBe(true);

  fireEvent.keyDown(group, { key: 'ArrowRight' });
  fireEvent.keyDown(group, { key: 'ArrowRight' });
  fireEvent.keyDown(group, { key: 'ArrowRight' });
  expect(shown()).toBe('4');
  expect(screen.getByRole('button', { name: 'Guardsmen from, higher' }).hasAttribute('disabled')).toBe(true);
});

test('allowNone adds a position below the first tier', () => {
  render(<Guardsmen start={1} allowNone />);
  const group = screen.getByRole('group', { name: 'Guardsmen from' });

  fireEvent.keyDown(group, { key: 'ArrowLeft' });
  expect(shown()).toBe('none');
  expect(screen.getByRole('button', { name: 'none' })).toBeDefined();

  fireEvent.keyDown(group, { key: 'ArrowLeft' });
  expect(shown()).toBe('none');

  fireEvent.keyDown(group, { key: 'ArrowRight' });
  expect(shown()).toBe('1');
});

test('pressing the value opens a strip of every tier for a direct jump', async () => {
  render(<Guardsmen />);
  fireEvent.click(screen.getByRole('button', { name: 'G2' }));

  const strip = await screen.findByRole('dialog');
  expect(within(strip).getByRole('radio', { name: 'G2' }).getAttribute('aria-checked')).toBe('true');

  fireEvent.click(within(strip).getByRole('radio', { name: 'G5' }));
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  expect(shown()).toBe('5');
});
