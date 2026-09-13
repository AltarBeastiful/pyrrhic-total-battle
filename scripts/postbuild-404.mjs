#!/usr/bin/env node
/**
 * Copy `dist/index.html` to `dist/404.html`.
 *
 * GitHub Pages has no SPA rewrite, so a hard navigation to `…/oauth-callback` — which is where
 * Google sends the player back, and which cannot be a hash route because Google forbids a fragment
 * in a redirect URI (investigation 0012, deviation 9) — is served as a 404. Pages answers a 404 with
 * `404.html` when the repository has one, at the requested URL and with a 404 status the browser
 * does not show; the app boots from it, reads `?code=…`, and rewrites the address bar to the app
 * root. With Vite's `base: './'` the asset URLs in the copy resolve against the *directory* of the
 * request, which is why the registered redirect has no trailing slash.
 *
 * Runs after `vite build`, so the copy is not in the service worker's precache list (the plugin that
 * builds it runs inside the build): one shell document is enough, and the worker's navigation
 * fallback already serves it for any path.
 */
import { access, copyFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const dist = path.resolve(process.cwd(), 'dist');
const source = path.join(dist, 'index.html');
const target = path.join(dist, '404.html');

try {
  await access(source);
} catch {
  console.error(`postbuild-404: ${source} does not exist — did the build run?`);
  process.exit(1);
}

await copyFile(source, target);
console.log('postbuild-404: dist/index.html → dist/404.html');
