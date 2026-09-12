import { useRef, useState } from 'react';

import { version as gameData } from '@/data';
import { applyImport, exportProfileFile, parseImport } from '@/share/exportImport';
import type { ImportMode, ParsedImport } from '@/share/exportImport';
import { selectActiveProfile, selectActiveSetup, selectProfiles, useStore } from '@/state/store';

import {
  DownloadIcon,
  DuplicateIcon,
  PencilIcon,
  PlusIcon,
  ShareIcon,
  TrashIcon,
  UploadIcon,
} from '../icons';
import { Button, Dialog, Select } from '../primitives';
import { useResultStore } from '../resultStore';
import { useUiStore } from '../uiStore';
import { downloadJson } from './download';
import { ImportDialog } from './ImportDialog';
import { NameDialog } from './NameDialog';
import { ShareDialog } from './ShareDialog';

type DialogKind = 'new' | 'rename' | 'duplicate' | 'delete' | 'share';

interface ImportState {
  parsed: ParsedImport | null;
  error: string | null;
}

const EMPTY_IMPORT: ImportState = { parsed: null, error: null };

function SaveIndicator() {
  const dirty = useUiStore((state) => state.dirty);
  const lastSavedAt = useUiStore((state) => state.lastSavedAt);
  const label = dirty
    ? 'Unsaved changes'
    : lastSavedAt === null
      ? 'Saved in this browser'
      : `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return (
    <span className="text-muted flex items-center gap-1.5 text-xs" aria-live="polite">
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 rounded-full ${dirty ? 'bg-warn' : 'bg-ok'}`}
      />
      {label}
    </span>
  );
}

/**
 * The profile bar (S-10): switch account, create/duplicate/rename/delete, export and import a JSON
 * file, and open the share dialog. Everything it writes goes through the store's actions, so the
 * sync metadata is stamped in one place.
 */
export function ProfileBar() {
  const profiles = useStore(selectProfiles);
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const createProfile = useStore((state) => state.createProfile);
  const duplicateProfile = useStore((state) => state.duplicateProfile);
  const renameProfile = useStore((state) => state.renameProfile);
  const deleteProfile = useStore((state) => state.deleteProfile);
  const setActiveProfile = useStore((state) => state.setActiveProfile);
  const result = useResultStore((state) => state.last);

  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [importState, setImportState] = useState<ImportState>(EMPTY_IMPORT);
  const fileInput = useRef<HTMLInputElement>(null);

  if (!profile) return null;
  const close = (): void => {
    setDialog(null);
  };

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

  const apply = (mode: ImportMode): void => {
    if (importState.parsed) applyImport(useStore, importState.parsed, mode);
    setImportState(EMPTY_IMPORT);
  };

  return (
    <div className="border-line bg-surface sticky top-0 z-30 border-b">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
        <div className="min-w-40 flex-1">
          <Select
            label="Active profile"
            value={profile.id}
            onValueChange={setActiveProfile}
            options={profiles.map((entry) => ({ value: entry.id, label: entry.name }))}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Button
            aria-label="New profile"
            icon={<PlusIcon />}
            onClick={() => {
              setDialog('new');
            }}
          >
            <span className="hidden sm:inline">New</span>
          </Button>
          <Button
            aria-label="Duplicate profile"
            icon={<DuplicateIcon />}
            onClick={() => {
              setDialog('duplicate');
            }}
          >
            <span className="hidden sm:inline">Duplicate</span>
          </Button>
          <Button
            aria-label="Rename profile"
            icon={<PencilIcon />}
            onClick={() => {
              setDialog('rename');
            }}
          >
            <span className="hidden sm:inline">Rename</span>
          </Button>
          <Button
            aria-label="Delete profile"
            icon={<TrashIcon />}
            onClick={() => {
              setDialog('delete');
            }}
          >
            <span className="hidden sm:inline">Delete</span>
          </Button>
          <Button
            aria-label="Export profile"
            icon={<DownloadIcon />}
            onClick={() => {
              downloadJson(exportProfileFile(profile, gameData.dataVersion));
            }}
          >
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            aria-label="Import a file"
            icon={<UploadIcon />}
            onClick={() => {
              fileInput.current?.click();
            }}
          >
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button
            variant="primary"
            aria-label="Share profile or march"
            icon={<ShareIcon />}
            onClick={() => {
              setDialog('share');
            }}
          >
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>

        <SaveIndicator />
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        aria-label="Pyrrhic export file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) readFile(file);
        }}
      />

      <NameDialog
        open={dialog === 'new'}
        title="New profile"
        description="A profile is one game account: its tiers, mercenaries and bonus values."
        confirmLabel="Create"
        initialName={`Account ${String(profiles.length + 1)}`}
        onCancel={close}
        onConfirm={(name) => {
          createProfile(name);
          close();
        }}
      />
      <NameDialog
        open={dialog === 'rename'}
        title="Rename profile"
        confirmLabel="Save"
        initialName={profile.name}
        onCancel={close}
        onConfirm={(name) => {
          renameProfile(profile.id, name);
          close();
        }}
      />
      <NameDialog
        open={dialog === 'duplicate'}
        title="Duplicate profile"
        description="The copy gets its own identity, so editing it never touches the original."
        confirmLabel="Duplicate"
        initialName={`${profile.name} (copy)`}
        onCancel={close}
        onConfirm={(name) => {
          duplicateProfile(profile.id, name);
          close();
        }}
      />

      <DeleteDialog
        open={dialog === 'delete'}
        name={profile.name}
        onCancel={close}
        onConfirm={() => {
          deleteProfile(profile.id);
          close();
        }}
      />

      <ShareDialog
        open={dialog === 'share'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        profile={profile}
        setup={setup}
        result={result}
      />

      <ImportDialog
        parsed={importState.parsed}
        error={importState.error}
        onApply={apply}
        onClose={() => {
          setImportState(EMPTY_IMPORT);
        }}
      />
    </div>
  );
}

function DeleteDialog({
  open,
  name,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title="Delete profile"
      description={`"${name}" and everything in it will be removed from this browser. Export it first if you might want it back.`}
      size="sm"
      footer={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete profile
          </Button>
        </>
      }
    />
  );
}
