/**
 * The app menu at the far right of the bar: the pool line and theme preferences, install and update, and
 * About. Profiles, files and the account live in the profile menu beside it. None of it takes permanent
 * space (design rule 15), and it is the slot where navigation links go once there are pages.
 *
 * The menu itself is kit's `AppMenu`, so the shell cannot invent a shape: every row is an action,
 * a segmented row or a section heading, and each kind has one appearance.
 */
import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { Download, Info, Menu, RefreshCw } from 'lucide-react';
import { lazy, useState, useSyncExternalStore } from 'react';

import { isInstallAvailable, promptInstall, subscribeToInstall } from '@/pwa/install';
import { applyUpdate, isUpdateReady, subscribeToUpdate } from '@/pwa/register';
import { POOL_LINE_DEFAULTS, THEMES, type PoolLineDefault, type Theme } from '@/state/schema';
import { selectActiveProfile, selectTheme, useStore } from '@/state/store';

import { AppMenu, type AppMenuEntry, type AppMenuSection } from '../kit';
import { LazySurface } from '../lazy';

// About drags in the data notes and is opened
// once in a blue moon, so it is not in the first load (ui-foundation plan §6).
const AboutDialog = lazy(() => import('../AboutDialog').then((module) => ({ default: module.AboutDialog })));

type DialogKind = 'about';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/**
 * **Pool line on Generate** (`docs/plans/burn-ceiling.md` §3.1): which hired pools a Generate opens with their
 * pool-line rule on — the push or the round, whichever the player last switched on. One setting, four words, set
 * once and then forgotten like the theme beside it (design rule 15: preferences live in this menu).
 */
const POOL_LINE_OPTIONS: { value: PoolLineDefault; label: string }[] = [
  { value: 'both', label: 'Both' },
  { value: 'mercs', label: 'Mercs' },
  { value: 'monsters', label: 'Monsters' },
  { value: 'neither', label: 'Neither' },
];

function isPoolLineDefault(value: string): value is PoolLineDefault {
  return (POOL_LINE_DEFAULTS as readonly string[]).includes(value);
}

const ICON = 15;

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

/** The main menu and every dialog it opens. Rendered by the app bar, nowhere else. */
export function MainMenu() {
  const profile = useStore(selectActiveProfile);
  const theme = useStore(selectTheme);
  const setTheme = useStore((state) => state.setTheme);
  const updateProfile = useStore((state) => state.updateProfile);
  const { setColorScheme } = useMantineColorScheme();

  const installable = useSyncExternalStore(subscribeToInstall, isInstallAvailable, () => false);
  const updateReady = useSyncExternalStore(subscribeToUpdate, isUpdateReady, () => false);

  const [dialog, setDialog] = useState<DialogKind | null>(null);

  if (profile === undefined) return null;

  const close = (): void => {
    setDialog(null);
  };

  const appEntries: AppMenuEntry[] = [
    ...(installable
      ? [
          {
            id: 'install',
            label: 'Install app',
            description: 'Keeps working offline',
            icon: <Download size={ICON} aria-hidden />,
            onSelect: () => {
              void promptInstall();
            },
          } satisfies AppMenuEntry,
        ]
      : []),
    ...(updateReady
      ? [
          {
            id: 'update',
            label: 'Update available',
            description: 'Reload to get the new version',
            icon: <RefreshCw size={ICON} aria-hidden />,
            onSelect: applyUpdate,
          } satisfies AppMenuEntry,
        ]
      : []),
    {
      id: 'about',
      label: 'About Pyrrhic',
      icon: <Info size={ICON} aria-hidden />,
      onSelect: () => {
        setDialog('about');
      },
    },
  ];

  // The order of design plan §5.2: who you are and whether it is saved, who else you are, what you
  // can do to this profile, the file actions, the link, the theme, and About at the bottom.
  const sections: AppMenuSection[] = [
    {
      id: 'theme',
      entries: [
        {
          kind: 'segment',
          id: 'pool-line',
          label: 'Pool line on Generate',
          value: profile.settings.poolLine,
          options: POOL_LINE_OPTIONS,
          onChange: (next) => {
            if (!isPoolLineDefault(next)) return;
            updateProfile(profile.id, (current) => ({ settings: { ...current.settings, poolLine: next } }));
          },
        },
        {
          kind: 'segment',
          id: 'theme',
          label: 'Theme',
          value: theme,
          options: THEME_OPTIONS,
          onChange: (next) => {
            if (!isTheme(next)) return;
            setTheme(next);
            // The store writes `data-theme`; this tells Mantine the same thing, so its own colour
            // scheme cannot drift from ours (theme.ts, "the two attributes kept in step").
            setColorScheme(next === 'system' ? 'auto' : next);
          },
        },
      ],
    },
    { id: 'app', title: 'Pyrrhic', entries: appEntries },
  ];

  return (
    <>
      <AppMenu
        label="Menu"
        width={260}
        sections={sections}
        trigger={
          <ActionIcon variant="default" radius="xl" size={36} aria-label="Menu">
            <Menu size={18} aria-hidden />
          </ActionIcon>
        }
      />

      <LazySurface isOpen={dialog === 'about'}>
        <AboutDialog
          open={dialog === 'about'}
          onOpenChange={(open) => {
            if (!open) close();
          }}
        />
      </LazySurface>
    </>
  );
}
