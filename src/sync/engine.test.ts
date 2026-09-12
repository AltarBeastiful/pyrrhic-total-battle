/**
 * The whole decision table of `plan()` and every branch of `apply()`, against the in-memory store
 * (`memory.ts`) — which shares its index bookkeeping, conflict rules and encryption with the Gist
 * adapter, so these tests cover the adapter's logic too. Node environment: WebCrypto is `globalThis.crypto`.
 */
import { expect, test } from 'vitest';
import type { StoreApi } from 'zustand';

import { newRoot } from '@/state/defaults';
import type { Profile } from '@/state/schema';
import { createAppStore, type StoreState } from '@/state/store';

import { apply, plan, type ConflictChoice, type SyncPlan, type SyncStateMap } from './engine';
import { createMemoryRemote, type MemoryRemote } from './memory';
import { isSyncError, type SyncStore } from './types';

type Device = StoreApi<StoreState>;

function device(name: string): Device {
  return createAppStore(newRoot(name));
}

const firstProfile = (store: Device): Profile => {
  const profile = store.getState().doc.profiles[0];
  if (profile === undefined) throw new Error('no profile');
  return profile;
};

const profileById = (store: Device, id: string): Profile | undefined =>
  store.getState().doc.profiles.find((profile) => profile.id === id);

async function syncOnce(
  store: Device,
  remote: SyncStore,
  records: SyncStateMap = {},
  choices: Record<string, ConflictChoice> = {},
): Promise<{ plan: SyncPlan; records: SyncStateMap; results: Awaited<ReturnType<typeof apply>> }> {
  const { doc } = store.getState();
  const planned = plan({
    profiles: doc.profiles,
    tombstones: doc.tombstones,
    remote: await remote.index(),
    syncState: records,
  });
  const results = await apply({ plan: planned, choices, syncState: records, store, remote });
  return { plan: planned, records: results.syncState, results };
}

const actionFor = (planned: SyncPlan, id: string): string | undefined =>
  planned.entries.find((entry) => entry.id === id)?.action;

// ---- Push / pull ------------------------------------------------------------------------------------
test('a profile that is not in the gist yet is pushed, and lands in the index', async () => {
  const phone = device('Phone');
  const remote = createMemoryRemote();
  const profile = firstProfile(phone);

  const { plan: planned, records } = await syncOnce(phone, remote);

  expect(actionFor(planned, profile.id)).toBe('push');
  const index = await remote.index();
  expect(index.profiles.map((meta) => meta.name)).toEqual(['My account']);
  expect(index.profiles[0]?.docRev).toBe(profile.rev);
  expect(records[profile.id]).toMatchObject({ rev: profile.rev, remoteRev: 1 });
  expect(Object.keys(remote.files)).toContain(`profile-${profile.id}.json`);
});

test('a profile that only exists in the gist is pulled with its identity intact', async () => {
  const phone = device('Phone');
  const remote = createMemoryRemote();
  const pushed = firstProfile(phone);
  phone.getState().renameProfile(pushed.id, 'Main');
  await syncOnce(phone, remote);

  const desktop = device('Desktop');
  const { plan: planned } = await syncOnce(desktop, remote);

  expect(actionFor(planned, pushed.id)).toBe('pull');
  const pulled = profileById(desktop, pushed.id);
  expect(pulled?.name).toBe('Main');
  expect(pulled?.id).toBe(pushed.id);
});

test('an edit here pushes, an edit there pulls, and an unchanged pair is up to date', async () => {
  const phone = device('Phone');
  const desktop = device('Desktop');
  const remote = createMemoryRemote();
  const id = firstProfile(phone).id;

  let phoneRecords = (await syncOnce(phone, remote)).records;
  let desktopRecords = (await syncOnce(desktop, remote)).records;

  // Nothing changed on either side.
  const quiet = await syncOnce(phone, remote, phoneRecords);
  expect(actionFor(quiet.plan, id)).toBe('in-sync');
  phoneRecords = quiet.records;

  // The phone edits; the desktop must pull.
  phone.getState().renameProfile(id, 'Phone edit');
  const pushed = await syncOnce(phone, remote, phoneRecords);
  expect(actionFor(pushed.plan, id)).toBe('push');

  const pulled = await syncOnce(desktop, remote, desktopRecords);
  expect(actionFor(pulled.plan, id)).toBe('pull');
  desktopRecords = pulled.records;
  expect(profileById(desktop, id)?.name).toBe('Phone edit');

  // And the desktop is quiet on the next round.
  expect(actionFor((await syncOnce(desktop, remote, desktopRecords)).plan, id)).toBe('in-sync');
});

// ---- Conflicts --------------------------------------------------------------------------------------
async function conflictSetup(): Promise<{
  phone: Device;
  desktop: Device;
  remote: MemoryRemote;
  id: string;
  phoneRecords: SyncStateMap;
  desktopRecords: SyncStateMap;
}> {
  const phone = device('Phone');
  const desktop = device('Desktop');
  const remote = createMemoryRemote({ deviceName: 'Phone' });
  const id = firstProfile(phone).id;
  const phoneRecords = (await syncOnce(phone, remote)).records;
  const desktopRecords = (await syncOnce(desktop, remote)).records;
  phone.getState().renameProfile(id, 'Phone name');
  desktop.getState().renameProfile(id, 'Desktop name');
  return { phone, desktop, remote, id, phoneRecords, desktopRecords };
}

test('both sides changed: the plan reports a conflict and nothing is applied without a choice', async () => {
  const { phone, desktop, remote, id, phoneRecords, desktopRecords } = await conflictSetup();
  await syncOnce(phone, remote, phoneRecords); // phone pushes first

  const { plan: planned, results } = await syncOnce(desktop, remote, desktopRecords);
  const entry = planned.entries.find((candidate) => candidate.id === id);
  expect(entry?.action).toBe('conflict');
  expect(entry?.conflict).toBe('both-edited');
  expect(entry?.remote?.name).toBe('Phone name');
  expect(entry?.local?.name).toBe('Desktop name');
  expect(results.results.find((result) => result.id === id)?.status).toBe('skipped');
  expect(profileById(desktop, id)?.name).toBe('Desktop name');
});

test('keep mine overwrites the gist', async () => {
  const { phone, desktop, remote, id, phoneRecords, desktopRecords } = await conflictSetup();
  await syncOnce(phone, remote, phoneRecords);

  await syncOnce(desktop, remote, desktopRecords, { [id]: 'mine' });

  expect(profileById(desktop, id)?.name).toBe('Desktop name');
  expect((await remote.index()).profiles.find((meta) => meta.id === id)?.name).toBe('Desktop name');
});

test('keep theirs replaces the local profile', async () => {
  const { phone, desktop, remote, id, phoneRecords, desktopRecords } = await conflictSetup();
  await syncOnce(phone, remote, phoneRecords);

  const { records } = await syncOnce(desktop, remote, desktopRecords, { [id]: 'theirs' });

  expect(profileById(desktop, id)?.name).toBe('Phone name');
  // The local copy was stamped by the replace, so the recorded rev is the one that is now local.
  expect(records[id]?.rev).toBe(profileById(desktop, id)?.rev);
  expect(actionFor((await syncOnce(desktop, remote, records)).plan, id)).toBe('in-sync');
});

test('keep both keeps a renamed copy here and mine in the gist', async () => {
  const { phone, desktop, remote, id, phoneRecords, desktopRecords } = await conflictSetup();
  await syncOnce(phone, remote, phoneRecords);

  await syncOnce(desktop, remote, desktopRecords, { [id]: 'both' });

  const names = desktop.getState().doc.profiles.map((profile) => profile.name);
  expect(names).toContain('Desktop name');
  expect(names).toContain('Phone name (Phone)');
  // Its own profile, the conflicting one, and the copy of theirs — with a fresh identity.
  expect(desktop.getState().doc.profiles).toHaveLength(3);
  const copy = desktop.getState().doc.profiles.find((profile) => profile.name === 'Phone name (Phone)');
  expect(copy?.id).not.toBe(id);
  expect((await remote.index()).profiles.find((meta) => meta.id === id)?.name).toBe('Desktop name');
});

// ---- Deletions --------------------------------------------------------------------------------------
test('deleting here removes the profile from the gist and leaves a remote tombstone', async () => {
  const phone = device('Phone');
  const remote = createMemoryRemote();
  phone.getState().createProfile('Second');
  const id = firstProfile(phone).id;
  const records = (await syncOnce(phone, remote)).records;

  phone.getState().deleteProfile(id);
  const { plan: planned, records: after } = await syncOnce(phone, remote, records);

  expect(actionFor(planned, id)).toBe('delete-remote');
  const index = await remote.index();
  expect(index.profiles.some((meta) => meta.id === id)).toBe(false);
  expect(index.tombstones.map((stone) => stone.id)).toContain(id);
  expect(Object.keys(remote.files)).not.toContain(`profile-${id}.json`);
  expect(after[id]).toBeUndefined();
});

test('a profile deleted on another device is deleted here too', async () => {
  const phone = device('Phone');
  const desktop = device('Desktop');
  const remote = createMemoryRemote();
  phone.getState().createProfile('Second');
  const id = firstProfile(phone).id;
  const phoneRecords = (await syncOnce(phone, remote)).records;
  const desktopRecords = (await syncOnce(desktop, remote)).records;

  phone.getState().deleteProfile(id);
  await syncOnce(phone, remote, phoneRecords);

  const { plan: planned, records } = await syncOnce(desktop, remote, desktopRecords);
  expect(actionFor(planned, id)).toBe('delete-local');
  expect(profileById(desktop, id)).toBeUndefined();
  expect(records[id]).toBeUndefined();
});

test('deleted here but changed there is a conflict, and keep theirs brings it back', async () => {
  const phone = device('Phone');
  const desktop = device('Desktop');
  const remote = createMemoryRemote();
  phone.getState().createProfile('Second');
  const id = firstProfile(phone).id;
  const phoneRecords = (await syncOnce(phone, remote)).records;
  const desktopRecords = (await syncOnce(desktop, remote)).records;

  desktop.getState().renameProfile(id, 'Still wanted');
  await syncOnce(desktop, remote, desktopRecords);
  phone.getState().deleteProfile(id);

  const conflicted = await syncOnce(phone, remote, phoneRecords);
  expect(conflicted.plan.entries.find((entry) => entry.id === id)?.conflict).toBe('local-deleted');
  expect(profileById(phone, id)).toBeUndefined();

  const resolved = await syncOnce(phone, remote, phoneRecords, { [id]: 'theirs' });
  expect(profileById(phone, id)?.name).toBe('Still wanted');
  expect(phone.getState().doc.tombstones.some((stone) => stone.id === id)).toBe(false);
  expect(actionFor((await syncOnce(phone, remote, resolved.records)).plan, id)).toBe('in-sync');
});

test('changed here but deleted there is a conflict, and keep mine puts it back in the gist', async () => {
  const phone = device('Phone');
  const desktop = device('Desktop');
  const remote = createMemoryRemote();
  phone.getState().createProfile('Second');
  const id = firstProfile(phone).id;
  const phoneRecords = (await syncOnce(phone, remote)).records;
  const desktopRecords = (await syncOnce(desktop, remote)).records;

  phone.getState().deleteProfile(id);
  await syncOnce(phone, remote, phoneRecords);
  desktop.getState().renameProfile(id, 'Keep me');

  const conflicted = await syncOnce(desktop, remote, desktopRecords);
  expect(conflicted.plan.entries.find((entry) => entry.id === id)?.conflict).toBe('remote-deleted');

  await syncOnce(desktop, remote, desktopRecords, { [id]: 'mine' });
  const index = await remote.index();
  expect(index.profiles.find((meta) => meta.id === id)?.name).toBe('Keep me');
  expect(index.tombstones.some((stone) => stone.id === id)).toBe(false);
});

test('keep theirs on a remote deletion deletes the profile here', async () => {
  const phone = device('Phone');
  const desktop = device('Desktop');
  const remote = createMemoryRemote();
  phone.getState().createProfile('Second');
  const id = firstProfile(phone).id;
  const phoneRecords = (await syncOnce(phone, remote)).records;
  const desktopRecords = (await syncOnce(desktop, remote)).records;

  phone.getState().deleteProfile(id);
  await syncOnce(phone, remote, phoneRecords);
  desktop.getState().renameProfile(id, 'Doomed');

  await syncOnce(desktop, remote, desktopRecords, { [id]: 'theirs' });
  expect(profileById(desktop, id)).toBeUndefined();
});

// ---- Optimistic concurrency -------------------------------------------------------------------------
test('a stale expectedRev is refused instead of overwriting', async () => {
  const remote = createMemoryRemote();
  const phone = device('Phone');
  const profile = firstProfile(phone);

  const first = await remote.put(profile.id, profile, null);
  expect(first).toEqual({ ok: true, rev: 1 });
  await remote.put(profile.id, { ...profile, name: 'Newer' }, 1);

  const stale = await remote.put(profile.id, { ...profile, name: 'Stale' }, 1);
  expect(stale.ok).toBe(false);
  if (!stale.ok) expect(stale.conflict.name).toBe('Newer');
  // A brand-new push over an existing document is a conflict too.
  expect((await remote.put(profile.id, profile, null)).ok).toBe(false);
});

// ---- Encryption -------------------------------------------------------------------------------------
test('a full round trip with encryption keeps the gist unreadable without the passphrase', async () => {
  const phone = device('Phone');
  const id = firstProfile(phone).id;
  phone.getState().renameProfile(id, 'Secret account');

  const encrypted = createMemoryRemote({ passphrase: 'correct horse', deviceName: 'Phone' });
  await syncOnce(phone, encrypted);

  const raw = JSON.stringify(encrypted.files);
  expect(raw).not.toContain('Secret account');
  expect(raw).toContain('aes-gcm');

  // Another device with the same passphrase reads it back.
  const desktop = device('Desktop');
  const mirror = createMemoryRemote({ passphrase: 'correct horse', files: encrypted.files });
  await syncOnce(desktop, mirror);
  expect(profileById(desktop, id)?.name).toBe('Secret account');

  // The wrong passphrase and no passphrase both fail with a typed error.
  const wrong = createMemoryRemote({ passphrase: 'battery staple', files: encrypted.files });
  await expect(wrong.index()).rejects.toSatisfy(
    (error: unknown) => isSyncError(error) && error.kind === 'passphrase',
  );
  const none = createMemoryRemote({ files: encrypted.files });
  await expect(none.index()).rejects.toSatisfy(
    (error: unknown) => isSyncError(error) && error.kind === 'encrypted',
  );
});

test('pulling several profiles reads the remote once per file, never in a loop', async () => {
  const phone = device('Phone');
  phone.getState().createProfile('Second');
  phone.getState().createProfile('Third');
  const remote = createMemoryRemote();
  await syncOnce(phone, remote);

  const desktop = device('Desktop');
  const before = remote.reads;
  await syncOnce(desktop, remote);
  // One index read plus one read per pulled profile; no polling.
  expect(remote.reads - before).toBeLessThanOrEqual(3 + 3);
});
