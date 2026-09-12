// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { Switch } from './Switch';

afterEach(cleanup);

function KeepSwitch({ isDisabled = false }: { isDisabled?: boolean }) {
  const [isSelected, setSelected] = useState(false);
  return (
    <Switch
      label="Keep this unit"
      description="It stays in every march"
      isSelected={isSelected}
      onChange={setSelected}
      isDisabled={isDisabled}
    />
  );
}

test('Switch is found by its label and reports the state it is in', () => {
  render(<KeepSwitch />);
  const control = screen.getByRole('switch', { name: 'Keep this unit' });
  expect((control as HTMLInputElement).checked).toBe(false);

  fireEvent.click(control);
  expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true);
});

test('Switch hands its description to a screen reader', () => {
  render(<KeepSwitch />);
  const describedBy = screen.getByRole('switch').getAttribute('aria-describedby') ?? '';
  expect(document.getElementById(describedBy)?.textContent).toBe('It stays in every march');
});

test('a disabled Switch cannot be turned on', () => {
  render(<KeepSwitch isDisabled />);
  const control = screen.getByRole('switch');
  fireEvent.click(control);
  expect((control as HTMLInputElement).checked).toBe(false);
});
