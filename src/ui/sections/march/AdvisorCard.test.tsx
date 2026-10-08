// @vitest-environment jsdom
/**
 * **The "What to upgrade next" card's drawing** (W17 C4): the button, the progress, Cancel, the cut note, the
 * ranked rows on the headline stop, "no gain" kept on the list, the faint `worse` line, and the other stops
 * folded. The card is handed a view here; the state behind it is `advisorSearch.test.tsx`'s.
 */
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { rankAdvice, type AdvisorRow, type ShownMarch, type StopAdvice } from '@/engine/advisor';
import type { CampaignPlan, PlanPick } from '@/engine/plan';
import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';
import type { AdvisorResult } from '@/worker/advisor';
import type { CalcPool } from '@/worker/pool';

import { AdvisorCard, AdvisorFold, type AdvisorCardProps } from './AdvisorCard';
import { setAdvisorPool } from './advisorSearch';
import { useRunStore } from './runStore';

afterEach(cleanup);

const march = (damage: number): ShownMarch => ({
  counts: {},
  bill: { damage, silver: 0, gold: 0, hired: 0, dragonCoins: 0, seconds: 0 },
  deaths: [],
});

function stop(pick: PlanPick, gain: number, extra: Partial<StopAdvice> = {}): StopAdvice {
  return {
    pick,
    current: march(8_000_000),
    repriced: march(8_000_000 * (1 + gain / 100)),
    replanned: null,
    repricedRating: gain,
    replannedRating: null,
    gain,
    from: gain > 0 ? 'repriced' : null,
    clamped: false,
    damagePercent: gain,
    noise: false,
    reorder: false,
    worse: false,
    ...extra,
  };
}

const ROWS: AdvisorRow[] = [
  {
    id: 'health:ranged',
    family: 'health',
    label: 'Health +1 % ranged',
    stops: [stop('sweet-spot', 0, { clamped: true }), stop('all-in', 3)],
  },
  {
    id: 'strength:guardsmen',
    family: 'strength',
    label: 'Strength +1 % guardsmen',
    stops: [stop('sweet-spot', 2.4), stop('all-in', 0.5)],
  },
  {
    id: 'housing:leadership',
    family: 'housing',
    label: 'Leadership +1 %',
    stops: [
      stop('sweet-spot', 0, { worse: true, replanned: march(7_812_345), replannedRating: -2 }),
      stop('all-in', 1),
    ],
  },
];

const RESULT: AdvisorResult = {
  baseline: [
    { pick: 'sweet-spot', counts: {}, march: march(8_000_000) },
    { pick: 'all-in', counts: {}, march: march(9_000_000) },
  ],
  rows: ROWS,
  cut: [],
  failed: [],
};

function props(over: Partial<AdvisorCardProps> = {}): AdvisorCardProps {
  return {
    status: 'idle',
    done: 0,
    total: 0,
    headline: 'sweet-spot',
    rows: [],
    result: null,
    error: null,
    compute: vi.fn(),
    cancel: vi.fn(),
    ...over,
  };
}

const done = (over: Partial<AdvisorCardProps> = {}): AdvisorCardProps =>
  props({ status: 'done', done: 4, total: 4, rows: rankAdvice(ROWS, 'sweet-spot'), result: RESULT, ...over });

test('idle: one Compute button and no rows', async () => {
  const compute = vi.fn();
  renderWithTheme(<AdvisorCard {...props({ compute })} />);
  expect(screen.getByText('What to upgrade next')).toBeTruthy();
  expect(screen.queryAllByTestId('advisor-row')).toHaveLength(0);
  await userEvent.click(screen.getByRole('button', { name: 'Compute' }));
  expect(compute).toHaveBeenCalledOnce();
});

test('running: the progress is spoken and the button is Cancel', async () => {
  const cancel = vi.fn();
  renderWithTheme(<AdvisorCard {...props({ status: 'running', done: 12, total: 30, cancel })} />);
  expect(screen.getByText('12 / 30 done').getAttribute('aria-live')).toBe('polite');
  expect(screen.queryByRole('button', { name: 'Compute' })).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(cancel).toHaveBeenCalledOnce();
});

test('done: rows ranked on the headline stop, "no gain" kept, no minus anywhere', () => {
  renderWithTheme(<AdvisorCard {...done()} />);
  const region = screen.getByRole('region', { name: 'What to upgrade next' });
  // The headline list comes first; the other stops are folded below it.
  const rows = within(region).getAllByTestId('advisor-row').slice(0, 3);
  expect(rows.map((one) => one.textContent)).toEqual([
    expect.stringContaining('Strength +1 % guardsmen+2.4% worth'),
    expect.stringContaining('Health +1 % rangedno gain'),
    expect.stringContaining('Leadership +1 %no gain'),
  ]);
  expect(rows[0]?.textContent).toContain('+2.4% damage, 8.2M a march');
  expect(region.textContent).not.toMatch(/-\d/u);
  expect(screen.getByRole('button', { name: 'Compute again' })).toBeTruthy();
});

test('a gain too small for the tenth reads "under 0.1%", never "0% worth"', () => {
  // Found by the e2e journey (J7): a real pass priced Health +1 % army at a 0.04 % gain, printed "0% worth".
  const tiny: AdvisorRow = { ...ROWS[0]!, stops: [stop('sweet-spot', 0.04, { damagePercent: 0.1 })] };
  renderWithTheme(<AdvisorCard {...done({ rows: [tiny] })} />);
  const row = screen.getAllByTestId('advisor-row')[0];
  expect(row?.textContent).toContain('under 0.1% worth');
  expect(row?.textContent).not.toContain('0% worth');
  expect(row?.textContent).toContain('+0.1% damage');
});

test('the exact figure is one hover away where the notation rounds', () => {
  renderWithTheme(<AdvisorCard {...done()} />);
  expect(screen.getAllByTitle('8 192 000').length).toBeGreaterThan(0);
});

test('a worse re-plan says so, faintly, with the re-planned figure', () => {
  renderWithTheme(<AdvisorCard {...done()} />);
  expect(screen.getByText(/the plan gets worse here: search issue/u).textContent).toContain('7.8M');
});

test('the other stops are folded, each ranked on itself', async () => {
  renderWithTheme(<AdvisorCard {...done()} />);
  const fold = screen.getByRole('button', { name: /Other stops/u });
  expect(fold.getAttribute('aria-expanded')).toBe('false');
  await userEvent.click(fold);
  expect(screen.getByText('All in')).toBeTruthy();
  const rows = screen.getAllByTestId('advisor-row').slice(3);
  expect(rows.map((one) => one.textContent)).toEqual([
    expect.stringContaining('Health +1 % ranged+3% worth'),
    expect.stringContaining('Leadership +1 %+1% worth'),
    expect.stringContaining('Strength +1 % guardsmen+0.5% worth'),
  ]);
});

test('a cut pass is labelled, and no cut note otherwise', () => {
  const { unmount } = renderWithTheme(<AdvisorCard {...done()} />);
  expect(screen.queryByText(/cut stopped/u)).toBeNull();
  unmount();
  renderWithTheme(
    <AdvisorCard
      {...done({
        status: 'cut',
        result: { ...RESULT, cut: [{ id: 'x', family: 'health', label: 'x' }, ROWS[0]!] },
      })}
    />,
  );
  expect(screen.getByText('The 20 s cut stopped 2 upgrades before they finished.')).toBeTruthy();
});

test('a failed pass says why in one line', () => {
  renderWithTheme(<AdvisorCard {...props({ status: 'failed', error: 'baseline broke' })} />);
  expect(screen.getByText('The upgrades could not be read: baseline broke')).toBeTruthy();
});

test('cancelled: the progress it reached, and Compute offered again', () => {
  renderWithTheme(<AdvisorCard {...props({ status: 'cancelled', done: 3, total: 30 })} />);
  expect(screen.getByText('Cancelled at 3 / 30')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Compute' })).toBeTruthy();
});

test('no per-cost column: no v1 probe has a cost', () => {
  renderWithTheme(<AdvisorCard {...done()} />);
  expect(screen.queryByText(/per cost|a silver/iu)).toBeNull();
});

describe('where the March mounts it', () => {
  const PLAN = {
    alternatives: [
      { pick: 'sweet-spot', counts: {} },
      { pick: 'all-in', counts: {} },
    ],
  } as unknown as CampaignPlan;

  beforeEach(() => {
    useStore.getState().replaceDocument(newRoot());
    useRunStore.getState().reset();
  });
  afterEach(() => {
    setAdvisorPool(null);
  });

  test('no plan, no card', () => {
    setAdvisorPool({ map: () => Promise.resolve([]), alive: 0, dispose: () => undefined } as CalcPool);
    renderWithTheme(<AdvisorFold />);
    expect(screen.queryByRole('region', { name: 'What to upgrade next' })).toBeNull();
    expect(screen.queryByText(/upgrade next/u)).toBeNull();
  });

  test('a plan and a worker: the card, idle on its button', () => {
    setAdvisorPool({ map: () => Promise.resolve([]), alive: 0, dispose: () => undefined } as CalcPool);
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    renderWithTheme(<AdvisorFold />);
    expect(screen.getByRole('region', { name: 'What to upgrade next' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Compute' })).toBeTruthy();
  });

  test('a plan on a platform with no worker: one line says why, no button', () => {
    vi.stubGlobal('Worker', undefined);
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    renderWithTheme(<AdvisorFold />);
    expect(screen.getByText(/needs a browser that can compute in the background/u)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Compute' })).toBeNull();
    vi.unstubAllGlobals();
  });
});
