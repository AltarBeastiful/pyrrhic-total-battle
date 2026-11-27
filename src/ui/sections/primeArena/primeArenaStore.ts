/**
 * The Prime Arena page's state (B-35): the B-33 inputs (the switches and a `BattleSetup` that holds the squad; the
 * Guardsmen level is the account's own `profile.troops`, shared with the calculator, not copied here) and the last plan. The inputs are saved with the account (B-36): this store mirrors
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
  rankArenaCaptains,
  type PrimeArenaToggles,
} from '@/engine/primeArenaInputs';
import type { PrimeArenaPlan, PrimeArenaRole } from '@/engine/primeArenaPlanner';
import { defaultPrimeArena } from '@/state/defaults';
import { DEFAULT_ARENA_STACKS, MAX_ARENA_STACKS } from '@/state/schema';
import type { BattleSetup, PrimeArenaSaved, Profile } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { useUiStore } from '@/ui/uiStore';
import { createCalcClient, isAbortError, type CalcClient } from '@/worker/client';

export interface PlanBudget {
  maxEvaluations?: number;
  maxMillis?: number;
}

/** Everything a plan is computed from (and the profile saves): one object, so no site spells the fields out. The Guardsmen level that fixes the pool is not among them: it
 * is `profile.troops`, the calculator's own. */
export interface ArenaInputs {
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
export function pickInputs({ toggles, setup, seeded, role, maxStacks }: ArenaInputs): ArenaInputs {
  return { toggles, setup, seeded, role, maxStacks };
}

/** The inputs as one object that changes only when one of them does, for hooks that depend on them. */
export function useArenaInputs(): ArenaInputs {
  const { toggles, setup, seeded, role, maxStacks } = usePrimeArenaStore();
  return useMemo(
    () => ({ toggles, setup, seeded, role, maxStacks }),
    [toggles, setup, seeded, role, maxStacks],
  );
}

/** What the profile stores for these inputs: only the switches that differ from the rules' defaults. */
function toSaved({ toggles, setup, seeded, role, maxStacks }: ArenaInputs): PrimeArenaSaved {
  const differing: Record<string, boolean> = {};
  for (const [key, on] of Object.entries(toggles)) {
    if (on !== DEFAULT_PRIME_ARENA_TOGGLES[key as keyof PrimeArenaToggles]) differing[key] = on;
  }
  return { toggles: differing, setup, seeded, role, maxStacks };
}

/** The rules' defaults with the saved switches on top; a switch for a source that no longer exists is dropped. */
function savedToggles(saved: Record<string, boolean>): PrimeArenaToggles {
  const toggles = { ...DEFAULT_PRIME_ARENA_TOGGLES };
  for (const key of PRIME_ARENA_SOURCES) {
    if (typeof saved[key] === 'boolean') toggles[key] = saved[key];
  }
  return toggles;
}

/**
 * Everything a plan is computed from, as one string: equal strings mean the plan on screen still answers the form.
 * The account's troops are in it (their Guardsmen level fixes the pool), beside its sources and talents.
 */
export function arenaFingerprint(profile: Profile, inputs: Omit<ArenaInputs, 'seeded'>): string {
  return JSON.stringify([
    profile.troops,
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

/** A fresh squad: the profile default's setup. */
function freshInputs(): ArenaInputs {
  const fresh = defaultPrimeArena(useStore.getState().doc.deviceId);
  return {
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
  setRole: (role: PrimeArenaRole) => void;
  setMaxStacks: (maxStacks: number) => void;
  setToggle: (key: keyof PrimeArenaToggles, on: boolean) => void;
  /** Edits the squad, the way the calculator's `updateActiveSetup` edits a march. */
  updateSetup: (patch: (setup: BattleSetup) => Partial<BattleSetup>) => void;
  /** Clones the active march's setup into the squad (at most five captains), once. */
  seedFrom: (active: BattleSetup) => void;
  /** True once this opening of the page filled the captain slots; leaving the page forgets it. View state. */
  filled: boolean;
  /**
   * The page is open: seed the squad from the march if it never was, then, once per opening, fill its empty captain
   * slots with the strongest owned captains (B-45). Safe to call again while the page stays open.
   */
  open: (march: BattleSetup) => void;
  /** Replaces the whole selection with the strongest owned captains, five at most; nothing when none is owned. */
  pickStrongest: () => void;
  /** The captains (table ids) the last automatic selection added, for one short shine. View state, never saved. */
  shining: readonly string[];
  generate: (profile: Profile, budget?: PlanBudget) => void;
  reset: () => void;
}

/** How long a newly selected captain is marked to shine; the animation itself is a little shorter. */
export const CAPTAIN_SHINE_MS = 1200;
let shineTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * The one way an automatic selection (an opening, "Pick 5 strongest") is written: `entryIds` go into the squad through
 * `updateSetup`, as a hand edit does, so whatever follows a selection change follows both; the captains it adds
 * shine. Nothing is written when the same entries are already aboard: their order means nothing.
 */
function selectCaptains(profile: Profile, entryIds: string[]): void {
  const { setup, updateSetup } = usePrimeArenaStore.getState();
  const before = setup.active.captains;
  if (entryIds.length === before.length && entryIds.every((id) => before.includes(id))) return;
  const captainsOf = (ids: string[]): string[] =>
    ids.flatMap((id) => profile.sources.captains.find((entry) => entry.id === id)?.captainId ?? []);
  const aboard = new Set(captainsOf(before));
  const added = captainsOf(entryIds).filter((captainId) => !aboard.has(captainId));
  updateSetup((s) => ({ active: { ...s.active, captains: entryIds } }));
  if (added.length === 0) return;
  clearTimeout(shineTimer);
  usePrimeArenaStore.setState({ shining: added });
  shineTimer = setTimeout(() => {
    usePrimeArenaStore.setState({ shining: [] });
  }, CAPTAIN_SHINE_MS);
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
  filled: false,
  open: (march) => {
    get().seedFrom(march);
    const profile = selectActiveProfile(useStore.getState());
    if (profile === undefined || get().filled) return;
    set({ filled: true });
    // An id whose entry the account no longer has is nobody: its slot is empty.
    const owned = new Map(profile.sources.captains.map((entry) => [entry.id, entry.captainId]));
    const chosen = get().setup.active.captains.filter((id) => owned.has(id));
    const aboard = new Set(chosen.map((id) => owned.get(id)));
    const picks = rankArenaCaptains(profile.sources.captains)
      .filter((entry) => !aboard.has(entry.captainId))
      .slice(0, PRIME_ARENA_CAPTAINS - chosen.length)
      .map((entry) => entry.id);
    // With nobody to add the squad stays exactly as saved.
    if (picks.length > 0) selectCaptains(profile, [...chosen, ...picks]);
  },
  shining: [],
  pickStrongest: () => {
    const profile = selectActiveProfile(useStore.getState());
    if (profile === undefined) return;
    const strongest = rankArenaCaptains(profile.sources.captains).slice(0, PRIME_ARENA_CAPTAINS);
    if (strongest.length === 0) return;
    selectCaptains(
      profile,
      strongest.map((entry) => entry.id),
    );
  },
  generate: (profile, given) => {
    if (get().running) return;
    const inputs = pickInputs(get());
    const { role, maxStacks } = inputs;
    const budget = given ?? get().budget;
    const mine = ++generation;
    set({ running: true, failed: false });
    const prepared = primeArenaInputs({ ...inputs, profile, troops: profile.troops });
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
    set({
      ...fresh,
      filled: false,
      shining: [],
      running: false,
      failed: false,
      plan: null,
      planLevel: null,
      planKey: null,
    });
    save(fresh);
  },
}));

/** Fills the inputs from the active profile whenever its saved Prime Arena section is not what the store holds. */
function hydrate(profile: Profile | undefined): void {
  if (profile === undefined) return;
  const saved = profile.primeArena;
  const loaded: ArenaInputs = {
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
    shining: [],
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

// Leaving the page ends the opening and any shine: the next one fills the squad's empty captain slots again.
useUiStore.subscribe((state, previous) => {
  if (previous.page === 'primeArena' && state.page !== 'primeArena') {
    usePrimeArenaStore.setState({ filled: false, shining: [] });
  }
});
