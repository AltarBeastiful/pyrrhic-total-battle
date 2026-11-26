/**
 * The Prime Arena page's state (B-35): the B-33 inputs (the division tier, the switches, and a `BattleSetup` that
 * holds the squad) and the last plan. The inputs are saved with the account (B-36): this store mirrors
 * `profile.primeArena`, writing every edit to the active profile and filling itself from the profile when a
 * document arrives or the active profile changes. `plan` is a view result and stays here, unsaved.
 *
 * `generate` plans on the main thread. The search is bounded to about three seconds, so the page flips to
 * `running` and yields one task before it starts, which lets the pending state paint. A worker can take the
 * call later without changing this interface.
 */
import { create } from 'zustand';

import { getUnits } from '@/data';
import {
  DEFAULT_PRIME_ARENA_TOGGLES,
  isPrimeArenaUnit,
  PRIME_ARENA_CAPTAINS,
  PRIME_ARENA_SOURCES,
  primeArenaInputs,
  type PrimeArenaToggles,
} from '@/engine/primeArenaInputs';
import { planPrimeArenaAttack, type PrimeArenaPlan } from '@/engine/primeArenaPlanner';
import { defaultPrimeArena } from '@/state/defaults';
import type { BattleSetup, PrimeArenaSaved, Profile } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';

export interface PlanBudget {
  maxEvaluations?: number;
  maxMillis?: number;
}

/** The highest tier that has a Specialist or a Monster: the top division unlocks it. */
export function topTier(): number {
  return getUnits().reduce(
    (best, unit) => (isPrimeArenaUnit(unit) && unit.tier > best ? unit.tier : best),
    1,
  );
}

type Inputs = Pick<PrimeArenaState, 'tier' | 'toggles' | 'setup' | 'seeded'>;

/** What the profile stores for these inputs: only the switches that differ from the rules' defaults. */
function toSaved({ tier, toggles, setup, seeded }: Inputs): PrimeArenaSaved {
  const differing: Record<string, boolean> = {};
  for (const [key, on] of Object.entries(toggles)) {
    if (on !== DEFAULT_PRIME_ARENA_TOGGLES[key as keyof PrimeArenaToggles]) differing[key] = on;
  }
  return { tier, toggles: differing, setup, seeded };
}

/** The rules' defaults with the saved switches on top; a switch for a source that no longer exists is dropped. */
function savedToggles(saved: Record<string, boolean>): PrimeArenaToggles {
  const toggles = { ...DEFAULT_PRIME_ARENA_TOGGLES };
  for (const key of PRIME_ARENA_SOURCES) {
    if (typeof saved[key] === 'boolean') toggles[key] = saved[key];
  }
  return toggles;
}

/** Writes the inputs to the active profile, which stamps the Prime Arena section for the account merge. */
function save(inputs: Inputs): void {
  const { doc, updateProfile } = useStore.getState();
  updateProfile(doc.activeProfileId, { primeArena: toSaved(inputs) });
}

/** A fresh squad: the profile default's setup on the top division. */
function freshInputs(): Inputs {
  const fresh = defaultPrimeArena(useStore.getState().doc.deviceId);
  return { tier: topTier(), toggles: { ...DEFAULT_PRIME_ARENA_TOGGLES }, setup: fresh.setup, seeded: false };
}

interface PrimeArenaState {
  tier: number;
  /** The switches for talents and the permanent sources; captains, gear and dragon are the setup's own lists. */
  toggles: PrimeArenaToggles;
  /** The squad: captains, gear and dragon in `active`, Leadership and Dominance in `housing`. */
  setup: BattleSetup;
  /** True once the setup was first cloned from the active march, so a later visit keeps what was typed. */
  seeded: boolean;
  running: boolean;
  plan: PrimeArenaPlan | null;
  /** The tier the plan was made for, so the result names it even after the input moves on. */
  planTier: number | null;
  setTier: (tier: number) => void;
  setToggle: (key: keyof PrimeArenaToggles, on: boolean) => void;
  /** Edits the squad, the way the calculator's `updateActiveSetup` edits a march. */
  updateSetup: (patch: (setup: BattleSetup) => Partial<BattleSetup>) => void;
  /** Clones the active march's setup into the squad (at most five captains), once. */
  seedFrom: (active: BattleSetup) => void;
  generate: (profile: Profile, budget?: PlanBudget) => void;
  reset: () => void;
}

export const usePrimeArenaStore = create<PrimeArenaState>()((set, get) => ({
  ...freshInputs(),
  running: false,
  plan: null,
  planTier: null,
  setTier: (tier) => {
    set({ tier });
    save({ ...get(), tier });
  },
  setToggle: (key, on) => {
    const toggles = { ...get().toggles, [key]: on };
    set({ toggles });
    save({ ...get(), toggles });
  },
  updateSetup: (patch) => {
    const before = get().setup;
    const setup: BattleSetup = { ...before, ...patch(before), rev: before.rev + 1, updatedAt: Date.now() };
    set({ setup });
    save({ ...get(), setup });
  },
  seedFrom: (active) => {
    if (get().seeded) return;
    const clone = structuredClone(active);
    const before = get().setup;
    const setup: BattleSetup = {
      ...clone,
      id: before.id,
      name: before.name,
      marchType: 'unspecified',
      active: {
        ...clone.active,
        captains: clone.active.captains.slice(0, PRIME_ARENA_CAPTAINS),
        titles: [],
        hero: false,
        events: [],
        otherPills: [],
        vip: false,
        custom: [],
      },
      rev: before.rev + 1,
      updatedAt: Date.now(),
    };
    set({ seeded: true, setup });
    save({ ...get(), setup, seeded: true });
  },
  generate: (profile, budget = {}) => {
    if (get().running) return;
    const { tier, toggles, setup } = get();
    set({ running: true });
    // One task of yielding: the pending state paints before the bounded search blocks the thread.
    setTimeout(() => {
      const prepared = primeArenaInputs({ tier, toggles, setup, profile });
      const plan = planPrimeArenaAttack({
        pool: prepared.pool,
        housing: prepared.housing,
        totals: prepared.totals,
        ...budget,
      });
      set({ plan, planTier: tier, running: false });
    }, 0);
  },
  reset: () => {
    const fresh = freshInputs();
    set({ ...fresh, running: false, plan: null, planTier: null });
    save(fresh);
  },
}));

/** Fills the inputs from the active profile whenever its saved Prime Arena section is not what the store holds. */
function hydrate(profile: Profile | undefined): void {
  if (profile === undefined) return;
  const saved = profile.primeArena;
  const loaded: Inputs = {
    tier: saved.tier > 0 ? saved.tier : topTier(),
    toggles: savedToggles(saved.toggles),
    setup: saved.setup,
    seeded: saved.seeded,
  };
  const { tier, toggles, setup, seeded } = usePrimeArenaStore.getState();
  if (JSON.stringify(loaded) === JSON.stringify({ tier, toggles, setup, seeded })) return;
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
