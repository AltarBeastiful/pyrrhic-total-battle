/**
 * The things already chosen, as a wrapping row of removable pills (plan §3): the hired mercenaries,
 * the equipment on a march. `Pill.Group` + `Pill withRemoveButton` is exact to TotalStack.
 *
 * A pill that opens an editor gets an explicit button rather than a click handler on the pill: a
 * `Pill` renders a `<span>`, and `Popover.Target` stamps `aria-expanded` on whatever it wraps, which
 * is invalid on a span and was 23 of the spike's axe nodes (investigation 0007).
 */
import { Group, Pill } from '@mantine/core';
import type { ReactNode } from 'react';

export interface PillRowItem {
  id: string;
  /** What the pill says; a `Group` of code, tier and count reads like TotalStack's. */
  label: ReactNode;
  /** The remove button's accessible name: "Dismiss Bear V". */
  removeLabel?: string;
  onRemove?: () => void;
}

export interface PillRowProps {
  /** Names the row for a screen reader ("Hired mercenaries"). */
  label: string;
  items: PillRowItem[];
  /** Shown in place of the row when nothing is chosen yet. */
  empty?: ReactNode;
  /** The row's own geometry, where a card has a spacing contract of its own (the camp's 32 px). */
  className?: string | undefined;
}

export function PillRow({ label, items, empty, className }: PillRowProps) {
  if (items.length === 0 && empty !== undefined) {
    return (
      <Group role="group" aria-label={label}>
        {empty}
      </Group>
    );
  }

  return (
    <Pill.Group role="group" aria-label={label} className={className}>
      {items.map((item) => (
        <Pill
          key={item.id}
          withRemoveButton={item.onRemove !== undefined}
          // Mantine hides the × from screen readers by default, on the assumption that the pill is
          // removable some other way. Here it is the only way, so it is given back its name and its
          // place in the tab order.
          removeButtonProps={{
            'aria-label': item.removeLabel ?? 'Remove',
            'aria-hidden': false,
            tabIndex: 0,
          }}
          {...(item.onRemove === undefined ? {} : { onRemove: item.onRemove })}
        >
          {item.label}
        </Pill>
      ))}
    </Pill.Group>
  );
}
