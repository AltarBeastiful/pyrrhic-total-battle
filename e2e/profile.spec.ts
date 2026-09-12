/**
 * Getting a profile out of the browser and back in: the JSON file (S-04) and the share link
 * (ADR-0005). Both are the only ways a player moves an account between devices, so both are checked
 * against a genuinely empty second browser context.
 */
import { expect, test, type Page } from '@playwright/test';

import {
  accountButton,
  chooseInAccountMenu,
  openApp,
  profileNames,
  renameProfile,
  watchConsole,
} from './helpers';

/** The link the account menu just put on the clipboard. */
async function clipboard(page: Page): Promise<string> {
  return page.evaluate(() => {
    const view = globalThis as unknown as {
      navigator: { clipboard: { readText: () => Promise<string> } };
    };
    return view.navigator.clipboard.readText();
  });
}

test('export writes a JSON file and importing it adds a second profile', async ({ page }, testInfo) => {
  const problems = watchConsole(page);
  await openApp(page);

  await renameProfile(page, 'Exported');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    chooseInAccountMenu(page, /^Export JSON/),
  ]);
  expect(download.suggestedFilename()).toMatch(/^pyrrhic-exported-\d{4}-\d{2}-\d{2}\.json$/);

  const file = testInfo.outputPath('profile.json');
  await download.saveAs(file);
  const saved: unknown = JSON.parse(await (await import('node:fs/promises')).readFile(file, 'utf8'));
  expect(saved).toMatchObject({ kind: 'profile' });

  // The menu's "Import JSON" opens this input; setting it directly is the same journey without the
  // operating system's file chooser.
  await page.setInputFiles('input[type=file]', file);

  const preview = page.getByRole('dialog');
  await expect(preview.getByRole('heading', { name: 'Import' })).toBeVisible();
  await expect(preview).toContainText('Exported');
  await preview.getByRole('button', { name: 'Add as new' }).click();

  await expect.poll(() => profileNames(page)).toHaveLength(2);

  expect(problems).toEqual([]);
});

test('a profile link offers to add the account in a fresh browser', async ({ page, browser, context }) => {
  const problems = watchConsole(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openApp(page);

  await renameProfile(page, 'Shared');

  // Share copies the link and says so in a live region; with no march generated it is the profile.
  await chooseInAccountMenu(page, /^Share this march/);
  // The march has its own status line; this one is the top bar's.
  await expect(page.getByRole('banner').getByRole('status')).toHaveText('Copied');
  const url = await clipboard(page);
  expect(url).toContain('#c=');

  const fresh = await browser.newContext();
  const other = await fresh.newPage();
  const otherProblems = watchConsole(other);
  await other.goto(url);
  await other.waitForLoadState('networkidle');

  // The prompt must appear before anything stored is touched, and the code must leave the address bar.
  const prompt = other.getByRole('dialog');
  await expect(prompt.getByRole('heading', { name: 'Load shared profile?' })).toBeVisible();
  await expect(prompt).toContainText('Shared');
  expect(other.url()).not.toContain('#c=');

  await prompt.getByRole('button', { name: 'Add as new profile' }).click();
  await expect(accountButton(other)).toHaveAccessibleName('Account: Shared');
  await expect.poll(() => profileNames(other)).toEqual(['My account', 'Shared']);

  expect(otherProblems).toEqual([]);
  await fresh.close();
  expect(problems).toEqual([]);
});
