/**
 * GitHub Gist sync adapter (S-45, investigation 0001 option B1). One **secret** gist per user, described
 * as `pyrrhic-sync`, holding `index.json` plus one `profile-<id>.json` per profile. No OAuth app, no
 * domain, no server of ours: the user pastes a fine-grained personal access token with the single
 * permission *Gists: Read and write*.
 *
 * ADR-0002: the only host this file ever contacts is `api.github.com` (plus `gist.githubusercontent.com`
 * for the rare oversized file, **without** the token). The token travels in the `Authorization` header of
 * those requests and nowhere else — never in an export, a share link, the synced document or a log line.
 *
 * Rate limits: nothing polls. A pull of N profiles is one `GET /gists/{id}` (the whole gist arrives at
 * once and is cached); a push is one fresh `GET` for the concurrency check and one `PATCH`.
 */
import { CURRENT_DATA_VERSION } from '../state/defaults';
import { createCodec, INDEX_FILE, readIndexFile } from './codec';
import { createFileSyncStore } from './fileStore';
import type { FileBackend } from './fileStore';
import { SyncError } from './types';
import type { SyncStore } from './types';

export const GITHUB_API = 'https://api.github.com';
/** How the gist is recognised when a device only has the token. */
export const GIST_DESCRIPTION = 'pyrrhic-sync';
/** Where the user creates the token; the dialog links to it. */
export const TOKEN_PAGE = 'https://github.com/settings/personal-access-tokens/new';

export interface GistStoreOptions {
  token: string;
  /** Known gist id; when absent the store finds the `pyrrhic-sync` gist or creates it. */
  gistId?: string;
  /** Non-empty turns on client-side encryption (see `crypto.ts`). */
  passphrase?: string;
  dataVersion?: number;
  deviceName?: string;
  /** Injected by tests. Read at call time so a test can stub `globalThis.fetch` afterwards. */
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export interface GistConnection {
  login: string | null;
  gistId: string | null;
  /** True when the remote index carries a key-derivation header. */
  encrypted: boolean;
  profiles: number;
}

export interface GistStore extends SyncStore {
  /** The gist id, creating the gist on first use. Persist it so later runs skip the lookup. */
  ensureGist(): Promise<string>;
  /** The id already known, without any request. */
  gistId(): string | null;
  /** "Test connection": who the token belongs to and which gist it would use. Creates nothing. */
  testConnection(): Promise<GistConnection>;
}

interface GistFile {
  filename?: string;
  content?: string;
  truncated?: boolean;
  raw_url?: string;
}

interface GistResponse {
  id: string;
  description?: string | null;
  files?: Record<string, GistFile | null>;
}

function messageOf(body: unknown): string | null {
  if (typeof body === 'object' && body !== null) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return null;
}

/** Map an HTTP answer to a typed error the dialog can phrase without parsing strings. */
export function gistError(status: number, body: unknown, headers?: Headers): SyncError {
  const detail = messageOf(body);
  const rateLimited = headers?.get('x-ratelimit-remaining') === '0';
  if (status === 401) {
    return new SyncError(
      'auth',
      'GitHub rejected the token (401). Check that it was copied whole and has not expired.',
      { status },
    );
  }
  if (status === 403 || status === 429) {
    if (rateLimited || status === 429) {
      return new SyncError(
        'rate-limit',
        'GitHub is rate-limiting this token. Wait a few minutes and sync again.',
        { status },
      );
    }
    return new SyncError(
      'forbidden',
      'GitHub refused the request (403). The token needs the "Gists: Read and write" permission, ' +
        'and the gist must belong to the same account.',
      { status },
    );
  }
  if (status === 404) {
    return new SyncError(
      'not-found',
      'That gist does not exist for this token (404). Clear the gist id to create a new one.',
      { status },
    );
  }
  if (status === 422) {
    return new SyncError(
      'invalid',
      `GitHub refused the change (422)${detail === null ? '' : `: ${detail}`}.`,
      {
        status,
      },
    );
  }
  return new SyncError('http', `GitHub answered ${String(status)}${detail === null ? '' : `: ${detail}`}.`, {
    status,
  });
}

export function createGistStore(options: GistStoreOptions): GistStore {
  const token = options.token.trim();
  let id: string | null = options.gistId?.trim() ?? null;
  if (id === '') id = null;
  let snapshot: Record<string, string> | null = null;

  const call: typeof fetch = (input, init) => (options.fetchImpl ?? globalThis.fetch)(input, init);

  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    if (token === '') {
      throw new SyncError('auth', 'Paste a GitHub token in the sync settings first.');
    }
    let response: Response;
    try {
      response = await call(`${GITHUB_API}${path}`, {
        ...init,
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          Authorization: `Bearer ${token}`,
          ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...init.headers,
        },
      });
    } catch (cause) {
      throw new SyncError('network', 'Could not reach api.github.com. Check the connection and try again.', {
        cause,
      });
    }
    const text = await response.text();
    let body: unknown = null;
    try {
      if (text !== '') body = JSON.parse(text);
    } catch (cause) {
      if (response.ok)
        throw new SyncError('format', 'GitHub answered with something that is not JSON.', { cause });
    }
    if (!response.ok) throw gistError(response.status, body, response.headers);
    return body as T;
  };

  /** Files larger than 1 MB come back truncated; the raw URL is fetched **without** the token. */
  const readTruncated = async (file: GistFile): Promise<string> => {
    if (file.raw_url === undefined) {
      throw new SyncError('format', 'A synced file is too large for the Gist API and has no raw URL.');
    }
    let response: Response;
    try {
      response = await call(file.raw_url, { headers: { Accept: 'text/plain' } });
    } catch (cause) {
      throw new SyncError('network', 'Could not download an oversized synced file.', { cause });
    }
    if (!response.ok) throw gistError(response.status, null, response.headers);
    return response.text();
  };

  const collect = async (gist: GistResponse): Promise<Record<string, string>> => {
    const files: Record<string, string> = {};
    for (const [name, file] of Object.entries(gist.files ?? {})) {
      if (file === null || file === undefined) continue;
      files[name] = file.truncated === true ? await readTruncated(file) : (file.content ?? '');
    }
    return files;
  };

  /** The user's `pyrrhic-sync` gist, if they already have one. Read-only: creates nothing. */
  const findGist = async (): Promise<string | null> => {
    if (id !== null) return id;
    const gists = await request<GistResponse[]>('/gists?per_page=100');
    const found = gists.find(
      (gist) => gist.description === GIST_DESCRIPTION && Object.hasOwn(gist.files ?? {}, INDEX_FILE),
    );
    return found?.id ?? null;
  };

  const createGist = async (): Promise<string> => {
    // The bootstrap index holds no user data, so it is written in clear; the first push rewrites it
    // (encrypted, with the key-derivation header) through the normal code path.
    const content = `${JSON.stringify(
      { pyrrhic: 'sync', version: 1, body: { profiles: [], tombstones: [] } },
      null,
      2,
    )}\n`;
    const gist = await request<GistResponse>('/gists', {
      method: 'POST',
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false,
        files: { [INDEX_FILE]: { content } },
      }),
    });
    snapshot = await collect(gist);
    return gist.id;
  };

  const ensureGist = async (): Promise<string> => {
    if (id !== null) return id;
    id = (await findGist()) ?? (await createGist());
    return id;
  };

  const backend: FileBackend = {
    async read(name, readOptions) {
      const gistId = await ensureGist();
      if (readOptions?.fresh === true || snapshot === null) {
        snapshot = await collect(await request<GistResponse>(`/gists/${gistId}`));
      }
      return snapshot[name] ?? null;
    },
    async write(files) {
      const gistId = await ensureGist();
      const payload: Record<string, { content: string } | null> = {};
      for (const [name, content] of Object.entries(files)) {
        payload[name] = content === null ? null : { content };
      }
      const gist = await request<GistResponse>(`/gists/${gistId}`, {
        method: 'PATCH',
        body: JSON.stringify({ files: payload }),
      });
      snapshot = await collect(gist);
    },
  };

  const store = createFileSyncStore({
    backend,
    codec: createCodec(options.passphrase),
    dataVersion: options.dataVersion ?? CURRENT_DATA_VERSION,
    ...(options.deviceName === undefined ? {} : { deviceName: options.deviceName }),
    ...(options.now === undefined ? {} : { now: options.now }),
  });

  return {
    ...store,
    ensureGist,
    gistId: () => id,
    async testConnection() {
      let login: string | null = null;
      try {
        login = (await request<{ login?: string }>('/user')).login ?? null;
      } catch (error) {
        // A fine-grained token may refuse /user; only a rejected token is worth reporting here.
        if (error instanceof SyncError && error.kind === 'auth') throw error;
      }
      const found = await findGist();
      if (found === null) return { login, gistId: null, encrypted: false, profiles: 0 };
      id = found;
      const files = await collect(await request<GistResponse>(`/gists/${found}`));
      snapshot = files;
      const indexText = files[INDEX_FILE];
      if (indexText === undefined) return { login, gistId: found, encrypted: false, profiles: 0 };
      const { header, body } = readIndexFile(JSON.parse(indexText));
      const profiles =
        header === undefined && typeof body === 'object' && body !== null && 'profiles' in body
          ? ((body as { profiles?: unknown[] }).profiles?.length ?? 0)
          : 0;
      return { login, gistId: found, encrypted: header !== undefined, profiles };
    },
  };
}
