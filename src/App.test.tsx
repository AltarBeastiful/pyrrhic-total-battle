// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { App } from '@/App';
import { version as gameData } from '@/data';
import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';
import { SECTIONS } from '@/ui/sections';

// The first render compiles the whole application (every section); under full-suite load it can
// exceed the default 5 s budget, which is a cost of the import, not a hang.
vi.setConfig({ testTimeout: 30_000 });

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

/** Open the account menu, which is where every profile action lives now. */
async function openAccountMenu(): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: /^Account:/ }));
  await screen.findByRole('menu');
}

test('renders the brand and the account menu', async () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1, name: 'Pyrrhic' })).toBeTruthy();

  await openAccountMenu();
  expect(screen.getByRole('menuitem', { name: /^New profile/ })).toBeTruthy();
  expect(screen.getByRole('group', { name: 'Switch profile' })).toBeTruthy();
});

test('renders the cards of the plan, in order, with their anchors', () => {
  const { container } = render(<App />);
  const ids = [...container.querySelectorAll('section[id]')].map((node) => node.id);
  expect(ids).toEqual(SECTIONS.map((section) => section.id));
});

test('a card that folds says which way it is folded', () => {
  const { container } = render(<App />);
  // The army cards and the Battle card are the form itself and never fold (owner's third review);
  // whatever still folds — a bonus group, the saved marches — announces which way it is folded.
  const folding = [...container.querySelectorAll('main [aria-expanded]')] as HTMLElement[];
  expect(folding.length).toBeGreaterThan(0);

  const [first] = folding;
  if (first === undefined) throw new Error('nothing folds any more');
  const before = first.getAttribute('aria-expanded');
  expect(['true', 'false']).toContain(before);

  fireEvent.click(first);
  expect(first.getAttribute('aria-expanded')).not.toBe(before);
});

test('the march is generated from the frame, not from a section', () => {
  render(<App />);
  // Two controls, one per breakpoint: the app bar's above xl, the floating one below.
  expect(screen.getAllByRole('button', { name: /^Generate march/ })).toHaveLength(2);
  expect(screen.queryByRole('button', { name: 'Generate' })).toBeNull();
});

test('the About panel names the game data version and the privacy promise', async () => {
  render(<App />);
  await openAccountMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: /^About Pyrrhic/ }));

  // About is a chunk of its own (T-06); Vitest transforms it on demand, so it may take a moment.
  const dialog = await screen.findByRole('dialog', {}, { timeout: 10_000 });
  expect(dialog.textContent).toContain(String(gameData.dataVersion));
  expect(dialog.textContent).toContain(gameData.verifiedOn);
  expect(dialog.textContent).toContain('Nothing leaves your browser');
}, 20_000);

test('the theme row writes the choice to the store and to the document', async () => {
  render(<App />);
  await openAccountMenu();
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'Dark' }));

  await waitFor(() => {
    expect(useStore.getState().doc.ui.theme).toBe('dark');
  });
  expect(document.documentElement.dataset.theme).toBe('dark');
});
