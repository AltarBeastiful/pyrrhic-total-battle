// @vitest-environment jsdom
/** B-24 Seam 2 — **Analyze in the talent detail**: the button, the table, the chart, stale, cancel. */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { talents as TALENTS } from '@/data';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

import { useAnalysisStore } from './analysisStore';
import { TalentsPage } from './TalentsPage';

// The first render of the page is slow under a full run; the default 5 s is for small tests.
vi.setConfig({ testTimeout: 30_000 });

beforeEach(() => {
  globalThis.localStorage.clear();
  useStore.getState().replaceDocument(newRoot());
  useAnalysisStore.setState({ entries: {} });
});

afterEach(() => {
  cleanup();
});

const battleNode = () => TALENTS.find((t) => t.tree === 'battle' && t.name === "Guardsmen's strength I")!;
const economyNode = () => TALENTS.find((t) => t.tree === 'economy' && t.parents.length === 0)!;

function open(tree: 'Battle tactics' | 'Economy', name: string): void {
  const profile = selectActiveProfile(useStore.getState())!;
  useStore.getState().updateProfile(profile.id, {
    talents: {
      ...profile.talents,
      heroLevel: 150,
      pointsOverride: 50,
      goals:
        tree === 'Battle tactics' ? ['battle', 'economy', 'archeology'] : ['economy', 'battle', 'archeology'],
    },
  });
  renderWithTheme(<TalentsPage />);
  fireEvent.click(
    within(screen.getByRole('region', { name: `${tree} tree` })).getByRole('button', {
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, rank`),
    }),
  );
}

test('a battle talent offers Analyze, and pressing it shows the table of ranks and then the chart', async () => {
  const node = battleNode();
  open('Battle tactics', node.name);
  expect(screen.queryByTestId('analysis-chart')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  const table = await screen.findByRole('region', { name: `${node.name} rating by rank` });
  const head = within(table)
    .getAllByRole('columnheader')
    .map((h) => h.textContent);
  expect(head).toEqual(['Rank', 'Pool 100 %', 'Pool 80 %', 'Average']);
  const rows = within(table).getAllByRole('row').slice(1);
  // The highest rank first, and no baseline row.
  expect(rows.map((row) => within(row).getAllByRole('cell')[0]?.textContent)).toEqual([
    '20',
    '15',
    '10',
    '5',
  ]);
  expect(screen.getByLabelText(/can win/i).textContent).toMatch(/rating.*at rank 20/);
  // The table comes first, the chart after it.
  const chart = screen.getByTestId('analysis-chart');
  expect(table.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('a talent the battle does not read has no Analyze button', () => {
  open('Economy', economyNode().name);
  expect(screen.queryByRole('button', { name: 'Analyze' })).toBeNull();
  expect(screen.getByText(/nothing to analyze/i)).toBeTruthy();
});

test('a result goes stale when the army changes, and Re-analyze asks again', async () => {
  open('Battle tactics', battleNode().name);
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  await screen.findByTestId('analysis-chart');
  expect(screen.queryByText(/out of date/i)).toBeNull();
  const profile = selectActiveProfile(useStore.getState())!;
  const setup = selectActiveSetup(useStore.getState())!;
  act(() => {
    useStore.getState().updateProfile(profile.id, {
      setups: profile.setups.map((s) =>
        s.id === setup.id ? { ...s, housing: { ...s.housing, leadership: s.housing.leadership + 500 } } : s,
      ),
    });
  });
  expect(await screen.findByText(/out of date/i)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Re-analyze' }));
  await waitFor(() => {
    expect(screen.queryByText(/out of date/i)).toBeNull();
  });
});

test('selecting another tile while it runs cancels the analysis', () => {
  const node = battleNode();
  open('Battle tactics', node.name);
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  const other = TALENTS.find((t) => t.tree === 'battle' && t.name === "Guardsmen's strength II")!;
  fireEvent.click(
    within(screen.getByRole('region', { name: 'Battle tactics tree' })).getByRole('button', {
      name: new RegExp(`^${other.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, rank`),
    }),
  );
  expect(useAnalysisStore.getState().entries[node.id]?.status).toBe('cancelled');
});

// ---- B-25: the baseline ----

function holdRank(rank: number): void {
  const profile = selectActiveProfile(useStore.getState())!;
  useStore.getState().updateProfile(profile.id, {
    talents: { ...profile.talents, ranks: { [String(battleNode().id)]: rank } },
  });
}

test('after a copy Analyze says "from your rank N" and lists only the ranks above it', async () => {
  const node = battleNode();
  holdRank(5);
  open('Battle tactics', node.name);
  fireEvent.click(screen.getByRole('button', { name: 'Copy to battle bonuses' }));
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  const table = await screen.findByRole('region', { name: `${node.name} rating by rank` });
  expect(screen.getByText(/from your rank 5/i)).toBeTruthy();
  const rows = within(table).getAllByRole('row').slice(1);
  const shown = rows.map((row) => Number(within(row).getAllByRole('cell')[0]?.textContent));
  expect(shown[0]).toBe(20);
  expect(shown.every((rank) => rank > 5)).toBe(true);
});

test('without a copy Analyze says "from rank 0"', async () => {
  const node = battleNode();
  holdRank(5);
  open('Battle tactics', node.name);
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  await screen.findByRole('region', { name: `${node.name} rating by rank` });
  expect(screen.getByText(/from rank 0/i)).toBeTruthy();
});

test('a copy makes a held result stale, and a talent at its maximum says nothing is left to buy', async () => {
  const node = battleNode();
  holdRank(5);
  open('Battle tactics', node.name);
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  await screen.findByTestId('analysis-chart');
  fireEvent.click(screen.getByRole('button', { name: 'Copy to battle bonuses' }));
  expect(await screen.findByText(/out of date/i)).toBeTruthy();
  act(() => {
    holdRank(node.maxRank);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Copy to battle bonuses' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: /replace/i }));
  expect(await screen.findByText(/nothing left to buy/i)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /analyze/i })).toBeNull();
});

test('at maximum rank a held result is not shown', async () => {
  const node = battleNode();
  holdRank(5);
  open('Battle tactics', node.name);
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  await screen.findByTestId('analysis-chart');
  act(() => {
    holdRank(node.maxRank);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Copy to battle bonuses' }));
  expect(await screen.findByText(/nothing left to buy/i)).toBeTruthy();
  expect(screen.queryByTestId('analysis-chart')).toBeNull();
});
