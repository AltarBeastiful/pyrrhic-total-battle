import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { cn } from './cn';

export interface NumberFieldProps {
  label: string;
  /** `null` means "empty"; the field never invents a 0 the player did not type. */
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Accept a fractional value (bonus percentages are entered as 39.5). */
  decimal?: boolean;
  /** Unit shown inside the field, e.g. "%". */
  suffix?: string;
  /** A glyph inside the field, before the value (a pool badge, a coin). Decorative. */
  prefix?: ReactNode;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  hideLabel?: boolean;
  id?: string;
  className?: string;
}

function format(value: number | null): string {
  return value === null || Number.isNaN(value) ? '' : String(value);
}

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

/**
 * Numeric input with a text draft: the player can type "1." or clear the field without the value
 * jumping around. `inputmode` keeps the phone keyboard numeric, and the value is clamped on blur.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  decimal = false,
  suffix,
  prefix,
  hint,
  placeholder,
  disabled = false,
  hideLabel = false,
  id,
  className,
}: NumberFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const [draft, setDraft] = useState(() => format(value));
  const [lastValue, setLastValue] = useState(value);

  // Value changed outside the field (undo, share link, another editor): re-sync the draft.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(format(value));
  }

  const parse = (text: string): number | null => {
    const normalized = text.replace(',', '.').trim();
    if (normalized === '' || normalized === '-' || normalized === '.') return null;
    const parsed = decimal ? Number.parseFloat(normalized) : Number.parseInt(normalized, 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={fieldId} className={cn('text-muted text-xs font-medium', hideLabel && 'sr-only')}>
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
          id={fieldId}
          type="text"
          inputMode={decimal ? 'decimal' : 'numeric'}
          enterKeyHint="done"
          autoComplete="off"
          disabled={disabled}
          value={draft}
          placeholder={placeholder ?? ''}
          aria-describedby={hint === undefined ? undefined : hintId}
          {...(min === undefined ? {} : { 'aria-valuemin': min })}
          {...(max === undefined ? {} : { 'aria-valuemax': max })}
          {...(step === undefined ? {} : { step })}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            const parsed = parse(next);
            setLastValue(parsed);
            onChange(parsed);
          }}
          onBlur={() => {
            const parsed = parse(draft);
            const next = parsed === null ? null : clamp(decimal ? parsed : Math.round(parsed), min, max);
            setDraft(format(next));
            setLastValue(next);
            if (next !== value) onChange(next);
          }}
          className="text-fg nums w-full bg-transparent py-1.5 text-sm outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {suffix !== undefined && <span className="text-muted pl-1 text-xs">{suffix}</span>}
      </div>
      {hint !== undefined && (
        <span id={hintId} className="text-muted text-xs">
          {hint}
        </span>
      )}
    </div>
  );
}
