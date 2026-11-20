// @vitest-environment jsdom
/** B-28 Seam 2 — **Analyze all on the Talents page**: the button, progress, cancel, the ranking card. */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { talents as TALENTS } from '@/data';
import { analyzableTalents } from '@/engine/talentAnalysis';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

import { useAllAnalysisStore } from './allAnalysisStore';
import { useAnalysisStore } from './analysisStore';
import { TalentsPage } from './TalentsPage';

vi.setConfig({ testTimeout: 120_000 });

beforeEach(() => {
  globalThis.localStorage.clear();
  useStore.getState().replaceDocument(newRoot());
  useAnalysisStore.setState({ entries: {} });
  useAllAnalysisStore.setState({ run: null });
});

afterEach(() => {
  cleanup();
});

const { rated, notRated } = analyzableTalents(TALENTS);

test('the ranking is collapsed until pressed, then lists every analysable talent with the not-rated count', async () => {
  renderWithTheme(<TalentsPage />);
  expect(screen.queryByRole('region', { name: 'Talent ranking' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze all' }));
  const card = await screen.findByRole('region', { name: 'Talent ranking' }, { timeout: 110_000 });
  const rows = within(card).getAllByRole('row').slice(1);
  expect(rows).toHaveLength(rated.length);
  expect(
    within(card)
      .getAllByRole('columnheader')
      .map((h) => h.textContent),
  ).toEqual(['Talent', 'Held', 'Max', 'Gain at max', 'Per point']);
  expect(screen.getByText(`${String(notRated)} not rated in battle`)).toBeTruthy();
  // Default sort is gain per point, best first.
  const perPoint = rows.map((row) => within(row).getAllByRole('cell')[4]?.textContent ?? '');
  const numbers = perPoint.map((text) => Number.parseFloat(text)).filter((n) => !Number.isNaN(n));
  expect(numbers).toEqual([...numbers].sort((a, b) => b - a));
  expect(
    within(card)
      .getByRole('columnheader', { name: /Per point/ })
      .getAttribute('aria-sort'),
  ).toBe('descending');
});

test('progress is shown while it runs, and cancel stops it without a partial ranking', async () => {
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Analyze all' }));
  expect(screen.getByText(/^Analyzing/)).toBeTruthy();
  expect(screen.getByRole('progressbar')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => {
    expect(useAllAnalysisStore.getState().run?.status).toBe('cancelled');
  });
  expect(screen.queryByRole('region', { name: 'Talent ranking' })).toBeNull();
  expect(useAllAnalysisStore.getState().run?.entries).toBeNull();
  expect(screen.getByText(/cancelled/i)).toBeTruthy();
  // And the page can ask again.
  expect(screen.getByRole('button', { name: 'Analyze all' })).toBeTruthy();
});

test('a talent row matches the single Analyze of the same talent, to the digit', async () => {
  const profile = selectActiveProfile(useStore.getState())!;
  renderWithTheme(<TalentsPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Analyze all' }));
  await screen.findByRole('region', { name: 'Talent ranking' }, { timeout: 110_000 });
  const run = useAllAnalysisStore.getState().run!;
  const entry = run.entries!.find((e) => e.node.name === "Guardsmen's strength I")!;
  const { analyzeTalent } = await import('./analysisStore');
  const { selectActiveSetup } = await import('@/state/store');
  await analyzeTalent(entry.node, profile, selectActiveSetup(useStore.getState())!);
  const single = useAnalysisStore.getState().entries[entry.node.id]!.analysis!;
  expect(entry.analysis).toEqual(single);
});
