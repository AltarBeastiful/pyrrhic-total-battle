// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { Segmented } from './Segmented';

afterEach(cleanup);

const formations = [
  { value: 'standard', label: 'Standard' },
  { value: 'double', label: 'Double' },
  { value: 'custom', label: 'Custom' },
];

function Formation() {
  const [value, setValue] = useState('standard');
  return <Segmented label="Enemy formation" value={value} onChange={setValue} options={formations} />;
}

test('Segmented is a named group with the current choice marked', () => {
  render(<Formation />);
  const group = screen.getByRole('radiogroup', { name: 'Enemy formation' });
  const standard = within(group).getByRole('radio', { name: 'Standard' });
  expect(standard.getAttribute('aria-checked')).toBe('true');
  expect(within(group).getByRole('radio', { name: 'Custom' }).getAttribute('aria-checked')).toBe('false');
});

test('Segmented walks its segments with the arrow keys', () => {
  render(<Formation />);
  const standard = screen.getByRole('radio', { name: 'Standard' });
  const double = screen.getByRole('radio', { name: 'Double' });
  standard.focus();

  fireEvent.keyDown(standard, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(double);

  fireEvent.keyDown(double, { key: 'ArrowLeft' });
  expect(document.activeElement).toBe(standard);
});

test('choosing a segment moves the mark', () => {
  render(<Formation />);
  fireEvent.click(screen.getByRole('radio', { name: 'Custom' }));
  expect(screen.getByRole('radio', { name: 'Custom' }).getAttribute('aria-checked')).toBe('true');
  expect(screen.getByRole('radio', { name: 'Standard' }).getAttribute('aria-checked')).toBe('false');
});
