/**
 * How loud one stack is (design direction D-19). The March pane draws the army as a column of bars
 * in the order the stacks fall, each as long as the damage that stack deals in the battle, measured
 * against the loudest stack of the march.
 *
 * **Why damage and not health.** Total stack HP is the obvious quantity, and it is the wrong one:
 * the sizer gives every stack the same HP ceiling and then separates them by a hair (`RANK_SPREAD`),
 * so a column of HP bars would be a column of identical bars. Damage dealt varies by an order of
 * magnitude across a march — a tier-1 stack of twelve thousand and a tier-3 stack of two thousand
 * are nothing alike — so the bar carries information the figures do not.
 *
 * The bar is a picture of a number that is already on the line, never the only way to read it: the
 * count sits beside it and the bar itself is `aria-hidden`.
 */
import { tv } from 'tailwind-variants';

import { cn } from '../kit/cn';
import { GROUP_EDGE_BG } from './unitGroup';
import type { UnitGroup } from './unitGroup';

const track = tv({
  base: 'bg-sunken h-1.5 w-full min-w-0 overflow-hidden rounded-tile',
});

const fill = tv({
  base: 'block h-full rounded-tile',
  variants: { group: GROUP_EDGE_BG },
});

export interface DamageBarProps {
  group: UnitGroup;
  /** This stack's damage as a fraction of the loudest stack's, `0`–`1`. */
  share: number;
  className?: string;
}

export function DamageBar({ group, share, className }: DamageBarProps) {
  // A stack that lands a hit at all keeps a visible sliver, so "quiet" never reads as "absent".
  const percent = share <= 0 ? 0 : Math.max(2, Math.min(100, Math.round(share * 100)));

  return (
    <span aria-hidden="true" className={cn(track(), className)}>
      <span className={fill({ group })} style={{ width: `${String(percent)}%` }} />
    </span>
  );
}
