import { describe, expect, test } from 'vitest';

import { APP_SHELL_FILE, buildPrecacheList, renderServiceWorker } from './precache';

const BUILD_OUTPUT = [
  'index.html',
  'assets/index-C980HzOG.css',
  'assets/index-CGU2-y1d.js',
  'assets/index-CGU2-y1d.js.map',
  'assets/calc.worker-BdTZc8Zt.js',
  'assets/calc.worker-BdTZc8Zt.js.map',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon.svg',
  'sw.js',
];

describe('buildPrecacheList', () => {
  test('keeps everything the app needs to start and calculate offline', () => {
    expect(buildPrecacheList(BUILD_OUTPUT)).toEqual([
      'index.html',
      'assets/calc.worker-BdTZc8Zt.js',
      'assets/index-C980HzOG.css',
      'assets/index-CGU2-y1d.js',
      'icons/icon-192.png',
      'icons/icon.svg',
      'manifest.webmanifest',
    ]);
  });

  test('the calculation worker chunk is precached, or a search cannot run offline', () => {
    expect(buildPrecacheList(BUILD_OUTPUT)).toContain('assets/calc.worker-BdTZc8Zt.js');
  });

  test('the shell comes first; the rest is sorted so an unchanged build is byte-identical', () => {
    const files = buildPrecacheList(BUILD_OUTPUT);
    expect(files[0]).toBe(APP_SHELL_FILE);
    expect(buildPrecacheList([...BUILD_OUTPUT].reverse())).toEqual(files);
  });

  test('drops source maps, the worker itself and anything not servable as a cached asset', () => {
    const files = buildPrecacheList([...BUILD_OUTPUT, 'assets/notes.txt', 'assets/index.js.map']);
    expect(files.some((file) => file.endsWith('.map'))).toBe(false);
    expect(files).not.toContain('sw.js');
    expect(files).not.toContain('assets/notes.txt');
  });

  test('normalises separators and leading ./, and de-duplicates', () => {
    expect(buildPrecacheList(['./icons\\icon.svg', 'icons/icon.svg', '/icons/icon.svg'])).toEqual([
      'icons/icon.svg',
    ]);
  });

  test('ignores anything outside the build root', () => {
    expect(buildPrecacheList(['../secrets.json', 'index.html'])).toEqual(['index.html']);
  });
});

describe('renderServiceWorker', () => {
  const template = [
    'const PRECACHE = /* precache-manifest */ [];',
    "const VERSION = /* precache-version */ 'dev';",
  ].join('\n');

  test('substitutes the list and the version', () => {
    const rendered = renderServiceWorker(template, ['index.html', 'assets/app.js'], 'abc123');
    expect(rendered).toContain('/* precache-manifest */ ["index.html","assets/app.js"]');
    expect(rendered).toContain("/* precache-version */ 'abc123'");
  });

  test('a file name containing $ is not read as a capture reference', () => {
    const rendered = renderServiceWorker(template, ['assets/a$&b.js'], 'abc123');
    expect(rendered).toContain('["assets/a$&b.js"]');
  });

  test('the result is valid JavaScript that exposes the list', () => {
    const rendered = renderServiceWorker(template, ['index.html'], 'abc123');
    const read = new Function(`${rendered}; return { PRECACHE, VERSION };`) as () => {
      PRECACHE: string[];
      VERSION: string;
    };
    expect(read()).toEqual({ PRECACHE: ['index.html'], VERSION: 'abc123' });
  });

  test('fails loudly when a marker was edited out of the template', () => {
    expect(() => renderServiceWorker('const PRECACHE = [];', ['index.html'], 'abc')).toThrow(
      /precache-manifest/,
    );
    expect(() =>
      renderServiceWorker('const PRECACHE = /* precache-manifest */ [];', ['index.html'], 'abc'),
    ).toThrow(/precache-version/);
  });

  test('rejects a version that would not survive being quoted', () => {
    expect(() => renderServiceWorker(template, [], "it's broken")).toThrow(/cache version/);
  });
});
