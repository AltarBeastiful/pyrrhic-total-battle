// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { ARCHER, FIRE_ELEMENTAL } from './fixtures';
import { MarchRow, MarchTable } from './MarchRow';

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, 'clipboard');
});

// The copy button is driven with `fireEvent` rather than `userEvent`: `userEvent.setup()` installs
// a clipboard stub of its own over `navigator.clipboard`, which is the very thing under test here.

/** Installs a clipboard jsdom does not have, and hands back the spy. */
function mockClipboard() {
  const writeText = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

test('the table has a header row and the row shows every column it was given', () => {
  render(
    <MarchTable caption="March">
      <MarchRow unit={ARCHER} count={2310} hits={1} lost={412} reviveSilver={9800} position={3} />
    </MarchTable>,
  );

  expect(screen.getByRole('columnheader', { name: 'Count' })).toBeTruthy();
  expect(screen.getByRole('columnheader', { name: 'Hits' })).toBeTruthy();
  expect(screen.getByText('Archer')).toBeTruthy();
  expect(screen.getByText('falls 3rd')).toBeTruthy();
  expect(screen.getByText('412')).toBeTruthy();
  expect(screen.getByText('9,800')).toBeTruthy();
});

test('missing figures are drawn as a dash, and "falls last" is written out', () => {
  render(
    <MarchTable>
      <MarchRow unit={FIRE_ELEMENTAL} count={12} fallsLast />
    </MarchTable>,
  );

  expect(screen.getByText('falls last')).toBeTruthy();
  expect(screen.getAllByText('—')).toHaveLength(3);
});

test('the count is a button that copies it and reports it', () => {
  const writeText = mockClipboard();
  const onCopy = vi.fn();
  render(
    <MarchTable>
      <MarchRow unit={ARCHER} count={2310} onCopy={onCopy} />
    </MarchTable>,
  );

  const button = screen.getByRole('button', { name: 'Copy 2,310, Archer' });
  expect(button.textContent).toBe('2,310');

  fireEvent.click(button);

  expect(writeText).toHaveBeenCalledWith('2310');
  expect(onCopy).toHaveBeenCalledWith(2310);
});

test('"Copied" appears in a live region and goes away after 1.5 s', () => {
  mockClipboard();
  vi.useFakeTimers();
  try {
    render(
      <MarchTable>
        <MarchRow unit={ARCHER} count={2310} />
      </MarchTable>,
    );

    expect(screen.getByRole('status').textContent).toBe('');

    fireEvent.click(screen.getByRole('button', { name: /Copy/ }));
    expect(screen.getByRole('status').textContent).toBe('Copied');

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole('status').textContent).toBe('');
  } finally {
    vi.useRealTimers();
  }
});

test('a missing clipboard does not break the row', () => {
  const onCopy = vi.fn();
  render(
    <MarchTable>
      <MarchRow unit={ARCHER} count={7} onCopy={onCopy} />
    </MarchTable>,
  );

  fireEvent.click(screen.getByRole('button', { name: /Copy/ }));

  expect(onCopy).toHaveBeenCalledWith(7);
  expect(screen.getByRole('status').textContent).toBe('Copied');
});

test('extra controls land in the row instead of replacing a column', () => {
  render(
    <MarchTable>
      <MarchRow unit={ARCHER} count={10}>
        <button type="button">Edit count</button>
      </MarchRow>
    </MarchTable>,
  );

  expect(screen.getByRole('button', { name: 'Edit count' })).toBeTruthy();
  expect(screen.getAllByRole('cell')).toHaveLength(7);
});
