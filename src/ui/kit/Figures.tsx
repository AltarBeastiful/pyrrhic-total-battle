/**
 * A block of read-only label/value pairs (the March recap, the Bonuses TOTAL, a unit's costs). Built
 * on `DataList`, which is the semantic list Mantine already ships for this (`<dl>`/`<dt>`/`<dd>`),
 * so the pairing is in the markup rather than in a grid of divs.
 *
 * **One figure style, everywhere** (the owner's review of 2026-09-13: "the percentages could just be
 * numbers with minimal text"). A figure is:
 *
 *   the label, 12 px muted, above — with its glyph in the fixed box if it has one
 *   the value, 15 px / 600, tabular, below
 *
 * and nothing else: no sentence around it, no unit spelled out in words, no second line repeating
 * what the label says. The March recap, the Bonuses TOTAL, the captain popover's footer, the unit
 * sheet and the objectives comparison all draw their figures with this, which is what makes a
 * "+312 %" on one card and a "4 519 202" on another read as the same kind of object.
 *
 * Two layouts, and the layout is the only choice a caller makes. `rows` is a list read down a
 * column — label on the left, figure on the right — for the handful of places where the pairs are a
 * list. `grid` is the spacing contract's **2-column grid, 8 × 16 gaps** (`MarchPaneSpacing.dc.html`,
 * `.figs`), which is what the recap and the TOTAL use: four figures in two lines, not four lines.
 */
import { DataList, Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import classes from './kit.module.css';

export interface Figure {
  key: string;
  label: ReactNode;
  value: ReactNode;
  /** A mark at the start of the label: the pool's glyph, a currency. Always in `Glyph`'s box. */
  glyph?: ReactNode;
}

export interface FiguresProps {
  /** Names the block for a screen reader when no heading sits above it. */
  label?: string;
  items: Figure[];
  /**
   * `rows` — a list of pairs read down a column. `grid` — the contract's figure grid, the label over
   * the figure, as many across as `columns` says.
   */
  layout?: 'rows' | 'grid';
  /** Columns in the `grid` layout; the contract's two, unless a card has room for more. */
  columns?: number;
  withDivider?: boolean;
  labelWidth?: string;
  /** The value's own size, when it is the thing the eye lands on. 15 px unless a caller says so. */
  valueFz?: string;
  valueFw?: number;
}

export function Figures({
  label,
  items,
  layout = 'rows',
  columns = 2,
  withDivider = false,
  labelWidth = '9rem',
  valueFz,
  valueFw,
}: FiguresProps) {
  const grid = layout === 'grid';
  return (
    <DataList
      aria-label={label}
      orientation={grid ? 'vertical' : 'horizontal'}
      withDivider={withDivider}
      labelWidth={labelWidth}
      size="sm"
      gap="xs"
      className={grid ? classes.figureGrid : undefined}
      {...(grid ? { style: { '--pyr-figures-cols': String(columns) } } : {})}
    >
      {items.map((item) => (
        <DataList.Item key={item.key}>
          <DataList.ItemLabel>
            {/* The label is the one thing on a figure written under the body size: it repeats what
                the value's own accessible name already carries, and the figure under it is what the
                eye is meant to land on. `--pyr-meta` is the one place that size is decided. */}
            <Group gap={6} wrap="nowrap" className={classes.figureLabel}>
              {item.glyph}
              <Text span inherit c="dimmed">
                {item.label}
              </Text>
            </Group>
          </DataList.ItemLabel>
          <DataList.ItemValue>
            <Text
              span
              fz={valueFz ?? '0.9375rem'}
              fw={valueFw ?? 600}
              ff="var(--mantine-font-family)"
              className={classes.figureValue}
            >
              {item.value}
            </Text>
          </DataList.ItemValue>
        </DataList.Item>
      ))}
    </DataList>
  );
}
