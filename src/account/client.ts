/**
 * Account plumbing (S-49b, ADR-0009): where the backend is, where the browser keeps the session, and
 * the two URLs the OAuth round trip has to agree on.
 *
 * The PocketBase SDK is behind a dynamic `import()` on purpose. The account is opt-in, most players
 * never sign in, and a build with no `VITE_BACKEND_ORIGIN` hides the feature entirely — so the SDK
 * must not be able to reach the first load. Everything here is therefore either a plain string
 * helper or an `async` factory.
 */
import type PocketBaseClient from 'pocketbase';

/** The PocketBase auth token (JSON, written by the SDK's `LocalAuthStore`). */
export const AUTH_STORAGE_KEY = 'pyrrhic.account.v1';
/** `{ deviceId, remoteVersion }` — device-private, never part of the synced blob. */
export const DEVICE_STORAGE_KEY = 'pyrrhic.account.device.v1';
/** PKCE verifier + state, for the length of the redirect only (spec §5.2). */
export const PKCE_SESSION_KEY = 'pyrrhic.account.pkce';

/** The path the OAuth provider comes back to, relative to the app root (investigation 0012). */
export const OAUTH_CALLBACK_FILE = 'oauth-callback';

export const USERS_COLLECTION = 'users';
export const PROFILES_COLLECTION = 'profiles';

/** The save endpoint the hook owns; direct record writes are refused by the collection's rules. */
export const PROFILE_ENDPOINT = '/api/app/profile';

// ---- Configuration -----------------------------------------------------------------------------
/**
 * Backend origin, baked in at build time. Empty (the default) means the whole feature is absent:
 * no menu rows, no client, no SDK chunk. Read on every call rather than captured in a constant so
 * a test can stub the environment.
 */
export function backendOrigin(): string {
  const raw: unknown = import.meta.env.VITE_BACKEND_ORIGIN;
  return typeof raw === 'string' ? raw.trim().replace(/\/+$/, '') : '';
}

export function isAccountConfigured(): boolean {
  return backendOrigin() !== '';
}

// ---- Errors ------------------------------------------------------------------------------------
export type AccountErrorKind =
  /** No `VITE_BACKEND_ORIGIN` in this build. */
  | 'unconfigured'
  /** The request never reached the backend (offline, blocked, CORS). */
  | 'network'
  /** Wrong credentials, an expired session, or a provider that refused. */
  | 'auth'
  /** The OAuth round trip could not be verified (state mismatch, no code). */
  | 'oauth'
  /** The backend answered, but not with something we can use. */
  | 'server'
  /** The stored blob is not a Pyrrhic document. */
  | 'format';

export class AccountError extends Error {
  readonly kind: AccountErrorKind;

  constructor(kind: AccountErrorKind, message: string, options: ErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AccountError';
    this.kind = kind;
  }
}

/** A sentence for the player, whatever was thrown. Never a status code, never a stack. */
export function accountErrorMessage(error: unknown): string {
  if (error instanceof AccountError) return error.message;
  if (error instanceof Error && error.message !== '') return error.message;
  return 'Something went wrong. Try again.';
}

// ---- Guarded browser storage -------------------------------------------------------------------
// Safari private mode throws on write and a blocked storage policy throws on the first read; losing
// the account session must never break the app (same rule as src/state/storage.ts).
export function readLocal(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string | null): void {
  try {
    if (value === null) globalThis.localStorage?.removeItem(key);
    else globalThis.localStorage?.setItem(key, value);
  } catch {
    /* nothing else to try */
  }
}

export function readSession(key: string): string | null {
  try {
    return globalThis.sessionStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: string | null): void {
  try {
    if (value === null) globalThis.sessionStorage?.removeItem(key);
    else globalThis.sessionStorage?.setItem(key, value);
  } catch {
    /* nothing else to try */
  }
}

/** True when this browser holds a token worth refreshing; cheap enough to run before the SDK loads. */
export function hasStoredSession(): boolean {
  const raw = readLocal(AUTH_STORAGE_KEY);
  return raw !== null && raw !== '' && raw !== '{}';
}

// ---- Device identity ---------------------------------------------------------------------------
export interface DeviceState {
  /** A UUID generated once per browser profile. Only ever used to word a conflict message. */
  deviceId: string;
  /** The version last pulled or pushed; `0` for an account that has never saved (spec §5.4). */
  remoteVersion: number;
}

/**
 * Read the device state, minting the id on first use. Deliberately *not* the root document's
 * `deviceId`: that one travels inside the synced blob, so a pull would hand this browser another
 * device's identity.
 */
export function loadDeviceState(): DeviceState {
  const raw = readLocal(DEVICE_STORAGE_KEY);
  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        const { deviceId, remoteVersion } = parsed as Record<string, unknown>;
        if (typeof deviceId === 'string' && deviceId !== '') {
          return {
            deviceId,
            remoteVersion:
              typeof remoteVersion === 'number' && Number.isInteger(remoteVersion) && remoteVersion >= 0
                ? remoteVersion
                : 0,
          };
        }
      }
    } catch {
      /* fall through and mint a new one */
    }
  }
  const state: DeviceState = { deviceId: crypto.randomUUID(), remoteVersion: 0 };
  saveDeviceState(state);
  return state;
}

export function saveDeviceState(state: DeviceState): void {
  writeLocal(DEVICE_STORAGE_KEY, JSON.stringify(state));
}

// ---- URLs --------------------------------------------------------------------------------------
/**
 * The app's own root. Resolved against `document.baseURI` rather than `import.meta.env.BASE_URL`,
 * which is the literal `./` this project builds with: the same trick `registerServiceWorker` uses,
 * and the reason one bundle works at a domain root, under a Pages sub-path and from disk.
 */
export function appRootUrl(): string {
  return new URL('.', document.baseURI).href;
}

/**
 * The redirect URI, byte-identical on the way out and on the way back — `new URL` replaces the last
 * path segment, so it resolves the same from `…/` and from `…/oauth-callback?code=…`. This exact
 * string is what is registered in the Google console; changing it breaks sign-in.
 */
export function oauthRedirectUrl(): string {
  return new URL(OAUTH_CALLBACK_FILE, document.baseURI).href;
}

/** True when this page load is the provider coming back (a `code`, or a refusal). */
export function isOAuthCallback(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('code') || params.has('error');
}

// ---- The client --------------------------------------------------------------------------------
let client: PocketBaseClient | null = null;
let loading: Promise<PocketBaseClient> | null = null;

/**
 * The one client instance, created on first use. The SDK arrives in its own chunk here and nowhere
 * else, so a build without a backend origin never downloads it.
 */
export async function getClient(): Promise<PocketBaseClient> {
  const origin = backendOrigin();
  if (origin === '') {
    throw new AccountError('unconfigured', 'This build has no account backend.');
  }
  if (client !== null) return client;
  loading ??= (async () => {
    const { default: PocketBase, LocalAuthStore } = await import('pocketbase');
    const created = new PocketBase(origin, new LocalAuthStore(AUTH_STORAGE_KEY));
    client = created;
    return created;
  })();
  try {
    return await loading;
  } catch (error) {
    loading = null;
    throw new AccountError('network', 'The account code could not be loaded.', { cause: error });
  }
}

/** Drop the cached client. Tests only; the app makes one and keeps it. */
export function resetClient(): void {
  client = null;
  loading = null;
}
