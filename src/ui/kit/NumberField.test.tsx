// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';

import { NumberField } from './NumberField';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

function Field({
  onChange,
  allowEmpty = false,
}: {
  onChange?: (v: number | null) => void;
  allowEmpty?: boolean;
}) {
  const [value, setValue] = useState<number | null>(1200);
  return (
    <NumberField
      label="Leadership"
      value={value}
      allowEmpty={allowEmpty}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

test('the field is named by its label and writes the figure with a space every three digits', () => {
  renderWithTheme(<NumberField label="Leadership" value={84300} onChange={() => {}} />);
  const input = screen.getByRole('textbox', { name: 'Leadership' }) as HTMLInputElement;
  expect(input.value).toBe('84 300');
});

test('landing in the field selects what is there, so typing replaces it', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Field />);
  const input = screen.getByRole('textbox', { name: 'Leadership' }) as HTMLInputElement;
  await user.click(input);
  expect(input.selectionStart).toBe(0);
  expect(input.selectionEnd).toBe(input.value.length);
});

test('"84 300" and "84,300" both reach the caller as 84300', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  renderWithTheme(<Field onChange={onChange} />);
  const input = screen.getByRole('textbox', { name: 'Leadership' });

  await user.clear(input);
  await user.type(input, '84 300');
  expect(onChange).toHaveBeenLastCalledWith(84300);

  await user.clear(input);
  await user.type(input, '84,300');
  expect(onChange).toHaveBeenLastCalledWith(84300);
});

test('an emptied field reports null when it is allowed to be empty, and the minimum otherwise', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const { unmount } = renderWithTheme(<Field onChange={onChange} allowEmpty />);
  await user.clear(screen.getByRole('textbox', { name: 'Leadership' }));
  expect(onChange).toHaveBeenLastCalledWith(null);
  unmount();

  const second = vi.fn();
  renderWithTheme(<Field onChange={second} />);
  await user.clear(screen.getByRole('textbox', { name: 'Leadership' }));
  expect(second).toHaveBeenLastCalledWith(0);
});
