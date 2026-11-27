/**
 * B-36: the Prime Arena inputs live in the account's profile. The store mirrors them in both directions: an edit is
 * written to the active profile (stamped as its own section), and a new document or a switch of profile hydrates the
 * inputs from it. The plan stays in the view store. The squad is a `BattleSetup` (schema v19).
 */
import { beforeEach, expect, test, vi } from 'vitest';

import { primeArenaInputs } from '@/engine/primeArenaInputs';
import { newProfile, newRoot } from '@/state/defaults';
import { primeArenaSchema } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';

import { arenaFingerprint, pickInputs, usePrimeArenaStore } from './primeArenaStore';

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
    toggles: { clanTechnologies: true, talents: false, hallOfFame: false },
    setup: {
      ...profile.primeArena.setup,
      active: { ...profile.primeArena.setup.active, captains: ['a', 'b'], equipment: ['e'], dragon: false },
      housing: { leadership: 700, authority: 0, dominance: 300 },
    },
    seeded: true,
    role: 'defender',
    maxStacks: 5,
    otherCapacity: 25,
    capacityBasis: { captains: [], other: 25 },
  };
  root.profiles = [profile];
  root.activeProfileId = profile.id;
  useStore.getState().replaceDocument(root);
  const { setup, toggles, seeded, role, maxStacks } = usePrimeArenaStore.getState();
  expect(role).toBe('defender');
  expect(maxStacks).toBe(5);
  expect(usePrimeArenaStore.getState().otherCapacity).toBe(25);
  expect(usePrimeArenaStore.getState().capacityBasis).toEqual({ captains: [], other: 25 });
  expect(setup.active).toMatchObject({ captains: ['a', 'b'], equipment: ['e'], dragon: false });
  expect(setup.housing).toMatchObject({ leadership: 700, dominance: 300 });
  // a switch an older build saved for a source that no longer exists is dropped
  expect(Object.keys(toggles)).not.toContain('clanTechnologies');
  expect(toggles.talents).toBe(false);
  expect(toggles.hallOfFame).toBe(false);
  expect(toggles.monuments).toBe(true);
  expect(seeded).toBe(true);
});

test('switching profile swaps the inputs', () => {
  usePrimeArenaStore.getState().updateSetup((s) => ({ housing: { ...s.housing, dominance: 42 } }));
  const other = useStore.getState().createProfile('other');
  useStore.getState().setActiveProfile(other);
  expect(usePrimeArenaStore.getState().setup.housing.dominance).toBe(0);
});

test('the arena keeps no troops of its own: the Guardsmen level is the account’s, and a plan is made from it', () => {
  expect('troops' in usePrimeArenaStore.getState()).toBe(false);
  expect('troops' in selectActiveProfile(useStore.getState())!.primeArena).toBe(false);
  const profile = selectActiveProfile(useStore.getState())!;
  useStore
    .getState()
    .updateProfile(profile.id, (p) => ({ troops: { ...p.troops, guardsmen: { min: 1, max: 5 } } }));
  const now = selectActiveProfile(useStore.getState())!;
  expect(
    primeArenaInputs({ ...pickInputs(usePrimeArenaStore.getState()), profile: now, troops: now.troops })
      .level,
  ).toBe(5);
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
  usePrimeArenaStore.setState({ plan: null, planLevel: 7 });
  const profile = selectActiveProfile(useStore.getState());
  expect(JSON.stringify(profile)).not.toContain('planLevel');
});

test('the role and the stack cap are saved with the account and default to attacker and eight', () => {
  expect(usePrimeArenaStore.getState()).toMatchObject({ role: 'attacker', maxStacks: 8 });
  usePrimeArenaStore.getState().setRole('defender');
  usePrimeArenaStore.getState().setMaxStacks(6);
  expect(selectActiveProfile(useStore.getState())?.primeArena).toMatchObject({
    role: 'defender',
    maxStacks: 6,
  });
  usePrimeArenaStore.getState().setMaxStacks(0);
  expect(usePrimeArenaStore.getState().maxStacks).toBe(1);
  usePrimeArenaStore.getState().setMaxStacks(99);
  expect(usePrimeArenaStore.getState().maxStacks).toBe(16);
});

test('the fingerprint moves with the role and the cap, so the bar calls the plan stale', () => {
  const key = () => {
    const { toggles, setup, role, maxStacks } = usePrimeArenaStore.getState();
    return arenaFingerprint(selectActiveProfile(useStore.getState())!, { toggles, setup, role, maxStacks });
  };
  const before = key();
  usePrimeArenaStore.getState().setRole('defender');
  const asDefender = key();
  expect(asDefender).not.toBe(before);
  usePrimeArenaStore.getState().setMaxStacks(5);
  expect(key()).not.toBe(asDefender);
});

test('the fingerprint moves with the account’s Guardsmen level, so the plan made at another level is stale', () => {
  const profile = selectActiveProfile(useStore.getState())!;
  const key = () => {
    const { toggles, setup, role, maxStacks } = usePrimeArenaStore.getState();
    return arenaFingerprint(selectActiveProfile(useStore.getState())!, { toggles, setup, role, maxStacks });
  };
  const before = key();
  useStore
    .getState()
    .updateProfile(profile.id, (p) => ({ troops: { ...p.troops, guardsmen: { min: 1, max: 4 } } }));
  expect(key()).not.toBe(before);
});

test('Generate plans at the account’s Guardsmen level, and the plan names it', async () => {
  const profile = selectActiveProfile(useStore.getState())!;
  useStore
    .getState()
    .updateProfile(profile.id, (p) => ({ troops: { ...p.troops, guardsmen: { min: 1, max: 5 } } }));
  usePrimeArenaStore
    .getState()
    .updateSetup((s) => ({ housing: { ...s.housing, leadership: 5000, dominance: 500 } }));
  usePrimeArenaStore
    .getState()
    .generate(selectActiveProfile(useStore.getState())!, { maxEvaluations: 20, maxMillis: 500 });
  await vi.waitFor(
    () => {
      expect(usePrimeArenaStore.getState().plan).not.toBeNull();
    },
    { timeout: 10_000 },
  );
  expect(usePrimeArenaStore.getState().planLevel).toBe(5);
  expect(Math.max(...usePrimeArenaStore.getState().plan!.stacks.map((s) => s.unit.tier))).toBeLessThanOrEqual(
    5,
  );
});

test('the squad keeps five captains and five artifacts through a save and a reload', () => {
  const ids = ['1', '2', '3', '4', '5'];
  usePrimeArenaStore.getState().updateSetup((s) => ({
    active: { ...s.active, captains: ids, artifacts: ids },
  }));
  const saved = selectActiveProfile(useStore.getState())?.primeArena;
  expect(saved?.setup.active.artifacts).toEqual(ids);
  // A reload goes through the schema: it used to cap both lists at three and would reject a fuller squad.
  const root = JSON.parse(JSON.stringify(useStore.getState().doc)) as ReturnType<typeof newRoot>;
  useStore.getState().replaceDocument(root);
  const { setup } = usePrimeArenaStore.getState();
  expect(setup.active.captains).toEqual(ids);
  expect(setup.active.artifacts).toEqual(ids);
  expect(primeArenaSchema.safeParse(saved).success).toBe(true);
});
