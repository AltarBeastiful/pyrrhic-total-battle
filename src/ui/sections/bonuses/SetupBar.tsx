/**
 * Battle setups (S-18). A setup is one march: which sources are switched on, plus the housing, the
 * enemy and the method the other cards edit. The profile keeps the values, the setup only keeps the
 * selection, so switching setups never makes you retype a bonus.
 *
 * It sits at the top of the unfolded card because it decides what every switch below means.
 */
import { ActionIcon, Button, Group, Select, TextInput } from '@mantine/core';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { BattleSetup, Profile } from '@/state/schema';
import { useStore } from '@/state/store';
import { Dialog } from '@/ui/kit';

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
      opened
      title={kind === 'new' ? 'New battle setup' : 'Rename battle setup'}
      description={
        kind === 'new'
          ? 'It starts as a copy of the setup you are on, so you only change what differs.'
          : 'Name it after the march it describes, for example “Arachne’s, solo”.'
      }
      onClose={onCancel}
      footer={
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={trimmed === ''}
            onClick={() => {
              onConfirm(trimmed);
            }}
          >
            {kind === 'new' ? 'Create' : 'Save'}
          </Button>
        </Group>
      }
    >
      <TextInput
        label="Setup name"
        value={name}
        onChange={(event) => {
          setName(event.currentTarget.value);
        }}
      />
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
    <Group gap="xs" align="flex-end" wrap="wrap">
      <Select
        label="Battle setup"
        data={profile.setups.map((entry) => ({ value: entry.id, label: entry.name }))}
        value={setup.id}
        allowDeselect={false}
        // On a phone the name takes the whole first line and the four actions ride together on the
        // second (the owner's phone review, 2026-09-13: three of them fitted beside the select and
        // the bin fell through on its own). From the medium window the row is one line again.
        flex={{ base: '1 1 100%', sm: '1 1 12rem' }}
        miw={0}
        onChange={(next) => {
          if (next !== null) setActiveSetup(next);
        }}
      />
      <ActionIcon
        size="lg"
        variant="default"
        aria-label="New battle setup"
        onClick={() => {
          setDialog('new');
        }}
      >
        <Plus size={16} aria-hidden />
      </ActionIcon>
      <ActionIcon
        size="lg"
        variant="default"
        aria-label="Rename battle setup"
        onClick={() => {
          setDialog('rename');
        }}
      >
        <Pencil size={16} aria-hidden />
      </ActionIcon>
      <ActionIcon
        size="lg"
        variant="default"
        aria-label="Duplicate battle setup"
        onClick={() => {
          duplicateSetup(setup.id);
        }}
      >
        <Copy size={16} aria-hidden />
      </ActionIcon>
      <ActionIcon
        size="lg"
        variant="default"
        aria-label="Delete battle setup"
        disabled={profile.setups.length <= 1}
        onClick={() => {
          setDialog('delete');
        }}
      >
        <Trash2 size={16} aria-hidden />
      </ActionIcon>

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
          opened
          role="alertdialog"
          title="Delete battle setup"
          description={`“${setup.name}” will be removed. The values you typed stay on your profile.`}
          onClose={close}
          footer={
            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={close}>
                Cancel
              </Button>
              <Button
                color="danger"
                onClick={() => {
                  deleteSetup(setup.id);
                  close();
                }}
              >
                Delete setup
              </Button>
            </Group>
          }
        />
      )}
    </Group>
  );
}
