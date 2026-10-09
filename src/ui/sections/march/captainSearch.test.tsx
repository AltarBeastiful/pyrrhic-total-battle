// @vitest-environment jsdom
/**
 * **The captain section's state machine** (W17 C5): the pass starts on the button only, runs the advice and then
 * the upgrades against the *lead trio* the advice found, under one clock; Cancel stops it and says so; an answer
 * for a question no longer on screen is dropped; a roster or march-type edit makes the answer stale. Both worker
 * passes are doubles here — what they compute is held in `src/worker/captainAdvice.test.ts` and
 * `captainUpgrades.test.ts`; this file is about the order, the progress, the states and the key.
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { CAMPAIGN } from '@/config';
import type { ShownStop } from '@/engine/advisor';
import type { CampaignInput, CampaignPlan } from '@/engine/plan';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import type { CaptainAdviceOptions, CaptainAdviceResult } from '@/worker/captainAdvice';
import type {
  CaptainUpgradeOptions,
  CaptainUpgradeResult,
  UpgradeAsk,
  UpgradeLead,
} from '@/worker/captainUpgrades';
import { abortError } from '@/worker/client';
import type { CalcPool } from '@/worker/pool';

import { setAdvisorPool } from './advisorSearch';
import { captainKey, computeCaptains, useCaptainAdvice, useCaptainStore } from './captainSearch';
import { useRunStore } from './runStore';

/** One advice pass the double was asked for, held open until the test answers it. */
interface AdvicePass {
  currentKey: string;
  trios: { key: string }[];
  options: CaptainAdviceOptions;
  resolve: (result: CaptainAdviceResult) => void;
  reject: (error: Error) => void;
}
/** One upgrade pass, likewise. */
interface UpgradePass {
  lead: UpgradeLead;
  asks: readonly UpgradeAsk[];
  options: CaptainUpgradeOptions;
  resolve: (result: CaptainUpgradeResult) => void;
}
const advices: AdvicePass[] = [];
const upgrades: UpgradePass[] = [];

vi.mock('@/worker/captainAdvice', () => ({
  runCaptainAdvice: (
    _input: unknown,
    trios: { key: string }[],
    currentKey: string,
    _pool: unknown,
    options: CaptainAdviceOptions,
  ) =>
    new Promise<CaptainAdviceResult>((resolve, reject) => {
      options.signal?.addEventListener('abort', () => {
        reject(abortError());
      });
      advices.push({ currentKey, trios, options, resolve, reject });
    }),
}));

vi.mock('@/worker/captainUpgrades', () => ({
  runCaptainUpgrades: (
    _input: unknown,
    lead: UpgradeLead,
    asks: readonly UpgradeAsk[],
    _pool: unknown,
    options: CaptainUpgradeOptions,
  ) =>
    new Promise<CaptainUpgradeResult>((resolve, reject) => {
      options.signal?.addEventListener('abort', () => {
        reject(abortError());
      });
      upgrades.push({ lead, asks, options, resolve });
    }),
}));

const PLAN = {
  alternatives: [
    { pick: 'sweet-spot', counts: {} },
    { pick: 'all-in', counts: {} },
  ],
} as unknown as CampaignPlan;

const CURRENT = 'aydae,skadi,sofia';
const BEST = 'aydae,beowulf,skadi';

const stops = [
  { pick: 'sweet-spot', counts: {} },
  { pick: 'all-in', counts: {} },
] as unknown as ShownStop[];

/** The advice the double answers with: the best trio on both stops of the bar is `BEST`. */
function adviceOf(over: Partial<CaptainAdviceResult> = {}): CaptainAdviceResult {
  return {
    currentKey: CURRENT,
    baseline: stops,
    screens: [],
    screenCut: false,
    confirmed: [BEST],
    rows: [],
    plans: { [CURRENT]: stops, [BEST]: stops },
    best: stops.map((stop) => ({ pick: stop.pick, trio: BEST, gain: 3, advice: null })),
    cut: [],
    failed: [],
    ...over,
  };
}

const upgradesOf = (over: Partial<CaptainUpgradeResult> = {}): CaptainUpgradeResult => ({
  lead: BEST,
  rows: [],
  cut: [],
  failed: [],
  ...over,
});

const INPUT = {} as CampaignInput;

/** Four captains owned, the first three on the march: the current trio is `CURRENT`. */
function ownFour(): void {
  const profile = selectActiveProfile(useStore.getState());
  if (profile === undefined) throw new Error('the default document has no profile');
  const setup = selectActiveSetup(useStore.getState());
  if (setup === undefined) throw new Error('the default document has no setup');
  const ids = ['aydae', 'skadi', 'sofia', 'beowulf'];
  act(() => {
    useStore.getState().updateProfile(profile.id, (current) => ({
      sources: {
        ...current.sources,
        captains: ids.map((captainId, index) => ({ id: `c${String(index)}`, captainId, level: 10, star: 1 })),
      },
    }));
    useStore.getState().updateActiveSetup({ active: { ...setup.active, captains: ['c0', 'c1', 'c2'] } });
  });
}

function start(): Promise<void> {
  const profile = selectActiveProfile(useStore.getState());
  const setup = selectActiveSetup(useStore.getState());
  if (profile === undefined || setup === undefined) throw new Error('no profile');
  return computeCaptains(captainKey(PLAN, INPUT, profile, setup), INPUT, profile, setup);
}

beforeEach(() => {
  advices.length = 0;
  upgrades.length = 0;
  setAdvisorPool({ map: () => Promise.resolve([]), alive: 0, dispose: () => undefined } as CalcPool);
  useStore.getState().replaceDocument(newRoot());
  useRunStore.getState().reset();
  useCaptainStore.getState().stop();
  ownFour();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  setAdvisorPool(null);
});

describe('the pass', () => {
  test('the advice goes out with every trio, the current one first; then the upgrades go against the lead trio', async () => {
    const pass = start();
    expect(useCaptainStore.getState().entry).toMatchObject({ status: 'running', done: 0 });
    expect(advices).toHaveLength(1);
    expect(advices[0]?.currentKey).toBe(CURRENT);
    expect(advices[0]?.trios[0]?.key).toBe(CURRENT);
    // Four captains, three-sided: four trios.
    expect(advices[0]?.trios).toHaveLength(4);
    expect(upgrades).toHaveLength(0);

    advices[0]?.options.onProgress?.(3, 5);
    expect(useCaptainStore.getState().entry).toMatchObject({ done: 3, total: 5 });
    advices[0]?.resolve(adviceOf());
    await vi.waitFor(() => {
      expect(upgrades).toHaveLength(1);
    });

    // The upgrades are read against the best trio's own plan, with the clock that is left.
    expect(upgrades[0]?.lead.key).toBe(BEST);
    expect(upgrades[0]?.lead.stops).toBe(stops);
    expect(upgrades[0]?.options.budgetMs).toBeLessThanOrEqual(CAMPAIGN.budgets.extra);
    // Each captain: a star below the top, a level, ten levels.
    const ids = upgrades[0]?.asks.map((ask) => ask.id) ?? [];
    expect(ids).toContain('captain:beowulf:star');
    expect(ids).toContain('captain:sofia:level10');
    expect(upgrades[0]?.asks.find((ask) => ask.id === 'captain:aydae:star')?.label).toMatch(/ ★1 → ★2$/);

    // Their progress follows the advice's, on one count.
    upgrades[0]?.options.onProgress?.(2, 6);
    expect(useCaptainStore.getState().entry).toMatchObject({ done: 7, total: 11 });
    upgrades[0]?.resolve(upgradesOf());
    await pass;
    const entry = useCaptainStore.getState().entry;
    expect(entry?.status).toBe('done');
    expect(entry?.result?.lead).toBe(BEST);
  });

  test('where no trio gains the upgrades are read against the current trio', async () => {
    const pass = start();
    advices[0]?.resolve(
      adviceOf({
        best: stops.map((stop) => ({ pick: stop.pick, trio: CURRENT, gain: 0, advice: null })),
        plans: { [CURRENT]: stops },
      }),
    );
    await vi.waitFor(() => {
      expect(upgrades).toHaveLength(1);
    });
    expect(upgrades[0]?.lead.key).toBe(CURRENT);
    upgrades[0]?.resolve(upgradesOf({ lead: CURRENT }));
    await pass;
    expect(useCaptainStore.getState().entry?.result?.lead).toBe(CURRENT);
  });

  test('the clock spent by the advice leaves no upgrade pass, and reads cut', async () => {
    const pass = start();
    vi.spyOn(performance, 'now').mockReturnValue(performance.now() + CAMPAIGN.budgets.extra + 1);
    advices[0]?.resolve(adviceOf());
    await pass;
    expect(upgrades).toHaveLength(0);
    const entry = useCaptainStore.getState().entry;
    expect(entry?.status).toBe('cut');
    expect(entry?.result?.upgrades).toBeNull();
  });

  test('an unfinished trio or upgrade reads cut; a baseline that failed reads failed', async () => {
    const cut = start();
    advices[0]?.resolve(adviceOf({ cut: [BEST] }));
    await vi.waitFor(() => {
      expect(upgrades).toHaveLength(1);
    });
    upgrades[0]?.resolve(upgradesOf());
    await cut;
    expect(useCaptainStore.getState().entry?.status).toBe('cut');

    const failed = start();
    advices[1]?.reject(new Error('baseline broke'));
    await failed;
    expect(useCaptainStore.getState().entry).toMatchObject({ status: 'failed', error: 'baseline broke' });
  });

  test('Cancel aborts the pass through its signal and reads cancelled; a late answer is dropped', async () => {
    const pass = start();
    advices[0]?.options.onProgress?.(1, 5);
    useCaptainStore.getState().cancel();
    await pass;
    expect(advices[0]?.options.signal?.aborted).toBe(true);
    expect(useCaptainStore.getState().entry).toMatchObject({ status: 'cancelled', done: 1, result: null });
    expect(upgrades).toHaveLength(0);
  });

  test('Cancel in the upgrade pass stops that one too', async () => {
    const pass = start();
    advices[0]?.resolve(adviceOf());
    await vi.waitFor(() => {
      expect(upgrades).toHaveLength(1);
    });
    useCaptainStore.getState().cancel();
    await pass;
    expect(upgrades[0]?.options.signal?.aborted).toBe(true);
    expect(useCaptainStore.getState().entry?.status).toBe('cancelled');
  });

  test('a newer pass aborts the older one; the older answer is dropped', async () => {
    const first = start();
    const second = start();
    expect(advices[0]?.options.signal?.aborted).toBe(true);
    useCaptainStore.getState().settle('stale', { advice: adviceOf(), upgrades: null, lead: CURRENT });
    expect(useCaptainStore.getState().entry?.status).toBe('running');
    advices[1]?.reject(new Error('stop'));
    await Promise.all([first, second]);
  });
});

describe('the hook', () => {
  test('never starts a pass on its own, and computes on demand', () => {
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    const { result: view } = renderHook(() => useCaptainAdvice());
    expect(view.current.owned).toBe(4);
    expect(view.current.status).toBe('idle');
    expect(advices).toHaveLength(0);
    act(() => {
      view.current.compute();
    });
    expect(advices).toHaveLength(1);
    expect(view.current.status).toBe('running');
  });

  test('ranks the upgrade rows on the stop the bar shows, without a new pass', async () => {
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    const { result: view } = renderHook(() => useCaptainAdvice());
    act(() => {
      view.current.compute();
    });
    const row = (id: string, sweet: number, allIn: number) => ({
      id,
      family: 'captains' as const,
      label: id,
      trios: [BEST, BEST],
      planned: [BEST],
      stops: [
        { pick: 'sweet-spot', gain: sweet },
        { pick: 'all-in', gain: allIn },
      ],
    });
    await act(async () => {
      advices[0]?.resolve(adviceOf());
      await vi.waitFor(() => {
        expect(upgrades).toHaveLength(1);
      });
      upgrades[0]?.resolve(
        upgradesOf({ rows: [row('a', 1, 9), row('b', 5, 2)] as unknown as CaptainUpgradeResult['rows'] }),
      );
      await vi.waitFor(() => {
        expect(view.current.status).toBe('done');
      });
    });
    expect(view.current.rows.map((one) => one.id)).toEqual(['b', 'a']);
    act(() => {
      useRunStore.setState({ planPick: 1 });
    });
    expect(view.current.rows.map((one) => one.id)).toEqual(['a', 'b']);
    expect(advices).toHaveLength(1);
  });

  test('a new Generate stops a running pass and forgets it', () => {
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    const { result: view } = renderHook(() => useCaptainAdvice());
    act(() => {
      view.current.compute();
    });
    act(() => {
      useRunStore.getState().start(new AbortController());
    });
    expect(advices[0]?.options.signal?.aborted).toBe(true);
    expect(useCaptainStore.getState().entry).toBeNull();
    expect(view.current.status).toBe('idle');
  });

  test('a march type or a captain level edit under a standing plan makes the answer stale', async () => {
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    const { result: view } = renderHook(() => useCaptainAdvice());
    act(() => {
      view.current.compute();
    });
    await act(async () => {
      advices[0]?.resolve(adviceOf());
      await vi.waitFor(() => {
        expect(upgrades).toHaveLength(1);
      });
      upgrades[0]?.resolve(upgradesOf());
      await vi.waitFor(() => {
        expect(view.current.status).toBe('done');
      });
    });
    act(() => {
      useStore.getState().updateActiveSetup({ marchType: 'solo' });
    });
    expect(view.current.status).toBe('idle');
    expect(useCaptainStore.getState().entry).toBeNull();
  });

  test('a captain on the bench levelled is another question too', () => {
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    const { result: view } = renderHook(() => useCaptainAdvice());
    act(() => {
      view.current.compute();
    });
    const profile = selectActiveProfile(useStore.getState());
    if (profile === undefined) throw new Error('no profile');
    act(() => {
      useStore.getState().updateProfile(profile.id, (current) => ({
        sources: {
          ...current.sources,
          captains: current.sources.captains.map((entry) =>
            entry.id === 'c3' ? { ...entry, level: 11 } : entry,
          ),
        },
      }));
    });
    expect(useCaptainStore.getState().entry).toBeNull();
    expect(advices[0]?.options.signal?.aborted).toBe(true);
  });

  test('no captain owned: the section has nothing to say', () => {
    const profile = selectActiveProfile(useStore.getState());
    if (profile === undefined) throw new Error('no profile');
    act(() => {
      useStore.getState().updateProfile(profile.id, (current) => ({
        sources: { ...current.sources, captains: [] },
      }));
    });
    useRunStore.setState({ plan: PLAN, planPick: 0 });
    const { result: view } = renderHook(() => useCaptainAdvice());
    expect(view.current.owned).toBe(0);
  });
});
