import type { ReactNode } from 'react';

import { GearIcon } from '../icons';
import { cn } from './cn';

export interface PillProps {
  label: string;
  /** Whether the source is active for this march. */
  on: boolean;
  onToggle: (on: boolean) => void;
  /** When given, a gear opens this pill's editor (levels, stars, values). */
  onEdit?: () => void;
  /** Accessible name of the gear; defaults to "Edit <label>". */
  editLabel?: string;
  /** Secondary text inside the pill: a level, a value, a count. */
  detail?: ReactNode;
  /** Always-on source (the permanent editors): the label stops being a toggle. */
  locked?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * The bonus-source pill: tap the body to turn the source on or off for this march, tap the gear to
 * edit its values. Two separate buttons, never nested, so both are reachable by keyboard.
 */
export function Pill({
  label,
  on,
  onToggle,
  onEdit,
  editLabel,
  detail,
  locked = false,
  disabled = false,
  className,
}: PillProps) {
  // The space matters: without it the accessible name would read "Aydaelvl 20".
  const body = (
    <>
      <span className="truncate">{label}</span>
      {detail !== undefined && (
        <>
          {' '}
          <span className="text-xs opacity-80">{detail}</span>
        </>
      )}
    </>
  );
  return (
    <span
      className={cn(
        'tap inline-flex max-w-full items-center rounded-full border text-sm transition-colors',
        on ? 'border-accent bg-accent-soft text-fg' : 'border-line bg-surface text-muted',
        disabled && 'opacity-50',
        className,
      )}
    >
      {locked ? (
        <span className="flex items-center gap-1.5 py-1.5 pr-2 pl-3 font-medium">{body}</span>
      ) : (
        <button
          type="button"
          aria-pressed={on}
          disabled={disabled}
          onClick={() => {
            onToggle(!on);
          }}
          className="flex min-h-11 items-center gap-1.5 rounded-full py-1.5 pr-2 pl-3 font-medium disabled:cursor-not-allowed sm:min-h-0"
        >
          {body}
        </button>
      )}
      {onEdit !== undefined && (
        <button
          type="button"
          aria-label={editLabel ?? `Edit ${label}`}
          title={editLabel ?? `Edit ${label}`}
          disabled={disabled}
          onClick={onEdit}
          className="text-muted hover:text-fg flex h-11 w-9 items-center justify-center rounded-r-full disabled:cursor-not-allowed sm:h-8"
        >
          <GearIcon />
        </button>
      )}
    </span>
  );
}
