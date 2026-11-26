/**
 * The Prime Arena page's state (B-35): the B-33 inputs (the arena's own Troops card, the switches, and a
 * `BattleSetup` that holds the squad) and the last plan. The inputs are saved with the account (B-36): this store mirrors
 * `profile.primeArena`, writing every edit to the active profile and filling itself from the profile when a
 * document arrives or the active profile changes. `plan` is a view result and stays here, unsaved.
 *
 * `generate` plans on a calculation worker of the arena's own (B-37): the planner may search for up to a minute,
 * so the page flips to `running` and stays responsive while the job runs. Where the platform has no worker the
 * client runs the same job on the main thread (tests, old browsers). The role and the stack cap are inputs like the
 * rest: saved with the account, part of the fingerprint.
 */
import { useMemo } from 'react';
import { create } from 'zustand';

import {
  DEFAULT_PRIME_ARENA_TOGGLES,
  PRIME_ARENA_CAPTAINS,
  PRIME_ARENA_SOURCES,
  primeArenaInputs,
  type PrimeArenaToggles,
} from '@/engine/primeArenaInputs';
import type { PrimeArenaPlan, PrimeArenaRole } from '@/engine/primeArenaPlanner';
import { defaultPrimeArena } from '@/state/defaults';
import { DEFAULT_ARENA_STACKS, MAX_ARENA_STACKS } from '@/state/schema';
import type { BattleSetup, PrimeArenaSaved, Profile, ProfileTroops } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { rowBounds } from '@/ui/sections/troops/rows';
import { createCalcClient, isAbortError, type CalcClient } from '@/worker/client';

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

/** Everything a plan is computed from (and the profile saves): one object, so no site spells the six fields out. */
export interface ArenaInputs {
  /** The arena's own Troops card: its Guardsmen "to" level fixes the pool. */
  troops: ProfileTroops;
  /** The switches for talents and the permanent sources; captains, gear and dragon are the setup's own lists. */
  toggles: PrimeArenaToggles;
  /** The squad: captains, gear and dragon in `active`, Leadership and Dominance in `housing`. */
  setup: BattleSetup;
  /** True once the setup was first cloned from the active march, so a later visit keeps what was typed. */
  seeded: boolean;
  /** Which side the plan plays: fixes the opponent panel and how it is scored. */
  role: PrimeArenaRole;
  /** Most stacks in the squad; the game's real limit is unknown. */
  maxStacks: number;
}

/** The inputs out of the store's state. */
export function pickInputs({ troops, toggles, setup, seeded, role, maxStacks }: ArenaInputs): ArenaInputs {
  return { troops, toggles, setup, seeded, role, maxStacks };
}

/** The inputs as one object that changes only when one of them does, for hooks that depend on them. */
export function useArenaInputs(): ArenaInputs {
  const { troops, toggles, setup, seeded, role, maxStacks } = usePrimeArenaStore();
  return useMemo(
    () => ({ troops, toggles, setup, seeded, role, maxStacks }),
    [troops, toggles, setup, seeded, role, maxStacks],
  );
}

/** What the profile stores for these inputs: only the switches that differ from the rules' defaults. */
function toSaved({ troops, toggles, setup, seeded, role, maxStacks }: ArenaInputs): PrimeArenaSaved {
  const differing: Record<string, boolean> = {};
  for (const [key, on] of Object.entries(toggles)) {
    if (on !== DEFAULT_PRIME_ARENA_TOGGLES[key as keyof PrimeArenaToggles]) differing[key] = on;
  }
  // The top level is what `null` means, so a squad nobody touched stores nothing of its troops.
  const untouched = JSON.stringify(troops) === JSON.stringify(defaultArenaTroops());
  return { troops: untouched ? null : troops, toggles: differing, setup, seeded, role, maxStacks };
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
export function arenaFingerprint(profile: Profile, inputs: Omit<ArenaInputs, 'seeded'>): string {
  return JSON.stringify([
    inputs.troops,
    inputs.toggles,
    inputs.setup,
    inputs.role,
    inputs.maxStacks,
    profile.sources,
    profile.talents.ranks,
  ]);
}

/** Writes the inputs to the active profile, which stamps the Prime Arena section for the account merge. */
function save(inputs: ArenaInputs): void {
  const { doc, updateProfile } = useStore.getState();
  updateProfile(doc.activeProfileId, { primeArena: toSaved(inputs) });
}

/** A fresh squad: the profile default's setup on the top troop level. */
function freshInputs(): ArenaInputs {
  const fresh = defaultPrimeArena(useStore.getState().doc.deviceId);
  return {
    troops: defaultArenaTroops(),
    toggles: { ...DEFAULT_PRIME_ARENA_TOGGLES },
    setup: fresh.setup,
    seeded: false,
    role: 'attacker',
    maxStacks: DEFAULT_ARENA_STACKS,
  };
}

/** The arena's own calculation client: a minute-long search must not sit in front of the calculator's jobs. */
let client: CalcClient | undefined;
const arenaClient = (): CalcClient => (client ??= createCalcClient());
/** Which Generate the page is waiting for: a reset or a new document makes an answer on its way stale. */
let generation = 0;

interface PrimeArenaState extends ArenaInputs {
  running: boolean;
  /** How hard the search may work; the defaults unless a test tightens it. */
  budget: PlanBudget;
  plan: PrimeArenaPlan | null;
  /** The Guardsmen level the plan was made for, so the result names it even after the input moves on. */
  planLevel: number | null;
  /** True when the last Generate failed; the bar stays usable. */
  failed: boolean;
  /** What the plan was made from (`arenaFingerprint`), so the bar can say the inputs moved under it. */
  planKey: string | null;
  /** Edits the Troops card, the way the calculator's card edits `profile.troops`. */
  updateTroops: (patch: Partial<ProfileTroops>) => void;
  setRole: (role: PrimeArenaRole) => void;
  setMaxStacks: (maxStacks: number) => void;
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
  failed: false,
  setRole: (role) => {
    set({ role });
    save({ ...get(), role });
  },
  setMaxStacks: (value) => {
    const maxStacks = Math.min(MAX_ARENA_STACKS, Math.max(1, Math.round(value)));
    set({ maxStacks });
    save({ ...get(), maxStacks });
  },
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
    const inputs = pickInputs(get());
    const { role, maxStacks } = inputs;
    const budget = given ?? get().budget;
    const mine = ++generation;
    set({ running: true, failed: false });
    const prepared = primeArenaInputs({ ...inputs, profile });
    arenaClient()
      .arena({
        pool: prepared.pool,
        housing: prepared.housing,
        totals: prepared.totals,
        role,
        maxStacks,
        ...budget,
      })
      .then(
        (plan) => {
          if (mine !== generation) return;
          set({
            plan,
            planLevel: prepared.level,
            planKey: arenaFingerprint(profile, inputs),
            running: false,
          });
        },
        (error: unknown) => {
          if (mine !== generation || isAbortError(error)) return;
          set({ running: false, failed: true });
        },
      );
  },
  reset: () => {
    const fresh = freshInputs();
    generation += 1;
    set({ ...fresh, running: false, failed: false, plan: null, planLevel: null, planKey: null });
    save(fresh);
  },
}));

/** Fills the inputs from the active profile whenever its saved Prime Arena section is not what the store holds. */
function hydrate(profile: Profile | undefined): void {
  if (profile === undefined) return;
  const saved = profile.primeArena;
  const loaded: ArenaInputs = {
    troops: saved.troops ?? defaultArenaTroops(),
    toggles: savedToggles(saved.toggles),
    setup: saved.setup,
    seeded: saved.seeded,
    role: saved.role,
    maxStacks: saved.maxStacks,
  };
  if (JSON.stringify(loaded) === JSON.stringify(pickInputs(usePrimeArenaStore.getState()))) return;
  generation += 1;
  usePrimeArenaStore.setState({
    ...loaded,
    running: false,
    failed: false,
    plan: null,
    planLevel: null,
    planKey: null,
  });
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
