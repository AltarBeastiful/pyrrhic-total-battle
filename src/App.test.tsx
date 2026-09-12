// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

test('renders the application heading and the profile bar', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1, name: 'Pyrrhic' })).toBeTruthy();
  expect(screen.getByLabelText('Active profile')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'New profile' })).toBeTruthy();
});

test('renders the seven sections of the plan, in order, with their anchors', () => {
  const { container } = render(<App />);
  const headings = screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent);
  expect(headings).toEqual(SECTIONS.map((section) => section.title));
  for (const section of SECTIONS) {
    expect(container.querySelector(`section#${section.id}`)).not.toBeNull();
  }
});

test('a section body can be collapsed and expanded', () => {
  render(<App />);
  const toggle = screen.getByRole('button', { name: 'Troops', expanded: true });
  fireEvent.click(toggle);
  expect(screen.getByRole('button', { name: 'Troops', expanded: false })).toBeTruthy();
});

test('the About panel names the game data version and the privacy promise', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'About' }));
  const dialog = screen.getByRole('dialog');
  expect(dialog.textContent).toContain(String(gameData.dataVersion));
  expect(dialog.textContent).toContain(gameData.verifiedOn);
  expect(dialog.textContent).toContain('Nothing leaves your browser');
});

test('the theme control writes the choice to the store and to the document', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'dark' } });
  expect(useStore.getState().doc.ui.theme).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
});
