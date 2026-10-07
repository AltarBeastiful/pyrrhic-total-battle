/**
 * The account, end to end against a real PocketBase (S-49b, ADR-0009).
 *
 * Email/password rather than SSO: the provider round trip leaves the machine, and what has to be
 * proved here is the part we wrote — sign up, the confirmation the server insists on, save, reload,
 * load, the 409 that a stale version produces, changing a password and deleting the account.
 *
 * Confirming an address needs an email, which this suite has no way to read. It is done instead the
 * way an operator would: the superuser API flips `verified` on the record, and the app is then
 * reloaded so its own `authRefresh` learns it. That leaves every client path under test and fakes
 * only the inbox.
 *
 * Skipped, not failed, when there is no backend: `VITE_BACKEND_ORIGIN` is a build-time constant, so
 * a CI run without Docker builds an app that has no account rows at all, and there is nothing to
 * test. To run it:
 *
 *   docker network create deploy_default                       # once
 *   docker compose -f ops/pocketbase/docker-compose.yml \
 *                  -f ops/pocketbase/docker-compose.local.yml up -d   # passwords on (S-49c)
 *   VITE_BACKEND_ORIGIN=http://127.0.0.1:8090 pnpm exec playwright test e2e/account.spec.ts
 */
import { expect, test, type Page } from '@playwright/test';

import {
  accountButton,
  openAccountMenu,
  openApp,
  switchProfileNames,
  renameProfile,
  watchConsole,
} from './helpers';

const BACKEND = process.env.VITE_BACKEND_ORIGIN ?? '';
/** The local container's superuser, as `ops/pocketbase/README.md` creates it. */
const SUPERUSER = process.env.PB_SUPERUSER_EMAIL ?? 'dev@pyrrhic.local';
const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD ?? 'devdevdevdev';

/** A fresh account per run, so a rerun never meets the profile the last one saved. */
function newCredentials(): { email: string; password: string } {
  return {
    email: `e2e-${String(Date.now())}-${String(Math.floor(Math.random() * 100_000))}@pyrrhic.test`,
    password: 'password1234',
  };
}

/** The operator's token, asked for once per worker. */
let superuser: Promise<string> | null = null;
function superuserToken(): Promise<string> {
  superuser ??= fetch(`${BACKEND}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: SUPERUSER, password: SUPERUSER_PASSWORD }),
  })
    .then((response) => response.json() as Promise<{ token?: string }>)
    .then(({ token }) => token ?? '');
  return superuser;
}

/**
 * Stand in for the player opening the link in the confirmation email. Everything else about the
 * confirmation — the hook's refusal, the menu row, the reload that picks the new state up — is the
 * app's own code.
 */
async function confirmAddress(email: string): Promise<void> {
  const token = await superuserToken();
  expect(token, 'the e2e superuser must exist: see ops/pocketbase/README.md').not.toBe('');
  const found = (await fetch(
    `${BACKEND}/api/collections/users/records?filter=${encodeURIComponent(`email="${email}"`)}`,
    { headers: { Authorization: token } },
  ).then((response) => response.json())) as { items?: { id: string }[] };
  const id = found.items?.[0]?.id ?? '';
  expect(id, `no account for ${email}`).not.toBe('');
  const updated = await fetch(`${BACKEND}/api/collections/users/records/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ verified: true }),
  });
  expect(updated.ok).toBe(true);
}

/** Asked once per worker; `test.skip` is only legal from a test or a `beforeEach`. */
let reachable: boolean | null = null;

test.beforeEach(async () => {
  test.skip(BACKEND === '', 'no VITE_BACKEND_ORIGIN: this build has no account');
  reachable ??= await fetch(`${BACKEND}/api/health`)
    .then((response) => response.ok)
    .catch(() => false);
  test.skip(!reachable, `no PocketBase at ${BACKEND}`);
});

/** Sign up through the menu's email dialog and wait for the account rows to appear. */
async function signUp(page: Page, email: string, password: string): Promise<void> {
  const menu = await openAccountMenu(page);
  await menu.getByRole('menuitem', { name: /^Sign in…/ }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Sign in with email…' }).click();
  await dialog.getByLabel('Email').fill(email);
  await dialog.getByRole('textbox', { name: 'Password' }).fill(password);
  await dialog.getByRole('switch', { name: 'Create account' }).click();
  await dialog.getByRole('button', { name: 'Create account' }).click();

  // The account exists; nothing can be saved to it until the address is confirmed, and the dialog
  // says exactly that before it gets out of the way.
  await expect(dialog.getByText(/Check your inbox to confirm your address/)).toBeVisible({
    timeout: 15_000,
  });
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });

  const signedIn = await openAccountMenu(page);
  await expect(signedIn.getByRole('menuitem', { name: new RegExp(`Signed in as ${email}`) })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
}

/**
 * Sign up and confirm the address, for the tests that are about something else. No reload: a reload
 * would clear the unsaved-changes flag and with it the Save row, and the server does not care that
 * this browser's copy of the record still says `verified: false`. The test below is the one that
 * proves the app itself catches up.
 */
async function signUpConfirmed(page: Page, email: string, password: string): Promise<void> {
  await signUp(page, email, password);
  await confirmAddress(email);
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  const menu = await openAccountMenu(page);
  await menu.getByRole('menuitem', { name: /^Sign in…/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Sign in with email…' }).click();
  await dialog.getByLabel('Email').fill(email);
  await dialog.getByRole('textbox', { name: 'Password' }).fill(password);
  await dialog.getByRole('button', { name: 'Sign in', exact: true }).click();
}

/**
 * Open the dialog behind the row that names the account. The menu deliberately stops at four rows,
 * so changing a password and deleting the account live one press deeper.
 */
async function openYourAccount(page: Page): Promise<void> {
  await chooseAccountRow(page, /^Signed in as/);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Change password…' })).toBeVisible();
}

/** Press one account row and let the menu close behind it. */
async function chooseAccountRow(page: Page, name: RegExp): Promise<void> {
  const menu = await openAccountMenu(page);
  await menu.getByRole('menuitem', { name }).click();
  await expect(page.getByRole('menu')).toBeHidden();
}

test('the sign-in dialog offers what the server lists, and no email form when passwords are off', async ({
  page,
}) => {
  // Production's answer since S-49c, served in place of the local container's (which keeps passwords
  // on for the tests below). The popup itself leaves the machine, so it is not driven here.
  await page.route('**/api/collections/users/auth-methods*', (route) =>
    route.fulfill({
      json: {
        password: { enabled: false, identityFields: ['email'] },
        oauth2: {
          enabled: true,
          providers: [
            { name: 'google', displayName: 'Google', state: 's', codeVerifier: 'v', authURL: 'https://g/' },
            { name: 'discord', displayName: 'Discord', state: 's', codeVerifier: 'v', authURL: 'https://d/' },
          ],
        },
      },
    }),
  );
  await openApp(page);
  const menu = await openAccountMenu(page);
  await menu.getByRole('menuitem', { name: /^Sign in…/ }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Continue with Discord' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Sign in with email…' })).toHaveCount(0);
});

/** Wait until the profile row says the account has it (S-49d: nothing to press). */
async function waitForAccountSaved(page: Page): Promise<void> {
  await expect(async () => {
    const menu = await openAccountMenu(page);
    try {
      await expect(menu.getByText('Saved to your account', { exact: true })).toBeVisible({ timeout: 2_000 });
    } finally {
      await page.keyboard.press('Escape');
      await expect(page.getByRole('menu')).toBeHidden();
    }
  }).toPass({ timeout: 20_000 });
}

/** Stand in for the player coming back to the tab: the app pulls and merges on its own. */
async function comeBack(page: Page): Promise<void> {
  await page.evaluate(() => {
    const view = globalThis as unknown as { document: { dispatchEvent: (event: Event) => boolean } };
    view.document.dispatchEvent(new Event('visibilitychange'));
  });
}

async function createProfile(page: Page, name: string): Promise<void> {
  await chooseAccountRow(page, /^New profile/);
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Profile name').fill(name);
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(accountButton(page)).toHaveAccessibleName(`Account: ${name}`);
}

test('an edit saves itself, and another browser that signs in has it', async ({ browser }) => {
  const { email, password } = newCredentials();

  const first = await browser.newContext();
  const deviceA = await first.newPage();
  const problems = watchConsole(deviceA);
  await openApp(deviceA);
  await renameProfile(deviceA, 'On the account');
  await signUpConfirmed(deviceA, email, password);
  await renameProfile(deviceA, 'Edited, never saved by hand');
  await waitForAccountSaved(deviceA);

  const second = await browser.newContext();
  const deviceB = await second.newPage();
  await openApp(deviceB);
  await signIn(deviceB, email, password);
  await expect(accountButton(deviceB)).toHaveAccessibleName('Account: Edited, never saved by hand', {
    timeout: 15_000,
  });
  // B's own untouched start profile was not worth adding to the account.
  expect(await switchProfileNames(deviceB)).toEqual(['Edited, never saved by hand']);

  expect(problems).toEqual([]);
  await first.close();
  await second.close();
});

test('two browsers editing different profiles both keep both, with no question asked', async ({
  browser,
}) => {
  const { email, password } = newCredentials();

  const first = await browser.newContext();
  const deviceA = await first.newPage();
  await openApp(deviceA);
  await renameProfile(deviceA, 'Profile A');
  await signUpConfirmed(deviceA, email, password);
  await renameProfile(deviceA, 'Profile A, saved');
  await waitForAccountSaved(deviceA);

  const second = await browser.newContext();
  const deviceB = await second.newPage();
  await openApp(deviceB);
  await signIn(deviceB, email, password);
  await expect(accountButton(deviceB)).toHaveAccessibleName('Account: Profile A, saved', { timeout: 15_000 });
  await createProfile(deviceB, 'Profile B');
  await waitForAccountSaved(deviceB);

  // A has not looked since: its next save meets B's, and merges it instead of asking.
  await renameProfile(deviceA, 'Profile A, edited again');
  await waitForAccountSaved(deviceA);
  await expect
    .poll(() => switchProfileNames(deviceA), { timeout: 15_000 })
    .toEqual(['Profile A, edited again', 'Profile B']);
  await expect(deviceA.getByRole('alertdialog')).toHaveCount(0);

  // And B picks A's edit up as soon as it is looked at again.
  await comeBack(deviceB);
  await expect
    .poll(() => switchProfileNames(deviceB), { timeout: 15_000 })
    .toEqual(['Profile A, edited again', 'Profile B']);

  await first.close();
  await second.close();
});

test('two open screens stay in step: an edit on one appears on the other without a reload', async ({
  browser,
}) => {
  const { email, password } = newCredentials();

  const first = await browser.newContext();
  const deviceA = await first.newPage();
  await openApp(deviceA);
  await renameProfile(deviceA, 'Live');
  await signUpConfirmed(deviceA, email, password);
  await renameProfile(deviceA, 'Live, saved');
  await waitForAccountSaved(deviceA);

  const second = await browser.newContext();
  const deviceB = await second.newPage();
  await openApp(deviceB);
  await signIn(deviceB, email, password);
  await expect(accountButton(deviceB)).toHaveAccessibleName('Account: Live, saved', { timeout: 15_000 });

  // Nothing is done on B: no reload, no tab switch. Realtime brings A's edit over.
  await renameProfile(deviceA, 'Live, edited on A');
  await expect(accountButton(deviceB)).toHaveAccessibleName('Account: Live, edited on A', {
    timeout: 15_000,
  });

  await first.close();
  await second.close();
});

test('signing out takes the account’s profiles off this browser, and signing in brings them back', async ({
  page,
}) => {
  const { email, password } = newCredentials();

  await openApp(page);
  await renameProfile(page, 'The account’s');
  await signUpConfirmed(page, email, password);
  await renameProfile(page, 'The account’s, edited');
  await waitForAccountSaved(page);

  await chooseAccountRow(page, /^Sign out/);
  await expect(accountButton(page)).toHaveAccessibleName('Account: My account', { timeout: 15_000 });
  await expect(accountButton(page)).toHaveAccessibleDescription(/saved in this browser only/);

  await signIn(page, email, password);
  await expect(accountButton(page)).toHaveAccessibleName('Account: The account’s, edited', {
    timeout: 15_000,
  });
  expect(await switchProfileNames(page)).toEqual(['The account’s, edited']);
});

test('a new account cannot save until its address is confirmed', async ({ page }) => {
  const { email, password } = newCredentials();

  await openApp(page);
  await renameProfile(page, 'Before confirming');
  await signUp(page, email, password);

  // The row is there, and it explains itself rather than only refusing.
  const menu = await openAccountMenu(page);
  await expect(menu.getByRole('menuitem', { name: /^Confirm your email address/ })).toContainText(
    'Saving needs a confirmed address',
  );
  await expect(menu.getByText('Not saved to your account yet: will retry')).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('Escape');

  // The link in the email, as an operator would do it; the app learns about it on its own.
  await confirmAddress(email);
  await page.reload();
  await waitForAccountSaved(page);
  await expect(page.getByRole('menuitem', { name: /^Confirm your email address/ })).toBeHidden();
});

test('a password can be changed, and the new one is the one that works', async ({ page }) => {
  const { email, password } = newCredentials();
  const nextPassword = 'password-5678';

  await openApp(page);
  await signUpConfirmed(page, email, password);

  await openYourAccount(page);
  await page.getByRole('button', { name: 'Change password…' }).click();

  // One dialog replaces the other, and Mantine animates the old one out: pick the one with the form.
  const dialog = page.getByRole('dialog').filter({ has: page.getByLabel('Current password') });
  await dialog.getByLabel('Current password').fill(password);
  await dialog.getByLabel('New password', { exact: true }).fill(nextPassword);
  await dialog.getByLabel('New password again').fill(nextPassword);
  await dialog.getByRole('button', { name: 'Change password', exact: true }).click();

  await expect(page.getByText(/every other device is signed out/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: 'Done' })).toBeHidden();

  // The proof is the next sign-in, not the message: sign out, and come back with the new password.
  await chooseAccountRow(page, /^Sign out/);
  await signIn(page, email, nextPassword);
  await expect(
    (await openAccountMenu(page)).getByRole('menuitem', { name: new RegExp(`Signed in as ${email}`) }),
  ).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('Escape');
});

test('deleting the account leaves this browser exactly as it was', async ({ page }) => {
  const { email, password } = newCredentials();

  await openApp(page);
  await renameProfile(page, 'Mine to keep');
  await signUpConfirmed(page, email, password);
  await renameProfile(page, 'Mine to keep, saved');
  await waitForAccountSaved(page);

  await openYourAccount(page);
  await page.getByRole('button', { name: 'Delete account…' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Your profiles in this browser are not touched');
  await dialog.getByRole('button', { name: 'Delete my account' }).click();

  await expect(page.getByText(/Everything in this browser is untouched/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: 'Done' })).toBeHidden();

  // Signed out, with the way back in offered again — and the profile still here.
  const menu = await openAccountMenu(page);
  await expect(menu.getByRole('menuitem', { name: /^Sign in…/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(accountButton(page)).toHaveAccessibleName('Account: Mine to keep, saved');

  // And the account really is gone: the same password no longer signs anybody in.
  await signIn(page, email, password);
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('do not match an account', {
    timeout: 15_000,
  });
});

/**
 * The two pages a backend email opens. A real token only ever arrives by email, which this suite
 * cannot read — so what is proved here is everything around it: that the app answers those paths at
 * all (they are served by the build-time `404.html` copy), that the page renders in place of the
 * app, that a link nobody can use says so in a sentence, and that the way back mounts the app with
 * its address bar clean.
 */
test('the reset page answers its own path and says what a dead link means', async ({ page }) => {
  await page.goto('/password-reset?token=not-a-real-token');
  await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();

  await page.getByLabel('New password', { exact: true }).fill('short');
  await page.getByLabel('New password again').fill('short');
  await page.getByRole('button', { name: 'Change my password' }).click();
  await expect(page.getByRole('alert')).toContainText('at least 10 characters');

  await page.getByLabel('New password', { exact: true }).fill('password-1234');
  await page.getByLabel('New password again').fill('password-1234');
  await page.getByRole('button', { name: 'Change my password' }).click();
  await expect(page.getByRole('alert')).toContainText('This reset link has expired', { timeout: 15_000 });

  // Back to the app, with the one-time token gone from the address bar and sign-in offered.
  await page.getByRole('button', { name: 'Back to Pyrrhic' }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
  expect(new URL(page.url()).search).toBe('');
});

test('the confirmation page spends the token it was given, or says why it could not', async ({ page }) => {
  await page.goto('/verify-email?token=not-a-real-token');
  await expect(page.getByRole('heading', { name: 'This link did not work' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole('alert')).toContainText('This confirmation link has expired');

  await page.getByRole('button', { name: 'Back to Pyrrhic' }).click();
  await expect(accountButton(page)).toBeVisible({ timeout: 15_000 });
  expect(new URL(page.url()).search).toBe('');
});
