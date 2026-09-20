// @vitest-environment jsdom
/**
 * The register of open setup editors: what `Ctrl`/`⌘ + Enter` puts down on its way to the march
 * (`shell/useGenerateRun.ts`, owner ask of 2026-09-20).
 */
import { act, cleanup, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';

import { closeOpenEditors, registerOpenEditor, useOpenEditor } from './openEditors';

afterEach(() => {
  cleanup();
  // Nothing may be left registered between tests: the register is module state.
  closeOpenEditors();
});

function Editor({ close }: { close: () => void }) {
  const [opened, setOpened] = useState(true);
  useOpenEditor(opened, () => {
    setOpened(false);
    close();
  });
  return <p>{opened ? 'open' : 'shut'}</p>;
}

test('an editor is closed while it is open, and never once it has shut', () => {
  const close = vi.fn();
  const view = render(<Editor close={close} />);

  expect(view.getByText('open')).toBeTruthy();
  act(() => {
    expect(closeOpenEditors()).toBe(true);
  });
  expect(close).toHaveBeenCalledTimes(1);
  expect(view.getByText('shut')).toBeTruthy();

  // Shut, it has unregistered itself: a second press has nothing to put down and says so, which is
  // what tells the frame the keystroke was a plain generate.
  expect(closeOpenEditors()).toBe(false);
  expect(close).toHaveBeenCalledTimes(1);
});

test('an editor that unmounts while open leaves nothing behind', () => {
  const close = vi.fn();
  const view = render(<Editor close={close} />);
  view.unmount();

  expect(closeOpenEditors()).toBe(false);
  expect(close).not.toHaveBeenCalled();
});

test('the editors close newest first — a popover raised from a sheet before the sheet itself', () => {
  const order: string[] = [];
  const sheet = registerOpenEditor(() => order.push('sheet'));
  const popover = registerOpenEditor(() => order.push('popover'));

  closeOpenEditors();
  expect(order).toEqual(['popover', 'sheet']);

  sheet();
  popover();
});

test('the closer is read fresh, so an inline arrow does not re-register on every render', () => {
  let closed = 0;
  function Rerendering() {
    const [count, setCount] = useState(0);
    useOpenEditor(true, () => {
      closed += count;
    });
    return (
      <button
        type="button"
        onClick={() => {
          setCount((value) => value + 1);
        }}
      >
        bump
      </button>
    );
  }

  const view = render(<Rerendering />);
  act(() => {
    view.getByRole('button').click();
    view.getByRole('button').click();
  });

  // One registration, and it runs the arrow from the *last* render: twice bumped is 2, not 0.
  act(() => {
    closeOpenEditors();
  });
  expect(closed).toBe(2);
});
