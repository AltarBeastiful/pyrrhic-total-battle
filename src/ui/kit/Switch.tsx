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
    button: 'group flex min-h-11 w-full cursor-pointer items-center gap-3 outline-none sm:min-h-10',
    // Material 3's switch: a 52 × 32 track with no outline of its own, and a thumb that grows from
    // 16 px to 24 px as it travels — the size change is what says "on" as loudly as the colour does.
    track: cn(
      'bg-sunken rounded-chip flex h-8 w-13 shrink-0 items-center p-1',
      'group-selected:bg-accent motion-safe:transition-colors',
      ringFromGroup,
    ),
    thumb: cn(
      'bg-field rounded-chip size-4 translate-x-1',
      'group-selected:bg-accent-fg group-selected:size-6 group-selected:translate-x-5',
      'motion-safe:transition-all motion-safe:duration-fast',
    ),
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
