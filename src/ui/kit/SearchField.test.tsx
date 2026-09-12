// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';

import { SearchField } from './SearchField';

afterEach(cleanup);

function Finder({ onClear }: { onClear?: () => void }) {
  const [value, setValue] = useState('');
  return (
    <>
      <SearchField
        label="Find a mercenary"
        value={value}
        onChange={setValue}
        placeholder="Name or code"
        {...(onClear === undefined ? {} : { onClear })}
      />
      <output>{value === '' ? 'empty' : value}</output>
    </>
  );
}

function shown(): string {
  return screen.getByRole('status').textContent ?? '';
}

test('SearchField is named by its visible label, not by its placeholder', () => {
  render(<Finder />);
  const input = screen.getByRole('searchbox', { name: 'Find a mercenary' });
  expect(input.getAttribute('placeholder')).toBe('Name or code');
});

test('typing reports the query and offers a way to clear it', () => {
  render(<Finder />);
  const input = screen.getByRole('searchbox', { name: 'Find a mercenary' });
  expect(screen.queryByRole('button')).toBeNull();

  fireEvent.change(input, { target: { value: 'berserker' } });
  expect(shown()).toBe('berserker');

  fireEvent.click(screen.getByRole('button'));
  expect(shown()).toBe('empty');
});

test('Escape empties the field and tells the caller', () => {
  const onClear = vi.fn();
  render(<Finder onClear={onClear} />);
  const input = screen.getByRole('searchbox', { name: 'Find a mercenary' });

  fireEvent.change(input, { target: { value: 'abm' } });
  fireEvent.keyDown(input, { key: 'Escape' });
  fireEvent.keyUp(input, { key: 'Escape' });

  expect(shown()).toBe('empty');
  expect(onClear).toHaveBeenCalled();
});
