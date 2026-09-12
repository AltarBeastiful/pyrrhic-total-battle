import type { Pool, Stack, UnitDef } from '@/engine/types';
import { PinIcon, PoolBadge, UnitBadge } from '@/ui/icons';
import { cn } from '@/ui/primitives';

import { amount } from './format';
import { findUnit, unitBadge } from './units';

/** One bar colour per housing pool — the same three the pool badges use. */
const POOL_BAR: Record<Pool, string> = {
  leadership: 'border-group-guardsmen bg-group-guardsmen/20',
  authority: 'border-accent bg-accent/20',
  dominance: 'border-group-monster bg-group-monster/20',
};

const POOL_LABELS: Record<Pool, string> = {
  leadership: 'Troops',
  authority: 'Mercenaries',
  dominance: 'Monsters',
};

const POOLS = Object.keys(POOL_LABELS) as Pool[];

export interface HpProfileProps {
  /** Stacks in kill order: the first to fall first. */
  stacks: readonly Stack[];
  units: readonly UnitDef[];
  /** Unit ids kept in the march by hand; they carry the pin mark. */
  kept: readonly string[];
  className?: string;
}

/**
 * The HP profile: one bar per stack, total HP, first to fall on top.
 *
 * This is the picture the whole calculator is about. The enemy always hits the stack with the most
 * health left, so the bars fall from top to bottom in the order the battle will destroy them, and a
 * profile whose bars are nearly the same length is a march where every stack gets to hit before it dies.
 * Pure CSS: a tinted bar with its pool's colour on the leading edge, the label and the count written on
 * it, and the figure at the end of the row.
 */
export function HpProfile({ stacks, units, kept, className }: HpProfileProps) {
  if (stacks.length === 0) return null;
  const widest = Math.max(...stacks.map((stack) => stack.totalHp), 1);
  const pools = POOLS.filter((pool) => stacks.some((stack) => stack.pool === pool));

  return (
    <figure className={cn('m-0 space-y-2', className)}>
      <figcaption className="text-muted text-xs">
        Total HP per stack, first to fall on top. The monster always hits the stack with the most health left,
        so bars of similar length mean every stack gets to strike before it falls.
      </figcaption>
      <ul aria-label="Total HP per stack, first to fall first" className="space-y-1">
        {stacks.map((stack) => {
          const unit = findUnit(stack.unitId, units);
          const width = Math.max(2, Math.round((stack.totalHp / widest) * 100));
          const isKept = kept.includes(stack.unitId);
          return (
            <li key={stack.unitId} className="relative flex items-center gap-2">
              <span className="bg-sunken border-line relative h-8 min-w-0 flex-1 overflow-hidden rounded-lg border">
                <span
                  aria-hidden="true"
                  style={{ width: `${String(width)}%` }}
                  className={cn('absolute inset-y-0 left-0 border-l-4', POOL_BAR[stack.pool])}
                />
                <span className="relative flex h-full min-w-0 items-center gap-1.5 pr-2 pl-3 text-xs">
                  <UnitBadge {...unitBadge(unit, stack.pool)} size="sm" />
                  <span className="truncate font-medium">{unit?.label ?? stack.unitId}</span>
                  <span className="nums text-muted">{amount(stack.count)}</span>
                  {isKept && (
                    <PinIcon
                      title="Kept in march"
                      className="text-accent shrink-0"
                      width="0.9em"
                      height="0.9em"
                    />
                  )}
                </span>
              </span>
              <span className="nums text-muted w-20 shrink-0 text-right text-xs">
                {amount(stack.totalHp)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {pools.map((pool) => (
          <span key={pool} className="inline-flex items-center gap-1.5">
            <PoolBadge pool={pool} size="sm" />
            {POOL_LABELS[pool]}
          </span>
        ))}
      </p>
    </figure>
  );
}
