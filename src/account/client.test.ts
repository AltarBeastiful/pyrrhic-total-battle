// @vitest-environment jsdom
/**
 * The plumbing the rest of the account rests on (S-49b): a build with no backend has no feature, the
 * device id is minted once and kept, and the two URLs the OAuth round trip has to agree on resolve
 * the same from the app root and from the callback path.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import {
  accountErrorMessage,
  AccountError,
  appRootUrl,
  AUTH_STORAGE_KEY,
  backendOrigin,
  DEVICE_STORAGE_KEY,
  getClient,
  hasStoredSession,
  isAccountConfigured,
  isOAuthCallback,
  loadDeviceState,
  oauthRedirectUrl,
  readCallback,
  resetClient,
  saveDeviceState,
} from './client';
import { resetFakePocketBase } from './fixtures';

vi.mock('pocketbase', async () => {
  const { FakePocketBase, FakeAuthStore } = await import('./fixtures');
  return { default: FakePocketBase, LocalAuthStore: FakeAuthStore };
});

/** jsdom's `document.baseURI` follows the document URL, which is what the helpers resolve against. */
function at(url: string): void {
  window.history.replaceState(null, '', url);
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetClient();
  resetFakePocketBase();
  at('/pyrrhic/');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test('no backend origin means no feature at all', () => {
  expect(backendOrigin()).toBe('');
  expect(isAccountConfigured()).toBe(false);
});

test('the configured origin loses its trailing slash and its padding', () => {
  vi.stubEnv('VITE_BACKEND_ORIGIN', '  https://pyrrhic-backend.dynu.net/  ');
  expect(backendOrigin()).toBe('https://pyrrhic-backend.dynu.net');
  expect(isAccountConfigured()).toBe(true);
});

test('asking for a client without a backend is an error, not a broken client', async () => {
  await expect(getClient()).rejects.toBeInstanceOf(AccountError);
  await expect(getClient()).rejects.toMatchObject({ kind: 'unconfigured' });
});

test('the client is built once, against the configured origin', async () => {
  vi.stubEnv('VITE_BACKEND_ORIGIN', 'https://backend.test');
  const first = await getClient();
  const second = await getClient();
  expect(first).toBe(second);
  expect((first as unknown as { baseURL: string }).baseURL).toBe('https://backend.test');
});

test('the device id is minted once and survives a reload', () => {
  const first = loadDeviceState();
  expect(first.deviceId).toMatch(/^[0-9a-f-]{36}$/);
  expect(first.remoteVersion).toBe(0);
  expect(loadDeviceState().deviceId).toBe(first.deviceId);

  saveDeviceState({ deviceId: first.deviceId, remoteVersion: 4 });
  expect(loadDeviceState()).toEqual({ deviceId: first.deviceId, remoteVersion: 4 });
});

test('a device record that has been tampered with is replaced, not trusted', () => {
  localStorage.setItem(DEVICE_STORAGE_KEY, '{not json');
  expect(loadDeviceState().deviceId).not.toBe('');

  localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify({ deviceId: 'kept', remoteVersion: -3 }));
  expect(loadDeviceState()).toEqual({ deviceId: 'kept', remoteVersion: 0 });
});

test('a stored session is recognised without loading the SDK', () => {
  expect(hasStoredSession()).toBe(false);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: 'abc', record: {} }));
  expect(hasStoredSession()).toBe(true);
});

test('the redirect URL is the same string from the app root and from the callback itself', () => {
  at('/pyrrhic/');
  const fromRoot = oauthRedirectUrl();
  at('/pyrrhic/oauth-callback?code=x&state=y');
  expect(oauthRedirectUrl()).toBe(fromRoot);
  expect(fromRoot).toBe('http://localhost:3000/pyrrhic/oauth-callback');
});

test('the app root is where the callback sends the address bar back to', () => {
  at('/pyrrhic/oauth-callback?code=x&state=y');
  expect(appRootUrl()).toBe('http://localhost:3000/pyrrhic/');
});

test('a callback is recognised by its query, a normal start is not', () => {
  at('/pyrrhic/');
  expect(isOAuthCallback()).toBe(false);
  at('/pyrrhic/#c=share-payload');
  expect(isOAuthCallback()).toBe(false);
  at('/pyrrhic/oauth-callback?code=abc&state=def');
  expect(isOAuthCallback()).toBe(true);
  at('/pyrrhic/oauth-callback?error=access_denied');
  expect(isOAuthCallback()).toBe(true);
});

test('the two links in the backend emails are recognised by their path, with their token', () => {
  at('/pyrrhic/');
  expect(readCallback()).toBeNull();
  at('/pyrrhic/?token=not-ours');
  expect(readCallback()).toBeNull();

  at('/pyrrhic/password-reset?token=abc');
  expect(readCallback()).toEqual({ kind: 'password-reset', token: 'abc' });
  // GitHub Pages serves 404.html for both spellings, so both have to be answered.
  at('/pyrrhic/verify-email/?token=def');
  expect(readCallback()).toEqual({ kind: 'verify-email', token: 'def' });
  // A link that lost its query is still ours to answer — with a sentence, not a blank app.
  at('/pyrrhic/password-reset');
  expect(readCallback()).toEqual({ kind: 'password-reset', token: '' });

  at('/pyrrhic/oauth-callback?code=abc&state=def');
  expect(readCallback()).toEqual({ kind: 'oauth' });
});

test('every failure has a sentence, never a stack', () => {
  expect(accountErrorMessage(new AccountError('network', 'The account server could not be reached.'))).toBe(
    'The account server could not be reached.',
  );
  expect(accountErrorMessage('something')).toBe('Something went wrong. Try again.');
});
