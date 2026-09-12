/**
 * The HP profile: one bar per stack, total HP, first to fall on top.
 *
 * The enemy always hits the stack with the most health left, so the bars fall from top to bottom in
 * the order the battle destroys the army, and a profile whose bars are nearly the same length is a
 * march where every stack gets to hit before it dies. It lives inside the folded Details now — it
 * explains the counts, it is not one of them.
 *
 * The bars use a square-root scale so a 260 K troop stack stays visible next to a 6.5 M mercenary
 * one; the figures beside them are exact.
 */
import type { Stack as StackType, UnitDef } from '@/engine/types';
import { GROUP_LABEL, GROUP_TONE, GroupMarker, unitGroupOf, UnitTile } from '@/ui/domain';
import { cn } from '@/ui/kit';
import { Cluster, Stack } from '@/ui/layout';

import { amount } from './format';
import { findUnit } from './units';

export interface HpProfileProps {
  /** Stacks in kill order: the first to fall first. */
  stacks: readonly StackType[];
  units: readonly UnitDef[];
  /** Unit ids kept in the march by hand; they carry the pin mark. */
  kept: readonly string[];
  className?: string;
}

export function HpProfile({ stacks, units, kept, className }: HpProfileProps) {
  if (stacks.length === 0) return null;
  const widest = Math.max(...stacks.map((stack) => stack.totalHp), 1);
  const rows = stacks.flatMap((stack) => {
    const unit = findUnit(stack.unitId, units);
    return unit === undefined ? [] : [{ stack, unit }];
  });
  const groups = [...new Set(rows.map((row) => unitGroupOf(row.unit)))];

  return (
    <figure className={cn('m-0', className)}>
      <figcaption className="text-muted text-sm">
        Total health per stack, first to fall on top. The bars are drawn on a square-root scale so the small
        stacks stay visible; the figures beside them are exact.
      </figcaption>
      <Stack as="ul" gap={1} aria-label="Total HP per stack, first to fall first">
        {rows.map(({ stack, unit }) => {
          const group = unitGroupOf(unit);
          // One scale for the whole list: two per-group scales would put a short bar above a long
          // one and lie about who falls first.
          const width = Math.max(2, Math.round(Math.sqrt(Math.max(0, stack.totalHp) / widest) * 100));
          return (
            <Cluster as="li" key={stack.unitId} gap={2} wrap={false}>
              <span className="bg-sunken relative min-w-0 flex-1">
                <span
                  aria-hidden="true"
                  data-hp-bar={String(width)}
                  style={{ width: `${String(width)}%` }}
                  className={cn('absolute inset-y-0 left-0 min-w-0.5 border-l-4', GROUP_TONE[group])}
                />
                <Cluster gap={1} wrap={false} className="relative min-h-8 min-w-0">
                  <UnitTile
                    unit={unit}
                    size="sm"
                    state={kept.includes(stack.unitId) ? 'pinned' : 'on'}
                    label={`${unit.name}${kept.includes(stack.unitId) ? ', kept in the march' : ''}`}
                  />
                  <span className="min-w-0 truncate">{unit.name}</span>
                  <span className="text-muted nums text-sm">{amount(stack.count)}</span>
                </Cluster>
              </span>
              <span className="text-muted nums text-sm">{amount(stack.totalHp)}</span>
            </Cluster>
          );
        })}
      </Stack>
      <Cluster gap={3}>
        {groups.map((group) => (
          <GroupMarker key={group} group={group} label={GROUP_LABEL[group]} />
        ))}
      </Cluster>
    </figure>
  );
}
