import { useId } from 'react';

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
          'tap border-field bg-surface flex items-center rounded-lg border px-3',
          disabled && 'opacity-50',
        )}
      >
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
          className="text-fg w-full bg-transparent py-1.5 text-sm outline-none"
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
