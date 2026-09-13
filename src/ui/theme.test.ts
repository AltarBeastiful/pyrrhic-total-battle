// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest';

import {
  applyTheme,
  documentColorSchemeManager,
  inkOn,
  ramp,
  resolveTheme,
  SEEDS,
  systemTheme,
  watchSystemTheme,
} from './theme';

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

test('an explicit theme is written to the document', () => {
  applyTheme('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
  applyTheme('light');
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('"system" resolves to the OS preference, and to light when it cannot be read', () => {
  // jsdom has no matchMedia: the fallback must be light rather than a crash.
  expect(systemTheme()).toBe('light');
  expect(resolveTheme('system')).toBe('light');
  applyTheme('system');
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('watching the OS preference is a no-op when matchMedia is missing', () => {
  const stop = watchSystemTheme(() => 'system');
  expect(typeof stop).toBe('function');
  stop();
});

// ---- the generated ramps -------------------------------------------------------------------

/** WCAG 2.2 relative luminance, written out here so the test does not trust the module under test. */
function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [light, dark] = luminance(a) > luminance(b) ? [a, b] : [b, a];
  return (luminance(light) + 0.05) / (luminance(dark) + 0.05);
}

const LIGHT_SHEET = '#fafbfa';
const LIGHT_RAISED = '#dee3df';
const DARK_SHEET = '#1e2423';
const DARK_RAISED = '#2b3231';

test('a ramp is ten hex colours, lightest first', () => {
  const shades = ramp('#c9a24a');
  expect(shades).toHaveLength(10);
  for (const shade of shades) expect(shade).toMatch(/^#[0-9a-f]{6}$/);
  for (let i = 1; i < shades.length; i += 1) {
    expect(luminance(shades[i]!)).toBeLessThan(luminance(shades[i - 1]!));
  }
});

test('the same seed always gives the same ramp, and a different hue a different one', () => {
  expect(ramp('#256b35')).toEqual(ramp('#256b35'));
  expect(ramp('#256b35')).not.toEqual(ramp('#25568a'));
});

test('every seed lands its light ink and its dark ink in one narrow band', () => {
  // This is what targeting luminance rather than HSL lightness buys: a green and a violet at the
  // same step are the same distance from the page, so no group shouts louder than another.
  for (const seed of Object.values(SEEDS)) {
    const shades = ramp(seed);
    const lightInk = shades[7]!;
    const darkInk = shades[5]!;
    expect(contrast(lightInk, LIGHT_SHEET)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(lightInk, LIGHT_RAISED)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(darkInk, DARK_SHEET)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(darkInk, DARK_RAISED)).toBeGreaterThanOrEqual(4.5);
  }
});

test('the ink chosen for a filled ground clears 4.5:1 on it, in either scheme', () => {
  for (const seed of Object.values(SEEDS)) {
    const shades = ramp(seed);
    expect(contrast(inkOn(shades[7]!), shades[7]!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(inkOn(shades[5]!), shades[5]!)).toBeGreaterThanOrEqual(4.5);
  }
});

test('a seed keeps its hue: the generated guardsmen ink is the design’s own green', () => {
  // `docs/design.md` §1 records #256b35 as the guardsmen ink on a light page; the generator lands
  // within a few units of it, which is the evidence that the ramps did not invent a new palette.
  const generated = ramp(SEEDS.guardsmen)[7]!;
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(generated.slice(i, i + 2), 16));
  expect(Math.abs(r! - 0x25)).toBeLessThan(16);
  expect(Math.abs(g! - 0x6b)).toBeLessThan(16);
  expect(Math.abs(b! - 0x35)).toBeLessThan(16);
});

// ---- the colour scheme manager ----------------------------------------------------------

test('the manager reads and writes the app’s own data-theme attribute', () => {
  const manager = documentColorSchemeManager();
  applyTheme('dark');
  expect(manager.get('light')).toBe('dark');

  manager.set('light');
  expect(document.documentElement.dataset.theme).toBe('light');

  manager.set('auto');
  expect(document.documentElement.dataset.theme).toBe('light'); // no matchMedia in jsdom

  manager.clear();
  expect(document.documentElement.dataset.theme).toBeUndefined();
  expect(manager.get('dark')).toBe('dark');
});

test('a theme change made by the app reaches Mantine through the attribute', async () => {
  const manager = documentColorSchemeManager();
  const seen: string[] = [];
  manager.subscribe((scheme) => seen.push(scheme));

  applyTheme('dark');
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

  expect(seen).toContain('dark');
  manager.unsubscribe();
});

test('a subscriber that writes back settles instead of looping', () => {
  const manager = documentColorSchemeManager();
  applyTheme('light');
  let calls = 0;
  manager.subscribe((scheme) => {
    calls += 1;
    manager.set(scheme);
  });
  manager.set('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(calls).toBe(0);
  manager.unsubscribe();
});
