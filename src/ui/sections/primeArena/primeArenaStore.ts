/**
 * The Prime Arena page's state (B-35): the B-33 inputs and the last plan. The inputs are saved
 * with the account (B-36): this store mirrors `profile.primeArena`, writing every edit to the active profile and
 * filling itself from the profile when a document arrives or the active profile changes. `plan` is a view result
 * and stays here, unsaved.
 *
 * `generate` plans on the main thread. The search is bounded to about three seconds, so the page flips to
 * `running` and yields one task before it starts, which lets the pending state paint. A worker can take the
 * call later without changing this interface.
 */
import { create } from 'zustand';

import { getUnits } from '@/data';
import {
  DEFAULT_PRIME_ARENA_TOGGLES,
  PRIME_ARENA_CAPTAINS,
  primeArenaInputs,
  type PrimeArenaToggles,
} from '@/engine/primeArenaInputs';
import { planPrimeArenaAttack, type PrimeArenaPlan } from '@/engine/primeArenaPlanner';
import type { PrimeArenaSaved, Profile } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';

/** What the player types for the arena. Entry ids refer to `profile.sources`. */
export interface PrimeArenaFormInputs {
  tier: number;
  leadership: number;
  dominance: number;
  captains: string[];
  equipment: string[];
  artifacts: string[];
  toggles: PrimeArenaToggles;
}

export interface PlanBudget {
  maxEvaluations?: number;
  maxMillis?: number;
}

/** The highest tier that has a Specialist or a Monster: the top division unlocks it. */
export function topTier(): number {
  return getUnits().reduce(
    (best, unit) =>
      (unit.kind === 'monster' || (unit.kind === 'troop' && unit.group === 'specialist')) && unit.tier > best
        ? unit.tier
        : best,
    1,
  );
}

export function defaultInputs(): PrimeArenaFormInputs {
  return {
    tier: topTier(),
    leadership: 0,
    dominance: 0,
    captains: [],
    equipment: [],
    artifacts: [],
    toggles: { ...DEFAULT_PRIME_ARENA_TOGGLES },
  };
}

/** What the profile stores for these inputs: only the switches that differ from the rules' defaults. */
function toSaved(inputs: PrimeArenaFormInputs, seeded: boolean): PrimeArenaSaved {
  const toggles: Record<string, boolean> = {};
  for (const [key, on] of Object.entries(inputs.toggles)) {
    if (on !== DEFAULT_PRIME_ARENA_TOGGLES[key as keyof PrimeArenaToggles]) toggles[key] = on;
  }
  return {
    tier: inputs.tier,
    leadership: inputs.leadership,
    dominance: inputs.dominance,
    captains: [...inputs.captains],
    equipment: [...inputs.equipment],
    artifacts: [...inputs.artifacts],
    toggles,
    seeded,
  };
}

function fromSaved(saved: PrimeArenaSaved): { inputs: PrimeArenaFormInputs; seeded: boolean } {
  return {
    seeded: saved.seeded,
    inputs: {
      tier: saved.tier > 0 ? saved.tier : topTier(),
      leadership: saved.leadership,
      dominance: saved.dominance,
      captains: [...saved.captains],
      equipment: [...saved.equipment],
      artifacts: [...saved.artifacts],
      toggles: { ...DEFAULT_PRIME_ARENA_TOGGLES, ...saved.toggles },
    },
  };
}

/** Writes the inputs to the active profile, which stamps the Prime Arena section for the account merge. */
function save(inputs: PrimeArenaFormInputs, seeded: boolean): void {
  const { doc, updateProfile } = useStore.getState();
  updateProfile(doc.activeProfileId, { primeArena: toSaved(inputs, seeded) });
}

interface PrimeArenaState {
  inputs: PrimeArenaFormInputs;
  /** True once the inputs were first filled from the account, so a later visit keeps what was typed. */
  seeded: boolean;
  running: boolean;
  plan: PrimeArenaPlan | null;
  /** The tier the plan was made for, so the result names it even after the input moves on. */
  planTier: number | null;
  setInputs: (patch: Partial<PrimeArenaFormInputs>) => void;
  setToggle: (key: keyof PrimeArenaToggles, on: boolean) => void;
  /** Fills the empty inputs from the account's gear and the active march's housing, once. */
  seedFrom: (
    profile: Profile,
    active: { captains: string[]; equipment: string[]; artifacts: string[] },
    housing: { leadership: number; dominance: number },
  ) => void;
  generate: (profile: Profile, budget?: PlanBudget) => void;
  reset: () => void;
}

export const usePrimeArenaStore = create<PrimeArenaState>()((set, get) => ({
  inputs: defaultInputs(),
  seeded: false,
  running: false,
  plan: null,
  planTier: null,
  setInputs: (patch) => {
    const inputs = { ...get().inputs, ...patch };
    set({ inputs });
    save(inputs, get().seeded);
  },
  setToggle: (key, on) => {
    const { inputs: before } = get();
    const inputs = { ...before, toggles: { ...before.toggles, [key]: on } };
    set({ inputs });
    save(inputs, get().seeded);
  },
  seedFrom: (_profile, active, housing) => {
    if (get().seeded) return;
    const inputs = {
      ...get().inputs,
      leadership: housing.leadership,
      dominance: housing.dominance,
      captains: active.captains.slice(0, PRIME_ARENA_CAPTAINS),
      equipment: [...active.equipment],
      artifacts: [...active.artifacts],
    };
    set({ seeded: true, inputs });
    save(inputs, true);
  },
  generate: (profile, budget = {}) => {
    if (get().running) return;
    const { inputs } = get();
    set({ running: true });
    // One task of yielding: the pending state paints before the bounded search blocks the thread.
    setTimeout(() => {
      const prepared = primeArenaInputs({ ...inputs, profile });
      const plan = planPrimeArenaAttack({
        pool: prepared.pool,
        housing: prepared.housing,
        totals: prepared.totals,
        ...budget,
      });
      set({ plan, planTier: inputs.tier, running: false });
    }, 0);
  },
  reset: () => {
    const inputs = defaultInputs();
    set({ inputs, seeded: false, running: false, plan: null, planTier: null });
    save(inputs, false);
  },
}));

/** Fills the inputs from the active profile whenever its saved Prime Arena section is not what the store holds. */
function hydrate(profile: Profile | undefined): void {
  if (profile === undefined) return;
  const loaded = fromSaved(profile.primeArena);
  const { inputs, seeded } = usePrimeArenaStore.getState();
  if (loaded.seeded === seeded && JSON.stringify(loaded.inputs) === JSON.stringify(inputs)) return;
  usePrimeArenaStore.setState({ ...loaded, plan: null, planTier: null });
}

hydrate(selectActiveProfile(useStore.getState()));
useStore.subscribe((state, previous) => {
  const profile = selectActiveProfile(state);
  if (
    profile?.id === selectActiveProfile(previous)?.id &&
    profile?.primeArena === selectActiveProfile(previous)?.primeArena
  ) {
    return;
  }
  hydrate(profile);
});
