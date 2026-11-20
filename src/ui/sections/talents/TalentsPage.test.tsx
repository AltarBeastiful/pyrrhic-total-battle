// @vitest-environment jsdom
/**
 * **The Talents page** (B-21 Seam 2, priorities B-22 Seam 2): enter a hero level and the points to spend, rank
 * the goals, and read the next two points on cards; the tree carries the whole plan. What the player types or
 * chooses is saved on the account. Sideways overflow is left to the end-to-end journey.
 */
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { talents as TALENTS } from '@/data';
import { newRoot } from '@/state/defaults';
import { migrate } from '@/state/migrations';
import type { Talents } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';
import { useUiStore } from '@/ui/uiStore';

import { talentFamily } from './talentFamily';
import { TalentsPage } from './TalentsPage';

beforeEach(() => {
  globalThis.localStorage.clear();
  useStore.getState().replaceDocument(newRoot());
  // Most of these walk the Economy tree; the Battle default has its own test below.
  useUiStore.setState({ talentsTree: 'economy' });
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
// The next-points fold is closed by default; its content stays in the document, so the cards are found hidden too.
const card = (name: 'Next point' | 'Then') => screen.getByRole('article', { name, hidden: true });
const cards = () => screen.queryAllByRole('article', { hidden: true });
const pick = (group: string, option: string): void => {
  fireEvent.click(
    within(screen.getByRole('radiogroup', { name: group })).getByRole('radio', { name: option }),
  );
};

test('without a points figure it asks for one and plans nothing', () => {
  renderWithTheme(<TalentsPage />);
  expect(screen.getByText(/type your whole stock of talent points/i)).toBeTruthy();
  expect(cards()).toHaveLength(0);
});

test('a level and points give the next point and the one after it, from zero ranks', () => {
  setTalents({ weights: { archeology: { SKLEP_EXP_BONUS: 1 } } });
  renderWithTheme(<TalentsPage />);
  type('Hero level', '100');
  type('Talent points (your whole stock)', '20');
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
  type('Talent points (your whole stock)', '60');
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
  type('Talent points (your whole stock)', '20');
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
  fireEvent.click(screen.getByRole('button', { name: /what blended and strict order mean/i }));
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

test('research speed has its own tick, on; the catch-all economy stat is named for what it is, off', () => {
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: /weights/i }));
  expect(countBox('Research speed').checked).toBe(true);
  expect(countBox('Tile bonus').checked).toBe(false);
  expect(screen.queryByRole('checkbox', { name: /other economy bonuses/i, hidden: true })).toBeNull();
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

test('the Strength weight shows what a point is worth on each troop group, as measured', () => {
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: /weights/i }));
  const note = screen.getByText(/measured on 22 armies/i, { ignore: 'script' });
  expect(note.textContent).toMatch(/Guardsmen x1\b/);
  expect(note.textContent).toMatch(/Specialists x0\.14/);
  expect(note.textContent).toMatch(/Mounted x0\.41/);
  expect(note.textContent).not.toMatch(/—/);
});

const groupBox = (name: string) => screen.getByRole('checkbox', { name, hidden: true }) as HTMLInputElement;

test('troop groups follow the account, and the player can switch one off or on', () => {
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: /troop groups/i }));
  // A first-run account: guardsmen and specialists, no engineers, no monsters.
  expect(groupBox('Guardsmen').checked).toBe(true);
  expect(groupBox('Specialists').checked).toBe(true);
  expect(groupBox('Engineers').checked).toBe(false);
  expect(groupBox('Monsters').checked).toBe(false);
  fireEvent.click(groupBox('Specialists'));
  expect(talentsOf().groupOverrides).toEqual({ specialist: false });
  fireEvent.click(groupBox('Engineers'));
  expect(talentsOf().groupOverrides).toEqual({ specialist: false, engineers: true });
  fireEvent.click(groupBox('Specialists'));
  fireEvent.click(groupBox('Engineers'));
  expect(talentsOf().groupOverrides).toEqual({});
});

test('a group the player switched off puts no talent point into its nodes beyond an opening rank', () => {
  setTalents({ heroLevel: 150, pointsOverride: 120, groupOverrides: { specialist: false } });
  renderWithTheme(<TalentsPage />);
  const text = screen
    .getAllByRole('article', { hidden: true })
    .map((c) => c.textContent)
    .join(' ');
  expect(text).not.toMatch(/Specialists' (strength|health)/);
});

// ---- The points are the whole stock; ranks held spend them (B-23) --------------------------------------
const rootNode = () =>
  TALENTS.find((t) => t.tree === 'economy' && t.parents.length === 0 && t.maxRank >= 3 && t.costs[0] === 1)!;
const tileOf = (name: string) =>
  within(screen.getByRole('region', { name: 'Economy tree' })).getByRole('button', {
    name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, rank`),
  });

test('the ranks held spend the stock, and the plan works on what is left', () => {
  const node = rootNode();
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 20,
    ranks: { [String(node.id)]: 3 },
  });
  renderWithTheme(<TalentsPage />);
  expect(screen.getByText(/17 of 20 points left/i)).toBeTruthy();
  expect(screen.getByText(/plan spends \d+ of 17 points/i)).toBeTruthy();
});

test('ranks worth more than the stock say so and plan nothing', () => {
  const node = rootNode();
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 2,
    ranks: { [String(node.id)]: 3 },
  });
  renderWithTheme(<TalentsPage />);
  expect(screen.getByText(/1 point more than your stock/i)).toBeTruthy();
  expect(cards()).toHaveLength(0);
});

const plusOf = (name: string) => screen.getByRole('button', { name: `Add one rank to ${name}` });

test('a click on a tile only selects it: the + and - pad appears under it and nothing is spent', () => {
  const node = rootNode();
  setTalents({ goals: ['economy', 'battle', 'archeology'], heroLevel: 150, pointsOverride: 10 });
  renderWithTheme(<TalentsPage />);
  expect(screen.queryByRole('button', { name: /^Add one rank to/ })).toBeNull();
  fireEvent.click(tileOf(node.name));
  fireEvent.click(tileOf(node.name));
  expect(talentsOf().ranks[String(node.id)]).toBeUndefined();
  expect(plusOf(node.name)).toBeTruthy();
  const other = TALENTS.find((t) => t.tree === 'economy' && t.parents.includes(node.id))!;
  fireEvent.click(tileOf(other.name));
  expect(screen.queryByRole('button', { name: `Add one rank to ${node.name}` })).toBeNull();
});

test('the + on the selected tile spends a point on it, as in the game', () => {
  const node = rootNode();
  setTalents({ goals: ['economy', 'battle', 'archeology'], heroLevel: 150, pointsOverride: 10 });
  renderWithTheme(<TalentsPage />);
  fireEvent.click(tileOf(node.name));
  fireEvent.click(plusOf(node.name));
  expect(talentsOf().ranks[String(node.id)]).toBe(1);
  fireEvent.click(plusOf(node.name));
  expect(talentsOf().ranks[String(node.id)]).toBe(2);
  expect(screen.getByText(/8 of 10 points left/i)).toBeTruthy();
});

test('a click does not spend on a locked tile, past the maximum, or beyond the stock', () => {
  const node = rootNode();
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 1,
    ranks: { [String(node.id)]: 1 },
  });
  renderWithTheme(<TalentsPage />);
  fireEvent.click(tileOf(node.name));
  fireEvent.click(plusOf(node.name));
  expect(talentsOf().ranks[String(node.id)]).toBe(1);
  expect(screen.getByText(/not enough points/i)).toBeTruthy();
  // A tile locked by hero level cannot be bought round, whatever the stock.
  const gated = TALENTS.find((t) => t.tree === 'economy' && (t.levelGate ?? 0) > 1)!;
  setTalents({ pointsOverride: 50, heroLevel: 1, ranks: {} });
  fireEvent.click(tileOf(gated.name));
  fireEvent.click(plusOf(gated.name));
  expect(talentsOf().ranks[String(gated.id)]).toBeUndefined();
});

test('a + on a tile locked only by a parent opens the parent with one rank first', () => {
  const node = rootNode();
  const child = TALENTS.find(
    (t) => t.tree === 'economy' && t.parents.length === 1 && t.parents[0] === node.id,
  )!;
  setTalents({ goals: ['economy', 'battle', 'archeology'], heroLevel: 150, pointsOverride: 50 });
  renderWithTheme(<TalentsPage />);
  fireEvent.click(tileOf(child.name));
  fireEvent.click(plusOf(child.name));
  expect(talentsOf().ranks[String(node.id)]).toBe(1);
  expect(talentsOf().ranks[String(child.id)]).toBe(1);
});

test('Max in the detail buys to the maximum the stock pays, and Reset takes the node back to zero', () => {
  const node = rootNode();
  setTalents({ goals: ['economy', 'battle', 'archeology'], heroLevel: 150, pointsOverride: 500 });
  renderWithTheme(<TalentsPage />);
  fireEvent.click(tileOf(node.name));
  fireEvent.click(screen.getByRole('button', { name: 'Max' }));
  expect(talentsOf().ranks[String(node.id)]).toBe(node.maxRank);
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(talentsOf().ranks[String(node.id)]).toBeUndefined();
});

test('a full rank reads differently from an empty one, on the bar and in the label', () => {
  const node = rootNode();
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    // Exactly what the full rank costs: nothing is left, so the plan adds no rank anywhere.
    pointsOverride: node.costs.reduce((a, b) => a + b, 0),
    ranks: { [String(node.id)]: node.maxRank },
  });
  renderWithTheme(<TalentsPage />);
  const full = tileOf(node.name);
  expect(full.querySelector('[data-bar-state="full"]')).not.toBeNull();
  expect(full.textContent).toMatch(
    new RegExp(`${String(node.maxRank)}\\s*/\\s*${String(node.maxRank)}|max`, 'i'),
  );
  const other = TALENTS.find((t) => t.tree === 'economy' && t.parents.includes(node.id) && t.maxRank >= 3)!;
  const empty = tileOf(other.name);
  expect(empty.querySelector('[data-bar-state="empty"]')).not.toBeNull();
});

test('a tile locked by hero level says so with a lock and the level, not just dimmed text', () => {
  setTalents({ goals: ['economy', 'battle', 'archeology'], heroLevel: 1, pointsOverride: 10 });
  renderWithTheme(<TalentsPage />);
  const tree = screen.getByRole('region', { name: 'Economy tree' });
  const badges = tree.querySelectorAll('[data-lock="level"]');
  expect(badges.length).toBeGreaterThan(0);
  expect(badges[0]!.textContent).toMatch(/Lv\s*\d+/);
  expect(tree.querySelector('[data-lock="level"] svg')).not.toBeNull();
});

test('the selected tile has a Take back button on its pad, off when it holds no rank', () => {
  const node = rootNode();
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 10,
    ranks: { [String(node.id)]: 2 },
  });
  renderWithTheme(<TalentsPage />);
  const tree = screen.getByRole('region', { name: 'Economy tree' });
  expect(within(tree).queryByRole('button', { name: `Take one rank back from ${node.name}` })).toBeNull();
  fireEvent.click(tileOf(node.name));
  fireEvent.click(within(tree).getByRole('button', { name: `Take one rank back from ${node.name}` }));
  expect(talentsOf().ranks[String(node.id)]).toBe(1);
  fireEvent.click(within(tree).getByRole('button', { name: `Take one rank back from ${node.name}` }));
  expect(talentsOf().ranks[String(node.id)]).toBeUndefined();
  expect(
    (within(tree).getByRole('button', { name: `Take one rank back from ${node.name}` }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});

test('Spend up to here on the second card buys both planned steps at once', () => {
  setTalents({ goals: ['economy', 'battle', 'archeology'], heroLevel: 150, pointsOverride: 30 });
  renderWithTheme(<TalentsPage />);
  fireEvent.click(within(card('Then')).getByRole('button', { name: /spend up to here/i, hidden: true }));
  const held = Object.values(talentsOf().ranks).reduce((a, b) => a + b, 0);
  expect(held).toBe(2);
  expect(screen.getByText(/28 of 30 points left/i)).toBeTruthy();
});

test('a planned node offers to spend the plan up to it, and the points left follow', () => {
  setTalents({ goals: ['economy', 'battle', 'archeology'], heroLevel: 150, pointsOverride: 30 });
  renderWithTheme(<TalentsPage />);
  const tree = screen.getByRole('region', { name: 'Economy tree' });
  const planned = tree.querySelector('button[data-state="planned"]') as HTMLElement;
  expect(planned).not.toBeNull();
  fireEvent.click(planned); // selects it
  const button = screen.getByRole('button', { name: /spend the plan up to here/i });
  expect(button.textContent).toMatch(/\d+ points?/);
  const before = Object.values(talentsOf().ranks).reduce((a, b) => a + b, 0);
  fireEvent.click(button);
  const after = Object.values(talentsOf().ranks).reduce((a, b) => a + b, 0);
  expect(after).toBeGreaterThan(before);
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

test('a tile shows its rank as a bar over the number, and no #step number', () => {
  const node = TALENTS.find((t) => t.tree === 'economy' && t.parents.length === 0 && t.maxRank >= 10)!;
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 40,
    ranks: { [String(node.id)]: 5 },
  });
  renderWithTheme(<TalentsPage />);
  const tree = screen.getByRole('region', { name: 'Economy tree' });
  const tile = within(tree).getByRole('button', {
    name: new RegExp(`^${node.name}, rank 5 of ${String(node.maxRank)}`),
  });
  const bought = tile.querySelector('[data-bar="bought"]') as HTMLElement;
  expect(bought).not.toBeNull();
  expect(bought.style.width).toBe(`${String((5 / node.maxRank) * 100)}%`);
  expect(tile.textContent).toMatch(/rank 5/);
  for (const t of within(tree).getAllByRole('button')) expect(t.textContent).not.toMatch(/#\d/);
});

test('the tree head and the tab count held ranks and planned steps apart, and tiles carry the plan order for a screen reader', () => {
  const node = TALENTS.find((t) => t.tree === 'economy' && t.parents.length === 0)!;
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 40,
    ranks: { [String(node.id)]: 1 },
  });
  renderWithTheme(<TalentsPage />);
  const tabs = within(screen.getByRole('radiogroup', { name: 'Tree' }));
  expect(tabs.getAllByText('1 spent').length).toBeGreaterThan(0);
  expect(tabs.getAllByText(/^[1-9]\d* planned$/).length).toBeGreaterThan(0);
  const tree = screen.getByRole('region', { name: 'Economy tree' });
  expect(within(tree).getAllByRole('button', { name: /step \d+ of the plan/ }).length).toBeGreaterThan(0);
});

test('the next-points fold is closed by default and keeps the points left in view', () => {
  setTalents({ goals: ['economy', 'battle', 'archeology'], heroLevel: 150, pointsOverride: 30 });
  renderWithTheme(<TalentsPage />);
  const fold = screen.getByRole('button', { name: /spend your next points/i });
  expect(fold.getAttribute('aria-expanded')).toBe('false');
  expect(fold.textContent).toMatch(/30 of 30 points left/);
  fireEvent.click(fold);
  expect(fold.getAttribute('aria-expanded')).toBe('true');
});

test('Reset gives back every rank held in the open tree and leaves the other trees alone', () => {
  const node = rootNode();
  const other = TALENTS.find((t) => t.tree === 'battle' && t.parents.length === 0)!;
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 40,
    ranks: { [String(node.id)]: 2, [String(other.id)]: 1 },
  });
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: /reset points spent in economy/i }));
  expect(talentsOf().ranks).toEqual({ [String(other.id)]: 1 });
  expect(
    (screen.getByRole('button', { name: /reset points spent in economy/i }) as HTMLButtonElement).disabled,
  ).toBe(true);
});

test('Spend the plan up to here takes only the open tree, up to the tile and its level', () => {
  setTalents({ goals: ['economy', 'battle', 'archeology'], heroLevel: 150, pointsOverride: 30 });
  renderWithTheme(<TalentsPage />);
  const tree = screen.getByRole('region', { name: 'Economy tree' });
  const planned = tree.querySelector('button[data-state="planned"]') as HTMLElement;
  fireEvent.click(planned);
  fireEvent.click(screen.getByRole('button', { name: /spend the plan up to here/i }));
  const held = Object.keys(talentsOf().ranks).map((id) => TALENTS.find((t) => String(t.id) === id)!);
  expect(held.length).toBeGreaterThan(0);
  expect(held.every((t) => t.tree === 'economy')).toBe(true);
});

test('a tile shows its rank on the left and its bonus on the right, and the detail lists every rank with the held one marked', () => {
  const node = TALENTS.find((t) => t.tree === 'economy' && t.parents.length === 0 && t.maxRank >= 10)!;
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 40,
    ranks: { [String(node.id)]: 5 },
  });
  renderWithTheme(<TalentsPage />);
  const tile = tileOf(node.name);
  expect(tile.textContent).toContain('rank 5');
  expect(tile.textContent).toContain(`+${String(node.values[4])} %`);
  fireEvent.click(tile);
  // One line of at most five key chips; the full list is the same chips, wrapped, in a box of its own.
  const line = screen.getByRole('list', { name: `${node.name} key ranks` });
  const keys = within(line).getAllByRole('listitem');
  expect(keys.length).toBeLessThanOrEqual(5);
  expect(keys.map((k) => k.getAttribute('data-rank-n'))).toEqual(
    expect.arrayContaining(['1', '5', String(node.maxRank)]),
  );
  fireEvent.click(screen.getByRole('button', { name: `Show all ${String(node.maxRank)} ranks` }));
  const box = within(screen.getByRole('dialog')).getByRole('region', { name: `${node.name} ranks` });
  expect(box.querySelector('table')).toBeNull();
  expect(within(box).getAllByRole('listitem')).toHaveLength(node.maxRank);
  const now = box.querySelector('[data-rank="now"]')!;
  expect(now.getAttribute('data-rank-n')).toBe('5');
  const chip = now.querySelector('[aria-label]')!;
  expect(chip.getAttribute('aria-label')).toBe(chip.getAttribute('title'));
  expect(chip.getAttribute('aria-label')).toMatch(
    /rank 5, held: costs \d+ points?, adds \+.* %, total \+.* %/,
  );
  expect(chip.textContent).not.toMatch(/cost|adds/);
  expect(chip.getAttribute('tabindex')).toBe('0');
});

test('hovering a tile shows its pad with a small max next to +, and leaving hides it', () => {
  const node = rootNode();
  setTalents({ goals: ['economy', 'battle', 'archeology'], heroLevel: 150, pointsOverride: 500 });
  renderWithTheme(<TalentsPage />);
  const box = tileOf(node.name).parentElement!;
  expect(screen.queryByRole('button', { name: `Add one rank to ${node.name}` })).toBeNull();
  fireEvent.mouseEnter(box);
  fireEvent.click(screen.getByRole('button', { name: `Buy ${node.name} up to its maximum` }));
  expect(talentsOf().ranks[String(node.id)]).toBe(node.maxRank);
  fireEvent.mouseLeave(box);
  expect(screen.queryByRole('button', { name: `Add one rank to ${node.name}` })).toBeNull();
});

test('the points strip says what all trees hold, planned and spent, and what is left', () => {
  const node = rootNode();
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 40,
    ranks: { [String(node.id)]: 2 },
  });
  renderWithTheme(<TalentsPage />);
  const banner = screen.getByRole('group', { name: 'Points' });
  expect(banner.textContent).toMatch(/All trees\s*2 spent.*of 40 in all/);
  expect(banner.textContent).toMatch(/38 left/);
});

test('the tree recap sums each stat over the tree', () => {
  const node = rootNode();
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 40,
    ranks: { [String(node.id)]: 3 },
  });
  renderWithTheme(<TalentsPage />);
  const recap = screen.getByRole('region', { name: 'Economy bonuses' });
  expect(recap.textContent).toContain(`+${String(node.values[2])} %`);
  expect(recap.textContent).toContain(talentFamily(node.name).family);
});

test('a family under a quarter complete waits behind one small Show more line, and it lists exactly those rows', () => {
  const ranks: Record<string, number> = {};
  for (const t of TALENTS.filter((t) => t.tree === 'economy')) ranks[String(t.id)] = 1;
  setTalents({ goals: ['economy', 'battle', 'archeology'], heroLevel: 150, pointsOverride: 500, ranks });
  renderWithTheme(<TalentsPage />);
  const recap = screen.getByRole('region', { name: 'Economy bonuses' });
  const rowsNow = () => recap.querySelectorAll('dt').length;
  const button = within(recap).getByRole('button', { name: /show \d+ more/i });
  const hidden = Number(/show (\d+) more/i.exec(button.textContent ?? '')![1]);
  expect(hidden).toBeGreaterThan(0);
  const before = rowsNow();
  fireEvent.click(button);
  expect(rowsNow()).toBe(before + hidden);
  expect(within(recap).getByRole('button', { name: /show less/i })).toBeTruthy();
});

test('a 1/N bonus still shows while fewer than four families pass (the floor)', () => {
  const node = rootNode();
  setTalents({
    goals: ['economy', 'battle', 'archeology'],
    heroLevel: 150,
    pointsOverride: 40,
    ranks: { [String(node.id)]: 1 },
  });
  renderWithTheme(<TalentsPage />);
  const recap = screen.getByRole('region', { name: 'Economy bonuses' });
  expect(recap.textContent).toContain(talentFamily(node.name).family);
});

// ---- B-25 Seam 2: copy the held ranks to the Hero Talents bonus ----

const meleeNode = () => TALENTS.find((t) => t.tree === 'battle' && t.name === "Guardsmen's strength I")!;
const COPY = 'Copy to battle bonuses';
const heroSource = () =>
  selectActiveProfile(useStore.getState())!.sources.permanent.find((e) => e.builtin === 'heroTalents')!;

function hold(rank: number): void {
  const node = meleeNode();
  setTalents({ ranks: { ...talentsOf().ranks, [String(node.id)]: rank } });
}
function setHero(strength: Record<string, number>): void {
  const profile = selectActiveProfile(useStore.getState())!;
  useStore.getState().updateProfile(profile.id, {
    sources: {
      ...profile.sources,
      permanent: profile.sources.permanent.map((e) => (e.builtin === 'heroTalents' ? { ...e, strength } : e)),
    },
  });
}
const describedBy = (button: HTMLElement): string =>
  (button.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');

test('with no rank held the copy button is disabled and says why', () => {
  renderWithTheme(<TalentsPage />);
  const button = screen.getByRole('button', { name: COPY }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  expect(screen.getByText(/hold a rank to copy/i)).toBeTruthy();
});

test('a first copy asks nothing, writes the lines, and the button turns quiet', () => {
  hold(1);
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: COPY }));
  expect(screen.queryByRole('alertdialog')).toBeNull();
  const lines = heroSource().strength;
  expect(Object.keys(lines).length).toBeGreaterThan(0);
  expect(Object.values(lines).every((v) => v !== 0)).toBe(true);
  expect(heroSource().health).toEqual({});
  expect(screen.getByRole('button', { name: 'Copied, matches your tree' })).toBeTruthy();
});

test('changing a rank turns the button emphasised and the hover names the difference', () => {
  hold(1);
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: COPY }));
  act(() => {
    hold(2);
  });
  const button = screen.getByRole('button', { name: COPY });
  expect(describedBy(button)).toMatch(/strength .* in your tree, .* in Hero Talents/);
});

test('a copy over typed values asks once, and cancelling changes nothing', () => {
  hold(1);
  setHero({ melee: 9 });
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: COPY }));
  const dialog = screen.getByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));
  expect(heroSource().strength).toEqual({ melee: 9 });
  fireEvent.click(screen.getByRole('button', { name: COPY }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: /replace/i }));
  expect(heroSource().strength.melee).toBeUndefined();
  expect(screen.getByRole('button', { name: 'Copied, matches your tree' })).toBeTruthy();
});

test('with no Hero Talents entry the copy creates it and writes the lines', () => {
  hold(1);
  const profile = selectActiveProfile(useStore.getState())!;
  useStore.getState().updateProfile(profile.id, {
    sources: {
      ...profile.sources,
      permanent: profile.sources.permanent.filter((e) => e.builtin !== 'heroTalents'),
    },
  });
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: COPY }));
  expect(Object.keys(heroSource().strength).length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: 'Copied, matches your tree' })).toBeTruthy();
});

test('when in sync the quiet button opens no confirmation', () => {
  hold(1);
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: COPY }));
  fireEvent.click(screen.getByRole('button', { name: 'Copied, matches your tree' }));
  expect(screen.queryByRole('alertdialog')).toBeNull();
});

test('the Talents page opens on Battle whatever the first goal is, and a pick is remembered', () => {
  useUiStore.setState({ talentsTree: 'battle' });
  setTalents({ goals: ['economy', 'battle', 'archeology'], heroLevel: 150, pointsOverride: 40 });
  renderWithTheme(<TalentsPage />);
  expect(screen.getByRole('region', { name: 'Battle tactics tree' })).toBeTruthy();
  fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Tree' })).getByText('Economy'));
  expect(useUiStore.getState().talentsTree).toBe('economy');
});
