/**
 * B-36: the Prime Arena inputs live in the account's profile. The store mirrors them in both directions: an edit is
 * written to the active profile (stamped as its own section), and a new document or a switch of profile hydrates the
 * inputs from it. The plan stays in the view store. The squad is a `BattleSetup` (schema v18).
 */
import { beforeEach, expect, test } from 'vitest';

import { newProfile, newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';

import { topTier, usePrimeArenaStore } from './primeArenaStore';

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  usePrimeArenaStore.getState().reset();
});

test('an edited input is saved on the active profile and stamps its own section', () => {
  usePrimeArenaStore.getState().updateSetup((s) => ({
    housing: { ...s.housing, leadership: 1500 },
    active: { ...s.active, captains: ['c1'] },
  }));
  usePrimeArenaStore.getState().setToggle('talents', false);
  const profile = selectActiveProfile(useStore.getState());
  expect(profile?.primeArena.setup.housing.leadership).toBe(1500);
  expect(profile?.primeArena.setup.active.captains).toEqual(['c1']);
  expect(profile?.primeArena.toggles).toEqual({ talents: false });
  expect(profile?.sectionUpdatedAt?.primeArena).toBeGreaterThan(0);
});

test('inputs saved in a profile fill the store when that document arrives', () => {
  const root = newRoot();
  const profile = newProfile('saved');
  profile.primeArena = {
    tier: 8,
    toggles: { clanTechnologies: true, talents: false, hallOfFame: false },
    setup: {
      ...profile.primeArena.setup,
      active: { ...profile.primeArena.setup.active, captains: ['a', 'b'], equipment: ['e'], dragon: false },
      housing: { leadership: 700, authority: 0, dominance: 300 },
    },
    seeded: true,
  };
  root.profiles = [profile];
  root.activeProfileId = profile.id;
  useStore.getState().replaceDocument(root);
  const { tier, setup, toggles, seeded } = usePrimeArenaStore.getState();
  expect(tier).toBe(8);
  expect(setup.active).toMatchObject({ captains: ['a', 'b'], equipment: ['e'], dragon: false });
  expect(setup.housing).toMatchObject({ leadership: 700, dominance: 300 });
  // a switch an older build saved for a source that no longer exists is dropped
  expect(Object.keys(toggles)).not.toContain('clanTechnologies');
  expect(toggles.talents).toBe(false);
  expect(toggles.hallOfFame).toBe(false);
  expect(toggles.customization).toBe(true);
  expect(seeded).toBe(true);
});

test('a profile with nothing saved shows the top tier, and switching profile swaps the inputs', () => {
  expect(usePrimeArenaStore.getState().tier).toBe(topTier());
  usePrimeArenaStore.getState().updateSetup((s) => ({ housing: { ...s.housing, dominance: 42 } }));
  const other = useStore.getState().createProfile('other');
  useStore.getState().setActiveProfile(other);
  expect(usePrimeArenaStore.getState().setup.housing.dominance).toBe(0);
});

test('seeding clones the active march, keeps five captains, and leaves the excluded sources out', () => {
  const march = {
    ...newRoot().profiles[0]!.setups[0]!,
    active: {
      captains: ['1', '2', '3'],
      equipment: ['e1'],
      artifacts: ['a1'],
      titles: ['baron'],
      hero: true,
      events: ['x'],
      otherPills: [],
      vip: true,
      dragon: true,
      custom: ['z'],
    },
    marchType: 'solo' as const,
    housing: { leadership: 900, authority: 50, dominance: 400 },
  };
  usePrimeArenaStore.getState().seedFrom(march);
  const { setup, seeded } = usePrimeArenaStore.getState();
  expect(seeded).toBe(true);
  expect(setup.active).toMatchObject({
    captains: ['1', '2', '3'],
    equipment: ['e1'],
    artifacts: ['a1'],
    dragon: true,
    titles: [],
    hero: false,
    events: [],
    vip: false,
    custom: [],
  });
  expect(setup.housing.leadership).toBe(900);
  expect(setup.marchType).toBe('unspecified');
  // a clone: editing the march afterwards does not move the squad
  march.active.captains.push('4');
  expect(usePrimeArenaStore.getState().setup.active.captains).toEqual(['1', '2', '3']);
  // once only
  usePrimeArenaStore.getState().seedFrom({ ...march, active: { ...march.active, captains: ['9'] } });
  expect(usePrimeArenaStore.getState().setup.active.captains).toEqual(['1', '2', '3']);
});

test('the plan is not saved', () => {
  usePrimeArenaStore.setState({ plan: null, planTier: 7 });
  const profile = selectActiveProfile(useStore.getState());
  expect(JSON.stringify(profile)).not.toContain('planTier');
});
