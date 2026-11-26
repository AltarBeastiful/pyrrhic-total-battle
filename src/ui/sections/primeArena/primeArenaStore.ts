/**
 * The Prime Arena page's state (B-35): the B-33 inputs and the last plan. A view store, not part of the saved
 * document: B-36 moves `inputs` into the profile (the object below is the shape it stores), `plan` stays here.
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
import type { Profile } from '@/state/schema';

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
    set((state) => ({ inputs: { ...state.inputs, ...patch } }));
  },
  setToggle: (key, on) => {
    set((state) => ({ inputs: { ...state.inputs, toggles: { ...state.inputs.toggles, [key]: on } } }));
  },
  seedFrom: (_profile, active, housing) => {
    if (get().seeded) return;
    set((state) => ({
      seeded: true,
      inputs: {
        ...state.inputs,
        leadership: housing.leadership,
        dominance: housing.dominance,
        captains: active.captains.slice(0, PRIME_ARENA_CAPTAINS),
        equipment: [...active.equipment],
        artifacts: [...active.artifacts],
      },
    }));
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
    set({ inputs: defaultInputs(), seeded: false, running: false, plan: null, planTier: null });
  },
}));
