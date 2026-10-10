/**
 * **Generate, then every question the advisor can ask, under one `console.profile`** (owner, 2026-10-10: *"a
 * generate with all questions options … a simple profiling in devtools"*). Loaded on the press of the profiling
 * button (`ProfileAllButton.tsx`), never otherwise.
 *
 * The phases run **one after the other**, not together, so each reads as its own stretch of the profile and of
 * the Performance panel's Timings track (`performance.measure`, named `pyrrhic:<phase>`):
 *
 *  1. `generate`: the plan, the opening stop and the bar's Tight tables (`runGenerate`);
 *  2. `upgrades-default`: the generic probes (`computeAdvice('default')`);
 *  3. `upgrades-mine`: the typed upgrades, when any are typed;
 *  4. `captains`: the trio screen and the star / level pass, when a captain is owned;
 *  5. `other`: the dominance and leadership sweeps, next tier, merc stock, horizon, silver.
 *
 * `console.profile` records the **page's thread**; the pool's workers are their own threads, so their time shows
 * in a Performance-panel recording and as the wall time each phase's `await` spends, not inside the profile.
 * The table printed at the end is the wall time per phase.
 *
 * It reads and writes the same stores the March card does, so what is on screen afterwards is what a player
 * who pressed every button would see. Display only: no rating, constant or plan is touched.
 */
import { distinctCaptains } from '@/engine/captains';
import { buildPlanRequest } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import { advisorKey, canAdvise, computeAdvice } from './advisorSearch';
import { captainKey, computeCaptains } from './captainSearch';
import { runGenerate } from './generate';
import { computeOther, otherKey } from './otherSearch';
import { pickOf, useRunStore } from './runStore';

export interface PhaseTime {
  phase: string;
  ms: number;
}

const LABEL = 'Pyrrhic: generate and every question';

async function phase(name: string, times: PhaseTime[], work: () => Promise<void>): Promise<void> {
  const began = performance.now();
  try {
    await work();
  } finally {
    const ms = performance.now() - began;
    performance.measure(`pyrrhic:${name}`, { start: began, end: began + ms });
    times.push({ phase: name, ms: Math.round(ms) });
  }
}

/** Run everything once; resolves with the wall time of each phase. A phase with nothing to ask is skipped. */
export async function profileEverything(): Promise<PhaseTime[]> {
  const times: PhaseTime[] = [];
  // eslint-disable-next-line no-console -- the profile is the point
  console.profile(LABEL);
  try {
    await phase('generate', times, runGenerate);

    const state = useStore.getState();
    const profile = selectActiveProfile(state);
    const setup = selectActiveSetup(state);
    const { plan, planPick } = useRunStore.getState();
    if (profile === undefined || setup === undefined || plan === null) return times;
    if (!canAdvise()) return times;

    const input = buildPlanRequest(profile, setup);
    const headline = pickOf(plan, planPick).pick;
    const upgrades = profile.upgrades;

    await phase('upgrades-default', times, () =>
      computeAdvice('default', advisorKey(plan, input), input, headline),
    );
    if (upgrades.length > 0) {
      await phase('upgrades-mine', times, () =>
        computeAdvice('mine', advisorKey(plan, input, upgrades), input, headline, upgrades),
      );
    }
    if (distinctCaptains(profile.sources.captains).length > 0) {
      await phase('captains', times, () =>
        computeCaptains(captainKey(plan, input, profile, setup), input, profile, setup),
      );
    }
    await phase('other', times, () => computeOther(otherKey(plan, input), input, plan.silver, headline));
    return times;
  } finally {
    // eslint-disable-next-line no-console -- the profile is the point
    console.profileEnd(LABEL);
    // eslint-disable-next-line no-console -- the table is the report
    console.table(times);
    // Also on `window`, so the numbers can be read back from the console or a script.
    Object.assign(globalThis, { pyrrhicProfile: times });
  }
}
