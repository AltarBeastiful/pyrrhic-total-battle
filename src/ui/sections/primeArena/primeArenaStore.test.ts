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
    enemy: [{ unitId: 'rider-4', count: 12 }],
    setup: {
      ...profile.primeArena.setup,
      active: { ...profile.primeArena.setup.active, captains: ['a', 'b'], equipment: ['e'], dragon: false },
      housing: { leadership: 700, authority: 0, dominance: 300 },
    },
    seeded: true,
    role: 'defender',
    otherCapacity: 25,
    capacityBasis: { captains: [], other: 25 },
  };
  root.profiles = [profile];
  root.activeProfileId = profile.id;
  useStore.getState().replaceDocument(root);
  const { setup, toggles, seeded, role } = usePrimeArenaStore.getState();
  expect(role).toBe('defender');
  expect(usePrimeArenaStore.getState().enemy).toEqual([{ unitId: 'rider-4', count: 12 }]);
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

test('the role is saved with the account and defaults to attacker; there is no stack cap to save', () => {
  expect(usePrimeArenaStore.getState().role).toBe('attacker');
  usePrimeArenaStore.getState().setRole('defender');
  const saved = selectActiveProfile(useStore.getState())!.primeArena;
  expect(saved.role).toBe('defender');
  expect('maxStacks' in saved).toBe(false);
  expect('maxStacks' in usePrimeArenaStore.getState()).toBe(false);
});

test('the fingerprint moves with the role, so the bar calls the plan stale', () => {
  const key = () =>
    arenaFingerprint(selectActiveProfile(useStore.getState())!, usePrimeArenaStore.getState());
  const before = key();
  usePrimeArenaStore.getState().setRole('defender');
  expect(key()).not.toBe(before);
});

test('the fingerprint moves with the account’s Guardsmen level, so the plan made at another level is stale', () => {
  const profile = selectActiveProfile(useStore.getState())!;
  const key = () => {
    return arenaFingerprint(selectActiveProfile(useStore.getState())!, usePrimeArenaStore.getState());
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

test('the typed enemy is saved with the account, changed row by row and cleared in one action (B-46)', () => {
  const saved = () => selectActiveProfile(useStore.getState())!.primeArena.enemy;
  const { setEnemyCount, clearEnemy } = usePrimeArenaStore.getState();
  expect(usePrimeArenaStore.getState().enemy).toEqual([]);
  setEnemyCount('rider-4', 7_995);
  setEnemyCount('magic-dragon', 233);
  setEnemyCount('rider-4', 8_000);
  expect(saved()).toEqual([
    { unitId: 'rider-4', count: 8_000 },
    { unitId: 'magic-dragon', count: 233 },
  ]);
  expect(selectActiveProfile(useStore.getState())?.sectionUpdatedAt?.primeArena).toBeGreaterThan(0);
  // An emptied or zeroed field takes the row away.
  setEnemyCount('magic-dragon', null);
  setEnemyCount('archer-4', 0);
  expect(saved()).toEqual([{ unitId: 'rider-4', count: 8_000 }]);
  // Kept after a reload.
  useStore
    .getState()
    .replaceDocument(JSON.parse(JSON.stringify(useStore.getState().doc)) as ReturnType<typeof newRoot>);
  expect(usePrimeArenaStore.getState().enemy).toEqual([{ unitId: 'rider-4', count: 8_000 }]);
  clearEnemy();
  expect(saved()).toEqual([]);
  expect(usePrimeArenaStore.getState().enemy).toEqual([]);
});

test('the fingerprint moves with the typed enemy, so the plan made without it is stale (B-46)', () => {
  const key = () =>
    arenaFingerprint(selectActiveProfile(useStore.getState())!, usePrimeArenaStore.getState());
  const before = key();
  usePrimeArenaStore.getState().setEnemyCount('rider-4', 10);
  expect(key()).not.toBe(before);
  usePrimeArenaStore.getState().clearEnemy();
  expect(key()).toBe(before);
});

test('Generate counter-picks the typed enemy, and plans all-round without one (B-46)', async () => {
  usePrimeArenaStore
    .getState()
    .updateSetup((s) => ({ housing: { ...s.housing, leadership: 5000, dominance: 500 } }));
  const plan = async () => {
    usePrimeArenaStore.setState({ plan: null });
    usePrimeArenaStore
      .getState()
      .generate(selectActiveProfile(useStore.getState())!, { maxEvaluations: 20, maxMillis: 500 });
    await vi.waitFor(
      () => {
        expect(usePrimeArenaStore.getState().plan).not.toBeNull();
      },
      { timeout: 10_000 },
    );
    return usePrimeArenaStore.getState().plan!;
  };
  expect((await plan()).mode).toBe('allRound');
  usePrimeArenaStore.getState().setEnemyCount('rider-2', 100);
  const counter = await plan();
  expect(counter.mode).toBe('counter');
  expect(counter.opponent.map((s) => [s.unit.id, s.count])).toEqual([['rider-2', 100]]);
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
