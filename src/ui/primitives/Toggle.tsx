import { useId } from 'react';

import { cn } from './cn';

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Small line under the label, e.g. what the option changes. */
  description?: string;
  disabled?: boolean;
  /** Screen-reader-only label, for a switch that sits next to its own caption. */
  hideLabel?: boolean;
  className?: string;
}

/** A switch built on `role="switch"`: no Radix dependency needed for two states. */
export function Toggle({
  label,
  checked,
  onChange,
  description,
  disabled = false,
  hideLabel = false,
  className,
}: ToggleProps) {
  const labelId = useId();
  return (
    <div className={cn('tap flex items-center gap-3', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={hideLabel ? undefined : labelId}
        aria-label={hideLabel ? label : undefined}
        disabled={disabled}
        onClick={() => {
          onChange(!checked);
        }}
        className={cn(
          'tap-area inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-accent border-accent shadow-card' : 'bg-raised border-field',
        )}
      >
        <span
          className={cn(
            'h-4.5 w-4.5 rounded-full shadow transition-transform',
            checked ? 'bg-accent-fg' : 'bg-surface',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
      {!hideLabel && (
        <span className="min-w-0">
          <span id={labelId} className="text-sm font-medium">
            {label}
          </span>
          {description !== undefined && <span className="text-muted block text-xs">{description}</span>}
        </span>
      )}
    </div>
  );
}
