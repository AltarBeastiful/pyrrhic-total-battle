/**
 * A captain, as TotalStack draws one (investigation 0006, design plan §7.3): a dense chip that
 * toggles whether the captain rides with this march, a gear on its top-right corner that opens the
 * level editor. Once a level is recorded the level takes the gear's place on the corner and the stars
 * follow the name (owner, 2026-10-02: "for now we have to click to see level and stars"; proposal G of
 * the "Captain Level Badges" artifact), so the row says who is at what level without a tap. A chip with
 * something recorded and nothing to draw — the hero, whose gear picks who leads — keeps its dot.
 *
 * Two targets, never one. The chip enlists; the gear edits. A player correcting a level must not
 * discover they also enlisted somebody, so the gear is a sibling button with its own name — which is
 * also why the popover it opens is anchored on a real `<button>` and never on the chip's label
 * (investigation 0007: `Popover.Target` stamps `aria-expanded` on whatever it wraps).
 */
import { Box, Chip, Group, Stack, Text, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';

import { ChipDot } from '../kit/ChipDot';
import { CaptainStars } from './CaptainStars';
import { CornerGear } from '../kit/CornerGear';
import classes from './domain.module.css';
import { Glyph } from './Glyph';
import type { GlyphKind } from './glyphs';

export interface CaptainChipProps {
  name: string;
  /** The bonus family this captain touches, drawn as that family's glyph. */
  bonusKey?: GlyphKind;
  /** The second, dimmed line: what the captain gives ("HP +25 %"). */
  bonus?: ReactNode;
  /** Riding with this march. */
  enlisted: boolean;
  onToggle: () => void;
  /** A level has been recorded; the name gets a dot. */
  levelSet?: boolean;
  /** The recorded level: worn on the corner in place of the gear. */
  level?: number;
  /** The recorded stars: drawn after the name. */
  star?: number;
  /** What the captain is worth as recorded, one line each: shown on hover and on focus. */
  details?: string[];
  /** Opens the level editor. Left out for a captain with nothing to set. */
  onEditLevel?: () => void;
  /** The editor itself. `CornerGear` anchors it on the gear's own button, never on the chip. */
  levelEditor?: ReactNode;
  levelEditorOpened?: boolean;
  onLevelEditorChange?: (opened: boolean) => void;
  disabled?: boolean;
}

export function CaptainChip({
  name,
  bonusKey,
  bonus,
  enlisted,
  onToggle,
  levelSet = false,
  level = 0,
  star = 0,
  details = [],
  onEditLevel,
  levelEditor,
  levelEditorOpened,
  onLevelEditorChange,
  disabled = false,
}: CaptainChipProps) {
  const chip = (
    <Chip
      checked={enlisted}
      disabled={disabled}
      color="brass"
      aria-label={enlisted ? `${name}, riding with this march` : `Send ${name} on this march`}
      onChange={onToggle}
    >
      <Group gap={5} wrap="nowrap" component="span">
        {bonusKey !== undefined && <Glyph kind={bonusKey} />}
        <Stack gap={0} component="span">
          <Text span inherit className={star > 0 ? classes.nameLine : undefined}>
            {name}
            <CaptainStars star={star} />
            {levelSet && level <= 0 && star <= 0 && <ChipDot />}
          </Text>
          {bonus !== undefined && (
            <Text span size="xs" c="dimmed">
              {bonus}
            </Text>
          )}
        </Stack>
      </Group>
    </Chip>
  );

  // What the captain is worth, on hover and on focus (owner, 2026-10-02: "the tooltip should show
  // information that's not on the screen already, a quick summary of the bonuses"): the badge and the
  // stars already say the level, so the tooltip says what that level buys, the popover's own lines.
  // Built as the artifact chips build theirs (`SourceChip.tsx`): the target is a box around the chip,
  // because Mantine's `Chip` hands its props to the hidden input; in a portal; the theme's look and
  // half-second delay.
  const described =
    details.length > 0 ? (
      <Tooltip
        label={
          <Stack gap={2}>
            {details.map((line) => (
              <Text key={line} size="xs">
                {line}
              </Text>
            ))}
          </Stack>
        }
        events={{ hover: true, focus: true, touch: false }}
        withinPortal
        multiline
        maw={280}
      >
        <Box component="span" display="inline-block">
          {chip}
        </Box>
      </Tooltip>
    ) : (
      chip
    );

  if (onEditLevel === undefined) return described;

  return (
    <CornerGear
      label={`${levelSet ? 'Change' : 'Set'} ${name}’s level`}
      active={enlisted}
      {...(level > 0 ? { figure: String(level) } : {})}
      {...(level > 0 || star > 0 ? { description: describeLevel(level, star) } : {})}
      onPress={onEditLevel}
      {...(levelEditor === undefined ? {} : { dropdown: levelEditor })}
      {...(levelEditorOpened === undefined ? {} : { opened: levelEditorOpened })}
      {...(onLevelEditorChange === undefined ? {} : { onOpenedChange: onLevelEditorChange })}
    >
      {described}
    </CornerGear>
  );
}

/** "Level 60, 3 stars", "Level 12": what the badge and the stars say, for a screen reader. The default one star is not said. */
function describeLevel(level: number, star: number): string {
  const stars = star > 0 ? `${String(star + 1)} stars` : '';
  if (level <= 0) return stars;
  return stars === '' ? `Level ${String(level)}` : `Level ${String(level)}, ${stars}`;
}
