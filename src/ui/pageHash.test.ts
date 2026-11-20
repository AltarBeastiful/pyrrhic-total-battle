// @vitest-environment jsdom
/**
 * **The page in the address bar** (owner, 2026-11-19): `#talents` opens the hero talent planner, so a reload
 * comes back to it. The calculator has no fragment. A share link (`#c=...`) and the style kit (`#kit`) are not
 * pages and are left alone.
 */
import { afterEach, beforeEach, expect, test } from 'vitest';

import { bindPageToHash, pageFromHash } from './pageHash';
import { useUiStore } from './uiStore';

let unbind: (() => void) | undefined;

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  useUiStore.setState({ page: 'calculator', talentsTree: 'battle' });
});

afterEach(() => {
  unbind?.();
  unbind = undefined;
});

test.each([
  ['#talents', 'talents'],
  ['#/talents', 'talents'],
  ['#Talents', 'talents'],
  ['', 'calculator'],
  ['#', 'calculator'],
  ['#calculator', 'calculator'],
  ['#c=abcDEF123', 'calculator'],
  ['#kit', 'calculator'],
  ['#nonsense', 'calculator'],
])('%j reads as the %s page', (hash, page) => {
  expect(pageFromHash(hash)).toBe(page);
});

test('opening the address with #talents shows the talents page', () => {
  window.history.replaceState(null, '', '/#talents');
  unbind = bindPageToHash(window);
  expect(useUiStore.getState().page).toBe('talents');
  expect(window.location.hash).toBe('#talents/battle');
});

test('changing the page writes the fragment, and going back to the calculator clears it', () => {
  unbind = bindPageToHash(window);
  useUiStore.getState().setPage('talents');
  expect(window.location.hash).toBe('#talents/battle');
  useUiStore.getState().setPage('calculator');
  expect(window.location.hash).toBe('');
  expect(window.location.pathname + window.location.search).toBe('/');
});

test('editing the fragment by hand moves the page', () => {
  unbind = bindPageToHash(window);
  window.location.hash = '#talents';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  expect(useUiStore.getState().page).toBe('talents');
  window.history.replaceState(null, '', '/');
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  expect(useUiStore.getState().page).toBe('calculator');
});

test('a share link or the style kit in the address does not open a page or get rewritten', () => {
  window.history.replaceState(null, '', '/#c=abc');
  unbind = bindPageToHash(window);
  expect(useUiStore.getState().page).toBe('calculator');
  expect(window.location.hash).toBe('#c=abc');
});

test('the query string and path are kept when the fragment changes', () => {
  window.history.replaceState(null, '', '/app/?x=1');
  unbind = bindPageToHash(window);
  useUiStore.getState().setPage('talents');
  expect(window.location.pathname + window.location.search + window.location.hash).toBe('/app/?x=1#talents/battle');
});

test('the open tree is in the address, read back on load, and Battle is the default', () => {
  window.history.replaceState(null, '', '/#talents/economy');
  unbind = bindPageToHash(window);
  expect(useUiStore.getState().talentsTree).toBe('economy');
  useUiStore.getState().setTalentsTree('archeology');
  expect(window.location.hash).toBe('#talents/archeology');
  unbind();
  useUiStore.setState({ talentsTree: 'economy' });
  window.history.replaceState(null, '', '/#talents/nonsense');
  unbind = bindPageToHash(window);
  expect(useUiStore.getState().talentsTree).toBe('battle');
});
