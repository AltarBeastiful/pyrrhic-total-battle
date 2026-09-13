/**
 * The three questions the account can ask (S-49b): sign in with an email, may I replace what is in
 * this browser, and the 409.
 *
 * The conflict one is the only interesting one. Both ways out lose something, so the dialog says
 * which, in words, and offers a JSON export first so that a player who picks the wrong one can get
 * their work back (spec §5.5). It is an `alertdialog`: no Escape, no click-outside — this is not a
 * question you walk away from with a save half-done.
 */
import { Alert, Button, Group, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useState } from 'react';

import { accountErrorMessage } from '@/account/client';
import { useAccountStore } from '@/account/state';
import { version as gameData } from '@/data';
import { exportProfileFile } from '@/share/exportImport';
import { selectActiveProfile, useStore } from '@/state/store';

import { Dialog, SwitchRow } from '../kit';
import { downloadJson } from '../profile/download';

/** "2026-09-13 04:26:09.794Z" is PocketBase's own format: shown as it comes, never parsed. */
function whenLine(updated: string): string {
  return updated === '' ? '' : updated.replace('T', ' ').replace(/\.\d+Z?$/, ' UTC');
}

/** The escape hatch offered before either lossy branch: this browser's active profile, as a file. */
function ExportFirstButton() {
  const profile = useStore(selectActiveProfile);
  if (profile === undefined) return null;
  return (
    <Button
      variant="default"
      onClick={() => {
        downloadJson(exportProfileFile(profile, gameData.dataVersion));
      }}
    >
      Export JSON first
    </Button>
  );
}

function SignInDialog() {
  const open = useAccountStore((state) => state.dialog) === 'signin';
  const busy = useAccountStore((state) => state.busy) !== 'none';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  const close = (): void => {
    useAccountStore.getState().setDialog(null);
    setPassword('');
    setError('');
  };

  const submit = (): void => {
    if (email.trim() === '' || password === '' || working) return;
    setWorking(true);
    setError('');
    void (async () => {
      try {
        const auth = await import('@/account/auth');
        const user = creating
          ? await auth.signUpWithPassword(email.trim(), password)
          : await auth.signInWithPassword(email.trim(), password);
        setPassword('');
        await useAccountStore.getState().adopt(user);
      } catch (cause) {
        setError(accountErrorMessage(cause));
      } finally {
        setWorking(false);
      }
    })();
  };

  return (
    <Dialog
      opened={open}
      onClose={close}
      title={creating ? 'Create an account' : 'Sign in with email'}
      size="sm"
      description="Your profiles stay in this browser; the account only holds the copy you choose to save."
      footer={
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={close}>
            Cancel
          </Button>
          <Button disabled={email.trim() === '' || password === '' || working || busy} onClick={submit}>
            {creating ? 'Create account' : 'Sign in'}
          </Button>
        </Group>
      }
    >
      <Stack gap="sm">
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          data-autofocus
          value={email}
          onChange={(event) => {
            setEmail(event.currentTarget.value);
          }}
        />
        <PasswordInput
          label="Password"
          autoComplete={creating ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => {
            setPassword(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
        />
        <SwitchRow
          label="Create account"
          description={creating ? 'At least 8 characters' : undefined}
          checked={creating}
          onChange={(next) => {
            setCreating(next);
            setError('');
          }}
        />
        {error !== '' && (
          <Alert color="danger" role="alert" variant="light">
            {error}
          </Alert>
        )}
      </Stack>
    </Dialog>
  );
}

function LoadDialog() {
  const open = useAccountStore((state) => state.dialog) === 'load';
  const pending = useAccountStore((state) => state.pending);
  const busy = useAccountStore((state) => state.busy) !== 'none';

  const when = pending === null ? '' : whenLine(pending.updated);

  return (
    <Dialog
      role="alertdialog"
      opened={open}
      onClose={() => {
        useAccountStore.getState().setDialog(null);
      }}
      title="Load from account"
      size="sm"
      description={
        pending === null
          ? 'Everything in this browser is replaced by the copy saved on your account. Changes made here since the last save are lost.'
          : `Your account holds a copy saved${when === '' ? '' : ` on ${when}`}. Loading it replaces everything in this browser, including changes made here since the last save.`
      }
      footer={
        <Group justify="flex-end" gap="sm">
          <ExportFirstButton />
          <Button
            variant="default"
            onClick={() => {
              useAccountStore.setState({ pending: null, dialog: null });
            }}
          >
            Keep this browser
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              void useAccountStore.getState().load();
            }}
          >
            Load from account
          </Button>
        </Group>
      }
    />
  );
}

function ConflictDialog() {
  const conflict = useAccountStore((state) => state.conflict);
  const open = useAccountStore((state) => state.dialog) === 'conflict' && conflict !== null;
  const busy = useAccountStore((state) => state.busy) !== 'none';
  const version = useAccountStore((state) => state.remoteVersion);

  const when = conflict === null ? '' : whenLine(conflict.updated);

  return (
    <Dialog
      role="alertdialog"
      opened={open}
      onClose={() => {
        useAccountStore.getState().setDialog(null);
      }}
      title="Saved on another device"
      size="sm"
      description={`Another device saved to this account${when === '' ? '' : ` on ${when}`}, after this browser last loaded it. Both ways out lose something — export first if you want to keep both.`}
      footer={
        <Group justify="flex-end" gap="sm" wrap="wrap">
          <ExportFirstButton />
          <Button
            variant="default"
            disabled={busy}
            onClick={() => {
              void useAccountStore.getState().resolveConflict('server');
            }}
          >
            Load the other device's copy
          </Button>
          <Button
            color="danger"
            disabled={busy}
            onClick={() => {
              void useAccountStore.getState().resolveConflict('device');
            }}
          >
            Overwrite with this device
          </Button>
        </Group>
      }
    >
      <Stack gap={4}>
        <Text size="sm">
          <Text span fw={600} inherit>
            Load the other device&rsquo;s copy
          </Text>{' '}
          — everything changed in this browser since version {version} is discarded.
        </Text>
        <Text size="sm">
          <Text span fw={600} inherit>
            Overwrite with this device
          </Text>{' '}
          — everything the other device saved (version {conflict?.serverVersion ?? 0}) is replaced by what is
          here.
        </Text>
      </Stack>
    </Dialog>
  );
}

/** Every account surface, mounted once by the account menu. Nothing is rendered until it opens. */
export function AccountDialogs() {
  return (
    <>
      <SignInDialog />
      <LoadDialog />
      <ConflictDialog />
    </>
  );
}
