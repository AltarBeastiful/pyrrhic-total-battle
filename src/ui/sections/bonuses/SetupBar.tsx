import { useId, useState } from 'react';

import type { BattleSetup, Profile } from '@/state/schema';
import { useStore } from '@/state/store';

import { DuplicateIcon, PencilIcon, PlusIcon, TrashIcon } from '../../icons';
import { Button, Dialog, HelpNote, NativeSelect } from '../../primitives';

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
    <div className="border-line bg-raised space-y-2 rounded-xl border p-3">
      <div className="flex flex-wrap items-end gap-2">
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
        <div className="flex flex-wrap items-center gap-1">
          <Button
            aria-label="New battle setup"
            icon={<PlusIcon />}
            onClick={() => {
              setDialog('new');
            }}
          >
            <span className="hidden sm:inline">New</span>
          </Button>
          <Button
            aria-label="Rename battle setup"
            icon={<PencilIcon />}
            onClick={() => {
              setDialog('rename');
            }}
          >
            <span className="hidden sm:inline">Rename</span>
          </Button>
          <Button
            aria-label="Duplicate battle setup"
            icon={<DuplicateIcon />}
            onClick={() => {
              duplicateSetup(setup.id);
            }}
          >
            <span className="hidden sm:inline">Duplicate</span>
          </Button>
          <Button
            aria-label="Delete battle setup"
            icon={<TrashIcon />}
            disabled={onlyOne}
            onClick={() => {
              setDialog('delete');
            }}
          >
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>
      <HelpNote>
        A setup is one march: the sources switched on below, plus the housing, enemy and method of the other
        sections. Everything you type stays on the profile, so a second setup only changes what is switched
        on.
      </HelpNote>

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
        description={`“${setup.name}” will be removed. The bonus values you typed stay on the profile.`}
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
    </div>
  );
}
