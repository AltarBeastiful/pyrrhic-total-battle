// @vitest-environment jsdom
/**
 * **The Heroes report popup** (`docs/plans/hero-report.md`): it draws a kept report block by block, folds the heroes
 * that matter nowhere into one line, marks the situations pending validation, and says when the report is stale. The
 * report is built by the model (`buildHeroReport`); what it computes is held in `src/engine/heroReport.test.ts`.
 */
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { buildHeroChampion } from '@/engine/heroChampion';
import { buildHeroReport } from '@/engine/heroReport';
import { renderWithTheme } from '@/ui/kit/testRender';

import { HeroReportDialog } from './HeroReport';
import { useHeroStore, type HeroView } from './heroReportSearch';

const heroes = ['a', 'b', 'c', 'd'].map((captainId) => ({
  captainId,
  name: captainId.toUpperCase(),
  level: 5,
  star: 1,
  pairs: { types: captainId === 'a' ? ['melee'] : [], mercs: captainId === 'a' ? ['Legionary VI'] : [] },
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
  worth: {
    solo: [
      { id: 'a-star', label: 'A', captainId: 'a', kind: 'star', size: 1, worth: 10, raw: [10] },
      { id: 'a-star2', label: 'A', captainId: 'a', kind: 'star', size: 2, worth: 3, raw: [-6] },
      { id: 'b-level', label: 'B', captainId: 'b', kind: 'level', size: 5, worth: 6, raw: [6] },
    ],
    trio: [{ id: 'c-star', label: 'C', captainId: 'c', kind: 'star', size: 1, worth: 4, raw: [4] }],
  },
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

const champion = buildHeroChampion({
  heroes: [...heroes, { captainId: 'e', name: 'E' }].map(({ captainId, name }) => ({
    captainId,
    name,
    level: 5,
    star: 1,
  })),
  ratings: {
    a: grid((star) => 30 + 3 * star),
    b: grid((star) => 31 + 2 * star),
    c: grid((star) => 31.5 - 5 * star),
    d: grid(() => 1),
    e: grid(() => 0.5),
  },
  valleyCurves: { a: [30, 33, 31, 40, 42, 44, 46] },
  podium: ['a', 'b', 'c'],
  trios: {
    now: [
      { captainIds: ['a', 'b', 'c'], rating: 40 },
      { captainIds: ['a', 'b', 'd'], rating: 38 },
    ],
    ladders: [],
  },
});

function grid(f: (star: number) => number) {
  return [0, 1, 2, 3, 4, 5, 6].flatMap((star) => [5, 100].map((level) => ({ star, level, rating: f(star) })));
}

test('draws the champion, the podium, the tiers and the Replaced row, the situations marked pending validation', async () => {
  const withChampion = { ...report, champion };
  renderWithTheme(
    <HeroReportDialog
      view={view({
        entry: { key: 'k', status: 'done', done: 3, total: 3, report: withChampion, error: null },
      })}
    />,
  );
  expect(screen.getByTestId('hero-podium')).toBeTruthy();
  expect(screen.getByTestId('champion-name').textContent).toContain('A');
  expect(screen.getByTestId('champion-challenger').textContent).toContain('Challenger B');
  expect(within(screen.getByTestId('champion-tier-S')).getByTestId('champion-tile-a')).toBeTruthy();
  await userEvent.click(screen.getByText('Replaced'));
  expect(within(screen.getByTestId('champion-replaced')).getByText(/e — beaten everywhere by/)).toBeTruthy();
  expect(screen.getByTestId('champion-valleys').textContent).toContain('★2 loses 2.0');
  expect(screen.getByText(/pending validation/)).toBeTruthy();
  expect(screen.getByTestId('hero-matrix')).toBeTruthy();
  expect(screen.getByText(/Zed — the best of the easiest heroes/)).toBeTruthy();
});

test('flags a hero whose planned points were partly cut, and only that hero', () => {
  const cut = buildHeroChampion({
    heroes: [
      { captainId: 'a', name: 'A', level: 5, star: 1 },
      { captainId: 'b', name: 'B', level: 5, star: 1 },
    ],
    ratings: { a: grid((star) => 30 + star), b: grid((star) => 40 + star).slice(0, 4) },
    planned: { a: 14, b: 14 },
  });
  renderWithTheme(
    <HeroReportDialog
      view={view({
        entry: {
          key: 'k',
          status: 'done',
          done: 3,
          total: 3,
          report: { ...report, champion: cut },
          error: null,
        },
      })}
    />,
  );
  expect(screen.getByTestId('champion-partial-b')).toBeTruthy();
  expect(screen.queryByTestId('champion-partial-a')).toBeNull();
});

test('tells a surprising trio, and draws the report before the champion lands', () => {
  const withChampion = { ...report, champion };
  const { unmount } = renderWithTheme(
    <HeroReportDialog
      view={view({
        entry: { key: 'k', status: 'running', done: 1, total: 3, report: withChampion, error: null },
      })}
    />,
  );
  expect(screen.getAllByTestId('hero-surprise')).toHaveLength(1);
  unmount();
  renderWithTheme(<HeroReportDialog view={view()} />);
  expect(screen.queryByTestId('champion-story')).toBeNull();
  expect(screen.getByTestId('hero-podium')).toBeTruthy();
  expect(screen.getByText('Best trio across all plans')).toBeTruthy();
});

test('warns when the clock cut the pass, and stays quiet otherwise', () => {
  const { unmount } = renderWithTheme(<HeroReportDialog view={view()} />);
  expect(screen.queryByTestId('hero-cut')).toBeNull();
  unmount();
  const cut = { ...report, cuts: ['3 of 4 lineups had their upgrades unread'] };
  renderWithTheme(
    <HeroReportDialog
      view={view({ entry: { key: 'k', status: 'done', done: 1, total: 1, report: cut, error: null } })}
    />,
  );
  expect(screen.getByTestId('hero-cut').textContent).toContain('3 of 4 lineups had their upgrades unread');
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
