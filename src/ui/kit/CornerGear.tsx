/**
 * The gear that overlaps the top-right corner of a chip (plan §3; investigation 0007's best find).
 * `Indicator` positions it and `ActionIcon` is the button, which matters: the gear opens an editor
 * and must never be the thing that toggles the chip under it, so it is a sibling target with its own
 * name rather than a mark inside the chip's own label.
 */
import { ActionIcon, Indicator, Popover, VisuallyHidden } from '@mantine/core';
import { Settings } from 'lucide-react';
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

import classes from './kit.module.css';
import { isCommitEnter } from './enterCommits';
import { useOpenEditor } from './openEditors';

export interface CornerGearProps {
  /** The gear's own accessible name: "Set Aydae's level". */
  label: string;
  onPress: () => void;
  /** The thing the gear sits on. */
  children: ReactNode;
  /** Filled while the thing under it is chosen, so the mark keeps up with the chip. */
  active?: boolean;
  size?: number;
  /**
   * A short figure worn in place of the gear: a captain's level (owner, 2026-10-02, proposal G of the
   * "Captain Level Badges" artifact). The badge is then as wide as its digits, and the chip under it ends
   * 7 px after its last mark instead of keeping the gear's 14 px strip. Its size, its place on the corner
   * and the gap after it are the gear's own (`kit.module.css`, `.cornerGear`), so the two read as one mark.
   */
  figure?: string;
  /** What the mark stands for, read after the button's name: "Level 60, 3 stars". */
  description?: string;
  /**
   * The editor the gear opens. Given, `CornerGear` owns the popover and anchors it on the gear's own
   * button — which is the only correct anchor: `Popover.Target` stamps `aria-expanded` onto whatever
   * it wraps, and that attribute is invalid on the `<span>` a chip or a pill renders (0007's
   * `aria-allowed-attr`, 23 nodes). Without it the gear is a plain button and the caller decides.
   */
  dropdown?: ReactNode;
  opened?: boolean;
  onOpenedChange?: (opened: boolean) => void;
}

export function CornerGear({
  label,
  onPress,
  children,
  active = false,
  size = 20,
  figure,
  description,
  dropdown,
  opened,
  onOpenedChange,
}: CornerGearProps) {
  // The editor behind the gear is a setup editor like a sheet is, so `Ctrl`/`⌘ + Enter` shuts it
  // before it generates (`openEditors.ts`). Only when the caller drives it: left uncontrolled, the
  // popover's open state is Mantine's own and nothing here can put it down.
  useOpenEditor(opened === true && onOpenedChange !== undefined, () => {
    onOpenedChange?.(false);
  });

  const descriptionId = useId();
  const gearRef = useRef<HTMLButtonElement>(null);
  // Whether the editor was opened with a pointer or from the keyboard: it decides whether the gear wears
  // its focus ring once the editor shuts.
  const openedByPointer = useRef(false);

  // Shutting the editor hands focus back to the gear, so a keyboard player is where they were. Mantine
  // does that on Escape too, but from inside a key press, which the browser counts as keyboard focus: a
  // gear opened with a click came back wearing the brass ring (owner, 2026-10-02: "we shouldn't have a
  // yellow circle around the badge… clicking on a badge and typing esc"). Here the ring shows only when
  // the editor was opened from the keyboard: a gear opened with a pointer gets focus back marked
  // `data-pointer-focus`, which hides the ring (`kit.module.css`) until the next key or until focus
  // leaves. Chromium ignores `focus({ focusVisible: false })`, so the mark is ours. After the dropdown
  // is gone, and only if focus went nowhere: a click outside that lands on something focusable keeps it.
  const close = (): void => {
    onOpenedChange?.(false);
    requestAnimationFrame(() => {
      const gearButton = gearRef.current;
      const current = document.activeElement;
      if (gearButton === null || (current !== null && current !== document.body)) return;
      if (openedByPointer.current) gearButton.dataset.pointerFocus = '';
      gearButton.focus();
    });
  };
  const forgetPointerFocus = (): void => {
    if (gearRef.current !== null) delete gearRef.current.dataset.pointerFocus;
  };
  // Two widths, not a measure: up to two digits the badge is its own height, three take 28 px. How far
  // it reaches past the chip is then known, and so is the gap the next chip keeps (`kit.module.css`).
  const digits = figure === undefined ? undefined : figure.length > 2 ? '3' : '2';

  const gear = (
    <ActionIcon
      size={size}
      radius="xl"
      variant={active ? 'filled' : 'default'}
      aria-label={label}
      {...(description === undefined ? {} : { 'aria-describedby': descriptionId })}
      className={figure === undefined ? undefined : classes.figure}
      data-digits={digits}
      ref={gearRef}
      onPointerDown={() => {
        openedByPointer.current = true;
      }}
      onKeyDown={() => {
        openedByPointer.current = false;
        forgetPointerFocus();
      }}
      onBlur={forgetPointerFocus}
      onClick={onPress}
    >
      {figure ?? <Settings size={Math.round(size * 0.6)} aria-hidden />}
    </ActionIcon>
  );

  const badge = (
    <Indicator
      className={figure === undefined ? classes.cornerGear : `${classes.cornerGear} ${classes.cornerFigure}`}
      data-digits={digits}
      position="top-end"
      // Centred on the corner itself, as TotalStack's gear is (investigation 0006: "overlapping the
      // top-right corner"). It used to sit 2 px in, which is 2 px more of the chip's last letters
      // under it and 2 px more the chip had to reserve for it (`kit.module.css`, `.cornerGear`).
      offset={0}
      size={size}
      color="transparent"
      label={dropdown === undefined ? gear : <Popover.Target>{gear}</Popover.Target>}
    >
      {children}
      {description !== undefined && <VisuallyHidden id={descriptionId}>{description}</VisuallyHidden>}
    </Indicator>
  );

  if (dropdown === undefined) return badge;

  return (
    <Popover
      position="bottom-end"
      trapFocus
      // Escape is ours when the caller drives the popover (`close` above); left uncontrolled, Mantine's.
      closeOnEscape={onOpenedChange === undefined}
      {...(opened === undefined ? {} : { opened })}
      {...(onOpenedChange === undefined ? {} : { onChange: onOpenedChange })}
    >
      {badge}
      <Popover.Dropdown
        // Enter in the editor's field closes it (owner, 2026-10-02; `enterCommits.ts`): the figure is
        // already written, and Enter is how a typed number is finished — the cap popover's rule too.
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (onOpenedChange === undefined) return;
          if (event.key !== 'Escape' && !isCommitEnter(event)) return;
          event.preventDefault();
          close();
        }}
      >
        {dropdown}
      </Popover.Dropdown>
    </Popover>
  );
}
