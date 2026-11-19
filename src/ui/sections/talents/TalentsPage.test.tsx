// @vitest-environment jsdom
/**
 * **The Talents page** (B-21 Seam 2, priorities B-22 Seam 2): enter a hero level and the points to spend, rank
 * the goals, and read the next two points on cards; the tree carries the whole plan. What the player types or
 * chooses is saved on the account. Sideways overflow is left to the end-to-end journey.
 */
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { talents as TALENTS } from '@/data';
import { newRoot } from '@/state/defaults';
import { migrate } from '@/state/migrations';
import type { Talents } from '@/state/schema';
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

function setTalents(patch: Partial<Talents>): void {
  const id = selectActiveProfile(useStore.getState())!.id;
  useStore.getState().updateProfile(id, { talents: { ...talentsOf(), ...patch } });
}

function type(label: string | RegExp, value: string): void {
  const field = screen.getByRole('textbox', { name: label });
  fireEvent.focus(field);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

const GOALS = 'Goals, most wanted first';
const goalRows = () => within(screen.getByRole('list', { name: GOALS })).getAllByRole('listitem');
const card = (name: 'Next point' | 'Then') => screen.getByRole('article', { name });
const cards = () => screen.queryAllByRole('article');
const pick = (group: string, option: string): void => {
  fireEvent.click(
    within(screen.getByRole('radiogroup', { name: group })).getByRole('radio', { name: option }),
  );
};

test('without a points figure it asks for one and plans nothing', () => {
  renderWithTheme(<TalentsPage />);
  expect(screen.getByText(/type the points you have to spend/i)).toBeTruthy();
  expect(cards()).toHaveLength(0);
});

test('a level and points give the next point and the one after it, from zero ranks', () => {
  setTalents({ weights: { archeology: { SKLEP_EXP_BONUS: 1 } } });
  renderWithTheme(<TalentsPage />);
  type('Hero level', '100');
  type('Points to spend', '20');
  expect(talentsOf().heroLevel).toBe(100);
  expect(talentsOf().pointsOverride).toBe(20);
  expect(cards()).toHaveLength(2);
  // Default order Battle, Archeology, Economy at Focus, Blended: a cheap Archeology parent opens a strong child.
  expect(card('Next point').textContent).toMatch(/Tar production speed I/);
  expect(card('Next point').textContent).toMatch(/Archeology/);
  expect(card('Next point').textContent).toMatch(/Opens a stronger talent/i);
  expect(screen.getByText(/spends \d+ of 20 points/i)).toBeTruthy();
});

test('moving a goal to the top changes the next point, and the order is saved', () => {
  renderWithTheme(<TalentsPage />);
  type('Hero level', '150');
  type('Points to spend', '60');
  expect(card('Next point').textContent).toMatch(/Battle/);
  fireEvent.click(screen.getByRole('button', { name: 'Move Economy up' }));
  fireEvent.click(screen.getByRole('button', { name: 'Move Economy up' }));
  expect(talentsOf().goals).toEqual(['economy', 'battle', 'archeology']);
  expect(goalRows()[0]!.textContent).toMatch(/^1Economy/);
  expect(card('Next point').textContent).toMatch(/production/i);
  expect(card('Next point').textContent).toMatch(/Economy/);
  expect(screen.getByRole('button', { name: 'Move Economy up' }).hasAttribute('disabled')).toBe(true);
});

test('an ignored goal vanishes from the cards, the next goal takes rank 1, and one goal stays active', () => {
  setTalents({ weights: { archeology: { SKLEP_EXP_BONUS: 1 } } });
  renderWithTheme(<TalentsPage />);
  type('Hero level', '100');
  type('Points to spend', '20');
  expect(card('Next point').textContent).toMatch(/Archeology/);
  fireEvent.click(screen.getByRole('button', { name: 'Ignore Archeology' }));
  expect(talentsOf().ignored).toEqual(['archeology']);
  for (const c of cards()) expect(c.textContent).not.toMatch(/Archeology/);
  fireEvent.click(screen.getByRole('button', { name: 'Ignore Battle' }));
  expect(goalRows().find((r) => /Economy/.test(r.textContent))!.textContent).toMatch(/^1Economy/);
  expect(screen.getByRole('button', { name: 'Ignore Economy' }).hasAttribute('disabled')).toBe(true);
  for (const c of cards()) expect(c.textContent).toMatch(/Economy/);
  // Putting a goal back is the same button.
  fireEvent.click(screen.getByRole('button', { name: 'Ignore Battle' }));
  expect(talentsOf().ignored).toEqual(['archeology']);
});

test('a move is announced with the rank shown on the row, counting active goals only', () => {
  setTalents({ ignored: ['battle'] });
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Move Economy up' }));
  expect(talentsOf().goals).toEqual(['battle', 'economy', 'archeology']);
  expect(goalRows()[1]!.textContent).toMatch(/^1Economy/);
  expect(screen.getByRole('status').textContent).toBe('Economy is now 1 of 2.');
  fireEvent.click(screen.getByRole('button', { name: 'Move Battle down' }));
  expect(screen.getByRole('status').textContent).toBe('Battle moved down. It is ignored.');
});

test('strength and mode change the order with no button press', () => {
  setTalents({ heroLevel: 100, pointsOverride: 20, weights: { archeology: { SKLEP_EXP_BONUS: 1 } } });
  renderWithTheme(<TalentsPage />);
  expect(card('Next point').textContent).toMatch(/Archeology/);
  pick('How points are spread', 'Strict order');
  expect(talentsOf().mode).toBe('strict');
  expect(card('Next point').textContent).toMatch(/Battle/);
  expect(screen.getByText(/rank 1 first, then rank 2/i)).toBeTruthy();
  pick('How points are spread', 'Blended');

  cleanup();
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 60,
    mode: 'blended',
    // Resource production is worth +80 % on paper, which would beat any battle bonus at Even; leave it out.
    weights: { economy: { MINE_PRODUCTION_SPEED: 0 } },
  });
  renderWithTheme(<TalentsPage />);
  expect(card('Next point').textContent).toMatch(/Economy/);
  pick('Strength of rank 1', 'Even');
  expect(talentsOf().strength).toBe('even');
  expect(card('Next point').textContent).toMatch(/Battle/);
});

test('the strength help is hidden until its button opens it', () => {
  renderWithTheme(<TalentsPage />);
  const help = screen.getByRole('button', { name: /what focus, lean and even mean/i });
  expect(help.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByText(/rank 2 counts half/i)).toBeNull();
  fireEvent.click(help);
  expect(help.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByText(/rank 2 counts half/i)).toBeTruthy();
  // The strength selector sits on the rank 1 row only.
  expect(within(goalRows()[0]!).getByRole('radiogroup', { name: 'Strength of rank 1' })).toBeTruthy();
  expect(within(goalRows()[1]!).queryByRole('radiogroup')).toBeNull();
});

test('a saved old single goal comes back as rank 1', () => {
  const doc = newRoot('device');
  const { goals: _g, ignored: _i, strength: _s, mode: _m, ...rest } = doc.profiles[0]!.talents;
  const old = {
    ...doc,
    schemaVersion: 11,
    profiles: [{ ...doc.profiles[0], talents: { ...rest, goal: 'archeology' } }],
  };
  useStore.getState().replaceDocument(migrate(JSON.parse(JSON.stringify(old))));
  renderWithTheme(<TalentsPage />);
  expect(goalRows()[0]!.textContent).toMatch(/^1Archeology/);
  expect(talentsOf().goals[0]).toBe('archeology');
});

test('the old ranking by value per point is gone', () => {
  setTalents({ heroLevel: 150, pointsOverride: 30 });
  renderWithTheme(<TalentsPage />);
  expect(screen.queryByText(/per point, \d+ points? spent/)).toBeNull();
  expect(screen.queryByRole('radiogroup', { name: /best value per point/i })).toBeNull();
});

test('ranks already bought are kept and the plan builds on them', () => {
  const node = TALENTS.find((t) => t.tree === 'battle' && t.parents.length === 0)!;
  setTalents({ heroLevel: 150, pointsOverride: 5, ranks: { [String(node.id)]: 1 } });
  renderWithTheme(<TalentsPage />);
  expect(talentsOf().ranks[String(node.id)]).toBe(1);
  expect(card('Next point')).toBeTruthy();
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

test("the Archeology weights carry the game's own words for crypt exploration", () => {
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: /weights/i }));
  for (const name of [
    'Crypt exploration efficiency',
    'Chance to explore a Crypt twice',
    'Crypt exploration cost',
    'Crypt experience',
  ]) {
    expect(screen.getByRole('textbox', { name: `Weight of ${name}`, hidden: true })).toBeTruthy();
  }
  expect(screen.queryByRole('textbox', { name: 'Weight of Crypt damage', hidden: true })).toBeNull();
});

const countBox = (stat: string) =>
  screen.getByRole('checkbox', { name: new RegExp(`^${stat}$`), hidden: true }) as HTMLInputElement;

test('every stat has a tick, set by the defaults: carrying capacity and march speed off, strength on (B-23 b)', () => {
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: /weights/i }));
  expect(countBox('Strength').checked).toBe(true);
  expect(countBox('Health').checked).toBe(true);
  expect(countBox('Carrying capacity').checked).toBe(false);
  expect(countBox('March speed').checked).toBe(false);
  expect(countBox('Crafting speed').checked).toBe(false);
  expect(countBox('Crypt experience').checked).toBe(false);
  expect(countBox('Crypt exploration efficiency').checked).toBe(true);
});

test('ticking a stat that is off saves a weight of 1, unticking one that is on saves 0, and going back drops the override', () => {
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: /weights/i }));
  fireEvent.click(countBox('Carrying capacity'));
  expect(talentsOf().weights.battle).toEqual({ UNIT_LOAD_CAPACITY: 1 });
  fireEvent.click(countBox('Strength'));
  expect(talentsOf().weights.battle).toEqual({ UNIT_LOAD_CAPACITY: 1, UNIT_POWER: 0 });
  fireEvent.click(countBox('Strength'));
  fireEvent.click(countBox('Carrying capacity'));
  expect(talentsOf().weights.battle).toEqual({});
});

test('a saved weight shows in the field and a stat off by default shows 0', () => {
  setTalents({ weights: { battle: { UNIT_HEALTH: 2.5 } } });
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: /weights/i }));
  const field = (name: string) =>
    screen.getByRole('textbox', { name: `Weight of ${name}`, hidden: true }) as HTMLInputElement;
  expect(field('Health').value).toBe('2.5');
  expect(field('Carrying capacity').value).toBe('0');
  expect(field('Strength').value).toBe('1');
});

test('crypt types start all ticked, and unticking one is saved', () => {
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: /crypts that count/i }));
  const box = (name: string) => screen.getByRole('checkbox', { name, hidden: true }) as HTMLInputElement;
  expect(box('Common crypts').checked).toBe(true);
  expect(box('Rare crypts').checked).toBe(true);
  expect(box('Epic crypts').checked).toBe(true);
  fireEvent.click(box('Rare crypts'));
  expect(talentsOf().crypts).toEqual(['common', 'epic']);
});

test('the tree head and the tab count held ranks and planned steps apart, and tiles show the plan order', () => {
  const node = TALENTS.find((t) => t.tree === 'economy' && t.parents.length === 0)!;
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 40,
    ranks: { [String(node.id)]: 1 },
  });
  renderWithTheme(<TalentsPage />);
  const head = screen.getByText(/ · \d+ spent \+ \d+ planned$/);
  expect(head.textContent).toMatch(/^Economy · 1 spent \+ [1-9]\d* planned$/);
  expect(
    within(screen.getByRole('radiogroup', { name: 'Tree' })).getAllByText(/^\d+ planned$/).length,
  ).toBeGreaterThan(0);
  const tree = screen.getByRole('region', { name: 'Economy tree' });
  expect(within(tree).getAllByRole('button', { name: /step \d+ of the plan/ }).length).toBeGreaterThan(0);
});
