/**
 * S-13 — the custom kill-order editor.
 *
 * Nothing but a `ReorderList` filled with the stacks of this march: the kit owns the dragging, the
 * keyboard drag session, the announcements, the position numbers and the two arrow buttons, and this
 * file only says what a row shows — the unit's mark, its name, its code and the pool it is paid from.
 */
import type { UnitDef } from '@/data/types';
import { ReorderItem, ReorderList } from '@/ui/kit';

import { PoolBadge, UnitBadge } from '../../icons';
import type { BadgeGroup } from '../../icons';

/** Mercenaries without a role tag still need a ring colour; their pool decides it. */
function badgeGroup(unit: UnitDef): BadgeGroup {
  if (unit.group !== undefined) return unit.group;
  return unit.pool === 'leadership' ? 'guardsmen' : 'monster';
}

export interface KillOrderListProps {
  /** Unit ids, first to die first. */
  order: string[];
  /** Every unit in `order`, by id. */
  units: Map<string, UnitDef>;
  onChange: (order: string[]) => void;
}

export function KillOrderList({ order, units, onChange }: KillOrderListProps) {
  return (
    <ReorderList label="Order of the fall" order={order} onReorder={onChange}>
      {order.map((id) => {
        const unit = units.get(id);
        if (unit === undefined) return null;
        return (
          <ReorderItem key={id} id={id} label={unit.name}>
            <UnitBadge
              group={badgeGroup(unit)}
              {...(unit.category === undefined ? {} : { category: unit.category })}
              tier={unit.tier}
              size="sm"
            />
            <span className="min-w-0 flex-1 truncate">{unit.name}</span>
            <span className="text-muted nums hidden sm:inline">{unit.label}</span>
            <span className="hidden sm:inline-flex">
              <PoolBadge pool={unit.pool} size="sm" />
            </span>
          </ReorderItem>
        );
      })}
    </ReorderList>
  );
}
