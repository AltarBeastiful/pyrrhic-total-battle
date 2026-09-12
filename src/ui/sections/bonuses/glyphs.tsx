/**
 * The glyph that stands for a bonus key, and the one that titles each block.
 *
 * A bonus key is always a category, a group or a race, so the icon set already has a drawing for it
 * (`docs/design.md` §5); `army` and the two army-wide special keys have none and get nothing — the
 * label carries them. Every glyph here is decorative: it repeats a name written next to it.
 */
import type { ReactNode } from 'react';

import type { BonusKey, SpecialKey } from '@/data/types';

import {
  BeastIcon,
  BonusesIcon,
  DominanceIcon,
  DragonIcon,
  ElementalIcon,
  EngineersIcon,
  FlyingIcon,
  GiantIcon,
  GuardsmenIcon,
  HousingIcon,
  MeleeIcon,
  MercenariesIcon,
  MonstersIcon,
  MountedIcon,
  PinIcon,
  RangedIcon,
  ResetIcon,
  SpecialistsIcon,
  SunIcon,
  TroopsIcon,
} from '../../icons';
import { cn } from '../../primitives';

/** The four group keys wear their group's hue; the rest take the colour of the text beside them. */
const TONES: Partial<Record<BonusKey, string>> = {
  guardsmen: 'text-group-guardsmen',
  specialist: 'text-group-specialist',
  engineers: 'text-group-engineers',
  monster: 'text-group-monster',
};

const KEY_GLYPHS: Partial<Record<BonusKey, ReactNode>> = {
  melee: <MeleeIcon />,
  ranged: <RangedIcon />,
  mounted: <MountedIcon />,
  flying: <FlyingIcon />,
  guardsmen: <GuardsmenIcon />,
  specialist: <SpecialistsIcon />,
  engineers: <EngineersIcon />,
  monster: <MonstersIcon />,
  beast: <BeastIcon />,
  elemental: <ElementalIcon />,
  dragon: <DragonIcon />,
  giant: <GiantIcon />,
};

/** A special key inherits the glyph of whatever it is about ("Beasts strike two squads" → the paw). */
const SPECIAL_GLYPHS: Partial<Record<SpecialKey, BonusKey>> = {
  beastsStrikeTwoSquadsChance: 'beast',
  elementalsStrikeTwoSquadsChance: 'elemental',
  dragonsStrikeTwoSquadsChance: 'dragon',
  giantsStrikeTwoSquadsChance: 'giant',
  guardsmenDoubleDamageChance: 'guardsmen',
  specialistsDoubleDamageChance: 'specialist',
  engineersDoubleDamageChance: 'engineers',
  monstersDoubleDamageChance: 'monster',
};

function bonusKeyOf(name: BonusKey | SpecialKey): BonusKey | undefined {
  if (name in KEY_GLYPHS) return name as BonusKey;
  return SPECIAL_GLYPHS[name as SpecialKey];
}

export interface KeyGlyphProps {
  /** The key the glyph stands for; anything army-wide draws nothing. */
  name?: BonusKey | SpecialKey | undefined;
  className?: string;
}

/** The mark in front of a key: the same drawing the rest of the app uses for that family. */
export function KeyGlyph({ name, className }: KeyGlyphProps) {
  const key = name === undefined ? undefined : bonusKeyOf(name);
  const glyph = key === undefined ? undefined : KEY_GLYPHS[key];
  if (glyph === undefined || key === undefined) return null;
  return (
    <span aria-hidden="true" className={cn('shrink-0', TONES[key], className)}>
      {glyph}
    </span>
  );
}

/** A fixed-width slot, so a list of keys stays aligned when one of them (Army) has no glyph. */
export function KeySlot({ name }: { name?: BonusKey | SpecialKey | undefined }) {
  return (
    <span aria-hidden="true" className="flex w-4 shrink-0 items-center justify-center">
      <KeyGlyph name={name} />
    </span>
  );
}

/**
 * One glyph per block. The set is closed (ADR-0003), so where it holds no drawing of its own we
 * borrow the one that already says the same thing rather than adding a 51st: the tack for "pinned to
 * every march", the figures for the people who ride with you, the shield for the kit they wear, the
 * star for a star rating, the crown for a rank, the purse for what is bought or granted, the sun for
 * a season, the camp for one march, the sparkle for the bonuses added up, and the restore arrow for
 * putting losses back on their feet.
 */
const BLOCK_GLYPHS = {
  setup: <HousingIcon />,
  permanent: <PinIcon />,
  captains: <TroopsIcon />,
  equipment: <GuardsmenIcon />,
  artifacts: <SpecialistsIcon />,
  titles: <DominanceIcon />,
  other: <MercenariesIcon />,
  events: <SunIcon />,
  totals: <BonusesIcon />,
  recovery: <ResetIcon />,
} as const;

export type BlockName = keyof typeof BLOCK_GLYPHS;

/** The mark that titles a block, and the one on the setup bar. Decorative. */
export function BlockGlyph({ name }: { name: BlockName }) {
  return BLOCK_GLYPHS[name];
}
