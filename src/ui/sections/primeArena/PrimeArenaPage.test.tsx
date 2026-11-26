// @vitest-environment jsdom
/**
 * B-35: the Prime Arena page. The inputs of B-33, a Generate that runs the B-34 planner, and a result with the
 * stack list and one log per round. Checked the way a player meets it: by role and by name.
 */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { captains as captainTable } from '@/data';
import { newProfile, newRoot } from '@/state/defaults';
import { selectActiveSetup, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

import { PrimeArenaPage } from './PrimeArenaPage';
import { usePrimeArenaStore } from './primeArenaStore';

const BUDGET = { maxEvaluations: 60, maxMillis: 1000 };

function seed(captainCount: number): void {
  const root = newRoot();
  const profile = newProfile('arena');
  profile.sources.captains = Array.from({ length: captainCount }, (_, i) => ({
    id: `c${String(i)}`,
    captainId: 'alexander',
    level: 10,
    star: 2,
  }));
  root.profiles = [profile];
  root.activeProfileId = profile.id;
  useStore.getState().replaceDocument(root);
}

beforeEach(() => {
  seed(1);
  usePrimeArenaStore.getState().reset();
});

afterEach(() => {
  cleanup();
});

const typeInto = (name: RegExp, value: string): void => {
  const field = screen.getByRole('textbox', { name });
  fireEvent.focus(field);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
};

test('shows the inputs of the arena and no result before a run', () => {
  renderWithTheme(<PrimeArenaPage budget={BUDGET} />);
  expect(screen.getByRole('heading', { name: 'Prime Arena' })).toBeTruthy();
  expect(screen.getByRole('textbox', { name: /leadership/i })).toBeTruthy();
  expect(screen.getByRole('textbox', { name: /dominance/i })).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: /^Send Alexander on this march$/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /bonus sources/i }));
  // The sources the rules count start on, the ones they leave out start off.
  expect((screen.getByRole('switch', { name: /^talents/i, hidden: true }) as HTMLInputElement).checked).toBe(
    true,
  );
  expect(screen.queryByRole('switch', { name: /^titles/i, hidden: true })).toBeNull();
  expect(screen.queryByRole('switch', { name: /^clan/i, hidden: true })).toBeNull();
  expect(screen.queryByRole('region', { name: /result/i })).toBeNull();
});

test('shows the bonus totals the switches produce before any run', () => {
  renderWithTheme(<PrimeArenaPage budget={BUDGET} />);
  expect(screen.getByText('Sources on')).toBeTruthy();
});

test('Generate waits for a Leadership or Dominance budget', () => {
  renderWithTheme(<PrimeArenaPage budget={BUDGET} />);
  expect((screen.getByRole('button', { name: 'Generate' }) as HTMLButtonElement).disabled).toBe(true);
});

test('keeps at most five captains, over the calculator’s own captain chips', () => {
  renderWithTheme(<PrimeArenaPage budget={BUDGET} />);
  const chips = captainTable
    .slice(0, 6)
    .map((record) =>
      screen.getByRole('checkbox', { name: new RegExp(`^Send ${record.name} on this march$`) }),
    );
  for (const chip of chips) fireEvent.click(chip);
  expect(usePrimeArenaStore.getState().setup.active.captains).toHaveLength(5);
  expect(screen.getByText(/five captains at most/i)).toBeTruthy();
  // The calculator's march is untouched.
  expect(selectActiveSetup(useStore.getState())?.active.captains).toEqual([]);
});

test('has no chip or switch for a source the rules leave out', () => {
  renderWithTheme(<PrimeArenaPage budget={BUDGET} />);
  expect(screen.queryByRole('checkbox', { name: /hero/i })).toBeNull();
  for (const name of [/titles/i, /events/i, /permanent/i, /recovery/i, /vip/i, /clan/i, /kingdom/i]) {
    expect(screen.queryByText(name)).toBeNull();
  }
  expect(screen.queryByRole('group', { name: /march type/i })).toBeNull();
  expect(screen.getByText('Hero and captains')).toBeTruthy();
});

test('Generate plans an attack stack and logs both rounds', async () => {
  renderWithTheme(<PrimeArenaPage budget={BUDGET} />);
  typeInto(/leadership/i, '200000');
  typeInto(/dominance/i, '100000');
  fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

  const result = await screen.findByRole('region', { name: /result/i }, { timeout: 5000 });
  const stackList = within(result).getByRole('table', { name: /stack list/i });
  expect(within(stackList).getAllByRole('row').length).toBeGreaterThan(1);
  await waitFor(() => {
    expect(within(result).getByRole('heading', { name: /round 1/i })).toBeTruthy();
    expect(within(result).getByRole('heading', { name: /round 2/i })).toBeTruthy();
  });
  expect(within(result).getByText(/attacker strikes first/i)).toBeTruthy();
  expect(within(result).getByText(/defender strikes first/i)).toBeTruthy();
});
