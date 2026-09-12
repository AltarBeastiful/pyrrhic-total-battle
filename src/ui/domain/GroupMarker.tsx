/**
 * The small coloured mark that opens a summary line and labels a group's row (design plan §7.1):
 * a 10×16 rounded bar in the group's edge colour, with the group's name beside it when there is
 * room for it.
 *
 * The bar is decorative — colour alone never carries meaning — so when no visible label is asked
 * for, the group's name is still there for a screen reader.
 */
import { tv } from 'tailwind-variants';

import { cn } from '../kit/cn';
import { GROUP_EDGE_BG, GROUP_LABEL } from './unitGroup';
import type { UnitGroup } from './unitGroup';

const marker = tv({
  base: 'inline-flex shrink-0 items-center gap-1.5 text-base',
});

const bar = tv({
  base: 'rounded-chip inline-block h-4 w-2.5 shrink-0',
  variants: { group: GROUP_EDGE_BG },
});

export interface GroupMarkerProps {
  group: UnitGroup;
  /** Written beside the bar. Left out, the group's name is still announced. */
  label?: string;
  className?: string;
}

export function GroupMarker({ group, label, className }: GroupMarkerProps) {
  return (
    <span className={cn(marker(), className)}>
      <span aria-hidden="true" className={bar({ group })} />
      {label === undefined ? (
        <span className="sr-only">{GROUP_LABEL[group]}</span>
      ) : (
        <span className="min-w-0 truncate">{label}</span>
      )}
    </span>
  );
}
