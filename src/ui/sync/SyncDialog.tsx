/**
 * Sync settings and the explicit Pull / Push panel (S-44, S-45).
 *
 * Two tabs: what to contact (a GitHub token, one secret gist, optional encryption) and what would happen
 * (one line per profile with its local and remote revision, when it was last synced, and the planned
 * action). Nothing is sent or applied until the user presses a button, and a conflict always opens the
 * per-profile dialog first.
 */
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { useState } from 'react';

import { useStore } from '@/state/store';
import type { SyncAction, SyncPlanEntry } from '@/sync/engine';
import { TOKEN_PAGE } from '@/sync/gist';
import { useSyncStore } from '@/sync/syncStore';

import { Dialog, SwitchRow } from '../kit';
import { ConflictDialog } from './ConflictDialog';
import { formatWhen } from './format';
import { useSync } from './useSync';

export interface SyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTION_LABEL: Record<SyncAction, string> = {
  push: 'Send',
  pull: 'Receive',
  conflict: 'Conflict',
  'delete-remote': 'Remove from the gist',
  'delete-local': 'Remove here',
  'in-sync': 'Up to date',
};

/** The badge colour that says what would happen to a profile, so colour is never the only cue. */
const ACTION_COLOR: Record<SyncAction, string> = {
  push: 'brass',
  pull: 'guardsmen',
  conflict: 'yellow',
  'delete-remote': 'danger',
  'delete-local': 'danger',
  'in-sync': 'slate',
};

const CHOICE_LABEL = {
  mine: 'keep mine',
  theirs: 'keep theirs',
  both: 'keep both',
} as const;

function SettingsPanel({ sync }: { sync: ReturnType<typeof useSync> }) {
  const settings = useSyncStore((state) => state.settings);
  const passphrase = useSyncStore((state) => state.passphrase);
  const setSettings = useSyncStore((state) => state.setSettings);
  const setPassphrase = useSyncStore((state) => state.setPassphrase);
  const deviceName = useStore((state) => state.doc.deviceName);
  const setDeviceName = useStore((state) => state.setDeviceName);

  return (
    <Stack gap="md">
      <Alert color="brass" variant="light">
        Your profile JSON is stored in a secret gist on your GitHub account; nothing else is contacted. The
        token stays in this browser and is only ever sent to api.github.com, in the request header.
      </Alert>

      <PasswordInput
        label="GitHub token"
        autoComplete="off"
        value={settings.token}
        placeholder="github_pat_…"
        onChange={(event) => {
          setSettings({ token: event.currentTarget.value });
        }}
        description={
          <>
            Create a{' '}
            <Anchor href={TOKEN_PAGE} target="_blank" rel="noreferrer noopener" inherit>
              fine-grained token
            </Anchor>{' '}
            with one permission: <strong>Account permissions → Gists: Read and write</strong>. No repository
            access is needed.
          </>
        }
      />

      <Group gap="sm">
        <Button
          variant="default"
          onClick={() => {
            void sync.testConnection();
          }}
          disabled={!sync.ready || sync.status !== 'idle'}
        >
          {sync.status === 'testing' ? 'Testing…' : 'Test connection'}
        </Button>
        <Button variant="subtle" onClick={sync.forget}>
          Forget token and sync state
        </Button>
      </Group>

      <TextInput
        label="Gist id"
        autoComplete="off"
        value={settings.gistId}
        placeholder="created on the first push"
        onChange={(event) => {
          setSettings({ gistId: event.currentTarget.value });
        }}
        description="Filled in automatically. Clear it to let the app find or create the pyrrhic-sync gist again."
      />

      <Stack gap="sm">
        <SwitchRow
          label="Encrypt the gist"
          description="AES-GCM with a key derived from a passphrase. GitHub then stores ciphertext only."
          checked={settings.encrypt}
          onChange={(encrypt) => {
            setSettings({ encrypt });
          }}
        />
        {settings.encrypt && (
          <>
            <PasswordInput
              label="Passphrase"
              value={passphrase}
              autoComplete="new-password"
              onChange={(event) => {
                setPassphrase(event.currentTarget.value);
              }}
              description="Kept for this tab only, never written to disk and never sent anywhere."
            />
            <Alert color="brass" variant="light">
              There is no recovery: without this passphrase the gist cannot be read, on any device. Profiles
              already in the gist stay in clear until each one is sent again.
            </Alert>
          </>
        )}
      </Stack>

      <TextInput
        label="Device name"
        autoComplete="off"
        value={deviceName}
        placeholder="Rémi's phone"
        onChange={(event) => {
          setDeviceName(event.currentTarget.value);
        }}
        description="Shown on your other devices when two versions of a profile disagree."
      />
    </Stack>
  );
}

function PlanRow({
  entry,
  choice,
  onResolve,
}: {
  entry: SyncPlanEntry;
  choice: 'mine' | 'theirs' | 'both' | undefined;
  onResolve: () => void;
}) {
  return (
    <Group
      component="li"
      justify="space-between"
      align="flex-start"
      gap="sm"
      py="xs"
      style={{ borderTop: '1px solid var(--pyr-hairline)' }}
    >
      <Stack gap={2} miw={0} style={{ flex: '1 1 12rem' }}>
        <Text size="sm" fw={500}>
          {entry.name}
        </Text>
        <Text size="xs" c="dimmed">
          {entry.reason}
        </Text>
        <Text size="xs" c="dimmed">
          Here:{' '}
          {entry.local === null
            ? 'deleted'
            : `rev ${String(entry.local.rev)} · ${formatWhen(entry.local.updatedAt)}`}
          {' — '}
          Gist:{' '}
          {entry.remote === null
            ? 'deleted'
            : `rev ${String(entry.remote.docRev)} · ${formatWhen(entry.remote.updatedAt)}`}
        </Text>
        <Text size="xs" c="dimmed">
          {entry.lastSynced === null ? 'Never synced.' : `Last synced ${formatWhen(entry.lastSynced.at)}.`}
        </Text>
      </Stack>
      <Group gap="sm" wrap="nowrap" style={{ flex: '0 0 auto' }}>
        <Badge color={ACTION_COLOR[entry.action]} variant="light">
          {ACTION_LABEL[entry.action]}
        </Badge>
        {entry.action === 'conflict' && (
          <Button size="compact-sm" variant={choice === undefined ? 'filled' : 'default'} onClick={onResolve}>
            {choice === undefined ? `Resolve ${entry.name}` : `Will ${CHOICE_LABEL[choice]}`}
          </Button>
        )}
      </Group>
    </Group>
  );
}

function SyncPanel({ sync }: { sync: ReturnType<typeof useSync> }) {
  const [conflictId, setConflictId] = useState<string | null>(null);
  const entries = sync.plan?.entries ?? [];
  const counts = sync.plan?.counts;
  const todo =
    counts === undefined
      ? 0
      : counts.push + counts.pull + counts['delete-local'] + counts['delete-remote'] + counts.conflict;
  const conflict = entries.find((entry) => entry.id === conflictId) ?? null;

  return (
    <Stack gap="md">
      {!sync.ready && (
        <Alert color="brass" variant="light">
          Add a GitHub token in Settings first.
        </Alert>
      )}

      <Group gap="sm">
        <Button
          disabled={!sync.ready || sync.status !== 'idle'}
          onClick={() => {
            void sync.check();
          }}
        >
          {sync.status === 'checking' ? 'Checking…' : sync.plan === null ? 'Check the gist' : 'Check again'}
        </Button>
        <Button
          variant="default"
          disabled={sync.plan === null || todo === 0 || sync.status !== 'idle'}
          onClick={() => {
            void sync.run();
          }}
        >
          {sync.status === 'applying' ? 'Syncing…' : 'Apply plan'}
        </Button>
        {counts !== undefined && (
          <Text size="xs" c="dimmed">
            {counts.push} to send · {counts.pull} to receive · {counts.conflict} conflict
            {counts.conflict === 1 ? '' : 's'}
          </Text>
        )}
      </Group>

      {sync.error !== null && (
        <Alert color="danger" variant="light">
          {sync.error}
        </Alert>
      )}
      {sync.notice !== null && (
        <Alert color="brass" variant="light">
          {sync.notice}
        </Alert>
      )}

      {sync.plan !== null && (
        <Stack component="ul" gap={0} aria-label="Sync plan" style={{ listStyle: 'none', padding: 0 }}>
          {entries.map((entry) => (
            <PlanRow
              key={entry.id}
              entry={entry}
              choice={sync.choices[entry.id]}
              onResolve={() => {
                setConflictId(entry.id);
              }}
            />
          ))}
          {entries.length === 0 && (
            <Text component="li" size="sm" c="dimmed" py="xs">
              Nothing on either side yet.
            </Text>
          )}
        </Stack>
      )}

      {sync.results !== null && sync.results.length > 0 && (
        <Paper bg="var(--pyr-sunken)" p="sm" radius="sm">
          <Text size="sm" fw={500}>
            Last run
          </Text>
          <Stack component="ul" gap={2} mt={4} style={{ listStyle: 'none', padding: 0 }}>
            {sync.results.map((result) => (
              <Text key={result.id} component="li" size="xs" c="dimmed">
                {result.name}: {ACTION_LABEL[result.action].toLowerCase()} — {result.status}
                {result.message === undefined ? '' : ` (${result.message})`}
              </Text>
            ))}
          </Stack>
        </Paper>
      )}

      <ConflictDialog
        entry={conflict}
        fetchRemote={sync.fetchRemote}
        onChoose={(choice) => {
          if (conflict !== null) sync.choose(conflict.id, choice);
          setConflictId(null);
        }}
        onClose={() => {
          setConflictId(null);
        }}
      />
    </Stack>
  );
}

export function SyncDialog({ open, onOpenChange }: SyncDialogProps) {
  // A device that has no token lands on Settings; a configured one lands on the plan.
  const [tab, setTab] = useState<string | null>(() =>
    useSyncStore.getState().settings.token.trim() === '' ? 'settings' : 'sync',
  );
  const sync = useSync();

  return (
    <Dialog
      opened={open}
      onClose={() => {
        onOpenChange(false);
      }}
      title="Sync across devices"
      description="Explicit Pull and Push through one secret GitHub gist. Nothing is sent automatically."
      size="lg"
    >
      <Tabs value={tab} onChange={setTab} keepMounted={false}>
        <Tabs.List aria-label="Sync">
          <Tabs.Tab value="sync">Pull / Push</Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="sync" pt="md">
          <SyncPanel sync={sync} />
        </Tabs.Panel>
        <Tabs.Panel value="settings" pt="md">
          <SettingsPanel sync={sync} />
        </Tabs.Panel>
      </Tabs>
    </Dialog>
  );
}
