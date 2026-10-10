/**
 * **The raise census** (W18 P0.2, `raiseCensus` in `kernel/assembly/index.ts`): the profile build counts what
 * one `raise()` spent its time on, the release build compiles every count out.
 *
 *  - the release kernel answers no `census` at all;
 *  - the profile kernel, compiled here to a temporary file, answers **exactly** what the release one does on
 *    every criteria army and every exhaustive position (counts, `how`, `space`, `scored`), with the census
 *    beside it;
 *  - the counts hold to each other: a battle is one kill order, a rating is one kill order, the plan's own
 *    march is rated once before a `Tight` search, and only `Tight` rates.
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { sizeStacks } from '@/engine/stacker';
import { createRaiseKernel } from '@/kernel/raise';
import { raiseCode } from '@/ui/sections/march/positions';
import type { RaiseMode } from '@/ui/sections/march/raise';

import { criteriaScenarios } from '../engine/plan-scenarios';

import { loadKernelModule, loadProfileKernelModule } from './load';

const EXHAUSTIVE: readonly RaiseMode[] = ['v2', 'safe', 'tight'];

const modesOf = (mode: RaiseMode) => ({ authority: raiseCode(mode), dominance: raiseCode(mode) });

describe('the raise census', () => {
  it('is counted on the profile build only, and moves no answer', () => {
    const release = createRaiseKernel(loadKernelModule());
    const profile = createRaiseKernel(loadProfileKernelModule());
    let rated = 0;
    let hits = 0;
    for (const scenario of criteriaScenarios()) {
      const base = sizeStacks(scenario.request);
      for (const mode of EXHAUSTIVE) {
        const input = { request: scenario.request, base, modes: modesOf(mode) };
        const plain = release.position(input);
        const counted = profile.position(input);
        expect(plain?.census, scenario.label).toBeUndefined();
        if (plain === null || counted === null) {
          expect(counted, scenario.label).toBe(plain);
          continue;
        }
        const { census, ...answer } = counted;
        expect(answer, `${scenario.label} ${mode}`).toStrictEqual(plain);
        expect(census, scenario.label).toBeDefined();
        if (census === undefined) continue;
        expect(census.killOrdersScore).toBe(census.battles);
        expect(census.ratingsOnHit).toBeLessThanOrEqual(census.ratings);
        if (mode === 'tight' && plain.how !== null) {
          // The plan's own march: one battle and one bill before the search, then a rating a vector it priced.
          expect(census.killOrdersRating).toBe(census.ratings + 1);
          expect(census.battles).toBeGreaterThanOrEqual(1);
          rated += 1;
          hits += census.ratingsOnHit;
        } else {
          expect(census.ratings).toBe(0);
          expect(census.ratingsOnHit).toBe(0);
        }
      }
    }
    // `v2` and `safe` searched the same box first, so a `Tight` search reads their battles from the memo.
    expect(rated).toBeGreaterThan(0);
    expect(hits).toBeGreaterThan(0);
  }, 300_000);
});
