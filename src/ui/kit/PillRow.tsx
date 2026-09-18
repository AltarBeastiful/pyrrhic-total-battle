/**
 * The things already chosen, as a wrapping row of removable pills (plan §3): the hired mercenaries,
 * the equipment on a march. `Pill.Group` + `Pill withRemoveButton` is exact to TotalStack.
 *
 * A pill that opens an editor gets an explicit button rather than a click handler on the pill: a
 * `Pill` renders a `<span>`, and `Popover.Target` stamps `aria-expanded` on whatever it wraps, which
 * is invalid on a span and was 23 of the spike's axe nodes (investigation 0007).
 */
import { Group, Indicator, Pill } from '@mantine/core';
import type { ReactNode } from 'react';

import classes from './kit.module.css';

export interface PillRowItem {
  id: string;
  /** What the pill says; a `Group` of code, tier and count reads like TotalStack's. */
  label: ReactNode;
  /**
   * The pill already built — a `CornerPill` with its badge and the popover anchored on it — placed
   * in the group as it is. `label`, `removeLabel` and `onRemove` are then not read.
   */
  element?: ReactNode;
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
      {items.map((item) =>
        item.element !== undefined ? (
          <span key={item.id} className={classes.pillSlot}>
            {item.element}
          </span>
        ) : (
          <Pill
            key={item.id}
            withRemoveButton={item.onRemove !== undefined}
            // Mantine hides the × from screen readers by default, on the assumption that the pill is
            // removable some other way. Where a row asks for one it is the only way, so it is given
            // back its name and its place in the tab order. (The mercenary pills ask for none since
            // 2026-09-18: their body removes, with a way back under the row.)
            removeButtonProps={{
              'aria-label': item.removeLabel ?? 'Remove',
              'aria-hidden': false,
              tabIndex: 0,
            }}
            {...(item.onRemove === undefined ? {} : { onRemove: item.onRemove })}
          >
            {item.label}
          </Pill>
        ),
      )}
    </Pill.Group>
  );
}

export interface CornerPillProps {
  /** The badge on the pill's top-right corner: the owned count, a pencil. Its own target. */
  corner: ReactNode;
  children: ReactNode;
}

/**
 * A pill with a badge riding its top-right corner, the way `CornerGear` rides a chip (owner,
 * 2026-09-18: "a real badge, like the heroes' one, in the upper right corner of the pill"). The
 * badge is right-aligned on the corner rather than centred on it, so a wider figure grows over the
 * pill and never over the neighbour; the pill reserves the strip it grows into.
 */
export function CornerPill({ corner, children }: CornerPillProps) {
  return (
    <Indicator
      className={classes.pillCorner}
      position="top-end"
      offset={0}
      color="transparent"
      label={corner}
    >
      <Pill data-corner="true">{children}</Pill>
    </Indicator>
  );
}
