// @vitest-environment jsdom
/**
 * The account as S-49d made it: sign in and forget it. Driven through the real `sync.ts` against a
 * fake server that keeps one blob and applies the hook's version rule (a save must carry exactly one
 * past the server's version, or it is a 409) — so what is tested is the flow, not a mock of it.
 *
 * The rules that matter: an edit saves itself; a 409 is merged, never asked; this browser's own
 * profiles join the account on sign-up only, renamed when the name is taken (a sign-in replaces
 * them); and the account's profiles
 * never stay on screen for somebody who is not signed in.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newProfile, newRoot } from '@/state/defaults';
import type { RootDocument } from '@/state/schema';
import { useStore } from '@/state/store';

import { CACHE_STORAGE_KEY, DEVICE_STORAGE_KEY, resetClient } from './client';
import {
  emitRealtime,
  FakeResponseError,
  onRequest,
  realtimeListeners,
  resetFakePocketBase,
} from './fixtures';
import { AUTOSAVE_MS, resetAccountModule, trackAccountChanges, useAccountStore } from './state';

vi.mock('pocketbase', async () => {
  const { FakePocketBase, FakeAuthStore } = await import('./fixtures');
  return { default: FakePocketBase, LocalAuthStore: FakeAuthStore };
});

const USER = { id: 'u1', email: 'player@example.com', verified: true };

function respond(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** The account's one blob, as the server holds it; `null` until the first save. */
let server: { version: number; data: RootDocument } | null = null;
/** Set to make every save answer with this status instead (401, or 0 for "offline"). */
let refuseWith: number | null = null;

function startServer(): void {
  server = null;
  refuseWith = null;
  onRequest('getFirstListItem', () => {
    if (refuseWith === 0) throw new FakeResponseError(0);
    if (refuseWith !== null) throw new FakeResponseError(refuseWith);
    if (server === null) throw new FakeResponseError(404);
    return { id: 'record', version: server.version, updated: 'now', updatedBy: 'x', data: server.data };
  });
  vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
    if (refuseWith === 0) return Promise.reject(new TypeError('offline'));
    if (refuseWith !== null) return Promise.resolve(respond(refuseWith, { code: refuseWith }));
    const body = JSON.parse(String(init.body)) as { version: number; data: RootDocument };
    const current = server?.version ?? 0;
    if (body.version !== current + 1) {
      return Promise.resolve(
        respond(409, { code: 409, message: 'conflict', data: { serverVersion: current, updated: 'then' } }),
      );
    }
    server = { version: body.version, data: body.data };
    return Promise.resolve(respond(200, { version: body.version, updated: 'now' }));
  });
}

/** What another device saved: the server's copy with one more profile in it. */
function anotherDeviceAdds(name: string): void {
  if (server === null) throw new Error('nothing saved yet');
  const profile = newProfile(name, 'the-other-device');
  server = {
    version: server.version + 1,
    data: { ...server.data, profiles: [...server.data.profiles, profile] },
  };
}

function names(doc: RootDocument = useStore.getState().doc): string[] {
  return doc.profiles.map((profile) => profile.name);
}

function renameActive(name: string): void {
  useStore.getState().renameProfile(useStore.getState().doc.activeProfileId, name);
}

async function signIn({ created = false }: { created?: boolean } = {}): Promise<void> {
  onRequest('authWithPassword', () => ({ token: 'raw-token', record: USER }));
  const { signInWithPassword } = await import('./auth');
  await useAccountStore.getState().adopt(await signInWithPassword(USER.email, 'password123'), { created });
}

/** The account is made by this sign-in (the *Account created* dialog's Continue). */
async function signUp(): Promise<void> {
  await signIn({ created: true });
}

let stopTracking: () => void = () => undefined;

beforeEach(() => {
  localStorage.clear();
  resetClient();
  resetFakePocketBase();
  resetAccountModule();
  vi.stubEnv('VITE_BACKEND_ORIGIN', 'https://backend.test');
  useStore.getState().replaceDocument(newRoot());
  useAccountStore.setState({
    user: null,
    remoteVersion: 0,
    dirty: false,
    syncState: 'saved',
    busy: 'none',
    error: '',
    verificationSent: false,
    dialog: null,
    merged: null,
    leftReason: null,
  });
  stopTracking();
  stopTracking = trackAccountChanges();
  startServer();
});

afterEach(() => {
  vi.useRealTimers();
});

test('the first sign-in makes the account’s first copy out of what this browser has', async () => {
  renameActive('Main');
  await signUp();

  expect(server?.version).toBe(1);
  expect(names(server?.data)).toEqual(['Main']);
  expect(useAccountStore.getState()).toMatchObject({ user: USER, dirty: false, syncState: 'saved' });
  expect(JSON.parse(localStorage.getItem(DEVICE_STORAGE_KEY) ?? '{}')).toMatchObject({
    owner: 'u1',
    remoteVersion: 1,
  });
});

test('signing up adds this browser’s profiles to the new account, renaming a name it already uses', async () => {
  // The account already holds a "Main" (the server's copy, as an OAuth sign-up into it would find).
  server = { version: 1, data: { ...newRoot(), profiles: [newProfile('Main', 'the-other-device')] } };
  renameActive('Main');
  useStore.getState().createProfile('Alt');

  await signUp();

  expect(new Set(names())).toEqual(new Set(['Main', 'Main (local)', 'Alt']));
  expect(new Set(names(server.data))).toEqual(new Set(['Main', 'Main (local)', 'Alt']));
  expect(useAccountStore.getState()).toMatchObject({
    dialog: 'merged',
    merged: { added: ['Main (local)', 'Alt'], renamed: [{ from: 'Main', to: 'Main (local)' }] },
  });
});

test('signing in to an existing account replaces this browser’s profiles, silently', async () => {
  renameActive('Main');
  await signUp();
  // Another browser, signed out, made its own "Main" and an "Alt".
  await useAccountStore.getState().signOut();
  renameActive('Main');
  useStore.getState().createProfile('Alt');

  await signIn();

  expect(names()).toEqual(['Main']);
  expect(names(server?.data)).toEqual(['Main']);
  expect(useAccountStore.getState()).toMatchObject({ dialog: null, merged: null });
});

test('signing in to an account with no profiles still leaves one on screen, not the browser’s own', async () => {
  renameActive('Mine');

  await signIn();

  expect(names()).toEqual(['My account']);
  expect(names(server?.data)).toEqual(['My account']);
  expect(useAccountStore.getState().dialog).toBeNull();
});

test('an untouched default profile is not added to an account that has profiles', async () => {
  renameActive('Main');
  await signUp();
  await useAccountStore.getState().signOut();

  await signIn();
  expect(names()).toEqual(['Main']);
  expect(useAccountStore.getState().dialog).toBeNull();
});

test('an edit saves itself once the player has stopped for a moment', async () => {
  await signUp();
  vi.useFakeTimers();
  renameActive('Edited');
  expect(useAccountStore.getState().syncState).toBe('saving');

  await vi.advanceTimersByTimeAsync(AUTOSAVE_MS - 100);
  expect(names(server?.data)).not.toContain('Edited');
  await vi.advanceTimersByTimeAsync(200);
  expect(names(server?.data)).toEqual(['Edited']);
  expect(useAccountStore.getState()).toMatchObject({ dirty: false, syncState: 'saved' });
});

test('a save that meets another device’s save merges it, and both profiles survive', async () => {
  renameActive('Main');
  await signUp();
  anotherDeviceAdds('From the phone');
  renameActive('Main, edited here');

  await useAccountStore.getState().sync();

  expect(new Set(names(server?.data))).toEqual(new Set(['Main, edited here', 'From the phone']));
  expect(new Set(names())).toEqual(new Set(['Main, edited here', 'From the phone']));
  expect(useAccountStore.getState().syncState).toBe('saved');
});

test('coming back to the app brings in what another device saved, and saves nothing back', async () => {
  renameActive('Main');
  await signUp();
  anotherDeviceAdds('From the phone');
  const before = server?.version;

  await useAccountStore.getState().sync({ pull: true });

  expect(names()).toEqual(['Main', 'From the phone']);
  expect(server?.version).toBe(before);
  expect(useAccountStore.getState().dirty).toBe(false);
});

test('another device’s save, heard over realtime, appears here without a reload', async () => {
  renameActive('Main');
  await signUp();
  await vi.waitFor(() => {
    expect(realtimeListeners()).toBe(1);
  });
  anotherDeviceAdds('From the phone');

  emitRealtime({ version: server?.version });

  await vi.waitFor(() => {
    expect(names()).toEqual(['Main', 'From the phone']);
  });
  // This device's own save echoes back too, at a version it already has: nothing to fetch.
  const calls = useAccountStore.getState().remoteVersion;
  emitRealtime({ version: calls });
  expect(useAccountStore.getState().syncState).toBe('saved');
});

test('signing out stops listening', async () => {
  await signUp();
  await vi.waitFor(() => {
    expect(realtimeListeners()).toBe(1);
  });
  await useAccountStore.getState().signOut();
  await vi.waitFor(() => {
    expect(realtimeListeners()).toBe(0);
  });
});

test('an expired session puts the account away, edits included, and the next sign-in brings it back', async () => {
  renameActive('Main');
  await signUp();
  renameActive('Edited before the session ended');
  refuseWith = 401;

  await useAccountStore.getState().sync();

  expect(useAccountStore.getState()).toMatchObject({ user: null, dialog: 'left', leftReason: 'expired' });
  expect(names()).toEqual(['My account']); // nothing of the account's on screen
  expect(localStorage.getItem(CACHE_STORAGE_KEY)).toContain('Edited before the session ended');

  refuseWith = null;
  await signIn();
  expect(names()).toEqual(['Edited before the session ended']);
  expect(names(server?.data)).toEqual(['Edited before the session ended']);
  expect(localStorage.getItem(CACHE_STORAGE_KEY)).toBeNull();
});

test('a start-up with the account’s profiles on screen but no session puts them away at once', async () => {
  renameActive('Main');
  await signUp();
  localStorage.removeItem('pyrrhic.account.v1'); // the session is gone, offline or not

  await useAccountStore.getState().restore();

  expect(names()).toEqual(['My account']);
  expect(useAccountStore.getState().leftReason).toBe('expired');
});

test('offline, the save waits and says so, and the profiles stay', async () => {
  await signUp();
  refuseWith = 0;
  renameActive('Edited offline');

  await useAccountStore.getState().sync();

  expect(useAccountStore.getState()).toMatchObject({ user: USER, dirty: true, syncState: 'offline' });
  expect(names()).toEqual(['Edited offline']);
});

test('signing out saves first, then takes the account’s profiles off this browser', async () => {
  renameActive('Main');
  await signUp();
  renameActive('Saved on the way out');

  await useAccountStore.getState().signOut();

  expect(names(server?.data)).toEqual(['Saved on the way out']);
  expect(names()).toEqual(['My account']);
  expect(localStorage.getItem(CACHE_STORAGE_KEY)).toBeNull();
  expect(useAccountStore.getState()).toMatchObject({ user: null, dialog: null });
});

test('signing out offline keeps the unsaved work put away, and says so', async () => {
  renameActive('Main');
  await signUp();
  refuseWith = 0;
  renameActive('Not saved yet');

  await useAccountStore.getState().signOut();

  expect(names()).toEqual(['My account']);
  expect(localStorage.getItem(CACHE_STORAGE_KEY)).toContain('Not saved yet');
  expect(useAccountStore.getState()).toMatchObject({ dialog: 'left', leftReason: 'offline' });
});

test('deleting the account keeps the profiles, now as this browser’s own', async () => {
  renameActive('Mine');
  await signUp();
  onRequest('delete', () => true);

  await expect(useAccountStore.getState().deleteAccount()).resolves.toBe(true);

  expect(useAccountStore.getState()).toMatchObject({ user: null, remoteVersion: 0, dirty: false });
  expect(names()).toEqual(['Mine']);
  expect(JSON.parse(localStorage.getItem(DEVICE_STORAGE_KEY) ?? '{}')).toMatchObject({ owner: null });
});

test('an account the server would not delete stays signed in, with a sentence', async () => {
  await signUp();
  onRequest('delete', () => {
    throw new FakeResponseError(403);
  });

  await expect(useAccountStore.getState().deleteAccount()).resolves.toBe(false);
  expect(useAccountStore.getState().user).toEqual(USER);
  expect(useAccountStore.getState().error).not.toBe('');
});

test('asking for another confirmation email says a mail is on its way', async () => {
  await signUp();
  useAccountStore.setState({ user: { ...USER, verified: false } });
  onRequest('requestVerification', () => true);

  await useAccountStore.getState().resendVerification();

  expect(useAccountStore.getState()).toMatchObject({ verificationSent: true, busy: 'none', error: '' });
});

test('changing the password keeps the session and answers true', async () => {
  await signUp();
  onRequest('update', () => ({ ...USER }));
  onRequest('authWithPassword', () => ({ token: 'fresh-token', record: USER }));

  await expect(useAccountStore.getState().changePassword('password123', 'newpassword12')).resolves.toBe(true);
  expect(useAccountStore.getState()).toMatchObject({ user: USER, busy: 'none', error: '' });
});

test('a refused password change answers false and says why', async () => {
  await signUp();
  onRequest('update', () => {
    throw new FakeResponseError(400);
  });

  await expect(useAccountStore.getState().changePassword('wrong', 'newpassword12')).resolves.toBe(false);
  expect(useAccountStore.getState().error).toContain('That current password is not right');
  expect(useAccountStore.getState().user).toEqual(USER);
});
