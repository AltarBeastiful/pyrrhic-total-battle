/**
 * One stack of the march, as direction A draws it (design plan §5.5; artboards `Main.dc.html` and
 * `PhoneSheetA.dc.html`): a two-line pill **coloured by tier** — the glyph, the short code and the
 * roman numeral on top, the count large underneath.
 *
 * Since the owner's correction of 2026-09-13 **the pills are the counts**: the table of
 * "falls 1st · 0 hits · 3 048 lost" lines under them is gone, because every figure in it was
 * already one press away in the unit sheet and the list was the longest thing in the March.
 *
 * **The primary action is direct** (owner, 2026-09-13, second correction): a press on the pill
 * **leaves that type out of the march**, which regenerates and moves it to the "Left out" row where
 * a press puts it back. The pair is one toggle written across two rows, so the pill carries
 * `aria-pressed` as well as a name that says what the press does.
 *
 * Tap-to-copy is gone with the long press that used to fight it: one gesture, one meaning. The count
 * is still selectable text, and "Copy all counts" under the pools copies the whole march.
 *
 * So a pill has two targets, each its own element:
 *
 * - the body — a press leaves the type out;
 * - the **22 px mark in the top-right corner**, a sibling of the body rather than a button inside a
 *   button, which opens the **unit sheet** (the hits, the losses, the revive cost, keep it in, edit
 *   its count). It sits inside the pill's own corner, not over its edge, and the top line reserves
 *   17 px — the 22 px mark, 3 px in from the border, less the 8 px of padding the body already
 *   keeps — so the code and the tier never run under it.
 *
 * In edit mode the count *is* a field, in place, every keystroke re-sizes the march — and the corner
 * mark stands down, because a button over the top-right of a 30 px field is a press the player aimed
 * at the field.
 *
 * Only marching stacks are drawn here (owner, 2026-09-13): what the search or the player left out
 * is a `LeftOutPill` in the small row under the pools, not a stack taking a stack's space.
 *
 * The pill never squeezes its content: 56 px tall, 6 px over and 8 px either side (owner,
 * 2026-09-13 — the old 62 × 10 read as padded like a billboard, design rule 19), the count `nowrap`
 * at 19 px. A six-figure march therefore widens the pill and the grid wraps to fewer per row
 * instead of clipping a figure.
 *
 * The top line is **glyph · code · tier**, three elements and not one string, and only the *code*
 * may be cut. It used to be `"ARC III"` in one span with an ellipsis at its end, so a track one
 * pixel too narrow drew "ARC I" — a different unit, and a wrong count to copy into the game. The
 * tier is `flex: 0 0 auto`; what an impossible track costs is a letter of a four-letter mercenary
 * code ("HHA… VII"), never the numeral that says which unit this is.
 */
import { ActionIcon, Box, NumberInput, Text, UnstyledButton } from '@mantine/core';
import { Info } from 'lucide-react';

import type { Category, Race, UnitDef } from '../../data/types';
import { Glyph } from './Glyph';
import type { GlyphKind } from './glyphs';
import classes from './domain.module.css';
import { count as formatCount } from './format';
import { romanTier, tierGround, tierInk, unitGroupOf } from './unitGroup';

export type StackPillState = 'on' | 'pinned';

/** The biggest count a hand edit may reach; past it the game would refuse the march anyway. */
const MAX_COUNT = 10_000_000;

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
  /** Edit mode: the count is a field in place, and the pill is not a button. */
  editing?: boolean;
  /** A hand-typed count. */
  onCount?: (count: number) => void;
  /** A press on the pill: take this type out of the march. */
  onLeaveOut?: () => void;
  /** The 22 px mark in the corner: open the unit sheet. */
  onDetails: () => void;
}

export function StackPill({
  unit,
  count,
  state = 'on',
  editing = false,
  onCount,
  onLeaveOut,
  onDetails,
}: StackPillProps) {
  const ink = tierInk(unit.tier);
  const roman = romanTier(unit.tier) || String(unit.tier);
  const figure = formatCount(count);

  const kept = state === 'pinned' ? ', kept in' : '';
  // What the press does, in the words the row under the pools answers with ("put back").
  const name = `${unit.name}, ${figure}${kept} — leave out`;

  // The code and the tier are two spans, not one string (owner, 2026-09-13). One string ellipsised
  // from its end, so a narrow track drew "ARC III" as "ARC I" — a different unit and a wrong count
  // to copy into the game. Only the code may be cut now; the tier never shrinks.
  const label = (
    <span className={classes.pillTop}>
      <Glyph kind={glyphFor(unit)} scale={0.85} />
      <Text span fz="0.75rem" fw={600} c={ink} className={classes.pillLabel}>
        {shortCode(unit.label)}
      </Text>
      <Text span fz="0.75rem" fw={600} c={ink} className={classes.pillTier}>
        {roman}
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
          // On, and a press turns it off — the "Left out" row holds the other half of the toggle.
          aria-pressed
          onClick={onLeaveOut}
        >
          {label}
          <Text span fz="1.1875rem" lh={1} fw={700} className={classes.pillCount} c={ink}>
            {figure}
          </Text>
        </UnstyledButton>
      )}
      {!editing && (
        <ActionIcon
          className={classes.pillInfo}
          variant="subtle"
          color="gray"
          size={22}
          aria-label={`Details: ${unit.name}`}
          onClick={onDetails}
        >
          <Info size={16} aria-hidden />
        </ActionIcon>
      )}
    </Box>
  );
}

/** Who left this type out. The word is part of the pill's name, and `data-left-out` styles it. */
export type LeftOutReason = 'you' | 'search';

const LEFT_OUT_WORDS: Record<LeftOutReason, string> = {
  you: 'left out by you',
  search: 'left out by the search',
};

/**
 * A type that is *not* in this march (owner, 2026-09-13): TotalStack's "removed from formation"
 * row, in our words. 26 px, outlined, muted — the glyph, the code and the tier, then a "+", because
 * what a press does is put it back. Deliberately smaller than a stack pill: it is a footnote to the
 * march, not part of it.
 *
 * It is the off half of the pill's toggle, so it says so: `aria-pressed={false}` and a name that
 * names the press, "Archer I, left out by you — put back".
 *
 * The name carries the *reason* too, because a press means two different things: a type the player
 * took out is simply let back in, a type the search dropped is pinned so it cannot be dropped again.
 * The same reason is on the element as `data-left-out="you" | "search"`, which is the hook the two
 * kinds are told apart by on screen.
 */
export function LeftOutPill({
  unit,
  reason = 'search',
  onPutBack,
}: {
  unit: UnitDef;
  reason?: LeftOutReason;
  onPutBack: () => void;
}) {
  const roman = romanTier(unit.tier) || String(unit.tier);
  return (
    <UnstyledButton
      className={classes.leftOutPill}
      data-left-out={reason}
      aria-label={`${unit.name}, ${LEFT_OUT_WORDS[reason]} — put back`}
      aria-pressed={false}
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
