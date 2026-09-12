// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { Banner } from './Banner';
import { Button } from './Button';

afterEach(cleanup);

test('an informational banner is a status with its title and body', () => {
  render(
    <Banner tone="info" title="Nothing to compute yet">
      <p>Add a few troops and press Generate.</p>
    </Banner>,
  );

  const banner = screen.getByRole('status');
  expect(banner.textContent).toContain('Nothing to compute yet');
  expect(screen.getByText('Add a few troops and press Generate.')).toBeTruthy();
});

test('the danger tone is announced as an alert', () => {
  render(<Banner tone="danger">The saved march no longer matches this profile.</Banner>);

  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.queryByRole('status')).toBeNull();
});

test('the warn and ok tones are statuses', () => {
  render(
    <>
      <Banner tone="warn">Leadership is lower than the stack needs.</Banner>
      <Banner tone="ok">Saved.</Banner>
    </>,
  );

  expect(screen.getAllByRole('status')).toHaveLength(2);
});

test('actions are rendered inside the banner', () => {
  const onPress = vi.fn();
  render(
    <Banner tone="warn" actions={<Button onPress={onPress}>Keep them in</Button>}>
      Two units were left out.
    </Banner>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Keep them in' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('a dismissible banner offers a named Close button', () => {
  const onDismiss = vi.fn();
  render(
    <Banner tone="ok" onDismiss={onDismiss}>
      Copied.
    </Banner>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test('a banner without onDismiss has no Close button', () => {
  render(<Banner tone="info">Nothing to dismiss.</Banner>);

  expect(screen.queryByRole('button')).toBeNull();
});
