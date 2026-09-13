// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { ChipRow, type ChipRowItem } from './ChipRow';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

const ITEMS: ChipRowItem[] = [
  { value: 'melee', label: 'Melee' },
  { value: 'ranged', label: 'Ranged' },
  { value: 'mounted', label: 'Mounted' },
  { value: 'flying', label: 'Flying' },
];

function Example({ max }: { max?: number | undefined }) {
  const [value, setValue] = useState<string[]>(['melee']);
  return (
    <>
      <ChipRow
        label="Include at G4"
        items={ITEMS}
        value={value}
        onChange={setValue}
        {...(max === undefined ? {} : { max })}
      />
      <p data-testid="chosen">{value.join(',')}</p>
    </>
  );
}

test('the row is a named group of chips, one of them already chosen', () => {
  renderWithTheme(<Example />);
  expect(screen.getByRole('group', { name: 'Include at G4' })).toBeTruthy();
  expect(screen.getAllByRole('checkbox')).toHaveLength(4);
  expect((screen.getByRole('checkbox', { name: 'Melee' }) as HTMLInputElement).checked).toBe(true);
});

test('clicking a chip adds it and clicking it again takes it away', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  await user.click(screen.getByRole('checkbox', { name: 'Ranged' }));
  expect(screen.getByTestId('chosen').textContent).toBe('melee,ranged');
  await user.click(screen.getByRole('checkbox', { name: 'Melee' }));
  expect(screen.getByTestId('chosen').textContent).toBe('ranged');
});

// ---- One tab stop, arrows inside it (design rule 24; investigation 0011's 52-stop captain grid) --
test('the row is one tab stop: Tab enters it once and Tab leaves it', async () => {
  const user = userEvent.setup();
  renderWithTheme(
    <>
      <button type="button">before</button>
      <Example />
      <button type="button">after</button>
    </>,
  );

  screen.getByRole('button', { name: 'before' }).focus();
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'Melee' }));
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'after' }));
});

test('the arrows move between the chips and Space toggles the one you are on', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);

  screen.getByRole('checkbox', { name: 'Melee' }).focus();
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'Ranged' }));

  await user.keyboard(' ');
  expect(screen.getByTestId('chosen').textContent).toBe('melee,ranged');

  // The ends wrap, and Home/End jump to them.
  await user.keyboard('{End}');
  expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'Flying' }));
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'Melee' }));
  await user.keyboard('{ArrowLeft}');
  expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'Flying' }));
});

test('Tab comes back to the chip it left, not to the first one', async () => {
  const user = userEvent.setup();
  renderWithTheme(
    <>
      <Example />
      <button type="button">after</button>
    </>,
  );

  screen.getByRole('checkbox', { name: 'Melee' }).focus();
  await user.keyboard('{ArrowRight}{ArrowRight}');
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'after' }));

  await user.tab({ shift: true });
  expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'Mounted' }));
});

test('past the maximum the next pick is refused, in words', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example max={2} />);
  await user.click(screen.getByRole('checkbox', { name: 'Ranged' }));
  await user.click(screen.getByRole('checkbox', { name: 'Mounted' }));

  expect(screen.getByRole('status').textContent).toMatch(/2 at most/);
  expect((screen.getByRole('checkbox', { name: 'Mounted' }) as HTMLInputElement).checked).toBe(false);
});

// The perf rule of the row (plan §3 as amended): Bonuses puts ~80 chips on one phone screen, so a
// toggle must not re-render the other seventy-nine. Each label counts its own renders.
let renders: Record<string, number> = {};

/** Counted inside the chip's own render, which is the thing `memo` is supposed to skip. */
function body(name: string) {
  return () => {
    renders[name] = (renders[name] ?? 0) + 1;
    return <span>{name}</span>;
  };
}

const COUNTED: ChipRowItem[] = [
  { value: 'a', label: 'A', name: 'A', render: body('a') },
  { value: 'b', label: 'B', name: 'B', render: body('b') },
  { value: 'c', label: 'C', name: 'C', render: body('c') },
];

function CountingExample() {
  const [value, setValue] = useState<string[]>([]);
  return <ChipRow label="Titles" items={COUNTED} value={value} onChange={setValue} />;
}

test('toggling one chip re-renders that chip alone', async () => {
  const user = userEvent.setup();
  renders = {};
  renderWithTheme(<CountingExample />);
  const before = { ...renders };

  await user.click(screen.getByRole('checkbox', { name: 'A' }));

  expect(renders['a']).toBeGreaterThan(before['a'] ?? 0);
  expect(renders['b']).toBe(before['b']);
  expect(renders['c']).toBe(before['c']);
});
