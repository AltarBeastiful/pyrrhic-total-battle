/**
 * The unit tile (design plan §6.2): one object in three sizes carrying the group's tonal ground, the
 * category or race glyph, the tier as a roman numeral and the short code. Colour is never the only
 * signal — the glyph, the numeral and the code say the same thing, and the accessible name spells
 * all of it out ("Archer, tier 3, on").
 *
 * A `Paper` for the frame, a `Glyph` (or an `Image`, when a drawn asset exists for this unit — plan
 * §1.4) for the silhouette, and a numeral `Text` for the tier. It is a `<button>` carrying
 * `aria-pressed` when it can be pressed and a `<span>` when it cannot.
 */
import { Image, Paper, Stack, Text, UnstyledButton, VisuallyHidden } from '@mantine/core';
import type { ReactNode } from 'react';

import type { Category, Race, UnitDef } from '../../data/types';
import { Glyph } from './Glyph';
import type { GlyphKind } from './glyphs';
import classes from './domain.module.css';
import { GROUP_LABEL, groupGround, groupInk, romanTier, unitGroupOf, type UnitGroup } from './unitGroup';

export type UnitTileSize = 'sm' | 'md' | 'lg';
export type UnitTileState = 'on' | 'off' | 'leftOut';

/** How each state is said out loud; a tile's name always ends with one of these. */
const STATE_WORD: Record<UnitTileState, string> = {
  on: 'on',
  off: 'off',
  leftOut: 'left out',
};

const SIZE = {
  sm: { box: 32, glyph: 0.85, tier: 'sm', code: false },
  md: { box: 44, glyph: 1, tier: 'md', code: true },
  lg: { box: 64, glyph: 1.4, tier: 'lg', code: true },
} as const;

/** Engineers show their catapult, monsters their race, everyone else their category. */
function glyphFor(unit: UnitDef, group: UnitGroup): GlyphKind {
  if (group === 'engineers') return 'engineers';
  if (group === 'monsters' && unit.race) return unit.race satisfies Race as GlyphKind;
  if (unit.category) return unit.category satisfies Category as GlyphKind;
  return 'army';
}

/** The short code without its tier digits: the data's "ARC1" is drawn as "ARC" beside a big "I". */
function shortCode(label: string): string {
  return label.replace(/\d+$/, '') || label;
}

export interface UnitTileProps {
  unit: UnitDef;
  size?: UnitTileSize;
  /** Defaults to `on`. `off` and `leftOut` read as unpressed. */
  state?: UnitTileState;
  /** Draws the accent ring; orthogonal to `state`. */
  selected?: boolean;
  /** Given, the tile becomes a toggle button carrying `aria-pressed`. */
  onPress?: () => void;
  /** A drawn asset for this unit, in place of the emoji (plan §1.4, M-10). */
  image?: string;
  /** Overrides the generated accessible name. */
  label?: string;
}

export function UnitTile({
  unit,
  size = 'md',
  state = 'on',
  selected = false,
  onPress,
  image,
  label,
}: UnitTileProps) {
  const group = unitGroupOf(unit);
  const metrics = SIZE[size];
  const name = label ?? `${unit.name}, tier ${unit.tier}, ${STATE_WORD[state]}`;
  const muted = state === 'leftOut';

  const face: ReactNode = (
    <Paper
      className={classes.tile}
      radius="xs"
      w={metrics.box}
      h={metrics.box}
      p={2}
      bg={muted ? 'var(--pyr-sunken)' : groupGround(group)}
      c={muted ? 'dimmed' : groupInk(group)}
      style={{
        // No opacity on `off`: fading the tile fades its ink too, and the numeral fell to 3:1. The
        // dashed frame and the name ("Archer, tier 3, off") carry the state instead.
        outline: selected ? '2px solid var(--mantine-primary-color-filled)' : undefined,
        outlineOffset: selected ? '1px' : undefined,
        border: state === 'off' ? '1px dashed currentColor' : '1px solid transparent',
        position: 'relative',
      }}
      aria-hidden="true"
    >
      <Stack gap={0} align="center" justify="center" h="100%">
        {image === undefined ? (
          <Glyph kind={glyphFor(unit, group)} scale={metrics.glyph} />
        ) : (
          <Image src={image} alt="" w={metrics.glyph * 16} h={metrics.glyph * 16} />
        )}
        <Text span variant="numeral" size={metrics.tier} lh={1} td={muted ? 'line-through' : undefined}>
          {romanTier(unit.tier) || String(unit.tier)}
        </Text>
        {metrics.code && (
          <Text span size="xs" lh={1} fw={500}>
            {shortCode(unit.label)}
          </Text>
        )}
      </Stack>
    </Paper>
  );

  if (!onPress) {
    return (
      <span title={`${GROUP_LABEL[group]}: ${unit.name}`}>
        {face}
        <VisuallyHidden>{name}</VisuallyHidden>
      </span>
    );
  }

  return (
    <UnstyledButton aria-pressed={state === 'on'} aria-label={name} onClick={onPress}>
      {face}
    </UnstyledButton>
  );
}
