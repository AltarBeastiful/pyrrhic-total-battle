/**
 * A list of rows you tick (design plan §7.2, review point R6). The whole row is the target — there
 * is no "Add" button at the end of the line — and a row keeps its checkbox semantics from the
 * keyboard: `↑`/`↓` walk the rows, `Space` ticks the focused one, `→`/`Tab` step into whatever the
 * row itself holds (a stepper, a gear).
 *
 * The tick is drawn, not focusable: the row carries `aria-selected`, so a screen reader already
 * says "Bear V, tier 5, selected" from the row's own name. A second checkbox control inside it
 * would name the same thing twice and add a tab stop to every line.
 *
 * Anything a player can operate inside a row goes in `actions`: that wrapper swallows the pointer
 * and the selection keys, so pressing the plus button of a stepper changes the number without
 * ticking the row it sits in.
 */
import { Children, isValidElement } from 'react';
import type { KeyboardEvent, PointerEvent, MouseEvent, ReactNode } from 'react';
import { GridList, GridListItem } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { CheckIcon } from '../icons';
import { cn } from './cn';
import { tapTarget } from './styles';

const selectable = tv({
  slots: {
    list: 'rounded-card border-line divide-line flex flex-col divide-y border outline-none',
    empty: 'text-muted px-3 py-3 text-sm',
    // `shrink-0`: inside a scrolling column a flex row would otherwise be squeezed under its own
    // content height, and a two-line row would spill over the one below it.
    item: cn(
      'group text-fg flex w-full shrink-0 cursor-pointer items-center gap-3 px-3 py-2 text-left outline-none',
      'hover:bg-raised selected:bg-accent-soft pressed:bg-sunken',
      'disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors',
      'focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2',
      tapTarget,
    ),
    mark: cn(
      'border-field/60 bg-sunken rounded-control flex size-5 shrink-0 items-center justify-center border',
      'motion-safe:transition-colors',
    ),
    content: 'flex min-w-0 flex-1 items-center gap-3',
    actions: 'flex shrink-0 items-center gap-2',
  },
  variants: {
    isSelected: {
      true: { mark: 'bg-accent border-accent text-accent-fg' },
      false: {},
    },
    /** How tall the rows are: `compact` for a long picker, `comfortable` when a row holds controls. */
    density: {
      compact: { item: 'py-1.5' },
      comfortable: { item: 'py-2' },
    },
    /** The list keeps about six rows on screen and scrolls inside itself for the rest. */
    scrolls: {
      true: { list: 'max-h-80 overflow-y-auto' },
      false: {},
    },
  },
  defaultVariants: { isSelected: false, density: 'comfortable', scrolls: false },
});

export interface SelectableListProps {
  /** The name of the list for assistive tech ("Mercenaries you own"). */
  label: string;
  /** The ids of the rows that are ticked. */
  selectedKeys: string[];
  /** The whole new selection, every time it changes. */
  onSelectionChange: (keys: string[]) => void;
  /** What the list says instead of rows when it has none. */
  emptyState?: ReactNode;
  density?: 'compact' | 'comfortable';
  /** Give the list its own scrollbar (a long picker) instead of letting it grow. */
  scrolls?: boolean;
  isDisabled?: boolean;
  /** `SelectableItem`s. */
  children: ReactNode;
  className?: string;
}

export interface SelectableItemProps {
  /** Matches an entry of the list's `selectedKeys`. */
  id: string;
  /** The row's accessible name, state excluded: "Bear V, tier 5". */
  label: string;
  /** The row's content: tiles, names, quiet facts. Nothing focusable. */
  children: ReactNode;
  /** Controls that live in the row and must not tick it (a stepper, a gear). */
  actions?: ReactNode;
  isDisabled?: boolean;
  className?: string;
}

/** `Ctrl`/`⌘ + A` reports "all"; the ids come back from what is on screen. */
function itemIds(children: ReactNode): string[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<SelectableItemProps>(child) && typeof child.props.id === 'string' ? [child.props.id] : [],
  );
}

export function SelectableList({
  label,
  selectedKeys,
  onSelectionChange,
  emptyState,
  density = 'comfortable',
  scrolls = false,
  isDisabled = false,
  children,
  className,
}: SelectableListProps) {
  const styles = selectable({ density, scrolls });

  return (
    <GridList
      aria-label={label}
      className={cn(styles.list(), className)}
      selectionMode="multiple"
      selectionBehavior="toggle"
      selectedKeys={new Set(selectedKeys)}
      onSelectionChange={(keys) => {
        onSelectionChange(keys === 'all' ? itemIds(children) : [...keys].map(String));
      }}
      disabledKeys={isDisabled ? itemIds(children) : []}
      {...(emptyState === undefined
        ? {}
        : { renderEmptyState: () => <p className={styles.empty()}>{emptyState}</p> })}
    >
      {children}
    </GridList>
  );
}

const stopPointer = (event: PointerEvent | MouseEvent): void => {
  event.stopPropagation();
};

/** `Space` and `Enter` belong to the control under the pointer, never to the row around it. */
const stopSelectionKeys = (event: KeyboardEvent): void => {
  if (event.key === ' ' || event.key === 'Enter') event.stopPropagation();
};

export function SelectableItem({
  id,
  label,
  children,
  actions,
  isDisabled = false,
  className,
}: SelectableItemProps) {
  const styles = selectable();

  return (
    <GridListItem id={id} textValue={label} isDisabled={isDisabled} className={cn(styles.item(), className)}>
      {({ isSelected }) => (
        <>
          <span aria-hidden="true" className={selectable({ isSelected }).mark()}>
            {isSelected ? <CheckIcon /> : null}
          </span>
          <span className={styles.content()}>{children}</span>
          {actions === undefined ? null : (
            <span
              className={styles.actions()}
              onPointerDown={stopPointer}
              onPointerUp={stopPointer}
              onClick={stopPointer}
              onKeyDown={stopSelectionKeys}
            >
              {actions}
            </span>
          )}
        </>
      )}
    </GridListItem>
  );
}
