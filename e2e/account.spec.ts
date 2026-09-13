/**
 * The account, end to end against a real PocketBase (S-49b, ADR-0009).
 *
 * Email/password rather than Google: the OAuth round trip leaves the machine, and what has to be
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
 *                  -f ops/pocketbase/docker-compose.local.yml up -d
 *   VITE_BACKEND_ORIGIN=http://127.0.0.1:8090 pnpm exec playwright test e2e/account.spec.ts
 */
import { expect, test, type Page } from '@playwright/test';

import { accountButton, openAccountMenu, openApp, renameProfile, watchConsole } from './helpers';

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
  await menu.getByRole('menuitem', { name: /^Sign in with email/ }).click();

  const dialog = page.getByRole('dialog');
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
  await menu.getByRole('menuitem', { name: /^Sign in with email/ }).click();
  const dialog = page.getByRole('dialog');
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

test('sign up, save, reload, load back', async ({ page }) => {
  const problems = watchConsole(page);
  const { email, password } = newCredentials();

  await openApp(page);
  await renameProfile(page, 'On the account');
  await signUpConfirmed(page, email, password);

  await chooseAccountRow(page, /^Save to account/);
  const afterSave = await openAccountMenu(page);
  await expect(afterSave.getByRole('menuitem', { name: /^Save to account/ })).toContainText('Saved', {
    timeout: 15_000,
  });
  await page.keyboard.press('Escape');

  // A genuinely empty browser: nothing of the profile is left, only the account.
  await page.evaluate(() => {
    const view = globalThis as unknown as { localStorage: Storage };
    view.localStorage.removeItem('pyrrhic.v1');
    view.localStorage.removeItem('pyrrhic.account.device.v1');
  });
  await page.reload();
  await expect(accountButton(page)).not.toHaveAccessibleName('Account: On the account');

  await chooseAccountRow(page, /^Load from account/);
  await expect(accountButton(page)).toHaveAccessibleName('Account: On the account', { timeout: 15_000 });

  expect(problems).toEqual([]);
});

test('a save made from a stale version shows the conflict question', async ({ browser }) => {
  const { email, password } = newCredentials();

  const first = await browser.newContext();
  const deviceA = await first.newPage();
  await openApp(deviceA);
  await renameProfile(deviceA, 'Device A');
  await signUpConfirmed(deviceA, email, password);
  await chooseAccountRow(deviceA, /^Save to account/);
  await expect(
    (await openAccountMenu(deviceA)).getByRole('menuitem', { name: /^Save to account/ }),
  ).toContainText('Saved', { timeout: 15_000 });
  await deviceA.keyboard.press('Escape');

  // A second browser signs in, takes the account's copy, edits it and saves: the account moves to
  // version 2 while device A still believes it holds version 1.
  const second = await browser.newContext();
  const deviceB = await second.newPage();
  await openApp(deviceB);
  await signIn(deviceB, email, password);
  const loadQuestion = deviceB.getByRole('alertdialog');
  await expect(loadQuestion).toBeVisible({ timeout: 15_000 });
  await loadQuestion.getByRole('button', { name: 'Load from account' }).click();
  await expect(accountButton(deviceB)).toHaveAccessibleName('Account: Device A', { timeout: 15_000 });
  await renameProfile(deviceB, 'Device B');
  await chooseAccountRow(deviceB, /^Save to account/);
  await expect(
    (await openAccountMenu(deviceB)).getByRole('menuitem', { name: /^Save to account/ }),
  ).toContainText('Saved', { timeout: 15_000 });

  // Back on A: an edit and a save on top of a version the account has already moved past.
  await renameProfile(deviceA, 'Device A again');
  await chooseAccountRow(deviceA, /^Save to account/);

  const conflict = deviceA.getByRole('alertdialog');
  await expect(conflict).toBeVisible({ timeout: 15_000 });
  await expect(conflict).toContainText('Both ways out lose something');
  await expect(conflict.getByRole('button', { name: 'Export JSON first' })).toBeVisible();
  await expect(conflict.getByRole('button', { name: /^Load the other device/ })).toBeVisible();

  // Taking the other device's copy leaves both at the same version with the same data.
  await conflict.getByRole('button', { name: /^Load the other device/ }).click();
  await expect(accountButton(deviceA)).toHaveAccessibleName('Account: Device B', { timeout: 15_000 });

  await first.close();
  await second.close();
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
  await page.keyboard.press('Escape');

  await chooseAccountRow(page, /^Save to account/);
  await expect(
    (await openAccountMenu(page)).getByRole('menuitem', { name: /^Save to account/ }),
  ).toContainText('Confirm your email address first', { timeout: 15_000 });
  await page.keyboard.press('Escape');

  // The link in the email, as an operator would do it; the app learns about it on its own.
  await confirmAddress(email);
  await page.reload();
  await renameProfile(page, 'After confirming');

  await chooseAccountRow(page, /^Save to account/);
  await expect(
    (await openAccountMenu(page)).getByRole('menuitem', { name: /^Save to account/ }),
  ).toContainText('Saved', { timeout: 15_000 });
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
  await chooseAccountRow(page, /^Save to account/);
  await expect(
    (await openAccountMenu(page)).getByRole('menuitem', { name: /^Save to account/ }),
  ).toContainText('Saved', { timeout: 15_000 });
  await page.keyboard.press('Escape');

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
  await expect(menu.getByRole('menuitem', { name: /^Sign in with email/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(accountButton(page)).toHaveAccessibleName('Account: Mine to keep');

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
