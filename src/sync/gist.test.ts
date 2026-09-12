/**
 * The Gist adapter against a fake GitHub (S-45): what it creates, what it sends, and how every documented
 * status code turns into a typed error. The conflict rules themselves are tested in `engine.test.ts`,
 * which drives the same shared implementation.
 */
import { expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import type { Profile } from '@/state/schema';

import { createGistStore, GIST_DESCRIPTION, GITHUB_API } from './gist';
import { isSyncError } from './types';

interface FakeGist {
  id: string;
  description: string;
  public: boolean;
  files: Record<string, { content: string }>;
}

interface Call {
  url: string;
  method: string;
  authorization: string | null;
  body: unknown;
}

function fakeGitHub(initial: FakeGist[] = []) {
  const gists = new Map(initial.map((gist) => [gist.id, structuredClone(gist)]));
  const calls: Call[] = [];
  let nextId = gists.size + 1;

  const json = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  const fetchImpl: typeof fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method ?? 'GET';
    const headers = new Headers(init?.headers);
    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
    calls.push({ url, method, authorization: headers.get('Authorization'), body });

    const path = url.startsWith(GITHUB_API) ? url.slice(GITHUB_API.length) : url;
    if (path.startsWith('/user')) return Promise.resolve(json({ login: 'remi' }));
    if (path.startsWith('/gists?')) return Promise.resolve(json([...gists.values()]));
    if (path === '/gists' && method === 'POST') {
      const payload = body as {
        description: string;
        public: boolean;
        files: Record<string, { content: string }>;
      };
      const gist: FakeGist = {
        id: `gist${String(nextId++)}`,
        description: payload.description,
        public: payload.public,
        files: payload.files,
      };
      gists.set(gist.id, gist);
      return Promise.resolve(json(gist, 201));
    }
    const id = path.replace('/gists/', '');
    const gist = gists.get(id);
    if (gist === undefined) return Promise.resolve(json({ message: 'Not Found' }, 404));
    if (method === 'PATCH') {
      const payload = body as { files: Record<string, { content: string } | null> };
      for (const [name, file] of Object.entries(payload.files)) {
        if (file === null) delete gist.files[name];
        else gist.files[name] = file;
      }
    }
    return Promise.resolve(json(gist));
  };

  return { fetchImpl, gists, calls };
}

function someProfile(): Profile {
  const profile = newRoot('Phone').profiles[0];
  if (profile === undefined) throw new Error('no profile');
  return profile;
}

test('the first push creates one secret gist named pyrrhic-sync and an index', async () => {
  const github = fakeGitHub();
  const store = createGistStore({ token: 'ghp_test', fetchImpl: github.fetchImpl, deviceName: 'Phone' });
  const profile = someProfile();

  const result = await store.put(profile.id, profile, null);

  expect(result).toEqual({ ok: true, rev: 1 });
  const gist = [...github.gists.values()][0];
  expect(gist?.description).toBe(GIST_DESCRIPTION);
  expect(gist?.public).toBe(false);
  expect(Object.keys(gist?.files ?? {}).sort()).toEqual(['index.json', `profile-${profile.id}.json`]);
  expect(store.gistId()).toBe(gist?.id);

  // The stored profile file is the export document, unchanged.
  const file = JSON.parse(gist?.files[`profile-${profile.id}.json`]?.content ?? '{}') as {
    kind: string;
    payload: Profile;
  };
  expect(file.kind).toBe('profile');
  expect(file.payload.name).toBe('My account');

  const index = await store.index();
  expect(index.profiles).toEqual([
    expect.objectContaining({ id: profile.id, rev: 1, name: 'My account', deviceName: 'Phone' }),
  ]);
});

test('an existing pyrrhic-sync gist is reused instead of creating a second one', async () => {
  const github = fakeGitHub([
    {
      id: 'gist-existing',
      description: GIST_DESCRIPTION,
      public: false,
      files: {
        'index.json': {
          content: JSON.stringify({ pyrrhic: 'sync', version: 1, body: { profiles: [], tombstones: [] } }),
        },
      },
    },
  ]);
  const store = createGistStore({ token: 'ghp_test', fetchImpl: github.fetchImpl });

  expect(await store.ensureGist()).toBe('gist-existing');
  expect(github.gists.size).toBe(1);
  expect(github.calls.some((call) => call.method === 'POST')).toBe(false);
});

test('the token is sent to api.github.com only, in the Authorization header', async () => {
  const github = fakeGitHub();
  const store = createGistStore({ token: 'ghp_secret', fetchImpl: github.fetchImpl });
  const profile = someProfile();
  await store.put(profile.id, profile, null);
  await store.get(profile.id);

  expect(github.calls.length).toBeGreaterThan(0);
  for (const call of github.calls) {
    expect(call.url.startsWith(GITHUB_API)).toBe(true);
    expect(call.authorization).toBe('Bearer ghp_secret');
    expect(JSON.stringify(call.body ?? '')).not.toContain('ghp_secret');
  }
});

test('deleting removes the file (content null) and records a tombstone', async () => {
  const github = fakeGitHub();
  const store = createGistStore({ token: 'ghp_test', fetchImpl: github.fetchImpl });
  const profile = someProfile();
  await store.put(profile.id, profile, null);

  const result = await store.delete(profile.id, 1);

  expect(result.ok).toBe(true);
  const patch = github.calls.filter((call) => call.method === 'PATCH').at(-1);
  expect((patch?.body as { files: Record<string, unknown> }).files[`profile-${profile.id}.json`]).toBeNull();
  const index = await store.index();
  expect(index.profiles).toEqual([]);
  expect(index.tombstones.map((stone) => stone.id)).toEqual([profile.id]);
  expect(await store.get(profile.id)).toBeNull();
});

test('an encrypted gist keeps the profile names out of the index', async () => {
  const github = fakeGitHub();
  const store = createGistStore({
    token: 'ghp_test',
    fetchImpl: github.fetchImpl,
    passphrase: 'correct horse',
  });
  const profile = { ...someProfile(), name: 'Secret account' };
  await store.put(profile.id, profile, null);

  const gist = [...github.gists.values()][0];
  const raw = JSON.stringify(gist?.files);
  expect(raw).not.toContain('Secret account');
  expect(JSON.parse(gist?.files['index.json']?.content ?? '{}')).toMatchObject({
    pyrrhic: 'sync',
    kdf: { kdf: 'pbkdf2-sha256' },
  });
  expect((await store.index()).profiles[0]?.name).toBe('Secret account');
});

test('test connection reports the account and the gist without creating anything', async () => {
  const github = fakeGitHub();
  const store = createGistStore({ token: 'ghp_test', fetchImpl: github.fetchImpl });

  expect(await store.testConnection()).toEqual({
    login: 'remi',
    gistId: null,
    encrypted: false,
    profiles: 0,
  });
  expect(github.gists.size).toBe(0);
});

// ---- Error mapping ----------------------------------------------------------------------------------
function failing(status: number, headers: Record<string, string> = {}) {
  const fetchImpl: typeof fetch = () =>
    Promise.resolve(
      new Response(JSON.stringify({ message: 'nope' }), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
      }),
    );
  return createGistStore({ token: 'ghp_test', gistId: 'gist1', fetchImpl });
}

test.each([
  [401, 'auth'],
  [403, 'forbidden'],
  [404, 'not-found'],
  [422, 'invalid'],
  [500, 'http'],
])('HTTP %i becomes a typed %s error', async (status, kind) => {
  await expect(failing(status).index()).rejects.toSatisfy(
    (error: unknown) => isSyncError(error) && error.kind === kind,
  );
});

test('a 403 with no remaining rate-limit budget is reported as a rate limit', async () => {
  await expect(failing(403, { 'x-ratelimit-remaining': '0' }).index()).rejects.toSatisfy(
    (error: unknown) => isSyncError(error) && error.kind === 'rate-limit',
  );
});

test('a network failure is reported as one, without leaking the token', async () => {
  const store = createGistStore({
    token: 'ghp_secret',
    gistId: 'gist1',
    fetchImpl: () => Promise.reject(new TypeError('Failed to fetch')),
  });
  await expect(store.index()).rejects.toSatisfy(
    (error: unknown) =>
      isSyncError(error) && error.kind === 'network' && !error.message.includes('ghp_secret'),
  );
});

test('a gist that is not a Pyrrhic sync gist is refused clearly', async () => {
  const github = fakeGitHub([
    {
      id: 'gist1',
      description: 'holiday notes',
      public: false,
      files: { 'index.json': { content: '{"something":"else"}' } },
    },
  ]);
  const store = createGistStore({ token: 'ghp_test', gistId: 'gist1', fetchImpl: github.fetchImpl });
  await expect(store.index()).rejects.toSatisfy(
    (error: unknown) => isSyncError(error) && error.kind === 'format',
  );
});
