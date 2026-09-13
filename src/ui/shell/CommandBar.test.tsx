// @vitest-environment jsdom
/**
 * D-56 — the command bar at both widths (design plan §5.6): the same four controls, drawn as wells
 * and a select from 1200 px and as chips and a popover below it, writing the same march.
 *
 * The engine is stubbed: what is asked here is what the bar writes and what Generate *says*, not
 * what a run comes back with (`march.test.tsx` owns that).
 */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveSetup, useStore } from '@/state/store';

import { ThemeHarness } from '../kit/testRender';
import { useResultStore } from '../resultStore';
import { useRunStore } from '../sections/march/runStore';
import { BottomBar } from './BottomBar';
import { CommandBar } from './CommandBar';

vi.mock('../sections/march/generate', () => ({
  runGenerate: () => Promise.resolve(),
  cancelGenerate: () => undefined,
  restoreLastResult: () => false,
}));

const setup = () => selectActiveSetup(useStore.getState());

/** The default document has an army but no housing, so a march is blocked until this is called. */
function withHousing(): void {
  useStore.getState().updateActiveSetup({ housing: { leadership: 4100, authority: 0, dominance: 0 } });
}

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  useResultStore.getState().clear();
  useRunStore.getState().reset();
});

afterEach(cleanup);

// ---- From 1200 px: wells, a select and the gold button ------------------------------------------
test('the three pools are plain fields that write the march', async () => {
  const user = userEvent.setup();
  render(<CommandBar />, { wrapper: ThemeHarness });

  for (const [pool, value] of [
    ['Leadership', '4100'],
    ['Authority', '1200'],
    ['Dominance', '200'],
  ] as const) {
    const field = screen.getByRole('textbox', { name: pool });
    await user.click(field);
    await user.keyboard(value);
  }

  expect(setup()?.housing).toEqual({ leadership: 4100, authority: 1200, dominance: 200 });
  // Nobody steps to 84 300 (design rule 9): no stepper, and the whole value is selected on focus.
  expect(screen.queryByRole('spinbutton')).toBeNull();
});

test('landing in a pool selects all of it, so the next keystroke replaces it', async () => {
  const user = userEvent.setup();
  withHousing();
  render(<CommandBar />, { wrapper: ThemeHarness });

  const field = screen.getByRole('textbox', { name: 'Leadership' }) as HTMLInputElement;
  await user.click(field);
  expect(field.value).toBe('4 100');
  expect(field.selectionStart).toBe(0);
  expect(field.selectionEnd).toBe(field.value.length);
});

test('the objective is one select, and it writes the priority', async () => {
  const user = userEvent.setup();
  render(<CommandBar />, { wrapper: ThemeHarness });

  const select = screen.getByRole('combobox', { name: 'Objective' }) as HTMLInputElement;
  expect(select.value).toBe('No priority');

  await user.click(select);
  await user.click(await screen.findByRole('option', { name: 'Best worst case' }));
  expect(setup()?.priority).toBe('minDamage');
  await waitFor(() => {
    expect((screen.getByRole('combobox', { name: 'Objective' }) as HTMLInputElement).value).toBe(
      'Best worst case',
    );
  });
});

test('Generate is in the bar, and says why it cannot run', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<CommandBar />, { wrapper: ThemeHarness });

  expect(screen.getByRole('button', { name: 'Generate march: Add housing first' })).toBeTruthy();

  await user.click(screen.getByRole('textbox', { name: 'Leadership' }));
  await user.keyboard('4100');
  rerender(<CommandBar />);
  expect(screen.getByRole('button', { name: 'Generate march' })).toBeTruthy();
});

// ---- Below 1200 px: chips, a popover and the same button -----------------------------------------
test('a pool chip carries the figure and opens as a field in its own place', async () => {
  const user = userEvent.setup();
  withHousing();
  render(<BottomBar onOpenRecap={() => undefined} />, { wrapper: ThemeHarness });

  const chip = screen.getByRole('button', { name: 'Leadership 4 100' });
  const row = chip.parentElement as HTMLElement;
  expect(row.children).toHaveLength(4);
  await user.click(chip);

  const field = screen.getByRole('textbox', { name: 'Leadership' }) as HTMLInputElement;
  // The field is the chip's own box: the row does not grow a control, it swaps one.
  expect(row.contains(field)).toBe(true);
  expect(row.children).toHaveLength(4);
  expect(field).toBe(document.activeElement);

  await user.keyboard('5000');
  expect(setup()?.housing.leadership).toBe(5000);

  // Leaving it commits too, not only Enter.
  field.blur();
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Leadership 5 000' })).toBeTruthy();
  });
});

test('the fourth chip opens the objective, and choosing one closes it', async () => {
  const user = userEvent.setup();
  render(<BottomBar onOpenRecap={() => undefined} />, { wrapper: ThemeHarness });

  await user.click(screen.getByRole('button', { name: 'Objective: No priority' }));
  const list = await screen.findByRole('radiogroup', { name: 'Objective' });
  expect(within(list).getAllByRole('radio')).toHaveLength(6);

  await user.click(within(list).getByRole('radio', { name: 'Damage per silver' }));
  expect(setup()?.priority).toBe('damagePerSilver');
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Objective: Damage per silver' })).toBeTruthy();
  });
});

test('the phone bar keeps the answer and Generate on its second row', () => {
  render(<BottomBar onOpenRecap={() => undefined} />, { wrapper: ThemeHarness });

  expect(screen.getByRole('button', { name: 'Open the march recap' })).toBeTruthy();
  expect(screen.getByRole('button', { name: /^Generate march/ })).toBeTruthy();
});
