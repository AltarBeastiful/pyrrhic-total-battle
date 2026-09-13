/**
 * The march in one line, for the phone's bottom app bar (design plan §5.1, frame V1): what the
 * march does, what it costs, and the first few stacks as tiles — then a chevron, because the whole
 * line opens the recap sheet.
 *
 * Everything here is sized to be *cut* rather than to wrap: a bar is 64 px tall and a second line
 * would eat the page. The figures are compact ("19.6M"), the tiles are dropped whole rather than
 * squeezed, and what is left is counted ("+8").
 *
 * The separators are spacing, not middle dots (D-19): a dotted string reads as one long sentence,
 * and these are three separate readings.
 */
import { Box, Group, Text, UnstyledButton } from '@mantine/core';
import { ChevronUp } from 'lucide-react';

import { Glyph, groupGround, groupInk, unitGroupOf } from '@/ui/domain';

import { compact } from './format';
import classes from './march.module.css';
import { useMarch } from './useMarch';

/**
 * Tiles that fit beside a full "Generate" label at 390 px — measured, not guessed: four of them
 * pushed the silver figure into an ellipsis, which is the one thing this line must never lose.
 */
const TILES = 3;

export interface MarchQuickSummaryProps {
  /** Opens the recap sheet (phones). */
  onOpen?: () => void;
}

export function MarchQuickSummary({ onOpen }: MarchQuickSummaryProps) {
  const { summary, rows } = useMarch();

  if (summary === null) {
    return (
      <Text size="sm" c="dimmed">
        No march yet
      </Text>
    );
  }

  const marching = rows.filter((row) => row.stack.count > 0);
  const shown = marching.slice(0, TILES);
  const rest = marching.length - shown.length;

  const line = (
    <Group className={classes.quickLine} gap="xs" wrap="nowrap" miw={0}>
      <Text span fz="0.9375rem" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {compact(summary.avgDamage)}
      </Text>
      {/* The coin rather than the word (design rule 22): "1.7M silver" is cut to "1.7M …" at
          390 px, and a glyph that carries its own name loses nothing. */}
      <Group gap={4} wrap="nowrap">
        <Glyph kind="silver" label="silver to recover" />
        <Text span size="xs" c="dimmed">
          {compact(summary.recovery.silver)}
        </Text>
      </Group>
      {/* Three 26 px squares, not three unit tiles: at this size a tier numeral and a code are
          unreadable, so the square carries the group's colour and the category's glyph and the
          sheet behind the bar carries the rest (artboard `.mini span`). */}
      <Group gap={4} wrap="nowrap">
        {shown.map((row) => {
          const group = unitGroupOf(row.unit);
          return (
            <Box
              key={row.unit.id}
              className={classes.miniTile}
              title={row.unit.name}
              style={{ background: groupGround(group), borderColor: groupInk(group) }}
            >
              <Glyph kind={row.unit.category ?? 'army'} scale={0.75} label={row.unit.name} />
            </Box>
          );
        })}
        {rest > 0 && (
          <Text span size="xs" c="dimmed">
            {`+${String(rest)}`}
          </Text>
        )}
      </Group>
      <ChevronUp size={16} aria-hidden />
    </Group>
  );

  // The bottom bar makes its own half of the row the target, so the line is only a button when it
  // is asked to be one: a button inside a button is neither valid nor operable.
  if (onOpen === undefined) return line;

  return (
    <UnstyledButton className={classes.quickLine} aria-label="Open the full march summary" onClick={onOpen}>
      {line}
    </UnstyledButton>
  );
}
