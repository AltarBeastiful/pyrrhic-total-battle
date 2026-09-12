/**
 * Getting a profile out of the browser and back in: the JSON file (S-04) and the share link
 * (ADR-0005). Both are the only ways a player moves an account between devices, so both are checked
 * against a genuinely empty second browser context.
 */
import { expect, test } from '@playwright/test';

import { openApp, profileNames, watchConsole } from './helpers';

test('export writes a JSON file and importing it adds a second profile', async ({ page }, testInfo) => {
  const problems = watchConsole(page);
  await openApp(page);

  await page.getByRole('button', { name: 'Rename profile' }).click();
  await page.getByLabel('Profile name').fill('Exported');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Active profile' })).toHaveText('Exported');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export profile' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^pyrrhic-exported-\d{4}-\d{2}-\d{2}\.json$/);

  const file = testInfo.outputPath('profile.json');
  await download.saveAs(file);
  const saved: unknown = JSON.parse(await (await import('node:fs/promises')).readFile(file, 'utf8'));
  expect(saved).toMatchObject({ kind: 'profile' });

  await page.setInputFiles('input[type=file]', file);

  const preview = page.getByRole('dialog');
  await expect(preview.getByRole('heading', { name: 'Import' })).toBeVisible();
  await expect(preview).toContainText('Exported');
  await preview.getByRole('button', { name: 'Add as new' }).click();

  await expect.poll(() => profileNames(page)).toHaveLength(2);

  expect(problems).toEqual([]);
});

test('a profile link offers to add the account in a fresh browser', async ({ page, browser }) => {
  const problems = watchConsole(page);
  await openApp(page);

  await page.getByRole('button', { name: 'Rename profile' }).click();
  await page.getByLabel('Profile name').fill('Shared');
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await page.getByRole('button', { name: 'Share profile or march' }).click();
  const share = page.getByRole('dialog');
  await expect(share.getByRole('heading', { name: 'Share' })).toBeVisible();
  const link = share.getByRole('textbox', { name: 'Profile share link' });
  await expect(link).not.toHaveValue('');
  const url = await link.inputValue();
  expect(url).toContain('#c=');
  await page.keyboard.press('Escape');

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
  await expect(other.getByRole('combobox', { name: 'Active profile' })).toHaveText('Shared');
  await expect.poll(() => profileNames(other)).toEqual(['My account', 'Shared']);

  expect(otherProblems).toEqual([]);
  await fresh.close();
  expect(problems).toEqual([]);
});
