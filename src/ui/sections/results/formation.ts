/**
 * What goes into the march and what stays out, from the Results section: taking a unit type out,
 * putting it back, and keeping one in for good (PLAN §3.4, the owner's "put it back" request).
 *
 * The three live together because they share one invariant: **a type is never both kept and removed**.
 * Keeping a type in the march therefore un-excludes it first (and brings a removed mercenary back with
 * its owned cap), and removing one drops its pin. Every one of them re-sizes the march, because the
 * answer on screen would otherwise describe a formation the player no longer asked for.
 */
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import { runGenerate } from './generate';
import { useRunStore } from './runStore';

/** The unit types this march keeps whatever the sizer or the search would prefer. */
export function pinnedUnitIds(): string[] {
  return selectActiveSetup(useStore.getState())?.pinnedUnitIds ?? [];
}

/**
 * Put a unit type back in the formation without generating: drop it from the profile's exclusions and,
 * when it is a mercenary the player removed here, re-own it at the cap it had.
 */
function unremove(unitId: string): void {
  const state = useStore.getState();
  const profile = selectActiveProfile(state);
  if (!profile) return;
  const removed = useRunStore.getState().removedMercenaries.find((entry) => entry.id === unitId);
  if (removed) {
    useRunStore.getState().forgetMercenary(unitId);
    state.updateProfile(profile.id, (current) => ({
      mercenaries: {
        ...current.mercenaries,
        selected: current.mercenaries.selected.some((entry) => entry.id === unitId)
          ? current.mercenaries.selected
          : [...current.mercenaries.selected, { id: removed.id, cap: removed.cap }],
      },
    }));
  }
  state.updateProfile(profile.id, (current) => ({
    troops: {
      ...current.troops,
      excludedUnitIds: current.troops.excludedUnitIds.filter((id) => id !== unitId),
    },
  }));
}

/**
 * Take a unit type out of the formation and generate again. A mercenary leaves the owned list (its cap is
 * remembered so it can come back); anything else is added to the profile's per-unit exclusions, which is
 * where the Troops section reads them from too. A type on its way out cannot stay pinned.
 */
export function removeFromFormation(unitId: string): void {
  const state = useStore.getState();
  const profile = selectActiveProfile(state);
  if (!profile) return;
  const owned = profile.mercenaries.selected.find((entry) => entry.id === unitId);
  if (owned) {
    useRunStore.getState().rememberMercenary({ id: owned.id, cap: owned.cap });
    state.updateProfile(profile.id, (current) => ({
      mercenaries: {
        ...current.mercenaries,
        selected: current.mercenaries.selected.filter((entry) => entry.id !== unitId),
      },
    }));
  } else {
    state.updateProfile(profile.id, (current) => ({
      troops: {
        ...current.troops,
        excludedUnitIds: current.troops.excludedUnitIds.includes(unitId)
          ? current.troops.excludedUnitIds
          : [...current.troops.excludedUnitIds, unitId],
      },
    }));
  }
  state.updateActiveSetup((current) => ({
    pinnedUnitIds: current.pinnedUnitIds.filter((id) => id !== unitId),
  }));
  void runGenerate();
}

/** Put a unit type the player removed by hand back in the formation, and generate again. */
export function restoreToFormation(unitId: string): void {
  unremove(unitId);
  void runGenerate();
}

/**
 * Keep a unit type in the march: it is stored on the battle setup, so it survives every later change,
 * the sizer reserves its smallest usable stack, and the priority search may not eliminate it.
 */
export function keepInMarch(unitId: string): void {
  unremove(unitId);
  useStore.getState().updateActiveSetup((current) => ({
    pinnedUnitIds: current.pinnedUnitIds.includes(unitId)
      ? current.pinnedUnitIds
      : [...current.pinnedUnitIds, unitId],
  }));
  void runGenerate();
}

/** Stop keeping a unit type in: the sizer and the search are free to drop it again. */
export function stopKeeping(unitId: string): void {
  useStore.getState().updateActiveSetup((current) => ({
    pinnedUnitIds: current.pinnedUnitIds.filter((id) => id !== unitId),
  }));
  void runGenerate();
}

/** Stop keeping every unit type in. */
export function stopKeepingAll(): void {
  if (pinnedUnitIds().length === 0) return;
  useStore.getState().updateActiveSetup({ pinnedUnitIds: [] });
  void runGenerate();
}
