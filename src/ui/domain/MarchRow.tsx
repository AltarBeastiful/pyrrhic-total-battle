/**
 * The march table (design plan §7.5): one row per stack, in the order the stacks fall. The row's
 * left edge carries the group colour, the count is the biggest thing on the line and is a button
 * that copies it — the one number a player retypes into the game — and everything else (hits,
 * losses, revive cost) stays small beside it.
 *
 * `MarchTable` is the wrapper: the header row, and the horizontal scroller that keeps the table
 * from forcing the page sideways on a phone.
 */
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { tv } from 'tailwind-variants';

import type { UnitDef } from '../../data/types';
import { cn } from '../kit/cn';
import { ring } from '../kit/styles';
import { UnitTile } from './UnitTile';
import { GROUP_EDGE_LEFT, unitGroupOf } from './unitGroup';

const NUMBER = new Intl.NumberFormat('en-US');

/** How long "Copied" stays on the line. */
const COPIED_MS = 1500;

const table = tv({
  base: 'w-full border-collapse text-left',
});

const scroller = tv({
  base: 'w-full min-w-0 overflow-x-auto',
});

const head = tv({
  base: 'text-muted px-2 py-1 text-xs font-medium whitespace-nowrap',
});

const rowStyle = tv({
  base: 'border-line border-b align-middle',
});

const edgeCell = tv({
  base: 'border-l-4 py-1.5 pr-2 pl-2',
  variants: { group: GROUP_EDGE_LEFT },
});

const cell = tv({
  base: 'px-2 py-1.5',
  variants: {
    tone: { normal: 'text-sm', quiet: 'text-muted text-sm' },
    align: { start: 'text-left', end: 'text-right' },
  },
  defaultVariants: { tone: 'normal', align: 'end' },
});

const countButton = tv({
  base: 'text-stat font-display rounded-control px-1 leading-none tabular-nums',
});

/** "falls 3rd" — the position in the kill order, said the way a player says it. */
function ordinal(position: number): string {
  const rest = position % 100;
  if (rest >= 11 && rest <= 13) return `${position}th`;
  const last = position % 10;
  if (last === 1) return `${position}st`;
  if (last === 2) return `${position}nd`;
  if (last === 3) return `${position}rd`;
  return `${position}th`;
}

export interface MarchTableProps {
  /** Read to a screen reader in place of a visible title. */
  caption?: string;
  children: ReactNode;
  className?: string;
}

export function MarchTable({ caption, children, className }: MarchTableProps) {
  return (
    <div className={cn(scroller(), className)}>
      <table className={table()}>
        {caption !== undefined && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-line border-b">
            <th scope="col" className={head()}>
              <span className="sr-only">Type</span>
            </th>
            <th scope="col" className={head()}>
              Unit
            </th>
            <th scope="col" className={cn(head(), 'text-right')}>
              Count
            </th>
            <th scope="col" className={cn(head(), 'text-right')}>
              Hits
            </th>
            <th scope="col" className={cn(head(), 'text-right')}>
              Lost
            </th>
            <th scope="col" className={cn(head(), 'text-right')}>
              Revive
            </th>
            <th scope="col" className={head()}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export interface MarchRowProps {
  unit: UnitDef;
  count: number;
  hits?: number;
  lost?: number;
  reviveSilver?: number;
  /** Place in the kill order, 1-based; shown as "falls 3rd". */
  position?: number;
  /** The method put this stack last on purpose (mercenaries under some methods). */
  fallsLast?: boolean;
  /** Called after the count has been put on the clipboard. */
  onCopy?: (count: number) => void;
  /** Extra controls for this row; they get the last cell. */
  children?: ReactNode;
  className?: string;
}

export function MarchRow({
  unit,
  count,
  hits,
  lost,
  reviveSilver,
  position,
  fallsLast = false,
  onCopy,
  children,
  className,
}: MarchRowProps) {
  const group = unitGroupOf(unit);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(() => {
    const text = String(count);
    // Absent on an insecure origin and in a test environment; copying is a convenience, never a
    // requirement, so its absence must not break the row.
    const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
    if (clipboard?.writeText) void clipboard.writeText(text).catch(() => {});
    setCopied(true);
    onCopy?.(count);
  }, [count, onCopy]);

  return (
    <tr className={cn(rowStyle(), className)}>
      <td className={edgeCell({ group })}>
        <UnitTile unit={unit} size="sm" />
      </td>
      <td className={cell({ align: 'start' })}>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{unit.name}</span>
          {(position !== undefined || fallsLast) && (
            <span className="text-muted truncate text-xs">
              {position !== undefined && `falls ${ordinal(position)}`}
              {position !== undefined && fallsLast && ' · '}
              {fallsLast && 'falls last'}
            </span>
          )}
        </span>
      </td>
      <td className={cell()}>
        <span className="flex flex-col items-end gap-0.5">
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${NUMBER.format(count)}, ${unit.name}`}
            className={cn(countButton(), ring)}
          >
            {NUMBER.format(count)}
          </button>
          <span role="status" className="text-muted text-xs">
            {copied ? 'Copied' : ''}
          </span>
        </span>
      </td>
      <td className={cell()}>{hits === undefined ? '—' : NUMBER.format(hits)}</td>
      <td className={cell()}>{lost === undefined ? '—' : NUMBER.format(lost)}</td>
      <td className={cell({ tone: 'quiet' })}>
        {reviveSilver === undefined ? '—' : NUMBER.format(reviveSilver)}
      </td>
      <td className={cell({ align: 'start' })}>{children}</td>
    </tr>
  );
}
