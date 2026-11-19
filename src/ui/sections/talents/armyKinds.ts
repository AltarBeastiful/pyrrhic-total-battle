/**
 * Which unit kinds the account fields, for the talent planner (B-21).
 *
 * Read from the Troops section and the mercenaries, never typed again: a category counts when a guardsman or
 * specialist type of it is inside the tier ranges (the top tier minus the categories not yet upgraded), monsters
 * count when any monster type is in range, and engineers count when the engineers row is used at all. Hired
 * mercenaries add their category. The game files its siege engines and engineer corps under one bonus ("Engineer
 * corps"), so the row is one kind here too.
 */
import { unitById } from '@/data';
import type { UnitKind } from '@/engine/talents';
import type { Profile } from '@/state/schema';

import { rowSelection } from '../troops/rows';

export function fieldedKinds(profile: Pick<Profile, 'troops' | 'mercenaries'>): Set<UnitKind> {
  const kinds = new Set<UnitKind>();
  for (const row of ['guardsmen', 'specialists'] as const) {
    for (const unit of rowSelection(profile.troops, row))
      if (unit.category !== undefined) kinds.add(unit.category);
  }
  if (rowSelection(profile.troops, 'monsters').length > 0) kinds.add('monsters');
  if (profile.troops.engineers !== null) kinds.add('engineers');
  for (const { id } of profile.mercenaries.selected) {
    const category = unitById(id)?.category ?? profile.mercenaries.custom.find((m) => m.id === id)?.category;
    if (category !== undefined) kinds.add(category);
  }
  return kinds;
}
