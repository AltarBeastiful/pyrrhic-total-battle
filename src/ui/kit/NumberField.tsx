/**
 * Every figure a player retypes from the game (plan §3): a pool limit, an owned count, an enemy's
 * army. `NumberInput` with the theme's defaults — no steppers (the numbers run to six digits, a
 * stepper is a lie at that scale), a space as the thousands separator, and the old value selected
 * the moment the field takes focus, so typing replaces rather than appends.
 *
 * "84 300" and "84,300" both parse: the separator is what we *write*, and anything that is not a
 * digit is dropped on the way in.
 */
import { NumberInput } from '@mantine/core';
import type { ReactNode } from 'react';

export interface NumberFieldProps {
  label: string;
  /**
   * What a screen reader calls the field when its visible label is not enough on its own: four
   * fields under one heading may each show only "Guardsmen", and still be "Guardsmen training
   * cost reduction" to anyone who cannot see the heading (the temple sheet).
   */
  accessibleName?: string;
  /** `null` is an empty field; only reachable when `allowEmpty`. */
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  /** An empty field reports `null` instead of falling back to `min` (or 0). */
  allowEmpty?: boolean;
  /** Counts are whole; only a field that really measures a fraction turns this on. */
  allowDecimal?: boolean;
  /** A glyph inside the field, at the start: the pool's mark, a currency. */
  leftSection?: ReactNode;
  description?: ReactNode;
  /**
   * What is wrong with the figure. A sentence is written under the field; `true` marks the field
   * and says nothing, for a form that carries one message line of its own (the command bar). Either
   * way the input is `aria-invalid`.
   */
  error?: ReactNode;
  /** What the phone's Enter key says it does. The command bar's fields go. */
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
  placeholder?: string;
  disabled?: boolean;
  w?: number | string;
}

export function NumberField({
  label,
  accessibleName,
  value,
  onChange,
  min = 0,
  max,
  allowEmpty = false,
  allowDecimal = false,
  leftSection,
  description,
  error,
  enterKeyHint,
  placeholder,
  disabled = false,
  w,
}: NumberFieldProps) {
  return (
    <NumberInput
      label={label}
      value={value ?? ''}
      min={min}
      // Off by default, and not only because counts are whole: react-number-format accepts a comma
      // as a decimal separator, so "84,300" would otherwise reach the caller as 84.3.
      allowDecimal={allowDecimal}
      allowNegative={false}
      disabled={disabled}
      leftSection={leftSection}
      description={description}
      error={error}
      // The phone keyboard this field asks for: the digits pad for a count, the decimal one only
      // where a fraction is meant. Through `attributes` because Mantine writes `inputMode` itself,
      // after the props it was given, and `attributes.input` is the one thing it writes last.
      attributes={{
        input: {
          inputMode: allowDecimal ? 'decimal' : 'numeric',
          ...(accessibleName === undefined ? {} : { 'aria-label': accessibleName }),
        },
      }}
      {...(enterKeyHint === undefined ? {} : { enterKeyHint })}
      {...(max === undefined ? {} : { max })}
      {...(placeholder === undefined ? {} : { placeholder })}
      {...(w === undefined ? {} : { w })}
      onChange={(next) => {
        if (next === '' || next === null) {
          onChange(allowEmpty ? null : min);
          return;
        }
        const parsed = typeof next === 'number' ? next : Number(String(next).replace(/[^\d.-]/g, ''));
        onChange(Number.isNaN(parsed) ? (allowEmpty ? null : min) : parsed);
      }}
    />
  );
}
