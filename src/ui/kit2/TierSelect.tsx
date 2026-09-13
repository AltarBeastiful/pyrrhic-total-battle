/**
 * One end of a group's tier range (plan §3, TotalStack's "from G1 to G4"). A native select, because
 * that is what TotalStack uses and what a phone draws best: the wheel is the platform's, the list is
 * five entries long, and nothing has to be taught.
 *
 * The clamping is the whole reason this is a composite rather than a `NativeSelect` at the call
 * site: the two ends of a range constrain each other, so the "from" select may not offer a tier
 * above the "to" value and a value that falls outside the window is shown — and reported — clamped.
 */
import { NativeSelect } from '@mantine/core';

import { clampTier, type TierPrefix } from './tiers';

const NONE = '—';

export interface TierSelectProps {
  /** The accessible name of this end ("Guardsmen from", "Monsters to"); no visible label. */
  label: string;
  prefix: TierPrefix;
  /** Every tier the group has, lowest first. */
  tiers: number[];
  /** `null` is the "none" position, only reachable when `allowNone`. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Adds a "—" position below the first tier. */
  allowNone?: boolean;
  /**
   * Lowest tier this end may take — how a "to" value clamps its "from" select, and back. Explicitly
   * `undefined` is allowed: a section computes these from the other end, which may be "none".
   */
  min?: number | undefined;
  /** Highest tier this end may take. */
  max?: number | undefined;
  disabled?: boolean;
  w?: number | string;
}

export function TierSelect({
  label,
  prefix,
  tiers,
  value,
  onChange,
  allowNone = false,
  min,
  max,
  disabled = false,
  w = 72,
}: TierSelectProps) {
  const shown = clampTier(value, min, max);
  const data = [
    ...(allowNone ? [{ value: NONE, label: NONE }] : []),
    ...tiers.map((tier) => ({
      value: String(tier),
      label: `${prefix}${tier}`,
      disabled: (min !== undefined && tier < min) || (max !== undefined && tier > max),
    })),
  ];

  return (
    <NativeSelect
      aria-label={label}
      data={data}
      value={shown === null ? NONE : String(shown)}
      disabled={disabled}
      w={w}
      onChange={(event) => {
        const next = event.currentTarget.value;
        onChange(next === NONE ? null : clampTier(Number(next), min, max));
      }}
    />
  );
}
