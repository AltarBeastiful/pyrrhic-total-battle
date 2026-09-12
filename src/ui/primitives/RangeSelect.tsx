import { cn } from './cn';
import { NativeSelect } from './Select';
import { Toggle } from './Toggle';

export interface TierRangeValue {
  min: number;
  max: number;
}

export interface RangeSelectProps {
  label: string;
  /** `null` = the player has nothing unlocked in this family (no engineers, no monsters). */
  value: TierRangeValue | null;
  onChange: (value: TierRangeValue | null) => void;
  /** Lowest and highest tier the game offers for this family. */
  min: number;
  max: number;
  /** How one tier is written, e.g. `(tier) => 'G' + tier`. Defaults to roman-free "I".."X". */
  optionLabel?: (tier: number) => string;
  /** Adds the on/off switch that produces `null`. */
  allowNone?: boolean;
  disabled?: boolean;
  className?: string;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function defaultLabel(tier: number): string {
  return ROMAN[tier - 1] ?? String(tier);
}

/**
 * A min/max tier pair. Moving one end past the other pushes the other end, so the range is never
 * inverted and the player cannot type an impossible combination.
 */
export function RangeSelect({
  label,
  value,
  onChange,
  min,
  max,
  optionLabel = defaultLabel,
  allowNone = false,
  disabled = false,
  className,
}: RangeSelectProps) {
  const tiers = Array.from({ length: Math.max(0, max - min + 1) }, (_, index) => min + index);
  const options = tiers.map((tier) => ({ value: String(tier), label: optionLabel(tier) }));
  const active = value !== null;

  const setMin = (next: number): void => {
    onChange({ min: next, max: Math.max(next, value?.max ?? next) });
  };
  const setMax = (next: number): void => {
    onChange({ min: Math.min(next, value?.min ?? next), max: next });
  };

  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap items-end gap-2', className)}>
      <span aria-hidden="true" className="text-fg min-w-24 text-sm font-medium">
        {label}
      </span>
      {allowNone && (
        <Toggle
          label={`${label} unlocked`}
          hideLabel
          checked={active}
          disabled={disabled}
          onChange={(checked) => {
            onChange(checked ? { min, max: min } : null);
          }}
        />
      )}
      <NativeSelect
        label={`${label} lowest tier`}
        options={options}
        disabled={disabled || !active}
        value={String(value?.min ?? min)}
        onChange={(event) => {
          setMin(Number.parseInt(event.target.value, 10));
        }}
        className="w-24"
      />
      <span className="text-muted pb-2 text-xs">to</span>
      <NativeSelect
        label={`${label} highest tier`}
        options={options}
        disabled={disabled || !active}
        value={String(value?.max ?? min)}
        onChange={(event) => {
          setMax(Number.parseInt(event.target.value, 10));
        }}
        className="w-24"
      />
    </div>
  );
}
