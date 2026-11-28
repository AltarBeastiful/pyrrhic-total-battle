// @vitest-environment jsdom
/**
 * The Bonuses body over a binding that is not the store's: the Prime Arena's squad. Captains are capped by the
 * binding (five), every write goes to the binding and none to the active march, and a scope leaves out the
 * families the arena never counts. The calculator's own reading is `BonusesSection.test.tsx`.
 */
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { captains as captainTable } from '@/data';
import { newProfile, newRoot, defaultSetup } from '@/state/defaults';
import type { BattleSetup } from '@/state/schema';
import type { SetupBinding } from '@/state/setupBinding';
import { selectActiveSetup, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

import { BonusesBody } from './BonusesBody';
import { FULL_SCOPE, type BodyScope } from './bodyScope';

const ARENA_SCOPE: BodyScope = {
  families: ['captains', 'equipment'],
  folded: ['artifacts'],
  hero: false,
  marchType: false,
  audit: false,
};

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  Element.prototype.scrollIntoView ??= () => {};
  globalThis.localStorage.clear();
  const root = newRoot();
  const profile = newProfile('arena');
  root.profiles = [profile];
  root.activeProfileId = profile.id;
  useStore.getState().replaceDocument(root);
});

afterEach(() => {
  cleanup();
});

/** A body bound to a squad that lives in component state, the way the arena's lives in its own store. */
function Squad({
  captains,
  scope,
  onSetup,
}: {
  captains: number;
  scope: BodyScope;
  onSetup: (setup: BattleSetup) => void;
}) {
  const [setup, setSetup] = useState<BattleSetup>(() => defaultSetup());
  const profile = useStore((state) => state.doc.profiles[0])!;
  const binding: SetupBinding = {
    setup,
    caps: { captains, artifacts: 3 },
    update: (edit) => {
      const next = { ...setup, ...edit(setup) };
      setSetup(next);
      onSetup(next);
    },
  };
  return <BonusesBody profile={profile} binding={binding} scope={scope} />;
}

const chip = (name: string): HTMLElement =>
  screen.queryByRole('checkbox', { name: `Send ${name} on this march` }) ??
  screen.getByRole('checkbox', { name: `${name}, riding with this march` });

const NAMES = captainTable.slice(0, 6).map((record) => record.name);

test('the binding sets the captain cap: five ride, the sixth is refused in the binding’s own words', () => {
  let squad: BattleSetup | undefined;
  renderWithTheme(
    <Squad
      captains={5}
      scope={ARENA_SCOPE}
      onSetup={(next) => {
        squad = next;
      }}
    />,
  );
  for (const name of NAMES.slice(0, 5)) fireEvent.click(chip(name));
  expect(squad?.active.captains).toHaveLength(5);

  fireEvent.click(chip(NAMES[5]!));
  expect(squad?.active.captains).toHaveLength(5);
  expect(screen.getAllByRole('status')[0]?.textContent).toMatch(/five captains at most/i);
});

test('writes go to the binding and never to the active march', () => {
  const before = selectActiveSetup(useStore.getState());
  renderWithTheme(<Squad captains={5} scope={ARENA_SCOPE} onSetup={() => {}} />);
  act(() => {
    fireEvent.click(chip('Beowulf'));
  });
  expect(selectActiveSetup(useStore.getState())).toBe(before);
  expect(before?.active.captains).toEqual([]);
});

test('a scope leaves out the hero, the march type and the families the fight never counts', () => {
  renderWithTheme(<Squad captains={5} scope={ARENA_SCOPE} onSetup={() => {}} />);
  expect(screen.queryByRole('checkbox', { name: /hero/i })).toBeNull();
  for (const title of ['Permanent', 'Other', 'Events', 'Recovery', 'Titles', 'Summary']) {
    expect(screen.queryByText(title, { exact: true })).toBeNull();
  }
  expect(screen.getByText('Hero and captains')).toBeTruthy();
  expect(screen.getByText('Equipment')).toBeTruthy();
});

test('the full scope keeps every family, so the calculator reads as it always did', () => {
  renderWithTheme(<Squad captains={3} scope={FULL_SCOPE} onSetup={() => {}} />);
  for (const title of ['Permanent', 'Events', 'Titles', 'Summary']) {
    expect(within(document.body).getAllByText(title).length).toBeGreaterThan(0);
  }
});

test('a counting scope draws the named permanent sources as switches, and its extras beside them', () => {
  const toggled: [string, boolean][] = [];
  const on = new Set(['hallOfFame', 'talents']);
  const scope: BodyScope = {
    ...ARENA_SCOPE,
    families: ['captains', 'equipment', 'permanent'],
    counting: {
      builtins: ['hallOfFame', 'customization'],
      extras: [{ key: 'talents', name: 'Talents' }],
      isOn: (key) => on.has(key),
      toggle: (key, next) => {
        toggled.push([key, next]);
      },
    },
  };
  renderWithTheme(<Squad captains={5} scope={scope} onSetup={() => {}} />);
  const group = screen.getByRole('group', { name: /permanent sources/i });
  // Only the named rows and the extras; the gear still edits the values, and there is no Add button.
  expect(
    within(group)
      .getAllByRole('checkbox')
      .map((box) => box.getAttribute('aria-label')),
  ).toEqual(['Customization, not counted', 'Hall of Fame, counted', 'Talents, counted']);
  expect(screen.queryByRole('button', { name: /add permanent source/i })).toBeNull();
  fireEvent.click(within(group).getByRole('checkbox', { name: 'Customization, not counted' }));
  fireEvent.click(within(group).getByRole('checkbox', { name: 'Talents, counted' }));
  expect(toggled).toEqual([
    ['customization', true],
    ['talents', false],
  ]);
  expect(within(group).getByRole('button', { name: 'Edit Hall of Fame' })).toBeTruthy();
});
