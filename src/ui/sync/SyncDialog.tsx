/**
 * Sync settings and the explicit Pull / Push panel (S-44, S-45).
 *
 * Two tabs: what to contact (a GitHub token, one secret gist, optional encryption) and what would happen
 * (one line per profile with its local and remote revision, when it was last synced, and the planned
 * action). Nothing is sent or applied until the user presses a button, and a conflict always opens the
 * per-profile dialog first.
 */
import { useState } from 'react';

import { useStore } from '@/state/store';
import type { SyncAction, SyncPlanEntry } from '@/sync/engine';
import { TOKEN_PAGE } from '@/sync/gist';
import { useSyncStore } from '@/sync/syncStore';

import { Badge, Banner, Button, Card, Dialog, Switch, Tabs, TextField } from '../kit';
import { Cluster, Stack } from '../layout';
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

/** The badge tone that says what would happen to a profile, so colour is never the only cue. */
const ACTION_TONE: Record<SyncAction, 'accent' | 'ok' | 'warn' | 'danger' | 'neutral'> = {
  push: 'accent',
  pull: 'ok',
  conflict: 'warn',
  'delete-remote': 'danger',
  'delete-local': 'danger',
  'in-sync': 'neutral',
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
    <Stack gap={4}>
      <Banner tone="info">
        Your profile JSON is stored in a secret gist on your GitHub account; nothing else is contacted. The
        token stays in this browser and is only ever sent to api.github.com, in the request header.
      </Banner>

      <TextField
        label="GitHub token"
        type="password"
        autoComplete="off"
        value={settings.token}
        placeholder="github_pat_…"
        onChange={(token) => {
          setSettings({ token });
        }}
        description={
          <>
            Create a{' '}
            <a className="underline" href={TOKEN_PAGE} target="_blank" rel="noreferrer noopener">
              fine-grained token
            </a>{' '}
            with one permission: <strong>Account permissions → Gists: Read and write</strong>. No repository
            access is needed.
          </>
        }
      />

      <Cluster gap={2}>
        <Button
          onPress={() => {
            void sync.testConnection();
          }}
          isDisabled={!sync.ready || sync.status !== 'idle'}
        >
          {sync.status === 'testing' ? 'Testing…' : 'Test connection'}
        </Button>
        <Button variant="quiet" onPress={sync.forget}>
          Forget token and sync state
        </Button>
      </Cluster>

      <TextField
        label="Gist id"
        autoComplete="off"
        value={settings.gistId}
        placeholder="created on the first push"
        onChange={(gistId) => {
          setSettings({ gistId });
        }}
        description="Filled in automatically. Clear it to let the app find or create the pyrrhic-sync gist again."
      />

      <Stack gap={2}>
        <Switch
          label="Encrypt the gist"
          description="AES-GCM with a key derived from a passphrase. GitHub then stores ciphertext only."
          isSelected={settings.encrypt}
          onChange={(encrypt) => {
            setSettings({ encrypt });
          }}
        />
        {settings.encrypt && (
          <>
            <TextField
              label="Passphrase"
              type="password"
              value={passphrase}
              autoComplete="new-password"
              onChange={setPassphrase}
              description="Kept for this tab only, never written to disk and never sent anywhere."
            />
            <Banner tone="warn">
              There is no recovery: without this passphrase the gist cannot be read, on any device. Profiles
              already in the gist stay in clear until each one is sent again.
            </Banner>
          </>
        )}
      </Stack>

      <TextField
        label="Device name"
        autoComplete="off"
        value={deviceName}
        placeholder="Rémi's phone"
        onChange={setDeviceName}
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
    <li className="flex flex-wrap items-start justify-between gap-2 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium">{entry.name}</p>
        <p className="text-muted text-xs">{entry.reason}</p>
        <p className="text-muted text-xs">
          Here:{' '}
          {entry.local === null
            ? 'deleted'
            : `rev ${String(entry.local.rev)} · ${formatWhen(entry.local.updatedAt)}`}
          {' — '}
          Gist:{' '}
          {entry.remote === null
            ? 'deleted'
            : `rev ${String(entry.remote.docRev)} · ${formatWhen(entry.remote.updatedAt)}`}
        </p>
        <p className="text-muted text-xs">
          {entry.lastSynced === null ? 'Never synced.' : `Last synced ${formatWhen(entry.lastSynced.at)}.`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge tone={ACTION_TONE[entry.action]}>{ACTION_LABEL[entry.action]}</Badge>
        {entry.action === 'conflict' && (
          <Button size="sm" variant={choice === undefined ? 'primary' : 'secondary'} onPress={onResolve}>
            {choice === undefined ? `Resolve ${entry.name}` : `Will ${CHOICE_LABEL[choice]}`}
          </Button>
        )}
      </div>
    </li>
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
    <Stack gap={3}>
      {!sync.ready && <Banner tone="warn">Add a GitHub token in Settings first.</Banner>}

      <Cluster gap={2}>
        <Button
          variant="primary"
          isDisabled={!sync.ready || sync.status !== 'idle'}
          onPress={() => {
            void sync.check();
          }}
        >
          {sync.status === 'checking' ? 'Checking…' : sync.plan === null ? 'Check the gist' : 'Check again'}
        </Button>
        <Button
          isDisabled={sync.plan === null || todo === 0 || sync.status !== 'idle'}
          onPress={() => {
            void sync.run();
          }}
        >
          {sync.status === 'applying' ? 'Syncing…' : 'Apply plan'}
        </Button>
        {counts !== undefined && (
          <span className="text-muted text-xs">
            {counts.push} to send · {counts.pull} to receive · {counts.conflict} conflict
            {counts.conflict === 1 ? '' : 's'}
          </span>
        )}
      </Cluster>

      {sync.error !== null && <Banner tone="danger">{sync.error}</Banner>}
      {sync.notice !== null && <Banner tone="info">{sync.notice}</Banner>}

      {sync.plan !== null && (
        <ul className="divide-line divide-y" aria-label="Sync plan">
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
          {entries.length === 0 && <li className="text-muted py-2 text-sm">Nothing on either side yet.</li>}
        </ul>
      )}

      {sync.results !== null && sync.results.length > 0 && (
        <Card tone="sunken" padding="sm">
          <p className="text-sm font-medium">Last run</p>
          <ul className="text-muted mt-1 space-y-1 text-xs">
            {sync.results.map((result) => (
              <li key={result.id}>
                {result.name}: {ACTION_LABEL[result.action].toLowerCase()} — {result.status}
                {result.message === undefined ? '' : ` (${result.message})`}
              </li>
            ))}
          </ul>
        </Card>
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

/** Two arrows chasing each other; inline SVG like the rest of the icons (ADR-0002: no icon font). */
export function SyncIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      width="1.15em"
      height="1.15em"
    >
      <path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5M4 13a8 8 0 0 0 13.7 4.7l2.3-2.2M4 4v4.5h4.5M20 20v-4.5h-4.5" />
    </svg>
  );
}

export function SyncDialog({ open, onOpenChange }: SyncDialogProps) {
  // A device that has no token lands on Settings; a configured one lands on the plan.
  const [tab, setTab] = useState(() =>
    useSyncStore.getState().settings.token.trim() === '' ? 'settings' : 'sync',
  );
  const sync = useSync();

  return (
    <Dialog
      isOpen={open}
      onOpenChange={onOpenChange}
      title="Sync across devices"
      description="Explicit Pull and Push through one secret GitHub gist. Nothing is sent automatically."
      size="lg"
    >
      <Tabs
        value={tab}
        onChange={setTab}
        label="Sync"
        items={[
          { value: 'sync', label: 'Pull / Push', content: <SyncPanel sync={sync} /> },
          { value: 'settings', label: 'Settings', content: <SettingsPanel sync={sync} /> },
        ]}
      />
    </Dialog>
  );
}
