// @vitest-environment jsdom
/** B-24 Seam 2 — **Analyze in the talent detail**: the button, the table, the chart, stale, cancel. */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { talents as TALENTS } from '@/data';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

import { useAnalysisStore } from './analysisStore';
import { TalentsPage } from './TalentsPage';

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

function open(tree: 'Battle' | 'Economy', name: string): void {
  const profile = selectActiveProfile(useStore.getState())!;
  useStore.getState().updateProfile(profile.id, {
    talents: {
      ...profile.talents,
      heroLevel: 150,
      pointsOverride: 50,
      goals: tree === 'Battle' ? ['battle', 'economy', 'archeology'] : ['economy', 'battle', 'archeology'],
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
  open('Battle', node.name);
  expect(screen.queryByTestId('analysis-chart')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  const table = await screen.findByRole('region', { name: `${node.name} rating by rank` });
  const head = within(table).getAllByRole('columnheader').map((h) => h.textContent);
  expect(head).toEqual(['Rank', 'Pool 100 %', 'Pool 80 %', 'Average']);
  const rows = within(table).getAllByRole('row').slice(1);
  expect(rows.map((row) => within(row).getAllByRole('cell')[0]?.textContent)).toEqual(['0', '5', '10', '15', '20']);
  expect(within(rows[0]!).getAllByRole('cell')[3]?.textContent).toBe('+0.00 %');
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
  open('Battle', battleNode().name);
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
  open('Battle', node.name);
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  const other = TALENTS.find((t) => t.tree === 'battle' && t.name === "Guardsmen's strength II")!;
  fireEvent.click(
    within(screen.getByRole('region', { name: 'Battle tree' })).getByRole('button', {
      name: new RegExp(`^${other.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, rank`),
    }),
  );
  expect(useAnalysisStore.getState().entries[node.id]?.status).toBe('cancelled');
});
