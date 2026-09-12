import { SwitchButton, SwitchField, Text } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { cn } from './cn';
import { fieldDescription, fieldLabel, fieldRoot, ringFromGroup } from './fieldStyles';

export interface SwitchProps {
  /** The visible name of the setting. */
  label: string;
  /** One quiet line under the row saying what turning it on does. */
  description?: string;
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
  isDisabled?: boolean;
  className?: string;
}

const switchStyles = tv({
  slots: {
    root: fieldRoot,
    button: 'group flex min-h-11 w-full cursor-pointer items-center gap-3 outline-none sm:min-h-9',
    track: cn(
      'border-line bg-sunken rounded-chip flex h-6 w-11 shrink-0 items-center border p-0.5',
      'selected:bg-accent selected:border-accent motion-safe:transition-colors',
      ringFromGroup,
    ),
    thumb:
      'bg-surface rounded-chip shadow-card size-5 group-selected:translate-x-5 motion-safe:transition-transform',
    label: fieldLabel,
    description: fieldDescription,
  },
  variants: {
    isDisabled: {
      true: { button: 'cursor-not-allowed opacity-50' },
      false: {},
    },
  },
  defaultVariants: { isDisabled: false },
});

/**
 * A setting you turn on or off. The row is the target (label included), the track shows the state
 * and carries the focus ring, and the optional description is wired as the field's description so a
 * screen reader reads it with the switch.
 */
export function Switch({
  label,
  description,
  isSelected,
  onChange,
  isDisabled = false,
  className,
}: SwitchProps) {
  const styles = switchStyles({ isDisabled });

  return (
    <SwitchField
      className={cn(styles.root(), className)}
      isSelected={isSelected}
      onChange={onChange}
      isDisabled={isDisabled}
    >
      <SwitchButton className={styles.button()}>
        <span className={styles.track()}>
          <span className={styles.thumb()} />
        </span>
        <span className={styles.label()}>{label}</span>
      </SwitchButton>
      {description !== undefined && (
        <Text slot="description" className={styles.description()}>
          {description}
        </Text>
      )}
    </SwitchField>
  );
}
