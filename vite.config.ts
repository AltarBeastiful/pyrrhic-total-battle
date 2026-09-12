import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset URLs so the same bundle works under a GitHub Pages sub-path
  // (/pyrrhic/) and when index.html is opened straight from disk (file://).
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2023',
    sourcemap: true,
  },
  test: {
    // The engine, data and share layers are plain TypeScript: node is the default.
    // UI tests opt into jsdom with a `// @vitest-environment jsdom` docblock
    // (see src/App.test.tsx); `environmentMatchGlobs` was removed in Vitest 4.
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    restoreMocks: true,
  },
});
