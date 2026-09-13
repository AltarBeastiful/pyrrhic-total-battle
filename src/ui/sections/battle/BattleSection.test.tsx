// @vitest-environment jsdom
/**
 * D-31 — the Battle card on Mantine: the capacities, the enemy, the method cards, the rules that
 * ride on them and the objective, each checked the way a player meets them (by role and by name)
 * and each written straight to the active march.
 */
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveSetup, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

import { BattleSection } from './BattleSection';

const realMatchMedia = window.matchMedia;

/**
 * The card asks the browser one question — is there room for the objective to stand open? — so the
 * two window sizes are stubbed rather than guessed. `wide()` is a desktop, `phone()` a 390 px one.
 */
function stubWidth(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (media: string) => ({
      media,
      matches,
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
  stubWidth(true);
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

/**
 * One rule row by the words it starts with. A Mantine switch row is a single `<label>` holding both
 * the name and the sentence under it, so its accessible name is the two run together and the name
 * asked for here is a prefix.
 */
const rule = (label: string): HTMLElement | null =>
  screen.queryByRole('switch', { name: new RegExp(`^${label}`) });

/** Type into a field and leave it, exactly as a player does. */
function type(label: string, text: string): void {
  const field = screen.getByLabelText(label);
  fireEvent.change(field, { target: { value: text } });
  fireEvent.blur(field);
}

// ---- Housing -------------------------------------------------------------------------------------
test('the three capacities are written to the active march', () => {
  renderWithTheme(<BattleSection />);
  type('Leadership', '4100');
  type('Authority', '1200');
  type('Dominance', '200');

  expect(setup()?.housing).toEqual({ leadership: 4100, authority: 1200, dominance: 200 });
  // Nobody steps to 84 300 (owner, 2026-09-13): the three pools are plain inputs.
  expect(screen.queryByRole('button', { name: /Leadership/ })).toBeNull();
});

test('a cleared capacity counts as zero, and the empty march says what to type', () => {
  renderWithTheme(<BattleSection />);
  expect(screen.getByText(/Enter your housing values/)).toBeTruthy();

  type('Leadership', '4100');
  expect(screen.queryByText(/Enter your housing values/)).toBeNull();

  type('Leadership', '');
  expect(setup()?.housing.leadership).toBe(0);
  expect((screen.getByLabelText('Leadership') as HTMLInputElement).value).toBe('');
});

test('landing in a capacity selects all of it, so the next keystroke replaces it', async () => {
  const user = userEvent.setup();
  useStore.getState().updateActiveSetup({ housing: { leadership: 4100, authority: 0, dominance: 0 } });
  renderWithTheme(<BattleSection />);

  const input = screen.getByLabelText('Leadership') as HTMLInputElement;
  await user.click(input);
  expect(input.value).toBe('4 100');
  expect(input.selectionStart).toBe(0);
  expect(input.selectionEnd).toBe(input.value.length);
});

// ---- The enemy -----------------------------------------------------------------------------------
test('a preset writes its squads and the caption counts them', () => {
  renderWithTheme(<BattleSection />);
  expect(screen.getByText('Enemy stacks: 4')).toBeTruthy();

  fireEvent.click(screen.getByRole('radio', { name: '8 double' }));
  expect(setup()?.enemy).toEqual({ melee: 2, ranged: 2, mounted: 2, flying: 2 });
  expect(screen.getByText('Enemy stacks: 8')).toBeTruthy();
});

test('the four counts are read-only until Custom, and then they are typed', () => {
  renderWithTheme(<BattleSection />);
  expect((screen.getByLabelText('Flying') as HTMLInputElement).readOnly).toBe(true);

  fireEvent.click(screen.getByRole('radio', { name: 'Custom' }));
  expect((screen.getByLabelText('Flying') as HTMLInputElement).readOnly).toBe(false);

  type('Flying', '3');
  expect(setup()?.enemy).toEqual({ melee: 1, ranged: 1, mounted: 1, flying: 3 });
  expect(screen.getByText('Enemy stacks: 6')).toBeTruthy();
});

// ---- The stacking method -------------------------------------------------------------------------
test('a method card is chosen by pressing anywhere on it, its sentence included', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BattleSection />);

  const list = screen.getByRole('radiogroup', { name: 'Stacking method' });
  expect(within(list).getByRole('radio', { name: 'Tier ladder' }).getAttribute('aria-checked')).toBe('true');

  await user.click(screen.getByText('Hired units only fall once all of your troops have.'));
  expect(options()?.method).toBe('ms');
  expect(within(list).getByRole('radio', { name: 'Troops first' }).getAttribute('aria-checked')).toBe('true');
});

test('the arrow keys walk the method cards', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BattleSection />);

  screen.getByRole('radio', { name: 'Tier ladder' }).focus();
  await user.keyboard('{ArrowRight}');
  expect(options()?.method).toBe('ms');

  await user.keyboard('{ArrowRight}');
  expect(options()?.method).toBe('custom');
});

// ---- The rules that ride on the method -----------------------------------------------------------
test('a rule writes the march, and only the rules that apply to the method are on screen', () => {
  renderWithTheme(<BattleSection />);

  // Tier ladder: monsters after troops, and the tens rule that applies to every method.
  expect(screen.getAllByRole('switch')).toHaveLength(2);
  expect(rule('Allow damage trades')).toBeNull();
  fireEvent.click(rule('Monsters after troops') as HTMLElement);
  expect(options()?.monstersLast).toBe(true);

  fireEvent.click(rule('Hired units in tens') as HTMLElement);
  expect(options()?.roundTo10).toBe(true);

  // Troops first: the trade rules take its place, and the tier-ladder rule is switched off with it.
  fireEvent.click(screen.getByRole('radio', { name: 'Troops first' }));
  expect(screen.getAllByRole('switch')).toHaveLength(3);
  expect(rule('Monsters after troops')).toBeNull();
  expect(rule('Monsters after mercenaries')).toBeTruthy();
  expect(options()?.monstersLast).toBe(false);
  expect(options()?.roundTo10).toBe(true);

  fireEvent.click(rule('Allow damage trades') as HTMLElement);
  expect(options()?.relaxedPreservation).toBe(true);

  // Your own order: nothing but the tens rule means anything.
  fireEvent.click(screen.getByRole('radio', { name: 'Your own order' }));
  expect(screen.getAllByRole('switch')).toHaveLength(1);
  expect(rule('Hired units in tens')).toBeTruthy();
  expect(options()?.relaxedPreservation).toBe(false);
});

test('"Your own order" is the only method that offers the order of the fall', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BattleSection />);
  expect(screen.queryByRole('button', { name: 'Edit order' })).toBeNull();

  await user.click(screen.getByRole('radio', { name: 'Your own order' }));
  await user.click(screen.getByRole('button', { name: 'Edit order' }));

  // The sheet is a chunk of its own (T-06); Vitest transforms it on demand, so give it a moment.
  const sheet = await screen.findByRole('dialog', {}, { timeout: 10_000 });
  expect(within(sheet).getByRole('heading', { name: 'Order of the fall' })).toBeTruthy();
  // The default account fields guardsmen I–III and specialists I: every one of them is a row.
  expect(within(sheet).getAllByRole('listitem').length).toBeGreaterThan(1);
}, 20_000);

// ---- The objective -------------------------------------------------------------------------------
test('the objective writes the priority of the march', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BattleSection />);

  const list = screen.getByRole('radiogroup', { name: 'Objective' });
  expect(within(list).getByRole('radio', { name: 'No priority' }).getAttribute('aria-checked')).toBe('true');

  await user.click(within(list).getByText('Best worst case'));
  expect(setup()?.priority).toBe('minDamage');

  await user.click(within(list).getByRole('radio', { name: 'Damage per silver' }));
  expect(setup()?.priority).toBe('damagePerSilver');
});

test('on a phone the objective folds to the chosen one until Change is pressed', async () => {
  stubWidth(false);
  const user = userEvent.setup();
  renderWithTheme(<BattleSection />);

  const list = screen.getByRole('radiogroup', { name: 'Objective' });
  expect(within(list).getAllByRole('radio')).toHaveLength(1);

  await user.click(within(list).getByRole('button', { name: 'Change Objective' }));
  expect(within(list).getAllByRole('radio')).toHaveLength(6);

  // Under the medium window the options are rows, so a row's name is its title and its sentence.
  await user.click(within(list).getByRole('radio', { name: /^Highest average damage/ }));
  expect(setup()?.priority).toBe('avgDamage');
  expect(within(list).getAllByRole('radio')).toHaveLength(1);
});

test('on a phone the stacking method folds to the chosen one too (D-54)', async () => {
  stubWidth(false);
  const user = userEvent.setup();
  renderWithTheme(<BattleSection />);

  const methods = screen.getByRole('radiogroup', { name: 'Stacking method' });
  expect(within(methods).getAllByRole('radio')).toHaveLength(1);

  await user.click(within(methods).getByRole('button', { name: 'Change Stacking method' }));
  expect(within(methods).getAllByRole('radio')).toHaveLength(3);
  await user.click(within(methods).getByText('Hired units only fall once all of your troops have.'));
  expect(options()?.method).toBe('ms');
  expect(within(methods).getAllByRole('radio')).toHaveLength(1);
});

// ---- What the losses cost ------------------------------------------------------------------------
test('the selective recovery plan asks how many unit types to revive', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BattleSection />);
  expect(screen.queryByLabelText('Unit types to revive')).toBeNull();

  // Three whole rows, never a dropdown (design rule 8).
  const plans = screen.getByRole('radiogroup', { name: 'Recovery plan' });
  expect(screen.queryByRole('combobox', { name: 'Recovery plan' })).toBeNull();
  expect(within(plans).getAllByRole('radio')).toHaveLength(3);
  await user.click(within(plans).getByText('Gold for your highest tiers, silver and time for the rest.'));
  expect(setup()?.recoveryPlan).toEqual({ mode: 'selective', selectiveTop: 3 });

  type('Unit types to revive', '2');
  expect(setup()?.recoveryPlan).toEqual({ mode: 'selective', selectiveTop: 2 });
});
