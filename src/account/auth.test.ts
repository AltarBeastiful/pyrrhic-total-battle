// @vitest-environment jsdom
/**
 * Signing in (S-49b, spec §5.2). The two things worth testing here are the ones a mistake makes
 * invisible: that the PKCE state is *checked* on the way back, and that the redirect URL sent to the
 * provider is byte-identical to the one sent to the exchange.
 */
import { beforeEach, expect, test, vi } from 'vitest';

import { AUTH_STORAGE_KEY, PKCE_SESSION_KEY, resetClient } from './client';
import {
  changePassword,
  completeGoogleSignIn,
  confirmPasswordReset,
  confirmVerification,
  deleteAccount,
  refreshSession,
  requestPasswordReset,
  resendVerification,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  startGoogleSignIn,
} from './auth';
import { fakeCalls, FakeResponseError, onRequest, resetFakePocketBase } from './fixtures';

vi.mock('pocketbase', async () => {
  const { FakePocketBase, FakeAuthStore } = await import('./fixtures');
  return { default: FakePocketBase, LocalAuthStore: FakeAuthStore };
});

const USER = { id: 'u1', email: 'player@example.com', verified: false };

/**
 * jsdom refuses a real navigation, so `assign` is replaced by a recorder — the URL it was handed is
 * the whole assertion. Everything else still reads through to the real `Location`, which follows
 * `history.replaceState`; that is what lets a test move the page to the callback path.
 */
let assigned = '';
const realLocation = window.location;
Object.defineProperty(window, 'location', {
  configurable: true,
  value: {
    get href() {
      return realLocation.href;
    },
    get origin() {
      return realLocation.origin;
    },
    get search() {
      return realLocation.search;
    },
    assign: (url: string) => {
      assigned = url;
    },
  },
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetClient();
  resetFakePocketBase();
  assigned = '';
  vi.stubEnv('VITE_BACKEND_ORIGIN', 'https://backend.test');
  window.history.replaceState(null, '', '/pyrrhic/');
});

function googleProvider(): unknown {
  return {
    oauth2: {
      enabled: true,
      providers: [
        {
          name: 'google',
          displayName: 'Google',
          state: 'state-123',
          codeVerifier: 'verifier-123',
          authURL: 'https://accounts.google.com/o/oauth2/auth?client_id=x&redirect_uri=',
        },
      ],
    },
  };
}

test('starting Google sign-in parks the PKCE pair and leaves for the provider', async () => {
  onRequest('listAuthMethods', () => googleProvider());
  await startGoogleSignIn();

  expect(JSON.parse(sessionStorage.getItem(PKCE_SESSION_KEY) ?? '{}')).toEqual({
    codeVerifier: 'verifier-123',
    state: 'state-123',
    redirectUrl: 'http://localhost:3000/pyrrhic/oauth-callback',
  });
  // `authURL` already ends with `redirect_uri=`; the redirect is appended raw (investigation 0012).
  expect(assigned).toBe(
    'https://accounts.google.com/o/oauth2/auth?client_id=x&redirect_uri=http://localhost:3000/pyrrhic/oauth-callback',
  );
});

test('a server with no Google provider says so instead of failing obscurely', async () => {
  onRequest('listAuthMethods', () => ({ oauth2: { enabled: false, providers: [] } }));
  await expect(startGoogleSignIn()).rejects.toMatchObject({
    kind: 'auth',
    message: 'Google sign-in is not enabled on this server.',
  });
});

test('the callback exchanges the code with the same redirect URL it left with', async () => {
  onRequest('listAuthMethods', () => googleProvider());
  await startGoogleSignIn();

  window.history.replaceState(null, '', '/pyrrhic/oauth-callback?code=the-code&state=state-123');
  onRequest('authWithOAuth2Code', () => ({ token: 'tok', record: USER }));

  await expect(completeGoogleSignIn()).resolves.toEqual(USER);
  expect(fakeCalls.at(-1)).toEqual({
    collection: 'users',
    method: 'authWithOAuth2Code',
    args: ['google', 'the-code', 'verifier-123', 'http://localhost:3000/pyrrhic/oauth-callback'],
  });
  // The verifier is single-use: it must not survive the exchange.
  expect(sessionStorage.getItem(PKCE_SESSION_KEY)).toBeNull();
});

test('a state that does not match is refused, and nothing is exchanged', async () => {
  onRequest('listAuthMethods', () => googleProvider());
  await startGoogleSignIn();

  window.history.replaceState(null, '', '/pyrrhic/oauth-callback?code=the-code&state=forged');
  await expect(completeGoogleSignIn()).rejects.toMatchObject({ kind: 'oauth' });
  expect(fakeCalls.some((call) => call.method === 'authWithOAuth2Code')).toBe(false);
});

test('a callback with no parked verifier is refused', async () => {
  window.history.replaceState(null, '', '/pyrrhic/oauth-callback?code=the-code&state=state-123');
  await expect(completeGoogleSignIn()).rejects.toMatchObject({ kind: 'oauth' });
});

test('a refusal from Google is a sentence, not a crash', async () => {
  window.history.replaceState(null, '', '/pyrrhic/oauth-callback?error=access_denied');
  await expect(completeGoogleSignIn()).rejects.toMatchObject({
    kind: 'oauth',
    message: 'Google did not complete the sign-in.',
  });
});

test('email and password sign-in stores the session', async () => {
  onRequest('authWithPassword', () => ({ token: 'tok', record: USER }));
  await expect(signInWithPassword('player@example.com', 'password123')).resolves.toEqual(USER);
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain('tok');
});

test('wrong credentials are one sentence, not a status code', async () => {
  onRequest('authWithPassword', () => {
    throw new FakeResponseError(400);
  });
  await expect(signInWithPassword('player@example.com', 'nope')).rejects.toMatchObject({
    kind: 'auth',
    message: 'That email and password do not match an account.',
  });
});

test('an unreachable backend is told apart from a refused password', async () => {
  onRequest('authWithPassword', () => {
    throw new TypeError('Failed to fetch');
  });
  await expect(signInWithPassword('player@example.com', 'password123')).rejects.toMatchObject({
    kind: 'network',
  });
});

test('sign-up creates the account, signs in, and asks for the verification email', async () => {
  onRequest('create', () => ({ id: 'u1' }));
  onRequest('authWithPassword', () => ({ token: 'tok', record: USER }));
  onRequest('requestVerification', () => true);

  await expect(signUpWithPassword('player@example.com', 'password123')).resolves.toEqual(USER);
  expect(fakeCalls.map((call) => call.method)).toEqual(['create', 'authWithPassword', 'requestVerification']);
});

test('an instance with no mailer still signs the new account in', async () => {
  onRequest('create', () => ({ id: 'u1' }));
  onRequest('authWithPassword', () => ({ token: 'tok', record: USER }));
  onRequest('requestVerification', () => {
    throw new FakeResponseError(400, 'no mailer');
  });
  await expect(signUpWithPassword('player@example.com', 'password123')).resolves.toEqual(USER);
});

test('a rejected token is cleared on start-up; an unreachable server is not', async () => {
  onRequest('authWithPassword', () => ({ token: 'tok', record: USER }));
  await signInWithPassword('player@example.com', 'password123');

  onRequest('authRefresh', () => {
    throw new TypeError('Failed to fetch');
  });
  await expect(refreshSession()).resolves.toEqual(USER);
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain('tok');

  onRequest('authRefresh', () => {
    throw new FakeResponseError(401);
  });
  await expect(refreshSession()).resolves.toBeNull();
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
});

test('restoring without a token asks the server nothing', async () => {
  await expect(refreshSession()).resolves.toBeNull();
  expect(fakeCalls).toEqual([]);
});

test('signing out drops the stored session', async () => {
  onRequest('authWithPassword', () => ({ token: 'tok', record: USER }));
  await signInWithPassword('player@example.com', 'password123');
  await signOut();
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
});

// ---- Confirming, forgetting, changing, leaving ---------------------------------------------------
test('a sign-in refused by the collection rule names the unconfirmed address', async () => {
  // 403 is `authRule` refusing the record itself; wrong credentials are a 400 (verified on 0.40.4).
  onRequest('authWithPassword', () => {
    throw new FakeResponseError(403);
  });
  await expect(signInWithPassword('player@example.com', 'password1234')).rejects.toMatchObject({
    kind: 'unverified',
    message: 'This account is not confirmed yet. Open the link in the confirmation email, then sign in.',
  });
});

test('asking for another confirmation email is one call with the address', async () => {
  onRequest('requestVerification', () => true);
  await expect(resendVerification('player@example.com')).resolves.toBeUndefined();
  expect(fakeCalls.at(-1)).toEqual({
    collection: 'users',
    method: 'requestVerification',
    args: ['player@example.com'],
  });
});

test('a confirmation link with no token is refused before the server is asked', async () => {
  await expect(confirmVerification('')).rejects.toMatchObject({ kind: 'auth' });
  expect(fakeCalls).toEqual([]);
});

test('a confirmation token is spent, and an expired one says what to do next', async () => {
  onRequest('confirmVerification', () => true);
  await expect(confirmVerification('the-token')).resolves.toBeUndefined();
  expect(fakeCalls.at(-1)).toMatchObject({ method: 'confirmVerification', args: ['the-token'] });

  onRequest('confirmVerification', () => {
    throw new FakeResponseError(400);
  });
  await expect(confirmVerification('stale')).rejects.toMatchObject({
    kind: 'auth',
    message: 'This confirmation link has expired. Sign in and ask for a new email from the account menu.',
  });
});

test('a reset request is one call, and says nothing about whether the address exists', async () => {
  onRequest('requestPasswordReset', () => true);
  await expect(requestPasswordReset('player@example.com')).resolves.toBeUndefined();
  expect(fakeCalls.at(-1)).toEqual({
    collection: 'users',
    method: 'requestPasswordReset',
    args: ['player@example.com'],
  });
});

test('too many reset requests is a wait, not a failure the player caused', async () => {
  onRequest('requestPasswordReset', () => {
    throw new FakeResponseError(429);
  });
  await expect(requestPasswordReset('player@example.com')).rejects.toMatchObject({
    kind: 'server',
    message: 'Too many attempts in a row. Wait a few minutes, then try again.',
  });
});

test('confirming a reset sends the new password twice, as the API wants it', async () => {
  onRequest('confirmPasswordReset', () => true);
  await expect(confirmPasswordReset('the-token', 'newpassword12')).resolves.toBeUndefined();
  expect(fakeCalls.at(-1)).toEqual({
    collection: 'users',
    method: 'confirmPasswordReset',
    args: ['the-token', 'newpassword12', 'newpassword12'],
  });
});

test('a spent or expired reset link says so, with the length rule beside it', async () => {
  onRequest('confirmPasswordReset', () => {
    throw new FakeResponseError(400);
  });
  await expect(confirmPasswordReset('stale', 'newpassword12')).rejects.toMatchObject({
    kind: 'auth',
    message:
      'This reset link has expired, or the new password is shorter than 10 characters. Ask for a new email and try again.',
  });
  await expect(confirmPasswordReset('', 'newpassword12')).rejects.toMatchObject({ kind: 'auth' });
});

test('changing the password sends the old one and signs this browser in again', async () => {
  onRequest('authWithPassword', () => ({ token: 'tok', record: USER }));
  await signInWithPassword('player@example.com', 'password1234');

  onRequest('update', () => ({ ...USER }));
  onRequest('authWithPassword', () => ({ token: 'fresh-token', record: { ...USER, verified: true } }));

  await expect(changePassword('password1234', 'newpassword12')).resolves.toMatchObject({ id: 'u1' });
  expect(fakeCalls.map((call) => call.method)).toEqual(['authWithPassword', 'update', 'authWithPassword']);
  expect(fakeCalls[1]?.args).toEqual([
    'u1',
    { oldPassword: 'password1234', password: 'newpassword12', passwordConfirm: 'newpassword12' },
  ]);
  // PocketBase revokes every token of the account as it saves, so the stored one must be the new one.
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain('fresh-token');
});

test('a wrong current password is one sentence that names both possible causes', async () => {
  onRequest('authWithPassword', () => ({ token: 'tok', record: USER }));
  await signInWithPassword('player@example.com', 'password1234');

  onRequest('update', () => {
    throw new FakeResponseError(400);
  });
  await expect(changePassword('wrong', 'newpassword12')).rejects.toMatchObject({
    kind: 'auth',
    message: 'That current password is not right, or the new one is shorter than 10 characters.',
  });
});

test('changing the password without a session asks for one first', async () => {
  await expect(changePassword('password1234', 'newpassword12')).rejects.toMatchObject({ kind: 'auth' });
  expect(fakeCalls).toEqual([]);
});

test('deleting the account removes the record and drops the session with it', async () => {
  onRequest('authWithPassword', () => ({ token: 'tok', record: USER }));
  await signInWithPassword('player@example.com', 'password1234');

  onRequest('delete', () => true);
  await expect(deleteAccount()).resolves.toBeUndefined();
  expect(fakeCalls.at(-1)).toEqual({ collection: 'users', method: 'delete', args: ['u1'] });
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
});

test('an account that could not be deleted keeps its session, and says so', async () => {
  onRequest('authWithPassword', () => ({ token: 'tok', record: USER }));
  await signInWithPassword('player@example.com', 'password1234');

  onRequest('delete', () => {
    throw new FakeResponseError(404);
  });
  await expect(deleteAccount()).rejects.toMatchObject({ kind: 'server' });
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain('tok');
});
