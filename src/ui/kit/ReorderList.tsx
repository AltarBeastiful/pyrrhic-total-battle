/**
 * A list whose order is the data: drag a row with a pointer, or move it with the keyboard.
 *
 * Dragging is the part of a list like this that a keyboard or a screen reader handles worst, so
 * there are two keyboard paths and both are real. React Aria's own drag session lives on the handle
 * (`Enter` picks the row up, the arrows walk the drop targets, `Enter` drops it, `Esc` gives up) and
 * announces every step; and every row also carries plain "move up" / "move down" buttons, which are
 * the guaranteed path and the one most players will find first.
 *
 * The list owns nothing: it is told the order and reports a new one. The position number and the two
 * arrow buttons come from the list, so a row only has to say what it holds.
 */
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { Button as RACButton, GridList, GridListItem, useDragAndDrop } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { ChevronDownIcon, ChevronUpIcon, GripIcon } from '../icons';
import { cn } from './cn';
import { IconButton } from './IconButton';
import { ring, stateLayer } from './styles';

const reorder = tv({
  slots: {
    list: 'rounded-card border-line divide-line flex flex-col divide-y border outline-none',
    empty: 'text-muted px-3 py-3 text-sm',
    item: cn(
      'group text-fg flex w-full shrink-0 items-center gap-2 px-2 py-1 text-left outline-none',
      'drop-target:bg-accent-soft dragging:opacity-50 motion-safe:transition-colors',
      'focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2',
    ),
    handle: cn(
      'text-muted rounded-control flex min-h-11 w-9 shrink-0 cursor-grab items-center justify-center',
      'sm:min-h-9 sm:w-8',
      stateLayer,
      ring,
      'focus-visible:-outline-offset-2',
    ),
    position: 'text-muted nums w-5 shrink-0 text-right text-xs',
    content: 'flex min-w-0 flex-1 items-center gap-2',
    actions: 'flex shrink-0 items-center gap-1',
  },
});

interface ReorderContextValue {
  order: string[];
  move: (id: string, to: number) => void;
}

const ReorderContext = createContext<ReorderContextValue | null>(null);

export interface ReorderListProps {
  /** The name of the list for assistive tech ("Order of the fall"). */
  label: string;
  /** The row ids, in the order they are shown. */
  order: string[];
  /** The whole new order, every time one row moves. */
  onReorder: (order: string[]) => void;
  /** What the list says instead of rows when it has none. */
  emptyState?: ReactNode;
  /** `ReorderItem`s, in the same order as `order`. */
  children: ReactNode;
  className?: string;
}

export interface ReorderItemProps {
  /** Matches one entry of the list's `order`. */
  id: string;
  /** The row's accessible name, position excluded: "Archer". */
  label: string;
  /** The row's content: marks, names, quiet facts. Nothing focusable. */
  children: ReactNode;
  /** Controls that belong to the row, left of its two arrows. */
  actions?: ReactNode;
  className?: string;
}

/** Moves `ids` (in their current relative order) so that they land before or after `target`. */
function reordered(order: string[], ids: string[], target: string, after: boolean): string[] {
  const moving = order.filter((id) => ids.includes(id));
  const rest = order.filter((id) => !ids.includes(id));
  const at = rest.indexOf(target);
  if (at === -1 || moving.length === 0) return order;
  const insert = after ? at + 1 : at;
  return [...rest.slice(0, insert), ...moving, ...rest.slice(insert)];
}

export function ReorderList({ label, order, onReorder, emptyState, children, className }: ReorderListProps) {
  const styles = reorder();

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder(event) {
      const ids = [...event.keys].map(String);
      const next = reordered(order, ids, String(event.target.key), event.target.dropPosition === 'after');
      if (next.some((id, index) => id !== order[index])) onReorder(next);
    },
  });

  const move = (id: string, to: number): void => {
    const from = order.indexOf(id);
    if (from === -1 || to === from || to < 0 || to >= order.length) return;
    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, id);
    onReorder(next);
  };

  return (
    <ReorderContext.Provider value={{ order, move }}>
      <GridList
        aria-label={label}
        className={cn(styles.list(), className)}
        selectionMode="none"
        dragAndDropHooks={dragAndDropHooks}
        {...(emptyState === undefined
          ? {}
          : { renderEmptyState: () => <p className={styles.empty()}>{emptyState}</p> })}
      >
        {children}
      </GridList>
    </ReorderContext.Provider>
  );
}

export function ReorderItem({ id, label, children, actions, className }: ReorderItemProps) {
  const styles = reorder();
  const context = useContext(ReorderContext);
  const order = context?.order ?? [];
  const index = order.indexOf(id);
  const isFirst = index <= 0;
  const isLast = index === -1 || index === order.length - 1;

  return (
    <GridListItem
      id={id}
      textValue={`${label}, position ${String(index + 1)} of ${String(order.length)}`}
      className={cn(styles.item(), className)}
    >
      <RACButton slot="drag" aria-label={`Reorder ${label}`} className={styles.handle()}>
        <GripIcon />
      </RACButton>
      <span aria-hidden="true" className={styles.position()}>
        {index + 1}
      </span>
      <span className={styles.content()}>{children}</span>
      {actions === undefined ? null : <span className={styles.actions()}>{actions}</span>}
      <span className={styles.actions()}>
        <IconButton
          label={`Move ${label} up`}
          size="sm"
          isDisabled={isFirst}
          onPress={() => {
            context?.move(id, index - 1);
          }}
        >
          <ChevronUpIcon />
        </IconButton>
        <IconButton
          label={`Move ${label} down`}
          size="sm"
          isDisabled={isLast}
          onPress={() => {
            context?.move(id, index + 1);
          }}
        >
          <ChevronDownIcon />
        </IconButton>
      </span>
    </GridListItem>
  );
}
