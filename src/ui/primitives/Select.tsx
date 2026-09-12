import * as RadixSelect from '@radix-ui/react-select';
import type { SelectHTMLAttributes } from 'react';

import { CheckIcon, ChevronDownIcon } from '../icons';
import { cn } from './cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Accessible name of the control (the visible label, when there is one, is the caller's). */
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

const TRIGGER_CLASS =
  'tap border-line bg-surface text-fg flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50';

/** Styled listbox (Radix). Use `NativeSelect` for short, dense option lists such as tier pickers. */
export function Select({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  id,
  disabled = false,
  className,
}: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        aria-label={label}
        {...(id === undefined ? {} : { id })}
        className={cn(TRIGGER_CLASS, className)}
      >
        <RadixSelect.Value {...(placeholder === undefined ? {} : { placeholder })} />
        <RadixSelect.Icon>
          <ChevronDownIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="border-line bg-surface text-fg z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border shadow-lg"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled ?? false}
                className="data-[highlighted]:bg-raised flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none data-[disabled]:opacity-50"
              >
                <RadixSelect.ItemIndicator className="text-accent">
                  <CheckIcon />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

export interface NativeSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: SelectOption[];
  /** Keep the label for screen readers only (the field sits next to a visible caption). */
  hideLabel?: boolean;
}

/**
 * The platform's own picker. On phones it opens the OS wheel, which beats any custom listbox for
 * long numeric lists, so tier/level fields use this one.
 */
export function NativeSelect({ label, options, hideLabel = true, className, ...rest }: NativeSelectProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className={cn('text-muted text-xs font-medium', hideLabel && 'sr-only')}>{label}</span>
      <select
        aria-label={hideLabel ? label : undefined}
        className={cn(TRIGGER_CLASS, 'appearance-none', className)}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled ?? false}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
