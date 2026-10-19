/**
 * The profile menu at the right of the bar, left of the app menu (it replaces the old account icon): the
 * active profile's name, a person glyph while signed in, and a chevron that says "this is a list". It
 * opens on the profiles (the active one checked), then what can be done to one (new, rename, duplicate,
 * delete), the file actions (export and import JSON), the account rows (Sign in, or the account and Sign
 * out) and where the profile is saved. The dialogs those rows open live here too.
 */
import { Button, Group, TextInput } from '@mantine/core';
import { Check, ChevronDown, Copy, Download, Pencil, Plus, Trash2, Upload, UserRound } from 'lucide-react';
import { lazy, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useAccountStore } from '@/account/state';
import { version as gameData } from '@/data';
import { applyImport, exportProfileFile, parseImport } from '@/share/exportImport';
import type { ImportMode, ParsedImport } from '@/share/exportImport';
import { nextProfileName, uniqueProfileName } from '@/state/defaults';
import { selectActiveProfile, selectProfiles, useStore } from '@/state/store';

import { useAccountSection } from '../account/section';
import { AppMenu, Dialog, type AppMenuSection } from '../kit';
import { LazySurface } from '../lazy';
import { downloadJson } from '../profile/download';
import { ImportDialog } from '../profile/ImportDialog';
import { useUiStore } from '../uiStore';
import { saveStatus } from './state';

// The account surfaces drag in the PocketBase SDK and are opened once in a blue moon, so they are not
// in the first load (ui-foundation plan §6).
const AccountDialogs = lazy(() =>
  import('../account/AccountDialogs').then((module) => ({ default: module.AccountDialogs })),
);

const ICON = 15;

type DialogKind = 'new' | 'rename' | 'duplicate' | 'delete';

interface ImportState {
  parsed: ParsedImport | null;
  error: string | null;
}

const EMPTY_IMPORT: ImportState = { parsed: null, error: null };

/** One name, one field: New, Rename and Duplicate all ask the same question. */
function NameDialog({
  title,
  description,
  confirmLabel,
  initialName,
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  confirmLabel: string;
  initialName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const confirm = (): void => {
    if (trimmed !== '') onConfirm(trimmed);
  };

  return (
    <Dialog
      opened
      onClose={onCancel}
      title={title}
      size="sm"
      {...(description === undefined ? {} : { description })}
      footer={
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={trimmed === ''} onClick={confirm}>
            {confirmLabel}
          </Button>
        </Group>
      }
    >
      <TextInput
        label="Profile name"
        data-autofocus
        value={name}
        onChange={(event) => {
          setName(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') confirm();
        }}
      />
    </Dialog>
  );
}

/** The profile menu and every dialog it opens. Rendered by the app bar, nowhere else. */
export function ProfileMenu() {
  const profiles = useStore(selectProfiles);
  const profile = useStore(selectActiveProfile);
  const setActiveProfile = useStore((state) => state.setActiveProfile);
  const createProfile = useStore((state) => state.createProfile);
  const duplicateProfile = useStore((state) => state.duplicateProfile);
  const renameProfile = useStore((state) => state.renameProfile);
  const deleteProfile = useStore((state) => state.deleteProfile);
  const dirty = useUiStore((state) => state.dirty);
  const enabled = useAccountStore((state) => state.enabled);
  const user = useAccountStore((state) => state.user);
  const syncState = useAccountStore((state) => state.syncState);
  const accountDialog = useAccountStore((state) => state.dialog);
  const accountSection = useAccountSection();
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [importState, setImportState] = useState<ImportState>(EMPTY_IMPORT);
  const fileInput = useRef<HTMLInputElement>(null);

  if (profile === undefined) return null;

  const close = (): void => {
    setDialog(null);
  };

  const signedIn = enabled && user !== null;
  const status = saveStatus({ dirty, account: signedIn ? syncState : 'signed-out' });
  const who = signedIn ? `signed in as ${user.email === '' ? 'your account' : user.email}` : 'signed out';

  const readFile = (file: File): void => {
    void file
      .text()
      .then((json) => {
        setImportState({ parsed: parseImport(json), error: null });
      })
      .catch((error: unknown) => {
        setImportState({
          parsed: null,
          error: error instanceof Error ? error.message : 'This file could not be read.',
        });
      });
  };

  const applyFile = (mode: ImportMode): void => {
    if (importState.parsed) applyImport(useStore, importState.parsed, mode);
    setImportState(EMPTY_IMPORT);
  };

  const sections: AppMenuSection[] = [
    {
      id: 'profiles',
      title: 'Profiles',
      entries: profiles.map((entry) => ({
        id: entry.id,
        label: entry.name,
        checked: entry.id === profile.id,
        ...(entry.id === profile.id ? { icon: <Check size={ICON} aria-hidden /> } : {}),
        onSelect: () => {
          setActiveProfile(entry.id);
        },
      })),
    },
    {
      id: 'actions',
      entries: [
        {
          id: 'rename',
          label: 'Rename profile',
          icon: <Pencil size={ICON} aria-hidden />,
          onSelect: () => {
            setDialog('rename');
          },
        },
        {
          id: 'new',
          label: 'New profile',
          icon: <Plus size={ICON} aria-hidden />,
          onSelect: () => {
            setDialog('new');
          },
        },
        {
          id: 'duplicate',
          label: 'Duplicate profile',
          icon: <Copy size={ICON} aria-hidden />,
          onSelect: () => {
            setDialog('duplicate');
          },
        },
        {
          id: 'delete',
          label: 'Delete profile',
          icon: <Trash2 size={ICON} aria-hidden />,
          danger: true,
          onSelect: () => {
            setDialog('delete');
          },
        },
      ],
    },
    {
      id: 'data',
      entries: [
        {
          id: 'export',
          label: 'Export JSON',
          icon: <Download size={ICON} aria-hidden />,
          onSelect: () => {
            downloadJson(exportProfileFile(profile, gameData.dataVersion));
          },
        },
        {
          id: 'import',
          label: 'Import JSON',
          icon: <Upload size={ICON} aria-hidden />,
          onSelect: () => {
            fileInput.current?.click();
          },
        },
      ],
    },
    ...(accountSection === null ? [] : [accountSection]),
    { id: 'sync', entries: [{ kind: 'note' as const, id: 'sync-status', label: status }] },
  ];

  const nameDialog = (): ReactNode => {
    if (dialog === 'new') {
      return (
        <NameDialog
          title="New profile"
          description="A profile is one game account: its tiers, mercenaries and bonus values."
          confirmLabel="Create"
          initialName={nextProfileName(profiles.map((candidate) => candidate.name))}
          onCancel={close}
          onConfirm={(name) => {
            createProfile(name);
            close();
          }}
        />
      );
    }
    if (dialog === 'rename') {
      return (
        <NameDialog
          title="Rename profile"
          confirmLabel="Save"
          initialName={profile.name}
          onCancel={close}
          onConfirm={(name) => {
            renameProfile(profile.id, name);
            close();
          }}
        />
      );
    }
    if (dialog === 'duplicate') {
      return (
        <NameDialog
          title="Duplicate profile"
          description="The copy gets its own identity, so editing it never touches the original."
          confirmLabel="Duplicate"
          initialName={uniqueProfileName(
            profile.name,
            profiles.map((candidate) => candidate.name),
            'copy',
          )}
          onCancel={close}
          onConfirm={(name) => {
            duplicateProfile(profile.id, name);
            close();
          }}
        />
      );
    }
    return null;
  };

  return (
    <>
      <AppMenu
        label="Profiles and account"
        width={260}
        sections={sections}
        trigger={
          <Button
            variant="default"
            radius="xl"
            size="compact-md"
            h={36}
            maw={{ base: 140, sm: 220 }}
            data-state={signedIn ? 'signed-in' : 'signed-out'}
            leftSection={signedIn ? <UserRound size={16} aria-hidden /> : undefined}
            rightSection={<ChevronDown size={16} aria-hidden />}
            aria-label={`Profile: ${profile.name}${enabled ? `, ${who}` : ''}, ${status}`}
            styles={{ label: { overflow: 'hidden', textOverflow: 'ellipsis' } }}
          >
            {profile.name}
          </Button>
        }
      />

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        aria-label="Pyrrhic export file"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) readFile(file);
        }}
      />

      {nameDialog()}

      <Dialog
        role="alertdialog"
        opened={dialog === 'delete'}
        onClose={close}
        title="Delete profile"
        size="sm"
        description={`“${profile.name}” and everything in it will be removed from this browser. Export it first if you might want it back.`}
        footer={
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={() => {
                deleteProfile(profile.id);
                close();
              }}
            >
              Delete profile
            </Button>
          </Group>
        }
      />

      <LazySurface isOpen={accountDialog !== null}>
        <AccountDialogs />
      </LazySurface>

      <ImportDialog
        parsed={importState.parsed}
        error={importState.error}
        onApply={applyFile}
        onClose={() => {
          setImportState(EMPTY_IMPORT);
        }}
      />
    </>
  );
}
