/**
 * Battle setups (S-18). A setup is one march: which sources are switched on, plus the housing, the
 * enemy and the method the other cards edit. The profile keeps the values, the setup only keeps the
 * selection, so switching setups never makes you retype a bonus.
 *
 * It sits at the top of the unfolded card because it decides what every switch below means.
 */
import { useState } from 'react';

import type { BattleSetup, Profile } from '@/state/schema';
import { useStore } from '@/state/store';
import { Button, Dialog, IconButton, Select, TextField } from '@/ui/kit';
import { Cluster } from '@/ui/layout';

import { DuplicateIcon, PencilIcon, PlusIcon, TrashIcon } from '../../icons';

type SetupDialog = 'new' | 'rename' | 'delete';

function NameDialog({
  kind,
  initialName,
  onConfirm,
  onCancel,
}: {
  kind: 'new' | 'rename';
  initialName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();

  return (
    <Dialog
      isOpen
      title={kind === 'new' ? 'New battle setup' : 'Rename battle setup'}
      description={
        kind === 'new'
          ? 'It starts as a copy of the setup you are on, so you only change what differs.'
          : 'Name it after the march it describes, for example “Arachne’s, solo”.'
      }
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      footer={
        <>
          <Button onPress={onCancel}>Cancel</Button>
          <Button
            variant="primary"
            isDisabled={trimmed === ''}
            onPress={() => {
              onConfirm(trimmed);
            }}
          >
            {kind === 'new' ? 'Create' : 'Save'}
          </Button>
        </>
      }
    >
      <TextField label="Setup name" value={name} onChange={setName} />
    </Dialog>
  );
}

export function SetupBar({ profile, setup }: { profile: Profile; setup: BattleSetup }) {
  const setActiveSetup = useStore((state) => state.setActiveSetup);
  const duplicateSetup = useStore((state) => state.duplicateSetup);
  const renameSetup = useStore((state) => state.renameSetup);
  const deleteSetup = useStore((state) => state.deleteSetup);
  const [dialog, setDialog] = useState<SetupDialog | null>(null);

  const close = (): void => {
    setDialog(null);
  };

  return (
    <Cluster gap={2} align="end">
      <Select
        label="Battle setup"
        className="w-full sm:w-auto sm:min-w-40 sm:flex-1"
        value={setup.id}
        options={profile.setups.map((entry) => ({ value: entry.id, label: entry.name }))}
        onChange={setActiveSetup}
      />
      <IconButton
        variant="secondary"
        label="New battle setup"
        onPress={() => {
          setDialog('new');
        }}
      >
        <PlusIcon />
      </IconButton>
      <IconButton
        variant="secondary"
        label="Rename battle setup"
        onPress={() => {
          setDialog('rename');
        }}
      >
        <PencilIcon />
      </IconButton>
      <IconButton
        variant="secondary"
        label="Duplicate battle setup"
        onPress={() => {
          duplicateSetup(setup.id);
        }}
      >
        <DuplicateIcon />
      </IconButton>
      <IconButton
        variant="secondary"
        label="Delete battle setup"
        isDisabled={profile.setups.length <= 1}
        onPress={() => {
          setDialog('delete');
        }}
      >
        <TrashIcon />
      </IconButton>

      {dialog === 'new' && (
        <NameDialog
          kind="new"
          initialName={`Setup ${String(profile.setups.length + 1)}`}
          onCancel={close}
          onConfirm={(name) => {
            duplicateSetup(setup.id, name);
            close();
          }}
        />
      )}
      {dialog === 'rename' && (
        <NameDialog
          kind="rename"
          initialName={setup.name}
          onCancel={close}
          onConfirm={(name) => {
            renameSetup(setup.id, name);
            close();
          }}
        />
      )}
      {dialog === 'delete' && (
        <Dialog
          isOpen
          role="alertdialog"
          title="Delete battle setup"
          description={`“${setup.name}” will be removed. The values you typed stay on your profile.`}
          onOpenChange={(open) => {
            if (!open) close();
          }}
          footer={
            <>
              <Button onPress={close}>Cancel</Button>
              <Button
                variant="danger"
                onPress={() => {
                  deleteSetup(setup.id);
                  close();
                }}
              >
                Delete setup
              </Button>
            </>
          }
        />
      )}
    </Cluster>
  );
}
