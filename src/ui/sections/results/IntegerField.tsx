import { useState } from 'react';
import type { ReactNode } from 'react';

import { NumberField } from '@/ui/primitives';

export interface IntegerFieldProps {
  label: string;
  /** The stored value; a required number, never empty. */
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  hint?: string;
  /** A glyph inside the field, before the value (a pool badge, a category glyph). Decorative. */
  prefix?: ReactNode;
  hideLabel?: boolean;
  className?: string;
}

/**
 * `NumberField` for a stored value that is always a number (a capacity, a squad count, a unit count).
 *
 * Clearing such a field means "0", but the field must not print that 0 back into the box while the
 * player is still typing, so the draft is kept here as `number | null` and only the committed value is
 * compared against the store.
 */
export function IntegerField({
  label,
  value,
  onChange,
  min = 0,
  max,
  hint,
  prefix,
  hideLabel = false,
  className,
}: IntegerFieldProps) {
  const [draft, setDraft] = useState<number | null>(value);
  const [committed, setCommitted] = useState(value);

  // Changed elsewhere (a preset, a share link, "back to generated"): refill the box.
  if (value !== committed) {
    setCommitted(value);
    setDraft(value);
  }

  return (
    <NumberField
      label={label}
      value={draft}
      min={min}
      {...(max === undefined ? {} : { max })}
      {...(hint === undefined ? {} : { hint })}
      {...(prefix === undefined ? {} : { prefix })}
      hideLabel={hideLabel}
      {...(className === undefined ? {} : { className })}
      onChange={(next) => {
        setDraft(next);
        const value = next ?? 0;
        setCommitted(value);
        onChange(value);
      }}
    />
  );
}
