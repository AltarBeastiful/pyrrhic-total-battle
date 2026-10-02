// @vitest-environment jsdom
import { Chip } from '@mantine/core';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { CornerGear } from './CornerGear';
import { closeOpenEditors } from './openEditors';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

test('the gear is its own button, named for what it opens', async () => {
  const user = userEvent.setup();
  const onPress = vi.fn();
  renderWithTheme(
    <CornerGear label="Set Aydae’s level" onPress={onPress}>
      <Chip checked={false} onChange={() => {}}>
        Aydae
      </Chip>
    </CornerGear>,
  );
  await user.click(screen.getByRole('button', { name: 'Set Aydae’s level' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('pressing the gear never toggles the thing it sits on', async () => {
  const user = userEvent.setup();
  const onToggle = vi.fn();
  renderWithTheme(
    <CornerGear label="Set Aydae’s level" onPress={() => {}}>
      <Chip checked={false} onChange={onToggle}>
        Aydae
      </Chip>
    </CornerGear>,
  );
  await user.click(screen.getByRole('button', { name: 'Set Aydae’s level' }));
  expect(onToggle).not.toHaveBeenCalled();
  expect((screen.getByRole('checkbox', { name: 'Aydae' }) as HTMLInputElement).checked).toBe(false);
});

test('the march shortcut closes the editor the gear opened, when the caller drives it', () => {
  const onOpenedChange = vi.fn();
  renderWithTheme(
    <CornerGear
      label="Set Aydae’s level"
      onPress={() => {}}
      dropdown={<p>Level</p>}
      opened
      onOpenedChange={onOpenedChange}
    >
      <Chip checked={false} onChange={() => {}}>
        Aydae
      </Chip>
    </CornerGear>,
  );

  act(() => {
    expect(closeOpenEditors()).toBe(true);
  });
  expect(onOpenedChange).toHaveBeenCalledWith(false);
});

test('an uncontrolled gear registers nothing: its popover is Mantine’s to close', () => {
  renderWithTheme(
    <CornerGear label="Set Aydae’s level" onPress={() => {}} dropdown={<p>Level</p>}>
      <Chip checked={false} onChange={() => {}}>
        Aydae
      </Chip>
    </CornerGear>,
  );

  expect(closeOpenEditors()).toBe(false);
});

test('Enter in the editor’s field closes it; Enter in a list stays the list’s', () => {
  // Owner, 2026-10-02: *"same in popup, validate on entry."*
  const onOpenedChange = vi.fn();
  renderWithTheme(
    <CornerGear
      label="Set Aydae’s level"
      onPress={() => {}}
      dropdown={
        <>
          <input aria-label="Base level" />
          <input aria-label="Star level" aria-haspopup="listbox" />
        </>
      }
      opened
      onOpenedChange={onOpenedChange}
    >
      <Chip checked={false} onChange={() => {}}>
        Aydae
      </Chip>
    </CornerGear>,
  );

  fireEvent.keyDown(screen.getByLabelText('Star level'), { key: 'Enter' });
  expect(onOpenedChange).not.toHaveBeenCalled();
  fireEvent.keyDown(screen.getByLabelText('Base level'), { key: 'Enter' });
  expect(onOpenedChange).toHaveBeenCalledWith(false);
});
