/**
 * What goes into the march and what stays out, from the March card: taking a unit type out, putting
 * it back, and keeping one in for good (PLAN §3.4, the owner's "put it back" request).
 *
 * Every one of them is a **battle-setup** decision (owner, 2026-09-13). The Troops card describes
 * the *account* — the tiers it has unlocked and, at the top tier, the types it owns — and one march
 * may never edit that: the same account fields a different army from one march to the next. So
 * "leave out" writes `setup.excludedUnitIds`, and switching setup changes what marches without
 * touching a single unlocked tier.
 *
 * A type can be missing from a march for two unrelated reasons, and "put back" answers each of them:
 * the player took it out by hand (that is undone), or the sizer / priority search dropped it (the
 * only way to overrule them is a pin, `setup.pinnedUnitIds`). The two lists a setup keeps are
 * therefore mutually exclusive — a type is never both left out and kept in — and every action
 * re-sizes the march, because the answer on screen would otherwise describe a formation the player
 * no longer asked for.
 */
import { selectActiveSetup, useStore } from '@/state/store';

import { runGenerate } from './generate';

/** The unit types this march keeps whatever the sizer or the search would prefer. */
export function pinnedUnitIds(): string[] {
  return selectActiveSetup(useStore.getState())?.pinnedUnitIds ?? [];
}

/** The unit types the player took out of this march by hand. */
export function excludedUnitIds(): string[] {
  return selectActiveSetup(useStore.getState())?.excludedUnitIds ?? [];
}

const including = (ids: readonly string[], unitId: string): string[] =>
  ids.includes(unitId) ? [...ids] : [...ids, unitId];

const excluding = (ids: readonly string[], unitId: string): string[] => ids.filter((id) => id !== unitId);

/**
 * Take a unit type out of this march and generate again. It stays owned — nothing in the profile
 * moves — it is simply not marching here, and a type on its way out cannot stay pinned.
 */
export function removeFromFormation(unitId: string): void {
  useStore.getState().updateActiveSetup((current) => ({
    excludedUnitIds: including(current.excludedUnitIds, unitId),
    pinnedUnitIds: excluding(current.pinnedUnitIds, unitId),
  }));
  void runGenerate();
}

/**
 * Put a type back in the march, and generate again. Which of the two things that means is read off
 * the setup: a type the player took out is simply let back in, while a type the sizer or the search
 * dropped only comes back if the march is told to keep it — so that one is pinned.
 */
export function putBackInMarch(unitId: string): void {
  const takenOutByHand = excludedUnitIds().includes(unitId);
  useStore
    .getState()
    .updateActiveSetup((current) =>
      takenOutByHand
        ? { excludedUnitIds: excluding(current.excludedUnitIds, unitId) }
        : { pinnedUnitIds: including(current.pinnedUnitIds, unitId) },
    );
  void runGenerate();
}

/**
 * Keep a unit type in the march: it is stored on the battle setup, so it survives every later change,
 * the sizer reserves its smallest usable stack, and the priority search may not eliminate it. A kept
 * type is by definition not left out, so the pin clears the exclusion first.
 */
export function keepInMarch(unitId: string): void {
  useStore.getState().updateActiveSetup((current) => ({
    excludedUnitIds: excluding(current.excludedUnitIds, unitId),
    pinnedUnitIds: including(current.pinnedUnitIds, unitId),
  }));
  void runGenerate();
}

/** Stop keeping a unit type in: the sizer and the search are free to drop it again. */
export function stopKeeping(unitId: string): void {
  useStore.getState().updateActiveSetup((current) => ({
    pinnedUnitIds: excluding(current.pinnedUnitIds, unitId),
  }));
  void runGenerate();
}

/** Stop keeping every unit type in. */
export function stopKeepingAll(): void {
  if (pinnedUnitIds().length === 0) return;
  useStore.getState().updateActiveSetup({ pinnedUnitIds: [] });
  void runGenerate();
}
