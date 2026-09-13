// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { App } from '@/App';
import { version as gameData } from '@/data';
import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';
import { ThemeHarness } from '@/ui/kit2/testRender';
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

/** The app as `main.tsx` mounts it: inside the provider that carries the theme (M-01). */
function renderApp(): ReturnType<typeof render> {
  return render(<App />, { wrapper: ThemeHarness });
}

/** Open the account menu, which is where every profile action lives now. */
async function openAccountMenu(): Promise<HTMLElement> {
  fireEvent.click(screen.getByRole('button', { name: /^Account:/ }));
  return screen.findByRole('menu');
}

test('renders the brand and the account menu', async () => {
  renderApp();
  expect(screen.getByRole('heading', { level: 1, name: 'Pyrrhic' })).toBeTruthy();

  const menu = await openAccountMenu();
  expect(within(menu).getByRole('menuitem', { name: /^New profile/ })).toBeTruthy();

  // The switcher is the rows under its own heading (kit2's `AppMenu` writes a menu label, which is
  // what a menu says "these belong together" with).
  const switcher = within(menu).getByText('Switch profile').parentElement;
  if (switcher === null) throw new Error('the switcher lost its heading');
  expect(
    within(switcher)
      .getAllByRole('menuitem')
      .map((item) => item.textContent),
  ).toEqual(['My account']);
});

test('renders the cards of the plan, in order, with their anchors', () => {
  const { container } = renderApp();
  const ids = [...container.querySelectorAll('section[id]')].map((node) => node.id);
  // The March section brings its own `<section id="march">` when M-08 lands; until then the
  // contract's stub is a line of text, and the four setup cards are the page.
  const expected = SECTIONS.map((section) => section.id).filter(
    (id) => id !== 'march' || ids.includes('march'),
  );
  expect(ids).toEqual(expected);
});

test('a card that folds says which way it is folded', () => {
  const { container } = renderApp();
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
  renderApp();
  // jsdom reports a narrow window, so the frame is the phone one: the bottom app bar carries the
  // one Generate there is, next to the summary that opens the recap (frame V1).
  expect(screen.getAllByRole('button', { name: /generate/i })).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Open the march recap' })).toBeTruthy();
});

test('the About panel names the game data version and the privacy promise', async () => {
  renderApp();
  const menu = await openAccountMenu();
  fireEvent.click(within(menu).getByRole('menuitem', { name: /^About Pyrrhic/ }));

  // About is a chunk of its own (T-06); Vitest transforms it on demand, so it may take a moment.
  const dialog = await screen.findByRole('dialog', {}, { timeout: 10_000 });
  expect(dialog.textContent).toContain(String(gameData.dataVersion));
  expect(dialog.textContent).toContain(gameData.verifiedOn);
  expect(dialog.textContent).toContain('Nothing leaves your browser');
}, 20_000);

test('the theme row writes the choice to the store and to the document', async () => {
  renderApp();
  const menu = await openAccountMenu();
  fireEvent.click(within(menu).getByRole('radio', { name: 'Dark' }));

  await waitFor(() => {
    expect(useStore.getState().doc.ui.theme).toBe('dark');
  });
  expect(document.documentElement.dataset.theme).toBe('dark');
});
