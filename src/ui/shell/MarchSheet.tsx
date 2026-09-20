/**
 * The March sheet (design rule 5 as resolved on 2026-09-13): below 1200 px the whole March section
 * lives in it — recap, army, counts, trade-off, details — at full height under the app bar and over
 * both bars, because a control outside a focus trap that the pointer can still reach is a trap that
 * does not hold. It carries its own Generate, so the answer and the action still travel together.
 *
 * Two things here are the sheet's own rather than Mantine's, and both are the owner's of
 * 2026-09-19 — *"on mobile, generate should open recap by default when finished. Also it would help
 * to be able to close it with a gesture like sliding down"*:
 *
 * - **a finished run opens it** — that half is the frame's, because the frame owns whether the
 *   sheet is open (`Shell.tsx`);
 * - **a downward swipe closes it.** M3 gives a bottom sheet a drag handle and the whole header
 *   round it is the target, 60 px tall and full width, rather than the 32 × 4 grabber alone. The
 *   handle is not a control of its own: it is drawn `aria-hidden` and the gesture is a second way
 *   to do what the Close button and `Escape` already do (design rule 24 — keyboard for every
 *   control, and no second control called "Close" in the tree to walk past).
 *
 * The compound `Drawer` rather than the one-element one, for one reason: the sheet has to be moved
 * while a finger is on it, and only `Drawer.Content` can be given a ref.
 */
import { Drawer } from '@mantine/core';
import { useDrag, useReducedMotion } from '@mantine/hooks';
import { useEffect, useRef } from 'react';

import { MarchSection } from '@/ui/sections/march';

import classes from './shell.module.css';

/** Past this much of a downward drag the sheet closes on release rather than springing back. */
const CLOSE_AT = 96;
/** …or under it, when the finger was still going down at this speed (px a ms) after this far. */
const FLING_SPEED = 0.5;
const FLING_AT = 24;
/** How long the spring back takes when it is neither. */
const SPRING_MS = 160;

export interface MarchSheetProps {
  opened: boolean;
  onClose: () => void;
}

export function MarchSheet({ opened, onClose }: MarchSheetProps) {
  const sheet = useRef<HTMLDivElement>(null);
  const stillness = useReducedMotion();

  /**
   * Move the sheet down by `to` pixels, or put it back where it belongs.
   *
   * Written on the CSS **`translate`** property rather than on `transform`, and that is not a
   * taste: Mantine's slide-up writes `transform` on this very element through React and transitions
   * it over 250 ms (`Transition`, `getTransitionStyles`), so a transform written here would be both
   * overwritten on the next render and 250 ms behind the finger. `translate` composes with it, is
   * not in that transition's property list, and is not a property React has an opinion about — so
   * the sheet follows the finger exactly, and the slide-down that closes it still starts from
   * wherever the finger left it.
   */
  const move = (to: number | null): void => {
    const node = sheet.current;
    if (node === null) return;
    if (to === null) node.style.removeProperty('translate');
    else node.style.translate = `0 ${String(to)}px`;
  };

  // Opening it again opens it whole: the swipe that closed it left its offset on the element.
  useEffect(() => {
    if (opened) move(null);
  }, [opened]);

  const { ref: gripRef, active: gripping } = useDrag<HTMLElement>(
    (state) => {
      const down = Math.max(0, state.movement[1]);
      if (!state.last) {
        move(down);
        return;
      }
      if (state.canceled) {
        move(null);
        return;
      }
      // Far enough, or still going down fast enough to mean it: a short flick dismisses a sheet
      // this tall, which is the whole point of the gesture on a 844 px phone.
      const flung = state.direction[1] > 0 && state.velocity[1] >= FLING_SPEED && down >= FLING_AT;
      if (down >= CLOSE_AT || flung) {
        onClose();
        return;
      }
      move(null);
      // The spring back is an animation rather than a transition, for the same reason `move` is not
      // a transform: this element's `transition-property` is Mantine's and says `transform`. jsdom
      // has no Web Animations, so the call is optional and under a test the sheet simply snaps.
      if (!stillness) {
        sheet.current?.animate?.([{ translate: `0 ${String(down)}px` }, { translate: '0 0' }], {
          duration: SPRING_MS,
          easing: 'ease-out',
        });
      }
    },
    // 6 px before the drag begins, so a tap on the Close button inside the header is a tap.
    { axis: 'y', threshold: 6 },
  );

  return (
    <Drawer.Root
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="calc(100dvh - var(--pyr-appbar-height))"
      radius={0}
      padding="lg"
      // Over both bars (250) and under a kit `Sheet` (320), so a unit sheet raised from the March
      // inside this one lands on top of it rather than behind it (`theme.ts`).
      zIndex={300}
    >
      <Drawer.Overlay />
      {/* The sheet is the March pane's own material, with 20 px on its two top corners alone
          (artboard `PhoneSheetA.dc.html`, `.sheet`); Mantine's `radius` would round all four. */}
      <Drawer.Content ref={sheet} className={classes.sheet}>
        <Drawer.Header ref={gripRef} className={classes.sheetGrip} data-dragging={gripping || undefined}>
          <span className={classes.grabber} aria-hidden />
          <Drawer.Title>March</Drawer.Title>
          <Drawer.CloseButton aria-label="Close" />
        </Drawer.Header>
        <Drawer.Body>
          <MarchSection />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
