/**
 * The plan's bar, and the tip that says which plan is under the pointer (S-59).
 *
 * The owner, 2026-09-16: *"slider tooltip is hard to grasp. it represent the current selected one, and the
 * name is unclear. Would be best to have tooltip be the one below the cursor, with animation on hover so we
 * understand."* Both halves of that are here. Mantine's own floating label goes (`label={null}`) — it hung
 * off the **thumb**, so every question about the bar was answered by the plan already on screen, exactly
 * when the player was asking about another one — and the tip is ours: it names the plan **under the
 * pointer**, it slides between stops and fades in and out, and it is clamped inside the pane at both ends.
 *
 * **The geometry is measured, not assumed** (design rule 23 counts this CSS, so it has to be right). A
 * stock `Slider` is three boxes: the root, 16 px tall and carrying `padding-inline: var(--slider-size)`;
 * the **track**, inset 8 px from the root at each end; and the grey bar, which the track paints through a
 * `::before` that reaches back out to the root's own edges (`@mantine/core/styles.css`, `.m_dd36362e` /
 * `.m_c9ade57f`). The thumb and the marks are positioned in **percentages of the track**, so a stop is
 * `track.left + track.width × i/(n−1)` and aiming at the root would put the last stop 8 px to the right of
 * where it is drawn. Measured in a browser at 1400×900: root 462 px, track 446 px, 8 px of padding — the
 * same 8 px, and the same conclusion.
 *
 * **Nothing here is measured in an effect.** The bar can only move when the pointer or the keyboard moves
 * it, so the box is read in the handler that receives that move and never on a render nobody asked for;
 * one `resize` listener covers the odd window that changes under a pointer at rest.
 *
 * Nothing here computes anything: the engine returns the picks and the store holds which one is read.
 */
import { Box, Button, Group, Slider, Text } from '@mantine/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import type { PlanRow } from '@/engine/plan';

import { compact } from './format';
import { BAR_ENDS, bestForWords, planWords, sequenceWords } from './picks';
import classes from './march.module.css';

/** Everything the mapping needs, in the two coordinate spaces it uses — and they are not the same one. */
interface Frame {
  /** The track's left edge in **client** coordinates: what a pointer event's `clientX` is measured from. */
  left: number;
  /** How far a thumb travels: the track's width, never the root's. */
  span: number;
  /** The track's left edge in the **band's** coordinates, where the tip is drawn. */
  origin: number;
  /** The band's width, which is what the tip is clamped inside. */
  band: number;
}

/** Whether two measurements are the same box, so a handler that found nothing new does not re-render. */
function sameFrame(one: Frame, other: Frame): boolean {
  return (
    one.left === other.left &&
    one.span === other.span &&
    one.origin === other.origin &&
    one.band === other.band
  );
}

export interface PlanBarProps {
  /**
   * Every plan the bar offers, thriftiest first — the engine's order, which is the bar's own axis: the
   * hired units a march burns for good. Five stops at most.
   */
  rows: PlanRow[];
  /** Which of them the March is showing. */
  position: number;
  /** The row the pointer is on, or `null` when it is away from the bar. Held by the block, so the trade
   * below can light the same row: the bar and the table are one thing (0020 §D-2). */
  hovered: number | null;
  onHover: (index: number | null) => void;
  /** Read a plan without another search. */
  onSelect: (index: number) => void;
  /** Where the sweet spot sits among `rows`, or `null` when the engine weighed no two resources. */
  sweet: number | null;
}

/** The nearest stop to a distance along the track, and never off either end of it. */
function stopAt(fraction: number, count: number): number {
  const last = Math.max(0, count - 1);
  return Math.min(last, Math.max(0, Math.round(fraction * last)));
}

/**
 * Where the tip's box sits: centred on its stop, then pulled back inside the band at either end.
 *
 * The element is `left: 0` inside the band, so its **left edge starts at the band's own left** and a
 * transform of `t` puts that edge at `t`. Centring on the stop is therefore `t = x − w/2`, and keeping the
 * box inside the band is `0 ≤ t ≤ band − w` — the two bounds below, in that order.
 *
 * The clamp is CSS's, because the half-width it needs is the tip's own and only the browser knows it — a
 * `translateX` percentage *is* the element's own width — and because a name's length is the engine's, so we
 * could not hold it anyway. Written as a transform rather than a `left` so the move between two stops is one
 * CSS transition (`march.module.css`, `.tip`), which is the whole point of the tip.
 */
function tipTransform(x: number, band: number): string {
  return `translateX(clamp(0px, calc(${x.toFixed(1)}px - 50%), calc(${band.toFixed(1)}px - 100%)))`;
}

export function PlanBar({ rows, position, hovered, onHover, onSelect, sweet }: PlanBarProps) {
  const band = useRef<HTMLDivElement>(null);
  const slider = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  /**
   * Which plan the tip names, and whether it is up. Two pieces of state rather than one because they part
   * company on the way out: taking the pointer off the bar puts the tip down but leaves it *saying* the last
   * plan, which is what gives the fade-out something to fade (`.tip`, `march.module.css`).
   */
  const [tipAt, setTipAt] = useState(0);
  const [up, setUp] = useState(false);
  // A fresh search can carry fewer plans than the bar the pointer last left (five at most, and two stops
  // that are one plan collapse to one), so the remembered stop is clamped: a tip pointing off the end of the
  // track is worse than a stale one.
  const row = rows[Math.min(tipAt, Math.max(0, rows.length - 1))];
  /** Which of the two efficiencies the tip's stop is the bar's best at, or `null` (`./picks`). */
  const efficiency = row === undefined ? null : bestForWords(row);
  /**
   * The line a stop needs when "N marches of the row above" would not be true of it: the `all-in`, which is a
   * **sequence** rather than a march repeated, and any repeated stop the horizon outruns, which plays the
   * marches left over on troops alone (`./picks`, `PlanTotals.sequence` and `.tail`). `null` on every stop
   * that simply repeats its march, so the tip keeps its height there.
   */
  const sequence = row === undefined ? null : sequenceWords(row);

  /**
   * The track's box. Read live by the handler rather than kept, so a bar that moved under the pointer — the
   * March sheet opening, the pane crossing a breakpoint — aims at where the stops are *now*. Two
   * `getBoundingClientRect`s.
   */
  const read = useCallback((): Frame | null => {
    const element = band.current;
    const track: Element | null = slider.current?.querySelector('.mantine-Slider-track') ?? null;
    if (element === null || track === null) return null;
    const box = element.getBoundingClientRect();
    const span = track.getBoundingClientRect();
    // No layout to read: jsdom measures everything as 0, and so does a bar inside a closed fold.
    if (!(span.width > 0)) return null;
    return { left: span.left, span: span.width, origin: span.left - box.left, band: box.width };
  }, []);

  /** Put the tip up over one stop, from a measurement the caller already has or one taken here. */
  const raise = useCallback(
    (index: number, measured?: Frame | null): void => {
      const next = measured === undefined ? read() : measured;
      if (next !== null) {
        setFrame((previous) => (previous !== null && sameFrame(previous, next) ? previous : next));
      }
      setTipAt(index);
      setUp(true);
    },
    [read],
  );

  /** Keep the measurement current for a pointer that is resting: the window is the only thing that moves it. */
  useEffect(() => {
    const onResize = (): void => {
      const next = read();
      if (next === null) return;
      setFrame((previous) => (previous !== null && sameFrame(previous, next) ? previous : next));
    };
    globalThis.addEventListener('resize', onResize);
    return () => {
      globalThis.removeEventListener('resize', onResize);
    };
  }, [read]);

  /**
   * The stop a pointer is over, or `null` when there is no layout to read it off (jsdom, a bar inside a
   * closed fold). Shared by the move that raises the tip and the press that reads a plan, so the two can
   * never disagree about which stop a finger is on.
   */
  const stopUnder = (clientX: number): { index: number; live: Frame } | null => {
    const live = read();
    // Nothing to measure: jsdom answers every box as zero, and so does a bar the browser has not laid out
    // yet. There is then no answer to "which stop is under the pointer", and naming one would light a row
    // in the trade below that the pointer is not on — so the bar says nothing instead of guessing.
    if (live === null) return null;
    // `clientX` is in client coordinates and `origin` is in the band's own; mixing the two is a bug that
    // only shows on a bar that is not at the page's left edge, which is every bar this app draws.
    return { index: stopAt((clientX - live.left) / live.span, rows.length), live };
  };

  /**
   * **The band is the target, all 58 px of it** (design rule 19). Its own comment in `march.module.css`
   * has claimed that since the bar was built, and it was not true: Mantine's slider root is 16 px tall and
   * owns the only press that moves the thumb, so a click 14 px under the track — inside the air this band
   * adds so the sweet-spot mark clears the two words below it — landed on the band and did nothing at all.
   * It reads the nearest stop now, the same arithmetic the tip uses, and hands the focus to the thumb so
   * the arrow keys carry on from where the finger left off.
   *
   * Only a press on the band **itself**: the slider, the two words under it and "Back to the sweet spot"
   * are all children with presses of their own, and a parent that answered theirs too would move the bar
   * whenever a player reached for the button that puts it back.
   */
  const press = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.target !== band.current) return;
    const under = stopUnder(event.clientX);
    if (under === null) return;
    slider.current?.querySelector<HTMLElement>('.mantine-Slider-thumb')?.focus();
    onSelect(under.index);
    raise(under.index, under.live);
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const under = stopUnder(event.clientX);
    if (under === null) return;
    onHover(under.index);
    raise(under.index, under.live);
  };

  return (
    <Box
      ref={band}
      className={classes.barBand}
      onPointerDown={press}
      onPointerMove={move}
      onPointerLeave={() => {
        onHover(null);
        setUp(false);
      }}
    >
      <Slider
        ref={slider}
        min={0}
        max={rows.length - 1}
        step={1}
        value={position}
        onChange={(value) => {
          onSelect(value);
          // The arrow keys and a press on the track both land here, and both are a pointer of their own:
          // a keyboard user has no hover, so the tip follows the value instead (design rule 24).
          raise(value);
        }}
        // Mantine's own label hung off the thumb and said the plan already on screen; `null` takes it off
        // the screen without taking the thumb's name or its value text with it (they are the accessible
        // half, and the tip below is `aria-hidden`).
        label={null}
        thumbLabel="Where on the trade to read the plan"
        thumbValueText={(value) => {
          const shown = rows[Math.round(value)];
          if (shown === undefined) return '';
          // The tip is `aria-hidden` decoration, so everything it draws has to be said here as well or it
          // is said to a pointer only (design rule 24). The efficiency is the line the owner asked for on
          // 2026-09-17 and it rides along in the same words as the note on the row below (`./picks`).
          const best = bestForWords(shown);
          const run = sequenceWords(shown);
          return `${planWords(shown)}, ${compact(shown.repeat.damage)} worst opening a march${
            best === null ? '' : `, ${best}`
          }${run === null ? '' : `, ${run}`}`;
        }}
        // Clicking the bar focuses its root (Mantine's own `onMouseDownCapture`), so this is the keyboard's
        // way in as well as the mouse's — and it is the value's own stop, because a focus has no pointer.
        onFocus={() => {
          raise(position);
        }}
        onBlur={() => {
          // Not while a pointer is still on the bar: a blur under a hover would take away the answer the
          // pointer is asking for.
          if (hovered === null) setUp(false);
        }}
        marks={rows.map((_row, index) =>
          index === sweet
            ? {
                value: index,
                label: (
                  // Mantine centres a mark's label on its own mark, so a label on the **end** marks hangs
                  // half a word off the track and is clipped by the pane (measured at 390 px, where the band
                  // leaves the sweet spot as the cheapest plan — stop 0). Nudging the label back inside by
                  // half its own width is what keeps the marker on the bar when the sweet spot is an end; a
                  // missing marker would be the alternative, and the owner asked for a marker.
                  <Text
                    span
                    size="xs"
                    fw={600}
                    c="var(--mantine-color-brass-filled)"
                    style={{
                      display: 'inline-block',
                      transform:
                        sweet === 0
                          ? 'translateX(50%)'
                          : sweet === rows.length - 1
                            ? 'translateX(-50%)'
                            : undefined,
                    }}
                  >
                    Sweet spot
                  </Text>
                ),
              }
            : { value: index },
        )}
      />

      {/* The tip: the plan under the pointer, above the bar it points at. `aria-hidden`, because it is the
          same answer twice — the trade below prints it as a table, and `aria-valuetext` above carries the
          value for a screen reader (design rule 24). Decoration, so it never takes a click either. */}
      {frame !== null && row !== undefined && (
        <Box
          className={classes.tip}
          data-shown={up ? 'true' : undefined}
          style={{
            transform: tipTransform(
              frame.origin + frame.span * (tipAt / Math.max(1, rows.length - 1)),
              frame.band,
            ),
          }}
          aria-hidden="true"
        >
          <Text size="sm" fw={600}>
            {planWords(row)}
          </Text>
          {/* **The efficiency this stop is the bar's best at**, where the trade puts it: under the name
              (`PlanTrade.tsx`, `PlanRow.bestFor`). The bar and the table are one thing (0020 §D-2), so a
              stop that says "best a silver" on the row below says it here too, in the same words — the
              owner's 2026-09-17 reason for the note existing at all is that the two efficiencies are what
              the bar balances, and a player reading the bar is exactly who is asking. */}
          {efficiency !== null && (
            <Text size="xs" opacity={0.75}>
              {efficiency}
            </Text>
          )}
          {/* Two lines and no third. It closed with "the sweet spot" over a tip already naming the plan
              **Sweet spot**, above a bar whose mark says "Sweet spot" in the same brass — the same words
              three times in one glance (design rule 5, the owner's own cut of 2026-09-16). */}
          <Text size="xs" opacity={0.75}>
            {/* **The plan's damage is its worst opening**, and it says so (S-94, 2026-09-19): the figure
              is the enemy-first journal's, the same number and the same words the recap prints under
              "Worst opening" when this stop is on screen (design rules 5 and 26 — one name a thing,
              through the whole flow). */}
            {`${compact(row.repeat.damage)} worst opening a march`}
          </Text>
          {/* **What the march costs in gold** — the hired stacks' own price, which silver never pays
              (`PlanRepeat.gold`). The bar is ordered by the hired stock, so "what does sparing it cost me"
              is the question every stop is asking. It is the figure the trade has no room for — see
              `PlanTrade.tsx` on the seventh column — so the tip is where it is read. */}
          <Text size="xs" opacity={0.75}>
            {`${compact(row.repeat.gold)} gold a march`}
          </Text>
          {/* **A stop the figures above do not describe four times over says so** (S-74, widened in S-89).
              Most stops are the march above repeated, so "6.9M worst opening a march" names the campaign;
              `all-in` shelters every mercenary it can on the first march and then marches on what the stock
              has left, and a repeated stop the horizon outruns marches on troops alone once its stock is
              spent — for both, the three figures above are one march's and multiplying them out would be
              false. One line, in the words the fold's own summary uses (`sequenceWords`, `./picks`). */}
          {sequence !== null && (
            <Text size="xs" opacity={0.75}>
              {sequence}
            </Text>
          )}
        </Box>
      )}

      {/* The two ends are named **under** the bar, not as mark labels: Mantine centres a mark's label on its
          own mark, so a label naming an end would hang half a word off the track — the same clipping the
          marker above is nudged out of, done in words instead. */}
      <Group justify="space-between" align="center" wrap="nowrap">
        <Text size="xs" c="dimmed">
          {BAR_ENDS.low}
        </Text>
        {/* The way back to the marker above, in words: the mark says where the sweet spot is, this says how
            to get there, and it is only drawn while the bar is somewhere else. */}
        {sweet !== null && position !== sweet && (
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={() => {
              onSelect(sweet);
            }}
          >
            Back to the sweet spot
          </Button>
        )}
        <Text size="xs" c="dimmed">
          {BAR_ENDS.high}
        </Text>
      </Group>
    </Box>
  );
}
