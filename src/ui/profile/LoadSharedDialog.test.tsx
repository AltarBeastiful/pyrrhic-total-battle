// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import type { SharePayload } from '@/share/codec';
import { newProfile, newRoot } from '@/state/defaults';
import { SCHEMA_VERSION } from '@/state/schema';
import { useStore } from '@/state/store';

import { LoadSharedDialog } from './LoadSharedDialog';

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

const names = () => useStore.getState().doc.profiles.map((profile) => profile.name);

function sharedProfile(name: string): SharePayload {
  return {
    kind: 'profile',
    schemaVersion: SCHEMA_VERSION,
    dataVersion: 1,
    profile: newProfile(name, 'other-device'),
  };
}

test('adds a shared profile under a name that is not already taken', () => {
  const state = useStore.getState();
  state.renameProfile(state.doc.activeProfileId, 'Alpha');

  render(<LoadSharedDialog payload={sharedProfile('Alpha')} error={null} onClose={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add as new profile' }));

  expect(names()).toEqual(['Alpha', 'Alpha (imported)']);
});

test('keeps the shared name when nothing collides', () => {
  render(<LoadSharedDialog payload={sharedProfile('From a friend')} error={null} onClose={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add as new profile' }));

  expect(names()).toEqual(['My account', 'From a friend']);
});
