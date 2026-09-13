/**
 * The two pages an email from the backend opens (S-49b): `…/password-reset?token=…` and
 * `…/verify-email?token=…`.
 *
 * They are *pages*, not dialogs, because they are reached from an inbox rather than from the app:
 * there is nothing behind them to go back to, and the app has no router — `src/main.tsx` renders one
 * of these instead of `<App />` when the address bar says so, exactly as it does for the OAuth
 * callback. Each ends by putting the address bar back at the app root and mounting the app, so the
 * one-time token never lingers where it could be copied or shared.
 *
 * Both are deliberately plain: one question, one button, and a sentence that says what happened.
 */
import { Alert, Button, Center, Paper, PasswordInput, Stack, Text, Title } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

import { accountErrorMessage } from '@/account/client';

/** Kept in step with the `users` collection's own floor (the hardening migration sets 10). */
const PASSWORD_MIN = 10;

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Center component="main" mih="100dvh" p="md">
      <Paper withBorder radius="md" p="lg" maw="24rem" w="100%">
        <Stack gap="md">
          <Title order={1} size="h3">
            {title}
          </Title>
          {children}
        </Stack>
      </Paper>
    </Center>
  );
}

export interface CallbackPageProps {
  /** The `token` query parameter, as the email's link carried it. */
  token: string;
  /** Put the address bar back at the app root and mount the app. */
  onDone: () => void;
}

/**
 * Choose a new password, twice. PocketBase signs every device of the account out as it accepts the
 * new one and marks the address confirmed on the way (verified on 0.40.4), so the only thing left to
 * do is sign in again — which is what the button does.
 */
export function PasswordResetPage({ token, onDone }: CallbackPageProps) {
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(false);

  const submit = (): void => {
    if (working) return;
    if (password.length < PASSWORD_MIN) {
      setError(`That password is too short: it needs at least ${String(PASSWORD_MIN)} characters.`);
      return;
    }
    if (password !== again) {
      setError('The two passwords are not the same. Type the new one again.');
      return;
    }
    setWorking(true);
    setError('');
    void (async () => {
      try {
        const { confirmPasswordReset } = await import('@/account/auth');
        await confirmPasswordReset(token, password);
        setPassword('');
        setAgain('');
        setDone(true);
      } catch (cause) {
        setError(accountErrorMessage(cause));
      } finally {
        setWorking(false);
      }
    })();
  };

  if (done) {
    return (
      <Page title="Password changed">
        <Text size="sm">
          Your new password works from now on, and your email address is confirmed. Sign in with it to save
          your profiles to the account again.
        </Text>
        <Button onClick={onDone}>Sign in</Button>
      </Page>
    );
  }

  return (
    <Page title="Choose a new password">
      <Text size="sm" c="dimmed">
        This link was sent to the address on your Pyrrhic account and works once. Your profiles in this
        browser are not touched.
      </Text>
      <PasswordInput
        label="New password"
        description={`At least ${String(PASSWORD_MIN)} characters`}
        autoComplete="new-password"
        data-autofocus
        value={password}
        onChange={(event) => {
          setPassword(event.currentTarget.value);
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
      {error !== '' && (
        <Alert color="danger" role="alert" variant="light">
          {error}
        </Alert>
      )}
      <Stack gap="xs">
        <Button disabled={password === '' || again === '' || working} onClick={submit}>
          Change my password
        </Button>
        <Button variant="subtle" onClick={onDone}>
          Back to Pyrrhic
        </Button>
      </Stack>
    </Page>
  );
}

/**
 * Spend the token from a confirmation email. Nothing is asked of the player, so it runs on arrival
 * and only reports. A token already spent comes back as a success too, so opening the link twice is
 * not an error anybody has to understand.
 */
export function VerifyEmailPage({ token, onDone }: CallbackPageProps) {
  const [state, setState] = useState<'working' | 'done' | 'failed'>('working');
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs an effect twice in development; the confirmation is idempotent, but there is
    // no reason to ask twice, and the rate limiter counts both.
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const { confirmVerification } = await import('@/account/auth');
        await confirmVerification(token);
        setState('done');
      } catch (cause) {
        setError(accountErrorMessage(cause));
        setState('failed');
      }
    })();
  }, [token]);

  if (state === 'working') {
    return (
      <Page title="Confirming your address">
        <Text size="sm">One moment.</Text>
      </Page>
    );
  }

  if (state === 'failed') {
    return (
      <Page title="This link did not work">
        <Alert color="danger" role="alert" variant="light">
          {error}
        </Alert>
        <Button onClick={onDone}>Back to Pyrrhic</Button>
      </Page>
    );
  }

  return (
    <Page title="Email address confirmed">
      <Text size="sm">
        Your address is confirmed. You can save your profiles to the account from the account menu.
      </Text>
      <Button onClick={onDone}>Continue to Pyrrhic</Button>
    </Page>
  );
}
