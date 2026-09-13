// @vitest-environment jsdom
/**
 * The four things a player can do with an account (S-49b), driven through the real `sync.ts` against
 * a fake PocketBase and a fake `fetch` — so what is tested is the flow, not a mock of it.
 *
 * The rules that matter: nothing moves without a press, a 409 asks rather than resolves, and a
 * loaded document keeps *this* browser's identity even though the blob carries the other device's.
 */
import { beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';

import { DEVICE_STORAGE_KEY, resetClient } from './client';
import { FakeResponseError, onRequest, resetFakePocketBase } from './fixtures';
import { trackAccountChanges, useAccountStore } from './state';

vi.mock('pocketbase', async () => {
  const { FakePocketBase, FakeAuthStore } = await import('./fixtures');
  return { default: FakePocketBase, LocalAuthStore: FakeAuthStore };
});

const USER = { id: 'u1', email: 'player@example.com', verified: true };

function respond(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** A root document as another device would have saved it: its own device identity, one profile. */
function remoteDocument(name: string): Record<string, unknown> {
  const doc = newRoot();
  doc.deviceId = 'the-other-device';
  doc.deviceName = 'Rémi’s phone';
  const [profile] = doc.profiles;
  if (profile) profile.name = name;
  return doc as unknown as Record<string, unknown>;
}

async function signIn(): Promise<void> {
  onRequest('authWithPassword', () => ({ token: 'raw-token', record: USER }));
  const { signInWithPassword } = await import('./auth');
  await signInWithPassword('player@example.com', 'password123');
}

let stopTracking: () => void = () => undefined;

beforeEach(async () => {
  localStorage.clear();
  resetClient();
  resetFakePocketBase();
  vi.stubEnv('VITE_BACKEND_ORIGIN', 'https://backend.test');
  useStore.getState().replaceDocument(newRoot());
  useAccountStore.setState({
    user: USER,
    remoteVersion: 0,
    deviceId: 'this-device',
    dirty: false,
    busy: 'none',
    notice: '',
    error: '',
    conflict: null,
    dialog: null,
    pending: null,
  });
  stopTracking();
  stopTracking = trackAccountChanges();
  await signIn();
});

test('any edit marks the account copy stale, and a save clears it', async () => {
  expect(useAccountStore.getState().dirty).toBe(false);
  useStore.getState().renameProfile(useStore.getState().doc.activeProfileId, 'Second account');
  expect(useAccountStore.getState().dirty).toBe(true);

  vi.stubGlobal('fetch', () => Promise.resolve(respond(200, { version: 1, updated: 'now' })));
  await useAccountStore.getState().save();

  expect(useAccountStore.getState()).toMatchObject({ dirty: false, notice: 'Saved', remoteVersion: 1 });
});

test('the version a save reached survives a reload', async () => {
  vi.stubGlobal('fetch', () => Promise.resolve(respond(200, { version: 1, updated: 'now' })));
  await useAccountStore.getState().save();
  expect(JSON.parse(localStorage.getItem(DEVICE_STORAGE_KEY) ?? '{}')).toEqual({
    deviceId: 'this-device',
    remoteVersion: 1,
  });
});

test('a 409 opens the conflict question and changes nothing else', async () => {
  useStore.getState().renameProfile(useStore.getState().doc.activeProfileId, 'Mine');
  vi.stubGlobal('fetch', () =>
    Promise.resolve(
      respond(409, { code: 409, message: 'conflict', data: { serverVersion: 5, updated: 'then' } }),
    ),
  );
  await useAccountStore.getState().save();

  expect(useAccountStore.getState()).toMatchObject({
    dialog: 'conflict',
    conflict: { serverVersion: 5, updated: 'then' },
    dirty: true,
    remoteVersion: 0,
  });
  // The local document is untouched: the player has not answered yet.
  expect(useStore.getState().doc.profiles[0]?.name).toBe('Mine');
});

test('taking the other device’s copy replaces the document but keeps this device’s identity', async () => {
  useStore.getState().renameProfile(useStore.getState().doc.activeProfileId, 'Mine');
  const localDeviceId = useStore.getState().doc.deviceId;

  onRequest('getFirstListItem', () => ({
    id: 'p1',
    version: 5,
    updated: 'then',
    data: remoteDocument('Theirs'),
  }));
  useAccountStore.setState({ conflict: { serverVersion: 5, updated: 'then' }, dialog: 'conflict' });
  await useAccountStore.getState().resolveConflict('server');

  expect(useStore.getState().doc.profiles[0]?.name).toBe('Theirs');
  expect(useStore.getState().doc.deviceId).toBe(localDeviceId);
  expect(useAccountStore.getState()).toMatchObject({
    remoteVersion: 5,
    dirty: false,
    conflict: null,
    dialog: null,
    notice: 'Loaded',
  });
});

test('overwriting with this device re-reads the version first, then saves on top of it', async () => {
  onRequest('getFirstListItem', () => ({
    id: 'p1',
    version: 5,
    updated: 'then',
    data: remoteDocument('Theirs'),
  }));
  const fetchMock = vi.fn(() => Promise.resolve(respond(200, { version: 6, updated: 'now' })));
  vi.stubGlobal('fetch', fetchMock);

  useAccountStore.setState({
    conflict: { serverVersion: 5, updated: 'then' },
    dialog: 'conflict',
    dirty: true,
  });
  await useAccountStore.getState().resolveConflict('device');

  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(JSON.parse(String(init.body)).version).toBe(6);
  expect(useAccountStore.getState()).toMatchObject({ remoteVersion: 6, dirty: false, conflict: null });
  // The local document was never replaced: overwriting is the branch that keeps it.
  expect(useStore.getState().doc.profiles[0]?.name).not.toBe('Theirs');
});

test('signing in asks before applying a copy the account already holds', async () => {
  onRequest('getFirstListItem', () => ({
    id: 'p1',
    version: 2,
    updated: 'then',
    data: remoteDocument('Theirs'),
  }));
  useStore.getState().renameProfile(useStore.getState().doc.activeProfileId, 'Mine');

  await useAccountStore.getState().adopt(USER);

  expect(useAccountStore.getState().dialog).toBe('load');
  expect(useStore.getState().doc.profiles[0]?.name).toBe('Mine');

  await useAccountStore.getState().load();
  expect(useStore.getState().doc.profiles[0]?.name).toBe('Theirs');
  expect(useAccountStore.getState()).toMatchObject({ dialog: null, pending: null, remoteVersion: 2 });
});

test('signing in to an account that has never saved asks nothing', async () => {
  onRequest('getFirstListItem', () => {
    throw new FakeResponseError(404);
  });
  await useAccountStore.getState().adopt(USER);
  expect(useAccountStore.getState()).toMatchObject({ dialog: null, pending: null, remoteVersion: 0 });
});

test('a blob that is not a Pyrrhic document is refused, and the browser keeps what it had', async () => {
  onRequest('getFirstListItem', () => ({ id: 'p1', version: 2, updated: 'then', data: { nonsense: true } }));
  useStore.getState().renameProfile(useStore.getState().doc.activeProfileId, 'Mine');

  await useAccountStore.getState().load();

  expect(useStore.getState().doc.profiles[0]?.name).toBe('Mine');
  expect(useAccountStore.getState().error).not.toBe('');
});

test('signing out forgets the session and the version, and leaves the document alone', async () => {
  useStore.getState().renameProfile(useStore.getState().doc.activeProfileId, 'Mine');
  await useAccountStore.getState().signOut();

  expect(useAccountStore.getState()).toMatchObject({ user: null, remoteVersion: 0, dirty: false });
  expect(useStore.getState().doc.profiles[0]?.name).toBe('Mine');
});
