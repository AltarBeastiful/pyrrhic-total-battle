import { CheckboxButton, CheckboxField } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { CheckIcon, MinusIcon } from '../icons';
import { cn } from './cn';
import { fieldLabel, ringFromGroup } from './fieldStyles';

export interface CheckboxProps {
  /** The visible name of the thing being ticked. */
  label: string;
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
  /** Some of the things under this one are on: the box shows a dash. */
  isIndeterminate?: boolean;
  isDisabled?: boolean;
  className?: string;
}

const checkboxStyles = tv({
  slots: {
    button: 'group flex min-h-11 cursor-pointer items-center gap-3 outline-none sm:min-h-9',
    box: cn(
      'border-line bg-field rounded-control flex size-5 shrink-0 items-center justify-center border',
      'group-selected:bg-accent group-selected:border-accent group-selected:text-accent-fg',
      'group-indeterminate:bg-accent group-indeterminate:border-accent group-indeterminate:text-accent-fg',
      ringFromGroup,
    ),
    label: fieldLabel,
  },
  variants: {
    isDisabled: {
      true: { button: 'cursor-not-allowed opacity-50' },
      false: {},
    },
  },
  defaultVariants: { isDisabled: false },
});

/** The mark inside the box: a dash when the state is mixed, a tick when it is on, nothing when off. */
function mark(isSelected: boolean, isIndeterminate: boolean) {
  if (isIndeterminate) return <MinusIcon />;
  if (isSelected) return <CheckIcon />;
  return null;
}

/**
 * A tick box with its label as the target. `isIndeterminate` is the "some of these are on" state
 * used by a group header; it is a look and an ARIA state, never a third value you can toggle into.
 */
export function Checkbox({
  label,
  isSelected,
  onChange,
  isIndeterminate = false,
  isDisabled = false,
  className,
}: CheckboxProps) {
  const styles = checkboxStyles({ isDisabled });

  return (
    <CheckboxField
      isSelected={isSelected}
      onChange={onChange}
      isIndeterminate={isIndeterminate}
      isDisabled={isDisabled}
    >
      <CheckboxButton className={cn(styles.button(), className)}>
        <span className={styles.box()}>{mark(isSelected, isIndeterminate)}</span>
        <span className={styles.label()}>{label}</span>
      </CheckboxButton>
    </CheckboxField>
  );
}
