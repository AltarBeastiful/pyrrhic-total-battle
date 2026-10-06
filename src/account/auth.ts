/**
 * Signing in (S-49b, S-49c). Two ways in, one way out.
 *
 * SSO is whatever providers the server lists (Google and Discord in production), through the SDK's
 * popup flow: PocketBase does the PKCE and the `state` check itself, so nothing here does.
 *
 * Email/password is switched off in production until SMTP exists (docs/plans/sso-accounts.md); the
 * code stays, and the e2e suite keeps it covered against a local server that switches it on. It brings four more
 * errands with it — confirm the address, forget the password, change the password, delete the
 * account — and every one of them is a single call PocketBase already implements; what is written
 * here is the wording and the session bookkeeping around them.
 */
import { AccountError, getClient, loadedClient, USERS_COLLECTION } from './client';
import { authUserSchema, type AccountUser } from './schema';

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
  if (status === 429) {
    return new AccountError('server', 'Too many attempts in a row. Wait a few minutes, then try again.', {
      cause: error,
    });
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

// ---- Providers (S-49c) -------------------------------------------------------------------------
/** What the server offers, read when the sign-in dialog opens: the client keeps no list of its own. */
export interface SignInMethods {
  providers: { name: string; displayName: string }[];
  /** Off in production until SMTP exists; the email form is drawn only when this is true. */
  password: boolean;
}

export async function signInMethods(): Promise<SignInMethods> {
  const pb = await getClient();
  try {
    const methods = await pb.collection(USERS_COLLECTION).listAuthMethods();
    return {
      providers: methods.oauth2.enabled
        ? methods.oauth2.providers.map(({ name, displayName }) => ({ name, displayName }))
        : [],
      password: methods.password.enabled,
    };
  } catch (error) {
    throw asAccountError(error, 'Sign-in is unavailable right now.');
  }
}

/**
 * The SDK's own popup flow: it opens the window, waits for the provider's answer over realtime and
 * exchanges the code. The redirect is the backend's `/api/oauth2-redirect`, which is what the Google
 * and Discord consoles register.
 *
 * Call it **straight from the click**, after `signInMethods()` has loaded the client: the SDK opens
 * its popup before its first `await`, and Safari blocks a popup opened any later than that.
 */
export async function signInWithProvider(provider: string): Promise<AccountUser> {
  const pb = loadedClient();
  if (pb === null) throw new AccountError('auth', 'Sign-in is unavailable right now.');
  try {
    const result = await pb.collection(USERS_COLLECTION).authWithOAuth2({ provider });
    return toUser(result.record);
  } catch (error) {
    throw asAccountError(error, 'The sign-in was not completed.');
  }
}

// ---- Email and password ------------------------------------------------------------------------
/** The floor the `users` collection enforces (the hardening migration raises PocketBase's own 8). */
export const PASSWORD_MIN = 10;

export async function signInWithPassword(email: string, password: string): Promise<AccountUser> {
  const pb = await getClient();
  try {
    const result = await pb.collection(USERS_COLLECTION).authWithPassword(email, password);
    return toUser(result.record);
  } catch (error) {
    // A 403 here is the collection's `authRule` refusing the record itself, and the only rule this
    // backend ever carries is "verified = true" (an owner switch, off by default — see the
    // migration). Wrong credentials are a 400, so the two never collide.
    if (statusOf(error) === 403) {
      throw new AccountError(
        'unverified',
        'This account is not confirmed yet. Open the link in the confirmation email, then sign in.',
        { cause: error },
      );
    }
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
        `That account could not be created. The email may already be in use, or the password is shorter than ${String(PASSWORD_MIN)} characters.`,
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

// ---- Confirming the address --------------------------------------------------------------------
/**
 * Ask for another confirmation email. Used by the account menu when a save was refused, and after a
 * sign-up on an instance whose first email never arrived.
 *
 * PocketBase answers 204 whether or not it actually sent anything: it keeps a per-account cooldown
 * and silently skips a second request made too soon (observed on 0.40.4). So the button can say the
 * mail is on its way, and cannot promise a new one.
 */
export async function resendVerification(email: string): Promise<void> {
  const pb = await getClient();
  try {
    await pb.collection(USERS_COLLECTION).requestVerification(email);
  } catch (error) {
    throw asAccountError(error, 'That confirmation email could not be sent.');
  }
}

/**
 * Spend the token from a confirmation email (`…/verify-email?token=…`). A token already spent comes
 * back 204 as well, so opening the link twice is not an error the player has to understand.
 */
export async function confirmVerification(token: string): Promise<void> {
  if (token === '') {
    throw new AccountError('auth', 'This confirmation link is incomplete. Open the one in the email again.');
  }
  const pb = await getClient();
  try {
    await pb.collection(USERS_COLLECTION).confirmVerification(token);
  } catch (error) {
    throw asAccountError(
      error,
      'This confirmation link has expired. Sign in and ask for a new email from the account menu.',
    );
  }
}

// ---- Forgotten passwords -------------------------------------------------------------------------
/**
 * Start a reset. PocketBase answers 204 for an address it has never seen, which is what lets the
 * dialog give the same neutral answer either way rather than telling a stranger which addresses are
 * registered (observed on 0.40.4).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const pb = await getClient();
  try {
    await pb.collection(USERS_COLLECTION).requestPasswordReset(email);
  } catch (error) {
    throw asAccountError(error, 'That reset email could not be sent.');
  }
}

/**
 * Spend the token from a reset email (`…/password-reset?token=…`). PocketBase revokes every session
 * of that account as it goes, and — because the token carries the address it was sent to — it also
 * marks the address confirmed (observed on 0.40.4). The caller signs in again with the new password.
 */
export async function confirmPasswordReset(token: string, password: string): Promise<void> {
  if (token === '') {
    throw new AccountError('auth', 'This reset link is incomplete. Open the one in the email again.');
  }
  const pb = await getClient();
  try {
    await pb.collection(USERS_COLLECTION).confirmPasswordReset(token, password, password);
  } catch (error) {
    if (statusOf(error) === 400) {
      throw new AccountError(
        'auth',
        `This reset link has expired, or the new password is shorter than ${String(PASSWORD_MIN)} characters. Ask for a new email and try again.`,
        { cause: error },
      );
    }
    throw asAccountError(error, 'That password could not be changed.');
  }
}

// ---- Changing and leaving ------------------------------------------------------------------------
/**
 * Change the password of the signed-in account. PocketBase requires the current one and then revokes
 * every token of the account, including this browser's (observed on 0.40.4) — so the session is made
 * again here, or the next Save would fail with an expired session the player did nothing to deserve.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<AccountUser> {
  const pb = await getClient();
  const signedIn = currentUser(pb.authStore.record);
  if (signedIn === null) {
    throw new AccountError('auth', 'This session has expired. Sign in again, then change your password.');
  }
  try {
    await pb.collection(USERS_COLLECTION).update(signedIn.id, {
      oldPassword: currentPassword,
      password: newPassword,
      passwordConfirm: newPassword,
    });
  } catch (error) {
    if (statusOf(error) === 400) {
      throw new AccountError(
        'auth',
        `That current password is not right, or the new one is shorter than ${String(PASSWORD_MIN)} characters.`,
        { cause: error },
      );
    }
    throw asAccountError(error, 'That password could not be changed.');
  }

  if (signedIn.email === '') {
    // Nothing to sign in with: an account whose address this browser cannot see. The password did
    // change, so say so rather than pretending the whole thing failed.
    pb.authStore.clear();
    throw new AccountError('auth', 'Your password is changed. Sign in again with the new one.');
  }
  return signInWithPassword(signedIn.email, newPassword);
}

/**
 * Delete the account and everything the server holds for it. The `profiles` record goes with it —
 * the relation cascades (verified on 0.40.4) — and this browser's own profiles are untouched: they
 * live in `localStorage` and have never depended on the account.
 */
export async function deleteAccount(): Promise<void> {
  const pb = await getClient();
  const signedIn = currentUser(pb.authStore.record);
  if (signedIn === null) {
    throw new AccountError('auth', 'This session has expired. Sign in again, then delete your account.');
  }
  try {
    await pb.collection(USERS_COLLECTION).delete(signedIn.id);
  } catch (error) {
    throw asAccountError(error, 'That account could not be deleted.');
  }
  pb.authStore.clear();
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
