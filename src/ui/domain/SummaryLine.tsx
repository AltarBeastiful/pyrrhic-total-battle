/**
 * The one line a collapsed card shows instead of its contents (design plan §7.1–§7.2):
 * "▮ G1–G4  ▮ S1–S2  ▮ no engineers". Each part may carry a group, in which case it opens with
 * that group's marker; the parts are separated by space and by their markers rather than by a
 * middle dot (D-19), and the line wraps rather than truncating, because a summary that hides half
 * of itself is not a summary.
 */
import type { ReactNode } from 'react';
import { tv } from 'tailwind-variants';

import { cn } from '../kit/cn';
import { GroupMarker } from './GroupMarker';
import type { UnitGroup } from './unitGroup';

const line = tv({
  base: 'flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-base',
});

const part = tv({
  base: 'inline-flex min-w-0 items-center gap-2',
  variants: { muted: { true: 'text-muted', false: 'text-fg' } },
  defaultVariants: { muted: false },
});

export interface SummaryPart {
  /** Draws the group's marker in front of the text. */
  group?: UnitGroup;
  text: string;
  muted?: boolean;
}

export interface SummaryLineProps {
  parts: SummaryPart[];
  /** Sits at the end of the line: a chevron, a count of what did not fit, an action. */
  trailing?: ReactNode;
  className?: string;
}

export function SummaryLine({ parts, trailing, className }: SummaryLineProps) {
  return (
    <span className={cn(line(), className)}>
      {parts.map((entry, index) => (
        <span key={`${entry.text}-${index}`} className={part({ muted: entry.muted ?? false })}>
          {entry.group !== undefined && <GroupMarker group={entry.group} />}
          <span className="min-w-0 truncate">{entry.text}</span>
        </span>
      ))}
      {trailing !== undefined && <span className="ms-auto shrink-0">{trailing}</span>}
    </span>
  );
}
