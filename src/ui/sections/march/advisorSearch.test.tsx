// @vitest-environment jsdom
/**
 * **The advisor card's state machine** (W17 C4): a pass starts on the button only, Cancel stops it and says so,
 * an answer for a plan no longer on screen is dropped, a pass the clock cut reads `cut`, and a failed baseline
 * reads `failed`. The pass itself is a double here — what it computes is held in `src/worker/advisor.test.ts`;
 * what this file is about is the states and the keys.
 */
import { act, cleanup, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  probeInfo,
  type AdvisorRow,
  type ProbeInfo,
  type ShownMarch,
  type StopAdvice,
} from '@/engine/advisor';
import type { CampaignInput, CampaignPlan } from '@/engine/plan';
import type { Probe } from '@/engine/probes';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';
import type { AdvisorOptions, AdvisorResult } from '@/worker/advisor';
import { abortError } from '@/worker/client';
import type { CalcPool } from '@/worker/pool';

import { AdvisorFold } from './AdvisorCard';
import { advisorKey, computeAdvice, setAdvisorPool, useAdvisor, useAdvisorStore } from './advisorSearch';
import { useRunStore } from './runStore';

/** One pass the double was asked for, held open until the test answers it. */
interface Pass {
  probes: Probe[];
  options: AdvisorOptions;
  resolve: (result: AdvisorResult) => void;
  reject: (error: Error) => void;
}
const passes: Pass[] = [];

vi.mock('@/worker/advisor', () => ({
  runAdvisor: (_input: unknown, probes: Probe[], _pool: unknown, options: AdvisorOptions) =>
    new Promise<AdvisorResult>((resolve, reject) => {
      // The real pass rejects with an AbortError when its signal fires; so does the double.
      options.signal?.addEventListener('abort', () => {
        reject(abortError());
      });
      passes.push({ probes, options, resolve, reject });
    }),
}));

const PROBE: ProbeInfo = { id: 'p', family: 'health', label: 'Health +1' };

function row(id: string, sweet: number, allIn: number): AdvisorRow {
  const stop = (pick: 'sweet-spot' | 'all-in', gain: number) =>
    ({
      pick,
      gain,
      damagePercent: gain,
      clamped: false,
      worse: false,
    }) as unknown as AdvisorRow['stops'][number];
  return { ...PROBE, id, stops: [stop('sweet-spot', sweet), stop('all-in', allIn)] } as AdvisorRow;
}

function result(cut: ProbeInfo[] = []): AdvisorResult {
  return { baseline: [], rows: [row('a', 1, 9), row('b', 5, 2)], cut, failed: [] };
}

const PLAN = {
  alternatives: [
    { pick: 'sweet-spot', counts: {} },
    { pick: 'all-in', counts: {} },
  ],
} as unknown as CampaignPlan;
const INPUT = {} as CampaignInput;

beforeEach(() => {
  passes.length = 0;
  setAdvisorPool({ map: () => Promise.resolve([]), alive: 0, dispose: () => undefined } as CalcPool);
  useStore.getState().replaceDocument(newRoot());
  useRunStore.getState().reset();
  useAdvisorStore.getState().stop();
});

afterEach(() => {
  cleanup();
  setAdvisorPool(null);
});

describe('the store', () => {
  test('a pass runs, counts its progress and settles done', async () => {
    const key = advisorKey(PLAN, INPUT);
    const pass = computeAdvice(key, INPUT);
    expect(useAdvisorStore.getState().entry).toMatchObject({ key, status: 'running', done: 0, total: 30 });
    passes[0]?.options.onProgress?.(12, 30);
    expect(useAdvisorStore.getState().entry).toMatchObject({ done: 12, total: 30 });
    passes[0]?.resolve(result());
    await pass;
    expect(useAdvisorStore.getState().entry?.status).toBe('done');
  });

  test('a pass the clock cut reads cut', async () => {
    const key = advisorKey(PLAN, INPUT);
    const pass = computeAdvice(key, INPUT);
    passes[0]?.resolve(result([PROBE]));
    await pass;
    expect(useAdvisorStore.getState().entry?.status).toBe('cut');
  });

  test('a failed baseline reads failed, with the reason', async () => {
    const key = advisorKey(PLAN, INPUT);
    const pass = computeAdvice(key, INPUT);
    passes[0]?.reject(new Error('baseline broke'));
    await pass;
    expect(useAdvisorStore.getState().entry).toMatchObject({ status: 'failed', error: 'baseline broke' });
  });

  test('Cancel aborts the pass through its signal and reads cancelled; a late answer is dropped', async () => {
    const key = advisorKey(PLAN, INPUT);
    const pass = computeAdvice(key, INPUT);
    passes[0]?.options.onProgress?.(3, 30);
    useAdvisorStore.getState().cancel();
    await pass;
    expect(passes[0]?.options.signal?.aborted).toBe(true);
    expect(useAdvisorStore.getState().entry).toMatchObject({ status: 'cancelled', done: 3, result: null });
    useAdvisorStore.getState().settle(key, result());
    expect(useAdvisorStore.getState().entry?.status).toBe('cancelled');
  });

  test('an answer for another key is dropped', async () => {
    const pass = computeAdvice('old', INPUT);
    const next = computeAdvice('new', INPUT);
    expect(passes[0]?.options.signal?.aborted).toBe(true);
    useAdvisorStore.getState().settle('old', result());
    useAdvisorStore.getState().progress('old', 7, 30);
    expect(useAdvisorStore.getState().entry).toMatchObject({ key: 'new', status: 'running', done: 0 });
    passes[1]?.resolve(result());
    await Promise.all([pass, next]);
    expect(useAdvisorStore.getState().entry).toMatchObject({ key: 'new', status: 'done' });
  });
});

describe('the hook', () => {
  test('never starts a pass on its own, and computes on demand', () => {
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    const { result: view } = renderHook(() => useAdvisor());
    expect(view.current.status).toBe('idle');
    expect(view.current.available).toBe(true);
    expect(passes).toHaveLength(0);
    act(() => {
      view.current.compute();
    });
    expect(passes).toHaveLength(1);
    expect(passes[0]?.options.headline).toBe('sweet-spot');
    expect(view.current.status).toBe('running');
  });

  test('ranks the rows on the stop the bar shows, without a new pass', async () => {
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    const { result: view } = renderHook(() => useAdvisor());
    act(() => {
      view.current.compute();
    });
    await act(async () => {
      passes[0]?.resolve(result());
      await Promise.resolve();
    });
    expect(view.current.rows.map((r) => r.id)).toEqual(['b', 'a']);
    act(() => {
      useRunStore.setState({ planPick: 1 });
    });
    expect(view.current.headline).toBe('all-in');
    expect(view.current.rows.map((r) => r.id)).toEqual(['a', 'b']);
    expect(passes).toHaveLength(1);
  });

  test('a new Generate stops a running pass and forgets its rows', () => {
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    const { result: view } = renderHook(() => useAdvisor());
    act(() => {
      view.current.compute();
    });
    act(() => {
      useRunStore.getState().start(new AbortController());
    });
    expect(passes[0]?.options.signal?.aborted).toBe(true);
    expect(useAdvisorStore.getState().entry).toBeNull();
    expect(view.current.status).toBe('idle');
    expect(view.current.available).toBe(false);
  });

  test('an account edit under a standing plan makes the rows stale', async () => {
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    const { result: view } = renderHook(() => useAdvisor());
    act(() => {
      view.current.compute();
    });
    await act(async () => {
      passes[0]?.resolve(result());
      await Promise.resolve();
    });
    expect(view.current.status).toBe('done');
    act(() => {
      useStore.getState().updateActiveSetup({ housing: { leadership: 1234, authority: 0, dominance: 0 } });
    });
    expect(view.current.status).toBe('idle');
    expect(view.current.rows).toEqual([]);
    expect(useAdvisorStore.getState().entry).toBeNull();
  });
});

describe('a typed upgrade, from the profile to the ranked card', () => {
  const march = (damage: number): ShownMarch => ({
    counts: {},
    bill: { damage, silver: 0, gold: 0, hired: 0, dragonCoins: 0, seconds: 0 },
    deaths: [],
  });
  /** One stop as the pass reads it: what the card draws needs the marches, not only the gain. */
  const read = (gain: number): StopAdvice => ({
    pick: 'sweet-spot',
    current: march(8_000_000),
    repriced: march(8_000_000 * (1 + gain / 100)),
    replanned: null,
    repricedRating: gain,
    replannedRating: null,
    gain,
    from: 'repriced',
    clamped: false,
    damagePercent: gain,
    noise: false,
    reorder: false,
    worse: false,
  });

  test('the pass reads it as a probe, and the card ranks it first with its gain per cost', async () => {
    const user = userEvent.setup();
    const profile = selectActiveProfile(useStore.getState());
    if (profile === undefined) throw new Error('the default document has no profile');
    act(() => {
      useStore.getState().updateProfile(profile.id, () => ({
        upgrades: [
          {
            id: 'upgrade-talent',
            label: 'Talent: army health III',
            deltas: { health: { army: 2 } },
            cost: { amount: 4, unit: 'talent points' },
          },
        ],
      }));
    });
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    renderWithTheme(<AdvisorFold />);
    await user.click(screen.getByRole('button', { name: 'Compute' }));

    const typed = passes[0]?.probes.find((probe) => probe.family === 'user');
    expect(typed).toMatchObject({
      id: 'user:upgrade-talent',
      label: 'Talent: army health III',
      cost: { amount: 4, unit: 'talent points' },
    });
    // A generic probe that gains more: with a cost typed, the costed row still comes first (its own group).
    const generic = passes[0]?.probes.find((probe) => probe.family !== 'user');
    const rows: AdvisorRow[] = [
      { ...probeInfo(generic!), stops: [read(5)] },
      { ...probeInfo(typed!), stops: [read(2)] },
    ];
    await act(async () => {
      passes[0]?.resolve({ baseline: [], rows, cut: [], failed: [] });
      await Promise.resolve();
    });

    const region = screen.getByRole('region', { name: 'What to upgrade next' });
    const shown = within(region).getAllByTestId('advisor-row');
    expect(shown[0]?.textContent).toContain('Talent: army health III+2% worth');
    expect(within(shown[0]!).getByTestId('advisor-per-cost').textContent).toBe(
      '+0.5% per talent points, costs 4 talent points',
    );
    expect(shown[1]?.textContent).toContain('+5% worth');
    expect(within(region).getByTestId('advisor-ordering').textContent).toBe(
      'Upgrades with a cost first, by gain per talent points; the others after, by gain.',
    );
  });
});
