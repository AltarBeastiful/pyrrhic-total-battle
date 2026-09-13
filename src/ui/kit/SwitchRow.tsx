/**
 * A setting that is on or off (plan §3). The owner's correction of 2026-09-13: the switch sits
 * **immediately before its label**, not at the far end of a full-width row — a toggle two hundred
 * pixels from the words it governs reads as belonging to nothing, and the whole row as a target
 * made a stray press change the march.
 *
 * So the target is the switch and its label, nothing wider; the sentence that explains the option
 * sits under the label, muted, and is not part of it.
 */
import { Switch } from '@mantine/core';
import type { ReactNode } from 'react';

export interface SwitchRowProps {
  label: string;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export function SwitchRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  size = 'sm',
}: SwitchRowProps) {
  return (
    <Switch
      label={label}
      description={description}
      labelPosition="right"
      size={size}
      checked={checked}
      disabled={disabled}
      onChange={(event) => {
        onChange(event.currentTarget.checked);
      }}
    />
  );
}
