/**
 * Signing in (S-49b, spec §5.2). Two ways in, one way out.
 *
 * Google uses a **frontend-hosted redirect**: the only host Google ever sees is the one serving the
 * app, so the backend can move without touching the OAuth client (spec §2.1). PocketBase hands us
 * the PKCE verifier and the anti-CSRF `state` with the provider list; both have to survive a full
 * page navigation, so they go to `sessionStorage` and are checked on the way back. The state check
 * is not optional — without it the callback is open to CSRF.
 *
 * Email/password is the fallback for a player who does not want a Google account, and the only way
 * the e2e suite can drive the flow without a browser leaving the machine.
 */
import {
  AccountError,
  getClient,
  oauthRedirectUrl,
  PKCE_SESSION_KEY,
  readSession,
  USERS_COLLECTION,
  writeSession,
} from './client';
import { authUserSchema, type AccountUser } from './schema';

export const GOOGLE_PROVIDER = 'google';

interface PkceState {
  codeVerifier: string;
  state: string;
  redirectUrl: string;
}

/** The status a PocketBase `ClientResponseError` carries, without importing the class at run time. */
function statusOf(error: unknown): number {
  if (typeof error === 'object' && error !== null) {
    const { status } = error as { status?: unknown };
    if (typeof status === 'number') return status;
  }
  return 0;
}

/** Turn anything the SDK throws into one sentence a player can act on. */
function asAccountError(error: unknown, fallback: string): AccountError {
  if (error instanceof AccountError) return error;
  const status = statusOf(error);
  if (status === 0) {
    return new AccountError('network', 'The account server could not be reached.', { cause: error });
  }
  if (status === 400 || status === 401 || status === 403) {
    return new AccountError('auth', fallback, { cause: error });
  }
  return new AccountError('server', 'The account server refused the request.', { cause: error });
}

function toUser(record: unknown): AccountUser {
  const parsed = authUserSchema.safeParse(record);
  if (!parsed.success) {
    throw new AccountError('server', 'The account server sent an answer we could not read.');
  }
  return parsed.data;
}

// ---- Google ------------------------------------------------------------------------------------
/**
 * Step 1: ask PocketBase for the provider (it mints the PKCE pair), park what must survive the
 * redirect, and leave.
 *
 * `authURL` already ends with `redirect_uri=`, so the redirect is *appended*, raw, exactly as
 * PocketBase's own docs and SDK do it (investigation 0012, item 8).
 */
export async function startGoogleSignIn(): Promise<void> {
  const pb = await getClient();
  let providers;
  try {
    const methods = await pb.collection(USERS_COLLECTION).listAuthMethods();
    providers = methods.oauth2.providers;
  } catch (error) {
    throw asAccountError(error, 'Sign-in is unavailable right now.');
  }
  const google = providers.find((provider) => provider.name === GOOGLE_PROVIDER);
  if (!google) {
    throw new AccountError('auth', 'Google sign-in is not enabled on this server.');
  }

  const redirectUrl = oauthRedirectUrl();
  const pkce: PkceState = { codeVerifier: google.codeVerifier, state: google.state, redirectUrl };
  writeSession(PKCE_SESSION_KEY, JSON.stringify(pkce));
  window.location.assign(`${google.authURL}${redirectUrl}`);
}

function readPkce(): PkceState | null {
  const raw = readSession(PKCE_SESSION_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { codeVerifier, state, redirectUrl } = parsed as Record<string, unknown>;
    if (typeof codeVerifier !== 'string' || typeof state !== 'string' || typeof redirectUrl !== 'string') {
      return null;
    }
    return { codeVerifier, state, redirectUrl };
  } catch {
    return null;
  }
}

/**
 * Step 2, on `…/oauth-callback`: check the state, exchange the code, forget the PKCE pair. The
 * redirect URL sent here is the one that was stored, so it is byte-identical to step 1 even if the
 * page is reached by a different path.
 */
export async function completeGoogleSignIn(): Promise<AccountUser> {
  const params = new URLSearchParams(window.location.search);
  const stored = readPkce();
  writeSession(PKCE_SESSION_KEY, null);

  if (params.get('error') !== null) {
    throw new AccountError('oauth', 'Google did not complete the sign-in.');
  }
  const code = params.get('code');
  if (code === null || stored === null || params.get('state') !== stored.state) {
    throw new AccountError('oauth', 'This sign-in could not be verified. Start it again.');
  }

  const pb = await getClient();
  try {
    const result = await pb
      .collection(USERS_COLLECTION)
      .authWithOAuth2Code(GOOGLE_PROVIDER, code, stored.codeVerifier, stored.redirectUrl);
    return toUser(result.record);
  } catch (error) {
    throw asAccountError(error, 'Google sign-in was refused.');
  }
}

// ---- Email and password ------------------------------------------------------------------------
export async function signInWithPassword(email: string, password: string): Promise<AccountUser> {
  const pb = await getClient();
  try {
    const result = await pb.collection(USERS_COLLECTION).authWithPassword(email, password);
    return toUser(result.record);
  } catch (error) {
    throw asAccountError(error, 'That email and password do not match an account.');
  }
}

/**
 * Create the account, sign in with it, then ask for the verification email. The verification is
 * best-effort on purpose: an instance with no SMTP configured must not turn a successful sign-up
 * into an error the player cannot do anything about.
 */
export async function signUpWithPassword(email: string, password: string): Promise<AccountUser> {
  const pb = await getClient();
  try {
    await pb.collection(USERS_COLLECTION).create({ email, password, passwordConfirm: password });
  } catch (error) {
    if (statusOf(error) === 400) {
      throw new AccountError(
        'auth',
        'That account could not be created. The email may already be in use, or the password is shorter than 8 characters.',
        { cause: error },
      );
    }
    throw asAccountError(error, 'That account could not be created.');
  }
  const user = await signInWithPassword(email, password);
  try {
    await pb.collection(USERS_COLLECTION).requestVerification(email);
  } catch {
    /* no mailer configured, or the address bounced: the account exists either way */
  }
  return user;
}

// ---- Session -----------------------------------------------------------------------------------
/**
 * Revalidate a stored token on start-up (spec §5.1). A token the server no longer honours is
 * cleared rather than left to fail on the first Save.
 */
export async function refreshSession(): Promise<AccountUser | null> {
  const pb = await getClient();
  if (!pb.authStore.isValid) {
    pb.authStore.clear();
    return null;
  }
  try {
    const result = await pb.collection(USERS_COLLECTION).authRefresh();
    return toUser(result.record);
  } catch (error) {
    // Offline is not a reason to sign somebody out; a rejected token is.
    if (statusOf(error) === 0) return currentUser(pb.authStore.record);
    pb.authStore.clear();
    return null;
  }
}

function currentUser(record: unknown): AccountUser | null {
  const parsed = authUserSchema.safeParse(record);
  return parsed.success ? parsed.data : null;
}

export async function signOut(): Promise<void> {
  const pb = await getClient();
  pb.authStore.clear();
}
