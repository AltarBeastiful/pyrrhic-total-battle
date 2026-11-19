// @vitest-environment jsdom
/**
 * **The Talents page** (B-21 Seam 2): enter a hero level and the points to spend, pick a goal and read the
 * ordered list; a hero with no ranks plans from zero; the plan follows the goal, and what the player types is
 * saved on the account. Sideways overflow is left to the end-to-end journey.
 */
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { talents as TALENTS } from '@/data';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

import { TalentsPage } from './TalentsPage';

beforeEach(() => {
  globalThis.localStorage.clear();
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

const talentsOf = () => selectActiveProfile(useStore.getState())!.talents;

function type(label: string | RegExp, value: string): void {
  const field = screen.getByRole('textbox', { name: label });
  fireEvent.focus(field);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

const GOALS = 'Goals, best value per point first';
const economyRadio = () =>
  within(screen.getByRole('radiogroup', { name: GOALS })).getByRole('radio', { name: /Economy/ });

const LIST = 'Spend in this order';
const rows = () => within(screen.getByRole('list', { name: LIST })).getAllByRole('listitem');

test('without a points figure it asks for one and plans nothing', () => {
  renderWithTheme(<TalentsPage />);
  expect(screen.getByText(/type the points you have to spend/i)).toBeTruthy();
  expect(screen.queryByRole('list', { name: LIST })).toBeNull();
});

test('a level and points give an ordered list from zero ranks', () => {
  renderWithTheme(<TalentsPage />);
  type('Hero level', '150');
  type('Points to spend', '30');
  expect(rows().length).toBeGreaterThan(0);
  expect(talentsOf().heroLevel).toBe(150);
  expect(talentsOf().pointsOverride).toBe(30);
  expect(screen.getByText(/spends \d+ of 30 points/i)).toBeTruthy();
});

test('a different goal gives a different plan, saved on the account', () => {
  renderWithTheme(<TalentsPage />);
  type('Hero level', '150');
  type('Points to spend', '30');
  const battle = rows()[0]!.textContent;
  fireEvent.click(economyRadio());
  expect(rows()[0]!.textContent).not.toBe(battle);
  expect(talentsOf().goals[0]).toBe('economy');
});

test('ranks already bought are kept and the plan builds on them', () => {
  const node = TALENTS.find((t) => t.tree === 'battle' && t.parents.length === 0)!;
  const id = selectActiveProfile(useStore.getState())!.id;
  useStore.getState().updateProfile(id, {
    talents: { ...talentsOf(), heroLevel: 150, pointsOverride: 5, ranks: { [String(node.id)]: 1 } },
  });
  renderWithTheme(<TalentsPage />);
  expect(talentsOf().ranks[String(node.id)]).toBe(1);
  expect(screen.getByRole('list', { name: LIST })).toBeTruthy();
});

test('a hero level out of range is clamped before it is saved', () => {
  renderWithTheme(<TalentsPage />);
  // Mid-keystroke, before any blur: what is typed is saved at once, so it must already be in range.
  const field = screen.getByRole('textbox', { name: 'Hero level' });
  fireEvent.focus(field);
  fireEvent.change(field, { target: { value: '5000' } });
  expect(talentsOf().heroLevel).toBe(1000);
  fireEvent.change(field, { target: { value: '0' } });
  expect(talentsOf().heroLevel).toBe(1);
});

test('an emptied weight goes back to 1 by dropping the override', () => {
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: /weights/i }));
  const field = screen.getByRole('textbox', { name: 'Weight of Strength', hidden: true });
  fireEvent.focus(field);
  fireEvent.change(field, { target: { value: '3' } });
  expect(Object.values(talentsOf().weights.battle ?? {})).toContain(3);
  fireEvent.change(field, { target: { value: '' } });
  expect(Object.values(talentsOf().weights.battle ?? {})).toEqual([]);
});

test('Units that count is offered for the economy goal too, and its empty message says so', () => {
  renderWithTheme(<TalentsPage />);
  type('Hero level', '150');
  type('Points to spend', '30');
  fireEvent.click(economyRadio());
  expect(screen.getByText('Units that count')).toBeTruthy();
});

test('the goals are ranked by value per point and tapping one selects it', () => {
  renderWithTheme(<TalentsPage />);
  type('Hero level', '150');
  type('Points to spend', '30');
  const radios = within(screen.getByRole('radiogroup', { name: GOALS })).getAllByRole('radio');
  expect(radios).toHaveLength(3);
  const names = radios.map((r) => (r as HTMLInputElement).labels?.[0]?.textContent ?? '');
  expect(names[0]).toMatch(/^1\. /);
  expect(names[0]).toMatch(/per point, \d+ points? spent/);
  const economy = names.findIndex((n) => /Economy/.test(n));
  fireEvent.click(economyRadio());
  expect(talentsOf().goals[0]).toBe('economy');
  // Selecting does not reorder: the ranking only informs.
  const after = within(screen.getByRole('radiogroup', { name: GOALS }))
    .getAllByRole('radio')
    .map((r) => (r as HTMLInputElement).labels?.[0]?.textContent ?? '');
  expect(after).toEqual(names);
  expect(after[economy]).toMatch(/Economy/);
});

test('a goal with nothing plannable is last and says why', () => {
  renderWithTheme(<TalentsPage />);
  const labels = within(screen.getByRole('radiogroup', { name: GOALS }))
    .getAllByRole('radio')
    .map((r) => (r as HTMLInputElement).labels?.[0]?.textContent ?? '');
  expect(labels.every((l) => /No points to spend/.test(l))).toBe(true);
});

test('the tree head and the tab count held ranks and planned steps apart (never a flat 0)', () => {
  const node = TALENTS.find((t) => t.tree === 'economy' && t.parents.length === 0)!;
  const id = selectActiveProfile(useStore.getState())!.id;
  useStore.getState().updateProfile(id, {
    talents: {
      ...talentsOf(),
      goals: ['economy', 'battle', 'archeology'],
      heroLevel: 150,
      pointsOverride: 40,
      ranks: { [String(node.id)]: 1 },
    },
  });
  renderWithTheme(<TalentsPage />);
  const head = screen.getByText(/ · \d+ spent \+ \d+ planned$/);
  expect(head.textContent).toMatch(/^Economy · 1 spent \+ [1-9]\d* planned$/);
  expect(
    within(screen.getByRole('radiogroup', { name: 'Tree' })).getAllByText(/^\d+ planned$/).length,
  ).toBeGreaterThan(0);
});

test('with planned steps and no held ranks the head says planned, not 0 spent', () => {
  renderWithTheme(<TalentsPage />);
  fireEvent.click(economyRadio());
  type('Hero level', '150');
  type('Points to spend', '30');
  expect(screen.getByText(/^Economy · [1-9]\d* planned$/)).toBeTruthy();
});
