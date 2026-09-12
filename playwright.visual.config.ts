import { defineConfig, devices } from '@playwright/test';

// The kit page only exists in a development build (`import.meta.env.DEV`), so this suite runs
// against `vite dev` rather than the preview server `playwright.config.ts` uses — and on its own
// port, so a dev server you already have open on 5180 is left alone.
const PORT = 5181;
const baseURL = `http://127.0.0.1:${PORT}`;

// Visual regression and accessibility on the kit page only (ui-foundation plan §5, T-d): app
// screenshots churn with the data, the kit page does not. `pnpm test:visual` compares; a deliberate
// visual change is re-baselined with `pnpm test:visual:update` in the same commit.
export default defineConfig({
  testDir: './e2e',
  testMatch: /visual\.spec\.ts/,
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    colorScheme: 'light',
    // Screenshots have to be reproducible: no transitions, no caret, no OS motion preference.
    reducedMotion: 'reduce',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide' },
  },
  projects: [
    {
      name: 'phone',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
