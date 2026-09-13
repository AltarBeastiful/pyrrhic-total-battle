/**
 * One stack of the march, as direction A draws it (design plan §5.5; artboards `Main.dc.html` and
 * `PhoneSheetA.dc.html`): a two-line pill **coloured by tier** — the glyph, the short code and the
 * roman numeral on top, the count large underneath.
 *
 * Since the owner's correction of 2026-09-13 **the pills are the counts**: the table of
 * "falls 1st · 0 hits · 3 048 lost" lines under them is gone, because every figure in it was
 * already one press away in the unit sheet and the list was the longest thing in the March.
 *
 * So a pill has three gestures, and each one says which it is in words:
 *
 * - a press **copies this stack's count** — the one number a player retypes into the game;
 * - the mark in its corner, or a long press on the pill itself, opens the **unit sheet**, where the
 *   hits, the losses, the revive cost and the three actions about the type live (keep it in, leave
 *   it out, edit its count);
 * - in edit mode the count *is* a field, in place, and every keystroke re-sizes the march.
 *
 * Only marching stacks are drawn here (owner, 2026-09-13): what the search or the player left out
 * is a `LeftOutPill` in the small row under the pools, not a stack taking a stack's space.
 *
 * The pill never squeezes its content (owner, 2026-09-13): 62 px tall, 10 px of side padding, the
 * count `nowrap` at 19 px. A six-figure march therefore widens the pill and the grid wraps to fewer
 * per row instead of clipping a figure.
 */
import { ActionIcon, Box, NumberInput, Text, UnstyledButton } from '@mantine/core';
import { Info } from 'lucide-react';
import { useRef } from 'react';

import type { Category, Race, UnitDef } from '../../data/types';
import { Glyph } from './Glyph';
import type { GlyphKind } from './glyphs';
import classes from './domain.module.css';
import { count as formatCount } from './format';
import { romanTier, tierGround, tierInk, unitGroupOf } from './unitGroup';

export type StackPillState = 'on' | 'pinned';

/** The biggest count a hand edit may reach; past it the game would refuse the march anyway. */
const MAX_COUNT = 10_000_000;

/** How long a press has to be held before it reads as "open the sheet" rather than "copy". */
const LONG_PRESS_MS = 500;

/** Engineers show their catapult, monsters their race, everyone else their category. */
function glyphFor(unit: UnitDef): GlyphKind {
  const group = unitGroupOf(unit);
  if (group === 'engineers') return 'engineers';
  if (group === 'monsters' && unit.race) return unit.race satisfies Race as GlyphKind;
  if (unit.category) return unit.category satisfies Category as GlyphKind;
  return 'army';
}

/** The short code without its tier digits: "ARC1" is drawn as "ARC" beside a big "I". */
function shortCode(label: string): string {
  return label.replace(/\d+$/, '') || label;
}

export interface StackPillProps {
  unit: UnitDef;
  /** Units of this type in the march; `0` when it is left out. */
  count: number;
  state?: StackPillState;
  /** Edit mode: the count is a field in place, and the pill copies nothing. */
  editing?: boolean;
  /** A hand-typed count. */
  onCount?: (count: number) => void;
  /** Copy this stack's count. */
  onCopy?: () => void;
  /** The corner mark, and a long press on the pill. */
  onDetails: () => void;
}

export function StackPill({
  unit,
  count,
  state = 'on',
  editing = false,
  onCount,
  onCopy,
  onDetails,
}: StackPillProps) {
  const ink = tierInk(unit.tier);
  const roman = romanTier(unit.tier) || String(unit.tier);
  const figure = formatCount(count);

  // A long press opens the sheet; the release that ends it must not also copy.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const held = useRef(false);

  const startHold = (): void => {
    held.current = false;
    timer.current = globalThis.setTimeout(() => {
      held.current = true;
      onDetails();
    }, LONG_PRESS_MS);
  };
  const endHold = (): void => {
    if (timer.current !== undefined) globalThis.clearTimeout(timer.current);
    timer.current = undefined;
  };

  const kept = state === 'pinned' ? ', kept in' : '';
  const name = `Copy ${figure}, ${unit.name}${kept}`;

  const label = (
    <span className={classes.pillTop}>
      <span className={classes.pillGlyph}>
        <Glyph kind={glyphFor(unit)} scale={0.75} />
      </span>
      <Text span fz="0.75rem" fw={600} c={ink}>
        {`${shortCode(unit.label)} ${roman}`}
      </Text>
      {state === 'pinned' && <Glyph kind="pin" scale={0.7} />}
    </span>
  );

  return (
    <Box
      className={classes.pill}
      // The short code and the count, as data: the browser suite reads a march off these rather
      // than out of the pill's drawing.
      data-stack={unit.label}
      data-count={String(count)}
      style={{ borderColor: tierInk(unit.tier), background: tierGround(unit.tier) }}
    >
      {editing ? (
        <div className={classes.pillBody}>
          {label}
          <NumberInput
            size="xs"
            w="100%"
            aria-label={`${unit.name} count`}
            value={count}
            min={0}
            max={MAX_COUNT}
            styles={{ input: { textAlign: 'center', fontWeight: 700 } }}
            onChange={(next) => {
              if (onCount === undefined) return;
              const parsed = typeof next === 'number' ? next : Number(String(next).replace(/[^\d]/g, ''));
              onCount(Number.isNaN(parsed) ? 0 : parsed);
            }}
          />
        </div>
      ) : (
        <UnstyledButton
          className={classes.pillBody}
          aria-label={name}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onClick={() => {
            endHold();
            if (held.current) {
              held.current = false;
              return;
            }
            onCopy?.();
          }}
        >
          {label}
          <Text span fz="1.1875rem" lh={1} fw={700} className={classes.pillCount} c={ink}>
            {figure}
          </Text>
        </UnstyledButton>
      )}
      <ActionIcon
        className={classes.pillInfo}
        variant="subtle"
        color="gray"
        size={16}
        aria-label={`Details: ${unit.name}`}
        onClick={onDetails}
      >
        <Info size={11} aria-hidden />
      </ActionIcon>
    </Box>
  );
}

/**
 * A type that is *not* in this march (owner, 2026-09-13): TotalStack's "removed from formation"
 * row, in our words. 26 px, outlined, muted — the glyph, the code and the tier, then a "+", because
 * what a press does is put it back. Deliberately smaller than a stack pill: it is a footnote to the
 * march, not part of it.
 */
export function LeftOutPill({ unit, onPutBack }: { unit: UnitDef; onPutBack: () => void }) {
  const roman = romanTier(unit.tier) || String(unit.tier);
  return (
    <UnstyledButton
      className={classes.leftOutPill}
      aria-label={`${unit.name}, tier ${String(unit.tier)}, left out — keep in march`}
      onClick={onPutBack}
    >
      <Glyph kind={glyphFor(unit)} scale={0.7} />
      <Text span fz="0.75rem" fw={600} c="dimmed">
        {`${shortCode(unit.label)} ${roman}`}
      </Text>
      {/* The one mark that says what the press does; brass, because brass means "you can act on
          this" (docs/design.md §1, artboard `.lo b`). */}
      <Text span fz="0.75rem" fw={700} c="var(--mantine-color-brass-filled)" aria-hidden>
        +
      </Text>
    </UnstyledButton>
  );
}
