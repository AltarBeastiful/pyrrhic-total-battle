// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newProfile, newRoot } from '@/state/defaults';
import { SCHEMA_VERSION, type Profile } from '@/state/schema';
import { useStore } from '@/state/store';
import { DEFAULT_SETTINGS, useSyncStore } from '@/sync/syncStore';

import { SyncDialog } from './SyncDialog';

interface FakeFiles {
  [name: string]: { content: string };
}

/** A gist server with one gist, enough for the dialog's GET + PATCH round trips. */
function fakeGist(files: FakeFiles) {
  const state: FakeFiles = { ...files };
  const patches: Record<string, { content: string } | null>[] = [];
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (init?.method === 'PATCH') {
      const body = JSON.parse(String(init.body)) as { files: Record<string, { content: string } | null> };
      patches.push(body.files);
      for (const [name, file] of Object.entries(body.files)) {
        if (file === null) delete state[name];
        else state[name] = file;
      }
    }
    if (url.includes('/user')) {
      return Promise.resolve(new Response(JSON.stringify({ login: 'remi' }), { status: 200 }));
    }
    return Promise.resolve(
      new Response(JSON.stringify({ id: 'gist1', description: 'pyrrhic-sync', files: state }), {
        status: 200,
      }),
    );
  });
  return { fetchMock, state, patches };
}

function indexFile(profiles: unknown[]): { content: string } {
  return {
    content: JSON.stringify({ pyrrhic: 'sync', version: 1, body: { profiles, tombstones: [] } }),
  };
}

function profileFile(profile: Profile): { content: string } {
  return {
    content: JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      dataVersion: 1,
      kind: 'profile',
      payload: profile,
    }),
  };
}

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot('This device'));
  useSyncStore.setState({ settings: { ...DEFAULT_SETTINGS }, records: {}, passphrase: '' });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const openDialog = (): void => {
  render(<SyncDialog open onOpenChange={() => undefined} />);
};

test('the settings tab stores the token, the gist id and the encryption choice', () => {
  openDialog();
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Settings' }));

  fireEvent.change(screen.getByLabelText('GitHub token'), { target: { value: 'github_pat_123' } });
  fireEvent.change(screen.getByLabelText('Gist id'), { target: { value: 'gist1' } });
  fireEvent.click(screen.getByRole('switch', { name: 'Encrypt the gist' }));
  fireEvent.change(screen.getByLabelText('Passphrase'), { target: { value: 'correct horse' } });
  fireEvent.change(screen.getByLabelText('Device name'), { target: { value: "Rémi's phone" } });

  const { settings, passphrase } = useSyncStore.getState();
  expect(settings).toEqual({ adapter: 'gist', token: 'github_pat_123', gistId: 'gist1', encrypt: true });
  expect(passphrase).toBe('correct horse');
  expect(useStore.getState().doc.deviceName).toBe("Rémi's phone");
  // The token is persisted outside the synced document, never inside it.
  expect(JSON.stringify(useStore.getState().doc)).not.toContain('github_pat_123');
  expect(globalThis.localStorage.getItem('pyrrhic.sync.v1')).toContain('github_pat_123');
  // And the passphrase is session-only.
  expect(globalThis.localStorage.getItem('pyrrhic.sync.v1')).not.toContain('correct horse');
  expect(globalThis.sessionStorage.getItem('pyrrhic.sync.passphrase')).toBe('correct horse');
});

test('the panel explains what is contacted and refuses to work without a token', () => {
  openDialog();
  expect(screen.getByText(/stored in a secret gist on your GitHub account/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Test connection' })).toHaveProperty('disabled', true);
});

test('checking the gist lists what would be sent and received', async () => {
  const theirs = newProfile('From the desktop', 'desktop-device');
  const { fetchMock } = fakeGist({
    'index.json': indexFile([
      {
        id: theirs.id,
        rev: 3,
        docRev: 2,
        updatedAt: theirs.updatedAt,
        name: theirs.name,
        deviceName: 'Desktop',
      },
    ]),
    [`profile-${theirs.id}.json`]: profileFile(theirs),
  });
  vi.stubGlobal('fetch', fetchMock);
  useSyncStore.getState().setSettings({ token: 'github_pat_123', gistId: 'gist1' });

  openDialog();
  fireEvent.click(screen.getByRole('button', { name: 'Check the gist' }));

  const list = await screen.findByRole('list', { name: 'Sync plan' });
  await waitFor(() => {
    expect(within(list).getByText('From the desktop')).toBeTruthy();
  });
  expect(within(list).getByText('Receive')).toBeTruthy();
  expect(within(list).getByText('Send')).toBeTruthy();
  expect(within(list).getByText('Only in the gist.')).toBeTruthy();
  expect(screen.getByText(/1 to send · 1 to receive · 0 conflicts/)).toBeTruthy();
});

test('a conflict opens the per-profile dialog and "keep theirs" replaces the local profile', async () => {
  const local = useStore.getState().doc.profiles[0];
  if (local === undefined) throw new Error('no profile');
  useStore.getState().renameProfile(local.id, 'My name');
  const mine = useStore.getState().doc.profiles[0];
  if (mine === undefined) throw new Error('no profile');

  const theirs: Profile = { ...mine, name: 'Their name', rev: 9, updatedAt: mine.updatedAt + 1000 };
  const { fetchMock } = fakeGist({
    'index.json': indexFile([
      {
        id: mine.id,
        rev: 4,
        docRev: 9,
        updatedAt: theirs.updatedAt,
        name: 'Their name',
        deviceName: 'Desktop',
      },
    ]),
    [`profile-${mine.id}.json`]: profileFile(theirs),
  });
  vi.stubGlobal('fetch', fetchMock);
  useSyncStore.getState().setSettings({ token: 'github_pat_123', gistId: 'gist1' });
  // Last sync saw an older revision on both sides: both changed since, so this is a conflict.
  useSyncStore.getState().setRecords({ [mine.id]: { rev: mine.rev - 1, remoteRev: 3, at: 1 } });

  openDialog();
  fireEvent.click(screen.getByRole('button', { name: 'Check the gist' }));

  const resolve = await screen.findByRole('button', { name: 'Resolve My name' });
  expect(screen.getByText('Conflict')).toBeTruthy();
  fireEvent.click(resolve);

  const conflict = await screen.findByRole('dialog', { name: /Conflict: My name/ });
  expect(within(conflict).getByText('My name')).toBeTruthy();
  expect(within(conflict).getByText('Their name')).toBeTruthy();
  expect(within(conflict).getByText(/Desktop/)).toBeTruthy();
  fireEvent.click(within(conflict).getByRole('button', { name: /Keep theirs/ }));

  const apply = await screen.findByRole('button', { name: 'Apply plan' });
  fireEvent.click(apply);

  await waitFor(() => {
    expect(useStore.getState().doc.profiles[0]?.name).toBe('Their name');
  });
  expect(useSyncStore.getState().records[mine.id]?.remoteRev).toBe(4);
});
