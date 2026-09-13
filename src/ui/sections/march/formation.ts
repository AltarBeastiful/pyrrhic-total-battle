/**
 * What goes into the march and what stays out, from the March card: taking a unit type out, and
 * putting it back (S-53, the owner's story of 2026-09-13).
 *
 * Both are **run state**, not setup state: the list lives with the answer on screen, Generate clears
 * it, and nothing about it is stored, shared or synced. The Troops card describes the *account* — the
 * tiers it has unlocked and, at the top tier, the types it owns — and a march may never edit that.
 *
 * A put-back type is simply *in*: it is offered to the sizer like every other type and sized like
 * every other type. There is no way to force one — if it still does not fit, it comes straight back
 * to the left-out row with the sizer's own reason. Every action re-sizes the march on the spot,
 * because the answer on screen would otherwise describe a formation the player no longer asked for.
 */
import { resizeMarch } from './generate';
import { useRunStore } from './runStore';

const including = (ids: readonly string[], unitId: string): string[] =>
  ids.includes(unitId) ? [...ids] : [...ids, unitId];

const excluding = (ids: readonly string[], unitId: string): string[] => ids.filter((id) => id !== unitId);

/**
 * Take a unit type out of this march and re-size what is left. It stays owned — nothing in the
 * profile moves — it is simply not marching here, and the row under the pools says the player did it.
 */
export function removeFromFormation(unitId: string): void {
  const { includedUnitIds, leftOutByPlayer } = useRunStore.getState();
  void resizeMarch(excluding(includedUnitIds, unitId), including(leftOutByPlayer, unitId));
}

/** Put a type back in the march and re-size: it is in, and the sizer decides its count like any other. */
export function putBackInMarch(unitId: string): void {
  const { includedUnitIds, leftOutByPlayer } = useRunStore.getState();
  void resizeMarch(including(includedUnitIds, unitId), excluding(leftOutByPlayer, unitId));
}

/** Put every left-out type back at once — one re-size, not one per type. */
export function putBackAllInMarch(unitIds: readonly string[]): void {
  const { includedUnitIds, leftOutByPlayer } = useRunStore.getState();
  const back = new Set(unitIds);
  void resizeMarch(
    [...includedUnitIds, ...unitIds.filter((id) => !includedUnitIds.includes(id))],
    leftOutByPlayer.filter((id) => !back.has(id)),
  );
}
