/**
 * A setting that is on or off, as a full row (plan §3): the name at the start, the switch at the
 * far end, the sentence that explains it under the name. `labelPosition="left"` is what makes the
 * row read as a setting rather than as a checkbox with a caption.
 */
import { Switch } from '@mantine/core';
import type { ReactNode } from 'react';

import classes from './kit.module.css';

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
      classNames={{ body: classes.switchRow }}
      label={label}
      description={description}
      labelPosition="left"
      size={size}
      checked={checked}
      disabled={disabled}
      onChange={(event) => {
        onChange(event.currentTarget.checked);
      }}
    />
  );
}
