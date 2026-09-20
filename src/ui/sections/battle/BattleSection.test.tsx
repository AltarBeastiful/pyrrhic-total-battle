// @vitest-environment jsdom
/**
 * D-31, amended by D-56 — the Battle card on Mantine: the enemy, the method cards, the rules that
 * ride on them and the recovery plan, each checked the way a player meets them (by role and by
 * name) and each written straight to the active march. The capacities and the objective moved to
 * the command bar (`src/ui/shell/CommandBar.test.tsx`); the first test here is that they left.
 */
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveSetup, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

import { METHOD_CHOICES } from './choices';
import { BattleSection } from './BattleSection';

const realMatchMedia = window.matchMedia;

/**
 * The card asks the browser one question — is there room for the method cards to stand open? — so
 * the two window sizes are stubbed rather than guessed: `true` is a desktop, `false` a 390 px one.
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

// ---- What left the card (D-56) --------------------------------------------------------------------
test('housing and the objective are in the command bar, not in this card', () => {
  renderWithTheme(<BattleSection />);

  // The three capacities and what a Generate aims at change with every march, so they live on the
  // bottom edge beside Generate now (design plan §5.6); the card keeps what is configured once.
  for (const pool of ['Leadership', 'Authority', 'Dominance']) {
    expect(screen.queryByLabelText(pool)).toBeNull();
  }
  expect(screen.queryByRole('radiogroup', { name: 'Objective' })).toBeNull();
  expect(screen.queryByText(/Enter your housing values/)).toBeNull();

  // What is left, in the order the card reads in.
  expect(screen.getByText('Enemy stacks: 4')).toBeTruthy();
  expect(screen.getByRole('radiogroup', { name: 'Stacking method' })).toBeTruthy();
  expect(screen.getByRole('radiogroup', { name: 'Recovery plan' })).toBeTruthy();
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
  // Complete optimization leads the card since 2026-09-19 (owner: "reorder complete automatization
  // to first"); a new march still starts on the tier ladder, which is the second one.
  expect(within(list).getAllByRole('radio')[0]?.getAttribute('aria-label')).toBe('Complete optimization');
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

test('on a phone the stacking method folds to the chosen one too (D-54)', async () => {
  stubWidth(false);
  const user = userEvent.setup();
  renderWithTheme(<BattleSection />);

  const methods = screen.getByRole('radiogroup', { name: 'Stacking method' });
  expect(within(methods).getAllByRole('radio')).toHaveLength(1);

  await user.click(within(methods).getByRole('button', { name: 'Change Stacking method' }));
  // Every method the card offers, the plan one (S-55) included.
  expect(within(methods).getAllByRole('radio')).toHaveLength(METHOD_CHOICES.length);
  await user.click(within(methods).getByText('Hired units only fall once all of your troops have.'));
  expect(options()?.method).toBe('ms');
  expect(within(methods).getAllByRole('radio')).toHaveLength(1);
});

// ---- Complete optimization, the plan (S-55) -------------------------------------------------------
test('the plan method asks for nothing, and hides the rules it decides itself', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BattleSection />);

  // Nothing to type about a campaign, under any method (S-56, owner's review of 2026-09-15): the horizon
  // the plan is planned over and the silver it may spend are policy numbers now (`src/config.ts`), so the
  // two fields the card used to carry are gone, and the stored `campaign` with them.
  expect(screen.queryByLabelText('Marches planned')).toBeNull();
  expect(screen.queryByLabelText('Silver budget')).toBeNull();
  expect(setup()).not.toHaveProperty('campaign');
  expect(screen.getAllByRole('switch')).toHaveLength(2);

  await user.click(screen.getByRole('radio', { name: 'Complete optimization' }));
  expect(options()?.method).toBe('plan');

  // The card keeps what a player reads before choosing it, and the words the glossary fixes for it.
  expect(
    screen.getByText('Plans the marches your army can fight: how big each one is, and what it carries.'),
  ).toBeTruthy();

  // It tries every sizing itself, so a rule that fixes one would be the player answering their own
  // question: the whole Options block goes with them (§7.4), and there is nothing else to fill in.
  expect(screen.queryAllByRole('switch')).toHaveLength(0);
  expect(screen.queryByText('Options')).toBeNull();
});

test('the plan method switches off the rules that belonged to the method it came from', () => {
  renderWithTheme(<BattleSection />);

  // Tier ladder owns "Monsters after troops": turn it on, then hand the march to the plan.
  fireEvent.click(rule('Monsters after troops') as HTMLElement);
  expect(options()?.monstersLast).toBe(true);

  fireEvent.click(screen.getByRole('radio', { name: 'Complete optimization' }));
  expect(options()?.monstersLast).toBe(false);
  expect(screen.queryAllByRole('switch')).toHaveLength(0);

  // And it stays off: the rule belonged to the sizing the plan does not read.
  fireEvent.click(screen.getByRole('radio', { name: 'Tier ladder' }));
  expect(screen.getAllByRole('switch')).toHaveLength(2);
  expect(rule('Monsters after troops')).toBeTruthy();
  expect(options()?.monstersLast).toBe(false);
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
