// @vitest-environment jsdom
/**
 * **The Heroes report popup** (`docs/plans/hero-report.md`): it draws a kept report block by block, folds the heroes
 * that matter nowhere into one line, marks the situations pending validation, and says when the report is stale. The
 * report is built by the model (`buildHeroReport`); what it computes is held in `src/engine/heroReport.test.ts`.
 */
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { buildHeroReport } from '@/engine/heroReport';
import { renderWithTheme } from '@/ui/kit/testRender';

import { HeroReportDialog } from './HeroReport';
import { useHeroStore, type HeroView } from './heroReportSearch';

const heroes = ['a', 'b', 'c', 'd'].map((captainId) => ({
  captainId,
  name: captainId.toUpperCase(),
  level: 5,
  star: 1,
}));

function reading(solo: Record<string, number>) {
  const ids = Object.keys(solo);
  return {
    solo: Object.fromEntries(ids.map((id) => [id, [solo[id] ?? 0]])),
    trios: ids.map((skip) => {
      const captainIds = ids.filter((id) => id !== skip);
      return { captainIds, stops: [captainIds.reduce((sum, id) => sum + (solo[id] ?? 0), 0)] };
    }),
  };
}

const report = buildHeroReport({
  stops: ['sweet-spot'],
  heroes,
  readings: { default: reading({ a: 10, b: 8, c: 6, d: 0 }), monsters: reading({ a: 4, b: 8, c: 6, d: 9 }) },
  worth: [
    { id: 'a-star', label: 'A', captainId: 'a', kind: 'star', size: 1, worth: 10 },
    { id: 'b-level', label: 'B', captainId: 'b', kind: 'level', size: 5, worth: 6 },
  ],
  catalog: [
    { captainId: 'a', name: 'A', difficulty: 2, rating: 5, owned: true },
    { captainId: 'z', name: 'Zed', difficulty: 3, rating: 9, owned: false },
  ],
});

function view(over: Partial<HeroView> = {}): HeroView {
  return {
    owned: 4,
    ready: true,
    entry: { key: 'k', status: 'done', done: 3, total: 3, report, error: null },
    stale: false,
    open: true,
    setOpen: () => undefined,
    analyse: () => undefined,
    cancel: () => undefined,
    ...over,
  };
}

beforeEach(() => {
  useHeroStore.setState({ entry: null, open: false });
});
afterEach(cleanup);

test('draws the banner, the board, the best trio and the situation matrix marked pending validation', () => {
  renderWithTheme(<HeroReportDialog view={view()} />);
  const banner = screen.getByTestId('hero-banner');
  expect(within(banner).getByText(/A ★ \+1/)).toBeTruthy();
  expect(within(banner).getByText(/B \+5 levels/)).toBeTruthy();
  expect(screen.getByTestId('hero-a')).toBeTruthy();
  expect(screen.getByText(/pending validation/)).toBeTruthy();
  expect(screen.getByTestId('hero-matrix')).toBeTruthy();
  expect(screen.getByText(/Zed — the best of the easiest heroes/)).toBeTruthy();
  expect(screen.getByText('Best trio across all plans')).toBeTruthy();
});

test('says so when the report was asked about an earlier state of the account', () => {
  renderWithTheme(<HeroReportDialog view={view({ stale: true })} />);
  expect(screen.getByText(/earlier state of your account/)).toBeTruthy();
});

test('a running pass shows its progress and Cancel', () => {
  renderWithTheme(
    <HeroReportDialog
      view={view({ entry: { key: 'k', status: 'running', done: 2, total: 5, report: null, error: null } })}
    />,
  );
  expect(screen.getByText(/2 of 5/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
});
