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

test('the push is one pool at a time, a standing rule over a Generate, and Reset puts it back off', () => {
  expect(useRunStore.getState().pushed).toEqual({ authority: false, dominance: false });

  useRunStore.getState().setPushed('authority', true);
  expect(useRunStore.getState().pushed).toEqual({ authority: true, dominance: false });

  // **A standing rule, like the raise position** (owner, 2026-09-29: *"also remember position when clicking
  // generate again"*): a new run arrives with it on, whichever stop or method produced the march.
  useRunStore.getState().start(new AbortController(), 'f');
  useRunStore.getState().finish([], null, NEW);
  expect(useRunStore.getState().pushed.authority).toBe(true);

  // Another account is another army, so the push goes back off with everything else the run held.
  useRunStore.getState().reset();
  expect(useRunStore.getState().pushed).toEqual({ authority: false, dominance: false });
});

test('the burn ceiling is a whole count, a standing rule over a Generate, and Reset clears it', () => {
  expect(useRunStore.getState().burnCeiling).toBeNull();
  useRunStore.getState().setBurnCeiling(7.6);
  expect(useRunStore.getState().burnCeiling).toBe(7);
  useRunStore.getState().setBurnCeiling(-3);
  expect(useRunStore.getState().burnCeiling).toBe(0);

  useRunStore.getState().start(new AbortController(), 'f');
  useRunStore.getState().finish([], null, NEW);
  expect(useRunStore.getState().burnCeiling).toBe(0);

  useRunStore.getState().reset();
  expect(useRunStore.getState().burnCeiling).toBeNull();
});

test('Reset opens the pool line as the setting asks, and every toggle off without one', () => {
  useRunStore.getState().reset({ poolLine: 'both', poolLineRule: 'round' });
  expect(useRunStore.getState().rounded).toEqual({ authority: true, dominance: true });
  expect(useRunStore.getState().pushed).toEqual({ authority: false, dominance: false });
  useRunStore.getState().openPoolLine({ poolLine: 'mercs', poolLineRule: 'push' });
  expect(useRunStore.getState().pushed).toEqual({ authority: true, dominance: false });
  expect(useRunStore.getState().rounded).toEqual({ authority: false, dominance: false });
  useRunStore.getState().reset();
  expect(useRunStore.getState().pushed).toEqual({ authority: false, dominance: false });
});
