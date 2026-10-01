// @vitest-environment jsdom
/**
 * **Where the raise the March draws comes from, and when it is still coming** (S-149, and the follow-up the
 * owner found the next morning: *"it seems when clicking again on generate, we're still using ts tight version
 * instead of assembly script"*).
 *
 * `positionsSearch.test.tsx` holds the asking itself — how many jobs, in what order, and a slide that fires
 * none — and `march.test.tsx` holds the whole pane, but *its* client is the inline one, where the bar is
 * deliberately never priced (`positionsSearch.ts` stops on a host with no worker), so every raise there takes
 * the March's own path. **This is the one place the two meet**: the page is the real one — a plan, a march, the
 * control, the standing position — and the worker is a double that prices the bar with a **marker** and records
 * every search it is asked for. What it holds is the rule the owner's report is about: a press of Generate
 * re-prices the bar, and in the frames before its rows land the March **waits** rather than starting the
 * exhaustive search the wasm is about to answer.
 */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { unitById } from '@/data';
import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';
import { initResultPersistence, useResultStore } from '@/ui/resultStore';
import type * as WorkerClient from '@/worker/client';

import { MarchSection } from './MarchSection';
import type { PositionTrades } from './positions';
import { useRunStore } from './runStore';

/** The page's own client: the engine on the main thread, as every UI suite here runs it. */
vi.mock('@/ui/calcClient', async () => {
  const { createInlineClient } = await vi.importActual<typeof WorkerClient>('@/worker/client');
  const client = createInlineClient();
  return { getCalcClient: () => client, disposeCalcClient: () => undefined };
});

/** Every search the March asked for, as it was asked. */
const searches: { base: unknown; modes: unknown }[] = [];
/** Every bar the block asked for. */
const bars: number[] = [];

/**
 * The tables the double files: **the same marker for every stop and every position** — the hunter at seven,
 * which no march of this fixture fields — so a test can say where the counts came from without reproducing the
 * engine. What the real rows are is held elsewhere (`tests/kernel/raise-kernel.test.ts`, experiment 184).
 */
function marker(): PositionTrades {
  const zero = { damage: 1, mercLost: 1, units: 7, silver: 1, gold: 0, hiredDamage: 1 };
  const counts = { 'epic-monster-hunter-6': 7 };
  return {
    own: zero,
    rows: (['tens', 'most', 'v2', 'safe', 'tight'] as const).map((mode) => ({
      mode,
      counts,
      how: null,
      space: 0,
      scored: 0,
      ...zero,
    })),
  };
}

vi.mock('@/worker/client', async () => {
  const actual = await vi.importActual<typeof WorkerClient>('@/worker/client');
  return {
    isAbortError: actual.isAbortError,
    createCalcClient: () => ({
      mode: 'worker' as const,
      positions: (input: { counts: Record<string, number> }) => {
        bars.push(input.counts['unit-1'] ?? Object.keys(input.counts).length);
        // A frame of latency, which is what a real bar has and what the whole file is about.
        return new Promise((resolve) => {
          globalThis.setTimeout(() => {
            resolve(marker());
          }, 20);
        });
      },
      raise: (input: { base: unknown; modes: unknown }) => {
        searches.push(input);
        return Promise.resolve(null);
      },
      dispose: () => undefined,
    }),
  };
});

function Page() {
  useEffect(() => {
    return initResultPersistence();
  }, []);
  return <MarchSection />;
}

/**
 * The army the plan stops short on: a stocked hunter and a troop floor the shelter sits under. `leadership` is
 * the caller's, because the two tests want two different plans out of it — one that fields the hunter and
 * nothing else is asked of, and one with a **troop type left out**, which is what a March edit puts back.
 */
function stockedAccount(leadership = 12_000): void {
  const root = newRoot();
  const stocked = root.profiles[0];
  if (stocked === undefined) throw new Error('newRoot() must create one profile');
  stocked.mercenaries.selected = [
    { id: 'epic-monster-hunter-6', cap: 92 },
    { id: 'arbalester-6', cap: 76 },
    { id: 'legionary-6', cap: 72 },
    { id: 'chariot-6', cap: 37 },
  ];
  act(() => {
    useStore.getState().replaceDocument(root);
    useStore.getState().updateActiveSetup((current) => ({
      housing: { leadership, authority: 2_000, dominance: 0 },
      options: { ...current.options, method: 'plan' },
    }));
  });
}

/** The hunter's count as the pills read it — `data-stack` labels, the same reading `march.test.tsx` makes. */
function hunterCount(): number {
  const unit = unitById('epic-monster-hunter-6');
  const pill = document.querySelector(`#march [data-stack="${unit?.label ?? ''}"]`);
  return Number(pill?.getAttribute('data-count') ?? 0);
}

const generate = (): HTMLElement => screen.getByRole('button', { name: /^Generate march/ });

async function clicked(): Promise<void> {
  fireEvent.click(generate());
  await waitFor(() => {
    expect(useResultStore.getState().last).not.toBeNull();
  });
}

beforeEach(() => {
  window.localStorage.clear();
  useResultStore.getState().clear();
  useRunStore.getState().reset();
  searches.length = 0;
  bars.length = 0;
  stockedAccount();
});

afterEach(() => {
  cleanup();
});

test('a Generate re-prices the bar, and the raise it draws is the table’s — with no search asked for', async () => {
  renderWithTheme(<Page />);
  await clicked();
  const control = await screen.findByRole('radiogroup', { name: 'Mercenary counts' });
  fireEvent.click(within(control).getByRole('radio', { name: 'Tight' }));

  // The bar is priced, so the press lands on the table's own row — the marker — and nothing is searched.
  await waitFor(() => {
    expect(hunterCount()).toBe(7);
  });
  expect(searches.length, 'the press searched instead of reading the bar').toBe(0);

  // **The owner's report** (2026-10-01): Generate again, and the whole bar is priced from scratch.
  searches.length = 0;
  bars.length = 0;
  await clicked();
  // The march arrives already raised (the standing rule), the table lands a frame later, and the March draws
  // the **climb** in between: a march the game would take, and never a search for the answer on its way.
  await waitFor(() => {
    expect(hunterCount()).toBe(7);
  });
  expect(searches, 'a Generate started the exhaustive search again').toEqual([]);
  expect(bars.length, 'the new bar was never asked for').toBeGreaterThan(0);
}, 60_000);

test('a march the plan did not size is not read off the bar, and is searched instead', async () => {
  // A tighter pool, so the plan leaves one of the four hired types at home — the edit this test is about.
  stockedAccount(4_100);
  renderWithTheme(<Page />);
  await clicked();

  // A March edit: a troop type the plan left out goes back in, and the march on screen is re-sized — under the
  // **same request and stamp**, so the bar under the plan is still the one it was and no longer describes what
  // is on screen (`pricedRaise`'s guard, and the reason the fallback exists at all).
  const filed = useResultStore.getState().last;
  if (filed === null) throw new Error('the plan method answered with no march');
  const marching = new Set(filed.result.stacks.map((stack) => stack.unitId));
  const absent = filed.request.units.find((unit) => unit.pool === 'leadership' && !marching.has(unit.id));
  if (absent === undefined) throw new Error('this plan fields every troop type: nothing to put back');
  fireEvent.click(screen.getByRole('button', { name: `${absent.name}, left out by the search: put back` }));
  await waitFor(() => {
    expect(useRunStore.getState().resize).not.toBeNull();
  });

  const control = await screen.findByRole('radiogroup', { name: 'Mercenary count' + 's' });
  fireEvent.click(within(control).getByRole('radio', { name: 'Tight' }));
  await waitFor(() => {
    expect(searches.length).toBe(1);
  });
  // And the search was asked about the march **on screen**, not about the plan's own stop.
  expect(searches[0]?.base).toBe(useResultStore.getState().last?.result);
  expect(hunterCount()).not.toBe(7);
}, 60_000);
