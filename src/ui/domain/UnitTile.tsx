/**
 * The unit tile (design plan §6.2). One object in three sizes that replaces the old "G3 Melee" chip,
 * the `UnitBadge` and the stack chip: the group's soft background and strong ink, a 2 px left bar in
 * the group's edge colour, the category silhouette, and the tier numeral as the biggest thing on it.
 *
 * Colour is never the only signal — the silhouette, the numeral and the short code say the same
 * thing, and the accessible name spells all of it out ("Archer, tier 3, on").
 *
 * The tile is a plain `<button>` when it can be pressed and a `<span>` when it cannot; it never
 * reaches for React Aria, because the whole interaction is one press plus an optional long press,
 * and a long press must stay a *pointer* gesture (a keyboard has no such thing).
 */
import { useCallback, useEffect, useRef } from 'react';
import type { ComponentType, PointerEvent as ReactPointerEvent } from 'react';
import { tv } from 'tailwind-variants';

import type { Category, Race, UnitDef } from '../../data/types';
import {
  BeastFillIcon,
  DragonFillIcon,
  ElementalFillIcon,
  EngineersFillIcon,
  FlyingFillIcon,
  GiantFillIcon,
  MeleeFillIcon,
  MountedFillIcon,
  PinIcon,
  RangedFillIcon,
} from '../icons';
import type { IconProps } from '../icons';
import { cn } from '../kit/cn';
import { ring } from '../kit/styles';
import { GROUP_LABEL, GROUP_TONE, unitGroupOf } from './unitGroup';
import type { UnitGroup } from './unitGroup';

/** How long a pointer has to stay down before it counts as a long press. */
const LONG_PRESS_MS = 500;

/** Every silhouette a tile can wear, keyed by category, by race, or by the one group that has neither. */
const TILE_GLYPH: Record<Category | Race | 'engineers', ComponentType<IconProps>> = {
  melee: MeleeFillIcon,
  ranged: RangedFillIcon,
  mounted: MountedFillIcon,
  flying: FlyingFillIcon,
  engineers: EngineersFillIcon,
  beast: BeastFillIcon,
  elemental: ElementalFillIcon,
  dragon: DragonFillIcon,
  giant: GiantFillIcon,
};

export type UnitTileSize = 'sm' | 'md' | 'lg';
export type UnitTileState = 'on' | 'off' | 'pinned' | 'leftOut';

/** How each state is said out loud; the tile's name always ends with one of these. */
const STATE_WORD: Record<UnitTileState, string> = {
  on: 'on',
  off: 'off',
  pinned: 'pinned',
  leftOut: 'left out',
};

const hit = tv({
  base: 'relative inline-flex shrink-0 items-center justify-center rounded-control',
  variants: {
    size: {
      // 32 px of tile inside a 44 px target on touch; the target shrinks to the tile with a pointer.
      sm: 'h-11 w-11 sm:h-8 sm:w-8',
      md: 'h-11 w-14',
      lg: 'h-auto w-full',
    },
  },
  defaultVariants: { size: 'md' },
});

const box = tv({
  base: 'rounded-control flex min-w-0 items-center overflow-hidden border-l-2 select-none',
  variants: {
    group: GROUP_TONE,
    size: {
      sm: 'h-8 w-8 flex-col justify-center px-0.5',
      md: 'h-11 w-14 flex-col justify-center gap-0.5 px-1',
      lg: 'min-h-11 w-full flex-row gap-3 px-3 py-2',
    },
    state: {
      on: '',
      off: 'border border-dashed opacity-70 saturate-50',
      pinned: '',
      leftOut: 'bg-sunken text-muted border-l-line',
    },
    isSelected: {
      true: 'ring-accent ring-2',
      false: '',
    },
  },
  defaultVariants: { size: 'md', state: 'on', isSelected: false },
});

const glyph = tv({
  base: 'shrink-0',
  variants: { size: { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-6 w-6' } },
  defaultVariants: { size: 'md' },
});

const tier = tv({
  base: 'font-display leading-none tabular-nums',
  variants: {
    size: { sm: 'text-sm', md: 'text-lg', lg: 'text-xl' },
    struck: { true: 'line-through', false: '' },
  },
  defaultVariants: { size: 'md', struck: false },
});

const code = tv({
  base: 'truncate text-xs leading-none font-medium',
  variants: { size: { sm: 'hidden', md: '', lg: '' } },
  defaultVariants: { size: 'md' },
});

/** The short code without its tier digits: the data's "ARC1" is drawn as "ARC" beside a big "1". */
function shortCode(label: string): string {
  return label.replace(/\d+$/, '') || label;
}

/** Engineers show their catapult, monsters their race, everyone else their category. */
function glyphKeyFor(unit: UnitDef, group: UnitGroup): Category | Race | 'engineers' {
  if (group === 'engineers') return 'engineers';
  if (group === 'monsters' && unit.race) return unit.race;
  if (unit.category) return unit.category;
  return unit.race ?? 'engineers';
}

export interface UnitTileProps {
  unit: UnitDef;
  size: UnitTileSize;
  /** Defaults to `on`. `off` and `leftOut` read as unpressed. */
  state?: UnitTileState;
  /** Draws the accent ring; orthogonal to `state`. */
  isSelected?: boolean;
  /** Given, the tile becomes a toggle button carrying `aria-pressed`. */
  onPress?: () => void;
  /** Pointer-only: 500 ms with the pointer down and still. Never fires from the keyboard. */
  onLongPress?: () => void;
  /** Overrides the generated accessible name. */
  label?: string;
  className?: string;
}

export function UnitTile({
  unit,
  size,
  state = 'on',
  isSelected = false,
  onPress,
  onLongPress,
  label,
  className,
}: UnitTileProps) {
  const group = unitGroupOf(unit);
  const glyphKey = glyphKeyFor(unit, group);
  const Glyph = TILE_GLYPH[glyphKey];
  const name = label ?? `${unit.name}, tier ${unit.tier}, ${STATE_WORD[state]}`;

  const timer = useRef<number | null>(null);
  const longFired = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => cancel, [cancel]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      // Secondary buttons open menus; they are not a long press.
      if (!onLongPress || event.button > 0) return;
      longFired.current = false;
      cancel();
      timer.current = window.setTimeout(() => {
        timer.current = null;
        longFired.current = true;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    [cancel, onLongPress],
  );

  const handleClick = useCallback(() => {
    cancel();
    // A long press already did the work; the click that ends it is not a second press.
    if (longFired.current) {
      longFired.current = false;
      return;
    }
    onPress?.();
  }, [cancel, onPress]);

  const visual = (
    <>
      <span className={cn(box({ group, size, state, isSelected }))} aria-hidden="true">
        {size === 'lg' ? (
          <>
            <Glyph className={glyph({ size })} />
            <span className="flex flex-col items-center gap-0.5">
              <span className={tier({ size, struck: state === 'leftOut' })}>{unit.tier}</span>
              <span className={code({ size })}>{shortCode(unit.label)}</span>
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-base font-medium">{unit.name}</span>
              <span className="truncate text-sm">
                {GROUP_LABEL[group]} · tier {unit.tier}
              </span>
            </span>
          </>
        ) : size === 'md' ? (
          <>
            <span className="flex w-full min-w-0 items-center justify-center gap-0.5">
              <Glyph className={glyph({ size })} />
              <span className={code({ size })}>{shortCode(unit.label)}</span>
            </span>
            <span className={tier({ size, struck: state === 'leftOut' })}>{unit.tier}</span>
          </>
        ) : (
          <>
            <Glyph className={glyph({ size })} />
            <span className={tier({ size, struck: state === 'leftOut' })}>{unit.tier}</span>
          </>
        )}
      </span>
      {state === 'pinned' && <PinIcon aria-hidden="true" className="absolute top-0 right-0 h-3 w-3" />}
      <span className="sr-only">{name}</span>
    </>
  );

  if (!onPress && !onLongPress) {
    return <span className={cn(hit({ size }), className)}>{visual}</span>;
  }

  return (
    <button
      type="button"
      aria-pressed={state === 'on' || state === 'pinned'}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={cancel}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      className={cn(hit({ size }), ring, className)}
    >
      {visual}
    </button>
  );
}
