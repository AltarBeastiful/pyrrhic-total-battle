// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest';

import { buildProfileLink } from '@/share/codec';
import { newProfile } from '@/state/defaults';

import { consumeShareFragment } from './shareFragment';
import { useUiStore } from './uiStore';

beforeEach(() => {
  useUiStore.setState({ pendingShare: null, shareError: null });
  window.history.replaceState(null, '', '/');
});

test('does nothing when the address carries no share code', async () => {
  expect(await consumeShareFragment()).toBe(false);
  expect(useUiStore.getState().pendingShare).toBeNull();
});

test('decodes a profile link, parks it and clears the address bar', async () => {
  const profile = newProfile('Shared account');
  const fragment = await buildProfileLink(profile);
  window.location.hash = fragment;

  expect(await consumeShareFragment()).toBe(true);

  const pending = useUiStore.getState().pendingShare;
  expect(pending?.kind).toBe('profile');
  expect(pending?.kind === 'profile' ? pending.profile.name : null).toBe('Shared account');
  expect(window.location.hash).toBe('');
  expect(useUiStore.getState().shareError).toBeNull();
});

test('reports an unreadable link instead of throwing', async () => {
  window.location.hash = '#c=not-a-real-code';
  expect(await consumeShareFragment()).toBe(true);
  expect(useUiStore.getState().pendingShare).toBeNull();
  expect(useUiStore.getState().shareError).toMatch(/could not be read/);
});
