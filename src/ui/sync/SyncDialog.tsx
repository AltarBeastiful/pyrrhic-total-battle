/**
 * Sync settings and the explicit Pull / Push panel (S-44, S-45).
 *
 * Two tabs: what to contact (a GitHub token, one secret gist, optional encryption) and what would happen
 * (one line per profile with its local and remote revision, when it was last synced, and the planned
 * action). Nothing is sent or applied until the user presses a button, and a conflict always opens the
 * per-profile dialog first.
 */
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { useStore } from '@/state/store';
import type { SyncAction, SyncPlanEntry } from '@/sync/engine';
import { TOKEN_PAGE } from '@/sync/gist';
import { useSyncStore } from '@/sync/syncStore';

import { Button, Dialog, HelpNote, Tabs, Toggle } from '../primitives';
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

const ACTION_CLASS: Record<SyncAction, string> = {
  push: 'bg-accent/15 text-fg',
  pull: 'bg-ok/15 text-fg',
  conflict: 'bg-warn/20 text-fg',
  'delete-remote': 'bg-danger/15 text-fg',
  'delete-local': 'bg-danger/15 text-fg',
  'in-sync': 'bg-raised text-muted',
};

const CHOICE_LABEL = {
  mine: 'keep mine',
  theirs: 'keep theirs',
  both: 'keep both',
} as const;

const INPUT_CLASS =
  'tap border-line bg-surface text-fg w-full rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50';

/** A labelled text input; the shared primitives only cover numbers and selects. */
function Field({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  placeholder,
  autoComplete = 'off',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password';
  hint?: ReactNode;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={INPUT_CLASS}
        value={value}
        autoComplete={autoComplete}
        spellCheck={false}
        {...(hint === undefined ? {} : { 'aria-describedby': hintId })}
        {...(placeholder === undefined ? {} : { placeholder })}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      {hint !== undefined && (
        <p id={hintId} className="text-muted text-xs">
          {hint}
        </p>
      )}
    </div>
  );
}

function SettingsPanel({ sync }: { sync: ReturnType<typeof useSync> }) {
  const settings = useSyncStore((state) => state.settings);
  const passphrase = useSyncStore((state) => state.passphrase);
  const setSettings = useSyncStore((state) => state.setSettings);
  const setPassphrase = useSyncStore((state) => state.setPassphrase);
  const deviceName = useStore((state) => state.doc.deviceName);
  const setDeviceName = useStore((state) => state.setDeviceName);

  return (
    <div className="space-y-4">
      <HelpNote>
        Your profile JSON is stored in a secret gist on your GitHub account; nothing else is contacted. The
        token stays in this browser and is only ever sent to api.github.com, in the request header.
      </HelpNote>

      <Field
        label="GitHub token"
        type="password"
        value={settings.token}
        placeholder="github_pat_…"
        onChange={(token) => {
          setSettings({ token });
        }}
        hint={
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

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            void sync.testConnection();
          }}
          disabled={!sync.ready || sync.status !== 'idle'}
        >
          {sync.status === 'testing' ? 'Testing…' : 'Test connection'}
        </Button>
        <Button variant="ghost" onClick={sync.forget}>
          Forget token and sync state
        </Button>
      </div>

      <Field
        label="Gist id"
        value={settings.gistId}
        placeholder="created on the first push"
        onChange={(gistId) => {
          setSettings({ gistId });
        }}
        hint="Filled in automatically. Clear it to let the app find or create the pyrrhic-sync gist again."
      />

      <div className="space-y-2">
        <Toggle
          label="Encrypt the gist"
          description="AES-GCM with a key derived from a passphrase. GitHub then stores ciphertext only."
          checked={settings.encrypt}
          onChange={(encrypt) => {
            setSettings({ encrypt });
          }}
        />
        {settings.encrypt && (
          <>
            <Field
              label="Passphrase"
              type="password"
              value={passphrase}
              autoComplete="new-password"
              onChange={setPassphrase}
              hint="Kept for this tab only, never written to disk and never sent anywhere."
            />
            <HelpNote tone="warn">
              There is no recovery: without this passphrase the gist cannot be read, on any device. Profiles
              already in the gist stay in clear until each one is sent again.
            </HelpNote>
          </>
        )}
      </div>

      <Field
        label="Device name"
        value={deviceName}
        placeholder="Rémi's phone"
        onChange={setDeviceName}
        hint="Shown on your other devices when two versions of a profile disagree."
      />
    </div>
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
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_CLASS[entry.action]}`}>
          {ACTION_LABEL[entry.action]}
        </span>
        {entry.action === 'conflict' && (
          <Button size="sm" variant={choice === undefined ? 'primary' : 'secondary'} onClick={onResolve}>
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
    <div className="space-y-3">
      {!sync.ready && <HelpNote tone="warn">Add a GitHub token in Settings first.</HelpNote>}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          disabled={!sync.ready || sync.status !== 'idle'}
          onClick={() => {
            void sync.check();
          }}
        >
          {sync.status === 'checking' ? 'Checking…' : sync.plan === null ? 'Check the gist' : 'Check again'}
        </Button>
        <Button
          disabled={sync.plan === null || todo === 0 || sync.status !== 'idle'}
          onClick={() => {
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
      </div>

      {sync.error !== null && <HelpNote tone="danger">{sync.error}</HelpNote>}
      {sync.notice !== null && <HelpNote>{sync.notice}</HelpNote>}

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
        <div className="border-line rounded-lg border p-3">
          <p className="text-sm font-medium">Last run</p>
          <ul className="text-muted mt-1 space-y-1 text-xs">
            {sync.results.map((result) => (
              <li key={result.id}>
                {result.name}: {ACTION_LABEL[result.action].toLowerCase()} — {result.status}
                {result.message === undefined ? '' : ` (${result.message})`}
              </li>
            ))}
          </ul>
        </div>
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
    </div>
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
      open={open}
      onOpenChange={onOpenChange}
      title="Sync across devices"
      description="Explicit Pull and Push through one secret GitHub gist. Nothing is sent automatically."
      size="lg"
    >
      <Tabs
        value={tab}
        onValueChange={setTab}
        label="Sync"
        items={[
          { value: 'sync', label: 'Pull / Push', content: <SyncPanel sync={sync} /> },
          { value: 'settings', label: 'Settings', content: <SettingsPanel sync={sync} /> },
        ]}
      />
    </Dialog>
  );
}
