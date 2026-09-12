// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { GenerateIcon } from '../icons';
import { FloatingAction } from './FloatingAction';

afterEach(cleanup);

test('ready: the label is the name and the press goes through', () => {
  const onPress = vi.fn();
  render(<FloatingAction label="Generate march" state="ready" icon={<GenerateIcon />} onPress={onPress} />);

  const button = screen.getByRole('button', { name: 'Generate march' });
  expect(document.querySelector('[aria-busy="true"]')).toBeNull();
  fireEvent.click(button);
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('stale: the name is unchanged and a mark is added next to the glyph', () => {
  const { container } = render(
    <FloatingAction label="Generate march" state="stale" icon={<GenerateIcon />} />,
  );

  expect(screen.getByRole('button', { name: 'Generate march' })).toBeTruthy();
  // One decorative mark for the glyph, one for the "setup changed" dot.
  expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(1);
});

test('running: the action is announced as busy', () => {
  const { container } = render(
    <FloatingAction label="Generate march" state="running" icon={<GenerateIcon />} />,
  );

  expect(screen.getByRole('button', { name: 'Generate march' })).toBeTruthy();
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
});

test('blocked: the hint becomes the visible label, the name says both, and nothing fires', () => {
  const onPress = vi.fn();
  render(
    <FloatingAction
      label="Generate march"
      state="blocked"
      hint="Add troops first"
      icon={<GenerateIcon />}
      onPress={onPress}
    />,
  );

  const button = screen.getByRole('button', {
    name: 'Generate march: Add troops first',
  });
  expect(button.getAttribute('aria-disabled')).toBe('true');
  expect(screen.getByText('Add troops first')).toBeTruthy();
  fireEvent.click(button);
  expect(onPress).not.toHaveBeenCalled();
});

test('a blocked button stays focusable so the reason can be read', () => {
  render(
    <FloatingAction label="Generate march" state="blocked" hint="Add troops first" icon={<GenerateIcon />} />,
  );

  const button = screen.getByRole('button', { name: 'Generate march: Add troops first' });
  button.focus();
  expect(document.activeElement).toBe(button);
});

test('hiding the label keeps the accessible name', () => {
  render(<FloatingAction label="Generate march" state="ready" icon={<GenerateIcon />} showLabel={false} />);

  expect(screen.getByRole('button', { name: 'Generate march' })).toBeTruthy();
});
