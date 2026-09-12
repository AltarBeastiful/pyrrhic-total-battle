// @vitest-environment jsdom
/**
 * D-31 — the Battle card: the formation, the pools, the method, its options and the objective, all
 * checked the way a player meets them (by role and by name) and all written straight to the march.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveSetup, useStore } from '@/state/store';
import { MEDIUM } from '@/ui/shell/useMediaQuery';

import { BattleSection } from './BattleSection';

const realMatchMedia = window.matchMedia;

/** The card asks one question of the browser: is there room for the objective list to stand open? */
function stubMedia(matching: string[]): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (media: string) => ({
      media,
      matches: matching.includes(media),
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  stubMedia([MEDIUM]);
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: realMatchMedia,
  });
});

const setup = () => selectActiveSetup(useStore.getState());
const options = () => setup()?.options;
/** The name a player hears on each switch row, in the order the card shows them. */
const switchNames = (): string[] =>
  screen.getAllByRole('switch').map((control) => control.closest('label')?.textContent?.trim() ?? '');

/** A stepper commits what was typed when it is left, exactly as a player leaves a field. */
function type(label: string, text: string): void {
  const field = screen.getByLabelText(label);
  fireEvent.change(field, { target: { value: text } });
  fireEvent.blur(field);
}

// ---- Enemy formation -----------------------------------------------------------------------------
test('the formation starts standard and the double preset writes eight squads', () => {
  render(<BattleSection />);
  expect(
    (screen.getByRole('radio', { name: 'Standard 4' }) as HTMLElement).getAttribute('aria-checked'),
  ).toBe('true');

  fireEvent.click(screen.getByRole('radio', { name: 'Double 8' }));
  expect(setup()?.enemy).toEqual({ melee: 2, ranged: 2, mounted: 2, flying: 2 });
  expect(screen.getByText(/8 squads: 2 melee · 2 ranged · 2 mounted · 2 flying/)).toBeTruthy();
});

test('Custom reveals one field per category and writes what is typed', () => {
  render(<BattleSection />);
  expect(screen.queryByLabelText('Flying')).toBeNull();

  fireEvent.click(screen.getByRole('radio', { name: 'Custom' }));
  type('Flying', '3');

  expect(setup()?.enemy).toEqual({ melee: 1, ranged: 1, mounted: 1, flying: 3 });
  expect(screen.getByText(/6 squads:/)).toBeTruthy();
});

// ---- Housing -------------------------------------------------------------------------------------
test('the three capacities are written to the active march', () => {
  render(<BattleSection />);
  type('Leadership', '4100');
  type('Authority', '1200');
  type('Dominance', '200');

  expect(setup()?.housing).toEqual({ leadership: 4100, authority: 1200, dominance: 200 });
});

test('a cleared capacity counts as zero, and the empty march says what to type', () => {
  render(<BattleSection />);
  expect(screen.getByText(/Enter your housing values/)).toBeTruthy();

  type('Leadership', '4100');
  expect(screen.queryByText(/Enter your housing values/)).toBeNull();

  type('Leadership', '');
  expect(setup()?.housing.leadership).toBe(0);
  expect((screen.getByLabelText('Leadership') as HTMLInputElement).value).toBe('');
});

test('a capacity steps by one, by a hundred with Shift and by a thousand with Ctrl', () => {
  render(<BattleSection />);
  type('Leadership', '4000');

  fireEvent.click(screen.getByRole('button', { name: 'Increase Leadership' }));
  expect(setup()?.housing.leadership).toBe(4001);

  fireEvent.keyDown(screen.getByLabelText('Leadership'), { key: 'ArrowUp', shiftKey: true });
  expect(setup()?.housing.leadership).toBe(4101);

  fireEvent.keyDown(screen.getByLabelText('Leadership'), { key: 'ArrowUp', ctrlKey: true });
  expect(setup()?.housing.leadership).toBe(5101);
});

// ---- The stacking method -------------------------------------------------------------------------
test('a method row is chosen by pressing anywhere on it, supporting text included', async () => {
  const user = userEvent.setup();
  render(<BattleSection />);

  const list = screen.getByRole('radiogroup', { name: 'Stacking method' });
  expect((within(list).getByRole('radio', { name: 'Tier ladder' }) as HTMLInputElement).checked).toBe(true);

  await user.click(screen.getByText('Hired units only fall once all of your troops have.'));
  expect(options()?.method).toBe('ms');
});

test('the arrow keys walk the method list', () => {
  render(<BattleSection />);
  const first = screen.getByRole('radio', { name: 'Tier ladder' });
  first.focus();

  fireEvent.keyDown(first, { key: 'ArrowDown' });
  expect(options()?.method).toBe('ms');

  fireEvent.keyDown(screen.getByRole('radio', { name: 'Troops first' }), { key: 'ArrowDown' });
  expect(options()?.method).toBe('custom');
});

// ---- The options that ride on the method ---------------------------------------------------------
test('a toggle writes the march, and only the toggles that apply to the method are on screen', () => {
  render(<BattleSection />);

  // Tier ladder: monsters after troops, and the tens rule that applies to every method.
  expect(switchNames()).toEqual(['Monsters after troops', 'Hired units in tens']);
  fireEvent.click(screen.getByRole('switch', { name: 'Monsters after troops' }));
  expect(options()?.monstersLast).toBe(true);

  fireEvent.click(screen.getByRole('switch', { name: 'Hired units in tens' }));
  expect(options()?.roundTo10).toBe(true);

  // Troops first: the trade rules take its place, and the tier-ladder rule is switched off with it.
  fireEvent.click(screen.getByRole('radio', { name: 'Troops first' }));
  expect(switchNames()).toEqual(['Allow damage trades', 'Monsters after mercenaries', 'Hired units in tens']);
  expect(options()?.monstersLast).toBe(false);
  expect(options()?.roundTo10).toBe(true);

  fireEvent.click(screen.getByRole('switch', { name: 'Allow damage trades' }));
  expect(options()?.relaxedPreservation).toBe(true);

  // Your own order: nothing but the tens rule means anything.
  fireEvent.click(screen.getByRole('radio', { name: 'Your own order' }));
  expect(switchNames()).toEqual(['Hired units in tens']);
  expect(options()?.relaxedPreservation).toBe(false);
});

test('Your own order opens the order of the fall in a sheet', async () => {
  const user = userEvent.setup();
  render(<BattleSection />);

  await user.click(screen.getByRole('button', { name: 'Edit order' }));
  const sheet = screen.getByRole('dialog');
  expect(within(sheet).getByRole('heading', { name: 'Order of the fall' })).toBeTruthy();
  // The default account fields guardsmen I–III and specialists I: every one of them is a row.
  expect(within(sheet).getAllByRole('button', { name: /^Move / }).length).toBeGreaterThan(0);

  await user.click(within(sheet).getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});

// ---- The objective -------------------------------------------------------------------------------
test('the objective list writes the priority of the march', async () => {
  const user = userEvent.setup();
  render(<BattleSection />);

  const list = screen.getByRole('radiogroup', { name: 'Objective' });
  expect((within(list).getByRole('radio', { name: 'No priority' }) as HTMLInputElement).checked).toBe(true);

  await user.click(within(list).getByRole('radio', { name: 'Best worst case' }));
  expect(setup()?.priority).toBe('minDamage');

  await user.click(within(list).getByRole('radio', { name: 'Damage per silver' }));
  expect(setup()?.priority).toBe('damagePerSilver');
});

test('on a phone the objective folds to the chosen one until Change is pressed', async () => {
  stubMedia([]);
  const user = userEvent.setup();
  render(<BattleSection />);

  const list = screen.getByRole('radiogroup', { name: 'Objective' });
  expect(within(list).getAllByRole('radio')).toHaveLength(1);

  await user.click(within(list).getByRole('button', { name: 'Change Objective' }));
  expect(within(list).getAllByRole('radio')).toHaveLength(6);

  await user.click(within(list).getByRole('radio', { name: 'Highest average damage' }));
  expect(setup()?.priority).toBe('avgDamage');
  expect(within(list).getAllByRole('radio')).toHaveLength(1);
});

// ---- What the losses cost ------------------------------------------------------------------------
test('the selective recovery plan asks how many unit types to revive', async () => {
  const user = userEvent.setup();
  render(<BattleSection />);
  expect(screen.queryByLabelText('Unit types to revive')).toBeNull();

  await user.click(screen.getByRole('button', { name: /Retrain everything/ }));
  await user.click(screen.getByRole('option', { name: 'Revive the top types, retrain the rest' }));
  expect(setup()?.recoveryPlan).toEqual({ mode: 'selective', selectiveTop: 3 });

  type('Unit types to revive', '2');
  expect(setup()?.recoveryPlan).toEqual({ mode: 'selective', selectiveTop: 2 });
});
