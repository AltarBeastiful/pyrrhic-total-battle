/**
 * B-36: the Prime Arena inputs live in the account's profile. The store mirrors them in both directions: an edit is
 * written to the active profile (stamped as its own section), and a new document or a switch of profile hydrates the
 * inputs from it. The plan stays in the view store.
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
  usePrimeArenaStore.getState().setInputs({ leadership: 1500, captains: ['c1'] });
  usePrimeArenaStore.getState().setToggle('titles', true);
  const profile = selectActiveProfile(useStore.getState());
  expect(profile?.primeArena.leadership).toBe(1500);
  expect(profile?.primeArena.captains).toEqual(['c1']);
  expect(profile?.primeArena.toggles).toEqual({ titles: true });
  expect(profile?.sectionUpdatedAt?.primeArena).toBeGreaterThan(0);
});

test('inputs saved in a profile fill the store when that document arrives', () => {
  const root = newRoot();
  const profile = newProfile('saved');
  profile.primeArena = {
    tier: 8,
    leadership: 700,
    dominance: 300,
    captains: ['a', 'b'],
    equipment: ['e'],
    artifacts: [],
    toggles: { clanTechnologies: true, talents: false },
    seeded: true,
  };
  root.profiles = [profile];
  root.activeProfileId = profile.id;
  useStore.getState().replaceDocument(root);
  const { inputs, seeded } = usePrimeArenaStore.getState();
  expect(inputs).toMatchObject({ tier: 8, leadership: 700, dominance: 300, captains: ['a', 'b'] });
  expect(inputs.toggles.clanTechnologies).toBe(true);
  expect(inputs.toggles.talents).toBe(false);
  expect(inputs.toggles.captains).toBe(true);
  expect(seeded).toBe(true);
});

test('a profile with nothing saved shows the top tier, and switching profile swaps the inputs', () => {
  expect(usePrimeArenaStore.getState().inputs.tier).toBe(topTier());
  usePrimeArenaStore.getState().setInputs({ dominance: 42 });
  const other = useStore.getState().createProfile('other');
  useStore.getState().setActiveProfile(other);
  expect(usePrimeArenaStore.getState().inputs.dominance).toBe(0);
});

test('the plan is not saved', () => {
  usePrimeArenaStore.setState({ plan: null, planTier: 7 });
  const profile = selectActiveProfile(useStore.getState());
  expect(JSON.stringify(profile)).not.toContain('planTier');
});
