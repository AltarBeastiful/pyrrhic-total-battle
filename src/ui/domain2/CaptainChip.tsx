/**
 * A captain, as TotalStack draws one (investigation 0006, design plan §7.3): a dense chip that
 * toggles whether the captain rides with this march, a gear on its top-right corner that opens the
 * level editor, and a dot after the name once a level has been recorded.
 *
 * Two targets, never one. The chip enlists; the gear edits. A player correcting a level must not
 * discover they also enlisted somebody, so the gear is a sibling button with its own name — which is
 * also why the popover it opens is anchored on a real `<button>` and never on the chip's label
 * (investigation 0007: `Popover.Target` stamps `aria-expanded` on whatever it wraps).
 */
import { Chip, Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import { CornerGear } from '../kit2/CornerGear';
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
          <Text span inherit>
            {name}
            {levelSet && (
              <Text span c="dimmed">
                {' '}
                •
              </Text>
            )}
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

  if (onEditLevel === undefined) return chip;

  return (
    <CornerGear
      label={`${levelSet ? 'Change' : 'Set'} ${name}’s level`}
      active={enlisted}
      onPress={onEditLevel}
      {...(levelEditor === undefined ? {} : { dropdown: levelEditor })}
      {...(levelEditorOpened === undefined ? {} : { opened: levelEditorOpened })}
      {...(onLevelEditorChange === undefined ? {} : { onOpenedChange: onLevelEditorChange })}
    >
      {chip}
    </CornerGear>
  );
}
