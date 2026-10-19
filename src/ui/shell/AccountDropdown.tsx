/**
 * The account as a control of its own at the right of the bar (B-17): an icon and a status dot, at every
 * width, so it stays within reach of a thumb on a phone (design rule 18) and never wraps or hides.
 *
 * Signed in: a person with a dot that says how the save stands. Signed out: a cloud with a line through
 * it and a muted dot. The state is drawn and spoken both: the button's name carries it, because an icon
 * alone tells a screen reader nothing (rule 24).
 *
 * The dropdown opens on the quick profile switcher, the active profile checked and named in the header,
 * then the account rows (Sign in, or the account and Sign out), then where the profile is saved.
 */
import { ActionIcon, Indicator } from '@mantine/core';
import { Check, CloudOff, UserRound } from 'lucide-react';

import { useAccountStore } from '@/account/state';
import { selectActiveProfile, selectProfiles, useStore } from '@/state/store';

import { useAccountSection } from '../account/section';
import { AppMenu, type AppMenuSection } from '../kit';
import { useUiStore } from '../uiStore';
import { saveStatus } from './state';

const ICON = 15;

type SyncState = 'saved' | 'saving' | 'offline' | 'error';

/** The dot's colour: quiet when all is saved, a warning when it is not. */
function dotColour(state: 'none' | 'signed-out' | SyncState): string {
  if (state === 'signed-out' || state === 'none') return 'gray';
  if (state === 'error') return 'red';
  if (state === 'offline' || state === 'saving') return 'yellow';
  return 'teal';
}

export function AccountDropdown() {
  const profiles = useStore(selectProfiles);
  const profile = useStore(selectActiveProfile);
  const setActiveProfile = useStore((state) => state.setActiveProfile);
  const dirty = useUiStore((state) => state.dirty);
  const enabled = useAccountStore((state) => state.enabled);
  const user = useAccountStore((state) => state.user);
  const syncState = useAccountStore((state) => state.syncState);
  const accountSection = useAccountSection();

  if (profile === undefined) return null;

  const signedIn = enabled && user !== null;
  const account = enabled ? (user === null ? 'signed-out' : syncState) : null;
  const status = saveStatus({ dirty, account });
  const state = signedIn ? 'signed-in' : 'signed-out';
  const who = signedIn ? `signed in as ${user.email === '' ? 'your account' : user.email}` : 'signed out';

  const sections: AppMenuSection[] = [
    {
      id: 'profiles',
      title: profile.name,
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
    ...(accountSection === null ? [] : [accountSection]),
    { id: 'sync', entries: [{ kind: 'note', id: 'sync-status', label: status }] },
  ];

  return (
    <AppMenu
      label="Profiles and account"
      width={260}
      sections={sections}
      trigger={
        <ActionIcon
          variant="default"
          radius="xl"
          size={36}
          data-state={state}
          aria-label={`Profiles and account: ${enabled ? `${who}, ` : ''}${status}`}
        >
          <Indicator
            color={dotColour(account ?? 'none')}
            size={8}
            offset={-1}
            position="top-end"
            disabled={account === null}
            withBorder
          >
            {signedIn || !enabled ? (
              <UserRound size={18} aria-hidden />
            ) : (
              <CloudOff size={18} aria-hidden />
            )}
          </Indicator>
        </ActionIcon>
      }
    />
  );
}
