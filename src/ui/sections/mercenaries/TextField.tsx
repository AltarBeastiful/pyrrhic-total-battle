import { useId } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../primitives';

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** A line under the field, tied to it with `aria-describedby`. */
  hint?: string;
  /** Screen-reader-only label, for a field that already has a visible caption. */
  hideLabel?: boolean;
  /** A glyph inside the field, before the text (a magnifier on a search box). Decorative. */
  prefix?: ReactNode;
  type?: 'text' | 'search';
  disabled?: boolean;
  className?: string;
}

/**
 * A plain single-line text input. `src/ui/primitives` has a numeric field but no text field yet, and the
 * mercenary picker needs one for its search box and one per field of the custom-mercenary form; it lives
 * here until a second section wants it.
 */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  hideLabel = false,
  prefix,
  type = 'text',
  disabled = false,
  className,
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className={cn('text-muted text-xs font-medium', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div
        className={cn(
          'tap border-field bg-surface flex items-center gap-1.5 rounded-lg border px-3 transition-colors',
          'focus-within:border-accent focus-within:ring-accent focus-within:ring-offset-bg focus-within:ring-2 focus-within:ring-offset-2',
          disabled && 'opacity-50',
        )}
      >
        {prefix !== undefined && (
          <span aria-hidden="true" className="text-muted shrink-0">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type={type}
          autoComplete="off"
          disabled={disabled}
          value={value}
          placeholder={placeholder ?? ''}
          aria-describedby={hint === undefined ? undefined : hintId}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          className="text-fg w-full bg-transparent py-1.5 text-sm outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      {hint !== undefined && (
        <span id={hintId} className="text-muted text-xs">
          {hint}
        </span>
      )}
    </div>
  );
}
