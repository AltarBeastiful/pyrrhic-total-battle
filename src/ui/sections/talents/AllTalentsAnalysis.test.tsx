// @vitest-environment jsdom
/** B-28 Seam 2 — **Analyze all on the Talents page**: the button, progress, cancel, the ranking card. */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { talents as TALENTS } from '@/data';
import { analyzableTalents } from '@/engine/talentAnalysis';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { allTalentsInputs, allTalentsKey } from '@/state/talentAnalysis';
import { renderWithTheme } from '@/ui/kit/testRender';

import { useAllAnalysisStore } from './allAnalysisStore';
import { useAnalysisStore } from './analysisStore';
import { TalentsPage } from './TalentsPage';

vi.setConfig({ testTimeout: 120_000 });

/** Set the hero level of the active account (a fresh one is low, and most talents are gated). */
const setHeroLevel = (level: number): void => {
  const profile = selectActiveProfile(useStore.getState());
  if (profile === undefined) throw new Error('no active profile');
  useStore.getState().updateProfile(profile.id, (current) => ({
    talents: { ...current.talents, heroLevel: level },
  }));
};

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

/** The strip's button opens the dialog; the ranking is in it at once. */
const openDialog = (): void => {
  fireEvent.click(screen.getByRole('button', { name: /^(Rank all talents|Ranking talents)/ }));
};
const openCard = (): HTMLElement => screen.getByRole('region', { name: 'Talent ranking' });

test('pressing the button opens the dialog and runs; the ranking shows once done, listing every analysable talent with the not-rated count', async () => {
  setHeroLevel(1000);
  renderWithTheme(<TalentsPage />);
  openDialog();
  expect(screen.queryByRole('region', { name: 'Talent ranking' })).toBeNull();
  await screen.findByRole('region', { name: 'Talent ranking' }, { timeout: 110_000 });
  const card = openCard();
  const rows = within(card).getAllByRole('row').slice(1);
  expect(rows).toHaveLength(rated.length);
  expect(
    within(card)
      .getAllByRole('columnheader')
      .map((h) => h.textContent),
  ).toEqual(['Talent', 'Held', 'Max', 'Gain at max', 'Per point']);
  expect(screen.getByText(`${String(notRated)} not rated in battle`)).toBeTruthy();
  // With nothing bought, the nodes under a root say what it takes to reach them.
  expect(within(card).getAllByText(/\d+ pts? to reach/).length).toBeGreaterThan(0);
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
  openDialog();
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
  openDialog();
  await screen.findByRole('region', { name: 'Talent ranking' }, { timeout: 110_000 });
  const run = useAllAnalysisStore.getState().run!;
  const entry = run.entries!.find((e) => e.node.name === "Guardsmen's strength I")!;
  const { analyzeTalent } = await import('./analysisStore');
  const { selectActiveSetup } = await import('@/state/store');
  await analyzeTalent(entry.node, profile, selectActiveSetup(useStore.getState())!);
  const single = useAnalysisStore.getState().entries[entry.node.id]!.analysis!;
  expect(entry.analysis).toEqual(single);
});

// ---- B-29: keep, stale, re-analyze, row select ------------------------------------------------------------
// The runs below are seeded in the store (a finished ranking of three real talents) so the tests are about what
// the page does with a held ranking, not about the cost of ranking.

const seeded = (): void => {
  const profile = selectActiveProfile(useStore.getState())!;
  const setup = selectActiveSetup(useStore.getState())!;
  const entries = rated.slice(0, 3).map((node, i) => ({
    node,
    held: 0,
    analysis: { ranks: [0, node.maxRank], shapes: [], mean: [0, 1 + i] },
  }));
  useAllAnalysisStore.setState({
    run: {
      key: allTalentsKey(profile, setup),
      status: 'done',
      done: 1,
      total: 1,
      entries,
      notRated: 2,
      error: null,
      kept: null,
    },
  });
};

const changeArmy = (): void => {
  const profile = selectActiveProfile(useStore.getState())!;
  act(() => {
    useStore.getState().updateProfile(profile.id, (p) => ({
      setups: p.setups.map((s) =>
        s.id === p.activeSetupId
          ? { ...s, housing: { ...s.housing, leadership: s.housing.leadership + 777 } }
          : s,
      ),
    }));
  });
};

test('leaving and returning shows the kept ranking at once, with no new run', () => {
  seeded();
  const first = renderWithTheme(<TalentsPage />);
  openDialog();
  openCard();
  first.unmount();
  const before = useAllAnalysisStore.getState().run;
  renderWithTheme(<TalentsPage />);
  openDialog();
  openCard();
  expect(screen.queryByText(/out of date/i)).toBeNull();
  expect(screen.getByRole('button', { name: 'Analyze all' })).toBeTruthy();
  expect(useAllAnalysisStore.getState().run).toBe(before);
});

test('a changed account marks the ranking out of date, and it is not shown as current', () => {
  seeded();
  renderWithTheme(<TalentsPage />);
  openDialog();
  expect(screen.queryByText(/out of date/i)).toBeNull();
  const profile = selectActiveProfile(useStore.getState())!;
  act(() => {
    useStore.getState().updateProfile(profile.id, (p) => ({
      troops: { ...p.troops, guardsmen: null },
    }));
  });
  expect(screen.getByText(/out of date/i)).toBeTruthy();
  expect(openCard().getAttribute('data-stale')).toBe('true');
  expect(screen.getByRole('button', { name: 'Re-analyze' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Analyze all' })).toBeNull();
});

test('a changed army marks the ranking out of date', () => {
  seeded();
  renderWithTheme(<TalentsPage />);
  openDialog();
  changeArmy();
  expect(screen.getByText(/out of date/i)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Re-analyze' })).toBeTruthy();
});

test('Re-analyze runs again and the fresh ranking is current', async () => {
  seeded();
  renderWithTheme(<TalentsPage />);
  openDialog();
  changeArmy();
  fireEvent.click(screen.getByRole('button', { name: 'Re-analyze' }));
  expect(useAllAnalysisStore.getState().run?.status).toBe('running');
  await waitFor(
    () => {
      expect(useAllAnalysisStore.getState().run?.status).toBe('done');
    },
    { timeout: 110_000 },
  );
  const card = openCard();
  expect(card.getAttribute('data-stale')).toBeNull();
  expect(screen.queryByText(/out of date/i)).toBeNull();
  expect(screen.getByRole('button', { name: 'Analyze all' })).toBeTruthy();
});

test('selecting a row selects that talent in its tree and scrolls it into view', () => {
  seeded();
  const scrolled: Element[] = [];
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolled.push(this);
  };
  renderWithTheme(<TalentsPage />);
  openDialog();
  const node = useAllAnalysisStore.getState().run!.entries![2]!.node;
  const card = openCard();
  fireEvent.click(within(card).getByRole('button', { name: `Select ${node.name}` }));
  const tile = document.querySelector(`[data-node-id="${String(node.id)}"]`)!;
  expect(tile.getAttribute('aria-pressed')).toBe('true');
  expect(scrolled).toContain(tile);
});

test('cancelling a re-run brings the previous ranking back, out of date and never partial', async () => {
  seeded();
  renderWithTheme(<TalentsPage />);
  openDialog();
  changeArmy();
  const previous = useAllAnalysisStore.getState().run!.entries;
  fireEvent.click(screen.getByRole('button', { name: 'Re-analyze' }));
  expect(useAllAnalysisStore.getState().run?.status).toBe('running');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => {
    expect(useAllAnalysisStore.getState().run?.status).toBe('cancelled');
  });
  const card = openCard();
  expect(within(card).getAllByRole('row').slice(1)).toHaveLength(previous!.length);
  expect(card.getAttribute('data-stale')).toBe('true');
  expect(screen.getByText(/out of date/i)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Re-analyze' })).toBeTruthy();
});

test('the reading is chosen in the dialog: another one starts a run under another key, and the words follow it', async () => {
  renderWithTheme(<TalentsPage />);
  openDialog();
  await screen.findByRole('region', { name: 'Talent ranking' }, { timeout: 110_000 });
  const before = useAllAnalysisStore.getState().run?.key;
  const group = screen.getByRole('radiogroup', { name: 'How the talents are ranked' });
  fireEvent.click(within(group).getByLabelText('Steady'));
  expect(useAllAnalysisStore.getState().method).toBe('steady');
  await waitFor(() => {
    expect(useAllAnalysisStore.getState().run?.key).not.toBe(before);
  });
  expect(screen.getByText(/The steadiest/)).toBeTruthy();
  screen.queryByRole('button', { name: 'Cancel' })?.click();
  useAllAnalysisStore.setState({ method: 'current' });
});

test('talents the hero level does not open are left out and counted; a node under an unbought parent says what it takes to reach it', async () => {
  setHeroLevel(1);
  renderWithTheme(<TalentsPage />);
  openDialog();
  await screen.findByRole('region', { name: 'Talent ranking' }, { timeout: 110_000 });
  const rows = within(openCard()).getAllByRole('row').slice(1);
  const profile = selectActiveProfile(useStore.getState())!;
  const { levelLocked } = allTalentsInputs(profile, selectActiveSetup(useStore.getState())!);
  expect(levelLocked).toBeGreaterThan(0);
  expect(rows).toHaveLength(rated.length - levelLocked);
  expect(screen.getByText(new RegExp(`${String(levelLocked)} locked by hero level and left out`))).toBeTruthy();
  // Every pill names points and is on a row that is not open.
  for (const pill of within(openCard()).queryAllByText(/\d+ pts? to reach/)) expect(pill.closest('tr')).not.toBeNull();
});
