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
  fireEvent.click(
    within(screen.getByRole('radiogroup', { name: 'Goal' })).getByRole('radio', { name: 'Economy' }),
  );
  expect(rows()[0]!.textContent).not.toBe(battle);
  expect(talentsOf().goal).toBe('economy');
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
