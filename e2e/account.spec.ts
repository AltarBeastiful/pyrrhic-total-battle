/**
 * The account, end to end against a real PocketBase (S-49b, ADR-0009).
 *
 * Email/password rather than Google: the OAuth round trip leaves the machine, and what has to be
 * proved here is the part we wrote — sign up, save, reload, load, and the 409 that a stale version
 * produces.
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

/** A fresh account per run, so a rerun never meets the profile the last one saved. */
function newCredentials(): { email: string; password: string } {
  return { email: `e2e-${String(Date.now())}-${String(process.pid)}@pyrrhic.test`, password: 'password1234' };
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
  await expect(dialog).toBeHidden({ timeout: 15_000 });

  const signedIn = await openAccountMenu(page);
  await expect(signedIn.getByRole('menuitem', { name: new RegExp(`Signed in as ${email}`) })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  const menu = await openAccountMenu(page);
  await menu.getByRole('menuitem', { name: /^Sign in with email/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Email').fill(email);
  await dialog.getByRole('textbox', { name: 'Password' }).fill(password);
  await dialog.getByRole('button', { name: 'Sign in', exact: true }).click();
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
  await signUp(page, email, password);

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
  await signUp(deviceA, email, password);
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
