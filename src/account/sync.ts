/**
 * The two requests the account makes (spec §5.1, §5.3). There is no sync engine: `pull()` reads the
 * one blob the account owns, `push()` overwrites it. The only concurrency control is the optimistic
 * `version`, and the only interesting answer is the deterministic **409** the backend hook returns
 * when this device's version is not exactly one past the server's.
 *
 * `push()` uses `fetch` rather than the SDK because the endpoint is a hook route, not a collection:
 * PocketBase wants the token raw in `Authorization`, with no `Bearer ` prefix (a prefix is accepted
 * too, investigation 0012 item 10).
 */
import type { RootDocument } from '@/state/schema';

import { AccountError, backendOrigin, getClient, PROFILE_ENDPOINT, PROFILES_COLLECTION } from './client';
import { profileRecordSchema, pushConflictSchema, pushOkSchema } from './schema';

/** What the account holds right now. `data` is still unvalidated: `migrate()` owns that. */
export interface RemoteProfile {
  version: number;
  updated: string;
  data: unknown;
}

export type PushResult =
  { ok: true; version: number; updated: string } | { ok: false; serverVersion: number; updated: string };

function statusOf(error: unknown): number {
  if (typeof error === 'object' && error !== null) {
    const { status } = error as { status?: unknown };
    if (typeof status === 'number') return status;
  }
  return 0;
}

/**
 * The account's blob, or `null` when nothing has ever been saved. The collection's view rule scopes
 * the query to the caller, so an empty filter is the whole query.
 */
export async function pull(): Promise<RemoteProfile | null> {
  const pb = await getClient();
  let record: unknown;
  try {
    record = await pb.collection(PROFILES_COLLECTION).getFirstListItem('');
  } catch (error) {
    // 404 is "this account has never saved", not a failure.
    if (statusOf(error) === 404) return null;
    if (statusOf(error) === 0) {
      throw new AccountError('network', 'The account server could not be reached.', { cause: error });
    }
    if (statusOf(error) === 401 || statusOf(error) === 403) {
      throw new AccountError('auth', 'This session has expired. Sign in again.', { cause: error });
    }
    throw new AccountError('server', 'The account server refused the request.', { cause: error });
  }

  const parsed = profileRecordSchema.safeParse(record);
  if (!parsed.success) {
    throw new AccountError('server', 'The account server sent a profile we could not read.');
  }
  return { version: parsed.data.version, updated: parsed.data.updated, data: parsed.data.data };
}

/**
 * Overwrite the account's blob. `baseVersion` is the version this device last saw; the request
 * carries `baseVersion + 1`, which is what makes a second device's save a conflict rather than a
 * silent overwrite.
 *
 * The blob must be a JSON **object** at the top level — the hook binds it with `nullObject()` and
 * rejects arrays and scalars with a 400 (investigation 0012, deviation 1). The root document is one.
 */
export async function push(
  document: RootDocument,
  baseVersion: number,
  deviceId: string,
): Promise<PushResult> {
  const pb = await getClient();
  const token = pb.authStore.token;
  if (token === '') {
    throw new AccountError('auth', 'Sign in before saving to your account.');
  }

  const version = baseVersion + 1;
  let response: Response;
  try {
    response = await fetch(`${backendOrigin()}${PROFILE_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ data: document, version, deviceId }),
    });
  } catch (error) {
    throw new AccountError('network', 'The account server could not be reached.', { cause: error });
  }

  if (response.status === 409) {
    const parsed = pushConflictSchema.safeParse(await readJson(response));
    if (!parsed.success) {
      throw new AccountError('server', 'The account server reported a conflict we could not read.');
    }
    return { ok: false, serverVersion: parsed.data.data.serverVersion, updated: parsed.data.data.updated };
  }
  if (response.status === 401 || response.status === 403) {
    throw new AccountError('auth', 'This session has expired. Sign in again.');
  }
  if (!response.ok) {
    throw new AccountError('server', 'The account server refused to save this profile.');
  }

  const parsed = pushOkSchema.safeParse(await readJson(response));
  if (!parsed.success) {
    throw new AccountError('server', 'The account server sent an answer we could not read.');
  }
  return { ok: true, version: parsed.data.version, updated: parsed.data.updated };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}
