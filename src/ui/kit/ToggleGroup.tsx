import { createContext, useContext, useId } from 'react';
import type { ReactNode } from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { cn } from './cn';
import { fieldLabel, fieldRoot } from './fieldStyles';
import { ring } from './styles';

type ToggleSize = 'sm' | 'md';

interface ToggleGroupBase {
  /** The visible name of the set of toggles. */
  label: string;
  orientation?: 'horizontal' | 'vertical';
  size?: ToggleSize;
  isDisabled?: boolean;
  /** `ToggleItem`s. */
  children: ReactNode;
  className?: string;
}

export type ToggleGroupProps = ToggleGroupBase &
  (
    | { selectionMode: 'single'; value: string | null; onChange: (value: string | null) => void }
    | { selectionMode: 'multiple'; value: string[]; onChange: (value: string[]) => void }
  );

export interface ToggleItemProps {
  /** Matches an entry of the group's `value`. */
  id: string;
  /** The accessible name, for when the item's content is a glyph or a bare number. */
  label: string;
  children: ReactNode;
  isDisabled?: boolean;
  className?: string;
}

/** The group tells its items how big they are; nothing else crosses. */
const ToggleSizeContext = createContext<ToggleSize>('md');

const toggleStyles = tv({
  slots: {
    root: fieldRoot,
    label: fieldLabel,
    group: 'flex flex-wrap gap-1.5',
    item: cn(
      'rounded-chip border-field/60 bg-sunken text-muted flex items-center justify-center gap-1.5 border font-medium',
      'hover:text-fg hover:border-field selected:bg-accent-soft selected:border-accent-line selected:text-fg',
      'disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors',
      ring,
    ),
  },
  variants: {
    size: {
      sm: { item: 'min-h-9 px-2.5 text-xs sm:min-h-8' },
      md: { item: 'min-h-11 px-3 text-sm sm:min-h-9' },
    },
    orientation: {
      horizontal: { group: 'flex-row' },
      vertical: { group: 'flex-col items-start' },
    },
  },
  defaultVariants: { size: 'md', orientation: 'horizontal' },
});

/**
 * A row (or column) of toggles with roving arrow-key navigation. In `single` mode it reads as a
 * radio group and `value` is one id or `null`; in `multiple` mode it reads as a toolbar of pressed
 * buttons and `value` is the list of ids that are on.
 */
export function ToggleGroup(props: ToggleGroupProps) {
  const { label, orientation = 'horizontal', size = 'md', isDisabled = false, children, className } = props;
  const labelId = useId();
  const styles = toggleStyles({ size, orientation });
  const selectedKeys =
    props.selectionMode === 'single' ? (props.value === null ? [] : [props.value]) : props.value;

  return (
    <div className={cn(styles.root(), className)}>
      <span id={labelId} className={styles.label()}>
        {label}
      </span>
      <ToggleSizeContext value={size}>
        <ToggleButtonGroup
          className={styles.group()}
          aria-labelledby={labelId}
          selectionMode={props.selectionMode}
          orientation={orientation}
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => {
            const values = [...keys].map(String);
            if (props.selectionMode === 'single') props.onChange(values[0] ?? null);
            else props.onChange(values);
          }}
          isDisabled={isDisabled}
        >
          {children}
        </ToggleButtonGroup>
      </ToggleSizeContext>
    </div>
  );
}

/** One toggle inside a `ToggleGroup`. */
export function ToggleItem({ id, label, children, isDisabled = false, className }: ToggleItemProps) {
  const size = useContext(ToggleSizeContext);
  const styles = toggleStyles({ size });

  return (
    <ToggleButton id={id} aria-label={label} className={cn(styles.item(), className)} isDisabled={isDisabled}>
      {children}
    </ToggleButton>
  );
}
