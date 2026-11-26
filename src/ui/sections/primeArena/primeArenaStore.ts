/**
 * The Prime Arena page's state (B-35): the B-33 inputs (the arena's own Troops card, the switches, and a
 * `BattleSetup` that holds the squad) and the last plan. The inputs are saved with the account (B-36): this store mirrors
 * `profile.primeArena`, writing every edit to the active profile and filling itself from the profile when a
 * document arrives or the active profile changes. `plan` is a view result and stays here, unsaved.
 *
 * `generate` plans on the main thread. The search is bounded to about three seconds, so the page flips to
 * `running` and yields one task before it starts, which lets the pending state paint. A worker can take the
 * call later without changing this interface.
 */
import { create } from 'zustand';

import {
  DEFAULT_PRIME_ARENA_TOGGLES,
  PRIME_ARENA_CAPTAINS,
  PRIME_ARENA_SOURCES,
  primeArenaInputs,
  type PrimeArenaToggles,
} from '@/engine/primeArenaInputs';
import { planPrimeArenaAttack, type PrimeArenaPlan } from '@/engine/primeArenaPlanner';
import { defaultPrimeArena } from '@/state/defaults';
import type { BattleSetup, PrimeArenaSaved, Profile, ProfileTroops } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { rowBounds } from '@/ui/sections/troops/rows';

export interface PlanBudget {
  maxEvaluations?: number;
  maxMillis?: number;
}

/**
 * The arena's Troops card as a fresh squad has it: Guardsmen from G1 up to the highest level the game has, the
 * other rows unused (the Guardsmen level alone fixes the pool).
 */
export function defaultArenaTroops(): ProfileTroops {
  return {
    guardsmen: { min: 1, max: rowBounds('guardsmen').max },
    specialists: null,
    engineers: null,
    monsters: null,
    topTierExcluded: { guardsmen: [], specialists: [] },
    excludedUnitIds: [],
  };
}

type Inputs = Pick<PrimeArenaState, 'troops' | 'toggles' | 'setup' | 'seeded'>;

/** What the profile stores for these inputs: only the switches that differ from the rules' defaults. */
function toSaved({ troops, toggles, setup, seeded }: Inputs): PrimeArenaSaved {
  const differing: Record<string, boolean> = {};
  for (const [key, on] of Object.entries(toggles)) {
    if (on !== DEFAULT_PRIME_ARENA_TOGGLES[key as keyof PrimeArenaToggles]) differing[key] = on;
  }
  // The top level is what `null` means, so a squad nobody touched stores nothing of its troops.
  const untouched = JSON.stringify(troops) === JSON.stringify(defaultArenaTroops());
  return { troops: untouched ? null : troops, toggles: differing, setup, seeded };
}

/** The rules' defaults with the saved switches on top; a switch for a source that no longer exists is dropped. */
function savedToggles(saved: Record<string, boolean>): PrimeArenaToggles {
  const toggles = { ...DEFAULT_PRIME_ARENA_TOGGLES };
  for (const key of PRIME_ARENA_SOURCES) {
    if (typeof saved[key] === 'boolean') toggles[key] = saved[key];
  }
  return toggles;
}

/** Everything a plan is computed from, as one string: equal strings mean the plan on screen still answers the form. */
export function arenaFingerprint(
  profile: Profile,
  inputs: Pick<Inputs, 'troops' | 'toggles' | 'setup'>,
): string {
  return JSON.stringify([
    inputs.troops,
    inputs.toggles,
    inputs.setup,
    profile.sources,
    profile.talents.ranks,
  ]);
}

/** Writes the inputs to the active profile, which stamps the Prime Arena section for the account merge. */
function save(inputs: Inputs): void {
  const { doc, updateProfile } = useStore.getState();
  updateProfile(doc.activeProfileId, { primeArena: toSaved(inputs) });
}

/** A fresh squad: the profile default's setup on the top troop level. */
function freshInputs(): Inputs {
  const fresh = defaultPrimeArena(useStore.getState().doc.deviceId);
  return {
    troops: defaultArenaTroops(),
    toggles: { ...DEFAULT_PRIME_ARENA_TOGGLES },
    setup: fresh.setup,
    seeded: false,
  };
}

interface PrimeArenaState {
  /** The arena's own Troops card: its Guardsmen "to" level fixes the pool. */
  troops: ProfileTroops;
  /** The switches for talents and the permanent sources; captains, gear and dragon are the setup's own lists. */
  toggles: PrimeArenaToggles;
  /** The squad: captains, gear and dragon in `active`, Leadership and Dominance in `housing`. */
  setup: BattleSetup;
  /** True once the setup was first cloned from the active march, so a later visit keeps what was typed. */
  seeded: boolean;
  running: boolean;
  /** How hard the search may work; the defaults unless a test tightens it. */
  budget: PlanBudget;
  plan: PrimeArenaPlan | null;
  /** The Guardsmen level the plan was made for, so the result names it even after the input moves on. */
  planLevel: number | null;
  /** What the plan was made from (`arenaFingerprint`), so the bar can say the inputs moved under it. */
  planKey: string | null;
  /** Edits the Troops card, the way the calculator's card edits `profile.troops`. */
  updateTroops: (patch: Partial<ProfileTroops>) => void;
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
  budget: {},
  plan: null,
  planLevel: null,
  planKey: null,
  updateTroops: (patch) => {
    const troops = { ...get().troops, ...patch };
    set({ troops });
    save({ ...get(), troops });
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
  generate: (profile, given) => {
    if (get().running) return;
    const { troops, toggles, setup } = get();
    const budget = given ?? get().budget;
    set({ running: true });
    // One task of yielding: the pending state paints before the bounded search blocks the thread.
    setTimeout(() => {
      const prepared = primeArenaInputs({ troops, toggles, setup, profile });
      const plan = planPrimeArenaAttack({
        pool: prepared.pool,
        housing: prepared.housing,
        totals: prepared.totals,
        ...budget,
      });
      set({
        plan,
        planLevel: prepared.level,
        planKey: arenaFingerprint(profile, { troops, toggles, setup }),
        running: false,
      });
    }, 0);
  },
  reset: () => {
    const fresh = freshInputs();
    set({ ...fresh, running: false, plan: null, planLevel: null, planKey: null });
    save(fresh);
  },
}));

/** Fills the inputs from the active profile whenever its saved Prime Arena section is not what the store holds. */
function hydrate(profile: Profile | undefined): void {
  if (profile === undefined) return;
  const saved = profile.primeArena;
  const loaded: Inputs = {
    troops: saved.troops ?? defaultArenaTroops(),
    toggles: savedToggles(saved.toggles),
    setup: saved.setup,
    seeded: saved.seeded,
  };
  const { troops, toggles, setup, seeded } = usePrimeArenaStore.getState();
  if (JSON.stringify(loaded) === JSON.stringify({ troops, toggles, setup, seeded })) return;
  usePrimeArenaStore.setState({ ...loaded, plan: null, planLevel: null, planKey: null });
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
