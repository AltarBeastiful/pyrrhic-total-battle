// @vitest-environment jsdom
/**
 * The two requests (S-49b, spec §5.3). What is asserted is the wire contract the backend hook
 * actually implements (investigation 0012): the raw token in `Authorization`, `version` one past
 * what this device last saw, and a 409 that is a *result*, not an exception — the conflict dialog
 * keys on the status alone.
 */
import { beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';

import { resetClient } from './client';
import { FakeResponseError, onRequest, resetFakePocketBase } from './fixtures';
import { pull, push } from './sync';

vi.mock('pocketbase', async () => {
  const { FakePocketBase, FakeAuthStore } = await import('./fixtures');
  return { default: FakePocketBase, LocalAuthStore: FakeAuthStore };
});

const RECORD = {
  id: 'p1',
  version: 3,
  updated: '2026-09-13 04:26:09.794Z',
  updatedBy: 'other-device',
  data: { schemaVersion: 1, profiles: [] },
};

/** Sign in the fake client, so `push` has a token to send. */
async function signIn(): Promise<void> {
  onRequest('authWithPassword', () => ({ token: 'raw-token', record: { id: 'u1', email: 'a@b.c' } }));
  const { signInWithPassword } = await import('./auth');
  await signInWithPassword('a@b.c', 'password123');
}

function respond(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  localStorage.clear();
  resetClient();
  resetFakePocketBase();
  vi.stubEnv('VITE_BACKEND_ORIGIN', 'https://backend.test');
});

test('pull reads the one record the view rule scopes to the caller', async () => {
  onRequest('getFirstListItem', () => RECORD);
  await expect(pull()).resolves.toEqual({
    version: 3,
    updated: '2026-09-13 04:26:09.794Z',
    data: RECORD.data,
  });
});

test('an account that has never saved is null, not an error', async () => {
  onRequest('getFirstListItem', () => {
    throw new FakeResponseError(404);
  });
  await expect(pull()).resolves.toBeNull();
});

test('an expired session says to sign in again', async () => {
  onRequest('getFirstListItem', () => {
    throw new FakeResponseError(401);
  });
  await expect(pull()).rejects.toMatchObject({ kind: 'auth' });
});

test('a record we cannot read is a server error, never a half-applied profile', async () => {
  onRequest('getFirstListItem', () => ({ id: 'p1', version: 0 }));
  await expect(pull()).rejects.toMatchObject({ kind: 'server' });
});

test('push sends the raw token, the whole document and the next version', async () => {
  await signIn();
  const fetchMock = vi.fn(() => Promise.resolve(respond(200, { version: 4, updated: 'then' })));
  vi.stubGlobal('fetch', fetchMock);

  const document = newRoot();
  await expect(push(document, 3, 'device-1')).resolves.toEqual({ ok: true, version: 4, updated: 'then' });

  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe('https://backend.test/api/app/profile');
  expect((init.headers as Record<string, string>).Authorization).toBe('raw-token');
  expect(JSON.parse(String(init.body))).toEqual({ data: document, version: 4, deviceId: 'device-1' });
});

test('the first save of an account sends version 1', async () => {
  await signIn();
  const fetchMock = vi.fn(() => Promise.resolve(respond(200, { version: 1, updated: 'now' })));
  vi.stubGlobal('fetch', fetchMock);

  await push(newRoot(), 0, 'device-1');
  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(JSON.parse(String(init.body)).version).toBe(1);
});

test('a 409 comes back as a result with the version the account actually holds', async () => {
  await signIn();
  vi.stubGlobal('fetch', () =>
    Promise.resolve(
      respond(409, { code: 409, message: 'conflict', data: { serverVersion: 7, updated: 'then' } }),
    ),
  );
  await expect(push(newRoot(), 3, 'device-1')).resolves.toEqual({
    ok: false,
    serverVersion: 7,
    updated: 'then',
  });
});

test('an unreachable backend is a network error, not a silent failure', async () => {
  await signIn();
  vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
  await expect(push(newRoot(), 0, 'device-1')).rejects.toMatchObject({ kind: 'network' });
});

test('saving without a session is refused before anything is sent', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  await expect(push(newRoot(), 0, 'device-1')).rejects.toMatchObject({ kind: 'auth' });
  expect(fetchMock).not.toHaveBeenCalled();
});
