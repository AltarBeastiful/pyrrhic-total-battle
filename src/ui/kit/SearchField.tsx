import { Button, Group, Input, Label, SearchField as RACSearchField } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { CloseIcon, SearchIcon } from '../icons';
import { cn } from './cn';
import {
  fieldBox,
  fieldButton,
  fieldHeight,
  fieldInput,
  fieldLabel,
  fieldRoot,
  ringWithin,
} from './fieldStyles';

export interface SearchFieldProps {
  /** The visible name of what is being searched ("Find a mercenary"). */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** An example of what to type. Never a substitute for the label. */
  placeholder?: string;
  /** Called after the clear button (or `Esc`) empties the field. */
  onClear?: () => void;
  isDisabled?: boolean;
  className?: string;
}

const searchStyles = tv({
  slots: {
    root: fieldRoot,
    label: fieldLabel,
    box: cn(fieldBox, fieldHeight, 'gap-2 px-2', ringWithin),
    icon: 'text-muted shrink-0',
    input: cn(fieldInput, 'text-base sm:text-sm'),
    clear: cn(fieldButton, 'size-8'),
  },
});

/**
 * A text field for filtering a list: a magnifier inside the field, a clear button once there is
 * something to clear, and `Esc` to empty it. The label stays visible above the field.
 */
export function SearchField({
  label,
  value,
  onChange,
  placeholder,
  onClear,
  isDisabled = false,
  className,
}: SearchFieldProps) {
  const styles = searchStyles();

  return (
    <RACSearchField
      className={cn(styles.root(), className)}
      value={value}
      onChange={onChange}
      isDisabled={isDisabled}
      {...(onClear === undefined ? {} : { onClear })}
    >
      <Label className={styles.label()}>{label}</Label>
      <Group className={styles.box()}>
        <SearchIcon className={styles.icon()} />
        <Input className={styles.input()} {...(placeholder === undefined ? {} : { placeholder })} />
        {value !== '' && (
          <Button className={styles.clear()}>
            <CloseIcon />
          </Button>
        )}
      </Group>
    </RACSearchField>
  );
}
