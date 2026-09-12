/**
 * Everything that used to live in the profile bar, behind one control (design plan §5.2): the
 * profile and its name, the other profiles, the four profile actions, the two file actions and
 * sync, the share link, the theme, the offline rows the PWA used to float over the page, and About.
 *
 * None of it takes permanent space, which is the point: the strip it replaces was two rows of
 * chrome on every screen for actions a player uses once a month.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

import { version as gameData } from '@/data';
import { isInstallAvailable, promptInstall, subscribeToInstall } from '@/pwa/install';
import { applyUpdate, isUpdateReady, subscribeToUpdate } from '@/pwa/register';
import { buildBattleLink, buildProfileLink } from '@/share/codec';
import { applyImport, exportProfileFile, parseImport } from '@/share/exportImport';
import type { ImportMode, ParsedImport } from '@/share/exportImport';
import { THEMES, type Theme } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, selectProfiles, selectTheme, useStore } from '@/state/store';

import { AboutDialog } from '../AboutDialog';
import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  DuplicateIcon,
  InfoIcon,
  MoonIcon,
  PencilIcon,
  PlusIcon,
  ShareIcon,
  SunIcon,
  SyncIcon,
  TrashIcon,
  UploadIcon,
} from '../icons';
import { Badge, Button, Dialog, Menu, MenuItem, MenuSection, MenuSegment, TextField } from '../kit';
import { copyText, downloadJson } from '../profile/download';
import { ImportDialog } from '../profile/ImportDialog';
import { resultCounts, toSavedSummary, useResultStore } from '../resultStore';
import { SyncDialog } from '../sync/SyncDialog';
import { useUiStore } from '../uiStore';
import { saveStatus } from './state';

type DialogKind = 'new' | 'rename' | 'duplicate' | 'delete' | 'sync' | 'about';

interface ImportState {
  parsed: ParsedImport | null;
  error: string | null;
}

const EMPTY_IMPORT: ImportState = { parsed: null, error: null };

const THEME_OPTIONS: { value: Theme; label: string; icon?: ReactNode }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
];

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

/** The profile's initial on a coloured disc; decorative, the name beside it is the label. */
function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <span aria-hidden="true">
      <Badge tone="accent" size="md">
        {initial === '' ? '?' : initial}
      </Badge>
    </span>
  );
}

/** One name, one field: New, Rename and Duplicate all ask the same question. */
function NameDialog({
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
  description?: string;
  confirmLabel: string;
  initialName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();

  return (
    <Dialog
      isOpen={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title={title}
      {...(description === undefined ? {} : { description })}
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
            {confirmLabel}
          </Button>
        </>
      }
    >
      <TextField label="Profile name" value={name} onChange={setName} />
    </Dialog>
  );
}

/** The account menu and every dialog it opens. Rendered by `TopBar`, nowhere else. */
export function AccountMenu() {
  const profiles = useStore(selectProfiles);
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const theme = useStore(selectTheme);
  const setTheme = useStore((state) => state.setTheme);
  const createProfile = useStore((state) => state.createProfile);
  const duplicateProfile = useStore((state) => state.duplicateProfile);
  const renameProfile = useStore((state) => state.renameProfile);
  const deleteProfile = useStore((state) => state.deleteProfile);
  const setActiveProfile = useStore((state) => state.setActiveProfile);
  const result = useResultStore((state) => state.last);
  const dirty = useUiStore((state) => state.dirty);
  const conflict = useUiStore((state) => state.syncConflict);

  const installable = useSyncExternalStore(subscribeToInstall, isInstallAvailable, () => false);
  const updateReady = useSyncExternalStore(subscribeToUpdate, isUpdateReady, () => false);

  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [importState, setImportState] = useState<ImportState>(EMPTY_IMPORT);
  const [notice, setNotice] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  // The copy notice says what just happened and then gets out of the way.
  useEffect(() => {
    if (notice === '') return undefined;
    const timer = setTimeout(() => {
      setNotice('');
    }, 4000);
    return () => {
      clearTimeout(timer);
    };
  }, [notice]);

  if (profile === undefined) return null;

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

  const applyFile = (mode: ImportMode): void => {
    if (importState.parsed) applyImport(useStore, importState.parsed, mode);
    setImportState(EMPTY_IMPORT);
  };

  /**
   * The march when there is one, the account otherwise — a link to a result nobody generated would
   * be a link to nothing. The menu item says which of the two it is about to put on the clipboard.
   */
  const shareLink = (): Promise<string> => {
    const baseUrl = typeof window === 'undefined' ? '' : window.location.href;
    const options = { baseUrl, dataVersion: gameData.dataVersion };
    if (result !== null && setup !== undefined) {
      return buildBattleLink(setup, resultCounts(result.result), toSavedSummary(result.summary), options);
    }
    return buildProfileLink(profile, options);
  };

  const copyShareLink = (): void => {
    void shareLink()
      .then(copyText)
      .then((ok) => {
        setNotice(ok ? 'Copied' : 'The link could not be copied');
      })
      .catch(() => {
        setNotice('The link could not be built');
      });
  };

  const nameDialog = (): ReactNode => {
    if (dialog === 'new') {
      return (
        <NameDialog
          open
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
      );
    }
    if (dialog === 'rename') {
      return (
        <NameDialog
          open
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
          open
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
      );
    }
    return null;
  };

  return (
    <>
      <Menu
        label="Account"
        trigger={
          <Button
            aria-label={`Account: ${profile.name}`}
            icon={<Avatar name={profile.name} />}
            iconRight={<ChevronDownIcon />}
          >
            <span className="truncate">{profile.name}</span>
          </Button>
        }
      >
        <MenuSection title={profile.name}>
          <MenuItem
            id="rename"
            icon={<PencilIcon />}
            description={saveStatus({ dirty, conflict })}
            onAction={() => {
              setDialog('rename');
            }}
          >
            Rename profile
          </MenuItem>
        </MenuSection>

        <MenuSection title="Switch profile">
          {profiles.map((entry) => (
            <MenuItem
              key={entry.id}
              id={entry.id}
              textValue={entry.name}
              {...(entry.id === profile.id ? { icon: <CheckIcon /> } : {})}
              onAction={() => {
                setActiveProfile(entry.id);
              }}
            >
              {entry.name}
              {entry.id === profile.id ? <span className="sr-only"> (active)</span> : null}
            </MenuItem>
          ))}
        </MenuSection>

        <MenuSection title="This profile">
          <MenuItem
            id="new"
            icon={<PlusIcon />}
            onAction={() => {
              setDialog('new');
            }}
          >
            New profile
          </MenuItem>
          <MenuItem
            id="duplicate"
            icon={<DuplicateIcon />}
            onAction={() => {
              setDialog('duplicate');
            }}
          >
            Duplicate profile
          </MenuItem>
          <MenuItem
            id="delete"
            icon={<TrashIcon />}
            isDanger
            onAction={() => {
              setDialog('delete');
            }}
          >
            Delete profile
          </MenuItem>
        </MenuSection>

        <MenuSection title="Data">
          <MenuItem
            id="export"
            icon={<DownloadIcon />}
            onAction={() => {
              downloadJson(exportProfileFile(profile, gameData.dataVersion));
            }}
          >
            Export JSON
          </MenuItem>
          <MenuItem
            id="import"
            icon={<UploadIcon />}
            onAction={() => {
              fileInput.current?.click();
            }}
          >
            Import JSON
          </MenuItem>
          <MenuItem
            id="sync"
            icon={<SyncIcon />}
            description="Between your own devices"
            onAction={() => {
              setDialog('sync');
            }}
          >
            Sync…
          </MenuItem>
          <MenuItem
            id="share"
            icon={<ShareIcon />}
            description={result === null ? 'Link to this profile' : 'Link to the march you generated'}
            onAction={copyShareLink}
          >
            Share this march
          </MenuItem>
        </MenuSection>

        <MenuSegment
          label="Theme"
          value={theme}
          onChange={(next) => {
            if (isTheme(next)) setTheme(next);
          }}
          options={THEME_OPTIONS}
        />

        <MenuSection title="Pyrrhic">
          {installable ? (
            <MenuItem
              id="install"
              icon={<DownloadIcon />}
              description="Keeps working offline"
              onAction={() => {
                void promptInstall();
              }}
            >
              Install app
            </MenuItem>
          ) : null}
          {updateReady ? (
            <MenuItem
              id="update"
              icon={<SyncIcon />}
              description="Reload to get the new version"
              onAction={applyUpdate}
            >
              Update available
            </MenuItem>
          ) : null}
          <MenuItem
            id="about"
            icon={<InfoIcon />}
            onAction={() => {
              setDialog('about');
            }}
          >
            About Pyrrhic
          </MenuItem>
        </MenuSection>
      </Menu>

      <span role="status">{notice === '' ? null : <Badge tone="ok">{notice}</Badge>}</span>

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

      {nameDialog()}

      <Dialog
        role="alertdialog"
        isOpen={dialog === 'delete'}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title="Delete profile"
        description={`"${profile.name}" and everything in it will be removed from this browser. Export it first if you might want it back.`}
        footer={
          <>
            <Button onPress={close}>Cancel</Button>
            <Button
              variant="danger"
              onPress={() => {
                deleteProfile(profile.id);
                close();
              }}
            >
              Delete profile
            </Button>
          </>
        }
      />

      <SyncDialog
        open={dialog === 'sync'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      />

      <AboutDialog
        open={dialog === 'about'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      />

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
