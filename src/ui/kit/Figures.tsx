/**
 * A block of read-only label/value pairs (the TOTAL rows, the March recap, a unit's costs). Built on
 * `DataList`, which is the semantic list Mantine already ships for this (`<dl>`/`<dt>`/`<dd>`), so
 * the pairing is in the markup rather than in a grid of divs.
 *
 * Figures are compared down a column, so every value is tabular; a glyph may open a row, because a
 * carefully chosen mark is one of the two ways this design solves a small styling problem (plan §1).
 */
import { DataList, Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';

export interface Figure {
  key: string;
  label: ReactNode;
  value: ReactNode;
  /** A mark at the start of the row: the pool's glyph, a currency. */
  glyph?: ReactNode;
}

export interface FiguresProps {
  /** Names the block for a screen reader when no heading sits above it. */
  label?: string;
  items: Figure[];
  orientation?: 'horizontal' | 'vertical';
  withDivider?: boolean;
  labelWidth?: string;
  size?: 'xs' | 'sm' | 'md';
  /** The value's own size, when it is the thing the eye lands on (the Bonuses TOTAL, at 22 px). */
  valueFz?: string;
  valueFw?: number;
}

export function Figures({
  label,
  items,
  orientation = 'horizontal',
  withDivider = false,
  labelWidth = '9rem',
  size = 'sm',
  valueFz,
  valueFw = 500,
}: FiguresProps) {
  return (
    <DataList
      aria-label={label}
      orientation={orientation}
      withDivider={withDivider}
      labelWidth={labelWidth}
      size={size}
      gap="xs"
    >
      {items.map((item) => (
        <DataList.Item key={item.key}>
          <DataList.ItemLabel>
            <Group gap={6} wrap="nowrap">
              {item.glyph}
              <Text span size={size} c="dimmed">
                {item.label}
              </Text>
            </Group>
          </DataList.ItemLabel>
          <DataList.ItemValue>
            <Text
              span
              size={size}
              fw={valueFw}
              {...(valueFz === undefined ? {} : { fz: valueFz })}
              ff="var(--mantine-font-family)"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {item.value}
            </Text>
          </DataList.ItemValue>
        </DataList.Item>
      ))}
    </DataList>
  );
}
