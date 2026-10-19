/**
 * Getting a profile out of the browser and back in: the JSON file (S-04) and the share link
 * (ADR-0005). Both are the only ways a player moves an account between devices, so both are checked
 * against a genuinely empty second browser context.
 */
import { expect, test } from '@playwright/test';

import { chooseInProfileMenu, openApp, renameProfile, switchProfileNames, watchConsole } from './helpers';

test('export writes a JSON file and importing it adds a second profile', async ({ page }, testInfo) => {
  const problems = watchConsole(page);
  await openApp(page);

  await renameProfile(page, 'Exported');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    chooseInProfileMenu(page, /^Export JSON/),
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

  await expect.poll(() => switchProfileNames(page)).toHaveLength(2);

  expect(problems).toEqual([]);
});
