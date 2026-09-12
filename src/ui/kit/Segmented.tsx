import { useId } from 'react';
import type { ReactNode } from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { CheckIcon } from '../icons';
import { cn } from './cn';
import { fieldHeight, fieldLabel, fieldRoot } from './fieldStyles';
import { ring, stateLayer } from './styles';

export interface SegmentedOption {
  value: string;
  /** The visible text of the segment. */
  label: string;
  /** A glyph before the text; decorative, the text carries the meaning. */
  icon?: ReactNode;
  isDisabled?: boolean;
}

export interface SegmentedProps {
  /** The visible name of the choice ("Enemy formation", "Theme"). */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  size?: 'sm' | 'md';
  isDisabled?: boolean;
  className?: string;
}

const segmentedStyles = tv({
  slots: {
    root: fieldRoot,
    label: fieldLabel,
    // Material 3's segmented button: one outlined container, hairline dividers between the segments,
    // and the chosen one marked by a tonal fill and a check — never a solid accent block.
    group: 'rounded-control border-field/60 divide-field/60 flex w-full divide-x overflow-hidden border',
    item: cn(
      'group text-muted flex min-w-0 flex-1 items-center justify-center gap-2 px-2 font-medium sm:px-3',
      'selected:bg-accent-soft selected:text-fg selected:selection-rule-bottom',
      stateLayer,
      'disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors',
      ring,
      'focus-visible:-outline-offset-2',
    ),
    check: 'hidden size-4 shrink-0 group-selected:block',
    icon: 'shrink-0 group-selected:hidden',
  },
  variants: {
    size: {
      sm: { item: 'min-h-10 text-xs sm:min-h-9' },
      md: { item: cn(fieldHeight, 'text-sm') },
    },
  },
  defaultVariants: { size: 'md' },
});

/**
 * One row, one choice: the segments are a single-selection `ToggleButtonGroup`, which means a
 * radio group to a screen reader and left/right arrow keys between the segments. Selection can
 * never be emptied — a segmented control always shows where you are.
 */
export function Segmented({
  label,
  value,
  onChange,
  options,
  size = 'md',
  isDisabled = false,
  className,
}: SegmentedProps) {
  const labelId = useId();
  const styles = segmentedStyles({ size });

  return (
    <div className={cn(styles.root(), className)}>
      <span id={labelId} className={styles.label()}>
        {label}
      </span>
      <ToggleButtonGroup
        className={styles.group()}
        aria-labelledby={labelId}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
          const [first] = [...keys];
          if (first !== undefined) onChange(String(first));
        }}
        isDisabled={isDisabled}
      >
        {options.map((option) => (
          <ToggleButton
            key={option.value}
            id={option.value}
            className={styles.item()}
            isDisabled={option.isDisabled ?? false}
          >
            <CheckIcon aria-hidden="true" className={styles.check()} />
            {option.icon === undefined ? null : <span className={styles.icon()}>{option.icon}</span>}
            <span className="truncate">{option.label}</span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
