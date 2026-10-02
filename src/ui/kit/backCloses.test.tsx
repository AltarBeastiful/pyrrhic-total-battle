// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { useBackCloses } from './backCloses';

function Popup({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  useBackCloses(opened, onClose);
  return null;
}

let coarse = true;
beforeEach(() => {
  vi.useFakeTimers();
  coarse = true;
  window.matchMedia = ((query: string) => ({ matches: coarse && query === '(pointer: coarse)' })) as never;
});
afterEach(() => {
  cleanup();
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

/** What a player's Back does to the page: a `popstate`, which is all the hook listens to. */
function pressBack(): void {
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'));
    vi.runOnlyPendingTimers();
  });
}

test('an open popup lays down one history entry, and Back closes it', () => {
  const push = vi.spyOn(window.history, 'pushState');
  const onClose = vi.fn();
  render(<Popup opened onClose={onClose} />);
  act(() => {
    vi.runOnlyPendingTimers();
  });
  expect(push).toHaveBeenCalledTimes(1);

  pressBack();
  expect(onClose).toHaveBeenCalledTimes(1);
  push.mockRestore();
});

test('Back closes the newest popup first, and the one under it waits for the next Back', () => {
  const under = vi.fn();
  const over = vi.fn();
  render(
    <>
      <Popup opened onClose={under} />
      <Popup opened onClose={over} />
    </>,
  );
  act(() => {
    vi.runOnlyPendingTimers();
  });

  pressBack();
  expect(over).toHaveBeenCalledTimes(1);
  expect(under).not.toHaveBeenCalled();

  pressBack();
  expect(under).toHaveBeenCalledTimes(1);
});

test('a popup closed another way takes its entry back off the history', () => {
  const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
  const { rerender } = render(<Popup opened onClose={() => {}} />);
  act(() => {
    vi.runOnlyPendingTimers();
  });
  rerender(<Popup opened={false} onClose={() => {}} />);
  act(() => {
    vi.runOnlyPendingTimers();
  });
  expect(back).toHaveBeenCalledTimes(1);
  // The `popstate` our own `back()` causes is not a player's Back.
  pressBack();
  back.mockRestore();
});

test('a desktop’s Back is the browser’s: nothing is laid down without a touch screen', () => {
  coarse = false;
  const push = vi.spyOn(window.history, 'pushState');
  render(<Popup opened onClose={() => {}} />);
  act(() => {
    vi.runOnlyPendingTimers();
  });
  expect(push).not.toHaveBeenCalled();
  push.mockRestore();
});
