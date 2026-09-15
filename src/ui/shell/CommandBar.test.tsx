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

const calls = vi.hoisted(() => ({ run: 0 }));

vi.mock('../sections/march/generate', () => ({
  runGenerate: () => {
    calls.run += 1;
    return Promise.resolve();
  },
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
  calls.run = 0;
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

/**
 * The one method that ignores the objective (owner, 2026-09-15). `planCampaign` declares an
 * `objective` and never reads it, and `generate.ts` returns the plan before the priority search, so
 * the control is locked rather than left looking live — with the sentence that says why, wired to
 * the field rather than merely beside it.
 */
test('the objective is locked, and says why, while the plan decides it', async () => {
  render(<CommandBar />, { wrapper: ThemeHarness });

  const live = () => screen.getByRole('combobox', { name: 'Objective' }) as HTMLInputElement;
  expect(live().disabled).toBe(false);
  expect(screen.queryByText(/decides this itself/)).toBeNull();

  useStore.getState().updateActiveSetup((current) => ({
    options: { ...current.options, method: 'plan' },
  }));

  await waitFor(() => {
    expect(live().disabled).toBe(true);
  });
  // The reason is on screen, and it is the field's own description rather than a paragraph nearby.
  const reason = screen.getByText(/decides this itself/);
  const describedBy = live().getAttribute('aria-describedby');
  expect(describedBy).not.toBeNull();
  expect(reason.id).toBe(describedBy);

  // And it goes back to live the moment the method stops deciding it.
  useStore.getState().updateActiveSetup((current) => ({
    options: { ...current.options, method: 'elite' },
  }));
  await waitFor(() => {
    expect(live().disabled).toBe(false);
  });
  expect(screen.queryByText(/decides this itself/)).toBeNull();
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

/**
 * The same lock on a phone, where the objective is a chip that opens a popover rather than a select:
 * a chip that opened a list of choices it will not take would be worse than one that cannot open. The
 * reason cannot live in a tooltip (a disabled control fires no hover) or in the popover (it does not
 * open), so the bar carries it in its own note line — and the chip's name says it too, the way
 * Generate's does.
 */
test('the phone objective chip locks with the plan, and the bar says why', async () => {
  render(<BottomBar onOpenRecap={() => undefined} />, { wrapper: ThemeHarness });

  useStore.getState().updateActiveSetup((current) => ({
    options: { ...current.options, method: 'plan' },
  }));

  const chip = await screen.findByRole('button', { name: 'Objective: decided by the plan' });
  expect((chip as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText(/decides this itself/)).toBeTruthy();

  // And it does not open: a trap over choices that cannot be taken is worse than a dead chip.
  await userEvent.setup().click(chip);
  expect(screen.queryByRole('radiogroup', { name: 'Objective' })).toBeNull();
});

test('the phone bar keeps the answer and Generate on its second row', () => {
  render(<BottomBar onOpenRecap={() => undefined} />, { wrapper: ThemeHarness });

  expect(screen.getByRole('button', { name: 'Open the march recap' })).toBeTruthy();
  expect(screen.getByRole('button', { name: /^Generate march/ })).toBeTruthy();
});

// ---- The words, the message line and Enter ------------------------------------------------------
test('every pool is named in words as well as in emoji, at both widths', () => {
  withHousing();
  const { unmount } = render(<BottomBar onOpenRecap={() => undefined} />, { wrapper: ThemeHarness });

  // The chip: the glyph, the pool's short name and the figure — the emoji is never the label
  // (the review of 2026-09-13 found three chips whose only label was an emoji).
  const chip = screen.getByRole('button', { name: 'Leadership 4 100' });
  expect(chip.textContent).toContain('Lead');
  expect(chip.textContent).toContain('4 100');
  for (const short of ['Auth', 'Dom']) {
    expect(screen.getByText(short)).toBeTruthy();
  }
  unmount();

  // The desktop bar writes the whole word, as the label over the well.
  render(<CommandBar />, { wrapper: ThemeHarness });
  expect(screen.getByText('Leadership')).toBeTruthy();
  expect(screen.getByText('Objective')).toBeTruthy();
});

test('an open chip keeps its glyph and its word beside the field', async () => {
  const user = userEvent.setup();
  withHousing();
  render(<BottomBar onOpenRecap={() => undefined} />, { wrapper: ThemeHarness });

  await user.click(screen.getByRole('button', { name: 'Leadership 4 100' }));
  const field = screen.getByRole('textbox', { name: 'Leadership' });
  const chip = field.closest('[class*="chipField"]') as HTMLElement;
  expect(chip.textContent).toContain('Lead');
  expect(within(chip).getByText('🛡️')).toBeTruthy();
  // The keyboard it asks a phone for, and what its Enter key says it does.
  expect(field.getAttribute('inputmode')).toBe('numeric');
  expect(field.getAttribute('enterkeyhint')).toBe('go');
});

test('the objective chip carries the objective by name, not a bare chevron', async () => {
  const user = userEvent.setup();
  render(<BottomBar onOpenRecap={() => undefined} />, { wrapper: ThemeHarness });

  const chip = screen.getByRole('button', { name: 'Objective: No priority' });
  expect(chip.textContent).toContain('No priority');

  await user.click(chip);
  await user.click(await screen.findByRole('radio', { name: 'Best worst case' }));
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Objective: Best worst case' }).textContent).toContain(
      'Best worst case',
    );
  });
});

test('a figure a march cannot carry is said once, above the fields, and marks its own well', () => {
  useStore.getState().updateActiveSetup({ housing: { leadership: 200_000_000, authority: 0, dominance: 0 } });
  render(<CommandBar />, { wrapper: ThemeHarness });

  const message = screen.getByRole('alert');
  expect(message.textContent).toBe('Leadership is over the 100 000 000 a pool can hold.');
  // The field is marked, and says so to a screen reader; the words are the line above it, once.
  expect(screen.getByRole('textbox', { name: 'Leadership' }).getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByRole('textbox', { name: 'Authority' }).getAttribute('aria-invalid')).toBeNull();
  expect(screen.getAllByText(/over the 100 000 000/)).toHaveLength(1);
});

test('the bar is a form, and a plain Enter in a field generates', async () => {
  const user = userEvent.setup();
  withHousing();
  render(<CommandBar />, { wrapper: ThemeHarness });

  expect(screen.getByRole('form', { name: 'This march' })).toBeTruthy();

  const field = screen.getByRole('textbox', { name: 'Leadership' });
  await user.click(field);
  await user.keyboard('{Enter}');
  expect(calls.run).toBe(1);
});

test('Enter in a chip commits the figure and generates once', async () => {
  const user = userEvent.setup();
  withHousing();
  render(<BottomBar onOpenRecap={() => undefined} />, { wrapper: ThemeHarness });

  await user.click(screen.getByRole('button', { name: 'Leadership 4 100' }));
  await user.keyboard('5000{Enter}');

  expect(setup()?.housing.leadership).toBe(5000);
  expect(calls.run).toBe(1);
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Leadership 5 000' })).toBeTruthy();
  });
});
