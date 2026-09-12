import { useId, useState } from 'react';

import type { BattleSetup, Profile } from '@/state/schema';
import { useStore } from '@/state/store';

import { DuplicateIcon, PencilIcon, PlusIcon, TrashIcon } from '../../icons';
import { Button, Card, Dialog, IconButton, NativeSelect, Tooltip } from '../../primitives';
import { BlockGlyph } from './glyphs';

type SetupDialog = 'new' | 'rename' | 'delete';

/** A single-field dialog for New and Rename; Enter confirms. */
function SetupNameDialog({
  open,
  title,
  description,
  confirmLabel,
  initialName,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  initialName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const fieldId = useId();
  const [name, setName] = useState(initialName);
  const [seed, setSeed] = useState(initialName);

  if (seed !== initialName) {
    setSeed(initialName);
    setName(initialName);
  }
  const trimmed = name.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title={title}
      description={description}
      size="sm"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed !== '') onConfirm(trimmed);
        }}
      >
        <label className="text-muted text-xs font-medium" htmlFor={fieldId}>
          Setup name
        </label>
        <input
          id={fieldId}
          autoFocus
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          className="tap border-field bg-surface text-fg mt-1 w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
        />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={trimmed === ''}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/**
 * Battle setups (S-18). A setup is one march: which sources are switched on, plus the housing, enemy
 * and method the other sections edit. The profile keeps the values; the setup only keeps the selection,
 * so switching setups never makes you retype a bonus.
 *
 * It sits on its own raised card above the sources, because it decides what every chip below means.
 */
export function SetupBar({ profile, setup }: { profile: Profile; setup: BattleSetup }) {
  const setActiveSetup = useStore((state) => state.setActiveSetup);
  const duplicateSetup = useStore((state) => state.duplicateSetup);
  const renameSetup = useStore((state) => state.renameSetup);
  const deleteSetup = useStore((state) => state.deleteSetup);
  const [dialog, setDialog] = useState<SetupDialog | null>(null);

  const close = (): void => {
    setDialog(null);
  };
  const onlyOne = profile.setups.length <= 1;

  return (
    <Card tone="raised" className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <span
          aria-hidden="true"
          className="border-accent-line bg-accent-soft text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
        >
          <BlockGlyph name="setup" />
        </span>
        <div className="min-w-40 flex-1">
          <NativeSelect
            label="Battle setup"
            hideLabel={false}
            value={setup.id}
            options={profile.setups.map((entry) => ({ value: entry.id, label: entry.name }))}
            onChange={(event) => {
              setActiveSetup(event.target.value);
            }}
          />
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content="New battle setup">
            <IconButton
              variant="secondary"
              label="New battle setup"
              icon={<PlusIcon />}
              onClick={() => {
                setDialog('new');
              }}
            />
          </Tooltip>
          <Tooltip content="Rename battle setup">
            <IconButton
              variant="secondary"
              label="Rename battle setup"
              icon={<PencilIcon />}
              onClick={() => {
                setDialog('rename');
              }}
            />
          </Tooltip>
          <Tooltip content="Duplicate battle setup">
            <IconButton
              variant="secondary"
              label="Duplicate battle setup"
              icon={<DuplicateIcon />}
              onClick={() => {
                duplicateSetup(setup.id);
              }}
            />
          </Tooltip>
          <Tooltip content="Delete battle setup">
            <IconButton
              variant="secondary"
              label="Delete battle setup"
              icon={<TrashIcon />}
              disabled={onlyOne}
              onClick={() => {
                setDialog('delete');
              }}
            />
          </Tooltip>
        </div>
      </div>
      <p className="text-muted text-xs">
        A setup is one march. Your values stay on the profile, so a second setup only changes which sources
        are switched on.
      </p>

      <SetupNameDialog
        open={dialog === 'new'}
        title="New battle setup"
        description="It starts as a copy of the setup you are on, so you only change what differs."
        confirmLabel="Create"
        initialName={`Setup ${String(profile.setups.length + 1)}`}
        onCancel={close}
        onConfirm={(name) => {
          duplicateSetup(setup.id, name);
          close();
        }}
      />
      <SetupNameDialog
        open={dialog === 'rename'}
        title="Rename battle setup"
        description="Name it after the march it describes, for example “Arachne's, solo”."
        confirmLabel="Save"
        initialName={setup.name}
        onCancel={close}
        onConfirm={(name) => {
          renameSetup(setup.id, name);
          close();
        }}
      />
      <Dialog
        open={dialog === 'delete'}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title="Delete battle setup"
        description={`“${setup.name}” will be removed. The values you typed stay on your profile.`}
        size="sm"
        footer={
          <>
            <Button onClick={close}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteSetup(setup.id);
                close();
              }}
            >
              Delete setup
            </Button>
          </>
        }
      />
    </Card>
  );
}
