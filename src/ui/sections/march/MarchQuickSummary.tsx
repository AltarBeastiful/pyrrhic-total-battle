/**
 * The march in one line, for the phone's command bar (design plan §5.6, artboard `PhoneBar.dc.html`,
 * `.brow .quick`): what the march does, then — smaller and dimmer — what it costs and how many
 * stacks it fields, then a chevron, because the whole line opens the March sheet.
 *
 * Everything here is sized to be *cut* rather than to wrap: the row is 40 px tall beside Generate
 * and a second line would eat the page. The figures are compact ("19.6M"), the coin carries its own
 * name, and what does not fit is clipped from the right, where the least important reading is.
 *
 * The three mini troop tiles the bar used to carry are gone (owner, 2026-09-13): the row above this
 * one is the housing chips now, and the tiles were the half of the line that said the least. The
 * stack count says what they said, in four characters.
 *
 * When the setup has moved under the answer the line opens with a ⚠️ instead of the target (owner,
 * 2026-09-13, with "generated 5 minutes ago" retired everywhere): on a phone this row is the whole
 * of the march until the sheet is opened, so the one thing it must never do is read as current when
 * it is not. The recap inside the sheet says the same thing in a sentence.
 */
import { Group, Text, UnstyledButton } from '@mantine/core';
import { ChevronUp } from 'lucide-react';

import { Glyph } from '@/ui/domain';

import { compact } from './format';
import classes from './march.module.css';
import { useMarch } from './useMarch';

export interface MarchQuickSummaryProps {
  /** Opens the recap sheet (phones). */
  onOpen?: () => void;
}

export function MarchQuickSummary({ onOpen }: MarchQuickSummaryProps) {
  const { summary, rows, stale } = useMarch();

  if (summary === null) {
    return (
      <Text size="sm" c="dimmed">
        No march yet
      </Text>
    );
  }

  const marching = rows.filter((row) => row.stack.count > 0).length;

  const line = (
    <Group className={classes.quickLine} gap={6} wrap="nowrap" miw={0}>
      {/* The marker takes the target's place rather than standing beside it: the bar is 390 px wide
          and a second glyph would be paid for out of the figure, which is the one thing here that is
          never cut. */}
      {stale ? (
        <Glyph kind="warning" label="Setup changed since this march" />
      ) : (
        <Glyph kind="averageDamage" />
      )}
      <Text span fz="0.9375rem" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {compact(summary.avgDamage)}
      </Text>
      {/* The coin rather than the word (design rule 22): "1.7M silver" is cut to "1.7M …" at
          390 px, and a glyph that carries its own name loses nothing. The figure itself is never
          cut — it is the answer — so it wraps nothing and shrinks not at all. */}
      <Text span size="xs" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {'· '}
        <Glyph kind="silver" label="silver to recover" />
        {` ${compact(summary.recovery.silver)}`}
      </Text>
      {/* How many stacks: the least of the three readings, and the one the line gives up first when
          the bar is narrower than its words (`march.module.css`, `.quickStacks`). */}
      <Text
        span
        size="xs"
        c="dimmed"
        truncate
        className={classes.quickStacks}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {`· ${String(marching)} stacks`}
      </Text>
      <ChevronUp size={16} aria-hidden style={{ flex: '0 0 auto' }} />
    </Group>
  );

  // The bar makes its own half of the row the target, so the line is only a button when it is asked
  // to be one: a button inside a button is neither valid nor operable.
  if (onOpen === undefined) return line;

  return (
    <UnstyledButton className={classes.quickLine} aria-label="Open the full march summary" onClick={onOpen}>
      {line}
    </UnstyledButton>
  );
}
