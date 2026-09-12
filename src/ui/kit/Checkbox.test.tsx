// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { Checkbox } from './Checkbox';

afterEach(cleanup);

function OwnedCheckbox({ isDisabled = false }: { isDisabled?: boolean }) {
  const [isSelected, setSelected] = useState(false);
  return (
    <Checkbox
      label="I own this unit"
      isSelected={isSelected}
      onChange={setSelected}
      isDisabled={isDisabled}
    />
  );
}

test('Checkbox is found by its label and ticks on press', () => {
  render(<OwnedCheckbox />);
  const box = screen.getByRole('checkbox', { name: 'I own this unit' });
  expect((box as HTMLInputElement).checked).toBe(false);

  fireEvent.click(box);
  expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
});

test('Checkbox shows a mixed state without becoming a third value', () => {
  render(<Checkbox label="Every guardsman" isSelected={false} onChange={() => {}} isIndeterminate />);
  const box = screen.getByRole('checkbox', { name: 'Every guardsman' });
  expect((box as HTMLInputElement).indeterminate).toBe(true);
});

test('a disabled Checkbox cannot be ticked', () => {
  render(<OwnedCheckbox isDisabled />);
  const box = screen.getByRole('checkbox');
  fireEvent.click(box);
  expect((box as HTMLInputElement).checked).toBe(false);
});
