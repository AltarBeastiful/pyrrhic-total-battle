import { expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import type { BattleSetup, Profile } from '@/state/schema';

import { setupFingerprint } from '../sections/results/runStore';
import { blockedReason, fabState, saveStatus } from './state';

function fixture(): { profile: Profile; setup: BattleSetup } {
  const doc = newRoot();
  const profile = doc.profiles[0];
  if (!profile) throw new Error('the default document has no profile');
  const setup = profile.setups[0];
  if (!setup) throw new Error('the default profile has no march');
  return { profile, setup };
}

test('the save state is one word, and a conflict outranks a pending write', () => {
  expect(saveStatus({ dirty: false, conflict: false })).toBe('Saved');
  expect(saveStatus({ dirty: true, conflict: false })).toBe('Saving…');
  expect(saveStatus({ dirty: true, conflict: true })).toBe('Sync conflict');
});

test('a march is blocked by whatever the player has not filled in yet', () => {
  const { profile, setup } = fixture();
  expect(blockedReason(undefined, undefined)).toBe('No march is selected');
  expect(blockedReason(profile, setup)).toBe('Add housing first');

  const housed = { ...setup, housing: { leadership: 4100, authority: 0, dominance: 0 } };
  expect(blockedReason(profile, housed)).toBeNull();

  const empty: Profile = {
    ...profile,
    troops: { ...profile.troops, guardsmen: null, specialists: null, engineers: null, monsters: null },
    mercenaries: { selected: [], custom: [] },
  };
  expect(blockedReason(empty, housed)).toBe('Add troops first');
});

test('the fingerprint moves with everything a march is computed from, and nothing else', () => {
  const { profile, setup } = fixture();
  const before = setupFingerprint(profile, setup);

  expect(setupFingerprint(profile, setup)).toBe(before);
  expect(setupFingerprint({ ...profile, name: 'Renamed' }, setup)).toBe(before);
  expect(setupFingerprint(profile, { ...setup, housing: { ...setup.housing, leadership: 10 } })).not.toBe(
    before,
  );
  expect(
    setupFingerprint({ ...profile, mercenaries: { selected: [{ id: 'x', cap: 1 }], custom: [] } }, setup),
  ).not.toBe(before);
  expect(setupFingerprint(undefined, setup)).toBe('');
});

test('the button is running, then blocked, then stale, then ready', () => {
  const base = { running: false, blocked: null, hasResult: true, fingerprint: 'a', lastRunFingerprint: 'a' };

  expect(fabState({ ...base, running: true, blocked: 'Add troops first' })).toBe('running');
  expect(fabState({ ...base, blocked: 'Add troops first' })).toBe('blocked');
  expect(fabState({ ...base, fingerprint: 'b' })).toBe('stale');
  expect(fabState(base)).toBe('ready');
  // Nothing to be stale against before the first run, or without a result on screen.
  expect(fabState({ ...base, fingerprint: 'b', lastRunFingerprint: null })).toBe('ready');
  expect(fabState({ ...base, fingerprint: 'b', hasResult: false })).toBe('ready');
});
