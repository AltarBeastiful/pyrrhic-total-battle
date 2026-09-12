/**
 * One conflict, both versions side by side (S-44). Investigation 0001: never auto-merge silently — show
 * the name, the date, the device that wrote it and the counts, then let the user choose. "Keep both"
 * keeps mine under its own identity and adds theirs as a new profile, so nothing is ever lost by accident.
 */
import { useEffect, useState } from 'react';

import type { Profile } from '@/state/schema';
import type { ConflictChoice, SyncPlanEntry } from '@/sync/engine';

import { Banner, Button, Card, Dialog } from '../kit';
import { formatWhen } from './format';

export interface ConflictDialogProps {
  /** The conflicting entry, or `null` when no conflict is open. */
  entry: SyncPlanEntry | null;
  /** Downloads the gist's version so its counts can be shown before deciding. */
  fetchRemote: (id: string) => Promise<Profile | null>;
  onChoose: (choice: ConflictChoice) => void;
  onClose: () => void;
}

function Side({
  title,
  name,
  updatedAt,
  device,
  setups,
  stacks,
  missing,
  loading = false,
}: {
  title: string;
  name: string;
  updatedAt: number | undefined;
  device: string | undefined;
  setups: number | undefined;
  stacks: number | undefined;
  missing?: string;
  loading?: boolean;
}) {
  return (
    <Card tone="sunken" padding="sm">
      <p className="text-muted text-xs font-medium tracking-wide uppercase">{title}</p>
      {missing === undefined ? (
        <dl className="mt-2 space-y-1 text-sm">
          <div className="font-medium">{name}</div>
          <div className="text-muted text-xs">Changed {formatWhen(updatedAt)}</div>
          <div className="text-muted text-xs">
            On {device === undefined || device === '' ? 'an unnamed device' : device}
          </div>
          <div className="text-muted text-xs">
            {loading ? (
              'Reading the gist…'
            ) : (
              <>
                {setups ?? 0} battle setup{setups === 1 ? '' : 's'} · {stacks ?? 0} saved stack
                {stacks === 1 ? '' : 's'}
              </>
            )}
          </div>
        </dl>
      ) : (
        <p className="text-muted mt-2 text-sm">{missing}</p>
      )}
    </Card>
  );
}

export function ConflictDialog({ entry, fetchRemote, onChoose, onClose }: ConflictDialogProps) {
  // Keyed by profile id rather than reset in the effect: no synchronous setState, no stale counts.
  const [loaded, setLoaded] = useState<{ id: string; profile: Profile | null } | null>(null);
  const id = entry?.id ?? null;
  const kind = entry?.conflict ?? 'both-edited';

  useEffect(() => {
    if (id === null || kind === 'remote-deleted') return;
    let live = true;
    void fetchRemote(id).then((profile) => {
      if (live) setLoaded({ id, profile });
    });
    return () => {
      live = false;
    };
  }, [id, kind, fetchRemote]);

  const theirs = loaded !== null && loaded.id === id ? loaded.profile : null;
  const loading = id !== null && kind !== 'remote-deleted' && loaded?.id !== id;

  if (entry === null) return null;

  const mineLabel =
    kind === 'local-deleted' ? 'Keep mine (delete it there too)' : 'Keep mine (overwrite the gist)';
  const theirsLabel =
    kind === 'remote-deleted' ? 'Keep theirs (delete it here)' : 'Keep theirs (replace what is here)';

  return (
    <Dialog
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Conflict: ${entry.name}`}
      description={entry.reason}
      size="lg"
      footer={
        <>
          <Button onPress={onClose}>Cancel</Button>
          <Button
            onPress={() => {
              onChoose('mine');
            }}
          >
            {mineLabel}
          </Button>
          <Button
            onPress={() => {
              onChoose('theirs');
            }}
          >
            {theirsLabel}
          </Button>
          {kind === 'both-edited' && (
            <Button
              variant="primary"
              onPress={() => {
                onChoose('both');
              }}
            >
              Keep both
            </Button>
          )}
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Side
          title="On this device"
          name={entry.local?.name ?? entry.name}
          updatedAt={entry.local?.updatedAt}
          device={undefined}
          setups={entry.local?.setups}
          stacks={entry.local?.savedStacks}
          {...(entry.local === null ? { missing: 'Deleted on this device.' } : {})}
        />
        <Side
          title="In the gist"
          name={entry.remote?.name ?? entry.name}
          updatedAt={entry.remote?.updatedAt}
          device={entry.remote?.deviceName}
          setups={theirs?.setups.length}
          stacks={theirs?.savedStacks.length}
          loading={loading}
          {...(entry.remote === null ? { missing: 'Deleted on another device.' } : {})}
        />
      </div>
      {kind === 'both-edited' && (
        <Banner tone="info" className="mt-3">
          Keep both leaves your version where it is and adds the gist's version as a new profile, which is
          sent to the gist on the next sync.
        </Banner>
      )}
    </Dialog>
  );
}
