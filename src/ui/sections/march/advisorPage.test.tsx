// @vitest-environment jsdom
/**
 * **The "What to upgrade next" card on the page** (W17 C4): the March runs for real — a Generate plans on the
 * inline calculation client, the bar and the card draw from what it answered — and the advisor's pass is a
 * double held open until the test answers it, the way `advisorSearch.test.tsx` holds it.
 *
 * What this file is about is the card among the rest of the March: Compute shows the rows ranked on the bar's
 * stop, Cancel stops the pass, a new Generate forgets the rows, a cut pass is labelled, and **Generate never
 * waits on the card** — it plans first and on its own client, whatever the card's pass is doing.
 */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import type { AdvisorRow, ProbeInfo, ShownMarch, StopAdvice } from '@/engine/advisor';
import type { PlanPick } from '@/engine/plan';
import type { Probe } from '@/engine/probes';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';
import { useResultStore } from '@/ui/resultStore';
import type { AdvisorOptions, AdvisorResult } from '@/worker/advisor';
import type * as WorkerClient from '@/worker/client';
import type { CalcPool } from '@/worker/pool';

import { setAdvisorPool, useAdvisorStore } from './advisorSearch';
import { MarchSection } from './MarchSection';
import { NO_RAISE } from './raise';
import { pickOf, useRunStore } from './runStore';

/** What reached a calculation, in order: the page's plan jobs and the card's passes. */
const events: string[] = [];

// The page's one client is the inline engine, as in `march.test.tsx`; its plan jobs are logged on the way in.
vi.mock('@/ui/calcClient', async () => {
  const { createInlineClient } = await vi.importActual<typeof WorkerClient>('@/worker/client');
  const client = createInlineClient();
  const logged = {
    ...client,
    plan: (...args: Parameters<typeof client.plan>) => {
      events.push('plan');
      return client.plan(...args);
    },
  };
  return { getCalcClient: () => logged, disposeCalcClient: () => undefined };
});

/** One pass the card asked for, held open until the test answers it. */
interface Pass {
  probes: Probe[];
  options: AdvisorOptions;
  resolve: (result: AdvisorResult) => void;
}
const passes: Pass[] = [];

vi.mock('@/worker/advisor', async () => {
  const { abortError } = await vi.importActual<typeof WorkerClient>('@/worker/client');
  return {
    runAdvisor: (_input: unknown, probes: Probe[], _pool: unknown, options: AdvisorOptions) =>
      new Promise<AdvisorResult>((resolve, reject) => {
        events.push('advisor');
        // The real pass rejects with an AbortError when its signal fires; so does the double.
        options.signal?.addEventListener('abort', () => {
          reject(abortError());
        });
        passes.push({ probes, options, resolve });
      }),
  };
});

const march = (damage: number): ShownMarch => ({
  counts: {},
  bill: { damage, silver: 0, gold: 0, hired: 0, dragonCoins: 0, seconds: 0 },
  deaths: [],
});

function stop(pick: PlanPick, gain: number): StopAdvice {
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
  };
}

const HEALTH: ProbeInfo = { id: 'health:ranged', family: 'health', label: 'Health +1 % ranged' };
const STRENGTH: ProbeInfo = {
  id: 'strength:guardsmen',
  family: 'strength',
  label: 'Strength +1 % guardsmen',
};

/**
 * The pass's answer over the stops the real plan offers: health is worth 1 % everywhere and strength 3 %, so
 * the ranking on the bar's stop is strength first — the reverse of the order the pass hands them in.
 */
function answer(cut: ProbeInfo[] = []): AdvisorResult {
  const picks = (useRunStore.getState().plan?.alternatives ?? []).map((row) => row.pick);
  const rows: AdvisorRow[] = [
    { ...HEALTH, stops: picks.map((pick) => stop(pick, 1)) },
    { ...STRENGTH, stops: picks.map((pick) => stop(pick, 3)) },
  ];
  return {
    baseline: picks.map((pick) => ({ pick, counts: {}, march: march(8_000_000) })),
    rows,
    cut,
    failed: [],
  };
}

beforeEach(() => {
  events.length = 0;
  passes.length = 0;
  window.localStorage.clear();
  setAdvisorPool({
    map: () => Promise.resolve([]),
    alive: 0,
    busy: false,
    dispose: () => undefined,
  } as CalcPool);
  // A plan needs a mercenary stock to plan from (`planCampaign` refuses an army with none), as the
  // Mercenaries card would give it; the setup is `march.test.tsx`'s plan test.
  const root = newRoot();
  const stocked = root.profiles[0];
  if (stocked === undefined) throw new Error('newRoot() must create one profile');
  stocked.mercenaries.selected = [
    { id: 'epic-monster-hunter-6', cap: 92 },
    { id: 'arbalester-6', cap: 76 },
    { id: 'legionary-6', cap: 72 },
    { id: 'chariot-6', cap: 37 },
  ];
  useStore.getState().replaceDocument(root);
  useStore.getState().updateActiveSetup((current) => ({
    housing: { leadership: 4_100, authority: 2_000, dominance: 0 },
    options: { ...current.options, method: 'plan' },
  }));
  useResultStore.getState().clear();
  useRunStore.getState().reset();
  useRunStore.setState({ raiseModes: NO_RAISE });
  useAdvisorStore.getState().stop();
});

afterEach(() => {
  cleanup();
  setAdvisorPool(null);
});

/** Press Generate and wait for a plan that is not `before`. */
async function generate(): Promise<void> {
  const before = useRunStore.getState().plan;
  fireEvent.click(screen.getByRole('button', { name: /^Generate march/ }));
  await waitFor(
    () => {
      const plan = useRunStore.getState().plan;
      expect(plan).not.toBeNull();
      expect(plan).not.toBe(before);
    },
    { timeout: 20_000 },
  );
}

const card = () => screen.getByRole('region', { name: 'What to upgrade next' });

/** Press Compute and answer the pass it started. */
async function computeAndAnswer(result: () => AdvisorResult): Promise<void> {
  fireEvent.click(within(card()).getByRole('button', { name: 'Compute default upgrades' }));
  expect(passes).toHaveLength(1);
  await act(async () => {
    passes[0]?.resolve(result());
    await Promise.resolve();
  });
}

test('Compute shows the rows, ranked on the stop the bar shows, and Generate never started it', async () => {
  renderWithTheme(<MarchSection />);
  await generate();
  // The card is there, idle: Generate planned and asked the card for nothing.
  expect(events).toEqual(['plan']);
  expect(passes).toHaveLength(0);
  expect(within(card()).queryAllByTestId('advisor-row')).toHaveLength(0);

  fireEvent.click(within(card()).getByRole('button', { name: 'Compute default upgrades' }));
  const plan = useRunStore.getState().plan;
  if (plan === null) throw new Error('Generate left no plan');
  expect(passes[0]?.options.headline).toBe(pickOf(plan, useRunStore.getState().planPick).pick);
  act(() => {
    passes[0]?.options.onProgress?.(12, 30);
  });
  expect(within(card()).getByText('12 / 30 done')).toBeTruthy();
  expect(within(card()).getByRole('button', { name: 'Cancel default upgrades' })).toBeTruthy();

  await act(async () => {
    passes[0]?.resolve(answer());
    await Promise.resolve();
  });
  const rows = within(card()).getAllByTestId('advisor-row').slice(0, 2);
  expect(rows.map((one) => one.textContent)).toEqual([
    expect.stringContaining('Strength +1 % guardsmen+3% worth'),
    expect.stringContaining('Health +1 % ranged+1% worth'),
  ]);
  expect(within(card()).getByRole('button', { name: 'Compute default upgrades again' })).toBeTruthy();
  expect(screen.queryByText(/cut stopped/u)).toBeNull();
}, 30_000);

test('Cancel stops the pass through its signal and says where it stopped', async () => {
  renderWithTheme(<MarchSection />);
  await generate();
  fireEvent.click(within(card()).getByRole('button', { name: 'Compute default upgrades' }));
  act(() => {
    passes[0]?.options.onProgress?.(3, 30);
  });
  await act(async () => {
    fireEvent.click(within(card()).getByRole('button', { name: 'Cancel default upgrades' }));
    await Promise.resolve();
  });
  expect(passes[0]?.options.signal?.aborted).toBe(true);
  expect(within(card()).getByText('Cancelled at 3 / 30')).toBeTruthy();
  expect(within(card()).queryAllByTestId('advisor-row')).toHaveLength(0);
  expect(within(card()).getByRole('button', { name: 'Compute default upgrades' })).toBeTruthy();
}, 30_000);

test('a new Generate forgets the rows, and the card waits on its button again', async () => {
  renderWithTheme(<MarchSection />);
  await generate();
  await computeAndAnswer(answer);
  expect(within(card()).getAllByTestId('advisor-row').length).toBeGreaterThan(0);

  await generate();
  expect(within(card()).queryAllByTestId('advisor-row')).toHaveLength(0);
  expect(within(card()).getByRole('button', { name: 'Compute default upgrades' })).toBeTruthy();
  // The second Generate started no pass of its own either.
  expect(passes).toHaveLength(1);
  expect(useAdvisorStore.getState().entries.default).toBeNull();
}, 60_000);

test('a pass the clock cut is labelled', async () => {
  renderWithTheme(<MarchSection />);
  await generate();
  await computeAndAnswer(() => answer([HEALTH]));
  expect(within(card()).getByText('The 20 s cut stopped 1 upgrade before it finished.')).toBeTruthy();
  // The probes that did finish are still read.
  expect(within(card()).getAllByTestId('advisor-row').length).toBeGreaterThan(0);
}, 30_000);

test('Generate is never delayed by a running pass: it plans first, on its own client, and stops the pass', async () => {
  renderWithTheme(<MarchSection />);
  await generate();
  fireEvent.click(within(card()).getByRole('button', { name: 'Compute default upgrades' }));
  expect(events).toEqual(['plan', 'advisor']);

  // The pass is never answered: the plan lands all the same, so nothing in Generate waits on it.
  await generate();
  expect(events).toEqual(['plan', 'advisor', 'plan']);
  expect(passes[0]?.options.signal?.aborted).toBe(true);
  expect(passes).toHaveLength(1);
  expect(within(card()).queryByText(/done$/u)).toBeNull();
  expect(within(card()).getByRole('button', { name: 'Compute default upgrades' })).toBeTruthy();
}, 60_000);

test('each button computes only its own list, on the page', async () => {
  renderWithTheme(<MarchSection />);
  await generate();
  const profile = selectActiveProfile(useStore.getState());
  if (profile === undefined) throw new Error('the default document has a profile');
  // Nothing typed: "my upgrades" is off and says why; the default pass is not.
  expect(
    (within(card()).getByRole('button', { name: 'Compute my upgrades' }) as HTMLButtonElement).disabled,
  ).toBe(true);
  expect(within(card()).getByText('Type an upgrade first.')).toBeTruthy();
  act(() => {
    useStore.getState().updateProfile(profile.id, () => ({
      upgrades: [{ id: 'talent', label: 'Talent: army health III', deltas: { health: { army: 2 } } }],
    }));
  });
  expect(within(card()).queryByText('Type an upgrade first.')).toBeNull();

  fireEvent.click(within(card()).getByRole('button', { name: 'Compute my upgrades' }));
  expect(passes).toHaveLength(1);
  expect(passes[0]?.probes.map((probe) => probe.id)).toEqual(['user:talent']);
  fireEvent.click(within(card()).getByRole('button', { name: 'Compute default upgrades' }));
  expect(passes).toHaveLength(2);
  expect(passes[1]?.probes).toHaveLength(29);

  // Cancel is per kind: the default pass goes on while the typed one stops.
  await act(async () => {
    fireEvent.click(within(card()).getByRole('button', { name: 'Cancel my upgrades' }));
    await Promise.resolve();
  });
  expect(passes[0]?.options.signal?.aborted).toBe(true);
  expect(passes[1]?.options.signal?.aborted).toBe(false);
  expect(within(card()).getByRole('button', { name: 'Cancel default upgrades' })).toBeTruthy();
  expect(within(card()).getByRole('button', { name: 'Compute my upgrades' })).toBeTruthy();

  await act(async () => {
    passes[1]?.resolve(answer());
    await Promise.resolve();
  });
  expect(within(card()).getByText('Default upgrades')).toBeTruthy();
  expect(within(card()).queryByText('Your upgrades')).toBeNull();
}, 30_000);
