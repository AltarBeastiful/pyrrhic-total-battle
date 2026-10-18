// @vitest-environment jsdom
/**
 * **The burn ceiling and the pool line's default, on the page** (`docs/plans/burn-ceiling.md` §3.1, §3.2).
 *
 * The real March on the inline client (no worker in jsdom, so the bar is not priced and the raise under a ceiling
 * is the kernel's search, asked before the march or the ceiling is published). Five things are held:
 *
 *  1. the `Burn ≤` field is drawn on a plan's march, empty, with the march's burn as its placeholder and a help line;
 *  2. a ceiling typed under that burn trims the march to it, and clearing it gives the march back;
 *  3. a Generate opens the pool line as the account's setting asks (`Neither` by default);
 *  4. a press of a pool line's round records `round` as the rule the setting opens with;
 *  5. a put-back under a ceiling changes the march on screen **once** (owner, 2026-10-18: no flicker while the
 *     capped troops are recomputed).
 */
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';
import { initResultPersistence, useResultStore } from '@/ui/resultStore';
import type * as WorkerClient from '@/worker/client';

import { MarchSection } from './MarchSection';
import { changeBurnCeiling, pressPoolLine } from './poolLine';
import { poolLineOpening, useRunStore } from './runStore';
import { useMarch, type MarchView } from './useMarch';

vi.mock('@/ui/calcClient', async () => {
  const { createInlineClient } = await vi.importActual<typeof WorkerClient>('@/worker/client');
  const client = createInlineClient();
  return { getCalcClient: () => client, disposeCalcClient: () => undefined };
});

/** What the March reads, as the pane last drew it, and every march figure it has drawn since `frames` was emptied. */
const seen: { view: MarchView | null; frames: string[] } = { view: null, frames: [] };
let view: MarchView | null = null;

/** One drawn march as the player reads it: every stack's count and the damage. */
function figures(march: MarchView): string {
  const counts = (march.result?.stacks ?? []).map((stack) => `${stack.unitId}:${String(stack.count)}`);
  return `${counts.join(',')}|${String(march.summary?.minDamage ?? 0)}`;
}

function Probe() {
  const march = useMarch();
  useEffect(() => {
    seen.view = march;
    view = march;
    const drawn = figures(march);
    if (seen.frames.at(-1) !== drawn) seen.frames.push(drawn);
  }, [march]);
  return null;
}

function Page() {
  useEffect(() => {
    return initResultPersistence();
  }, []);
  return (
    <>
      <MarchSection />
      <Probe />
    </>
  );
}

/** A stocked account the plan sizes with several merc stacks, so there is a burn to cap. */
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

async function generate(): Promise<void> {
  const before = useResultStore.getState().last;
  fireEvent.click(screen.getByRole('button', { name: /^Generate march/ }));
  await waitFor(() => {
    expect(useResultStore.getState().last).not.toBe(before);
    expect(useResultStore.getState().last).not.toBeNull();
  });
}

const field = (): HTMLInputElement => screen.getByRole('textbox', { name: 'Most mercs lost' });

beforeEach(() => {
  window.localStorage.clear();
  useResultStore.getState().clear();
  useRunStore.getState().reset();
  view = null;
  seen.view = null;
  seen.frames = [];
  stockedAccount();
});

afterEach(() => {
  cleanup();
});

test('the field is empty with the march’s burn as placeholder; a ceiling under it trims the march', async () => {
  renderWithTheme(<Page />);
  await generate();
  await waitFor(() => {
    expect(view?.burn ?? 0).toBeGreaterThan(1);
  });
  const burn = view?.burn ?? 0;

  // 1 — empty, the burn on screen as the placeholder, and the one help line.
  expect(field().value).toBe('');
  expect(field().placeholder).toBe(String(burn));
  expect(screen.getByText(/Most mercs this march may lose/)).toBeTruthy();
  expect(useRunStore.getState().burnCeiling).toBeNull();

  // 2 — typed under the burn: the store takes it once the typing settles, and the march keeps under it.
  const ceiling = burn - 1;
  fireEvent.change(field(), { target: { value: String(ceiling) } });
  await waitFor(() => {
    expect(useRunStore.getState().burnCeiling).toBe(ceiling);
  });
  await waitFor(() => {
    expect(view?.burn).toBeLessThanOrEqual(ceiling);
  });
  expect(view?.burnCeiling).toBe(ceiling);

  // Cleared: no ceiling of the player's own, and the march stands at its own burn again.
  fireEvent.change(field(), { target: { value: '' } });
  await waitFor(() => {
    expect(useRunStore.getState().burnCeiling).toBeNull();
  });
  await waitFor(() => {
    expect(view?.burn).toBe(burn);
  });
}, 120_000);

test('a put-back under a ceiling swaps the march once: no frame of the re-size before its capped Tight', async () => {
  // A tighter pool, so the plan leaves a troop type at home — the put-back this test presses.
  stockedAccount(4_100);
  renderWithTheme(<Page />);
  await generate();
  await waitFor(() => {
    expect(seen.view?.searching).toBe(false);
    expect(seen.view?.burn ?? 0).toBeGreaterThan(1);
  });
  const ceiling = (seen.view?.burn ?? 0) - 1;
  await act(async () => {
    await changeBurnCeiling(ceiling);
  });
  await waitFor(() => {
    expect(seen.view?.burnCeiling).toBe(ceiling);
    expect(seen.view?.searching).toBe(false);
  });

  const filed = useResultStore.getState().last;
  if (filed === null) throw new Error('the plan method answered with no march');
  const marching = new Set(filed.result.stacks.map((stack) => stack.unitId));
  const absent = filed.request.units.find((unit) => unit.pool === 'leadership' && !marching.has(unit.id));
  if (absent === undefined) throw new Error('this plan fields every troop type: nothing to put back');

  const before = seen.frames.at(-1);
  seen.frames = before === undefined ? [] : [before];
  fireEvent.click(screen.getByRole('button', { name: `${absent.name}, left out by the search: put back` }));
  await waitFor(() => {
    expect(useRunStore.getState().resize).not.toBeNull();
    expect(seen.view?.searching).toBe(false);
  });
  // Let any answer that would land behind the march land, then read every march the pane drew.
  await act(async () => {
    await new Promise((resolve) => globalThis.setTimeout(resolve, 200));
  });
  expect(seen.frames, 'the put-back drew more than one march').toHaveLength(2);
  expect(seen.view?.burn).toBeLessThanOrEqual(ceiling);
}, 120_000);

test('a Generate opens the pool line per the setting; Neither is the default and leaves every toggle off', async () => {
  renderWithTheme(<Page />);
  // A toggle left on from the last run goes off: the default opens the plan's own march.
  act(() => {
    useRunStore.getState().setPushed('authority', true);
  });
  await generate();
  expect(useRunStore.getState().pushed).toEqual({ authority: false, dominance: false });
  expect(useRunStore.getState().rounded).toEqual({ authority: false, dominance: false });

  // Mercs only, with the round as the rule last switched on: the next Generate opens the mercs' round.
  act(() => {
    const id = useStore.getState().doc.activeProfileId;
    useStore.getState().updateProfile(id, (profile) => ({
      settings: { ...profile.settings, poolLine: 'mercs', poolLineRule: 'round' },
    }));
  });
  await generate();
  expect(useRunStore.getState().rounded).toEqual({ authority: true, dominance: false });
  expect(useRunStore.getState().pushed).toEqual({ authority: false, dominance: false });
}, 120_000);

test('switching a pool line’s rule on records it as the rule the setting opens; switching off records nothing', () => {
  const settings = () => selectActiveProfile(useStore.getState())?.settings;
  expect(settings()).toEqual({ poolLine: 'neither', poolLineRule: 'push' });

  act(() => {
    pressPoolLine('dominance', 'round', true);
  });
  expect(useRunStore.getState().rounded.dominance).toBe(true);
  expect(settings()?.poolLineRule).toBe('round');

  act(() => {
    pressPoolLine('authority', 'push', false);
  });
  expect(settings()?.poolLineRule).toBe('round');
  expect(selectActiveProfile(useStore.getState())?.sectionUpdatedAt?.settings).toBeDefined();
});

test('poolLineOpening: the setting’s pools get the rule, every other toggle is off', () => {
  const off = { authority: false, dominance: false };
  expect(poolLineOpening(undefined)).toEqual({ pushed: off, rounded: off });
  expect(poolLineOpening({ poolLine: 'neither', poolLineRule: 'round' })).toEqual({
    pushed: off,
    rounded: off,
  });
  expect(poolLineOpening({ poolLine: 'both', poolLineRule: 'push' })).toEqual({
    pushed: { authority: true, dominance: true },
    rounded: off,
  });
  expect(poolLineOpening({ poolLine: 'monsters', poolLineRule: 'round' })).toEqual({
    pushed: off,
    rounded: { authority: false, dominance: true },
  });
});
