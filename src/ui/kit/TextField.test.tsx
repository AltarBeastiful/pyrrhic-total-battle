// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { TextField } from './TextField';

afterEach(cleanup);

function ProfileName({ errorMessage }: { errorMessage?: string }) {
  const [value, setValue] = useState('Main');
  return (
    <>
      <TextField
        label="Profile name"
        value={value}
        onChange={setValue}
        description="Shown in the account menu"
        {...(errorMessage === undefined ? {} : { errorMessage })}
      />
      <output>{value === '' ? 'empty' : value}</output>
    </>
  );
}

test('TextField is named by its visible label and reports what is typed', () => {
  render(<ProfileName />);
  const input = screen.getByRole('textbox', { name: 'Profile name' });

  fireEvent.change(input, { target: { value: 'Alt army' } });
  expect(screen.getByRole('status').textContent).toBe('Alt army');
});

test('TextField hands its description to a screen reader', () => {
  render(<ProfileName />);
  const describedBy =
    screen.getByRole('textbox', { name: 'Profile name' }).getAttribute('aria-describedby') ?? '';
  const text = describedBy
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
  expect(text).toContain('Shown in the account menu');
});

test('an error message marks the field invalid and is read with it', () => {
  render(<ProfileName errorMessage="That name is taken" />);
  const input = screen.getByRole('textbox', { name: 'Profile name' });
  expect(input.getAttribute('aria-invalid')).toBe('true');

  const describedBy = input.getAttribute('aria-describedby') ?? '';
  const text = describedBy
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
  expect(text).toContain('That name is taken');
});
