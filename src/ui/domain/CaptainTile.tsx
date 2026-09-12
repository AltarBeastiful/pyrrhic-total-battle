/**
 * The captain tile (design plan §7.3 as amended 2026-09-13, D-33). TotalStack's picker, in our own
 * material: every captain the tables know is always on screen, and the tile is both the form and the
 * summary — tap the body to send the captain on this march, tap the badge to say what level it is.
 *
 * Two targets, never one. The body is a toggle (`aria-pressed`); the badge is a second button that
 * opens the editor and **never** changes who marches, because a player correcting a level must not
 * discover they also enlisted somebody. They are siblings rather than one inside the other: a button
 * cannot hold a button, so the tile is a block with a body and a footer and no nesting.
 *
 * The tile is square-cornered (4 px, `rounded-tile`) with a tonal ground and no frame — a tile is a
 * frame *or* a fill, never both (D-19). Enlisted is the kit's own selection rule: the `accent-soft`
 * step plus the rule down the leading edge, and a tick beside the name so colour is never the only
 * signal. The glyph repeats what the meta line already says in words.
 */
import type { ComponentType } from 'react';
import { tv } from 'tailwind-variants';

import type { BonusKey } from '../../data/types';
import {
  BeastIcon,
  CheckIcon,
  DragonIcon,
  ElementalIcon,
  EngineersIcon,
  FlyingIcon,
  GiantIcon,
  GuardsmenIcon,
  MeleeIcon,
  MinusIcon,
  MonstersIcon,
  MountedIcon,
  RangedIcon,
  SpecialistsIcon,
  TroopsIcon,
} from '../icons';
import type { IconProps } from '../icons';
import { cn } from '../kit/cn';
import { ring, stateLayerDom, stateLayerOn } from '../kit/styles';

/**
 * One glyph per bonus key. The four categories and the four groups wear the same silhouettes the
 * unit tiles do, so a captain and the stack it boosts are recognisably the same thing; `army` takes
 * the Troops mark, because it is the whole roster rather than one kind of soldier.
 */
const KEY_GLYPH: Record<BonusKey, ComponentType<IconProps>> = {
  melee: MeleeIcon,
  ranged: RangedIcon,
  mounted: MountedIcon,
  flying: FlyingIcon,
  guardsmen: GuardsmenIcon,
  specialist: SpecialistsIcon,
  engineers: EngineersIcon,
  monster: MonstersIcon,
  army: TroopsIcon,
  beast: BeastIcon,
  elemental: ElementalIcon,
  dragon: DragonIcon,
  giant: GiantIcon,
};

const tile = tv({
  slots: {
    root: 'rounded-tile flex min-w-0 flex-col overflow-hidden pb-2',
    body: cn(
      // No bottom padding: the footer under it carries the tile's, so the badge never sits in a well.
      'flex min-w-0 flex-1 flex-col items-start gap-0.5 px-2 pt-2 pb-0 text-left',
      ring,
      'focus-visible:-outline-offset-2',
      stateLayerDom,
      'motion-safe:transition-colors',
    ),
    head: 'flex w-full min-w-0 items-center gap-1.5',
    glyph: 'text-muted h-4 w-4 shrink-0',
    name: 'min-w-0 flex-1 truncate text-sm font-medium',
    tick: 'text-accent-line h-4 w-4 shrink-0',
    meta: 'text-muted w-full truncate text-xs',
    foot: 'flex justify-end px-2',
    badge: cn(
      'rounded-chip nums bg-surface inline-flex min-h-11 items-center px-2 text-xs font-medium sm:min-h-8',
      'whitespace-nowrap',
      ring,
      stateLayerOn,
      'after:rounded-chip active:after:opacity-10',
    ),
  },
  variants: {
    isEnlisted: {
      true: { root: 'bg-accent-soft selection-rule-start' },
      false: { root: 'bg-sunken' },
    },
    isSet: {
      /** A level already typed reads as a figure; an empty badge reads as the job still to do. */
      true: { badge: 'text-fg' },
      false: { badge: 'text-muted' },
    },
  },
  defaultVariants: { isEnlisted: false, isSet: false },
});

export interface CaptainTileBadge {
  /** What the badge draws: "20 ★3" once a level is typed, "Set level" before that. */
  text: string;
  /** A level is already recorded, so the badge is spoken as "Change …" rather than "Set …". */
  isSet: boolean;
  /** Replaces the generated name for a tile whose badge is not a level (the hero). */
  label?: string;
  onPress: () => void;
}

export interface CaptainTileProps {
  /** The tile's own name: a captain, or the hero leading the march. */
  name: string;
  /** The key its bonuses touch, drawn as that key's glyph. Left out, the tile wears a muted dash. */
  bonusKey?: BonusKey;
  /** The line under the name: the key in words, or "No stack bonus". */
  meta: string;
  /** Riding with this march. */
  isEnlisted: boolean;
  onEnlist: () => void;
  /** Bottom right. Left out for a captain with nothing to set; it never toggles enlistment. */
  badge?: CaptainTileBadge;
  className?: string;
}

export function CaptainTile({
  name,
  bonusKey,
  meta,
  isEnlisted,
  onEnlist,
  badge,
  className,
}: CaptainTileProps) {
  const styles = tile({ isEnlisted, isSet: badge?.isSet ?? false });
  const Glyph = bonusKey === undefined ? MinusIcon : KEY_GLYPH[bonusKey];
  const badgeName = badge?.label ?? `${badge?.isSet === true ? 'Change' : 'Set'} ${name}’s level`;

  return (
    <div className={cn(styles.root(), className)}>
      <button
        type="button"
        aria-pressed={isEnlisted}
        aria-label={isEnlisted ? `${name}, enlisted` : `Enlist ${name}`}
        onClick={onEnlist}
        className={styles.body()}
      >
        <span className={styles.head()}>
          <Glyph aria-hidden="true" className={styles.glyph()} />
          <span className={styles.name()}>{name}</span>
          {isEnlisted && <CheckIcon aria-hidden="true" className={styles.tick()} />}
        </span>
        <span className={styles.meta()}>{meta}</span>
      </button>
      {badge !== undefined && (
        <span className={styles.foot()}>
          <button type="button" aria-label={badgeName} onClick={badge.onPress} className={styles.badge()}>
            {badge.text}
          </button>
        </span>
      )}
    </div>
  );
}
