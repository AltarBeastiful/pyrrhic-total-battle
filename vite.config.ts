import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

import { buildPrecacheList, renderServiceWorker, SERVICE_WORKER_FILE } from './src/pwa/precache.ts';

/** Every file under `dir`, as paths relative to it, in POSIX form. */
function listFiles(dir: string, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`],
  );
}

/**
 * Rewrites `public/sw.js` into `dist/sw.js` with the real precache list and a content hash as the
 * cache version (S-50). Hand-written rather than `vite-plugin-pwa` so the app keeps no PWA
 * dependency at all, runtime or build-time (ADR-0003); the list-building rules live in
 * `src/pwa/precache.ts` and are unit-tested there.
 */
function pwaPrecache(): Plugin {
  let root = process.cwd();
  let outDir = 'dist';
  let publicDir = '';

  return {
    name: 'pyrrhic:pwa-precache',
    apply: 'build',

    configResolved(config) {
      root = config.root;
      outDir = config.build.outDir;
      publicDir = config.publicDir;
    },

    // Everything is read back from the written output rather than from the rollup bundle: the
    // copy of `public/` and the emitted `index.html` are both on disk by now, whatever order the
    // other plugins ran in. This also replaces the unsubstituted template the copy left there.
    writeBundle() {
      if (!publicDir) return;
      const dir = path.resolve(root, outDir);
      const files = buildPrecacheList(listFiles(dir));

      // The cache name changes whenever any precached byte changes, which is what lets `activate`
      // drop the previous cache.
      const hash = createHash('sha256');
      for (const file of files) {
        hash
          .update(file)
          .update('\0')
          .update(readFileSync(path.join(dir, file)))
          .update('\0');
      }

      const template = readFileSync(path.join(publicDir, SERVICE_WORKER_FILE), 'utf8');
      const rendered = renderServiceWorker(template, files, hash.digest('hex').slice(0, 16));
      writeFileSync(path.join(dir, SERVICE_WORKER_FILE), rendered);
      this.info(`${SERVICE_WORKER_FILE}: precaching ${files.length} files`);
    },
  };
}

export default defineConfig({
  // Relative asset URLs so the same bundle works under a GitHub Pages sub-path
  // (/pyrrhic/) and when index.html is opened straight from disk (file://).
  base: './',
  plugins: [react(), pwaPrecache()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2023',
    sourcemap: true,
    rollupOptions: {
      output: {
        // One stable vendor chunk (React + Mantine) so the first-load budget can name it.
        manualChunks: { vendor: ['react', 'react-dom', '@mantine/core', '@mantine/hooks'] },
      },
    },
  },
  test: {
    // The engine, data and share layers are plain TypeScript: node is the default.
    // UI tests opt into jsdom with a `// @vitest-environment jsdom` docblock
    // (see src/App.test.tsx); `environmentMatchGlobs` was removed in Vitest 4.
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tools/**/*.test.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    restoreMocks: true,
  },
});
