import type { ReactNode } from 'react';
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as RACSelect,
  SelectValue,
  Text,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { CheckIcon, ChevronDownIcon } from '../icons';
import { cn } from './cn';
import { fieldBox, fieldDescription, fieldLabel, fieldRoot } from './fieldStyles';
import { ring } from './styles';

export interface SelectOption {
  value: string;
  /** The visible text of the option, and its accessible name. */
  label: string;
  /** One quiet line under the option saying what choosing it does. */
  description?: string;
  /** A glyph before the text; decorative. */
  icon?: ReactNode;
  isDisabled?: boolean;
}

export interface SelectProps {
  /** The visible name of the choice. */
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** What the closed field says while nothing is chosen. Never a substitute for the label. */
  placeholder?: string;
  size?: 'sm' | 'md';
  description?: string;
  isDisabled?: boolean;
  className?: string;
}

const selectStyles = tv({
  slots: {
    root: fieldRoot,
    label: fieldLabel,
    trigger: cn(
      fieldBox,
      'text-fg w-full justify-between gap-2 px-3 text-left',
      'hover:border-field disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors',
      ring,
    ),
    value: 'min-w-0 flex-1 truncate placeholder:text-muted',
    chevron: 'text-muted shrink-0',
    description: fieldDescription,
    popover: 'rounded-card border-line bg-surface shadow-pop w-(--trigger-width) border p-1',
    listbox: 'flex max-h-64 flex-col gap-0.5 overflow-auto outline-none',
    item: cn(
      'group rounded-control text-fg flex cursor-pointer items-center gap-2 px-2 py-2 outline-none',
      'focus:bg-accent-soft selected:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50',
    ),
    itemText: 'flex min-w-0 flex-1 flex-col',
    itemLabel: 'truncate text-sm',
    itemDescription: cn(fieldDescription, 'truncate'),
    itemCheck: 'text-accent shrink-0 opacity-0 group-selected:opacity-100',
  },
  variants: {
    size: {
      sm: { trigger: 'min-h-9 text-xs sm:min-h-8' },
      md: { trigger: 'min-h-11 text-sm sm:min-h-9' },
    },
  },
  defaultVariants: { size: 'md' },
});

/**
 * A choice out of a short list. The trigger shows the chosen option (with its glyph); the list
 * opens on `Enter`, `Space` or an arrow key, moves with the arrow keys and jumps with typing.
 * There is no native `<select>` behind it, so the options can carry a description.
 */
export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  size = 'md',
  description,
  isDisabled = false,
  className,
}: SelectProps) {
  const styles = selectStyles({ size });
  const selected = options.find((option) => option.value === value);
  const placeholderText = placeholder ?? 'Choose…';

  return (
    <RACSelect
      className={cn(styles.root(), className)}
      value={value}
      onChange={(key) => {
        if (key !== null) onChange(String(key));
      }}
      placeholder={placeholderText}
      isDisabled={isDisabled}
    >
      <Label className={styles.label()}>{label}</Label>
      <Button className={styles.trigger()}>
        {selected?.icon}
        <SelectValue className={styles.value()}>
          {({ isPlaceholder, selectedText }) => (isPlaceholder ? placeholderText : selectedText)}
        </SelectValue>
        <ChevronDownIcon className={styles.chevron()} />
      </Button>
      {description !== undefined && (
        <Text slot="description" className={styles.description()}>
          {description}
        </Text>
      )}
      <Popover className={styles.popover()}>
        <ListBox className={styles.listbox()}>
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              className={styles.item()}
              isDisabled={option.isDisabled ?? false}
            >
              {option.icon}
              <span className={styles.itemText()}>
                <span className={styles.itemLabel()}>{option.label}</span>
                {option.description !== undefined && (
                  <span className={styles.itemDescription()}>{option.description}</span>
                )}
              </span>
              <CheckIcon className={styles.itemCheck()} />
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </RACSelect>
  );
}
