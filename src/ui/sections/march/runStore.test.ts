/**
 * **The plan the march on screen came from outlives the Generate that replaces it** (owner, 2026-10-11: *"the
 * battle summary switches to as-is numbers while the generation is going on even if tight is selected"*).
 * `start` clears `plan` so the passes hanging off it stop; the March reads `shownPlan` until `finish`.
 */
import { afterEach, expect, test } from 'vitest';

import type { CampaignPlan } from '@/engine/plan';

import { useRunStore } from './runStore';

const OLD = { alternatives: [] } as unknown as CampaignPlan;
const NEW = { alternatives: [] } as unknown as CampaignPlan;

afterEach(() => {
  useRunStore.getState().reset();
});

test('a Generate holds the plan and stop on screen until its own plan lands', () => {
  useRunStore.setState({ plan: OLD, planPick: 3 });
  useRunStore.getState().start(new AbortController(), 'f');
  expect(useRunStore.getState().plan).toBeNull();
  expect(useRunStore.getState().shownPlan).toEqual({ plan: OLD, planPick: 3 });

  // A second press before the first answers keeps the march still on screen, not the empty plan between.
  useRunStore.getState().cancel();
  useRunStore.getState().start(new AbortController(), 'g');
  expect(useRunStore.getState().shownPlan).toEqual({ plan: OLD, planPick: 3 });

  useRunStore.getState().finish([], null, NEW);
  expect(useRunStore.getState().plan).toBe(NEW);
  expect(useRunStore.getState().shownPlan).toBeNull();
});
