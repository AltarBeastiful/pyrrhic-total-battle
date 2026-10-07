/**
 * The merge that replaced "load replaces everything" (S-49d). Each test is one thing two devices can
 * do between two syncs, and what both of them must see afterwards.
 */
import { expect, test } from 'vitest';

import { defaultSetup, newProfile, newRoot } from '@/state/defaults';
import type { Profile, RootDocument } from '@/state/schema';

import { mergeDocuments, sameContent } from './merge';

/** One account seen from two browsers: the same profiles, each browser its own identity. */
function twoDevices(): { phone: RootDocument; pc: RootDocument } {
  const phone = newRoot('phone');
  const pc: RootDocument = {
    ...newRoot('pc'),
    profiles: phone.profiles,
    activeProfileId: phone.activeProfileId,
  };
  return { phone, pc };
}

function edit(profile: Profile, patch: Partial<Profile>, at: number): Profile {
  return { ...profile, ...patch, updatedAt: at, rev: profile.rev + 1 };
}

test('a profile edited on one device and another created on the other both survive', () => {
  const { phone, pc } = twoDevices();
  const [shared] = phone.profiles;
  if (!shared) throw new Error('no profile');
  const renamed: RootDocument = {
    ...phone,
    profiles: [edit(shared, { name: 'Main' }, shared.updatedAt + 10)],
  };
  const created = newProfile('Alt', pc.deviceId);
  const grown: RootDocument = { ...pc, profiles: [...pc.profiles, created] };

  const onPhone = mergeDocuments(renamed, grown);
  const onPc = mergeDocuments(grown, renamed);
  expect(onPhone.profiles.map((profile) => profile.name)).toEqual(['Main', 'Alt']);
  // Both devices converge on the same records: nothing left to push from either side.
  expect(sameContent(onPhone, onPc)).toBe(true);
});

test('the later edit of the same profile wins, whichever side it is on', () => {
  const { phone, pc } = twoDevices();
  const [shared] = phone.profiles;
  if (!shared) throw new Error('no profile');
  const early: RootDocument = { ...phone, profiles: [edit(shared, { name: 'Early' }, shared.updatedAt + 1)] };
  const late: RootDocument = { ...pc, profiles: [edit(shared, { name: 'Late' }, shared.updatedAt + 2)] };
  expect(mergeDocuments(early, late).profiles[0]?.name).toBe('Late');
  expect(mergeDocuments(late, early).profiles[0]?.name).toBe('Late');
});

test('two marches of one profile, each changed on a different device, both survive', () => {
  const { phone } = twoDevices();
  const [base] = phone.profiles;
  if (!base) throw new Error('no profile');
  const second = { ...defaultSetup(phone.deviceId, 'Second'), updatedAt: base.updatedAt };
  const both = { ...base, setups: [...base.setups, second] };
  const [first] = both.setups;
  if (!first) throw new Error('no setup');

  const t = base.updatedAt;
  const a = edit(
    both,
    { setups: [{ ...first, name: 'First, from phone', updatedAt: t + 50 }, second] },
    t + 50,
  );
  const b = edit(
    both,
    { setups: [first, { ...second, name: 'Second, from pc', updatedAt: t + 60 }] },
    t + 60,
  );
  const merged = mergeDocuments({ ...phone, profiles: [a] }, { ...phone, profiles: [b] });
  expect(merged.profiles[0]?.setups.map((setup) => setup.name)).toEqual([
    'First, from phone',
    'Second, from pc',
  ]);
});

test('a profile deleted on one device is gone on both, even if the other still had it', () => {
  const { phone, pc } = twoDevices();
  const extra = newProfile('Doomed', phone.deviceId);
  const withExtra: RootDocument = { ...pc, profiles: [...pc.profiles, extra] };
  const deleted: RootDocument = { ...phone, tombstones: [{ id: extra.id, deletedAt: Date.now() }] };
  expect(mergeDocuments(withExtra, deleted).profiles.some((profile) => profile.id === extra.id)).toBe(false);
  expect(mergeDocuments(deleted, withExtra).profiles.some((profile) => profile.id === extra.id)).toBe(false);
});

test('what describes this browser stays this browser’s', () => {
  const { phone, pc } = twoDevices();
  const merged = mergeDocuments({ ...phone, ui: { theme: 'dark' } }, pc);
  expect(merged.deviceId).toBe(phone.deviceId);
  expect(merged.deviceName).toBe('phone');
  expect(merged.ui.theme).toBe('dark');
});

test('an active profile deleted elsewhere falls back to one that is still there', () => {
  const { phone, pc } = twoDevices();
  const alt = newProfile('Alt', pc.deviceId);
  const onPc: RootDocument = { ...pc, profiles: [...pc.profiles, alt] };
  const onPhone: RootDocument = { ...phone, profiles: [...phone.profiles, alt], activeProfileId: alt.id };
  const deleted: RootDocument = {
    ...onPc,
    profiles: pc.profiles,
    tombstones: [{ id: alt.id, deletedAt: Date.now() }],
  };
  expect(mergeDocuments(onPhone, deleted).activeProfileId).toBe(phone.profiles[0]?.id);
});

test('troops changed on one device and bonuses on the other, in the same profile, both survive', () => {
  const { phone, pc } = twoDevices();
  const [base] = phone.profiles;
  if (!base) throw new Error('no profile');
  const t = base.updatedAt;
  const onPhone = edit(
    base,
    { troops: { ...base.troops, guardsmen: null }, sectionUpdatedAt: { troops: t + 10 } },
    t + 10,
  );
  const onPc = edit(
    base,
    {
      sources: { ...base.sources, vipLevel: 7 },
      name: 'Renamed on the PC',
      sectionUpdatedAt: { sources: t + 20, name: t + 20 },
    },
    t + 20,
  );

  for (const merged of [
    mergeDocuments({ ...phone, profiles: [onPhone] }, { ...pc, profiles: [onPc] }),
    mergeDocuments({ ...pc, profiles: [onPc] }, { ...phone, profiles: [onPhone] }),
  ]) {
    const [profile] = merged.profiles;
    expect(profile?.troops.guardsmen).toBeNull(); // the phone's troops
    expect(profile?.name).toBe('Renamed on the PC'); // the PC's name…
    expect(profile?.sources.vipLevel).toBe(7); // …and its bonuses
    expect(profile?.sectionUpdatedAt).toEqual({ troops: t + 10, sources: t + 20, name: t + 20 });
  }
});

test('the same section changed on both devices keeps the later change', () => {
  const { phone, pc } = twoDevices();
  const [base] = phone.profiles;
  if (!base) throw new Error('no profile');
  const t = base.updatedAt;
  const early = edit(base, { name: 'Early', sectionUpdatedAt: { name: t + 10 } }, t + 30);
  const late = edit(base, { name: 'Late', sectionUpdatedAt: { name: t + 20 } }, t + 20);
  // The profile edited last overall is `early`, but its name is the older one.
  expect(mergeDocuments({ ...phone, profiles: [early] }, { ...pc, profiles: [late] }).profiles[0]?.name).toBe(
    'Late',
  );
});

test('profiles no edit has stamped yet merge as before, and stay unstamped', () => {
  const { phone, pc } = twoDevices();
  const merged = mergeDocuments(phone, pc);
  expect(merged.profiles[0]?.sectionUpdatedAt).toBeUndefined();
  expect(sameContent(merged, phone)).toBe(true);
});
