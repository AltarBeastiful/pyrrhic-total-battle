// @vitest-environment jsdom
/**
 * Signing in (S-49b, S-49c). SSO is the SDK's popup flow, so what is ours to test is the reading of
 * the server's methods and the sentence a failure becomes; the email flows are kept, switched off in
 * production, and tested here as they were.
 */
import { beforeEach, expect, test, vi } from 'vitest';

import { AUTH_STORAGE_KEY, resetClient } from './client';
import {
  changePassword,
  confirmPasswordReset,
  confirmVerification,
  deleteAccount,
  refreshSession,
  requestPasswordReset,
  resendVerification,
  signInMethods,
  signInWithPassword,
  signInWithProvider,
  signOut,
  signUpWithPassword,
} from './auth';
import { fakeCalls, FakeResponseError, onRequest, resetFakePocketBase } from './fixtures';

vi.mock('pocketbase', async () => {
  const { FakePocketBase, FakeAuthStore } = await import('./fixtures');
  return { default: FakePocketBase, LocalAuthStore: FakeAuthStore };
});

const USER = { id: 'u1', email: 'player@example.com', verified: false };

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetClient();
  resetFakePocketBase();
  vi.stubEnv('VITE_BACKEND_ORIGIN', 'https://backend.test');
  window.history.replaceState(null, '', '/pyrrhic/');
});

function methods(): unknown {
  return {
    password: { enabled: false, identityFields: ['email'] },
    oauth2: {
      enabled: true,
      providers: [
        { name: 'google', displayName: 'Google', state: 's', codeVerifier: 'v', authURL: 'https://g/' },
        { name: 'discord', displayName: 'Discord', state: 's', codeVerifier: 'v', authURL: 'https://d/' },
      ],
    },
  };
}

test('the server says which providers to offer, and whether the email form is drawn', async () => {
  onRequest('listAuthMethods', () => methods());
  await expect(signInMethods()).resolves.toEqual({
    providers: [
      { name: 'google', displayName: 'Google' },
      { name: 'discord', displayName: 'Discord' },
    ],
    password: false,
  });
});

test('an unreachable server is a sentence when the dialog asks for the methods', async () => {
  onRequest('listAuthMethods', () => {
    throw new FakeResponseError(0, 'offline');
  });
  await expect(signInMethods()).rejects.toMatchObject({ kind: 'network' });
});

test('a provider sign-in stores the session, through the client the dialog already loaded', async () => {
  onRequest('listAuthMethods', () => methods());
  await signInMethods();
  onRequest('authWithOAuth2', () => ({ token: 'tok', record: USER }));

  await expect(signInWithProvider('discord')).resolves.toEqual(USER);
  expect(fakeCalls.at(-1)).toEqual({ collection: 'users', method: 'authWithOAuth2', args: ['discord'] });
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain('tok');
});

test('a provider sign-in before the client is loaded refuses instead of opening a blocked popup', async () => {
  await expect(signInWithProvider('google')).rejects.toMatchObject({ kind: 'auth' });
  expect(fakeCalls).toEqual([]);
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
