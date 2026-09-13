/**
 * Everything the account asks in a modal (S-49b): sign in or create an account, the forgotten
 * password, what the account itself offers, may I replace what is in this browser, the 409, a new
 * password, and leaving for good.
 *
 * The conflict one is the only interesting one. Both ways out lose something, so the dialog says
 * which, in words, and offers a JSON export first so that a player who picks the wrong one can get
 * their work back (spec §5.5). It is an `alertdialog`: no Escape, no click-outside — this is not a
 * question you walk away from with a save half-done. Deleting the account is the other one.
 *
 * Every panel that can fail ends in a sentence saying what happened and what to do next, and none of
 * them says "Submit" (design rules 25 and 26).
 */
import { Alert, Anchor, Button, Group, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useState } from 'react';

import { accountErrorMessage } from '@/account/client';
import { useAccountStore } from '@/account/state';
import type { AccountUser } from '@/account/schema';
import { version as gameData } from '@/data';
import { exportProfileFile } from '@/share/exportImport';
import { selectActiveProfile, useStore } from '@/state/store';

import { Dialog, SwitchRow } from '../kit';
import { downloadJson } from '../profile/download';

/** Kept in step with the `users` collection's own floor (the hardening migration sets 10). */
const PASSWORD_MIN = 10;

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

/** One sentence, and — when the address is the problem — the button that does something about it. */
function ErrorPanel({ message, onResend }: { message: string; onResend?: (() => void) | undefined }) {
  if (message === '') return null;
  return (
    <Alert color="danger" role="alert" variant="light">
      <Stack gap="xs" align="flex-start">
        <Text size="sm">{message}</Text>
        {onResend !== undefined && (
          <Button size="compact-sm" variant="default" onClick={onResend}>
            Resend the email
          </Button>
        )}
      </Stack>
    </Alert>
  );
}

/** Which panel the one email dialog is showing. */
type SignInView = 'form' | 'forgot' | 'forgot-sent' | 'created';

function SignInDialog() {
  const open = useAccountStore((state) => state.dialog) === 'signin';
  const busy = useAccountStore((state) => state.busy) !== 'none';
  const [view, setView] = useState<SignInView>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [working, setWorking] = useState(false);
  const [created, setCreated] = useState<AccountUser | null>(null);

  const close = (): void => {
    useAccountStore.getState().setDialog(null);
    setPassword('');
    setError('');
    setUnconfirmed(false);
    setView('form');
    setCreated(null);
    // An account is created once; the next time this dialog opens it is to sign in, not to make a
    // second account. Leaving the switch on is how a returning player meets "email already in use".
    setCreating(false);
  };

  /** Whatever went wrong, said once — and remembered when it is the address that is unconfirmed. */
  const fail = (cause: unknown): void => {
    setError(accountErrorMessage(cause));
    setUnconfirmed(
      typeof cause === 'object' && cause !== null && (cause as { kind?: unknown }).kind === 'unverified',
    );
  };

  const submit = (): void => {
    if (email.trim() === '' || password === '' || working) return;
    setWorking(true);
    setError('');
    setUnconfirmed(false);
    void (async () => {
      try {
        const auth = await import('@/account/auth');
        if (creating) {
          // The account exists and this browser is signed into it, but nothing can be saved until
          // the address is confirmed — so the dialog says that before it gets out of the way.
          const user = await auth.signUpWithPassword(email.trim(), password);
          setPassword('');
          setCreated(user);
          setView('created');
          return;
        }
        const user = await auth.signInWithPassword(email.trim(), password);
        setPassword('');
        await useAccountStore.getState().adopt(user);
      } catch (cause) {
        fail(cause);
      } finally {
        setWorking(false);
      }
    })();
  };

  const sendReset = (): void => {
    if (email.trim() === '' || working) return;
    setWorking(true);
    setError('');
    void (async () => {
      try {
        const { requestPasswordReset } = await import('@/account/auth');
        await requestPasswordReset(email.trim());
        setView('forgot-sent');
      } catch (cause) {
        fail(cause);
      } finally {
        setWorking(false);
      }
    })();
  };

  const resend = (): void => {
    if (email.trim() === '' || working) return;
    setWorking(true);
    void (async () => {
      try {
        const { resendVerification } = await import('@/account/auth');
        await resendVerification(email.trim());
        setError('A confirmation email is on its way. Open its link, then sign in.');
        setUnconfirmed(false);
      } catch (cause) {
        fail(cause);
      } finally {
        setWorking(false);
      }
    })();
  };

  if (view === 'created') {
    return (
      <Dialog
        opened={open}
        onClose={close}
        title="Account created"
        size="sm"
        description="Check your inbox to confirm your address. Until it is confirmed, your profiles cannot be saved to the account — everything in this browser keeps working as it always has."
        footer={
          <Group justify="flex-end" gap="sm">
            <Button
              onClick={() => {
                const user = created;
                close();
                if (user !== null) void useAccountStore.getState().adopt(user);
              }}
            >
              Continue
            </Button>
          </Group>
        }
      />
    );
  }

  if (view === 'forgot-sent') {
    return (
      <Dialog
        opened={open}
        onClose={close}
        title="Reset your password"
        size="sm"
        description="If an account exists for this address, a reset link is on its way. The link works once and expires in 30 minutes."
        footer={
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => {
                setView('form');
              }}
            >
              Back to sign in
            </Button>
            <Button onClick={close}>Done</Button>
          </Group>
        }
      />
    );
  }

  if (view === 'forgot') {
    return (
      <Dialog
        opened={open}
        onClose={close}
        title="Reset your password"
        size="sm"
        description="We send a link that lets you choose a new password. Your profiles in this browser are not touched."
        footer={
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => {
                setView('form');
                setError('');
              }}
            >
              Back to sign in
            </Button>
            <Button disabled={email.trim() === '' || working} onClick={sendReset}>
              Send the reset link
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
            onKeyDown={(event) => {
              if (event.key === 'Enter') sendReset();
            }}
          />
          <ErrorPanel message={error} />
        </Stack>
      </Dialog>
    );
  }

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
          description={creating ? `At least ${String(PASSWORD_MIN)} characters` : undefined}
          checked={creating}
          onChange={(next) => {
            setCreating(next);
            setError('');
            setUnconfirmed(false);
          }}
        />
        {!creating && (
          <Anchor
            component="button"
            type="button"
            size="sm"
            onClick={() => {
              setView('forgot');
              setError('');
              setUnconfirmed(false);
            }}
          >
            Forgot your password?
          </Anchor>
        )}
        <ErrorPanel message={error} onResend={unconfirmed ? resend : undefined} />
      </Stack>
    </Dialog>
  );
}

/**
 * What the row naming the account leads to. It holds the two errands that would otherwise be two
 * more menu rows — and a menu taller than the window has rows nobody can press. One dialog is open
 * at a time, so choosing one of these *replaces* this one rather than stacking on it.
 */
function YourAccountDialog() {
  const open = useAccountStore((state) => state.dialog) === 'account';
  const user = useAccountStore((state) => state.user);
  const busy = useAccountStore((state) => state.busy) !== 'none';

  const close = (): void => {
    useAccountStore.getState().setDialog(null);
  };

  return (
    <Dialog
      opened={open && user !== null}
      onClose={close}
      title="Your account"
      size="sm"
      description={
        user === null || user.email === ''
          ? 'This account holds one copy of your profiles, and nothing else.'
          : `Signed in as ${user.email}. The account holds one copy of your profiles, and nothing else.`
      }
      footer={
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            Close
          </Button>
        </Group>
      }
    >
      <Stack gap="sm" align="stretch">
        <Button
          variant="default"
          disabled={busy}
          onClick={() => {
            useAccountStore.getState().setDialog('password');
          }}
        >
          Change password…
        </Button>
        <Button
          variant="default"
          color="danger"
          disabled={busy}
          onClick={() => {
            useAccountStore.getState().setDialog('delete');
          }}
        >
          Delete account…
        </Button>
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

/**
 * A new password, typed twice, with the current one. PocketBase revokes every session of the account
 * as it changes, so the store signs this browser in again straight away; the confirmation says so
 * rather than leaving a player wondering whether their other devices still work.
 */
function ChangePasswordDialog() {
  const open = useAccountStore((state) => state.dialog) === 'password';
  const busy = useAccountStore((state) => state.busy) !== 'none';
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const close = (): void => {
    useAccountStore.getState().setDialog(null);
    setCurrent('');
    setNext('');
    setAgain('');
    setError('');
    setDone(false);
  };

  const submit = (): void => {
    if (busy) return;
    if (next.length < PASSWORD_MIN) {
      setError(`The new password is too short: it needs at least ${String(PASSWORD_MIN)} characters.`);
      return;
    }
    if (next !== again) {
      setError('The two new passwords are not the same. Type the new one again.');
      return;
    }
    setError('');
    void (async () => {
      const ok = await useAccountStore.getState().changePassword(current, next);
      if (ok) {
        setCurrent('');
        setNext('');
        setAgain('');
        setDone(true);
        return;
      }
      setError(useAccountStore.getState().error);
      useAccountStore.setState({ error: '' });
    })();
  };

  if (done) {
    return (
      <Dialog
        opened={open}
        onClose={close}
        title="Password changed"
        size="sm"
        description="Your new password works from now on. This browser is signed in again; every other device is signed out and will ask for the new password."
        footer={
          <Group justify="flex-end">
            <Button onClick={close}>Done</Button>
          </Group>
        }
      />
    );
  }

  return (
    <Dialog
      opened={open}
      onClose={close}
      title="Change password"
      size="sm"
      description="For an account created with an email and a password. If you sign in with Google, change your password with Google instead."
      footer={
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={close}>
            Cancel
          </Button>
          <Button disabled={current === '' || next === '' || again === '' || busy} onClick={submit}>
            Change password
          </Button>
        </Group>
      }
    >
      <Stack gap="sm">
        <PasswordInput
          label="Current password"
          autoComplete="current-password"
          data-autofocus
          value={current}
          onChange={(event) => {
            setCurrent(event.currentTarget.value);
          }}
        />
        <PasswordInput
          label="New password"
          description={`At least ${String(PASSWORD_MIN)} characters`}
          autoComplete="new-password"
          value={next}
          onChange={(event) => {
            setNext(event.currentTarget.value);
          }}
        />
        <PasswordInput
          label="New password again"
          autoComplete="new-password"
          value={again}
          onChange={(event) => {
            setAgain(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
        />
        <ErrorPanel message={error} />
      </Stack>
    </Dialog>
  );
}

/** Leaving for good. An `alertdialog`, because there is no undo on the server side. */
function DeleteAccountDialog() {
  const open = useAccountStore((state) => state.dialog) === 'delete';
  const busy = useAccountStore((state) => state.busy) !== 'none';
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const close = (): void => {
    useAccountStore.getState().setDialog(null);
    setError('');
    setDone(false);
  };

  if (done) {
    return (
      <Dialog
        opened={open}
        onClose={close}
        title="Account deleted"
        size="sm"
        description="Your account and the copy it held are gone, and you are signed out. Everything in this browser is untouched: the profiles are still here, and Pyrrhic works as it did before you had an account."
        footer={
          <Group justify="flex-end">
            <Button onClick={close}>Done</Button>
          </Group>
        }
      />
    );
  }

  return (
    <Dialog
      role="alertdialog"
      opened={open}
      onClose={close}
      title="Delete my account and its saved profile"
      size="sm"
      description="The account, and the copy of your profiles saved on it, are deleted from the server. This cannot be undone. Your profiles in this browser are not touched, and you can keep using Pyrrhic without an account."
      footer={
        <Group justify="flex-end" gap="sm" wrap="wrap">
          <ExportFirstButton />
          <Button variant="default" onClick={close}>
            Keep my account
          </Button>
          <Button
            color="danger"
            disabled={busy}
            onClick={() => {
              setError('');
              void (async () => {
                const ok = await useAccountStore.getState().deleteAccount();
                if (ok) {
                  setDone(true);
                  return;
                }
                setError(useAccountStore.getState().error);
                useAccountStore.setState({ error: '' });
              })();
            }}
          >
            Delete my account
          </Button>
        </Group>
      }
    >
      <ErrorPanel message={error} />
    </Dialog>
  );
}

/** Every account surface, mounted once by the account menu. Nothing is rendered until it opens. */
export function AccountDialogs() {
  return (
    <>
      <SignInDialog />
      <YourAccountDialog />
      <LoadDialog />
      <ConflictDialog />
      <ChangePasswordDialog />
      <DeleteAccountDialog />
    </>
  );
}
